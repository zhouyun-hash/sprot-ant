-- 体测任务 + 成绩联调示例（在 mysql_schema.sql 执行后、空库或测试库中执行）
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `user` (`id`, `username`, `password`, `role`, `name`, `phone`, `avatar`, `created_at`)
VALUES
  (9001, 'seed_student1', '$2a$10$placeholder', 'student', '联调学生', '13900000001', NULL, NOW(3)),
  (9002, 'seed_teacher1', '$2a$10$placeholder', 'teacher', '联调教师', '13900000002', NULL, NOW(3));

REPLACE INTO `teacher` (`id`, `user_id`, `teacher_no`, `subject`)
VALUES (8001, 9002, 'T_SEED_01', '体育');

REPLACE INTO `class` (`id`, `name`, `grade`, `school_year`, `teacher_id`)
VALUES (7001, '联调班', '初一', '2024-2025', 8001);

REPLACE INTO `student` (`id`, `user_id`, `student_no`, `class_id`, `parent_phone`, `birth_date`, `gender`)
VALUES (6001, 9001, 'S2024001', 7001, '13900000003', '2010-01-01', 1);

REPLACE INTO `task` (`id`, `name`, `type`, `grade_ids`, `class_ids`, `project_ids`, `start_time`, `end_time`, `status`)
VALUES (5001, '联调-秋季体测', '期末', '[7]', '[7001]', '[1,2]', '2025-09-01 08:00:00.000', '2025-12-31 18:00:00.000', 'published');

REPLACE INTO `score` (`id`, `student_id`, `task_id`, `project`, `result`, `unit`, `ai_raw_data`, `review_status`, `created_at`)
VALUES (4001, 6001, 5001, '跳绳', '180', '次', '{"count":180}', 'pending', NOW(3));

SET FOREIGN_KEY_CHECKS = 1;
