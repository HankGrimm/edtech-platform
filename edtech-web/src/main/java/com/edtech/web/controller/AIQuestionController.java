package com.edtech.web.controller;

import com.edtech.ai.model.GeneratedQuestionVO;
import com.edtech.ai.service.ContentGenerationService;
import com.edtech.ai.service.OpenSatService;
import com.edtech.core.util.RedisUtils;
import com.edtech.model.entity.KnowledgePoint;
import com.edtech.model.entity.Question;
import com.edtech.model.mapper.KnowledgePointMapper;
import com.edtech.model.mapper.QuestionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;

import java.io.BufferedReader;
import java.io.StringReader;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI 动态出题专用控制器
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AIQuestionController {

    private final ContentGenerationService contentService;
    private final OpenSatService openSatService;
    private final QuestionMapper questionMapper;
    private final KnowledgePointMapper knowledgePointMapper;
    private final RedisUtils redisUtils;

    @PostMapping("/generate-question")
    public Map<String, Object> generateQuestion(@RequestBody GenerateQuestionRequest request) {
        log.info("出题请求: studentId={}, subject={}, difficulty={}, source={}",
                request.studentId, request.subject, request.difficulty, request.source);

        try {
            String difficulty = request.difficulty != null ? request.difficulty : "Medium";
            String source = request.source != null ? request.source : "opensat";
            boolean isEnglish = "english".equalsIgnoreCase(request.subject)
                    || "Reading & Writing".equalsIgnoreCase(request.subject);
            boolean isMath = "math".equalsIgnoreCase(request.subject);

            GeneratedQuestionVO aiQuestion = null;
            String strategyCode = "AI_GENERATED";
            double probability = 0.5;

            if ("opensat".equalsIgnoreCase(source)) {
                if (isEnglish) {
                    String domain = request.domain != null ? request.domain : "Information and Ideas";
                    List<GeneratedQuestionVO> list = openSatService.fetchEnglishQuestions(domain, 1);
                    if (!list.isEmpty()) {
                        aiQuestion = list.get(0);
                        strategyCode = "OPENSAT";
                    }
                } else if (isMath) {
                    List<GeneratedQuestionVO> list = openSatService.fetchMathQuestions(1);
                    if (!list.isEmpty()) {
                        aiQuestion = list.get(0);
                        String analysis = aiQuestion.getAnalysis();
                        strategyCode = (analysis != null && analysis.startsWith("[AI生成]")) ? "AI_GENERATED" : "OPENSAT";
                    }
                }
            }

            // Qwen fallback
            if (aiQuestion == null) {
                String kpName = "综合练习";
                if (request.knowledgePointId != null) {
                    KnowledgePoint kp = knowledgePointMapper.selectById(request.knowledgePointId);
                    if (kp != null) kpName = kp.getName();
                } else if (request.subject != null) {
                    kpName = request.subject + " 综合训练";
                }

                String masteryKey = String.format("student:%s:mastery", request.studentId);
                String mistakeKey = String.format("student:%s:common_mistakes", request.studentId);
                String wrongFreqKey = String.format("student:%s:wrong_freq", request.studentId);

                if (request.knowledgePointId != null) {
                    Object masteryObj = redisUtils.hGet(masteryKey, request.knowledgePointId.toString());
                    if (masteryObj != null) probability = Double.parseDouble(masteryObj.toString());
                }

                String commonMistakes = "暂无历史错误记录";
                if (request.knowledgePointId != null) {
                    Object mistakeObj = redisUtils.hGet(mistakeKey, request.knowledgePointId.toString());
                    if (mistakeObj != null) commonMistakes = mistakeObj.toString();
                }

                String lastWrong = "暂无";
                if (request.knowledgePointId != null) {
                    Double wrongCount = redisUtils.zScore(wrongFreqKey, request.knowledgePointId.toString());
                    if (wrongCount != null && wrongCount > 0)
                        lastWrong = String.format("该知识点错误%d次", wrongCount.intValue());
                }

                log.info("Qwen fallback: kp={}, mastery={}, difficulty={}", kpName, probability, difficulty);
                aiQuestion = contentService.generateRemedialQuestion(kpName, probability, commonMistakes, lastWrong, 0, difficulty);
                strategyCode = "AI_GENERATED";
            }

            Question question = new Question();
            question.setContent(aiQuestion.getStem());
            question.setKnowledgePointId(request.knowledgePointId);
            question.setCorrectAnswer(aiQuestion.getCorrectAnswer());
            if (aiQuestion.getOptions() != null) {
                question.setOptions(cn.hutool.json.JSONUtil.toJsonStr(aiQuestion.getOptions()));
            }
            BigDecimal difficultyValue = switch (difficulty) {
                case "Easy" -> BigDecimal.valueOf(0.3);
                case "Hard" -> BigDecimal.valueOf(0.8);
                default -> BigDecimal.valueOf(0.5);
            };
            question.setDifficulty(difficultyValue);
            question.setCreatedAt(LocalDateTime.now());
            question.setType(99);
            questionMapper.insert(question);

            Map<String, Object> questionData = new HashMap<>();
            questionData.put("id", question.getId());
            questionData.put("content", aiQuestion.getStem());
            questionData.put("options", aiQuestion.getOptions());
            questionData.put("correctAnswer", aiQuestion.getCorrectAnswer());
            questionData.put("analysis", aiQuestion.getAnalysis());
            questionData.put("knowledgePointId", request.knowledgePointId);
            questionData.put("difficulty", difficulty);
            questionData.put("aiGenerated", "AI_GENERATED".equals(strategyCode));

            String strategyLabel = "OPENSAT".equals(strategyCode)
                    ? "OpenSAT 真题"
                    : String.format("🤖 AI智能出题 (%s难度)", difficulty);

            Map<String, Object> response = new HashMap<>();
            response.put("data", questionData);
            response.put("strategy", strategyLabel);
            response.put("strategyCode", strategyCode);
            response.put("studentMastery", probability);

            log.info("题目生成成功: ID={}, source={}", question.getId(), strategyCode);
            return response;

        } catch (Exception e) {
            log.error("出题失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "🤖 AI正在思考中，请稍后重试...");
            errorResponse.put("retryable", true);
            return errorResponse;
        }
    }

    @PostMapping("/explain")
    public Map<String, Object> explainQuestion(@RequestBody ExplainRequest request) {
        log.info("AI解析请求: 题目长度={}",
                request.questionContent != null ? request.questionContent.length() : 0);

        try {
            String explanation = contentService.generateExplanation(
                    request.questionContent,
                    request.wrongAnswer,
                    request.correctAnswer
            );

            Map<String, Object> response = new HashMap<>();
            response.put("explanation", explanation);
            response.put("success", true);
            return response;

        } catch (Exception e) {
            log.error("AI解析失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("explanation", "🤖 AI解析服务暂时繁忙，请稍后重试。\n\n**提示**: 请仔细检查题目条件和计算步骤。");
            errorResponse.put("success", false);
            return errorResponse;
        }
    }

    @PostMapping("/generate-batch")
    public Map<String, Object> generateBatch(@RequestBody GenerateBatchRequest request) {
        int total = request.total != null ? request.total : 27;
        String subject = request.subject != null ? request.subject : "Reading & Writing";
        boolean isEnglish = "Reading & Writing".equalsIgnoreCase(subject);
        boolean isMath = "Math".equalsIgnoreCase(subject);
        List<Map<String, Object>> questions = new ArrayList<>();

        try {
            if (isEnglish) {
                String[] domains = {"Information and Ideas", "Craft and Structure", "Expression of Ideas", "Standard English Conventions"};
                int perDomain = total / domains.length;
                int remainder = total % domains.length;
                for (int d = 0; d < domains.length; d++) {
                    int count = perDomain + (d < remainder ? 1 : 0);
                    List<GeneratedQuestionVO> list = openSatService.fetchEnglishQuestions(domains[d], count);
                    for (GeneratedQuestionVO vo : list) {
                        questions.add(voToMap(vo, "OPENSAT", domains[d]));
                    }
                }
            } else if (isMath) {
                List<GeneratedQuestionVO> list = openSatService.fetchMathQuestions(total);
                for (GeneratedQuestionVO vo : list) {
                    questions.add(voToMap(vo, "OPENSAT", null));
                }
            }
        } catch (Exception e) {
            log.error("批量出题失败", e);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("questions", questions);
        response.put("total", questions.size());
        return response;
    }

    private Map<String, Object> voToMap(GeneratedQuestionVO vo, String strategyCode, String domain) {
        Map<String, Object> q = new HashMap<>();
        q.put("id", System.nanoTime());
        q.put("stem", vo.getStem());
        q.put("options", vo.getOptions());
        q.put("correctAnswer", vo.getCorrectAnswer());
        q.put("analysis", vo.getAnalysis() != null ? vo.getAnalysis() : "");
        q.put("strategyCode", strategyCode);
        q.put("domain", domain);
        return q;
    }

    public static class GenerateBatchRequest {
        public String subject;
        public Integer total;
    }

    public static class GenerateQuestionRequest {
        public Long studentId;
        public String subject;
        public Long knowledgePointId;
        public String difficulty = "Medium";
        public String source = "opensat"; // "opensat" or "ai"
        public String domain; // R&W domain
    }

    public static class ExplainRequest {
        public String questionContent;
        public String wrongAnswer;
        public String correctAnswer;
    }

    @GetMapping(value = "/explain-stream", produces = "text/event-stream")
    public SseEmitter explainStream(
            @RequestParam String questionContent,
            @RequestParam String wrongAnswer,
            @RequestParam String correctAnswer) {
        SseEmitter emitter = new SseEmitter(60000L);
        String prompt = contentService.buildExplanationPrompt(questionContent, wrongAnswer, correctAnswer);

        new Thread(() -> {
            try {
                String rawBody = contentService.callQwenStreamRaw(prompt);
                if (rawBody == null) {
                    emitter.send(SseEmitter.event().name("error").data("AI服务异常"));
                    emitter.complete();
                    return;
                }
                BufferedReader reader = new BufferedReader(new StringReader(rawBody));
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("data: ")) {
                        String data = line.substring(6).trim();
                        if ("[DONE]".equals(data)) break;
                        try {
                            JSONObject chunk = JSONUtil.parseObj(data);
                            String delta = chunk.getJSONArray("choices")
                                    .getJSONObject(0)
                                    .getJSONObject("delta")
                                    .getStr("content");
                            if (delta != null && !delta.isEmpty()) {
                                emitter.send(SseEmitter.event().name("chunk").data(delta));
                            }
                        } catch (Exception ignored) {}
                    }
                }
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();
            } catch (Exception e) {
                log.error("SSE stream error", e);
                try { emitter.completeWithError(e); } catch (Exception ignored) {}
            }
        }).start();

        return emitter;
    }

    @PostMapping("/exam-report")
    public Map<String, Object> generateExamReport(@RequestBody ExamReportRequest request) {
        log.info("生成考试报告: 题目数={}, subject={}",
                request.questions != null ? request.questions.size() : 0, request.subject);
        try {
            String rawJson = contentService.generateExamReport(request.questions, request.subject);

            String clean = rawJson.trim();
            if (clean.startsWith("```json")) clean = clean.substring(7);
            else if (clean.startsWith("```")) clean = clean.substring(3);
            if (clean.endsWith("```")) clean = clean.substring(0, clean.length() - 3);
            int start = clean.indexOf("{");
            int end = clean.lastIndexOf("}");
            if (start >= 0 && end > start) clean = clean.substring(start, end + 1);

            cn.hutool.json.JSONObject report = cn.hutool.json.JSONUtil.parseObj(clean);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("report", report);
            return response;
        } catch (Exception e) {
            log.error("生成报告失败", e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return err;
        }
    }

    public static class ExamReportRequest {
        public String subject;
        public List<Map<String, Object>> questions;
    }
}
