package com.edtech.web.controller;

import cn.hutool.json.JSONUtil;
import com.edtech.ai.model.GeneratedQuestionVO;
import com.edtech.ai.service.ContentGenerationService;
import com.edtech.ai.service.OpenSatService;
import com.edtech.core.util.RedisUtils;
import com.edtech.kt.service.KnowledgeTracingService;
import com.edtech.model.entity.Question;
import com.edtech.model.entity.StudentExerciseLog;
import com.edtech.model.mapper.KnowledgePointMapper;
import com.edtech.model.mapper.QuestionMapper;
import com.edtech.model.mapper.StudentExerciseLogMapper;
import com.edtech.web.service.MistakeBookService;
import com.edtech.web.service.strategy.PracticeStrategyService;
import com.edtech.web.service.strategy.SpacedRepetitionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
@Slf4j
public class PracticeController {

    private final StudentExerciseLogMapper logMapper;
    private final KnowledgeTracingService ktService;
    private final MistakeBookService mistakeBookService;
    private final PracticeStrategyService strategyService;
    private final SpacedRepetitionService sm2Service;
    private final RedisUtils redisUtils;
    private final ContentGenerationService contentService;
    private final OpenSatService openSatService;
    private final QuestionMapper questionMapper;
    private final KnowledgePointMapper knowledgePointMapper;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) {
            return (Long) auth.getPrincipal();
        }
        return 1L;
    }

    private static final String OPENSAT_CACHE_KEY = "opensat:math:pool";
    private static final int CACHE_BATCH = 20;

    @GetMapping("/random")
    public Map<String, Object> getRandomQuestion() {
        // Try to pop one question from Redis cache
        Object cached = redisUtils.lPop(OPENSAT_CACHE_KEY);
        if (cached != null) {
            GeneratedQuestionVO vo = JSONUtil.toBean(cached.toString(), GeneratedQuestionVO.class);
            Map<String, Object> response = new HashMap<>();
            response.put("data", vo);
            response.put("strategy", "OpenSAT API 实时获取");
            response.put("strategyCode", "OPENSAT");
            // Refill cache in background if running low
            Long remaining = redisUtils.lLen(OPENSAT_CACHE_KEY);
            if (remaining != null && remaining < 5) {
                new Thread(() -> refillCache()).start();
            }
            return response;
        }

        // Cache empty: fetch from OpenSAT synchronously
        log.info("Cache empty, fetching from OpenSAT...");
        List<GeneratedQuestionVO> questions = openSatService.fetchMathQuestions(CACHE_BATCH);
        if (!questions.isEmpty()) {
            // Push all except first to cache
            for (int i = 1; i < questions.size(); i++) {
                redisUtils.rPush(OPENSAT_CACHE_KEY, JSONUtil.toJsonStr(questions.get(i)));
            }
            redisUtils.expire(OPENSAT_CACHE_KEY, 30, TimeUnit.MINUTES);
            GeneratedQuestionVO vo = questions.get(0);
            Map<String, Object> response = new HashMap<>();
            response.put("data", vo);
            response.put("strategy", "OpenSAT API 实时获取");
            response.put("strategyCode", "OPENSAT");
            return response;
        }

        // Fallback to local strategy
        Long studentId = getCurrentUserId();
        PracticeStrategyService.QuestionSelection selection = strategyService.selectNextQuestion(studentId);
        Map<String, Object> response = new HashMap<>();
        if (selection != null && selection.question() != null) {
            response.put("data", selection.question());
            response.put("strategy", selection.strategyName());
            response.put("strategyCode", selection.strategyCode());
        }
        return response;
    }

    private void refillCache() {
        try {
            List<GeneratedQuestionVO> questions = openSatService.fetchMathQuestions(CACHE_BATCH);
            for (GeneratedQuestionVO q : questions) {
                redisUtils.rPush(OPENSAT_CACHE_KEY, JSONUtil.toJsonStr(q));
            }
            redisUtils.expire(OPENSAT_CACHE_KEY, 30, TimeUnit.MINUTES);
            log.info("Refilled OpenSAT cache with {} questions", questions.size());
        } catch (Exception e) {
            log.warn("Failed to refill OpenSAT cache: {}", e.getMessage());
        }
    }

    @GetMapping("/generate")
    public Map<String, Object> generateQuestion(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Long knowledgePointId,
            @RequestParam(required = false) String difficulty) {

        Long studentId = getCurrentUserId();
        log.info("AI出题请求: studentId={}, subject={}, kpId={}, difficulty={}", studentId, subject, knowledgePointId, difficulty);

        try {
            Long kpIdToUse = knowledgePointId;
            String kpName = "综合练习";

            if (knowledgePointId != null) {
                var kp = knowledgePointMapper.selectById(knowledgePointId);
                if (kp != null) kpName = kp.getName();
            } else if (subject != null) {
                kpName = subject + " 综合训练";
                var allKp = knowledgePointMapper.selectList(null);
                if (allKp != null && !allKp.isEmpty()) {
                    kpIdToUse = allKp.get(0).getId();
                    kpName = allKp.get(0).getName();
                }
            }

            String masteryKey = String.format("student:%s:mastery", studentId);
            String mistakeKey = String.format("student:%s:common_mistakes", studentId);
            double probability = 0.5;
            String commonMistakes = "暂无历史错误记录";

            if (kpIdToUse != null) {
                Object masteryObj = redisUtils.hGet(masteryKey, kpIdToUse.toString());
                if (masteryObj != null) probability = Double.parseDouble(masteryObj.toString());
                Object mistakeObj = redisUtils.hGet(mistakeKey, kpIdToUse.toString());
                if (mistakeObj != null) commonMistakes = mistakeObj.toString();
            }

            GeneratedQuestionVO vo = contentService.generateRemedialQuestion(
                    kpName, probability, commonMistakes, "暂无", 0, difficulty);

            Question question = new Question();
            question.setContent(vo.getStem());
            question.setKnowledgePointId(kpIdToUse);
            question.setCorrectAnswer(vo.getCorrectAnswer());
            if (vo.getOptions() != null) {
                question.setOptions(JSONUtil.toJsonStr(vo.getOptions()));
            }
            BigDecimal diffValue = switch (difficulty != null ? difficulty : "Medium") {
                case "Easy" -> BigDecimal.valueOf(0.3);
                case "Hard" -> BigDecimal.valueOf(0.8);
                default -> BigDecimal.valueOf(0.5);
            };
            question.setDifficulty(diffValue);
            question.setType(99);
            question.setCreatedAt(LocalDateTime.now());
            questionMapper.insert(question);

            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", question.getId());
            qMap.put("content", vo.getStem());
            qMap.put("options", vo.getOptions());
            qMap.put("correctAnswer", vo.getCorrectAnswer());
            qMap.put("analysis", vo.getAnalysis());
            qMap.put("knowledgePointId", kpIdToUse);
            qMap.put("aiGenerated", true);

            Map<String, Object> response = new HashMap<>();
            response.put("data", qMap);
            response.put("strategy", String.format("🤖 AI智能出题 (%s)", difficulty != null ? difficulty : "Medium"));
            response.put("strategyCode", "AI_GENERATED");
            response.put("studentMastery", probability);
            return response;

        } catch (Exception e) {
            log.error("AI出题失败", e);
            Map<String, Object> err = new HashMap<>();
            err.put("error", true);
            err.put("message", "🤖 AI正在思考中，请稍后重试...");
            err.put("retryable", true);
            return err;
        }
    }

    @PostMapping("/submit")
    public void submitAnswer(@RequestBody SubmitRequest request) {
        Long studentId = getCurrentUserId();
        Long questionId = request.getQuestionId();

        StudentExerciseLog exerciseLog = new StudentExerciseLog();
        exerciseLog.setStudentId(studentId);
        exerciseLog.setQuestionId(questionId);
        exerciseLog.setResult(request.getIsCorrect() ? 1 : 0);
        exerciseLog.setDuration(request.getDuration());
        exerciseLog.setSubmitTime(LocalDateTime.now());
        logMapper.insert(exerciseLog);

        ktService.updateKnowledgeState(studentId, questionId, request.getIsCorrect());

        String wrongFreqKey = String.format("student:%s:wrong_freq", studentId);
        String drillKey = String.format("student:%s:drill_mode", studentId);
        String reviewKey = String.format("student:%s:review_due", studentId);

        if (!request.getIsCorrect()) {
            mistakeBookService.addMistake(studentId, questionId);
            redisUtils.zIncrementScore(wrongFreqKey, questionId.toString(), 1.0);
            redisUtils.set(drillKey, 101L, 10, TimeUnit.MINUTES);
            long nextReview = sm2Service.calculateNextReviewTime(0, 0, 0);
            redisUtils.zAdd(reviewKey, questionId.toString(), nextReview);
        } else {
            Object drillKp = redisUtils.get(drillKey);
            if (drillKp != null) {
                redisUtils.delete(drillKey);
            }
            long nextReview = sm2Service.calculateNextReviewTime(1, 1, 4);
            redisUtils.zAdd(reviewKey, questionId.toString(), nextReview);
        }
    }

    @Data
    public static class SubmitRequest {
        private Long studentId;
        private Long questionId;
        private Boolean isCorrect;
        private Integer duration;
    }
}
