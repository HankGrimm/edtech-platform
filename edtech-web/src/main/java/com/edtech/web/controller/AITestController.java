package com.edtech.web.controller;

import com.edtech.ai.service.ContentGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * AI服务测试控制器 - 用于验证AI配置和连接
 */
@RestController
@RequestMapping("/api/ai/test")
@RequiredArgsConstructor
@Slf4j
public class AITestController {

    private final ContentGenerationService contentService;
    private final com.edtech.ai.service.AIServiceDiagnostic diagnostic;
    
    @Value("${spring.ai.openai.api-key}")
    private String apiKey;
    
    @Value("${spring.ai.openai.base-url}")
    private String baseUrl;

    /**
     * 测试AI服务连接状态 - 使用诊断服务
     */
    @GetMapping("/connection")
    public Map<String, Object> testConnection() {
        log.info("🧪 开始AI连接测试...");
        return diagnostic.diagnoseAIService();
    }

    /**
     * 测试简单数学题目生成
     */
    @GetMapping("/simple-math")
    public Map<String, Object> testSimpleMath() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("🧮 测试简单数学题目生成...");
            String mathResponse = diagnostic.testMathQuestionGeneration();
            
            result.put("status", "SUCCESS");
            result.put("message", "数学题目生成成功");
            result.put("rawResponse", mathResponse);
            
            // 尝试解析JSON
            try {
                cn.hutool.json.JSONObject questionJson = cn.hutool.json.JSONUtil.parseObj(mathResponse.trim());
                result.put("parsedQuestion", questionJson);
            } catch (Exception parseError) {
                result.put("parseError", "JSON解析失败: " + parseError.getMessage());
            }
            
        } catch (Exception e) {
            log.error("❌ 数学题目生成测试失败", e);
            result.put("status", "ERROR");
            result.put("message", e.getMessage());
        }
        
        return result;
    }

    /**
     * 测试不同难度的题目生成
     */
    @PostMapping("/generate-samples")
    public Map<String, Object> generateSamples() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String[] difficulties = {"Easy", "Medium", "Hard"};
            Map<String, Object> samples = new HashMap<>();
            
            for (String difficulty : difficulties) {
                log.info("🎯 生成{}难度测试题目", difficulty);
                var question = contentService.generateRemedialQuestion(
                    "函数与导数", 0.6, "容易混淆导数和原函数", "选择了错误的求导公式", 3, difficulty
                );
                
                Map<String, Object> questionData = new HashMap<>();
                questionData.put("stem", question.getStem());
                questionData.put("options", question.getOptions());
                questionData.put("correctAnswer", question.getCorrectAnswer());
                questionData.put("analysis", question.getAnalysis());
                
                samples.put(difficulty, questionData);
            }
            
            result.put("status", "SUCCESS");
            result.put("samples", samples);
            result.put("message", "所有难度测试题目生成成功");
            
        } catch (Exception e) {
            log.error("❌ 样本生成失败", e);
            result.put("status", "ERROR");
            result.put("message", "样本生成失败: " + e.getMessage());
        }
        
        return result;
    }
}
