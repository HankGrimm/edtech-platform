package com.edtech.web.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edtech.model.entity.KnowledgePoint;
import com.edtech.model.entity.KnowledgeState;
import com.edtech.model.entity.StudentExerciseLog;
import com.edtech.model.mapper.KnowledgePointMapper;
import com.edtech.model.mapper.KnowledgeStateMapper;
import com.edtech.model.mapper.StudentExerciseLogMapper;
import com.edtech.model.vo.KnowledgeStateVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@Slf4j
@RequiredArgsConstructor
public class DashboardController {

    private final KnowledgeStateMapper knowledgeStateMapper;
    private final KnowledgePointMapper knowledgePointMapper;
    private final StudentExerciseLogMapper studentExerciseLogMapper;

    /**
     * 获取学生知识状态雷达图数据
     * ECharts 前端可直接使用
     */
    @GetMapping("/radar/{studentId}")
    public List<KnowledgeStateVO> getStudentRadarData(@PathVariable Long studentId) {
        log.info("Fetching radar chart data for student: {}", studentId);

        // 1. 查询该学生的所有知识状态
        List<KnowledgeState> states = knowledgeStateMapper.selectList(new LambdaQueryWrapper<KnowledgeState>()
                .eq(KnowledgeState::getStudentId, studentId));

        if (states.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. 批量查询关联的知识点信息
        List<Long> kpIds = states.stream().map(KnowledgeState::getKnowledgePointId).collect(Collectors.toList());
        List<KnowledgePoint> kps = knowledgePointMapper.selectBatchIds(kpIds);
        Map<Long, String> kpNameMap = kps.stream()
                .collect(Collectors.toMap(KnowledgePoint::getId, KnowledgePoint::getName));

        // 3. 组装 VO
        return states.stream().map(state -> {
            String name = kpNameMap.getOrDefault(state.getKnowledgePointId(), "Unknown KP");
            BigDecimal score = state.getMasteryProbability();
            
            // 简单的分级逻辑
            String level;
            double val = score.doubleValue();
            if (val >= 0.8) level = "Master";
            else if (val >= 0.5) level = "Proficient";
            else level = "Novice";

            return new KnowledgeStateVO(state.getKnowledgePointId(), name, score, level);
        }).collect(Collectors.toList());
    }

    /**
     * 预测考试成绩 (Linear Regression Model)
     */
    @GetMapping("/prediction/{studentId}")
    public Map<String, Object> predictScore(@PathVariable Long studentId) {
        List<KnowledgeState> states = knowledgeStateMapper.selectList(new LambdaQueryWrapper<KnowledgeState>()
                .eq(KnowledgeState::getStudentId, studentId));

        double predictedScore = 0.0;
        if (!states.isEmpty()) {
            double avgProb = states.stream()
                    .map(KnowledgeState::getMasteryProbability)
                    .mapToDouble(BigDecimal::doubleValue)
                    .average()
                    .orElse(0.0);
            predictedScore = avgProb * 100;
        }

        // 根据答题记录数动态计算置信度：记录越多越可信，上限 0.95
        long practiceCount = studentExerciseLogMapper.selectCount(
                new LambdaQueryWrapper<StudentExerciseLog>()
                        .eq(StudentExerciseLog::getStudentId, studentId));
        double confidence = Math.min(0.95, 0.3 + practiceCount * 0.01);
        // 知识点覆盖率也影响置信度
        if (!states.isEmpty()) {
            long totalKp = knowledgePointMapper.selectCount(null);
            if (totalKp > 0) {
                double coverage = (double) states.size() / totalKp;
                confidence = Math.min(0.95, confidence * (0.5 + 0.5 * coverage));
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("studentId", studentId);
        result.put("predictedScore", Math.round(predictedScore));
        result.put("confidence", Math.round(confidence * 100.0) / 100.0);
        return result;
    }
}
