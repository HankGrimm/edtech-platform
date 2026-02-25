package com.edtech.web.controller;

import com.edtech.model.entity.UserSettings;
import com.edtech.web.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) {
            return (Long) auth.getPrincipal();
        }
        return 1L;
    }

    @GetMapping
    public UserSettings getSettings() {
        return settingsService.getSettings(getCurrentUserId());
    }

    @PutMapping
    public UserSettings updateSettings(@RequestBody UserSettings settings) {
        settings.setUserId(getCurrentUserId());
        return settingsService.updateSettings(settings);
    }

    @PostMapping("/bind-parent")
    public void bindParent(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        settingsService.bindParent(getCurrentUserId(), code);
    }
}
