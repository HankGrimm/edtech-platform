package com.edtech.web.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edtech.model.entity.User;
import com.edtech.model.mapper.UserMapper;
import com.edtech.web.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, request.getUsername()));

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole(), 1L);
        log.info("用户登录成功: {}, role={}", user.getUsername(), user.getRole());
        return Map.of("token", token, "role", user.getRole(), "username", user.getUsername(), "userId", user.getId());
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterRequest request) {
        // 检查用户名是否已存在
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, request.getUsername()));
        if (count > 0) {
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setNickname(request.getUsername());
        user.setRole(request.getRole() != null ? request.getRole() : "STUDENT");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.insert(user);

        String token = tokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole(), 1L);
        return Map.of("token", token, "role", user.getRole(), "username", user.getUsername(), "userId", user.getId());
    }

    public static class LoginRequest {
        public String username;
        public String password;
        public String getUsername() { return username; }
        public String getPassword() { return password; }
    }

    public static class RegisterRequest {
        public String username;
        public String password;
        public String email;
        public String role;
        public String getUsername() { return username; }
        public String getPassword() { return password; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
    }
}
