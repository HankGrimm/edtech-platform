package com.edtech.ai.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI服务诊断工具 - 用于排查AI调用问题
 */
@Service
@Slf4j
public class AIServiceDiagnostic {

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url:https://dashscope.aliyuncs.com/compatible-mode}")
    private String baseUrl;

    /**
     * 诊断AI服务连接和配置
     */
    public Map<String, Object> diagnoseAIService() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("🔍 开始AI服务诊断...");
            
            // 1. 检查配置
            result.put("baseUrl", baseUrl);
            result.put("hasApiKey", apiKey != null && !apiKey.isEmpty());
            result.put("keyLength", apiKey != null ? apiKey.length() : 0);
            result.put("keyPrefix", apiKey != null && apiKey.length() > 10 ? apiKey.substring(0, 10) + "..." : "无");
            
            if (apiKey == null || apiKey.isEmpty() || apiKey.startsWith("sk-请在")) {
                result.put("status", "CONFIG_ERROR");
                result.put("message", "API密钥未正确配置");
                return result;
            }
            
            // 2. 测试简单的API调用
            String testResponse = testSimpleAICall();
            result.put("status", "SUCCESS");
            result.put("message", "AI服务连接正常");
            result.put("testResponse", testResponse);
            result.put("responseLength", testResponse.length());
            
            log.info("✅ AI服务诊断成功");
            
        } catch (Exception e) {
            log.error("❌ AI服务诊断失败", e);
            result.put("status", "ERROR");
            result.put("message", e.getMessage());
            result.put("errorType", e.getClass().getSimpleName());
            
            // 详细错误信息
            if (e.getMessage().contains("401")) {
                result.put("suggestion", "API密钥无效，请检查密钥是否正确");
            } else if (e.getMessage().contains("timeout")) {
                result.put("suggestion", "网络超时，请检查网络连接");
            } else if (e.getMessage().contains("403")) {
                result.put("suggestion", "API密钥权限不足或余额不足");
            } else {
                result.put("suggestion", "请检查网络连接和API配置");
            }
        }
        
        return result;
    }

    /**
     * 测试简单的AI调用
     */
    private String testSimpleAICall() {
        String url = baseUrl + "/v1/chat/completions";
        
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", "请回答：1+1等于几？只需要回答数字。");

        Map<String, Object> body = new HashMap<>();
        body.put("model", "qwen-plus");
        body.put("messages", List.of(message));
        body.put("temperature", 0.1);
        body.put("max_tokens", 10);

        log.info("🔗 测试AI API调用: {}", url);
        log.info("📝 请求体: {}", JSONUtil.toJsonStr(body));

        try (HttpResponse response = HttpRequest.post(url)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(JSONUtil.toJsonStr(body))
                .timeout(15000)
                .execute()) {

            log.info("📡 响应状态: {}", response.getStatus());
            log.info("📄 响应内容: {}", response.body());

            if (!response.isOk()) {
                throw new RuntimeException("AI API调用失败: " + response.getStatus() + " - " + response.body());
            }

            JSONObject json = JSONUtil.parseObj(response.body());
            String content = json.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getStr("content");
                    
            log.info("✅ AI响应成功: {}", content);
            return content;
        }
    }

    /**
     * 测试数学题目生成
     */
    public String testMathQuestionGeneration() {
        String url = baseUrl + "/v1/chat/completions";
        
        String prompt = """
                请生成一道简单的数学选择题，输出JSON格式：
                {
                  "content": "题干",
                  "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
                  "correctAnswer": "A",
                  "analysis": "解析"
                }
                
                题目要求：计算 2+3 的值
                """;

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "qwen-plus");
        body.put("messages", List.of(message));
        body.put("temperature", 0.3);
        body.put("max_tokens", 500);

        try (HttpResponse response = HttpRequest.post(url)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(JSONUtil.toJsonStr(body))
                .timeout(30000)
                .execute()) {

            if (!response.isOk()) {
                throw new RuntimeException("数学题目生成失败: " + response.getStatus() + " - " + response.body());
            }

            JSONObject json = JSONUtil.parseObj(response.body());
            return json.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getStr("content");
        }
    }
}