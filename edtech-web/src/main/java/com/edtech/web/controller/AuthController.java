package com.edtech.web.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edtech.model.entity.User;
import com.edtech.model.mapper.UserMapper;
import com.edtech.web.security.JwtTokenProvider;
import com.edtech.web.service.OssService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final OssService ossService;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, request.getUsername()));

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed for [{}], db password=[{}], length={}",
                request.getUsername(),
                user != null ? user.getPassword() : "null",
                user != null ? user.getPassword().length() : 0);
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

    @PutMapping("/update-password")
    public Map<String, Object> updatePassword(@RequestBody Map<String, String> body) {
        Long userId = getCurrentUserId();
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("新密码不能少于6位");
        }
        User user = userMapper.selectById(userId);
        if (user == null) throw new RuntimeException("用户不存在");
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("原密码不正确");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
        return Map.of("success", true, "message", "密码修改成功");
    }

    @PutMapping("/update-phone")
    public Map<String, Object> updatePhone(@RequestBody Map<String, String> body) {
        Long userId = getCurrentUserId();
        String phone = body.get("phone");
        if (phone == null || !phone.matches("^1[3-9]\\d{9}$")) {
            throw new RuntimeException("手机号格式不正确");
        }
        User user = userMapper.selectById(userId);
        if (user == null) throw new RuntimeException("用户不存在");
        user.setPhone(phone);
        userMapper.updateById(user);
        return Map.of("success", true, "message", "手机号更新成功");
    }

    @PutMapping("/update-email")
    public Map<String, Object> updateEmail(@RequestBody Map<String, String> body) {
        Long userId = getCurrentUserId();
        String email = body.get("email");
        if (email == null || !email.matches("^[\\w.+-]+@[\\w-]+\\.[\\w.]+$")) {
            throw new RuntimeException("邮箱格式不正确");
        }
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email).ne(User::getId, userId));
        if (count > 0) throw new RuntimeException("该邮箱已被其他账号绑定");
        User user = userMapper.selectById(userId);
        if (user == null) throw new RuntimeException("用户不存在");
        user.setEmail(email);
        userMapper.updateById(user);
        return Map.of("success", true, "message", "邮箱绑定成功");
    }

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser() {
        Long userId = getCurrentUserId();
        User user = userMapper.selectById(userId);
        if (user == null) throw new RuntimeException("用户不存在");
        return Map.of(
            "userId", user.getId(),
            "username", user.getUsername(),
            "nickname", user.getNickname() != null ? user.getNickname() : user.getUsername(),
            "role", user.getRole(),
            "avatar", user.getAvatar() != null ? user.getAvatar() : ""
        );
    }

    @GetMapping("/profile")
    public Map<String, Object> getProfile() {
        Long userId = getCurrentUserId();
        User user = userMapper.selectById(userId);
        if (user == null) throw new RuntimeException("用户不存在");
        return Map.of("phone", user.getPhone() != null ? user.getPhone() : "",
                      "email", user.getEmail() != null ? user.getEmail() : "");
    }

    @PostMapping("/upload-avatar")
    public Map<String, Object> uploadAvatar(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) throw new RuntimeException("请选择要上传的文件");
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("只支持上传图片文件");
        }
        if (file.getSize() > 5 * 1024 * 1024) throw new RuntimeException("图片大小不能超过5MB");
        Long userId = getCurrentUserId();
        String url = ossService.uploadAvatar(file, userId);
        User user = userMapper.selectById(userId);
        if (user != null) {
            user.setAvatar(url);
            userMapper.updateById(user);
        }
        return Map.of("success", true, "avatarUrl", url);
    }

    /**
     * 获取/生成家长邀请码（仅 PARENT 角色可用）
     */
    @GetMapping("/invite-code")
    public Map<String, Object> getInviteCode() {
        Long userId = getCurrentUserId();
        User user = userMapper.selectById(userId);
        if (user == null) throw new RuntimeException("用户不存在");
        if (!"PARENT".equals(user.getRole())) throw new RuntimeException("仅家长账号可生成邀请码");

        if (user.getInviteCode() == null || user.getInviteCode().isEmpty()) {
            String code = "P" + userId + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
            user.setInviteCode(code);
            userMapper.updateById(user);
        }
        return Map.of("inviteCode", user.getInviteCode());
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) {
            return (Long) auth.getPrincipal();
        }
        return 1L;
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
