-- Database Initialization Script for EdTech Platform (Updated)

CREATE DATABASE IF NOT EXISTS `edtech_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `edtech_db`;

-- ==========================================
-- 1. Knowledge Point (知识点)
-- ==========================================
CREATE TABLE IF NOT EXISTS `knowledge_point` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `name` VARCHAR(100) NOT NULL COMMENT '知识点名称',
  `description` TEXT COMMENT '描述',
  `subject` VARCHAR(50) NOT NULL COMMENT '所属学科 (e.g. Math, Physics)',
  `parent_id` BIGINT DEFAULT '0' COMMENT '父级ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_subject` (`subject`)
) ENGINE=InnoDB COMMENT='知识点表';

-- ==========================================
-- 2. Question (题目)
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
-- 3. Student Exercise Log (学生答题记录)
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
) ENGINE=InnoDB COMMENT='学生答题记录 (DKT输入)';

-- ==========================================
-- 4. Knowledge State (知识状态)
-- ==========================================
CREATE TABLE IF NOT EXISTS `knowledge_state` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT NOT NULL COMMENT '学生 ID',
  `knowledge_point_id` BIGINT NOT NULL COMMENT '知识点 ID',
  `mastery_probability` DECIMAL(5,4) NOT NULL DEFAULT '0.0000' COMMENT '掌握概率 (0-1)',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_kp` (`student_id`, `knowledge_point_id`)
) ENGINE=InnoDB COMMENT='学生知识状态';

-- ==========================================
-- 5. Mistake Book (错题本)
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
-- 6. Knowledge Prerequisite (知识点前驱关系)
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
-- 7. User (用户表)
-- ==========================================
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT 'BCrypt 密码',
  `email` VARCHAR(100) COMMENT '邮箱',
  `nickname` VARCHAR(50) COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT '/avatars/default.png',
  `role` VARCHAR(20) DEFAULT 'STUDENT' COMMENT 'ADMIN, TEACHER, STUDENT, PARENT',
  `grade` VARCHAR(20) COMMENT '年级',
  `school` VARCHAR(100) COMMENT '学校',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB COMMENT='用户表';

-- 默认用户 (密码均为 BCrypt 加密)
-- student / 123456
-- admin   / admin123
-- parent  / 123456
INSERT INTO `user` (`id`, `username`, `password`, `nickname`, `role`, `grade`) VALUES
(1, 'student', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '小明同学', 'STUDENT', '高三'),
(2, 'admin',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员',   'ADMIN',   NULL),
(3, 'parent',  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '小明家长', 'PARENT',  NULL)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

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
