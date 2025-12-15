package com.edtech.web.controller;

import com.edtech.ai.model.GeneratedQuestionVO;
import com.edtech.ai.service.ContentGenerationService;
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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

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
    private final QuestionMapper questionMapper;
    private final KnowledgePointMapper knowledgePointMapper;

    @GetMapping("/random")
    public Map<String, Object> getRandomQuestion() {
        // Use new Strategy Engine
        Long studentId = 1L; // Mock student
        PracticeStrategyService.QuestionSelection selection = strategyService.selectNextQuestion(studentId);
        
        Map<String, Object> response = new HashMap<>();
        if (selection != null && selection.question() != null) {
            response.put("data", selection.question());
            response.put("strategy", selection.strategyName());
            response.put("strategyCode", selection.strategyCode());
        }
        return response;
    }

    @GetMapping("/generate")
    public Map<String, Object> generateQuestion(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Long knowledgePointId,
            @RequestParam(required = false) String difficulty) {
        
        log.info("🎯 练习页AI出题请求: subject={}, kpId={}, difficulty={}", subject, knowledgePointId, difficulty);
        
        // 重定向到新的AI专用接口，保持向后兼容
        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("studentId", 1L); // 当前用户ID，实际应从JWT获取
        aiRequest.put("subject", subject);
        aiRequest.put("knowledgePointId", knowledgePointId);
        aiRequest.put("difficulty", difficulty != null ? difficulty : "Medium");
        
        try {
            // 调用AI专用控制器的逻辑 (内部调用，避免HTTP开销)
            Long studentId = 1L;
            Long kpIdToUse = knowledgePointId;
            String kpName = "综合练习";
            
            if (knowledgePointId != null) {
                var kp = knowledgePointMapper.selectById(knowledgePointId);
                if (kp != null) {
                    kpName = kp.getName();
                }
            } else if (subject != null) {
                kpName = subject + " 综合训练";
                // 可以根据科目选择默认知识点
                var allKp = knowledgePointMapper.selectList(null);
                if (allKp != null && !allKp.isEmpty()) {
                    var kp = allKp.get(0);
                    kpIdToUse = kp.getId();
                    kpName = kp.getName();
                }
            }

            // 从Redis获取学生状态
            String masteryKey = String.format("student:%s:mastery", studentId);
            String mistakeKey = String.format("student:%s:common_mistakes", studentId);
            
            double probability = 0.5;
            String commonMistakes = "暂无历史错误记录";
            
            if (kpIdToUse != null) {
                Object masteryObj = redisUtils.hGet(masteryKey, kpIdToUse.toString());
                if (masteryObj != null) {
                    probability = Double.parseDouble(masteryObj.toString());
                }
                
                Object mistakeObj = redisUtils.hGet(mistakeKey, kpIdToUse.toString());
                if (mistakeObj != null) {
                    commonMistakes = mistakeObj.toString();
                }
            }

            // 调用AI生成
            GeneratedQuestionVO vo = contentService.generateRemedialQuestion(
                    kpName, probability, commonMistakes, "暂无", 0, difficulty
            );

            // 保存题目
            Question question = new Question();
            question.setContent(vo.getStem());
            question.setKnowledgePointId(kpIdToUse);
            question.setCorrectAnswer(vo.getCorrectAnswer());
            if (vo.getOptions() != null) {
                question.setOptions(cn.hutool.json.JSONUtil.toJsonStr(vo.getOptions()));
            }
            
            java.math.BigDecimal diffValue = switch (difficulty != null ? difficulty : "Medium") {
                case "Easy" -> java.math.BigDecimal.valueOf(0.3);
                case "Hard" -> java.math.BigDecimal.valueOf(0.8);
                default -> java.math.BigDecimal.valueOf(0.5);
            };
            question.setDifficulty(diffValue);
            question.setType(99); // AI生成标记
            question.setCreatedAt(LocalDateTime.now());
            questionMapper.insert(question);

            // 构造返回结果
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
            
            log.info("✅ AI题目生成成功: ID={}, 掌握度={:.2f}", question.getId(), probability);
            return response;
            
        } catch (Exception e) {
            log.error("❌ AI出题失败，返回错误信息", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "🤖 AI正在思考中，请稍后重试...");
            errorResponse.put("retryable", true);
            
            return errorResponse;
        }
    }

    @PostMapping("/submit")
    public void submitAnswer(@RequestBody SubmitRequest request) {
        log.info("Received submission: {}", request);
        Long studentId = request.getStudentId();
        Long questionId = request.getQuestionId();

        // 1. Save Log (Sync for now, move to MQ later as requested)
        StudentExerciseLog exerciseLog = new StudentExerciseLog();
        exerciseLog.setStudentId(studentId);
        exerciseLog.setQuestionId(questionId);
        exerciseLog.setResult(request.getIsCorrect() ? 1 : 0);
        exerciseLog.setDuration(request.getDuration());
        exerciseLog.setSubmitTime(LocalDateTime.now());
        logMapper.insert(exerciseLog);

        // 2. Trigger BKT Update
        ktService.updateKnowledgeState(studentId, questionId, request.getIsCorrect());

        // 3. Update Strategy State (Redis)
        String wrongFreqKey = String.format("student:%s:wrong_freq", studentId);
        String drillKey = String.format("student:%s:drill_mode", studentId);
        String reviewKey = String.format("student:%s:review_due", studentId);

        if (!request.getIsCorrect()) {
            // Wrong: Add to mistake book, increment freq, trigger drill
            mistakeBookService.addMistake(studentId, questionId);
            redisUtils.zIncrementScore(wrongFreqKey, questionId.toString(), 1.0);
            
            // Set Drill Mode: Target this KP
            redisUtils.set(drillKey, 101L, 10, java.util.concurrent.TimeUnit.MINUTES); // Mock KP ID logic
            
            // Reset SM-2 interval
            long nextReview = sm2Service.calculateNextReviewTime(0, 0, 0);
            redisUtils.zAdd(reviewKey, questionId.toString(), nextReview);
        } else {
            // Correct: Check drill mode exit
            Object drillKp = redisUtils.get(drillKey);
            if (drillKp != null) {
                // If consecutive correct >= 2 (Logic simplified for demo)
                redisUtils.delete(drillKey);
            }
            
            // Update SM-2 (Mocking previous interval/reps for now)
            long nextReview = sm2Service.calculateNextReviewTime(1, 1, 4);
            redisUtils.zAdd(reviewKey, questionId.toString(), nextReview);
        }
        
        // 4. Async Log (Mock MQ send)
        // rabbitTemplate.convertAndSend("practice.exchange", "log.key", exerciseLog);
    }

    @Data
    public static class SubmitRequest {
        private Long studentId;
        private Long questionId;
        private Boolean isCorrect;
        private Integer duration;
    }
}
