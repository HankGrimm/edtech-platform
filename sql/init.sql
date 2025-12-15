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
