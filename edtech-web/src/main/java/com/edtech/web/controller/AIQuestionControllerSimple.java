package com.edtech.web.controller;

import com.edtech.ai.model.GeneratedQuestionVO;
import com.edtech.ai.service.ContentGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 简化版AI动态出题控制器 - 专注于AI生成功能
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AIQuestionControllerSimple {

    private final ContentGenerationService contentService;

    /**
     * 简化版AI出题接口 - 直接返回AI生成结果
     */
    @PostMapping("/generate-simple")
    public Map<String, Object> generateSimpleQuestion(@RequestBody SimpleQuestionRequest request) {
        log.info("🎯 简化AI出题请求: 学科={}, 难度={}", request.subject, request.difficulty);
        
        try {
            // 构造知识点名称
            String kpName = request.subject != null ? request.subject : "数学";
            
            // 设置默认参数
            double probability = 0.5; // 中等掌握水平
            String commonMistakes = "暂无历史错误记录";
            String lastWrong = "暂无";
            long daysSinceReview = 0;
            String difficulty = request.difficulty != null ? request.difficulty : "Medium";

            // 调用AI生成服务
            log.info("🤖 调用AI生成: 知识点={}, 难度={}", kpName, difficulty);
            
            GeneratedQuestionVO aiQuestion = contentService.generateRemedialQuestion(
                kpName, 
                probability, 
                commonMistakes, 
                lastWrong, 
                daysSinceReview, 
                difficulty
            );

            // 构造返回结果
            Map<String, Object> questionData = new HashMap<>();
            questionData.put("content", aiQuestion.getStem());
            questionData.put("options", aiQuestion.getOptions());
            questionData.put("correctAnswer", aiQuestion.getCorrectAnswer());
            questionData.put("analysis", aiQuestion.getAnalysis());
            questionData.put("difficulty", difficulty);
            questionData.put("aiGenerated", true);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", questionData);
            response.put("message", "🤖 AI题目生成成功");
            
            log.info("✅ AI题目生成成功: 难度={}", difficulty);
            return response;

        } catch (Exception e) {
            log.error("❌ AI出题失败", e);
            
            // 优雅降级 - 返回友好错误信息
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "🤖 AI正在思考中，请稍后重试...");
            errorResponse.put("details", e.getMessage());
            errorResponse.put("retryable", true);
            
            return errorResponse;
        }
    }

    /**
     * 简化版AI解析接口
     */
    @PostMapping("/explain-simple")
    public Map<String, Object> explainQuestionSimple(@RequestBody SimpleExplainRequest request) {
        log.info("🧠 简化AI解析请求");
        
        try {
            String explanation = contentService.generateExplanation(
                request.questionContent,
                request.wrongAnswer,
                request.correctAnswer
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("explanation", explanation);
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ AI解析失败", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("explanation", "🤖 AI解析服务暂时繁忙，请稍后重试。");
            errorResponse.put("details", e.getMessage());
            
            return errorResponse;
        }
    }

    // 简化的请求类 - 使用public字段避免getter/setter问题
    public static class SimpleQuestionRequest {
        public String subject;
        public String difficulty; // Easy, Medium, Hard
    }

    public static class SimpleExplainRequest {
        public String questionContent;
        public String wrongAnswer;
        public String correctAnswer;
    }
}