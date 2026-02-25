package com.edtech.core.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "spring.rabbitmq.enabled", havingValue = "true", matchIfMissing = false)
public class RabbitConfig {

    public static final String REPORT_QUEUE = "learning.report.queue";
    public static final String PRACTICE_LOG_QUEUE = "practice.log.queue";

    @Bean
    public Queue reportQueue() {
        // durable=true: 持久化队列
        return new Queue(REPORT_QUEUE, true);
    }

    @Bean
    public Queue practiceLogQueue() {
        return new Queue(PRACTICE_LOG_QUEUE, true);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
