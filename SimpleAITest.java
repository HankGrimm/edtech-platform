import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

/**
 * 简单的AI服务测试工具
 * 直接测试通义千问API，不依赖Spring Boot
 */
public class SimpleAITest {
    
    public static void main(String[] args) {
        System.out.println("🤖 EdTech AI服务独立测试工具");
        System.out.println("================================");
        
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
                System.out.println("请在.env文件中设置: AI_API_KEY=sk-your-actual-key");
                return;
            }
            
            // 2. 测试简单AI调用
            System.out.println("\n🧪 测试AI连接...");
            String simpleResponse = testSimpleCall(baseUrl, apiKey);
            System.out.println("✅ 简单测试成功: " + simpleResponse);
            
            // 3. 测试数学题目生成
            System.out.println("\n🧮 测试数学题目生成...");
            String mathResponse = testMathGeneration(baseUrl, apiKey);
            System.out.println("✅ 数学题目生成成功:");
            System.out.println(mathResponse);
            
            System.out.println("\n🎉 所有测试通过！AI服务工作正常。");
            
        } catch (Exception e) {
            System.out.println("❌ 测试失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static Properties loadEnvFile() throws IOException {
        Properties props = new Properties();
        File envFile = new File(".env");
        
        if (!envFile.exists()) {
            throw new RuntimeException(".env文件不存在，请复制.env.example为.env并配置API密钥");
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
    
    private static String testSimpleCall(String baseUrl, String apiKey) throws Exception {
        String url = baseUrl + "/v1/chat/completions";
        
        String requestBody = """
            {
              "model": "qwen-plus",
              "messages": [
                {
                  "role": "user",
                  "content": "请回答：1+1等于几？只需要回答数字。"
                }
              ],
              "temperature": 0.1,
              "max_tokens": 10
            }
            """;
        
        return callAPI(url, apiKey, requestBody);
    }
    
    private static String testMathGeneration(String baseUrl, String apiKey) throws Exception {
        String url = baseUrl + "/v1/chat/completions";
        
        String requestBody = """
            {
              "model": "qwen-plus",
              "messages": [
                {
                  "role": "user",
                  "content": "请生成一道简单的数学选择题，输出JSON格式：\\n{\\n  \\"content\\": \\"题干\\",\\n  \\"options\\": [\\"A. 选项1\\", \\"B. 选项2\\", \\"C. 选项3\\", \\"D. 选项4\\"],\\n  \\"correctAnswer\\": \\"A\\",\\n  \\"analysis\\": \\"解析\\"\\n}\\n\\n题目要求：计算 2+3 的值"
                }
              ],
              "temperature": 0.3,
              "max_tokens": 500
            }
            """;
        
        return callAPI(url, apiKey, requestBody);
    }
    
    private static String callAPI(String urlString, String apiKey, String requestBody) throws Exception {
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        // 设置请求方法和头部
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        
        // 发送请求体
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = requestBody.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }
        
        // 读取响应
        int responseCode = conn.getResponseCode();
        
        if (responseCode != 200) {
            // 读取错误响应
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                throw new RuntimeException("API调用失败: " + responseCode + " - " + response.toString());
            }
        }
        
        // 读取成功响应
        try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
            
            // 解析响应，提取content
            String responseStr = response.toString();
            
            // 简单的JSON解析（提取content字段）
            String responseStr = response.toString();
            
            // 查找content字段的内容
            int contentStart = responseStr.indexOf("\"content\":\"");
            if (contentStart >= 0) {
                contentStart += 11; // 跳过 "content":"
                
                // 找到content的结束位置（考虑转义字符）
                int contentEnd = contentStart;
                int escapeCount = 0;
                while (contentEnd < responseStr.length()) {
                    char c = responseStr.charAt(contentEnd);
                    if (c == '\\') {
                        escapeCount++;
                    } else if (c == '"' && escapeCount % 2 == 0) {
                        break; // 找到未转义的引号
                    } else {
                        escapeCount = 0;
                    }
                    contentEnd++;
                }
                
                if (contentEnd > contentStart) {
                    String content = responseStr.substring(contentStart, contentEnd);
                    // 处理转义字符
                    content = content.replace("\\n", "\n").replace("\\\"", "\"");
                    return content;
                }
            }
            
            return responseStr; // 如果解析失败，返回原始响应
        }
    }
}