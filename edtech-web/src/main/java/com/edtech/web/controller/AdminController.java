package com.edtech.web.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.edtech.model.entity.*;
import com.edtech.model.mapper.*;
import com.edtech.web.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 管理员后台控制器
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final UserMapper userMapper;
    private final QuestionMapper questionMapper;
    private final KnowledgePointMapper knowledgePointMapper;
    private final KnowledgeStateMapper knowledgeStateMapper;
    private final UserPointsMapper userPointsMapper;
    private final StudentExerciseLogMapper studentExerciseLogMapper;
    private final MistakeBookMapper mistakeBookMapper;
    private final KnowledgePrerequisiteMapper knowledgePrerequisiteMapper;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_RAW_PASSWORD = "admin123";

    /**
     * 管理员登录
     */
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        log.info("管理员登录尝试: {}", username);

        Map<String, Object> response = new HashMap<>();

        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
                .eq(User::getRole, "ADMIN"));

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            response.put("success", false);
            response.put("message", "用户名或密码错误");
            return response;
        }

        String token = tokenProvider.generateToken(user.getId(), user.getUsername(), "ADMIN", 1L);
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("username", user.getUsername());
        userInfo.put("role", "ADMIN");

        response.put("success", true);
        response.put("token", token);
        response.put("user", userInfo);
        log.info("管理员登录成功: {}", username);
        return response;
    }

    /**
     * 仪表盘数据
     */
    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Long totalUsers = userMapper.selectCount(null);
            Long totalQuestions = questionMapper.selectCount(null);

            LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
            List<StudentExerciseLog> lastDayLogs = studentExerciseLogMapper.selectList(
                    new LambdaQueryWrapper<StudentExerciseLog>()
                            .ge(StudentExerciseLog::getSubmitTime, yesterday));
            int dailyActive = (int) lastDayLogs.stream()
                    .map(StudentExerciseLog::getStudentId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();

            Long aiGeneratedQuestions = questionMapper.selectCount(
                    new LambdaQueryWrapper<Question>()
                            .eq(Question::getType, 99));

            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            Long newUsersLast30 = userMapper.selectCount(
                    new LambdaQueryWrapper<User>()
                            .ge(User::getCreatedAt, thirtyDaysAgo));
            Long newQuestionsLast30 = questionMapper.selectCount(
                    new LambdaQueryWrapper<Question>()
                            .ge(Question::getCreatedAt, thirtyDaysAgo));

            double userGrowth = (totalUsers != null && totalUsers > 0 && newUsersLast30 != null)
                    ? newUsersLast30 * 100.0 / totalUsers
                    : 0.0;
            double questionGrowth = (totalQuestions != null && totalQuestions > 0 && newQuestionsLast30 != null)
                    ? newQuestionsLast30 * 100.0 / totalQuestions
                    : 0.0;

            Map<String, Object> data = new HashMap<>();
            data.put("totalUsers", totalUsers != null ? totalUsers : 0);
            data.put("dailyActive", dailyActive);
            data.put("totalQuestions", totalQuestions != null ? totalQuestions : 0);
            data.put("aiCalls", aiGeneratedQuestions != null ? aiGeneratedQuestions : 0);
            data.put("userGrowth", Math.round(userGrowth * 10.0) / 10.0);
            data.put("questionGrowth", Math.round(questionGrowth * 10.0) / 10.0);

            response.put("success", true);
            response.put("data", data);
        } catch (Exception e) {
            log.error("获取仪表盘数据失败", e);
            Map<String, Object> data = new HashMap<>();
            data.put("totalUsers", 0);
            data.put("dailyActive", 0);
            data.put("totalQuestions", 0);
            data.put("aiCalls", 0);
            data.put("userGrowth", 0.0);
            data.put("questionGrowth", 0.0);
            response.put("success", true);
            response.put("data", data);
        }

        return response;
    }

    /**
     * 用户列表
     */
    @GetMapping("/users")
    public Map<String, Object> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
            if (search != null && !search.isEmpty()) {
                wrapper.like(User::getUsername, search)
                        .or().like(User::getNickname, search)
                        .or().like(User::getEmail, search);
            }
            wrapper.orderByDesc(User::getCreatedAt);

            Page<User> pageResult = userMapper.selectPage(new Page<>(page, size), wrapper);
            List<User> userList = pageResult.getRecords();

            List<Map<String, Object>> users = new ArrayList<>();
            for (User u : userList) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", u.getId());
                item.put("username", u.getUsername());
                item.put("nickname", u.getNickname());
                item.put("email", u.getEmail());
                item.put("grade", u.getGrade());

                UserPoints points = userPointsMapper.selectOne(
                        new LambdaQueryWrapper<UserPoints>().eq(UserPoints::getUserId, u.getId()));
                int totalPoints = 0;
                int masteryLevel = 0;
                if (points != null) {
                    if (points.getTotalPoints() != null) {
                        totalPoints = points.getTotalPoints();
                    }
                    Integer totalPractice = points.getTotalPracticeCount();
                    Integer totalCorrect = points.getTotalCorrectCount();
                    if (totalPractice != null && totalPractice > 0 && totalCorrect != null) {
                        masteryLevel = (int) Math.round(totalCorrect * 100.0 / totalPractice);
                    }
                }
                item.put("totalPoints", totalPoints);
                item.put("masteryLevel", masteryLevel);

                StudentExerciseLog latestLog = studentExerciseLogMapper.selectOne(
                        new LambdaQueryWrapper<StudentExerciseLog>()
                                .eq(StudentExerciseLog::getStudentId, u.getId())
                                .orderByDesc(StudentExerciseLog::getSubmitTime)
                                .last("LIMIT 1"));
                String lastActive = "";
                if (latestLog != null && latestLog.getSubmitTime() != null) {
                    String ts = latestLog.getSubmitTime().toString().replace("T", " ");
                    lastActive = ts.length() >= 16 ? ts.substring(0, 16) : ts;
                }
                item.put("lastActive", lastActive);

                String createdAt = "";
                if (u.getCreatedAt() != null) {
                    createdAt = u.getCreatedAt().toLocalDate().toString();
                }
                item.put("createdAt", createdAt);

                users.add(item);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("list", users);
            data.put("total", pageResult.getTotal());
            data.put("page", page);
            data.put("size", size);

            response.put("success", true);
            response.put("data", data);
        } catch (Exception e) {
            log.error("获取用户列表失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }

    /**
     * 用户详情
     */
    @GetMapping("/users/{id}")
    public Map<String, Object> getUserDetail(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            User u = userMapper.selectById(id);
            if (u == null) {
                response.put("success", false);
                response.put("message", "用户不存在");
                return response;
            }

            Map<String, Object> user = new HashMap<>();
            user.put("id", u.getId());
            user.put("username", u.getUsername());
            user.put("nickname", u.getNickname());
            user.put("email", u.getEmail());
            user.put("grade", u.getGrade());

            UserPoints points = userPointsMapper.selectOne(
                    new LambdaQueryWrapper<UserPoints>().eq(UserPoints::getUserId, u.getId()));
            int totalPoints = 0;
            int masteryLevel = 0;
            if (points != null) {
                if (points.getTotalPoints() != null) {
                    totalPoints = points.getTotalPoints();
                }
                Integer totalPractice = points.getTotalPracticeCount();
                Integer totalCorrect = points.getTotalCorrectCount();
                if (totalPractice != null && totalPractice > 0 && totalCorrect != null) {
                    masteryLevel = (int) Math.round(totalCorrect * 100.0 / totalPractice);
                }
            }
            user.put("totalPoints", totalPoints);
            user.put("masteryLevel", masteryLevel);

            StudentExerciseLog latestLog = studentExerciseLogMapper.selectOne(
                    new LambdaQueryWrapper<StudentExerciseLog>()
                            .eq(StudentExerciseLog::getStudentId, u.getId())
                            .orderByDesc(StudentExerciseLog::getSubmitTime)
                            .last("LIMIT 1"));
            String lastActive = "";
            if (latestLog != null && latestLog.getSubmitTime() != null) {
                String ts = latestLog.getSubmitTime().toString().replace("T", " ");
                lastActive = ts.length() >= 16 ? ts.substring(0, 16) : ts;
            }
            user.put("lastActive", lastActive);

            String createdAt = "";
            if (u.getCreatedAt() != null) {
                createdAt = u.getCreatedAt().toLocalDate().toString();
            }
            user.put("createdAt", createdAt);

            List<KnowledgeState> states = knowledgeStateMapper.selectList(
                    new LambdaQueryWrapper<KnowledgeState>().eq(KnowledgeState::getStudentId, id));
            List<Map<String, Object>> knowledgeStates = new ArrayList<>();
            if (!states.isEmpty()) {
                List<Long> kpIds = new ArrayList<>();
                for (KnowledgeState state : states) {
                    kpIds.add(state.getKnowledgePointId());
                }
                List<KnowledgePoint> kps = knowledgePointMapper.selectBatchIds(kpIds);
                Map<Long, String> kpNameMap = new HashMap<>();
                for (KnowledgePoint kp : kps) {
                    kpNameMap.put(kp.getId(), kp.getName());
                }

                for (KnowledgeState state : states) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", kpNameMap.getOrDefault(state.getKnowledgePointId(), "未知"));
                    if (state.getMasteryProbability() != null) {
                        double val = state.getMasteryProbability().doubleValue() * 100.0;
                        item.put("mastery", (int) Math.round(val));
                    } else {
                        item.put("mastery", 0);
                    }
                    knowledgeStates.add(item);
                }
            }

            List<MistakeBook> mistakes = mistakeBookMapper.selectList(
                    new LambdaQueryWrapper<MistakeBook>()
                            .eq(MistakeBook::getStudentId, id)
                            .orderByDesc(MistakeBook::getLastErrorTime)
                            .last("LIMIT 20"));
            List<Map<String, Object>> wrongQuestions = new ArrayList<>();
            if (!mistakes.isEmpty()) {
                List<Long> questionIds = new ArrayList<>();
                for (MistakeBook mistake : mistakes) {
                    questionIds.add(mistake.getQuestionId());
                }
                List<Question> questions = questionMapper.selectBatchIds(questionIds);
                Map<Long, Question> questionMap = new HashMap<>();
                for (Question q : questions) {
                    questionMap.put(q.getId(), q);
                }

                Set<Long> kpIds = new HashSet<>();
                for (Question q : questions) {
                    kpIds.add(q.getKnowledgePointId());
                }
                List<KnowledgePoint> kps = knowledgePointMapper.selectBatchIds(new ArrayList<>(kpIds));
                Map<Long, String> kpNameMap = new HashMap<>();
                for (KnowledgePoint kp : kps) {
                    kpNameMap.put(kp.getId(), kp.getName());
                }

                for (MistakeBook mistake : mistakes) {
                    Question q = questionMap.get(mistake.getQuestionId());
                    if (q == null) {
                        continue;
                    }
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", mistake.getId());
                    item.put("content", q.getContent());
                    item.put("knowledgePoint", kpNameMap.getOrDefault(q.getKnowledgePointId(), "未知"));
                    item.put("wrongCount", mistake.getErrorCount());
                    wrongQuestions.add(item);
                }
            }

            Map<String, Object> data = new HashMap<>();
            data.put("user", user);
            data.put("knowledgeStates", knowledgeStates);
            data.put("wrongQuestions", wrongQuestions);

            response.put("success", true);
            response.put("data", data);
        } catch (Exception e) {
            log.error("获取用户详情失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }

    /**
     * 知识点列表
     */
    @GetMapping("/knowledge-points")
    public Map<String, Object> getKnowledgePoints() {
        Map<String, Object> response = new HashMap<>();

        try {
            List<KnowledgePoint> kps = knowledgePointMapper.selectList(null);
            List<Map<String, Object>> data = new ArrayList<>();

            if (kps != null && !kps.isEmpty()) {
                List<Long> kpIds = new ArrayList<>();
                for (KnowledgePoint kp : kps) {
                    if (kp.getId() != null) {
                        kpIds.add(kp.getId());
                    }
                }

                Map<Long, List<Long>> prereqMap = new HashMap<>();
                if (!kpIds.isEmpty()) {
                    List<KnowledgePrerequisite> relations = knowledgePrerequisiteMapper.selectList(
                            new LambdaQueryWrapper<KnowledgePrerequisite>()
                                    .in(KnowledgePrerequisite::getKnowledgePointId, kpIds));
                    for (KnowledgePrerequisite rel : relations) {
                        Long kpId = rel.getKnowledgePointId();
                        Long prereqId = rel.getPrereqPointId();
                        if (kpId == null || prereqId == null) {
                            continue;
                        }
                        prereqMap.computeIfAbsent(kpId, k -> new ArrayList<>()).add(prereqId);
                    }
                }

                for (KnowledgePoint kp : kps) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", kp.getId());
                    item.put("name", kp.getName());
                    item.put("subject", kp.getSubject());
                    item.put("description", kp.getDescription());
                    item.put("parentId", kp.getParentId());
                    item.put("pInit", kp.getPInit() != null ? kp.getPInit() : 0.3);
                    item.put("pTransit", kp.getPTransit() != null ? kp.getPTransit() : 0.1);
                    item.put("pGuess", kp.getPGuess() != null ? kp.getPGuess() : 0.2);
                    item.put("pSlip", kp.getPSlip() != null ? kp.getPSlip() : 0.1);
                    List<Long> prereqIds = prereqMap.getOrDefault(kp.getId(), Collections.emptyList());
                    item.put("prerequisites", prereqIds);
                    data.add(item);
                }
            }

            response.put("success", true);
            response.put("data", data);
        } catch (Exception e) {
            log.error("获取知识点列表失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }

    /**
     * 新增/更新知识点
     */
    @PostMapping("/knowledge-points")
    public Map<String, Object> saveKnowledgePoint(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Object idObj = request.get("id");
            List<Long> prereqIds = new ArrayList<>();
            Object prereqObj = request.get("prerequisites");
            if (prereqObj instanceof Collection<?>) {
                for (Object o : (Collection<?>) prereqObj) {
                    if (o != null) {
                        prereqIds.add(Long.valueOf(o.toString()));
                    }
                }
            }

            KnowledgePoint kp;
            if (idObj != null) {
                Long id = Long.valueOf(idObj.toString());
                kp = knowledgePointMapper.selectById(id);
                if (kp == null) {
                    kp = new KnowledgePoint();
                    kp.setId(id);
                }
            } else {
                kp = new KnowledgePoint();
            }

            Object nameObj = request.get("name");
            if (nameObj != null) {
                kp.setName(nameObj.toString());
            }
            Object subjectObj = request.get("subject");
            if (subjectObj != null) {
                kp.setSubject(subjectObj.toString());
            }
            Object descObj = request.get("description");
            if (descObj != null) {
                kp.setDescription(descObj.toString());
            }
            Object parentIdObj = request.get("parentId");
            if (parentIdObj != null) {
                kp.setParentId(Long.valueOf(parentIdObj.toString()));
            }

            Object pInitObj = request.get("pInit");
            if (pInitObj != null) {
                kp.setPInit(Double.valueOf(pInitObj.toString()));
            }
            Object pTransitObj = request.get("pTransit");
            if (pTransitObj != null) {
                kp.setPTransit(Double.valueOf(pTransitObj.toString()));
            }
            Object pGuessObj = request.get("pGuess");
            if (pGuessObj != null) {
                kp.setPGuess(Double.valueOf(pGuessObj.toString()));
            }
            Object pSlipObj = request.get("pSlip");
            if (pSlipObj != null) {
                kp.setPSlip(Double.valueOf(pSlipObj.toString()));
            }

            if (kp.getId() == null) {
                knowledgePointMapper.insert(kp);
            } else {
                knowledgePointMapper.updateById(kp);
            }

            if (!prereqIds.isEmpty() || idObj != null) {
                Long kpId = kp.getId();
                if (kpId != null) {
                    knowledgePrerequisiteMapper.delete(
                            new LambdaQueryWrapper<KnowledgePrerequisite>()
                                    .eq(KnowledgePrerequisite::getKnowledgePointId, kpId));
                    for (Long pid : prereqIds) {
                        KnowledgePrerequisite rel = new KnowledgePrerequisite();
                        rel.setKnowledgePointId(kpId);
                        rel.setPrereqPointId(pid);
                        knowledgePrerequisiteMapper.insert(rel);
                    }
                }
            }

            response.put("success", true);
            response.put("message", "保存成功");
        } catch (Exception e) {
            log.error("保存知识点失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    /**
     * 删除知识点
     */
    @DeleteMapping("/knowledge-points/{id}")
    public Map<String, Object> deleteKnowledgePoint(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            knowledgePrerequisiteMapper.delete(
                    new LambdaQueryWrapper<KnowledgePrerequisite>()
                            .eq(KnowledgePrerequisite::getKnowledgePointId, id)
                            .or()
                            .eq(KnowledgePrerequisite::getPrereqPointId, id));
            int rows = knowledgePointMapper.deleteById(id);
            response.put("success", rows > 0);
            response.put("message", rows > 0 ? "删除成功" : "记录不存在");
        } catch (Exception e) {
            log.error("删除知识点失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    /**
     * Prompt模板预览
     */
    @PostMapping("/prompts/preview")
    public Map<String, Object> previewPrompt(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        String template = (String) request.get("template");
        @SuppressWarnings("unchecked")
        Map<String, Object> variables = (Map<String, Object>) request.get("variables");

        // 替换变量
        String result = template;
        if (variables != null) {
            for (Map.Entry<String, Object> entry : variables.entrySet()) {
                result = result.replace("{{" + entry.getKey() + "}}", String.valueOf(entry.getValue()));
            }
        }

        response.put("success", true);
        response.put("data", "【AI生成预览】\n\n" + result);
        return response;
    }

    /**
     * 系统日志
     */
    @GetMapping("/logs")
    public Map<String, Object> getLogs(
            @RequestParam(defaultValue = "operation") String type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Map<String, Object> response = new HashMap<>();
        
        List<Map<String, Object>> logs = new ArrayList<>();
        // 模拟日志数据
        for (int i = 0; i < 10; i++) {
            Map<String, Object> log = new HashMap<>();
            log.put("id", i + 1);
            log.put("type", type);
            log.put("level", i % 4 == 0 ? "error" : (i % 3 == 0 ? "warning" : "info"));
            log.put("message", type.equals("operation") ? "管理员操作记录 " + i : "系统错误日志 " + i);
            log.put("user", "admin");
            log.put("ip", "192.168.1." + (100 + i));
            log.put("path", "/api/admin/test");
            log.put("timestamp", LocalDateTime.now().minusMinutes(i * 15).toString().replace("T", " ").substring(0, 19));
            logs.add(log);
        }

        response.put("success", true);
        response.put("data", logs);
        return response;
    }
}
