package com.edtech.ai.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.edtech.ai.model.GeneratedQuestionVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OpenSatService {

    private static final Logger log = LoggerFactory.getLogger(OpenSatService.class);
    private static final String BASE_URL = "https://pinesat.com/api/questions";

    @Autowired
    private ContentGenerationService contentGenerationService;

    /**
     * Fetch Reading & Writing questions from OpenSAT API.
     *
     * @param domain one of: "Information and Ideas", "Craft and Structure",
     *               "Expression of Ideas", "Standard English Conventions"
     * @param limit  number of questions to fetch
     * @return list of GeneratedQuestionVO
     */
    public List<GeneratedQuestionVO> fetchEnglishQuestions(String domain, int limit) {
        log.info("Fetching OpenSAT english questions: domain={}, limit={}", domain, limit);
        String url = BASE_URL + "?section=english&domain=" + encodeParam(domain) + "&limit=" + limit;
        return fetchFromOpenSat(url);
    }

    /**
     * Fetch Math questions from OpenSAT API, falling back to Qwen if not enough.
     *
     * @param limit number of questions needed
     * @return list of GeneratedQuestionVO
     */
    public List<GeneratedQuestionVO> fetchMathQuestions(int limit) {
        log.info("Fetching OpenSAT math questions: limit={}", limit);
        String url = BASE_URL + "?section=math&limit=" + limit;
        List<GeneratedQuestionVO> results = fetchFromOpenSat(url);

        if (results.size() < limit) {
            int needed = limit - results.size();
            log.info("OpenSAT returned {} math questions, need {} more from Qwen fallback", results.size(), needed);
            for (int i = 0; i < needed; i++) {
                try {
                    GeneratedQuestionVO fallback = contentGenerationService.generateRemedialQuestion(
                            "Math", 0.5, "none", "none", 0, "Medium"
                    );
                    String existing = fallback.getAnalysis();
                    fallback.setAnalysis("[AI生成] " + (existing != null ? existing : ""));
                    results.add(fallback);
                } catch (Exception e) {
                    log.warn("Qwen fallback failed for math question #{}: {}", i + 1, e.getMessage());
                }
            }
        }

        return results;
    }

    private List<GeneratedQuestionVO> fetchFromOpenSat(String url) {
        List<GeneratedQuestionVO> questions = new ArrayList<>();
        try (HttpResponse response = HttpRequest.get(url)
                .header("Accept", "application/json")
                .timeout(10000)
                .execute()) {

            log.info("OpenSAT API status: {}", response.getStatus());

            if (!response.isOk()) {
                log.error("OpenSAT API error: status={}, body={}", response.getStatus(), response.body());
                return questions;
            }

            String body = response.body();
            log.debug("OpenSAT raw response: {}", body);

            JSONArray arr = JSONUtil.parseArray(body);
            for (int i = 0; i < arr.size(); i++) {
                JSONObject item = arr.getJSONObject(i);
                GeneratedQuestionVO vo = mapToVO(item);
                if (vo != null) {
                    questions.add(vo);
                }
            }

            log.info("Parsed {} questions from OpenSAT", questions.size());

        } catch (Exception e) {
            log.error("Failed to fetch from OpenSAT: {}", e.getMessage(), e);
        }
        return questions;
    }

    private GeneratedQuestionVO mapToVO(JSONObject item) {
        try {
            GeneratedQuestionVO vo = new GeneratedQuestionVO();

            // The actual API response wraps content inside a "question" object:
            // { "question": { "question": "stem", "choices": {"A":"...","B":"..."}, "correct_answer":"A", "explanation":"..." }, "difficulty":"Medium", "domain":"..." }
            JSONObject inner = item.getJSONObject("question");
            if (inner == null) inner = item; // fallback: flat structure

            // stem
            String stem = inner.getStr("question");
            if (stem == null || stem.isEmpty()) stem = inner.getStr("stem");
            if (stem == null || stem.isEmpty()) stem = item.getStr("question");
            if (stem == null || stem.isEmpty()) {
                log.warn("Skipping OpenSAT item with no stem: {}", item);
                return null;
            }

            // paragraph context (prepend if present)
            String paragraph = inner.getStr("paragraph");
            if (paragraph != null && !paragraph.isEmpty() && !"null".equals(paragraph)) {
                stem = paragraph + "\n\n" + stem;
            }
            vo.setStem(stem);

            // options: "choices" is a map {"A":"...","B":"...","C":"...","D":"..."}
            List<String> opts = new ArrayList<>();
            JSONObject choicesMap = inner.getJSONObject("choices");
            if (choicesMap != null) {
                for (String key : new String[]{"A", "B", "C", "D"}) {
                    String val = choicesMap.getStr(key);
                    if (val != null) opts.add(key + ". " + val);
                }
            }
            // fallback: try array formats
            if (opts.isEmpty()) {
                JSONArray choicesArr = inner.getJSONArray("answer_choices");
                if (choicesArr == null) choicesArr = inner.getJSONArray("options");
                if (choicesArr != null) {
                    for (int i = 0; i < choicesArr.size(); i++) {
                        Object choice = choicesArr.get(i);
                        if (choice instanceof JSONObject) {
                            JSONObject c = (JSONObject) choice;
                            String id = c.getStr("id");
                            String content = c.getStr("content");
                            opts.add((id != null ? id + ". " : "") + (content != null ? content : c.toString()));
                        } else {
                            opts.add(choice.toString());
                        }
                    }
                }
            }
            vo.setOptions(opts.isEmpty() ? List.of("A. Option A", "B. Option B", "C. Option C", "D. Option D") : opts);

            // correct answer
            String correct = inner.getStr("correct_answer");
            if (correct == null) correct = inner.getStr("answer");
            if (correct == null) correct = item.getStr("correct_answer");
            vo.setCorrectAnswer(correct != null ? correct : "A");

            // analysis
            String analysis = inner.getStr("explanation");
            if (analysis == null) analysis = inner.getStr("rationale");
            if (analysis == null) analysis = inner.getStr("analysis");
            vo.setAnalysis(analysis != null ? analysis : "");

            // difficulty
            String difficulty = item.getStr("difficulty");
            vo.setDifficulty(difficulty != null ? difficulty : "Medium");

            return vo;
        } catch (Exception e) {
            log.warn("Failed to map OpenSAT item to VO: {}", e.getMessage());
            return null;
        }
    }

    private String encodeParam(String value) {
        if (value == null) return "";
        try {
            return java.net.URLEncoder.encode(value, "UTF-8");
        } catch (Exception e) {
            return value.replace(" ", "%20");
        }
    }
}
