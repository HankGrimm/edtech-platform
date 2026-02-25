package com.edtech.web.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edtech.model.entity.*;
import com.edtech.model.mapper.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/achievement")
public class AchievementController {

    private static final Logger log = LoggerFactory.getLogger(AchievementController.class);

    private final AchievementMapper achievementMapper;
    private final UserAchievementMapper userAchievementMapper;
    private final UserPointsMapper userPointsMapper;
    private final UserMapper userMapper;
    private final KnowledgeStateMapper knowledgeStateMapper;
    private final KnowledgePointMapper knowledgePointMapper;

    public AchievementController(AchievementMapper achievementMapper,
                                  UserAchievementMapper userAchievementMapper,
                                  UserPointsMapper userPointsMapper,
                                  UserMapper userMapper,
                                  KnowledgeStateMapper knowledgeStateMapper,
                                  KnowledgePointMapper knowledgePointMapper) {
        this.achievementMapper = achievementMapper;
        this.userAchievementMapper = userAchievementMapper;
        this.userPointsMapper = userPointsMapper;
        this.userMapper = userMapper;
        this.knowledgeStateMapper = knowledgeStateMapper;
        this.knowledgePointMapper = knowledgePointMapper;
    }

    /**
     * 获取所有成就定义
     */
    @GetMapping("/all")
    public List<Achievement> getAllAchievements() {
        return achievementMapper.selectList(null);
    }

    /**
     * 获取用户已获得的成就ID列表
     */
    @GetMapping("/user/{userId}")
    public Map<String, Object> getUserAchievements(@PathVariable Long userId) {
        // Get all achievements
        List<Achievement> allAchievements = achievementMapper.selectList(null);
        
        // Get user's unlocked achievement IDs
        List<Long> unlockedIds = userAchievementMapper.selectAchievementIdsByUserId(userId);
        Set<Long> unlockedSet = new HashSet<>(unlockedIds);

        // Get user points for stats
        UserPoints points = userPointsMapper.selectOne(
                new LambdaQueryWrapper<UserPoints>().eq(UserPoints::getUserId, userId));

        // Build response
        List<Map<String, Object>> achievementList = allAchievements.stream().map(ach -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", ach.getId());
            item.put("code", ach.getCode());
            item.put("name", ach.getName());
            item.put("description", ach.getDescription());
            item.put("icon", ach.getIcon());
            item.put("category", ach.getCategory());
            item.put("rarity", ach.getRarity());
            item.put("pointsReward", ach.getPointsReward());
            item.put("unlocked", unlockedSet.contains(ach.getId()));
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("achievements", achievementList);
        result.put("totalUnlocked", unlockedIds.size());
        result.put("totalAchievements", allAchievements.size());
        
        if (points != null) {
            result.put("totalPoints", points.getTotalPoints());
            result.put("currentStreak", points.getCurrentStreak());
            result.put("longestStreak", points.getLongestStreak());
        }
        
        return result;
    }

    /**
     * 获取用户积分和统计信息
     */
    @GetMapping("/stats/{userId}")
    public UserPoints getUserStats(@PathVariable Long userId) {
        UserPoints points = userPointsMapper.selectOne(
                new LambdaQueryWrapper<UserPoints>().eq(UserPoints::getUserId, userId));
        if (points == null) {
            // Create default if not exists
            points = new UserPoints();
            points.setUserId(userId);
            points.setTotalPoints(0);
            points.setCurrentStreak(0);
            points.setLongestStreak(0);
            points.setTotalPracticeCount(0);
            points.setTotalCorrectCount(0);
            points.setTotalPracticeTime(0);
            userPointsMapper.insert(points);
        }
        return points;
    }

    /**
     * 获取掌握金牌列表(高掌握知识点) - 查 knowledge_state 表
     */
    @GetMapping("/mastery/{userId}")
    public List<Map<String, Object>> getMasteredKnowledgePoints(@PathVariable Long userId,
            @RequestParam(defaultValue = "0.8") double threshold) {
        List<KnowledgeState> states = knowledgeStateMapper.selectList(
                new LambdaQueryWrapper<KnowledgeState>()
                        .eq(KnowledgeState::getStudentId, userId)
                        .ge(KnowledgeState::getMasteryProbability, threshold)
                        .orderByDesc(KnowledgeState::getMasteryProbability));

        if (states.isEmpty()) return new ArrayList<>();

        List<Long> kpIds = states.stream().map(KnowledgeState::getKnowledgePointId).collect(Collectors.toList());
        List<KnowledgePoint> kps = knowledgePointMapper.selectBatchIds(kpIds);
        Map<Long, String> kpNameMap = kps.stream()
                .collect(Collectors.toMap(KnowledgePoint::getId, KnowledgePoint::getName));

        return states.stream().map(state -> {
            double val = state.getMasteryProbability().doubleValue();
            Map<String, Object> item = new HashMap<>();
            item.put("knowledgePointId", state.getKnowledgePointId());
            item.put("name", kpNameMap.getOrDefault(state.getKnowledgePointId(), "未知"));
            item.put("mastery", val);
            item.put("medal", val >= 0.95 ? "gold" : val >= 0.85 ? "silver" : "bronze");
            return item;
        }).collect(Collectors.toList());
    }
}
