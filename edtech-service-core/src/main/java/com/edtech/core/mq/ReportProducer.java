package com.edtech.core.mq;

import com.edtech.core.config.RabbitConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class ReportProducer {

    @Autowired(required = false)
    private RabbitTemplate rabbitTemplate;

    public void sendReportGenerationRequest(Long studentId) {
        if (rabbitTemplate == null) {
            log.warn("RabbitMQ disabled, skipping report request for student: {}", studentId);
            return;
        }
        Map<String, Object> message = new HashMap<>();
        message.put("studentId", studentId);
        message.put("timestamp", System.currentTimeMillis());
        message.put("type", "WEEKLY_REPORT");

        log.info("Sending report generation request for student: {}", studentId);
        rabbitTemplate.convertAndSend(RabbitConfig.REPORT_QUEUE, message);
    }
}

