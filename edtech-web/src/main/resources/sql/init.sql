-- ============================================================
-- EdTech Platform - Consolidated Database Initialization
-- ============================================================

CREATE DATABASE IF NOT EXISTS `edtech_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `edtech_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1. User (用户表)
-- ==========================================
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT 'BCrypt 密码',
  `email` VARCHAR(100) COMMENT '邮箱',
  `phone` VARCHAR(20) COMMENT '手机号',
  `nickname` VARCHAR(50) COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT '/avatars/default.png',
  `role` VARCHAR(20) DEFAULT 'STUDENT' COMMENT 'ADMIN, TEACHER, STUDENT, PARENT',
  `grade` VARCHAR(20) COMMENT '年级',
  `school` VARCHAR(100) COMMENT '学校',
  `invite_code` VARCHAR(20) DEFAULT NULL COMMENT '邀请码(家长注册后生成)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_invite_code` (`invite_code`)
) ENGINE=InnoDB COMMENT='用户表';

-- 默认用户 (密码均为 123456 的 BCrypt 哈希)
INSERT INTO `user` (`id`, `username`, `password`, `nickname`, `role`, `grade`) VALUES
(1, 'student', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '小明同学', 'STUDENT', '高三'),
(2, 'admin',   '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '管理员',   'ADMIN',   NULL),
(3, 'parent',  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '小明家长', 'PARENT',  NULL)
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `nickname` = VALUES(`nickname`), `role` = VALUES(`role`), `grade` = VALUES(`grade`);

-- ==========================================
-- 2. Knowledge Point (知识点)
-- ==========================================
CREATE TABLE IF NOT EXISTS `knowledge_point` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `name` VARCHAR(100) NOT NULL COMMENT '知识点名称',
  `description` TEXT COMMENT '描述',
  `subject` VARCHAR(50) NOT NULL COMMENT '所属学科 (e.g. Math, Physics)',
  `parent_id` BIGINT DEFAULT '0' COMMENT '父级ID',
  `p_init` DECIMAL(5,4) DEFAULT '0.1' COMMENT 'BKT: Initial P(L0)',
  `p_transit` DECIMAL(5,4) DEFAULT '0.1' COMMENT 'BKT: Transit P(T)',
  `p_guess` DECIMAL(5,4) DEFAULT '0.2' COMMENT 'BKT: Guess P(G)',
  `p_slip` DECIMAL(5,4) DEFAULT '0.1' COMMENT 'BKT: Slip P(S)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_subject` (`subject`)
) ENGINE=InnoDB COMMENT='知识点表';

-- ==========================================
-- 3. Knowledge Prerequisite (知识点前驱关系)
-- ==========================================
CREATE TABLE IF NOT EXISTS `knowledge_prerequisite` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `knowledge_point_id` BIGINT NOT NULL COMMENT '知识点 ID',
  `prereq_point_id` BIGINT NOT NULL COMMENT '前驱知识点 ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kp_prereq` (`knowledge_point_id`, `prereq_point_id`),
  INDEX `idx_kp` (`knowledge_point_id`),
  INDEX `idx_prereq` (`prereq_point_id`)
) ENGINE=InnoDB COMMENT='知识点前驱关系表';

-- ==========================================
-- 4. Question (题目)
-- ==========================================
CREATE TABLE IF NOT EXISTS `question` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '题目 ID',
  `content` TEXT NOT NULL COMMENT '题干',
  `difficulty` DECIMAL(3,2) DEFAULT '0.5' COMMENT '难度等级 (0.0-1.0)',
  `knowledge_point_id` BIGINT NOT NULL COMMENT '关联的知识点 ID',
  `type` TINYINT DEFAULT '1' COMMENT '题型 (1:单选, 2:填空, etc)',
  `options` JSON COMMENT '选项 (如果是选择题)',
  `correct_answer` TEXT COMMENT '参考答案',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_kp` (`knowledge_point_id`)
) ENGINE=InnoDB COMMENT='题目表';

-- ==========================================
-- 5. Student Exercise Log (学生答题记录)
-- ==========================================
CREATE TABLE IF NOT EXISTS `student_exercise_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT NOT NULL COMMENT '学生 ID',
  `question_id` BIGINT NOT NULL COMMENT '题目 ID',
  `result` TINYINT(1) NOT NULL COMMENT '答题结果 (0:错, 1:对)',
  `duration` INT DEFAULT '0' COMMENT '耗时 (秒)',
  `submit_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '答题时间',
  PRIMARY KEY (`id`),
  INDEX `idx_student_q` (`student_id`, `question_id`),
  INDEX `idx_time` (`submit_time`)
) ENGINE=InnoDB COMMENT='学生答题记录';

-- ==========================================
-- 6. Knowledge State (知识状态)
-- ==========================================
CREATE TABLE IF NOT EXISTS `knowledge_state` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT NOT NULL COMMENT '学生 ID',
  `knowledge_point_id` BIGINT NOT NULL COMMENT '知识点 ID',
  `mastery_probability` DECIMAL(5,4) NOT NULL DEFAULT '0.0000' COMMENT '掌握概率 (0-1)',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_kp` (`student_id`, `knowledge_point_id`)
) ENGINE=InnoDB COMMENT='学生知识状态';

-- ==========================================
-- 7. Mistake Book (错题本)
-- ==========================================
CREATE TABLE IF NOT EXISTS `mistake_book` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT NOT NULL COMMENT '学生 ID',
  `question_id` BIGINT NOT NULL COMMENT '题目 ID',
  `error_count` INT DEFAULT '1' COMMENT '错误次数',
  `last_error_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最近一次错误时间',
  `is_resolved` TINYINT(1) DEFAULT '0' COMMENT '是否已掌握',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_q` (`student_id`, `question_id`)
) ENGINE=InnoDB COMMENT='智能错题本';

-- ==========================================
-- 8. Subscription Plan (订阅套餐)
-- ==========================================
CREATE TABLE IF NOT EXISTS `subscription_plan` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '套餐名称',
  `price` DECIMAL(10,2) NOT NULL COMMENT '价格',
  `duration_days` INT NOT NULL COMMENT '有效天数',
  `features` JSON COMMENT '功能列表',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COMMENT='订阅套餐';

INSERT INTO `subscription_plan` (`id`, `name`, `price`, `duration_days`, `features`) VALUES
(1, '月度Pro', 9.99,  30,  '["AI_TUTOR","UNLIMITED_PRACTICE","MISTAKE_ANALYSIS"]'),
(2, '年度Pro', 99.00, 365, '["AI_TUTOR","UNLIMITED_PRACTICE","MISTAKE_ANALYSIS","OFFLINE_DOWNLOAD","PRIORITY_SUPPORT"]')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ==========================================
-- 9. Platform Order (订单表)
-- ==========================================
CREATE TABLE IF NOT EXISTS `platform_order` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(64) NOT NULL UNIQUE COMMENT '订单号',
  `user_id` BIGINT NOT NULL COMMENT '用户 ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
  `status` VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING,PAID,CANCELLED,REFUNDED',
  `payment_method` VARCHAR(20) COMMENT 'STRIPE,ALIPAY,MOCK',
  `transaction_id` VARCHAR(100) COMMENT '支付流水号',
  `plan_snapshot` JSON COMMENT '套餐快照',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `paid_at` DATETIME,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB COMMENT='订单表';

-- ==========================================
-- 10. User Points & Stats (用户积分与统计)
-- ==========================================
CREATE TABLE IF NOT EXISTS `user_points` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户 ID',
  `total_points` INT DEFAULT '0' COMMENT '总积分',
  `current_streak` INT DEFAULT '0' COMMENT '当前连胜天数',
  `longest_streak` INT DEFAULT '0' COMMENT '最长连胜天数',
  `last_active_date` DATE DEFAULT NULL COMMENT '最后活跃日期',
  `total_practice_count` INT DEFAULT '0' COMMENT '总练习题目数',
  `total_correct_count` INT DEFAULT '0' COMMENT '总正确题目数',
  `total_practice_time` INT DEFAULT '0' COMMENT '总练习时长(分钟)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`)
) ENGINE=InnoDB COMMENT='用户积分与统计';

-- ==========================================
-- 11. Achievement (成就定义)
-- ==========================================
CREATE TABLE IF NOT EXISTS `achievement` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL COMMENT '成就代码',
  `name` VARCHAR(100) NOT NULL COMMENT '成就名称',
  `description` TEXT COMMENT '成就描述',
  `icon` VARCHAR(100) DEFAULT 'trophy',
  `category` VARCHAR(50) DEFAULT 'general' COMMENT '分类 (streak, mastery, practice)',
  `rarity` VARCHAR(20) DEFAULT 'common' COMMENT '稀有度 (common, rare, epic, legendary)',
  `points_reward` INT DEFAULT '10' COMMENT '积分奖励',
  `condition_type` VARCHAR(50) COMMENT '解锁条件类型',
  `condition_value` INT COMMENT '解锁条件值',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB COMMENT='成就定义';

INSERT INTO `achievement` (`code`, `name`, `description`, `icon`, `category`, `rarity`, `points_reward`, `condition_type`, `condition_value`) VALUES
('FIRST_BLOOD',   '初试锋芒',   '完成第一道练习题',         'zap',       'practice', 'common',    10,   'practice_count',      1),
('STREAK_3',      '小小坚持',   '连续学习3天',              'flame',     'streak',   'common',    30,   'streak_days',         3),
('STREAK_7',      '周周进步',   '连续学习7天',              'flame',     'streak',   'rare',      70,   'streak_days',         7),
('STREAK_30',     '月度学霸',   '连续学习30天',             'flame',     'streak',   'epic',      300,  'streak_days',         30),
('PRACTICE_50',   '勤学苦练',   '累计完成50道题',           'book-open', 'practice', 'common',    50,   'practice_count',      50),
('PRACTICE_100',  '百题斩',     '累计完成100道题',          'book-open', 'practice', 'rare',      100,  'practice_count',      100),
('PRACTICE_500',  '五百题王',   '累计完成500道题',          'book-open', 'practice', 'epic',      500,  'practice_count',      500),
('MASTERY_1',     '初露头角',   '首次掌握一个知识点',       'medal',     'mastery',  'common',    20,   'mastery_count',       1),
('MASTERY_5',     '融会贯通',   '掌握5个知识点',            'medal',     'mastery',  'rare',      100,  'mastery_count',       5),
('MASTERY_ALL',   '全科达人',   '掌握所有知识点',           'crown',     'mastery',  'legendary', 1000, 'mastery_count',       -1),
('ACCURACY_90',   '精准射手',   '单次练习正确率达90%',      'target',    'accuracy', 'rare',      80,   'accuracy_percent',    90),
('SPEED_DEMON',   '闪电侠',     '5分钟内完成10道题',        'timer',     'speed',    'rare',      60,   'speed_questions',     10),
('NIGHT_OWL',     '夜猫子',     '在22点后完成练习',         'moon',      'special',  'common',    15,   'special',             1),
('EARLY_BIRD',    '早起鸟儿',   '在6点前完成练习',          'sun',       'special',  'common',    15,   'special',             2),
('PERFECTIONIST', '完美主义者', '连续答对20题',             'star',      'accuracy', 'epic',      200,  'consecutive_correct', 20)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ==========================================
-- 12. User Achievement (用户已获成就)
-- ==========================================
CREATE TABLE IF NOT EXISTS `user_achievement` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户 ID',
  `achievement_id` BIGINT NOT NULL COMMENT '成就 ID',
  `unlocked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_ach` (`user_id`, `achievement_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB COMMENT='用户已获成就';

-- ==========================================
-- 13. Daily Goal (每日目标)
-- ==========================================
CREATE TABLE IF NOT EXISTS `daily_goal` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户 ID',
  `goal_date` DATE NOT NULL COMMENT '目标日期',
  `target_questions` INT DEFAULT '10' COMMENT '目标题数',
  `target_minutes` INT DEFAULT '30' COMMENT '目标时长(分钟)',
  `completed_questions` INT DEFAULT '0' COMMENT '已完成题数',
  `completed_minutes` INT DEFAULT '0' COMMENT '已完成时长',
  `is_completed` TINYINT(1) DEFAULT '0',
  `reward_claimed` TINYINT(1) DEFAULT '0',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `goal_date`),
  INDEX `idx_date` (`goal_date`)
) ENGINE=InnoDB COMMENT='每日目标';

-- ==========================================
-- 14. Practice Session (练习会话)
-- ==========================================
CREATE TABLE IF NOT EXISTS `practice_session` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户 ID',
  `session_date` DATE NOT NULL COMMENT '练习日期',
  `start_time` DATETIME COMMENT '开始时间',
  `end_time` DATETIME COMMENT '结束时间',
  `duration_minutes` INT DEFAULT '0' COMMENT '时长(分钟)',
  `questions_attempted` INT DEFAULT '0' COMMENT '尝试题数',
  `questions_correct` INT DEFAULT '0' COMMENT '正确题数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_date` (`user_id`, `session_date`)
) ENGINE=InnoDB COMMENT='练习会话记录';

-- ==========================================
-- 15. Leaderboard Weekly (周排行榜)
-- ==========================================
CREATE TABLE IF NOT EXISTS `leaderboard_weekly` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户 ID',
  `week_start` DATE NOT NULL COMMENT '周开始日期',
  `weekly_points` INT DEFAULT '0',
  `weekly_streak` INT DEFAULT '0',
  `weekly_practice_count` INT DEFAULT '0',
  `rank_points` INT DEFAULT '0',
  `rank_streak` INT DEFAULT '0',
  `rank_practice` INT DEFAULT '0',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_week` (`user_id`, `week_start`),
  INDEX `idx_week` (`week_start`)
) ENGINE=InnoDB COMMENT='周排行榜快照';

-- ==========================================
-- 16. Parent Control (家长控制)
-- ==========================================
CREATE TABLE IF NOT EXISTS `parent_control` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT NOT NULL COMMENT '家长用户 ID',
  `child_id` BIGINT NOT NULL COMMENT '孩子用户 ID',
  `daily_time_limit` INT DEFAULT '120' COMMENT '每日时间限制(分钟)',
  `allow_start_hour` INT DEFAULT '8' COMMENT '允许开始时间(小时)',
  `allow_end_hour` INT DEFAULT '22' COMMENT '允许结束时间(小时)',
  `notify_weekly_report` TINYINT(1) DEFAULT '1',
  `notify_weak_points` TINYINT(1) DEFAULT '1',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_parent_child` (`parent_id`, `child_id`)
) ENGINE=InnoDB COMMENT='家长控制设置';

-- ==========================================
-- 17. User Settings (用户设置)
-- ==========================================
CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `nickname` VARCHAR(50) DEFAULT NULL,
  `real_name` VARCHAR(50) DEFAULT NULL,
  `grade` VARCHAR(20) DEFAULT NULL,
  `subject` VARCHAR(50) DEFAULT NULL,
  `goal` VARCHAR(255) DEFAULT NULL,
  `daily_goal` INT DEFAULT 30 COMMENT '每日题目目标',
  `difficulty_preference` INT DEFAULT 50 COMMENT '难度偏好 0-100',
  `strategy_weights` JSON DEFAULT NULL,
  `correction_mode` TINYINT(1) DEFAULT 0,
  `duration_reminder` TINYINT(1) DEFAULT 0,
  `duration_reminder_minutes` INT DEFAULT 45,
  `night_pause` TINYINT(1) DEFAULT 1,
  `night_pause_start` VARCHAR(5) DEFAULT '22:00',
  `night_pause_end` VARCHAR(5) DEFAULT '07:00',
  `notify_daily` TINYINT(1) DEFAULT 1,
  `notify_daily_time` VARCHAR(5) DEFAULT '20:00',
  `notify_weekly` TINYINT(1) DEFAULT 1,
  `notify_achievement` TINYINT(1) DEFAULT 1,
  `notify_browser` TINYINT(1) DEFAULT 1,
  `notify_email` TINYINT(1) DEFAULT 0,
  `theme` VARCHAR(20) DEFAULT 'system',
  `font_size` VARCHAR(10) DEFAULT 'medium',
  `animations_enabled` TINYINT(1) DEFAULT 1,
  `sound_enabled` TINYINT(1) DEFAULT 1,
  `privacy_visibility` VARCHAR(20) DEFAULT 'private' COMMENT 'private/parent/teacher',
  `data_contribution` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB COMMENT='用户设置表';

-- ==========================================
-- 18. Parent Bindings (家长绑定)
-- ==========================================
CREATE TABLE IF NOT EXISTS `parent_bindings` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `parent_id` BIGINT NOT NULL COMMENT '家长用户ID',
  `student_id` BIGINT NOT NULL COMMENT '学生用户ID',
  `status` VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING/ACTIVE/REJECTED',
  `permissions` JSON DEFAULT NULL,
  `daily_time_limit` INT DEFAULT 120 COMMENT '每日最大时长限制(分钟)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_parent_student` (`parent_id`, `student_id`)
) ENGINE=InnoDB COMMENT='家长绑定表';

-- ==========================================
-- 19. Learning Resource (学习资源)
-- ==========================================
CREATE TABLE IF NOT EXISTS `learning_resource` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `knowledge_point_id` BIGINT NOT NULL,
  `type` ENUM('VIDEO', 'PDF', 'INTERACTIVE') NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `meta_data` JSON COMMENT 'Duration, size, transcript',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='学习资源';

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- Migration: Add invite_code to user table
-- ==========================================
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `invite_code` VARCHAR(20) DEFAULT NULL COMMENT '邀请码(家长注册后生成)';
ALTER TABLE `user` ADD UNIQUE KEY IF NOT EXISTS `uk_invite_code` (`invite_code`);
