package com.edtech.web.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edtech.model.entity.ParentBinding;
import com.edtech.model.entity.User;
import com.edtech.model.entity.UserSettings;
import com.edtech.model.mapper.ParentBindingMapper;
import com.edtech.model.mapper.UserMapper;
import com.edtech.model.mapper.UserSettingsMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final UserSettingsMapper settingsMapper;
    private final ParentBindingMapper bindingMapper;
    private final UserMapper userMapper;

    public UserSettings getSettings(Long userId) {
        UserSettings settings = settingsMapper.selectById(userId);
        if (settings == null) {
            settings = createDefaultSettings(userId);
            settingsMapper.insert(settings);
        }
        return settings;
    }

    @Transactional
    public UserSettings updateSettings(UserSettings settings) {
        // Ensure exists
        if (settingsMapper.selectById(settings.getUserId()) == null) {
            settingsMapper.insert(settings);
        } else {
            settingsMapper.updateById(settings);
        }
        return settings;
    }

    public void bindParent(Long studentId, String inviteCode) {
        // 通过邀请码查找家长用户
        User parent = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getInviteCode, inviteCode)
                .eq(User::getRole, "PARENT"));
        if (parent == null) {
            throw new RuntimeException("邀请码无效，请确认家长已生成邀请码");
        }

        // 检查是否已绑定
        Long existing = bindingMapper.selectCount(new LambdaQueryWrapper<ParentBinding>()
                .eq(ParentBinding::getStudentId, studentId)
                .eq(ParentBinding::getParentId, parent.getId()));
        if (existing > 0) {
            throw new RuntimeException("已绑定该家长账号");
        }

        ParentBinding binding = new ParentBinding();
        binding.setStudentId(studentId);
        binding.setParentId(parent.getId());
        binding.setStatus("ACTIVE");
        binding.setPermissions("{\"radar\":true,\"history\":true,\"report\":true}");
        binding.setDailyTimeLimit(120);
        bindingMapper.insert(binding);
    }

    private UserSettings createDefaultSettings(Long userId) {
        UserSettings s = new UserSettings();
        s.setUserId(userId);
        s.setNickname("Learner");
        s.setDailyGoal(30);
        s.setDifficultyPreference(50);
        s.setStrategyWeights("{\"mistake\":30,\"weakness\":30,\"review\":20,\"advance\":20}");
        s.setCorrectionMode(false);
        s.setDurationReminder(false);
        s.setNightPause(true);
        s.setNotifyDaily(true);
        s.setTheme("system");
        s.setFontSize("medium");
        s.setPrivacyVisibility("private");
        return s;
    }
}
