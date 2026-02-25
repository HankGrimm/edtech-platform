package com.edtech.core.mq;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edtech.core.config.RabbitConfig;
import com.edtech.model.entity.StudentExerciseLog;
import com.edtech.model.mapper.StudentExerciseLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.rabbitmq.enabled", havingValue = "true", matchIfMissing = false)
public class ReportConsumer {

    private final StudentExerciseLogMapper exerciseLogMapper;

    @RabbitListener(queues = RabbitConfig.REPORT_QUEUE)
    public void processReportRequest(Map<String, Object> message) {
        Long studentId = Long.valueOf(message.get("studentId").toString());
        log.info("Processing weekly report for student: {}", studentId);

        try {
            // 1. Fetch this week's logs (Mock: Last 7 days)
            LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
            List<StudentExerciseLog> logs = exerciseLogMapper.selectList(new LambdaQueryWrapper<StudentExerciseLog>()
                    .eq(StudentExerciseLog::getStudentId, studentId)
                    .ge(StudentExerciseLog::getSubmitTime, sevenDaysAgo));

            if (logs.isEmpty()) {
                log.info("No exercise logs found for student {} in the last 7 days.", studentId);
                return;
            }

            // 2. Calculate Statistics
            long totalQuestions = logs.size();
            long correctCount = logs.stream().filter(l -> l.getResult() == 1).count();
            double accuracy = (double) correctCount / totalQuestions * 100;
            
            // Mock "Fastest Improving KP" (Real logic would query KnowledgeState history)
            String fastestImprovingKp = "Functions & Graphs"; 

            // 3. Generate Report (Log or Save to DB)
            log.info("===== Weekly Report Generated =====");
            log.info("Student ID: {}", studentId);
            log.info("Total Exercises: {}", totalQuestions);
            log.info("Accuracy: {}%", String.format("%.2f", accuracy));
            log.info("Fastest Improving Area: {}", fastestImprovingKp);
            log.info("===================================");

            // TODO: Save to 'learning_report' table or send email

        } catch (Exception e) {
            log.error("Error generating report for student: {}", studentId, e);
        }
    }
}
