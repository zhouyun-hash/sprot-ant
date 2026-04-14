-- =============================================================================
-- 蚁数智动平台 — 完整数据库建表脚本
-- =============================================================================
-- 数据库：smart_sports (MySQL 8.0, utf8mb4)
-- 生成日期：2026-04-14
-- 数据源：backend/src/*/entities/*.entity.ts (TypeORM 实体定义)
-- 实体总数：45 张表，按 12 个业务领域分组
-- =============================================================================
-- 使用说明：
--   1. 首次部署时执行本脚本创建全部表结构
--   2. 后续增量变更通过迁移脚本管理
--   3. 种子数据见 db/seed_data.sql
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `smart_sports`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `smart_sports`;

-- =============================================================================
-- 领域1：用户与组织架构（7表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 学校表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `school` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '学校ID',
  `name`       VARCHAR(128)    NOT NULL                COMMENT '学校名称',
  `code`       VARCHAR(64)     NULL                    COMMENT '学校编码（教育局统一编码）',
  `address`    VARCHAR(512)    NULL                    COMMENT '学校地址',
  `phone`      VARCHAR(20)     NULL                    COMMENT '联系电话',
  `principal`  VARCHAR(128)    NULL                    COMMENT '校长姓名',
  `logo`       VARCHAR(512)    NULL                    COMMENT '学校Logo URL',
  `status`     VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/inactive',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学校信息表';

-- -----------------------------------------------------------------------------
-- 1.2 校区表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `campus` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '校区ID',
  `school_id`  BIGINT UNSIGNED NOT NULL                COMMENT '所属学校ID',
  `name`       VARCHAR(128)    NOT NULL                COMMENT '校区名称',
  `address`    VARCHAR(512)    NULL                    COMMENT '校区地址',
  `phone`      VARCHAR(20)     NULL                    COMMENT '联系电话',
  `status`     VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/inactive',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_campus_school` (`school_id`),
  CONSTRAINT `fk_campus_school` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校区信息表';

-- -----------------------------------------------------------------------------
-- 1.3 用户表（统一登录账号）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`   VARCHAR(64)     NOT NULL                COMMENT '登录用户名',
  `password`   VARCHAR(255)    NOT NULL                COMMENT '密码（BCrypt哈希）',
  `role`       VARCHAR(32)     NOT NULL DEFAULT 'student' COMMENT '默认角色：admin/school_admin/teacher/student/parent',
  `name`       VARCHAR(64)     NOT NULL DEFAULT ''     COMMENT '姓名/昵称',
  `phone`      VARCHAR(20)     NULL                    COMMENT '手机号',
  `avatar`     VARCHAR(512)    NULL                    COMMENT '头像URL',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户账号表（PC/移动端共用）';

-- -----------------------------------------------------------------------------
-- 1.4 年级表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grade` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '年级ID',
  `name`        VARCHAR(64)     NOT NULL                COMMENT '年级名称（如：一年级、七年级）',
  `sort_order`  INT             NOT NULL DEFAULT 0      COMMENT '排序序号',
  `school_year` VARCHAR(16)     NOT NULL                COMMENT '学年（如：2025-2026）',
  `school_id`   BIGINT UNSIGNED NULL                    COMMENT '所属学校ID',
  `status`      VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/inactive',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_grade_school` (`school_id`),
  CONSTRAINT `fk_grade_school` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='年级信息表';

-- -----------------------------------------------------------------------------
-- 1.5 班级表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `class` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '班级ID',
  `name`            VARCHAR(128)    NOT NULL                COMMENT '班级名称',
  `class_no`        VARCHAR(32)     NULL                    COMMENT '班级编号',
  `school_id`       BIGINT UNSIGNED NOT NULL                COMMENT '所属学校ID',
  `grade_id`        BIGINT UNSIGNED NOT NULL                COMMENT '所属年级ID',
  `grade`           VARCHAR(32)     NOT NULL                COMMENT '年级名称（冗余，便于查询）',
  `school_year`     VARCHAR(32)     NOT NULL                COMMENT '学年',
  `teacher_id`      BIGINT UNSIGNED NULL                    COMMENT '体育老师ID',
  `head_teacher_id` BIGINT UNSIGNED NULL                    COMMENT '班主任ID',
  `pe_teacher_id`   BIGINT UNSIGNED NULL                    COMMENT '体育组长ID',
  PRIMARY KEY (`id`),
  KEY `idx_class_school` (`school_id`),
  KEY `idx_class_grade` (`grade_id`),
  KEY `idx_class_teacher` (`teacher_id`),
  CONSTRAINT `fk_class_school` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_class_grade`  FOREIGN KEY (`grade_id`)  REFERENCES `grade`(`id`)  ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级信息表';

-- -----------------------------------------------------------------------------
-- 1.6 教师表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teacher` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '教师ID',
  `user_id`    BIGINT UNSIGNED NOT NULL                COMMENT '关联用户ID',
  `school_id`  BIGINT UNSIGNED NULL                    COMMENT '所属学校ID',
  `teacher_no` VARCHAR(32)     NOT NULL                COMMENT '教师工号',
  `subject`    VARCHAR(64)     NOT NULL DEFAULT '体育'  COMMENT '任教学科',
  PRIMARY KEY (`id`),
  KEY `idx_teacher_user` (`user_id`),
  KEY `idx_teacher_school` (`school_id`),
  CONSTRAINT `fk_teacher_user`   FOREIGN KEY (`user_id`)   REFERENCES `user`(`id`)   ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT `fk_teacher_school` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师信息表';

-- 班级表的教师外键（延迟添加，因 teacher 在 class 之后建）
ALTER TABLE `class`
  ADD CONSTRAINT `fk_class_teacher`      FOREIGN KEY (`teacher_id`)      REFERENCES `teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_class_head_teacher` FOREIGN KEY (`head_teacher_id`) REFERENCES `teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_class_pe_teacher`   FOREIGN KEY (`pe_teacher_id`)   REFERENCES `teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 1.7 学生表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '学生ID',
  `user_id`      BIGINT UNSIGNED NOT NULL                COMMENT '关联用户ID',
  `class_id`     BIGINT UNSIGNED NOT NULL                COMMENT '所属班级ID',
  `student_no`   VARCHAR(32)     NOT NULL                COMMENT '学号',
  `parent_phone` VARCHAR(20)     NULL                    COMMENT '家长手机号',
  `id_card`      VARCHAR(32)     NULL                    COMMENT '身份证号（脱敏存储）',
  `gender`       TINYINT UNSIGNED NULL                   COMMENT '性别：0=女 1=男',
  PRIMARY KEY (`id`),
  KEY `idx_student_user` (`user_id`),
  KEY `idx_student_class` (`class_id`),
  CONSTRAINT `fk_student_user`  FOREIGN KEY (`user_id`)  REFERENCES `user`(`id`)  ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生信息表';

-- -----------------------------------------------------------------------------
-- 1.8 家长-学生绑定表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `parent_student_access` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '绑定ID',
  `parent_user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '家长用户ID',
  `student_id`         BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
  `status`             VARCHAR(16)     NOT NULL DEFAULT 'pending' COMMENT '状态：pending/approved/rejected',
  `reviewed_by_user_id` BIGINT UNSIGNED NULL                   COMMENT '审核人用户ID',
  `reviewed_at`        DATETIME(3)     NULL                    COMMENT '审核时间',
  `created_at`         DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_parent_student` (`parent_user_id`, `student_id`),
  KEY `idx_psa_student` (`student_id`),
  CONSTRAINT `fk_psa_parent`  FOREIGN KEY (`parent_user_id`) REFERENCES `user`(`id`)    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_psa_student` FOREIGN KEY (`student_id`)     REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家长-学生绑定关系表';

-- =============================================================================
-- 领域2：RBAC权限（2表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 角色表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `name`        VARCHAR(64)     NOT NULL                COMMENT '角色名称',
  `code`        VARCHAR(32)     NOT NULL                COMMENT '角色编码（如：super_admin/school_admin/teacher）',
  `description` VARCHAR(256)    NULL                    COMMENT '角色描述',
  `permissions` JSON            NULL                    COMMENT '权限码数组（如：["school:read","student:write"]）',
  `status`      VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/inactive',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_name` (`name`),
  UNIQUE KEY `uk_role_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色定义表';

-- -----------------------------------------------------------------------------
-- 2.2 用户-角色关联表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_role` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `user_id`    BIGINT UNSIGNED NOT NULL                COMMENT '用户ID',
  `role_id`    BIGINT UNSIGNED NOT NULL                COMMENT '角色ID',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_ur_role` (`role_id`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-角色关联表（多对多）';

-- =============================================================================
-- 领域3：体测管理（4表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 体测任务表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `task` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `name`        VARCHAR(128)    NOT NULL                COMMENT '任务名称',
  `type`        VARCHAR(32)     NOT NULL                COMMENT '任务类型（exam/practice/simulation）',
  `grade_ids`   JSON            NOT NULL                COMMENT '关联年级ID数组',
  `class_ids`   JSON            NOT NULL                COMMENT '关联班级ID数组',
  `project_ids` JSON            NOT NULL                COMMENT '关联运动项目ID数组',
  `start_time`  DATETIME(3)     NOT NULL                COMMENT '开始时间',
  `end_time`    DATETIME(3)     NOT NULL                COMMENT '结束时间',
  `status`      VARCHAR(16)     NOT NULL DEFAULT 'draft' COMMENT '状态：draft/ongoing/finished/cancelled',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_task_status` (`status`),
  KEY `idx_task_time` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='体测任务表';

-- -----------------------------------------------------------------------------
-- 3.2 任务签到表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `task_checkin` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '签到ID',
  `task_id`    BIGINT UNSIGNED NOT NULL                COMMENT '任务ID',
  `student_id` BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
  `checked`    TINYINT(1)      NOT NULL DEFAULT 0      COMMENT '是否已签到：0=否 1=是',
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_checkin_task_student` (`task_id`, `student_id`),
  KEY `idx_checkin_student` (`student_id`),
  CONSTRAINT `fk_checkin_task`    FOREIGN KEY (`task_id`)    REFERENCES `task`(`id`)    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_checkin_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务签到表（学生检录）';

-- -----------------------------------------------------------------------------
-- 3.3 成绩表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `score` (
  `id`               BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '成绩ID',
  `task_id`          BIGINT UNSIGNED  NOT NULL                COMMENT '任务ID',
  `student_id`       BIGINT UNSIGNED  NOT NULL                COMMENT '学生ID',
  `project`          VARCHAR(64)      NOT NULL                COMMENT '运动项目名称',
  `result`           VARCHAR(64)      NOT NULL                COMMENT '成绩数值（字符串，含单位换算前原始值）',
  `unit`             VARCHAR(32)      NOT NULL                COMMENT '单位（次/秒/米/厘米）',
  `review_status`    VARCHAR(16)      NOT NULL DEFAULT 'pending' COMMENT '复核状态：pending/approved/rejected',
  `review_remark`    VARCHAR(255)     NULL                    COMMENT '复核备注',
  `ai_raw_data`      JSON             NULL                    COMMENT 'AI原始推理数据JSON',
  `sync_status`      TINYINT UNSIGNED NOT NULL DEFAULT 0      COMMENT '上报状态：0=未上报 1=已上报 2=上报失败',
  `sync_retry_count` TINYINT UNSIGNED NOT NULL DEFAULT 0      COMMENT '上报重试次数',
  `synced_at`        DATETIME(3)      NULL                    COMMENT '上报时间',
  `created_at`       DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`       DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_score_task` (`task_id`),
  KEY `idx_score_student` (`student_id`),
  KEY `idx_score_review` (`review_status`),
  KEY `idx_score_project` (`project`),
  CONSTRAINT `fk_score_task`    FOREIGN KEY (`task_id`)    REFERENCES `task`(`id`)    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_score_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='体测成绩表';

-- -----------------------------------------------------------------------------
-- 3.4 成绩审核表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `score_review` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '审核ID',
  `score_id`         BIGINT UNSIGNED NOT NULL                COMMENT '成绩ID',
  `reviewer_id`      BIGINT UNSIGNED NULL                    COMMENT '审核人用户ID',
  `status`           VARCHAR(32)     NOT NULL DEFAULT 'pending' COMMENT '审核状态：pending/approved/rejected',
  `original_result`  VARCHAR(128)    NULL                    COMMENT '原始成绩',
  `corrected_result` VARCHAR(128)    NULL                    COMMENT '修正后成绩',
  `reason`           TEXT            NULL                    COMMENT '审核原因',
  `comment`          TEXT            NULL                    COMMENT '审核备注',
  `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_sr_score` (`score_id`),
  KEY `idx_sr_reviewer` (`reviewer_id`),
  CONSTRAINT `fk_sr_score`    FOREIGN KEY (`score_id`)    REFERENCES `score`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sr_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `user`(`id`)  ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成绩审核记录表';

-- =============================================================================
-- 领域4：考试项目与标准（4表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4.1 运动项目表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_project` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `name`       VARCHAR(128)    NOT NULL                COMMENT '项目名称（跳绳/仰卧起坐/立定跳远/50米跑等）',
  `category`   VARCHAR(64)     NULL                    COMMENT '项目分类（力量/耐力/柔韧/速度）',
  `unit`       VARCHAR(16)     NULL                    COMMENT '默认单位（次/秒/米/厘米）',
  `score_type` VARCHAR(32)     NOT NULL DEFAULT 'count' COMMENT '计分方式：count/time/distance',
  `description` TEXT           NULL                    COMMENT '项目描述与规则',
  `params`     JSON            NULL                    COMMENT '扩展参数（AI识别配置等）',
  `enabled`    TINYINT         NOT NULL DEFAULT 1      COMMENT '是否启用：0=否 1=是',
  `sort_order` INT             NOT NULL DEFAULT 0      COMMENT '排序序号',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动项目定义表';

-- -----------------------------------------------------------------------------
-- 4.2 考核标准表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_standard` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '标准ID',
  `project_id`  BIGINT UNSIGNED NOT NULL                COMMENT '运动项目ID',
  `gender`      VARCHAR(32)     NOT NULL                COMMENT '性别：male/female/all',
  `age_min`     INT             NULL                    COMMENT '最小年龄',
  `age_max`     INT             NULL                    COMMENT '最大年龄',
  `grade_level` VARCHAR(32)     NULL                    COMMENT '年级水平（小学/初中/高中）',
  `score_rules` JSON            NULL                    COMMENT '评分规则JSON（阈值→等级映射）',
  `version`     VARCHAR(32)     NOT NULL DEFAULT 'v1'   COMMENT '标准版本号',
  `enabled`     TINYINT         NOT NULL DEFAULT 1      COMMENT '是否启用',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_es_project` (`project_id`),
  KEY `idx_es_gender_grade` (`gender`, `grade_level`),
  CONSTRAINT `fk_es_project` FOREIGN KEY (`project_id`) REFERENCES `exam_project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考核标准表（按性别/年龄/年级差异化）';

-- -----------------------------------------------------------------------------
-- 4.3 体测计划表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_plan` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '计划ID',
  `name`        VARCHAR(128)    NOT NULL                COMMENT '计划名称',
  `school_year` VARCHAR(16)     NOT NULL                COMMENT '学年',
  `status`      VARCHAR(32)     NOT NULL DEFAULT 'draft' COMMENT '状态：draft/active/completed',
  `start_date`  DATE            NULL                    COMMENT '开始日期',
  `end_date`    DATE            NULL                    COMMENT '结束日期',
  `project_ids` JSON            NULL                    COMMENT '关联项目ID数组',
  `grade_ids`   JSON            NULL                    COMMENT '关联年级ID数组',
  `description` TEXT            NULL                    COMMENT '计划描述',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='体测计划表';

-- -----------------------------------------------------------------------------
-- 4.4 体测批次表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_batch` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '批次ID',
  `plan_id`    BIGINT UNSIGNED NOT NULL                COMMENT '所属计划ID',
  `name`       VARCHAR(128)    NOT NULL                COMMENT '批次名称',
  `batch_date` DATE            NULL                    COMMENT '批次日期',
  `status`     VARCHAR(32)     NOT NULL DEFAULT 'pending' COMMENT '状态：pending/ongoing/completed',
  `class_ids`  JSON            NULL                    COMMENT '关联班级ID数组',
  `venue_id`   BIGINT UNSIGNED NULL                    COMMENT '场地ID',
  `notes`      TEXT            NULL                    COMMENT '备注',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_eb_plan` (`plan_id`),
  CONSTRAINT `fk_eb_plan` FOREIGN KEY (`plan_id`) REFERENCES `exam_plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='体测批次表';

-- =============================================================================
-- 领域5：作业管理（3表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 作业表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `homework` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '作业ID',
  `title`       VARCHAR(128)    NOT NULL                COMMENT '作业标题',
  `description` TEXT            NULL                    COMMENT '作业描述/要求',
  `deadline`    DATETIME(3)     NOT NULL                COMMENT '截止时间',
  `class_ids`   JSON            NOT NULL                COMMENT '关联班级ID数组',
  `created_by`  BIGINT UNSIGNED NOT NULL                COMMENT '创建者用户ID（教师）',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_hw_creator` (`created_by`),
  KEY `idx_hw_deadline` (`deadline`),
  CONSTRAINT `fk_hw_creator` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作业发布表';

-- -----------------------------------------------------------------------------
-- 5.2 作业提交表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `homework_submission` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '提交ID',
  `homework_id`   BIGINT UNSIGNED  NOT NULL                COMMENT '作业ID',
  `student_id`    BIGINT UNSIGNED  NOT NULL                COMMENT '学生ID',
  `content`       TEXT             NULL                    COMMENT '提交内容/文字描述',
  `video_url`     VARCHAR(1024)    NULL                    COMMENT '提交视频URL',
  `status`        VARCHAR(32)      NOT NULL DEFAULT 'submitted' COMMENT '状态：submitted/reviewed/returned',
  `teacher_score` DECIMAL(5,2)     NULL                    COMMENT '教师评分',
  `comment`       VARCHAR(500)     NULL                    COMMENT '教师评语',
  `ai_score`      DECIMAL(5,2)     NULL                    COMMENT 'AI评分',
  `submitted_at`  DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '提交时间',
  PRIMARY KEY (`id`),
  KEY `idx_hs_homework` (`homework_id`),
  KEY `idx_hs_student` (`student_id`),
  CONSTRAINT `fk_hs_homework` FOREIGN KEY (`homework_id`) REFERENCES `homework`(`id`) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT `fk_hs_student`  FOREIGN KEY (`student_id`)  REFERENCES `student`(`id`)  ON DELETE CASCADE  ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作业提交表';

-- -----------------------------------------------------------------------------
-- 5.3 作业批改表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `homework_correction` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '批改ID',
  `submission_id`   BIGINT UNSIGNED NOT NULL                COMMENT '提交ID',
  `reviewer_id`     BIGINT UNSIGNED NULL                    COMMENT '批改人用户ID',
  `ai_score`        DECIMAL(5,2)    NULL                    COMMENT 'AI评分',
  `manual_score`    DECIMAL(5,2)    NULL                    COMMENT '人工评分',
  `comment`         TEXT            NULL                    COMMENT '批改评语',
  `correction_type` VARCHAR(32)     NOT NULL                COMMENT '批改类型：ai/manual/ai_manual',
  `status`          VARCHAR(32)     NOT NULL DEFAULT 'pending' COMMENT '状态：pending/completed',
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_hc_submission` (`submission_id`),
  CONSTRAINT `fk_hc_submission` FOREIGN KEY (`submission_id`) REFERENCES `homework_submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作业批改记录表（AI+人工双重评分）';

-- =============================================================================
-- 领域6：教学管理（3表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 6.1 课表表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `course_schedule` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '课表ID',
  `class_id`    BIGINT UNSIGNED NOT NULL                COMMENT '班级ID',
  `teacher_id`  BIGINT UNSIGNED NULL                    COMMENT '授课教师ID',
  `subject`     VARCHAR(64)     NOT NULL DEFAULT '体育'  COMMENT '科目',
  `day_of_week` TINYINT         NOT NULL                COMMENT '星期几：1=周一 ... 7=周日',
  `period`      INT             NOT NULL                COMMENT '第几节课',
  `start_time`  VARCHAR(8)      NOT NULL                COMMENT '上课时间（HH:mm）',
  `end_time`    VARCHAR(8)      NOT NULL                COMMENT '下课时间（HH:mm）',
  `venue_id`    BIGINT UNSIGNED NULL                    COMMENT '场地ID',
  `school_year` VARCHAR(16)     NOT NULL                COMMENT '学年',
  `semester`    TINYINT         NOT NULL DEFAULT 1      COMMENT '学期：1=上学期 2=下学期',
  `status`      VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/suspended',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_cs_class` (`class_id`),
  KEY `idx_cs_teacher` (`teacher_id`),
  KEY `idx_cs_day_period` (`day_of_week`, `period`),
  CONSTRAINT `fk_cs_class`   FOREIGN KEY (`class_id`)   REFERENCES `class`(`id`)   ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT `fk_cs_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- -----------------------------------------------------------------------------
-- 6.2 教学计划表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teaching_plan` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '计划ID',
  `title`        VARCHAR(200)    NOT NULL                COMMENT '计划标题',
  `teacher_id`   BIGINT UNSIGNED NULL                    COMMENT '教师ID',
  `grade_id`     BIGINT UNSIGNED NULL                    COMMENT '适用年级ID',
  `school_year`  VARCHAR(16)     NOT NULL                COMMENT '学年',
  `semester`     TINYINT         NOT NULL DEFAULT 1      COMMENT '学期',
  `content`      TEXT            NULL                    COMMENT '计划内容',
  `resource_ids` JSON            NULL                    COMMENT '关联教学资源ID数组',
  `status`       VARCHAR(32)     NOT NULL DEFAULT 'draft' COMMENT '状态：draft/published/archived',
  `created_at`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tp_teacher` (`teacher_id`),
  CONSTRAINT `fk_tp_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教学计划表';

-- -----------------------------------------------------------------------------
-- 6.3 教学资源表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teaching_resource` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '资源ID',
  `title`          VARCHAR(200)    NOT NULL                COMMENT '资源标题',
  `type`           VARCHAR(32)     NOT NULL                COMMENT '类型：video/document/image/audio',
  `category`       VARCHAR(64)     NULL                    COMMENT '分类',
  `file_url`       VARCHAR(512)    NOT NULL                COMMENT '文件URL（OSS）',
  `file_size`      BIGINT UNSIGNED NOT NULL DEFAULT 0      COMMENT '文件大小（字节）',
  `description`    TEXT            NULL                    COMMENT '描述',
  `uploader_id`    BIGINT UNSIGNED NULL                    COMMENT '上传者用户ID',
  `download_count` INT             NOT NULL DEFAULT 0      COMMENT '下载次数',
  `status`         VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/archived',
  `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_tr_uploader` (`uploader_id`),
  KEY `idx_tr_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教学资源库';

-- =============================================================================
-- 领域7：设备与场地（3表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 7.1 设备表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `device` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `name`             VARCHAR(128)    NOT NULL                COMMENT '设备名称',
  `type`             VARCHAR(64)     NOT NULL                COMMENT '设备类型（camera/edge_box/sensor）',
  `sn`               VARCHAR(64)     NOT NULL                COMMENT '设备序列号',
  `ip`               VARCHAR(64)     NULL                    COMMENT 'IP地址',
  `status`           VARCHAR(32)     NOT NULL DEFAULT 'offline' COMMENT '状态：online/offline/error',
  `firmware_version` VARCHAR(64)     NULL                    COMMENT '固件版本',
  `school_id`        BIGINT UNSIGNED NULL                    COMMENT '所属学校ID',
  `location`         VARCHAR(256)    NULL                    COMMENT '安装位置描述',
  `last_heartbeat`   DATETIME        NULL                    COMMENT '最后心跳时间',
  `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_device_sn` (`sn`),
  KEY `idx_device_school` (`school_id`),
  KEY `idx_device_status` (`status`),
  CONSTRAINT `fk_device_school` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备管理表';

-- -----------------------------------------------------------------------------
-- 7.2 RTSP视频流表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rtsp_stream` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '视频流ID',
  `name`       VARCHAR(128)    NOT NULL                COMMENT '流名称',
  `url`        VARCHAR(512)    NOT NULL                COMMENT 'RTSP流地址',
  `device_id`  BIGINT UNSIGNED NULL                    COMMENT '关联设备ID',
  `status`     VARCHAR(32)     NOT NULL DEFAULT 'inactive' COMMENT '状态：active/inactive/error',
  `protocol`   VARCHAR(16)     NOT NULL DEFAULT 'rtsp' COMMENT '协议：rtsp/rtmp/webrtc',
  `resolution` VARCHAR(32)     NULL                    COMMENT '分辨率（如：1920x1080）',
  `fps`        INT             NOT NULL DEFAULT 25     COMMENT '帧率',
  `latency`    INT             NOT NULL DEFAULT 0      COMMENT '延迟(ms)',
  `encrypted`  TINYINT         NOT NULL DEFAULT 0      COMMENT '是否加密：0=否 1=是',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_rs_device` (`device_id`),
  CONSTRAINT `fk_rs_device` FOREIGN KEY (`device_id`) REFERENCES `device`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RTSP视频流配置表';

-- -----------------------------------------------------------------------------
-- 7.3 场地表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `venue` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '场地ID',
  `name`       VARCHAR(128)    NOT NULL                COMMENT '场地名称',
  `type`       VARCHAR(64)     NULL                    COMMENT '场地类型（操场/体育馆/活动室）',
  `location`   VARCHAR(512)    NULL                    COMMENT '位置描述',
  `capacity`   INT             NOT NULL DEFAULT 0      COMMENT '容纳人数',
  `status`     VARCHAR(32)     NOT NULL DEFAULT 'available' COMMENT '状态：available/occupied/maintenance',
  `facilities` TEXT            NULL                    COMMENT '设施配置描述',
  `rules`      TEXT            NULL                    COMMENT '使用规则',
  `school_id`  BIGINT UNSIGNED NULL                    COMMENT '所属学校ID',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_venue_school` (`school_id`),
  CONSTRAINT `fk_venue_school` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='场地资源表';

-- exam_batch 场地外键（延迟添加）
ALTER TABLE `exam_batch`
  ADD CONSTRAINT `fk_eb_venue` FOREIGN KEY (`venue_id`) REFERENCES `venue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- course_schedule 场地外键（延迟添加）
ALTER TABLE `course_schedule`
  ADD CONSTRAINT `fk_cs_venue` FOREIGN KEY (`venue_id`) REFERENCES `venue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- 领域8：AI识别与训练（5表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8.1 AI识别会话表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_session` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话记录ID',
  `session_id` VARCHAR(64)     NOT NULL                COMMENT 'AI会话唯一标识',
  `task_id`    BIGINT UNSIGNED NOT NULL                COMMENT '关联任务ID',
  `class_id`   BIGINT UNSIGNED NOT NULL                COMMENT '关联班级ID',
  `project`    VARCHAR(64)     NOT NULL                COMMENT '运动项目名称',
  `status`     VARCHAR(16)     NOT NULL DEFAULT 'running' COMMENT '状态：running/ended',
  `ended_at`   DATETIME(3)     NULL                    COMMENT '结束时间',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_session_id` (`session_id`),
  KEY `idx_ais_task` (`task_id`),
  KEY `idx_ais_class` (`class_id`),
  CONSTRAINT `fk_ais_task`  FOREIGN KEY (`task_id`)  REFERENCES `task`(`id`)  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ais_class` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI识别会话表';

-- -----------------------------------------------------------------------------
-- 8.2 AI识别记录表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_record` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `session_id` VARCHAR(64)     NOT NULL                COMMENT 'AI会话标识',
  `task_id`    BIGINT UNSIGNED NOT NULL                COMMENT '任务ID',
  `class_id`   BIGINT UNSIGNED NOT NULL                COMMENT '班级ID',
  `student_id` BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
  `count`      INT UNSIGNED    NOT NULL DEFAULT 0      COMMENT 'AI计数结果',
  `violations` JSON            NULL                    COMMENT '违规动作列表JSON',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_ar_session` (`session_id`),
  KEY `idx_ar_student` (`student_id`),
  KEY `idx_ar_task` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI识别结果记录表';

-- -----------------------------------------------------------------------------
-- 8.3 自主训练记录表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_record` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id`     BIGINT UNSIGNED NULL                    COMMENT '用户ID',
  `student_id`  BIGINT UNSIGNED NULL                    COMMENT '学生ID',
  `project`     VARCHAR(32)     NOT NULL                COMMENT '训练项目',
  `result_json` JSON            NULL                    COMMENT '训练结果JSON',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_tr_student` (`student_id`),
  KEY `idx_tr_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生自主训练记录表';

-- -----------------------------------------------------------------------------
-- 8.4 AI算法配置表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_config` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `name`        VARCHAR(128)    NOT NULL                COMMENT '配置名称',
  `category`    VARCHAR(64)     NOT NULL                COMMENT '分类（跳绳/仰卧起坐/人脸识别等）',
  `params`      JSON            NULL                    COMMENT '算法参数JSON',
  `version`     VARCHAR(32)     NOT NULL DEFAULT 'v1'   COMMENT '版本号',
  `status`      VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态',
  `description` TEXT            NULL                    COMMENT '配置描述',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI算法配置表';

-- -----------------------------------------------------------------------------
-- 8.5 AI模型管理表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_model` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '模型ID',
  `name`       VARCHAR(128)    NOT NULL                COMMENT '模型名称',
  `type`       VARCHAR(64)     NOT NULL                COMMENT '模型类型（pose_estimation/object_detection/face_recognition）',
  `file_url`   VARCHAR(512)    NULL                    COMMENT '模型文件URL',
  `version`    VARCHAR(32)     NOT NULL                COMMENT '模型版本',
  `status`     VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/deprecated',
  `accuracy`   DECIMAL(5,2)    NULL                    COMMENT '准确率(%)',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型管理表';

-- =============================================================================
-- 领域9：勋章与排行（3表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 9.1 勋章定义表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `badge` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '勋章ID',
  `name`            VARCHAR(128)    NOT NULL                COMMENT '勋章名称',
  `icon`            VARCHAR(512)    NULL                    COMMENT '勋章图标URL',
  `description`     TEXT            NULL                    COMMENT '勋章描述',
  `category`        VARCHAR(64)     NULL                    COMMENT '类别：skill/persistence/competition',
  `condition_type`  VARCHAR(64)     NULL                    COMMENT '触发条件类型（daily_login/score_above/streak等）',
  `condition_value` INT             NOT NULL DEFAULT 0      COMMENT '触发条件值',
  `status`          VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='勋章定义表';

-- -----------------------------------------------------------------------------
-- 9.2 勋章授予表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `badge_award` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '授予ID',
  `badge_id`   BIGINT UNSIGNED NOT NULL                COMMENT '勋章ID',
  `student_id` BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
  `awarded_at` DATETIME(3)     NOT NULL                COMMENT '授予时间',
  PRIMARY KEY (`id`),
  KEY `idx_ba_badge` (`badge_id`),
  KEY `idx_ba_student` (`student_id`),
  CONSTRAINT `fk_ba_badge`   FOREIGN KEY (`badge_id`)   REFERENCES `badge`(`id`)   ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ba_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='勋章授予记录表';

-- -----------------------------------------------------------------------------
-- 9.3 学校配置表（排行榜等）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `school_config` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key`  VARCHAR(64)     NOT NULL                COMMENT '配置键',
  `config_json` JSON            NULL                    COMMENT '配置值JSON',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_school_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学校级配置表（排行榜规则等）';

-- =============================================================================
-- 领域10：数据报告与预警（3表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 10.1 体质报告表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `report` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '报告ID',
  `student_id`       BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
  `radar_data`       JSON            NOT NULL                COMMENT '雷达图数据JSON（各项目得分）',
  `dimension_scores` JSON            NOT NULL                COMMENT '维度得分JSON（力量/速度/耐力/柔韧/协调）',
  `suggestions`      TEXT            NULL                    COMMENT 'AI生成的改善建议',
  `generated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '生成时间',
  `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_report_student` (`student_id`),
  CONSTRAINT `fk_report_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生体质报告表';

-- -----------------------------------------------------------------------------
-- 10.2 安全预警表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alert` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '预警ID',
  `class_id`        BIGINT UNSIGNED NULL                    COMMENT '班级ID',
  `student_id`      BIGINT UNSIGNED NULL                    COMMENT '学生ID',
  `type`            VARCHAR(64)     NOT NULL DEFAULT 'ai_violation' COMMENT '预警类型：ai_violation/heart_rate/fall/collision',
  `message`         TEXT            NOT NULL                COMMENT '预警信息描述',
  `status`          VARCHAR(16)     NOT NULL DEFAULT 'open' COMMENT '状态：open/resolved',
  `violation_count` INT UNSIGNED    NOT NULL DEFAULT 0      COMMENT '违规次数',
  `period_date`     VARCHAR(16)     NULL                    COMMENT '统计周期日期',
  `resolved_at`     DATETIME(3)     NULL                    COMMENT '解决时间',
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_alert_class` (`class_id`),
  KEY `idx_alert_student` (`student_id`),
  KEY `idx_alert_status` (`status`),
  KEY `idx_alert_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='安全预警表';

-- -----------------------------------------------------------------------------
-- 10.3 运动处方表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exercise_prescription` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '处方ID',
  `student_id`    BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
  `title`         VARCHAR(200)    NOT NULL                COMMENT '处方标题',
  `content`       TEXT            NULL                    COMMENT '处方内容描述',
  `category`      VARCHAR(64)     NULL                    COMMENT '分类（力量/耐力/柔韧/综合）',
  `exercises`     JSON            NULL                    COMMENT '锻炼项目列表JSON',
  `status`        VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/completed/expired',
  `source`        VARCHAR(32)     NULL                    COMMENT '来源：ai/manual',
  `duration_days` INT             NOT NULL DEFAULT 0      COMMENT '持续天数',
  `start_date`    DATE            NULL                    COMMENT '开始日期',
  `end_date`      DATE            NULL                    COMMENT '结束日期',
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_ep_student` (`student_id`),
  CONSTRAINT `fk_ep_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动处方表（AI个性化训练方案）';

-- =============================================================================
-- 领域11：消息通知（1表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 11.1 消息记录表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `message_record` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `title`       VARCHAR(200)    NOT NULL                COMMENT '消息标题',
  `content`     TEXT            NULL                    COMMENT '消息内容',
  `type`        VARCHAR(32)     NOT NULL DEFAULT 'notification' COMMENT '类型：notification/homework_remind/parent_msg/system',
  `target_type` VARCHAR(32)     NOT NULL DEFAULT 'all'  COMMENT '目标范围：all/class/student/teacher/parent',
  `target_ids`  JSON            NULL                    COMMENT '目标ID列表JSON',
  `sender_id`   BIGINT UNSIGNED NULL                    COMMENT '发送者用户ID',
  `status`      VARCHAR(32)     NOT NULL DEFAULT 'sent' COMMENT '状态：draft/sent/recalled',
  `read_count`  INT             NOT NULL DEFAULT 0      COMMENT '已读数量',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_mr_sender` (`sender_id`),
  KEY `idx_mr_type` (`type`),
  KEY `idx_mr_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息通知记录表';

-- =============================================================================
-- 领域12：系统管理（6表）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 12.1 操作审计日志表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id`       BIGINT UNSIGNED NULL                    COMMENT '操作人用户ID',
  `username`      VARCHAR(64)     NOT NULL DEFAULT ''     COMMENT '操作人用户名',
  `action`        VARCHAR(16)     NOT NULL                COMMENT '操作类型：CREATE/READ/UPDATE/DELETE',
  `resource`      VARCHAR(512)    NOT NULL                COMMENT '操作资源路径',
  `detail`        TEXT            NULL                    COMMENT '操作详情',
  `ip`            VARCHAR(64)     NOT NULL DEFAULT ''     COMMENT '客户端IP',
  `duration`      INT             NOT NULL DEFAULT 0      COMMENT '请求耗时(ms)',
  `status`        VARCHAR(16)     NOT NULL DEFAULT 'success' COMMENT '结果：success/error',
  `error_message` VARCHAR(512)    NULL                    COMMENT '错误信息',
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_al_user` (`user_id`),
  KEY `idx_al_action` (`action`),
  KEY `idx_al_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作审计日志表';

-- -----------------------------------------------------------------------------
-- 12.2 数据备份记录表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `backup_record` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '备份ID',
  `name`       VARCHAR(200)    NOT NULL                COMMENT '备份名称',
  `type`       VARCHAR(32)     NOT NULL DEFAULT 'full' COMMENT '备份类型：full/incremental',
  `file_url`   VARCHAR(512)    NULL                    COMMENT '备份文件URL',
  `file_size`  BIGINT UNSIGNED NOT NULL DEFAULT 0      COMMENT '备份文件大小(字节)',
  `status`     VARCHAR(32)     NOT NULL DEFAULT 'completed' COMMENT '状态：running/completed/failed',
  `operator`   VARCHAR(64)     NULL                    COMMENT '操作人',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据备份记录表';

-- -----------------------------------------------------------------------------
-- 12.3 数据同步日志表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sync_log` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `target`        VARCHAR(64)     NOT NULL DEFAULT 'education_bureau' COMMENT '同步目标：education_bureau/third_party',
  `status`        VARCHAR(16)     NOT NULL DEFAULT 'success' COMMENT '状态：success/failed',
  `record_count`  INT UNSIGNED    NOT NULL DEFAULT 0      COMMENT '同步记录数',
  `request_body`  LONGTEXT        NULL                    COMMENT '请求报文',
  `response_body` LONGTEXT        NULL                    COMMENT '响应报文',
  `error_message` TEXT            NULL                    COMMENT '错误信息',
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_sl_target` (`target`),
  KEY `idx_sl_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教育局数据同步日志表';

-- -----------------------------------------------------------------------------
-- 12.4 系统全局配置表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_config` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key`   VARCHAR(128)    NOT NULL                COMMENT '配置键（如：site_name/upload_max_size）',
  `config_value` TEXT            NULL                    COMMENT '配置值',
  `category`     VARCHAR(64)     NULL                    COMMENT '分类（system/upload/notification）',
  `description`  VARCHAR(512)    NULL                    COMMENT '配置说明',
  `updated_at`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_system_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统全局配置表';

-- -----------------------------------------------------------------------------
-- 12.5 APP版本管理表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `app_version` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '版本ID',
  `platform`      VARCHAR(32)     NOT NULL                COMMENT '平台：android/ios/wechat_mp/h5',
  `version`       VARCHAR(32)     NOT NULL                COMMENT '版本号（如：1.0.0）',
  `download_url`  VARCHAR(512)    NULL                    COMMENT '下载地址',
  `force_update`  TINYINT         NOT NULL DEFAULT 0      COMMENT '是否强制更新：0=否 1=是',
  `release_notes` TEXT            NULL                    COMMENT '更新说明',
  `status`        VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/archived',
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='APP版本管理表';

-- -----------------------------------------------------------------------------
-- 12.6 帮助中心文章表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `help_article` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '文章ID',
  `title`      VARCHAR(200)    NOT NULL                COMMENT '文章标题',
  `content`    TEXT            NULL                    COMMENT '文章内容（Markdown/HTML）',
  `category`   VARCHAR(64)     NULL                    COMMENT '分类（使用指南/常见问题/教学技巧）',
  `sort_order` INT             NOT NULL DEFAULT 0      COMMENT '排序序号',
  `status`     VARCHAR(32)     NOT NULL DEFAULT 'published' COMMENT '状态：draft/published/archived',
  `view_count` INT             NOT NULL DEFAULT 0      COMMENT '浏览次数',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_ha_category` (`category`),
  KEY `idx_ha_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮助中心文章表';

-- =============================================================================
-- 恢复外键检查
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 统计：45张表，12个领域
--   领域1  用户与组织架构  8表：school, campus, user, grade, class, teacher, student, parent_student_access
--   领域2  RBAC权限       2表：role, user_role
--   领域3  体测管理       4表：task, task_checkin, score, score_review
--   领域4  考试项目与标准  4表：exam_project, exam_standard, exam_plan, exam_batch
--   领域5  作业管理       3表：homework, homework_submission, homework_correction
--   领域6  教学管理       3表：course_schedule, teaching_plan, teaching_resource
--   领域7  设备与场地     3表：device, rtsp_stream, venue
--   领域8  AI识别与训练   5表：ai_session, ai_record, training_record, ai_config, ai_model
--   领域9  勋章与排行     3表：badge, badge_award, school_config
--   领域10 数据报告与预警  3表：report, alert, exercise_prescription
--   领域11 消息通知       1表：message_record
--   领域12 系统管理       6表：audit_log, backup_record, sync_log, system_config, app_version, help_article
-- =============================================================================
