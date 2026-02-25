package com.edtech.web;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edtech.model.entity.User;
import com.edtech.model.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;

@SpringBootApplication(exclude = {RabbitAutoConfiguration.class})
@ComponentScan("com.edtech")
@MapperScan("com.edtech.model.mapper")
public class EdTechApplication {

    public static void main(String[] args) {
        SpringApplication.run(EdTechApplication.class, args);
    }

    /**
     * 启动时检查默认用户是否存在，不存在则创建，已存在则不动
     */
    @Bean
    ApplicationRunner initDefaultUsers(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        return args -> {
            Map<String, String[]> defaults = Map.of(
                "admin",   new String[]{"admin123", "ADMIN"},
                "student", new String[]{"123456",   "STUDENT"},
                "parent",  new String[]{"123456",   "PARENT"}
            );
            defaults.forEach((username, info) -> {
                Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, username));
                if (count == 0) {
                    User user = new User();
                    user.setUsername(username);
                    user.setPassword(passwordEncoder.encode(info[0]));
                    user.setRole(info[1]);
                    user.setNickname(username);
                    userMapper.insert(user);
                }
            });
        };
    }
}
