package com.edtech.core.mq;

import com.edtech.core.config.RabbitConfig;
import com.edtech.model.entity.MistakeBook;
import com.edtech.model.entity.StudentExerciseLog;
import com.edtech.model.mapper.MistakeBookMapper;
import com.edtech.model.mapper.StudentExerciseLogMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.rabbitmq.enabled", havingValue = "true", matchIfMissing = false)
public class PracticeConsumer {

    private final StudentExerciseLogMapper logMapper;
    private final MistakeBookMapper mistakeBookMapper;

    @RabbitListener(queues = RabbitConfig.PRACTICE_LOG_QUEUE)
    @Transactional(rollbackFor = Exception.class)
    public void processPracticeLog(Map<String, Object> message) {
        try {
            Long studentId = Long.valueOf(message.get("studentId").toString());
            Long questionId = Long.valueOf(message.get("questionId").toString());
            boolean isCorrect = Boolean.parseBoolean(message.get("isCorrect").toString());
            int duration = Integer.parseInt(message.get("duration").toString());
            String submitTimeStr = message.get("submitTime").toString();

            log.info("Async processing practice log: Student {}, Question {}", studentId, questionId);

            // 1. Save Log to MySQL
            StudentExerciseLog exerciseLog = new StudentExerciseLog();
            exerciseLog.setStudentId(studentId);
            exerciseLog.setQuestionId(questionId);
            exerciseLog.setResult(isCorrect ? 1 : 0);
            exerciseLog.setDuration(duration);
            exerciseLog.setSubmitTime(LocalDateTime.parse(submitTimeStr));
            logMapper.insert(exerciseLog);

            // 2. Update Mistake Book (if wrong)
            if (!isCorrect) {
                MistakeBook mistake = mistakeBookMapper.selectOne(new LambdaQueryWrapper<MistakeBook>()
                        .eq(MistakeBook::getStudentId, studentId)
                        .eq(MistakeBook::getQuestionId, questionId));

                if (mistake == null) {
                    mistake = new MistakeBook();
                    mistake.setStudentId(studentId);
                    mistake.setQuestionId(questionId);
                    mistake.setErrorCount(1);
                    mistake.setIsResolved(0);
                    mistake.setLastErrorTime(LocalDateTime.now());
                    mistakeBookMapper.insert(mistake);
                } else {
                    mistake.setErrorCount(mistake.getErrorCount() + 1);
                    mistake.setLastErrorTime(LocalDateTime.now());
                    mistake.setIsResolved(0);
                    mistakeBookMapper.updateById(mistake);
                }
            }

        } catch (Exception e) {
            log.error("Failed to process practice log", e);
            // In production: DLQ or retry
        }
    }
}
