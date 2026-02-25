package com.edtech.web;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(exclude = {RabbitAutoConfiguration.class})
@ComponentScan("com.edtech")
@MapperScan("com.edtech.model.mapper")
public class EdTechApplication {

    public static void main(String[] args) {
        SpringApplication.run(EdTechApplication.class, args);
    }
}
