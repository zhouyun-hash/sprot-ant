-- =============================================================================
-- 蚁数智动平台 — 种子数据脚本
-- =============================================================================
-- 数据库：smart_sports (MySQL 8.0)
-- 依赖：先执行 db/mysql_schema.sql 建表
-- 生成日期：2026-04-15
-- =============================================================================
-- 数据清单：
--   1 所学校（阳光实验中学）+ 2 个校区
--   3 个年级（七/八/九年级）× 2 个班 = 6 个班级
--   38 个用户 = 1 超管 + 1 校管 + 4 教师 + 24 学生 + 8 家长
--   4 个系统角色
--   8 个国标体测项目 + 评分标准
--   1 套体测计划 + 2 个批次
--   2 个体测任务 + 学生签到 + 测试成绩
--   3 份作业 + 提交记录
--   课程表 + 教学计划 + 教学资源
--   2 台设备 + 2 路视频流 + 2 个场地
--   AI 配置 + AI 模型
--   6 枚勋章 + 授予记录
--   学生体质报告 + 安全预警 + 运动处方
--   消息通知 + 系统配置 + 帮助文章
-- =============================================================================
-- 所有用户默认密码：Admin123456
-- BCrypt(10轮) 哈希值：$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `smart_sports`;

-- 清空所有表（重复执行时先清理；顺序需避免外键冲突，故关闭检查）
-- 若仅首次初始化可跳过此段
TRUNCATE TABLE `help_article`;
TRUNCATE TABLE `app_version`;
TRUNCATE TABLE `system_config`;
TRUNCATE TABLE `sync_log`;
TRUNCATE TABLE `backup_record`;
TRUNCATE TABLE `audit_log`;
TRUNCATE TABLE `message_record`;
TRUNCATE TABLE `exercise_prescription`;
TRUNCATE TABLE `alert`;
TRUNCATE TABLE `report`;
TRUNCATE TABLE `school_config`;
TRUNCATE TABLE `badge_award`;
TRUNCATE TABLE `badge`;
TRUNCATE TABLE `ai_model`;
TRUNCATE TABLE `ai_config`;
TRUNCATE TABLE `training_record`;
TRUNCATE TABLE `ai_record`;
TRUNCATE TABLE `ai_session`;
TRUNCATE TABLE `rtsp_stream`;
TRUNCATE TABLE `device`;
TRUNCATE TABLE `teaching_resource`;
TRUNCATE TABLE `teaching_plan`;
TRUNCATE TABLE `course_schedule`;
TRUNCATE TABLE `homework_correction`;
TRUNCATE TABLE `homework_submission`;
TRUNCATE TABLE `homework`;
TRUNCATE TABLE `exam_batch`;
TRUNCATE TABLE `exam_plan`;
TRUNCATE TABLE `exam_standard`;
TRUNCATE TABLE `exam_project`;
TRUNCATE TABLE `score_review`;
TRUNCATE TABLE `score`;
TRUNCATE TABLE `task_checkin`;
TRUNCATE TABLE `task`;
TRUNCATE TABLE `user_role`;
TRUNCATE TABLE `role`;
TRUNCATE TABLE `parent_student_access`;
TRUNCATE TABLE `student`;
TRUNCATE TABLE `teacher`;
TRUNCATE TABLE `venue`;
-- 清除 class 表的教师外键引用后再清空
UPDATE `class` SET `teacher_id` = NULL, `head_teacher_id` = NULL, `pe_teacher_id` = NULL WHERE 1=1;
TRUNCATE TABLE `class`;
TRUNCATE TABLE `grade`;
TRUNCATE TABLE `campus`;
TRUNCATE TABLE `user`;
TRUNCATE TABLE `school`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 领域1：用户与组织架构
-- =============================================================================

-- ▸ 1.1 学校
-- -----------------------------------------------------------------------------
INSERT INTO `school` (`id`, `name`, `code`, `address`, `phone`, `principal`, `logo`, `status`) VALUES
(1, '阳光实验中学', '310101001', '上海市黄浦区南京东路100号', '021-63210001', '张明远', '/assets/logos/school_1.png', 'active');

-- ▸ 1.2 校区
-- -----------------------------------------------------------------------------
INSERT INTO `campus` (`id`, `school_id`, `name`, `address`, `phone`, `status`) VALUES
(1, 1, '本部校区', '上海市黄浦区南京东路100号', '021-63210001', 'active'),
(2, 1, '东校区',   '上海市浦东新区张杨路500号', '021-68710002', 'active');

-- ▸ 1.3 用户（38人）
-- -----------------------------------------------------------------------------
-- 密码统一为 Admin123456 的 BCrypt 哈希
-- 用户名规则：admin / schooladmin / t + 序号 / s + 年级班级序号 / p + 序号

INSERT INTO `user` (`id`, `username`, `password`, `role`, `name`, `phone`, `avatar`) VALUES
-- 超级管理员
(1,  'admin',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin',        '系统管理员', '13800000001', NULL),
-- 学校管理员
(2,  'schooladmin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'school_admin',  '王校长',    '13800000002', NULL),
-- 教师 (4人)
(3,  'teacher01',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'teacher',       '李志强',    '13900000001', NULL),
(4,  'teacher02',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'teacher',       '赵晓丽',    '13900000002', NULL),
(5,  'teacher03',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'teacher',       '刘建国',    '13900000003', NULL),
(6,  'teacher04',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'teacher',       '陈雨婷',    '13900000004', NULL),
-- 学生 (24人: 每班4人, 6班)
-- 七年级1班 (s0101 ~ s0104)
(7,  's0101',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '张三',   '15000000001', NULL),
(8,  's0102',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '李小红', '15000000002', NULL),
(9,  's0103',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '王明',   '15000000003', NULL),
(10, 's0104',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '赵丽',   '15000000004', NULL),
-- 七年级2班 (s0201 ~ s0204)
(11, 's0201',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '刘洋',   '15000000005', NULL),
(12, 's0202',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '周芳',   '15000000006', NULL),
(13, 's0203',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '孙强',   '15000000007', NULL),
(14, 's0204',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '吴雪',   '15000000008', NULL),
-- 八年级1班 (s0301 ~ s0304)
(15, 's0301',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '郑伟',   '15000000009', NULL),
(16, 's0302',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '黄静',   '15000000010', NULL),
(17, 's0303',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '马超',   '15000000011', NULL),
(18, 's0304',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '许敏',   '15000000012', NULL),
-- 八年级2班 (s0401 ~ s0404)
(19, 's0401',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '韩磊',   '15000000013', NULL),
(20, 's0402',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '杨柳',   '15000000014', NULL),
(21, 's0403',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '朱鹏',   '15000000015', NULL),
(22, 's0404',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '何琳',   '15000000016', NULL),
-- 九年级1班 (s0501 ~ s0504)
(23, 's0501',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '曹杰',   '15000000017', NULL),
(24, 's0502',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '谢芳',   '15000000018', NULL),
(25, 's0503',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '邓宇',   '15000000019', NULL),
(26, 's0504',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '冯雅',   '15000000020', NULL),
-- 九年级2班 (s0601 ~ s0604)
(27, 's0601',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '蒋鑫',   '15000000021', NULL),
(28, 's0602',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '沈梅',   '15000000022', NULL),
(29, 's0603',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '陆涛',   '15000000023', NULL),
(30, 's0604',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '姚婷',   '15000000024', NULL),
-- 家长 (8人: 每2个学生共享1位家长)
(31, 'parent01',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'parent', '张父',   '13600000001', NULL),
(32, 'parent02',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'parent', '王母',   '13600000002', NULL),
(33, 'parent03',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'parent', '刘父',   '13600000003', NULL),
(34, 'parent04',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'parent', '郑母',   '13600000004', NULL),
(35, 'parent05',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'parent', '韩父',   '13600000005', NULL),
(36, 'parent06',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'parent', '曹母',   '13600000006', NULL),
(37, 'parent07',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'parent', '蒋父',   '13600000007', NULL),
(38, 'parent08',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'parent', '陆母',   '13600000008', NULL);

-- ▸ 1.4 年级
-- -----------------------------------------------------------------------------
INSERT INTO `grade` (`id`, `name`, `sort_order`, `school_year`, `school_id`, `status`) VALUES
(1, '七年级', 7, '2025-2026', 1, 'active'),
(2, '八年级', 8, '2025-2026', 1, 'active'),
(3, '九年级', 9, '2025-2026', 1, 'active');

-- ▸ 1.5 班级（先不设教师外键，教师表还未插入）
-- -----------------------------------------------------------------------------
INSERT INTO `class` (`id`, `name`, `class_no`, `school_id`, `grade_id`, `grade`, `school_year`) VALUES
(1, '七年级1班', '0701', 1, 1, '七年级', '2025-2026'),
(2, '七年级2班', '0702', 1, 1, '七年级', '2025-2026'),
(3, '八年级1班', '0801', 1, 2, '八年级', '2025-2026'),
(4, '八年级2班', '0802', 1, 2, '八年级', '2025-2026'),
(5, '九年级1班', '0901', 1, 3, '九年级', '2025-2026'),
(6, '九年级2班', '0902', 1, 3, '九年级', '2025-2026');

-- ▸ 1.6 教师
-- -----------------------------------------------------------------------------
-- teacher_no 规则：T + 年份后两位 + 3位序号
INSERT INTO `teacher` (`id`, `user_id`, `school_id`, `teacher_no`, `subject`) VALUES
(1, 3, 1, 'T25001', '体育'),  -- 李志强：七年级体育老师 + 体育组长
(2, 4, 1, 'T25002', '体育'),  -- 赵晓丽：八年级体育老师
(3, 5, 1, 'T25003', '体育'),  -- 刘建国：九年级体育老师
(4, 6, 1, 'T25004', '体育');  -- 陈雨婷：机动教师

-- ▸ 回填班级的教师关联
-- -----------------------------------------------------------------------------
UPDATE `class` SET `teacher_id` = 1, `pe_teacher_id` = 1 WHERE `id` IN (1, 2);  -- 七年级 → 李志强
UPDATE `class` SET `teacher_id` = 2                       WHERE `id` IN (3, 4);  -- 八年级 → 赵晓丽
UPDATE `class` SET `teacher_id` = 3                       WHERE `id` IN (5, 6);  -- 九年级 → 刘建国
UPDATE `class` SET `head_teacher_id` = 4                  WHERE `id` = 1;        -- 七年级1班班主任 → 陈雨婷

-- ▸ 1.7 学生（24人）
-- -----------------------------------------------------------------------------
-- student_no 规则：学年后两位 + 年级 + 班序 + 学生序号
-- gender: 0=女, 1=男（按名字合理分配）
INSERT INTO `student` (`id`, `user_id`, `class_id`, `student_no`, `parent_phone`, `id_card`, `gender`) VALUES
-- 七年级1班 (class_id=1)
( 1,  7, 1, '250701001', '13600000001', NULL, 1),  -- 张三（男）
( 2,  8, 1, '250701002', '13600000001', NULL, 0),  -- 李小红（女）
( 3,  9, 1, '250701003', '13600000002', NULL, 1),  -- 王明（男）
( 4, 10, 1, '250701004', '13600000002', NULL, 0),  -- 赵丽（女）
-- 七年级2班 (class_id=2)
( 5, 11, 2, '250702001', '13600000003', NULL, 1),  -- 刘洋（男）
( 6, 12, 2, '250702002', '13600000003', NULL, 0),  -- 周芳（女）
( 7, 13, 2, '250702003', NULL,          NULL, 1),  -- 孙强（男）
( 8, 14, 2, '250702004', NULL,          NULL, 0),  -- 吴雪（女）
-- 八年级1班 (class_id=3)
( 9, 15, 3, '250801001', '13600000004', NULL, 1),  -- 郑伟（男）
(10, 16, 3, '250801002', '13600000004', NULL, 0),  -- 黄静（女）
(11, 17, 3, '250801003', NULL,          NULL, 1),  -- 马超（男）
(12, 18, 3, '250801004', NULL,          NULL, 0),  -- 许敏（女）
-- 八年级2班 (class_id=4)
(13, 19, 4, '250802001', '13600000005', NULL, 1),  -- 韩磊（男）
(14, 20, 4, '250802002', '13600000005', NULL, 0),  -- 杨柳（女）
(15, 21, 4, '250802003', NULL,          NULL, 1),  -- 朱鹏（男）
(16, 22, 4, '250802004', NULL,          NULL, 0),  -- 何琳（女）
-- 九年级1班 (class_id=5)
(17, 23, 5, '250901001', '13600000006', NULL, 1),  -- 曹杰（男）
(18, 24, 5, '250901002', '13600000006', NULL, 0),  -- 谢芳（女）
(19, 25, 5, '250901003', NULL,          NULL, 1),  -- 邓宇（男）
(20, 26, 5, '250901004', NULL,          NULL, 0),  -- 冯雅（女）
-- 九年级2班 (class_id=6)
(21, 27, 6, '250902001', '13600000007', NULL, 1),  -- 蒋鑫（男）
(22, 28, 6, '250902002', '13600000007', NULL, 0),  -- 沈梅（女）
(23, 29, 6, '250902003', '13600000008', NULL, 1),  -- 陆涛（男）
(24, 30, 6, '250902004', '13600000008', NULL, 0);  -- 姚婷（女）

-- ▸ 1.8 家长-学生绑定（8位家长，每位绑2~3名学生）
-- -----------------------------------------------------------------------------
INSERT INTO `parent_student_access` (`id`, `parent_user_id`, `student_id`, `status`, `reviewed_by_user_id`, `reviewed_at`) VALUES
( 1, 31,  1, 'approved', 2, '2025-09-01 10:00:00.000'),  -- parent01 → 张三
( 2, 31,  2, 'approved', 2, '2025-09-01 10:00:00.000'),  -- parent01 → 李小红
( 3, 32,  3, 'approved', 2, '2025-09-01 10:05:00.000'),  -- parent02 → 王明
( 4, 32,  4, 'approved', 2, '2025-09-01 10:05:00.000'),  -- parent02 → 赵丽
( 5, 33,  5, 'approved', 2, '2025-09-01 10:10:00.000'),  -- parent03 → 刘洋
( 6, 33,  6, 'approved', 2, '2025-09-01 10:10:00.000'),  -- parent03 → 周芳
( 7, 34,  9, 'approved', 2, '2025-09-02 09:00:00.000'),  -- parent04 → 郑伟
( 8, 34, 10, 'approved', 2, '2025-09-02 09:00:00.000'),  -- parent04 → 黄静
( 9, 35, 13, 'approved', 2, '2025-09-02 09:05:00.000'),  -- parent05 → 韩磊
(10, 35, 14, 'approved', 2, '2025-09-02 09:05:00.000'),  -- parent05 → 杨柳
(11, 36, 17, 'approved', 2, '2025-09-03 08:30:00.000'),  -- parent06 → 曹杰
(12, 36, 18, 'approved', 2, '2025-09-03 08:30:00.000'),  -- parent06 → 谢芳
(13, 37, 21, 'approved', 2, '2025-09-03 08:35:00.000'),  -- parent07 → 蒋鑫
(14, 37, 22, 'approved', 2, '2025-09-03 08:35:00.000'),  -- parent07 → 沈梅
(15, 38, 23, 'approved', 2, '2025-09-03 08:40:00.000'),  -- parent08 → 陆涛
(16, 38, 24, 'pending',  NULL, NULL);                     -- parent08 → 姚婷（待审核）

-- =============================================================================
-- 领域2：RBAC权限
-- =============================================================================

-- ▸ 2.1 角色定义
-- -----------------------------------------------------------------------------
INSERT INTO `role` (`id`, `name`, `code`, `description`, `permissions`, `status`) VALUES
(1, '超级管理员', 'super_admin',  '拥有系统所有权限',
   '["*"]', 'active'),
(2, '学校管理员', 'school_admin', '管理本校所有数据',
   '["school:*","user:*","student:*","teacher:*","class:*","grade:*","task:*","score:*","report:*","device:*"]', 'active'),
(3, '体育教师',   'teacher',      '管理所辖班级的教学与体测',
   '["class:read","student:read","task:*","score:*","homework:*","course:*","report:read"]', 'active'),
(4, '学生',       'student',      '查看个人数据，参与训练与测试',
   '["score:read:self","homework:read:self","report:read:self","training:*:self","badge:read"]', 'active');

-- ▸ 2.2 用户-角色关联
-- -----------------------------------------------------------------------------
INSERT INTO `user_role` (`user_id`, `role_id`) VALUES
(1, 1),  -- admin → 超级管理员
(2, 2),  -- schooladmin → 学校管理员
(3, 3),  -- teacher01 → 体育教师
(4, 3),  -- teacher02 → 体育教师
(5, 3),  -- teacher03 → 体育教师
(6, 3),  -- teacher04 → 体育教师
-- 所有学生 (user_id 7~30) → 学生角色
( 7, 4), ( 8, 4), ( 9, 4), (10, 4), (11, 4), (12, 4),
(13, 4), (14, 4), (15, 4), (16, 4), (17, 4), (18, 4),
(19, 4), (20, 4), (21, 4), (22, 4), (23, 4), (24, 4),
(25, 4), (26, 4), (27, 4), (28, 4), (29, 4), (30, 4);

-- =============================================================================
-- 领域3：体测管理
-- =============================================================================

-- ▸ 3.1 体测任务
-- -----------------------------------------------------------------------------
-- 任务1: 七年级秋季体测（已完成）
-- 任务2: 八年级模拟中考（进行中）
INSERT INTO `task` (`id`, `name`, `type`, `grade_ids`, `class_ids`, `project_ids`, `start_time`, `end_time`, `status`) VALUES
(1, '2025秋季七年级体质测试', 'exam',
   '[1]', '[1, 2]', '[1, 2, 3, 4, 5, 6, 7]',
   '2025-10-15 08:00:00.000', '2025-10-17 17:00:00.000', 'finished'),
(2, '2026春季八年级中考模拟', 'simulation',
   '[2]', '[3, 4]', '[1, 2, 3, 4, 5, 8]',
   '2026-03-20 08:00:00.000', '2026-03-22 17:00:00.000', 'ongoing');

-- ▸ 3.2 任务签到（任务1: 七年级1班全员签到，任务2: 八年级1班全员签到）
-- -----------------------------------------------------------------------------
INSERT INTO `task_checkin` (`task_id`, `student_id`, `checked`) VALUES
-- 任务1 → 七年级1班 4人
(1, 1, 1), (1, 2, 1), (1, 3, 1), (1, 4, 1),
-- 任务1 → 七年级2班 4人
(1, 5, 1), (1, 6, 1), (1, 7, 1), (1, 8, 1),
-- 任务2 → 八年级1班 4人
(2, 9, 1), (2, 10, 1), (2, 11, 1), (2, 12, 1),
-- 任务2 → 八年级2班 4人（韩磊未到）
(2, 13, 0), (2, 14, 1), (2, 15, 1), (2, 16, 1);

-- ▸ 3.3 成绩（任务1的跳绳/仰卧起坐/立定跳远成绩样例）
-- -----------------------------------------------------------------------------
-- review_status: pending=待复核, approved=已通过
-- result 为字符串原始值, unit 为单位
INSERT INTO `score` (`id`, `task_id`, `student_id`, `project`, `result`, `unit`, `review_status`, `ai_raw_data`, `sync_status`) VALUES
-- 张三(男) 的成绩
( 1, 1,  1, '1分钟跳绳',   '152', '次',  'approved', '{"confidence":0.97,"frame_count":1800}', 1),
( 2, 1,  1, '1分钟仰卧起坐','42', '次',  'approved', '{"confidence":0.95}', 1),
( 3, 1,  1, '立定跳远',     '215', '厘米', 'approved', NULL, 1),
-- 李小红(女) 的成绩
( 4, 1,  2, '1分钟跳绳',   '168', '次',  'approved', '{"confidence":0.98}', 1),
( 5, 1,  2, '1分钟仰卧起坐','38', '次',  'approved', NULL, 1),
( 6, 1,  2, '立定跳远',     '178', '厘米', 'approved', NULL, 1),
-- 王明(男) 的成绩
( 7, 1,  3, '1分钟跳绳',   '130', '次',  'pending',  '{"confidence":0.92,"warning":"partial_occlusion"}', 0),
( 8, 1,  3, '1分钟仰卧起坐','35', '次',  'approved', NULL, 1),
( 9, 1,  3, '立定跳远',     '198', '厘米', 'approved', NULL, 1),
-- 赵丽(女) 的成绩
(10, 1,  4, '1分钟跳绳',   '145', '次',  'approved', NULL, 1),
(11, 1,  4, '1分钟仰卧起坐','40', '次',  'approved', NULL, 1),
(12, 1,  4, '立定跳远',     '172', '厘米', 'approved', NULL, 1),
-- 任务2: 郑伟(男) 八年级1班，中考模拟进行中
(13, 2,  9, '1分钟跳绳',   '165', '次',  'pending',  '{"confidence":0.96}', 0),
(14, 2,  9, '立定跳远',     '228', '厘米', 'pending',  NULL, 0),
-- 任务2: 黄静(女)
(15, 2, 10, '1分钟跳绳',   '175', '次',  'pending',  '{"confidence":0.97}', 0),
(16, 2, 10, '立定跳远',     '185', '厘米', 'pending',  NULL, 0);

-- ▸ 3.4 成绩审核（对王明跳绳的待复核记录）
-- -----------------------------------------------------------------------------
INSERT INTO `score_review` (`id`, `score_id`, `reviewer_id`, `status`, `original_result`, `corrected_result`, `reason`, `comment`) VALUES
(1, 7, 3, 'pending', '130', NULL, 'AI识别置信度偏低(0.92)，存在遮挡警告', '需人工核查视频回放');

-- =============================================================================
-- 领域4：考试项目与标准
-- =============================================================================

-- ▸ 4.1 运动项目（8个国标项目）
-- -----------------------------------------------------------------------------
-- 参照《国家学生体质健康标准》（2014年修订）初中阶段必测+选测项目
INSERT INTO `exam_project` (`id`, `name`, `category`, `unit`, `score_type`, `description`, `params`, `enabled`, `sort_order`) VALUES
(1, '1分钟跳绳',     '协调', '次',  'count',    '1分钟内连续跳绳次数，踩绳不计',
   '{"ai_model":"jump_rope_v3","min_confidence":0.90}', 1, 1),
(2, '1分钟仰卧起坐', '力量', '次',  'count',    '1分钟内完成标准仰卧起坐次数，双肘需触膝',
   '{"ai_model":"sit_up_v2","min_confidence":0.90}', 1, 2),
(3, '立定跳远',       '力量', '厘米','distance', '原地双脚起跳，取最远落地点距离',
   '{"ai_model":"standing_jump_v2","camera_angle":"side"}', 1, 3),
(4, '50米跑',         '速度', '秒',  'time',     '直道冲刺跑，电子计时',
   NULL, 1, 4),
(5, '坐位体前屈',     '柔韧', '厘米','distance', '坐姿向前推动标尺，正值为超过脚尖距离',
   NULL, 1, 5),
(6, '肺活量',         '耐力', '毫升','count',    '最大吸气后缓慢呼出的最大气体量',
   NULL, 1, 6),
(7, '引体向上',       '力量', '次',  'count',    '正握单杠，下颏过杠面为完成一次（男生）',
   '{"ai_model":"pull_up_v1","min_confidence":0.88}', 1, 7),
(8, '1000米/800米跑', '耐力', '秒',  'time',     '男生1000米/女生800米，环形跑道',
   NULL, 1, 8);

-- ▸ 4.2 考核标准（初中段，按性别/年级差异化评分规则）
-- -----------------------------------------------------------------------------
-- score_rules JSON 格式: { "excellent": 阈值, "good": 阈值, "pass": 阈值, "fail": 阈值 }
-- count/distance 类: 越大越好; time 类: 越小越好
INSERT INTO `exam_standard` (`id`, `project_id`, `gender`, `age_min`, `age_max`, `grade_level`, `score_rules`, `version`) VALUES
-- 1分钟跳绳 (count, 越多越好)
( 1, 1, 'male',   12, 14, '初中', '{"excellent":180,"good":150,"pass":100,"fail":60}',    'v1'),
( 2, 1, 'female', 12, 14, '初中', '{"excellent":172,"good":140,"pass":90,"fail":54}',     'v1'),
-- 1分钟仰卧起坐 (count, 越多越好)
( 3, 2, 'male',   12, 14, '初中', '{"excellent":50,"good":42,"pass":30,"fail":15}',       'v1'),
( 4, 2, 'female', 12, 14, '初中', '{"excellent":48,"good":40,"pass":26,"fail":12}',       'v1'),
-- 立定跳远 (distance/厘米, 越远越好)
( 5, 3, 'male',   12, 14, '初中', '{"excellent":240,"good":210,"pass":180,"fail":150}',   'v1'),
( 6, 3, 'female', 12, 14, '初中', '{"excellent":195,"good":176,"pass":152,"fail":130}',   'v1'),
-- 50米跑 (time/秒, 越快越好)
( 7, 4, 'male',   12, 14, '初中', '{"excellent":7.3,"good":7.9,"pass":9.0,"fail":10.5}',  'v1'),
( 8, 4, 'female', 12, 14, '初中', '{"excellent":8.1,"good":8.7,"pass":10.0,"fail":11.5}', 'v1'),
-- 坐位体前屈 (distance/厘米, 越大越好)
( 9, 5, 'male',   12, 14, '初中', '{"excellent":16.0,"good":10.0,"pass":3.0,"fail":-2.0}',  'v1'),
(10, 5, 'female', 12, 14, '初中', '{"excellent":19.0,"good":13.0,"pass":5.0,"fail":0.0}',   'v1'),
-- 肺活量 (count/毫升, 越大越好)
(11, 6, 'male',   12, 14, '初中', '{"excellent":4000,"good":3200,"pass":2600,"fail":2000}', 'v1'),
(12, 6, 'female', 12, 14, '初中', '{"excellent":3000,"good":2400,"pass":1900,"fail":1500}', 'v1'),
-- 引体向上 (count, 男生, 越多越好)
(13, 7, 'male',   12, 14, '初中', '{"excellent":15,"good":10,"pass":5,"fail":2}',          'v1'),
-- 1000米/800米跑 (time/秒, 越快越好)
(14, 8, 'male',   12, 14, '初中', '{"excellent":225,"good":255,"pass":300,"fail":360}',    'v1'),
(15, 8, 'female', 12, 14, '初中', '{"excellent":210,"good":240,"pass":280,"fail":330}',    'v1');

-- ▸ 4.3 体测计划
-- -----------------------------------------------------------------------------
INSERT INTO `exam_plan` (`id`, `name`, `school_year`, `status`, `start_date`, `end_date`, `project_ids`, `grade_ids`, `description`) VALUES
(1, '2025-2026学年秋季体质测试计划', '2025-2026', 'active',
   '2025-10-15', '2025-11-15',
   '[1, 2, 3, 4, 5, 6, 7, 8]', '[1, 2, 3]',
   '全校七、八、九年级秋季学期体质健康测试，按国家标准执行');

-- ▸ 4.4 体测批次
-- -----------------------------------------------------------------------------
INSERT INTO `exam_batch` (`id`, `plan_id`, `name`, `batch_date`, `status`, `class_ids`, `venue_id`, `notes`) VALUES
(1, 1, '第一批次-七年级', '2025-10-15', 'completed', '[1, 2]', 1, '上午8:00-12:00，操场A区'),
(2, 1, '第二批次-八年级', '2025-10-16', 'ongoing',   '[3, 4]', 1, '上午8:00-12:00，操场A区');

-- =============================================================================
-- 领域5：作业管理
-- =============================================================================

-- ▸ 5.1 作业
-- -----------------------------------------------------------------------------
INSERT INTO `homework` (`id`, `title`, `description`, `deadline`, `class_ids`, `created_by`) VALUES
(1, '每日跳绳打卡-第3周',   '每天完成1分钟跳绳训练并录制视频上传，目标：男生≥120次/女生≥110次', '2025-10-20 23:59:59.000', '[1, 2]', 3),
(2, '仰卧起坐技巧训练',     '观看教学视频后练习标准仰卧起坐，注意双手抱头、双肘触膝',          '2025-10-22 23:59:59.000', '[1]',    3),
(3, '八年级中考体育备考计划', '根据自身弱项制定2周训练计划，需包含每日训练内容和目标',           '2026-03-25 23:59:59.000', '[3, 4]', 4);

-- ▸ 5.2 作业提交（部分学生提交）
-- -----------------------------------------------------------------------------
INSERT INTO `homework_submission` (`id`, `homework_id`, `student_id`, `content`, `video_url`, `status`, `teacher_score`, `comment`, `ai_score`) VALUES
(1, 1, 1, '完成跳绳152次', '/uploads/hw/s0101_rope_w3.mp4', 'reviewed', 90.00, '节奏稳定，继续保持', 88.50),
(2, 1, 2, '完成跳绳168次', '/uploads/hw/s0102_rope_w3.mp4', 'reviewed', 95.00, '表现优秀',         92.00),
(3, 1, 3, '完成跳绳115次', '/uploads/hw/s0103_rope_w3.mp4', 'reviewed', 75.00, '需加强节奏感',     72.00),
(4, 2, 1, '练习了30个',    '/uploads/hw/s0101_situp.mp4',   'submitted', NULL,  NULL,               NULL),
(5, 2, 2, '练习了35个',    NULL,                            'submitted', NULL,  NULL,               NULL);

-- ▸ 5.3 作业批改（AI + 人工双重评分）
-- -----------------------------------------------------------------------------
INSERT INTO `homework_correction` (`id`, `submission_id`, `reviewer_id`, `ai_score`, `manual_score`, `comment`, `correction_type`, `status`) VALUES
(1, 1, 3, 88.50, 90.00, '跳绳节奏好，但偶有踩绳',   'ai_manual',  'completed'),
(2, 2, 3, 92.00, 95.00, '动作标准流畅',              'ai_manual',  'completed'),
(3, 3, 3, 72.00, 75.00, '建议放慢速度先保证连续性',  'ai_manual',  'completed');

-- =============================================================================
-- 领域6：教学管理
-- =============================================================================

-- ▸ 6.1 课程表（七年级1班的体育课安排）
-- -----------------------------------------------------------------------------
INSERT INTO `course_schedule` (`id`, `class_id`, `teacher_id`, `subject`, `day_of_week`, `period`, `start_time`, `end_time`, `venue_id`, `school_year`, `semester`, `status`) VALUES
(1, 1, 1, '体育', 2, 3, '10:10', '10:50', 1, '2025-2026', 1, 'active'),  -- 七年级1班 周二第3节
(2, 1, 1, '体育', 4, 5, '14:00', '14:40', 1, '2025-2026', 1, 'active'),  -- 七年级1班 周四第5节
(3, 2, 1, '体育', 1, 4, '11:00', '11:40', 1, '2025-2026', 1, 'active'),  -- 七年级2班 周一第4节
(4, 2, 1, '体育', 3, 2, '09:10', '09:50', 2, '2025-2026', 1, 'active'),  -- 七年级2班 周三第2节
(5, 3, 2, '体育', 2, 5, '14:00', '14:40', 1, '2025-2026', 1, 'active'),  -- 八年级1班 周二第5节
(6, 3, 2, '体育', 5, 3, '10:10', '10:50', 2, '2025-2026', 1, 'active');  -- 八年级1班 周五第3节

-- ▸ 6.2 教学计划
-- -----------------------------------------------------------------------------
INSERT INTO `teaching_plan` (`id`, `title`, `teacher_id`, `grade_id`, `school_year`, `semester`, `content`, `resource_ids`, `status`) VALUES
(1, '七年级上学期体育教学计划', 1, 1, '2025-2026', 1,
   '第1-4周: 体能基础训练（跑步+跳绳）\n第5-8周: 球类运动入门（篮球+足球）\n第9-12周: 体操与柔韧性\n第13-16周: 体质测试备考\n第17-20周: 冬季趣味运动会',
   '[1, 2]', 'published'),
(2, '八年级上学期体育教学计划', 2, 2, '2025-2026', 1,
   '第1-4周: 田径强化（短跑技术+跳远）\n第5-8周: 力量训练（引体向上+仰卧起坐）\n第9-12周: 中长跑训练\n第13-16周: 模拟体质测试\n第17-20周: 选项课（篮球/足球/排球）',
   '[1, 3]', 'published');

-- ▸ 6.3 教学资源
-- -----------------------------------------------------------------------------
INSERT INTO `teaching_resource` (`id`, `title`, `type`, `category`, `file_url`, `file_size`, `description`, `uploader_id`, `download_count`, `status`) VALUES
(1, '跳绳标准动作教学视频',   'video',    '运动技能', '/resources/videos/jump_rope_tutorial.mp4', 52428800,  '含慢放分解、常见错误纠正',     3, 45, 'active'),
(2, '仰卧起坐规范动作示范',   'video',    '运动技能', '/resources/videos/sit_up_tutorial.mp4',     38797312,  '标准姿势+呼吸节奏+常见错误',   3, 32, 'active'),
(3, '中长跑训练指南',         'document', '训练计划', '/resources/docs/distance_running_guide.pdf', 2097152, '分阶段训练方案+配速表+恢复策略', 4, 18, 'active'),
(4, '体质健康测试评分标准表', 'document', '考核标准', '/resources/docs/health_standard_2014.pdf',   1048576, '2014版国家标准完整评分对照表',   2, 67, 'active');

-- =============================================================================
-- 领域7：设备与场地
-- =============================================================================

-- ▸ 7.1 设备
-- -----------------------------------------------------------------------------
INSERT INTO `device` (`id`, `name`, `type`, `sn`, `ip`, `status`, `firmware_version`, `school_id`, `location`, `last_heartbeat`) VALUES
(1, '操场A区AI摄像头-1号', 'camera',   'CAM-2025-A001', '192.168.1.101', 'online',  'v2.3.1', 1, '操场A区东侧立柱', '2026-04-14 08:30:00'),
(2, '操场A区AI摄像头-2号', 'camera',   'CAM-2025-A002', '192.168.1.102', 'online',  'v2.3.1', 1, '操场A区西侧立柱', '2026-04-14 08:30:00'),
(3, '边缘计算盒-1号',      'edge_box', 'EDGE-2025-001', '192.168.1.201', 'online',  'v1.5.0', 1, '设备机房',        '2026-04-14 08:31:00'),
(4, '体育馆摄像头',        'camera',   'CAM-2025-B001', '192.168.2.101', 'offline', 'v2.3.0', 1, '体育馆南墙',      '2026-04-10 16:00:00');

-- ▸ 7.2 RTSP视频流
-- -----------------------------------------------------------------------------
INSERT INTO `rtsp_stream` (`id`, `name`, `url`, `device_id`, `status`, `protocol`, `resolution`, `fps`, `latency`, `encrypted`) VALUES
(1, '操场A区-1号机位', 'rtsp://192.168.1.101:554/live/ch1', 1, 'active',   'rtsp', '1920x1080', 25, 120, 0),
(2, '操场A区-2号机位', 'rtsp://192.168.1.102:554/live/ch1', 2, 'active',   'rtsp', '1920x1080', 25, 135, 0),
(3, '体育馆-1号机位',  'rtsp://192.168.2.101:554/live/ch1', 4, 'inactive', 'rtsp', '1920x1080', 25, 0,   0);

-- ▸ 7.3 场地
-- -----------------------------------------------------------------------------
INSERT INTO `venue` (`id`, `name`, `type`, `location`, `capacity`, `status`, `facilities`, `rules`, `school_id`) VALUES
(1, '操场A区',  '操场',   '本部校区操场东半区', 200, 'available', '400米标准跑道、跳远沙坑、引体向上架', '雨天暂停室外项目', 1),
(2, '体育馆',   '体育馆', '本部校区体育馆',     150, 'available', '室内篮球场×2、羽毛球场×4、乒乓球桌×8', '需提前预约',      1),
(3, '活动室B', '活动室', '东校区一楼多功能厅',  60,  'maintenance', '瑜伽垫、跳绳、哑铃', '装修维护中，暂停使用',  1);

-- =============================================================================
-- 领域8：AI识别与训练
-- =============================================================================

-- ▸ 8.1 AI识别会话（与任务1关联的跳绳测试会话）
-- -----------------------------------------------------------------------------
INSERT INTO `ai_session` (`id`, `session_id`, `task_id`, `class_id`, `project`, `status`, `ended_at`) VALUES
(1, 'sess-20251015-0701-rope', 1, 1, '1分钟跳绳', 'ended', '2025-10-15 10:30:00.000'),
(2, 'sess-20251015-0701-sit',  1, 1, '1分钟仰卧起坐', 'ended', '2025-10-15 11:15:00.000'),
(3, 'sess-20260320-0801-rope', 2, 3, '1分钟跳绳', 'running', NULL);

-- ▸ 8.2 AI识别记录
-- -----------------------------------------------------------------------------
INSERT INTO `ai_record` (`id`, `session_id`, `task_id`, `class_id`, `student_id`, `count`, `violations`) VALUES
(1, 'sess-20251015-0701-rope', 1, 1,  1, 152, NULL),
(2, 'sess-20251015-0701-rope', 1, 1,  2, 168, NULL),
(3, 'sess-20251015-0701-rope', 1, 1,  3, 130, '["partial_occlusion_frame_820"]'),
(4, 'sess-20251015-0701-rope', 1, 1,  4, 145, NULL),
(5, 'sess-20251015-0701-sit',  1, 1,  1,  42, NULL),
(6, 'sess-20251015-0701-sit',  1, 1,  2,  38, NULL),
(7, 'sess-20260320-0801-rope', 2, 3,  9, 165, NULL),
(8, 'sess-20260320-0801-rope', 2, 3, 10, 175, NULL);

-- ▸ 8.3 自主训练记录（学生课后训练）
-- -----------------------------------------------------------------------------
INSERT INTO `training_record` (`id`, `user_id`, `student_id`, `project`, `result_json`) VALUES
(1, 7,   1, '跳绳', '{"count":120,"duration_sec":60,"date":"2025-10-18"}'),
(2, 7,   1, '跳绳', '{"count":135,"duration_sec":60,"date":"2025-10-19"}'),
(3, 8,   2, '跳绳', '{"count":155,"duration_sec":60,"date":"2025-10-18"}'),
(4, 15,  9, '跳绳', '{"count":160,"duration_sec":60,"date":"2026-03-18"}'),
(5, 15,  9, '仰卧起坐', '{"count":38,"duration_sec":60,"date":"2026-03-19"}');

-- ▸ 8.4 AI算法配置
-- -----------------------------------------------------------------------------
INSERT INTO `ai_config` (`id`, `name`, `category`, `params`, `version`, `status`, `description`) VALUES
(1, '跳绳计数配置',     '跳绳',     '{"model":"jump_rope_v3","min_confidence":0.90,"max_fps":30,"roi_ratio":0.8}',    'v3', 'active', '跳绳AI计数参数，误差率<3%'),
(2, '仰卧起坐计数配置', '仰卧起坐', '{"model":"sit_up_v2","min_confidence":0.90,"angle_threshold":45}',                'v2', 'active', '仰卧起坐计数+动作质量评估'),
(3, '立定跳远距离配置', '立定跳远', '{"model":"standing_jump_v2","camera_angle":"side","calibration_cm_per_px":0.5}',  'v2', 'active', '立定跳远距离估算，需侧面摄像头'),
(4, '人脸识别配置',     '人脸识别', '{"model":"face_rec_v1","min_confidence":0.95,"database_sync_interval":3600}',     'v1', 'active', '学生身份识别，支持活体检测');

-- ▸ 8.5 AI模型管理
-- -----------------------------------------------------------------------------
INSERT INTO `ai_model` (`id`, `name`, `type`, `file_url`, `version`, `status`, `accuracy`) VALUES
(1, 'JumpRopeCounter-v3',    'pose_estimation',     '/models/jump_rope_v3.onnx',    'v3.0.0', 'active', 97.20),
(2, 'SitUpCounter-v2',       'pose_estimation',     '/models/sit_up_v2.onnx',       'v2.1.0', 'active', 95.80),
(3, 'StandingJumpDist-v2',   'pose_estimation',     '/models/standing_jump_v2.onnx', 'v2.0.0', 'active', 93.50),
(4, 'FaceRecognition-v1',    'face_recognition',    '/models/face_rec_v1.onnx',     'v1.2.0', 'active', 99.10),
(5, 'PullUpCounter-v1',      'pose_estimation',     '/models/pull_up_v1.onnx',      'v1.0.0', 'active', 88.30);

-- =============================================================================
-- 领域9：勋章与排行
-- =============================================================================

-- ▸ 9.1 勋章定义
-- -----------------------------------------------------------------------------
INSERT INTO `badge` (`id`, `name`, `icon`, `description`, `category`, `condition_type`, `condition_value`, `status`) VALUES
(1, '跳绳达人',     '/assets/badges/rope_master.png',   '1分钟跳绳达到优秀标准',       'skill',       'score_above',  180, 'active'),
(2, '力量之星',     '/assets/badges/strength_star.png', '仰卧起坐达到优秀标准',        'skill',       'score_above',   50, 'active'),
(3, '连续打卡7天', '/assets/badges/streak_7.png',      '连续7天完成自主训练打卡',     'persistence', 'streak',          7, 'active'),
(4, '连续打卡30天','/assets/badges/streak_30.png',     '连续30天完成自主训练打卡',    'persistence', 'streak',         30, 'active'),
(5, '班级冠军',     '/assets/badges/class_champ.png',   '在班级体测中获得总分第一',    'competition', 'rank_first',      1, 'active'),
(6, '进步之星',     '/assets/badges/progress.png',      '体测成绩较上次提升超过10%',   'skill',       'improvement_pct',10, 'active');

-- ▸ 9.2 勋章授予
-- -----------------------------------------------------------------------------
INSERT INTO `badge_award` (`id`, `badge_id`, `student_id`, `awarded_at`) VALUES
(1, 1, 2, '2025-10-15 11:00:00.000'),   -- 李小红获得"跳绳达人"（168次 < 180，但接近优秀, 此处为演示）
(2, 5, 1, '2025-10-17 16:00:00.000'),   -- 张三获得"班级冠军"
(3, 3, 1, '2025-10-25 20:00:00.000'),   -- 张三获得"连续打卡7天"
(4, 6, 3, '2025-10-17 16:00:00.000');   -- 王明获得"进步之星"

-- ▸ 9.3 学校配置
-- -----------------------------------------------------------------------------
INSERT INTO `school_config` (`id`, `config_key`, `config_json`) VALUES
(1, 'leaderboard_display', '{"show_top_n":10,"refresh_interval_sec":30,"show_avatar":true,"animation":"slide_up"}'),
(2, 'badge_auto_award',    '{"enabled":true,"check_interval_sec":3600,"notify_student":true,"notify_parent":true}'),
(3, 'screen_cast_mode',    '{"default_layout":"grid_4","auto_switch_sec":15,"show_ai_overlay":true}');

-- =============================================================================
-- 领域10：数据报告与预警
-- =============================================================================

-- ▸ 10.1 学生体质报告（任务1完成后自动生成）
-- -----------------------------------------------------------------------------
INSERT INTO `report` (`id`, `student_id`, `radar_data`, `dimension_scores`, `suggestions`) VALUES
(1, 1,
   '{"跳绳":85,"仰卧起坐":84,"立定跳远":72,"50米跑":0,"坐位体前屈":0,"肺活量":0}',
   '{"力量":78,"速度":0,"耐力":0,"柔韧":0,"协调":85}',
   '1. 跳绳和仰卧起坐表现良好，建议保持训练频率\n2. 立定跳远距离稍弱，建议增加深蹲和蛙跳练习\n3. 其余项目待测试后更新评估'),
(2, 2,
   '{"跳绳":95,"仰卧起坐":79,"立定跳远":80,"50米跑":0,"坐位体前屈":0,"肺活量":0}',
   '{"力量":80,"速度":0,"耐力":0,"柔韧":0,"协调":95}',
   '1. 跳绳成绩优异，协调性突出\n2. 仰卧起坐可适当加强腹肌训练\n3. 立定跳远达标，可通过弹跳训练进一步提升');

-- ▸ 10.2 安全预警
-- -----------------------------------------------------------------------------
INSERT INTO `alert` (`id`, `class_id`, `student_id`, `type`, `message`, `status`, `violation_count`, `period_date`, `resolved_at`) VALUES
(1, 1, NULL, 'ai_violation',  '七年级1班跳绳测试中检测到3例动作异常（踩绳/绊绳）', 'resolved', 3, '2025-10-15', '2025-10-15 11:00:00.000'),
(2, 3, 11,   'heart_rate',    '马超同学运动心率持续偏高(185bpm)，建议暂停休息',     'open',     0, '2026-03-20',  NULL),
(3, NULL, NULL, 'ai_violation', '操场A区检测到未佩戴运动鞋进入跑道区域',             'open',     1, '2026-03-21',  NULL);

-- ▸ 10.3 运动处方
-- -----------------------------------------------------------------------------
INSERT INTO `exercise_prescription` (`id`, `student_id`, `title`, `content`, `category`, `exercises`, `status`, `source`, `duration_days`, `start_date`, `end_date`) VALUES
(1, 1, '立定跳远提升方案',
   '根据体测数据，立定跳远成绩(215cm)距优秀标准(240cm)有25cm差距，建议通过以下训练提升下肢爆发力',
   '力量',
   '[{"name":"深蹲","sets":3,"reps":15,"rest_sec":60},{"name":"蛙跳","sets":3,"reps":10,"rest_sec":90},{"name":"原地纵跳","sets":3,"reps":20,"rest_sec":60},{"name":"单腿跳","sets":2,"reps":10,"rest_sec":60}]',
   'active', 'ai', 28, '2025-10-20', '2025-11-16'),
(2, 3, '跳绳节奏训练方案',
   '跳绳AI识别置信度偏低(0.92)，存在动作不规范问题，建议针对节奏感和连续性进行专项训练',
   '协调',
   '[{"name":"慢速跳绳","sets":3,"reps":60,"unit":"秒","rest_sec":30},{"name":"双摇跳","sets":3,"reps":10,"rest_sec":60},{"name":"交替脚跳","sets":2,"reps":30,"unit":"秒","rest_sec":30}]',
   'active', 'ai', 14, '2025-10-20', '2025-11-02');

-- =============================================================================
-- 领域11：消息通知
-- =============================================================================

INSERT INTO `message_record` (`id`, `title`, `content`, `type`, `target_type`, `target_ids`, `sender_id`, `status`, `read_count`) VALUES
(1, '体质测试成绩已发布',
   '各位同学/家长：2025秋季七年级体质测试成绩已录入系统，请登录查看。如对成绩有疑问请联系体育老师。',
   'notification', 'class', '[1, 2]', 3, 'sent', 6),
(2, '跳绳打卡作业提醒',
   '同学们："每日跳绳打卡-第3周"作业截止日期为10月20日，请尽快完成并上传视频。',
   'homework_remind', 'class', '[1, 2]', 3, 'sent', 5),
(3, '八年级中考模拟测试通知',
   '八年级全体同学注意：3月20-22日将进行中考体育模拟测试，请穿好运动鞋和运动服，带好水壶。',
   'notification', 'class', '[3, 4]', 4, 'sent', 7),
(4, '系统维护通知',
   '系统将于4月20日凌晨2:00-4:00进行例行维护升级，届时系统暂停服务。',
   'system', 'all', NULL, 1, 'sent', 0);

-- =============================================================================
-- 领域12：系统管理
-- =============================================================================

-- ▸ 12.1 审计日志（样例）
-- -----------------------------------------------------------------------------
INSERT INTO `audit_log` (`id`, `user_id`, `username`, `action`, `resource`, `detail`, `ip`, `duration`, `status`) VALUES
(1, 1, 'admin',       'CREATE', '/api/schools',   '创建学校：阳光实验中学',              '192.168.1.10', 120, 'success'),
(2, 2, 'schooladmin', 'CREATE', '/api/grades',    '批量创建年级：七/八/九年级',           '192.168.1.11',  85, 'success'),
(3, 3, 'teacher01',   'CREATE', '/api/tasks',     '创建体测任务：2025秋季七年级体质测试', '192.168.1.12', 150, 'success'),
(4, 3, 'teacher01',   'UPDATE', '/api/tasks/1/publish', '发布任务',                      '192.168.1.12',  45, 'success'),
(5, 3, 'teacher01',   'READ',   '/api/scores?task_id=1', '查询任务1成绩列表',            '192.168.1.12',  30, 'success');

-- ▸ 12.2 系统全局配置
-- -----------------------------------------------------------------------------
INSERT INTO `system_config` (`id`, `config_key`, `config_value`, `category`, `description`) VALUES
(1, 'site_name',           '蚁数智动 — 智慧体育平台',  'system',       '系统名称'),
(2, 'site_logo',           '/assets/logo.png',         'system',       '系统Logo URL'),
(3, 'upload_max_size',     '104857600',                'upload',       '文件上传大小限制（字节），默认100MB'),
(4, 'upload_allowed_types','video/mp4,image/jpeg,image/png,application/pdf', 'upload', '允许上传的文件MIME类型'),
(5, 'jwt_expires_in',      '86400',                    'system',       'JWT Token有效期（秒），默认24小时'),
(6, 'bcrypt_rounds',       '10',                       'system',       'BCrypt加密轮数'),
(7, 'ai_request_timeout',  '30000',                    'ai',           'AI识别请求超时时间（毫秒）'),
(8, 'score_sync_retry_max','3',                        'sync',         '成绩上报最大重试次数'),
(9, 'wechat_mp_appid',     'wx_placeholder_appid',     'notification', '微信小程序AppID（占位）'),
(10,'sms_provider',        'aliyun',                   'notification', '短信服务商');

-- ▸ 12.3 APP版本
-- -----------------------------------------------------------------------------
INSERT INTO `app_version` (`id`, `platform`, `version`, `download_url`, `force_update`, `release_notes`, `status`) VALUES
(1, 'android',   '1.0.0', '/downloads/app-v1.0.0.apk',     0, '初始版本发布：教师端基础功能', 'active'),
(2, 'wechat_mp', '1.0.0', NULL,                             0, '初始版本发布：学生端+家长端',  'active');

-- ▸ 12.4 帮助中心文章
-- -----------------------------------------------------------------------------
INSERT INTO `help_article` (`id`, `title`, `content`, `category`, `sort_order`, `status`, `view_count`) VALUES
(1, '如何发起体测任务',
   '## 步骤\n1. 登录PC管理后台\n2. 进入"体测管理"→"任务管理"\n3. 点击"新建任务"按钮\n4. 填写任务名称、选择年级和班级、勾选测试项目\n5. 设置测试时间段\n6. 点击"保存"创建草稿，确认无误后点击"发布"\n\n## 注意事项\n- 任务发布后不可修改测试项目，请仔细核对\n- 可提前设置好AI摄像头的视频流',
   '使用指南', 1, 'published', 23),
(2, '学生如何查看体测成绩',
   '## 步骤\n1. 打开"蚁数智动"微信小程序\n2. 使用学号登录\n3. 在首页点击"我的成绩"\n4. 选择对应的测试任务查看各项成绩\n\n## 常见问题\n- 成绩显示"待复核"：教师正在核实，请耐心等待\n- 如对成绩有疑问，可联系体育老师申请视频回放核查',
   '常见问题', 2, 'published', 45),
(3, 'AI识别不准确怎么办',
   '## 可能原因\n1. 光线不足或逆光\n2. 摄像头角度偏移\n3. 测试区域有遮挡物\n4. 学生未穿深色运动服（与背景对比度低）\n\n## 解决方法\n1. 确保测试区域光线充足\n2. 检查摄像头是否对准指定区域\n3. 清除测试区域周围障碍物\n4. 通知学生穿着深色运动服\n5. 如仍不准确，可切换为"人工录入"模式',
   '常见问题', 3, 'published', 38);

-- =============================================================================
-- 种子数据插入完成
-- =============================================================================
-- 数据统计：
--   school:                   1 条
--   campus:                   2 条
--   user:                    38 条 (1超管+1校管+4教师+24学生+8家长)
--   grade:                    3 条
--   class:                    6 条
--   teacher:                  4 条
--   student:                 24 条
--   parent_student_access:   16 条 (含1条pending)
--   role:                     4 条
--   user_role:               30 条
--   task:                     2 条 (1 finished + 1 ongoing)
--   task_checkin:            16 条 (含1条未签到)
--   score:                   16 条
--   score_review:             1 条
--   exam_project:             8 条 (国标体测项目)
--   exam_standard:           15 条 (按性别/年级差异化)
--   exam_plan:                1 条
--   exam_batch:               2 条
--   homework:                 3 条
--   homework_submission:      5 条
--   homework_correction:      3 条
--   course_schedule:          6 条
--   teaching_plan:            2 条
--   teaching_resource:        4 条
--   device:                   4 条
--   rtsp_stream:              3 条
--   venue:                    3 条
--   ai_session:               3 条
--   ai_record:                8 条
--   training_record:          5 条
--   ai_config:                4 条
--   ai_model:                 5 条
--   badge:                    6 条
--   badge_award:              4 条
--   school_config:            3 条
--   report:                   2 条
--   alert:                    3 条
--   exercise_prescription:    2 条
--   message_record:           4 条
--   audit_log:                5 条
--   system_config:           10 条
--   app_version:              2 条
--   help_article:             3 条
-- =============================================================================
-- 总计：约 280+ 条记录，覆盖全部 45 张表中的 39 张
-- 未插入数据的表（运行时产生）：backup_record, sync_log, venue（已插入）
-- =============================================================================
