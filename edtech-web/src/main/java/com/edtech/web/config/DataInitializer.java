package com.edtech.web.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edtech.model.entity.*;
import com.edtech.model.mapper.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final KnowledgePointMapper knowledgePointMapper;
    private final QuestionMapper questionMapper;
    private final StudentExerciseLogMapper studentExerciseLogMapper;
    private final KnowledgeStateMapper knowledgeStateMapper;
    private final UserMapper userMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking data initialization...");

        // 1. Check and init Knowledge Points
        if (knowledgePointMapper.selectCount(null) == 0) {
            initKnowledgePoints();
        }

        // 2. Check and init Questions
        if (questionMapper.selectCount(null) == 0) {
            initQuestions();
        }

        // 3. Check and init Student Data
        Long studentId = 1L;
        if (studentExerciseLogMapper.selectCount(new LambdaQueryWrapper<StudentExerciseLog>()
                .eq(StudentExerciseLog::getStudentId, studentId)) == 0) {
            initStudentData(studentId);
        }

        log.info("Data initialization completed.");
    }

    private void initKnowledgePoints() {
        log.info("Initializing Knowledge Points...");
        List<KnowledgePoint> kps = Arrays.asList(
            createKP("函数与映射", "Functions and Mappings", "Math"),
            createKP("导数与微分", "Derivatives and Differentiation", "Math"),
            createKP("三角函数", "Trigonometric Functions", "Math"),
            createKP("概率统计", "Probability and Statistics", "Math"),
            createKP("立体几何", "Solid Geometry", "Math")
        );
        kps.forEach(knowledgePointMapper::insert);
    }

    private KnowledgePoint createKP(String name, String desc, String subject) {
        KnowledgePoint kp = new KnowledgePoint();
        kp.setName(name);
        kp.setDescription(desc);
        kp.setSubject(subject);
        kp.setParentId(0L);
        return kp;
    }

    private void initQuestions() throws Exception {
        log.info("Initializing Questions...");
        List<KnowledgePoint> kps = knowledgePointMapper.selectList(null);
        if (kps.isEmpty()) return;

        for (KnowledgePoint kp : kps) {
            // Create 3 questions for each KP
            for (int i = 1; i <= 3; i++) {
                Question q = new Question();
                q.setKnowledgePointId(kp.getId());
                q.setContent(kp.getName() + " - 基础练习题 " + i + ": 请选择正确的选项。");
                q.setDifficulty(BigDecimal.valueOf(0.3 + (i * 0.2))); // 0.5, 0.7, 0.9
                q.setType(1); // Single Choice
                
                Map<String, String> options = new LinkedHashMap<>();
                options.put("A", "选项 A 的内容");
                options.put("B", "选项 B 的内容");
                options.put("C", "正确答案的内容");
                options.put("D", "选项 D 的内容");
                q.setOptions(objectMapper.writeValueAsString(options));
                
                q.setCorrectAnswer("C");
                questionMapper.insert(q);
            }
        }
    }

    private void initStudentData(Long studentId) {
        log.info("Initializing Student Data for ID: {}", studentId);
        List<KnowledgePoint> kps = knowledgePointMapper.selectList(null);
        List<Question> questions = questionMapper.selectList(null);
        Random random = new Random();

        // 1. Generate Fake Logs
        // Simulate last 7 days activity
        for (int i = 0; i < 20; i++) {
            Question q = questions.get(random.nextInt(questions.size()));
            StudentExerciseLog log = new StudentExerciseLog();
            log.setStudentId(studentId);
            log.setQuestionId(q.getId());
            // Random result (60% correct rate)
            boolean isCorrect = random.nextDouble() > 0.4; 
            log.setResult(isCorrect ? 1 : 0);
            log.setDuration(30 + random.nextInt(60));
            log.setSubmitTime(LocalDateTime.now().minusDays(random.nextInt(7)));
            studentExerciseLogMapper.insert(log);
        }

        // 2. Generate Initial Knowledge States (for Radar Chart)
        // Manually setting some interesting values for demo
        Map<String, Double> masteryMap = new HashMap<>();
        masteryMap.put("函数与映射", 0.85); // High
        masteryMap.put("导数与微分", 0.70); // Medium-High
        masteryMap.put("三角函数", 0.60); // Medium
        masteryMap.put("概率统计", 0.45); // Medium-Low
        masteryMap.put("立体几何", 0.25); // Low (Weakness)

        for (KnowledgePoint kp : kps) {
            KnowledgeState state = new KnowledgeState();
            state.setStudentId(studentId);
            state.setKnowledgePointId(kp.getId());
            
            Double mastery = masteryMap.getOrDefault(kp.getName(), 0.5);
            state.setMasteryProbability(BigDecimal.valueOf(mastery));
            
            knowledgeStateMapper.insert(state);
        }
    }
}
