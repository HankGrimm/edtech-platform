package com.edtech.ai.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.edtech.ai.model.GeneratedQuestionVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ContentGenerationService {

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url:https://dashscope.aliyuncs.com/compatible-mode}")
    private String baseUrl;

    private static final String MODEL = "qwen-plus";

    public GeneratedQuestionVO generateRemedialQuestion(String kpName, double probability, String commonMistakes, String lastWrong, long daysSinceReview, String difficultyOption) {
        log.info("🎯 AI动态出题: 知识点={}, 掌握度={:.2f}, 难度={}", kpName, probability, difficultyOption);

        // 动态难度策略
        String difficultyLevel;
        String difficultyPrompt;
        if (difficultyOption != null) {
            switch (difficultyOption) {
                case "Easy" -> {
                    difficultyLevel = "基础巩固";
                    difficultyPrompt = "题目应该直接考查基本概念和公式应用，计算步骤不超过3步，避免复杂变形";
                }
                case "Hard" -> {
                    difficultyLevel = "综合提升";
                    difficultyPrompt = "题目应该综合多个知识点，需要深入分析和多步推理，包含一定的技巧性";
                }
                default -> {
                    difficultyLevel = "适中练习";
                    difficultyPrompt = "题目难度适中，需要理解概念并进行适当计算，有一定思维量但不过分复杂";
                }
            }
        } else {
            // 根据掌握度自动调整
            if (probability < 0.4) {
                difficultyLevel = "基础巩固";
                difficultyPrompt = "重点巩固基础，题目简单直接，帮助建立信心";
            } else if (probability > 0.8) {
                difficultyLevel = "挑战进阶";
                difficultyPrompt = "适当增加难度，拓展思维，防止知识遗忘";
            } else {
                difficultyLevel = "稳步提升";
                difficultyPrompt = "在现有基础上适度提升，循序渐进";
            }
        }

        // 简化的Prompt模板，避免格式问题
        String userPrompt = String.format("""
                你是一位高中数学特级教师。请为以下学生生成一道数学选择题：
                
                知识点：%s
                学生掌握水平：%.0f%% (掌握度越低需要越简单的题目)
                难度要求：%s
                
                要求：
                1. 题目难度要匹配学生水平
                2. 选项设计要包含常见错误
                3. 数学公式用LaTeX格式，如 $\\frac{a}{b}$, $\\sqrt{x}$
                4. 输出严格的JSON格式，不要有多余的文字
                
                JSON格式：
                {
                  "content": "题干内容",
                  "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
                  "correctAnswer": "A",
                  "analysis": "详细解析",
                  "difficulty": "%s",
                  "type": 1
                }
                """, 
                kpName, probability * 100, difficultyPrompt, difficultyLevel);

        String response = callQwen(userPrompt);

        // Parse Response with enhanced error handling
        try {
            log.info("🔍 原始AI响应: {}", response);
            
            // 清理响应格式
            String cleanResponse = response.trim();
            
            // 移除markdown代码块标记
            if (cleanResponse.startsWith("```json")) {
                cleanResponse = cleanResponse.substring(7);
            } else if (cleanResponse.startsWith("```")) {
                cleanResponse = cleanResponse.substring(3);
            }
            
            if (cleanResponse.endsWith("```")) {
                cleanResponse = cleanResponse.substring(0, cleanResponse.length() - 3);
            }
            
            // 查找JSON部分
            int jsonStart = cleanResponse.indexOf("{");
            int jsonEnd = cleanResponse.lastIndexOf("}");
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
            }
            
            log.info("🧹 清理后的JSON: {}", cleanResponse);
            
            JSONObject json = JSONUtil.parseObj(cleanResponse);
            GeneratedQuestionVO vo = new GeneratedQuestionVO();
            
            // 设置题干
            String content = json.getStr("content");
            if (content == null || content.isEmpty()) {
                throw new RuntimeException("AI响应中缺少题干内容");
            }
            vo.setStem(content);
            
            // 设置选项
            JSONArray opts = json.getJSONArray("options");
            if (opts != null && opts.size() >= 4) {
                vo.setOptions(opts.toList(String.class));
            } else {
                // 如果选项解析失败，创建默认选项
                log.warn("⚠️ 选项解析失败，使用默认选项");
                vo.setOptions(List.of("A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"));
            }
            
            // 设置正确答案
            String correctAnswer = json.getStr("correctAnswer");
            vo.setCorrectAnswer(correctAnswer != null ? correctAnswer : "A");
            
            // 设置解析
            String analysis = json.getStr("analysis");
            vo.setAnalysis(analysis != null ? analysis : "解析生成中...");
            
            // 设置难度
            vo.setDifficulty(difficultyLevel);
            
            log.info("✅ AI题目解析成功: 题干长度={}, 选项数={}", 
                    vo.getStem().length(), vo.getOptions().size());
            
            return vo;

        } catch (Exception e) {
            log.error("❌ AI响应解析失败: {}", response, e);
            
            // 创建降级题目
            GeneratedQuestionVO fallbackVO = new GeneratedQuestionVO();
            fallbackVO.setStem("AI生成题目解析失败，请重试。如果问题持续，请检查API配置。");
            fallbackVO.setOptions(List.of(
                "A. 重新生成题目", 
                "B. 检查网络连接", 
                "C. 验证API密钥", 
                "D. 联系技术支持"
            ));
            fallbackVO.setCorrectAnswer("A");
            fallbackVO.setAnalysis("系统提示：AI服务暂时不可用，请稍后重试。错误详情：" + e.getMessage());
            fallbackVO.setDifficulty(difficultyLevel);
            
            return fallbackVO;
        }
    }

    /**
     * 智能讲解错题
     */
    public String generateExplanation(String questionContent, String wrongAnswer, String correctAnswer) {
        log.info("Generating explanation...");

        String userPrompt = StrUtil.format("""
                Role: You are a patient and knowledgeable AI tutor.
                Task: Explain why the student's answer is wrong and provide a detailed derivation for the correct answer.
                Question: {}
                Student's Wrong Answer: {}
                Correct Answer: {}
                
                Requirements:
                1. Analyze the likely misconception in the wrong answer.
                2. Provide step-by-step derivation for the correct answer.
                3. Create a similar but simpler example question to reinforce the concept.
                4. Output Format: Markdown (Use LaTeX for math).
                5. Language: Chinese (Simplified).
                """, questionContent, wrongAnswer, correctAnswer);

        return callQwen(userPrompt);
    }

    private String callQwen(String prompt) {
        String url = baseUrl + "/v1/chat/completions";
        
        // 检查API密钥
        if (apiKey == null || apiKey.isEmpty() || apiKey.startsWith("sk-请在")) {
            log.error("❌ API密钥未配置或无效: {}", apiKey);
            throw new RuntimeException("API密钥未正确配置，请在.env文件中设置AI_API_KEY");
        }
        
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> body = new HashMap<>();
        body.put("model", MODEL);
        body.put("messages", List.of(message));
        body.put("temperature", 0.7);
        body.put("max_tokens", 2000);

        log.info("🔗 调用AI API: {}", url);
        log.info("📝 Prompt长度: {} 字符", prompt.length());

        try (HttpResponse response = HttpRequest.post(url)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(JSONUtil.toJsonStr(body))
                .timeout(30000) // 30秒超时
                .execute()) {

            log.info("📡 AI API响应状态: {}", response.getStatus());

            if (!response.isOk()) {
                String errorBody = response.body();
                log.error("❌ AI API调用失败: 状态码={}, 响应={}", response.getStatus(), errorBody);
                
                // 根据错误码提供具体建议
                if (response.getStatus() == 401) {
                    throw new RuntimeException("API密钥无效，请检查AI_API_KEY配置");
                } else if (response.getStatus() == 403) {
                    throw new RuntimeException("API密钥权限不足或余额不足");
                } else if (response.getStatus() == 429) {
                    throw new RuntimeException("API调用频率超限，请稍后重试");
                } else {
                    throw new RuntimeException("AI API调用失败: " + response.getStatus() + " - " + errorBody);
                }
            }

            String responseBody = response.body();
            log.info("📄 AI API响应长度: {} 字符", responseBody.length());
            
            try {
                JSONObject json = JSONUtil.parseObj(responseBody);
                String content = json.getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getStr("content");
                        
                log.info("✅ AI内容生成成功，长度: {} 字符", content.length());
                return content;
                
            } catch (Exception parseError) {
                log.error("❌ AI响应解析失败: {}", responseBody, parseError);
                throw new RuntimeException("AI响应格式异常: " + parseError.getMessage());
            }
            
        } catch (Exception e) {
            if (e instanceof RuntimeException) {
                throw e; // 重新抛出已处理的异常
            }
            log.error("❌ AI API调用异常", e);
            throw new RuntimeException("AI服务连接失败: " + e.getMessage(), e);
        }
    }
}
