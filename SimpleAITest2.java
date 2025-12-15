import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

/**
 * 简单的AI服务测试工具 v2
 */
public class SimpleAITest2 {
    
    public static void main(String[] args) {
        System.out.println("🤖 EdTech AI服务测试工具 v2");
        System.out.println("==============================");
        
        try {
            // 1. 读取.env文件
            Properties env = loadEnvFile();
            String apiKey = env.getProperty("AI_API_KEY");
            String baseUrl = env.getProperty("AI_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode");
            
            System.out.println("📋 配置检查:");
            System.out.println("  Base URL: " + baseUrl);
            System.out.println("  API Key: " + (apiKey != null ? apiKey.substring(0, 10) + "..." : "未配置"));
            
            if (apiKey == null || apiKey.isEmpty() || apiKey.startsWith("sk-请")) {
                System.out.println("❌ API密钥未正确配置");
                return;
            }
            
            // 2. 测试数学题目生成
            System.out.println("\n🧮 测试数学题目生成...");
            String mathResponse = testMathGeneration(baseUrl, apiKey);
            System.out.println("📄 完整AI响应:");
            System.out.println(mathResponse);
            
            // 3. 提取并显示题目内容
            String content = extractContent(mathResponse);
            System.out.println("\n✅ 提取的题目内容:");
            System.out.println(content);
            
            System.out.println("\n🎉 AI服务测试完成！");
            
        } catch (Exception e) {
            System.out.println("❌ 测试失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static Properties loadEnvFile() throws IOException {
        Properties props = new Properties();
        File envFile = new File(".env");
        
        if (!envFile.exists()) {
            throw new RuntimeException(".env文件不存在");
        }
        
        try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                
                int equalIndex = line.indexOf('=');
                if (equalIndex > 0) {
                    String key = line.substring(0, equalIndex).trim();
                    String value = line.substring(equalIndex + 1).trim();
                    props.setProperty(key, value);
                }
            }
        }
        
        return props;
    }
    
    private static String testMathGeneration(String baseUrl, String apiKey) throws Exception {
        String url = baseUrl + "/v1/chat/completions";
        
        String requestBody = """
            {
              "model": "qwen-plus",
              "messages": [
                {
                  "role": "user",
                  "content": "你是一位高中数学老师。请生成一道简单的数学选择题，输出JSON格式：\\n{\\n  \\"content\\": \\"题干\\",\\n  \\"options\\": [\\"A. 选项1\\", \\"B. 选项2\\", \\"C. 选项3\\", \\"D. 选项4\\"],\\n  \\"correctAnswer\\": \\"A\\",\\n  \\"analysis\\": \\"解析\\"\\n}\\n\\n要求：生成一道关于函数的基础题目，难度适中。"
                }
              ],
              "temperature": 0.7,
              "max_tokens": 800
            }
            """;
        
        return callAPI(url, apiKey, requestBody);
    }
    
    private static String callAPI(String urlString, String apiKey, String requestBody) throws Exception {
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        
        // 发送请求
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = requestBody.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }
        
        int responseCode = conn.getResponseCode();
        
        if (responseCode != 200) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine);
                }
                throw new RuntimeException("API调用失败: " + responseCode + " - " + response.toString());
            }
        }
        
        // 读取成功响应
        try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine);
            }
            return response.toString();
        }
    }
    
    private static String extractContent(String jsonResponse) {
        try {
            // 查找content字段
            int contentStart = jsonResponse.indexOf("\"content\":\"");
            if (contentStart >= 0) {
                contentStart += 11; // 跳过 "content":"
                
                // 简单查找结束引号（不处理复杂转义）
                int contentEnd = jsonResponse.indexOf("\",\"", contentStart);
                if (contentEnd < 0) {
                    contentEnd = jsonResponse.indexOf("\"}", contentStart);
                }
                
                if (contentEnd > contentStart) {
                    String content = jsonResponse.substring(contentStart, contentEnd);
                    // 处理基本转义
                    content = content.replace("\\n", "\n").replace("\\\"", "\"").replace("\\\\", "\\");
                    return content;
                }
            }
            
            return "无法提取content字段";
        } catch (Exception e) {
            return "解析错误: " + e.getMessage();
        }
    }
}