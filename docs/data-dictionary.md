# 蚁数智动平台 — 数据字典

> **数据库**：smart_sports (MySQL 8.0, utf8mb4_unicode_ci)
> **生成日期**：2026-04-14
> **数据源**：`db/mysql_schema.sql` + `backend/src/*/entities/*.entity.ts`
> **实体总数**：45 张表，12 个业务领域

---

## 目录

| 领域 | 表数 | 表名 |
|------|------|------|
| [1. 用户与组织架构](#1-用户与组织架构) | 8 | school, campus, user, grade, class, teacher, student, parent_student_access |
| [2. RBAC权限](#2-rbac权限) | 2 | role, user_role |
| [3. 体测管理](#3-体测管理) | 4 | task, task_checkin, score, score_review |
| [4. 考试项目与标准](#4-考试项目与标准) | 4 | exam_project, exam_standard, exam_plan, exam_batch |
| [5. 作业管理](#5-作业管理) | 3 | homework, homework_submission, homework_correction |
| [6. 教学管理](#6-教学管理) | 3 | course_schedule, teaching_plan, teaching_resource |
| [7. 设备与场地](#7-设备与场地) | 3 | device, rtsp_stream, venue |
| [8. AI识别与训练](#8-ai识别与训练) | 5 | ai_session, ai_record, training_record, ai_config, ai_model |
| [9. 勋章与排行](#9-勋章与排行) | 3 | badge, badge_award, school_config |
| [10. 数据报告与预警](#10-数据报告与预警) | 3 | report, alert, exercise_prescription |
| [11. 消息通知](#11-消息通知) | 1 | message_record |
| [12. 系统管理](#12-系统管理) | 6 | audit_log, backup_record, sync_log, system_config, app_version, help_article |

---

## 通用约定

| 项目 | 说明 |
|------|------|
| 主键 | 所有表使用 `BIGINT UNSIGNED AUTO_INCREMENT`，列名统一为 `id` |
| 时间戳 | `DATETIME(3)` 毫秒精度，`created_at` 默认 `CURRENT_TIMESTAMP(3)`，`updated_at` 带 `ON UPDATE` |
| 字符集 | `utf8mb4`，排序规则 `utf8mb4_unicode_ci` |
| 引擎 | InnoDB（支持事务和外键） |
| 状态字段 | VARCHAR 枚举字符串（非整数），便于可读性和扩展 |
| JSON列 | 用于一对多软关联（如 `class_ids`、`project_ids`），避免中间表过多 |
| 外键 | 显式声明 `FOREIGN KEY`，`ON DELETE` 策略按业务语义选择 |

---

## 1. 用户与组织架构

### 1.1 school — 学校信息表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 学校ID |
| name | VARCHAR(128) | N | — | — | 学校名称 |
| code | VARCHAR(64) | Y | NULL | — | 学校编码（教育局统一编码） |
| address | VARCHAR(512) | Y | NULL | — | 学校地址 |
| phone | VARCHAR(20) | Y | NULL | — | 联系电话 |
| principal | VARCHAR(128) | Y | NULL | — | 校长姓名 |
| logo | VARCHAR(512) | Y | NULL | — | 学校Logo URL |
| status | VARCHAR(32) | N | 'active' | — | 状态：active/inactive |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

---

### 1.2 campus — 校区信息表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 校区ID |
| school_id | BIGINT UNSIGNED | N | — | FK → school.id | 所属学校ID |
| name | VARCHAR(128) | N | — | — | 校区名称 |
| address | VARCHAR(512) | Y | NULL | — | 校区地址 |
| phone | VARCHAR(20) | Y | NULL | — | 联系电话 |
| status | VARCHAR(32) | N | 'active' | — | 状态：active/inactive |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_campus_school(school_id)`

---

### 1.3 user — 用户账号表（PC/移动端共用）

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 用户ID |
| username | VARCHAR(64) | N | — | UK | 登录用户名 |
| password | VARCHAR(255) | N | — | — | 密码（BCrypt哈希） |
| role | VARCHAR(32) | N | 'student' | — | 默认角色：admin/school_admin/teacher/student/parent |
| name | VARCHAR(64) | N | '' | — | 姓名/昵称 |
| phone | VARCHAR(20) | Y | NULL | — | 手机号 |
| avatar | VARCHAR(512) | Y | NULL | — | 头像URL |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**唯一约束**：`uk_user_username(username)`

---

### 1.4 grade — 年级信息表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 年级ID |
| name | VARCHAR(64) | N | — | — | 年级名称（如：一年级、七年级） |
| sort_order | INT | N | 0 | — | 排序序号 |
| school_year | VARCHAR(16) | N | — | — | 学年（如：2025-2026） |
| school_id | BIGINT UNSIGNED | Y | NULL | FK → school.id | 所属学校ID |
| status | VARCHAR(32) | N | 'active' | — | 状态：active/inactive |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_grade_school(school_id)`

---

### 1.5 class — 班级信息表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 班级ID |
| name | VARCHAR(128) | N | — | — | 班级名称 |
| class_no | VARCHAR(32) | Y | NULL | — | 班级编号 |
| school_id | BIGINT UNSIGNED | N | — | FK → school.id | 所属学校ID |
| grade_id | BIGINT UNSIGNED | N | — | FK → grade.id | 所属年级ID |
| grade | VARCHAR(32) | N | — | — | 年级名称（冗余，便于查询） |
| school_year | VARCHAR(32) | N | — | — | 学年 |
| teacher_id | BIGINT UNSIGNED | Y | NULL | FK → teacher.id | 体育老师ID |
| head_teacher_id | BIGINT UNSIGNED | Y | NULL | FK → teacher.id | 班主任ID |
| pe_teacher_id | BIGINT UNSIGNED | Y | NULL | FK → teacher.id | 体育组长ID |

**索引**：`idx_class_school(school_id)`, `idx_class_grade(grade_id)`, `idx_class_teacher(teacher_id)`
**外键**：teacher_id/head_teacher_id/pe_teacher_id 通过延迟 ALTER TABLE 添加（ON DELETE SET NULL）

---

### 1.6 teacher — 教师信息表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 教师ID |
| user_id | BIGINT UNSIGNED | N | — | FK → user.id (CASCADE) | 关联用户ID |
| school_id | BIGINT UNSIGNED | Y | NULL | FK → school.id | 所属学校ID |
| teacher_no | VARCHAR(32) | N | — | — | 教师工号 |
| subject | VARCHAR(64) | N | '体育' | — | 任教学科 |

**索引**：`idx_teacher_user(user_id)`, `idx_teacher_school(school_id)`

---

### 1.7 student — 学生信息表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 学生ID |
| user_id | BIGINT UNSIGNED | N | — | FK → user.id (CASCADE) | 关联用户ID |
| class_id | BIGINT UNSIGNED | N | — | FK → class.id | 所属班级ID |
| student_no | VARCHAR(32) | N | — | — | 学号 |
| parent_phone | VARCHAR(20) | Y | NULL | — | 家长手机号 |
| id_card | VARCHAR(32) | Y | NULL | — | 身份证号（脱敏存储） |
| gender | TINYINT UNSIGNED | Y | NULL | — | 性别：0=女 1=男 |

**索引**：`idx_student_user(user_id)`, `idx_student_class(class_id)`

---

### 1.8 parent_student_access — 家长-学生绑定关系表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 绑定ID |
| parent_user_id | BIGINT UNSIGNED | N | — | FK → user.id (CASCADE) | 家长用户ID |
| student_id | BIGINT UNSIGNED | N | — | FK → student.id (CASCADE) | 学生ID |
| status | VARCHAR(16) | N | 'pending' | — | 状态：pending/approved/rejected |
| reviewed_by_user_id | BIGINT UNSIGNED | Y | NULL | — | 审核人用户ID |
| reviewed_at | DATETIME(3) | Y | NULL | — | 审核时间 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**唯一约束**：`uk_parent_student(parent_user_id, student_id)`
**索引**：`idx_psa_student(student_id)`

---

## 2. RBAC权限

### 2.1 role — 角色定义表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 角色ID |
| name | VARCHAR(64) | N | — | UK | 角色名称 |
| code | VARCHAR(32) | N | — | UK | 角色编码（如：super_admin/school_admin/teacher） |
| description | VARCHAR(256) | Y | NULL | — | 角色描述 |
| permissions | JSON | Y | NULL | — | 权限码数组（如：["school:read","student:write"]） |
| status | VARCHAR(32) | N | 'active' | — | 状态：active/inactive |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**唯一约束**：`uk_role_name(name)`, `uk_role_code(code)`

---

### 2.2 user_role — 用户-角色关联表（多对多）

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 关联ID |
| user_id | BIGINT UNSIGNED | N | — | FK → user.id (CASCADE) | 用户ID |
| role_id | BIGINT UNSIGNED | N | — | FK → role.id (CASCADE) | 角色ID |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**唯一约束**：`uk_user_role(user_id, role_id)`
**索引**：`idx_ur_role(role_id)`

---

## 3. 体测管理

### 3.1 task — 体测任务表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 任务ID |
| name | VARCHAR(128) | N | — | — | 任务名称 |
| type | VARCHAR(32) | N | — | — | 任务类型（exam/practice/simulation） |
| grade_ids | JSON | N | — | — | 关联年级ID数组 |
| class_ids | JSON | N | — | — | 关联班级ID数组 |
| project_ids | JSON | N | — | — | 关联运动项目ID数组 |
| start_time | DATETIME(3) | N | — | — | 开始时间 |
| end_time | DATETIME(3) | N | — | — | 结束时间 |
| status | VARCHAR(16) | N | 'draft' | — | 状态：draft/ongoing/finished/cancelled |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_task_status(status)`, `idx_task_time(start_time, end_time)`
**状态机**：draft → ongoing(publish) → finished(finish)；任何非finished状态可 → cancelled(cancel)

---

### 3.2 task_checkin — 任务签到表（学生检录）

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 签到ID |
| task_id | BIGINT UNSIGNED | N | — | FK → task.id (CASCADE) | 任务ID |
| student_id | BIGINT UNSIGNED | N | — | FK → student.id (CASCADE) | 学生ID |
| checked | TINYINT(1) | N | 0 | — | 是否已签到：0=否 1=是 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**唯一约束**：`uk_checkin_task_student(task_id, student_id)`
**索引**：`idx_checkin_student(student_id)`

---

### 3.3 score — 体测成绩表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 成绩ID |
| task_id | BIGINT UNSIGNED | N | — | FK → task.id (CASCADE) | 任务ID |
| student_id | BIGINT UNSIGNED | N | — | FK → student.id (CASCADE) | 学生ID |
| project | VARCHAR(64) | N | — | — | 运动项目名称 |
| result | VARCHAR(64) | N | — | — | 成绩数值（字符串，含单位换算前原始值） |
| unit | VARCHAR(32) | N | — | — | 单位（次/秒/米/厘米） |
| review_status | VARCHAR(16) | N | 'pending' | — | 复核状态：pending/approved/rejected |
| review_remark | VARCHAR(255) | Y | NULL | — | 复核备注 |
| ai_raw_data | JSON | Y | NULL | — | AI原始推理数据JSON |
| sync_status | TINYINT UNSIGNED | N | 0 | — | 上报状态：0=未上报 1=已上报 2=上报失败 |
| sync_retry_count | TINYINT UNSIGNED | N | 0 | — | 上报重试次数 |
| synced_at | DATETIME(3) | Y | NULL | — | 上报时间 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_score_task(task_id)`, `idx_score_student(student_id)`, `idx_score_review(review_status)`, `idx_score_project(project)`
**Upsert逻辑**：按 (student_id, task_id, project) 幂等插入或更新

---

### 3.4 score_review — 成绩审核记录表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 审核ID |
| score_id | BIGINT UNSIGNED | N | — | FK → score.id (CASCADE) | 成绩ID |
| reviewer_id | BIGINT UNSIGNED | Y | NULL | FK → user.id (SET NULL) | 审核人用户ID |
| status | VARCHAR(32) | N | 'pending' | — | 审核状态：pending/approved/rejected |
| original_result | VARCHAR(128) | Y | NULL | — | 原始成绩 |
| corrected_result | VARCHAR(128) | Y | NULL | — | 修正后成绩 |
| reason | TEXT | Y | NULL | — | 审核原因 |
| comment | TEXT | Y | NULL | — | 审核备注 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_sr_score(score_id)`, `idx_sr_reviewer(reviewer_id)`

---

## 4. 考试项目与标准

### 4.1 exam_project — 运动项目定义表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 项目ID |
| name | VARCHAR(128) | N | — | — | 项目名称（跳绳/仰卧起坐/立定跳远/50米跑等） |
| category | VARCHAR(64) | Y | NULL | — | 项目分类（力量/耐力/柔韧/速度） |
| unit | VARCHAR(16) | Y | NULL | — | 默认单位（次/秒/米/厘米） |
| score_type | VARCHAR(32) | N | 'count' | — | 计分方式：count/time/distance |
| description | TEXT | Y | NULL | — | 项目描述与规则 |
| params | JSON | Y | NULL | — | 扩展参数（AI识别配置等） |
| enabled | TINYINT | N | 1 | — | 是否启用：0=否 1=是 |
| sort_order | INT | N | 0 | — | 排序序号 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

---

### 4.2 exam_standard — 考核标准表（按性别/年龄/年级差异化）

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 标准ID |
| project_id | BIGINT UNSIGNED | N | — | FK → exam_project.id (CASCADE) | 运动项目ID |
| gender | VARCHAR(32) | N | — | — | 性别：male/female/all |
| age_min | INT | Y | NULL | — | 最小年龄 |
| age_max | INT | Y | NULL | — | 最大年龄 |
| grade_level | VARCHAR(32) | Y | NULL | — | 年级水平（小学/初中/高中） |
| score_rules | JSON | Y | NULL | — | 评分规则JSON（阈值→等级映射） |
| version | VARCHAR(32) | N | 'v1' | — | 标准版本号 |
| enabled | TINYINT | N | 1 | — | 是否启用 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_es_project(project_id)`, `idx_es_gender_grade(gender, grade_level)`

---

### 4.3 exam_plan — 体测计划表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 计划ID |
| name | VARCHAR(128) | N | — | — | 计划名称 |
| school_year | VARCHAR(16) | N | — | — | 学年 |
| status | VARCHAR(32) | N | 'draft' | — | 状态：draft/active/completed |
| start_date | DATE | Y | NULL | — | 开始日期 |
| end_date | DATE | Y | NULL | — | 结束日期 |
| project_ids | JSON | Y | NULL | — | 关联项目ID数组 |
| grade_ids | JSON | Y | NULL | — | 关联年级ID数组 |
| description | TEXT | Y | NULL | — | 计划描述 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

---

### 4.4 exam_batch — 体测批次表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 批次ID |
| plan_id | BIGINT UNSIGNED | N | — | FK → exam_plan.id (CASCADE) | 所属计划ID |
| name | VARCHAR(128) | N | — | — | 批次名称 |
| batch_date | DATE | Y | NULL | — | 批次日期 |
| status | VARCHAR(32) | N | 'pending' | — | 状态：pending/ongoing/completed |
| class_ids | JSON | Y | NULL | — | 关联班级ID数组 |
| venue_id | BIGINT UNSIGNED | Y | NULL | FK → venue.id (SET NULL) | 场地ID（延迟外键） |
| notes | TEXT | Y | NULL | — | 备注 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_eb_plan(plan_id)`

---

## 5. 作业管理

### 5.1 homework — 作业发布表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 作业ID |
| title | VARCHAR(128) | N | — | — | 作业标题 |
| description | TEXT | Y | NULL | — | 作业描述/要求 |
| deadline | DATETIME(3) | N | — | — | 截止时间 |
| class_ids | JSON | N | — | — | 关联班级ID数组 |
| created_by | BIGINT UNSIGNED | N | — | FK → user.id (RESTRICT) | 创建者用户ID（教师） |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_hw_creator(created_by)`, `idx_hw_deadline(deadline)`

---

### 5.2 homework_submission — 作业提交表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 提交ID |
| homework_id | BIGINT UNSIGNED | N | — | FK → homework.id (CASCADE) | 作业ID |
| student_id | BIGINT UNSIGNED | N | — | FK → student.id (CASCADE) | 学生ID |
| content | TEXT | Y | NULL | — | 提交内容/文字描述 |
| video_url | VARCHAR(1024) | Y | NULL | — | 提交视频URL |
| status | VARCHAR(32) | N | 'submitted' | — | 状态：submitted/reviewed/returned |
| teacher_score | DECIMAL(5,2) | Y | NULL | — | 教师评分 |
| comment | VARCHAR(500) | Y | NULL | — | 教师评语 |
| ai_score | DECIMAL(5,2) | Y | NULL | — | AI评分 |
| submitted_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 提交时间 |

**索引**：`idx_hs_homework(homework_id)`, `idx_hs_student(student_id)`

---

### 5.3 homework_correction — 作业批改记录表（AI+人工双重评分）

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 批改ID |
| submission_id | BIGINT UNSIGNED | N | — | FK → homework_submission.id (CASCADE) | 提交ID |
| reviewer_id | BIGINT UNSIGNED | Y | NULL | — | 批改人用户ID |
| ai_score | DECIMAL(5,2) | Y | NULL | — | AI评分 |
| manual_score | DECIMAL(5,2) | Y | NULL | — | 人工评分 |
| comment | TEXT | Y | NULL | — | 批改评语 |
| correction_type | VARCHAR(32) | N | — | — | 批改类型：ai/manual/ai_manual |
| status | VARCHAR(32) | N | 'pending' | — | 状态：pending/completed |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_hc_submission(submission_id)`

---

## 6. 教学管理

### 6.1 course_schedule — 课程表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 课表ID |
| class_id | BIGINT UNSIGNED | N | — | FK → class.id (CASCADE) | 班级ID |
| teacher_id | BIGINT UNSIGNED | Y | NULL | FK → teacher.id (SET NULL) | 授课教师ID |
| subject | VARCHAR(64) | N | '体育' | — | 科目 |
| day_of_week | TINYINT | N | — | — | 星期几：1=周一 ... 7=周日 |
| period | INT | N | — | — | 第几节课 |
| start_time | VARCHAR(8) | N | — | — | 上课时间（HH:mm） |
| end_time | VARCHAR(8) | N | — | — | 下课时间（HH:mm） |
| venue_id | BIGINT UNSIGNED | Y | NULL | FK → venue.id (SET NULL) | 场地ID（延迟外键） |
| school_year | VARCHAR(16) | N | — | — | 学年 |
| semester | TINYINT | N | 1 | — | 学期：1=上学期 2=下学期 |
| status | VARCHAR(32) | N | 'active' | — | 状态：active/suspended |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_cs_class(class_id)`, `idx_cs_teacher(teacher_id)`, `idx_cs_day_period(day_of_week, period)`

---

### 6.2 teaching_plan — 教学计划表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 计划ID |
| title | VARCHAR(200) | N | — | — | 计划标题 |
| teacher_id | BIGINT UNSIGNED | Y | NULL | FK → teacher.id (SET NULL) | 教师ID |
| grade_id | BIGINT UNSIGNED | Y | NULL | — | 适用年级ID |
| school_year | VARCHAR(16) | N | — | — | 学年 |
| semester | TINYINT | N | 1 | — | 学期 |
| content | TEXT | Y | NULL | — | 计划内容 |
| resource_ids | JSON | Y | NULL | — | 关联教学资源ID数组 |
| status | VARCHAR(32) | N | 'draft' | — | 状态：draft/published/archived |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_tp_teacher(teacher_id)`

---

### 6.3 teaching_resource — 教学资源库

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 资源ID |
| title | VARCHAR(200) | N | — | — | 资源标题 |
| type | VARCHAR(32) | N | — | — | 类型：video/document/image/audio |
| category | VARCHAR(64) | Y | NULL | — | 分类 |
| file_url | VARCHAR(512) | N | — | — | 文件URL（OSS） |
| file_size | BIGINT UNSIGNED | N | 0 | — | 文件大小（字节） |
| description | TEXT | Y | NULL | — | 描述 |
| uploader_id | BIGINT UNSIGNED | Y | NULL | — | 上传者用户ID |
| download_count | INT | N | 0 | — | 下载次数 |
| status | VARCHAR(32) | N | 'active' | — | 状态：active/archived |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_tr_uploader(uploader_id)`, `idx_tr_type(type)`

---

## 7. 设备与场地

### 7.1 device — 设备管理表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 设备ID |
| name | VARCHAR(128) | N | — | — | 设备名称 |
| type | VARCHAR(64) | N | — | — | 设备类型（camera/edge_box/sensor） |
| sn | VARCHAR(64) | N | — | UK | 设备序列号 |
| ip | VARCHAR(64) | Y | NULL | — | IP地址 |
| status | VARCHAR(32) | N | 'offline' | — | 状态：online/offline/error |
| firmware_version | VARCHAR(64) | Y | NULL | — | 固件版本 |
| school_id | BIGINT UNSIGNED | Y | NULL | FK → school.id (SET NULL) | 所属学校ID |
| location | VARCHAR(256) | Y | NULL | — | 安装位置描述 |
| last_heartbeat | DATETIME | Y | NULL | — | 最后心跳时间 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**唯一约束**：`uk_device_sn(sn)`
**索引**：`idx_device_school(school_id)`, `idx_device_status(status)`

---

### 7.2 rtsp_stream — RTSP视频流配置表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 视频流ID |
| name | VARCHAR(128) | N | — | — | 流名称 |
| url | VARCHAR(512) | N | — | — | RTSP流地址 |
| device_id | BIGINT UNSIGNED | Y | NULL | FK → device.id (SET NULL) | 关联设备ID |
| status | VARCHAR(32) | N | 'inactive' | — | 状态：active/inactive/error |
| protocol | VARCHAR(16) | N | 'rtsp' | — | 协议：rtsp/rtmp/webrtc |
| resolution | VARCHAR(32) | Y | NULL | — | 分辨率（如：1920x1080） |
| fps | INT | N | 25 | — | 帧率 |
| latency | INT | N | 0 | — | 延迟(ms) |
| encrypted | TINYINT | N | 0 | — | 是否加密：0=否 1=是 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_rs_device(device_id)`

---

### 7.3 venue — 场地资源表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 场地ID |
| name | VARCHAR(128) | N | — | — | 场地名称 |
| type | VARCHAR(64) | Y | NULL | — | 场地类型（操场/体育馆/活动室） |
| location | VARCHAR(512) | Y | NULL | — | 位置描述 |
| capacity | INT | N | 0 | — | 容纳人数 |
| status | VARCHAR(32) | N | 'available' | — | 状态：available/occupied/maintenance |
| facilities | TEXT | Y | NULL | — | 设施配置描述 |
| rules | TEXT | Y | NULL | — | 使用规则 |
| school_id | BIGINT UNSIGNED | Y | NULL | FK → school.id (SET NULL) | 所属学校ID |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_venue_school(school_id)`

---

## 8. AI识别与训练

### 8.1 ai_session — AI识别会话表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 会话记录ID |
| session_id | VARCHAR(64) | N | — | UK | AI会话唯一标识 |
| task_id | BIGINT UNSIGNED | N | — | FK → task.id (CASCADE) | 关联任务ID |
| class_id | BIGINT UNSIGNED | N | — | FK → class.id (CASCADE) | 关联班级ID |
| project | VARCHAR(64) | N | — | — | 运动项目名称 |
| status | VARCHAR(16) | N | 'running' | — | 状态：running/ended |
| ended_at | DATETIME(3) | Y | NULL | — | 结束时间 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**唯一约束**：`uk_ai_session_id(session_id)`
**索引**：`idx_ais_task(task_id)`, `idx_ais_class(class_id)`

---

### 8.2 ai_record — AI识别结果记录表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 记录ID |
| session_id | VARCHAR(64) | N | — | — | AI会话标识（逻辑FK → ai_session.session_id） |
| task_id | BIGINT UNSIGNED | N | — | — | 任务ID |
| class_id | BIGINT UNSIGNED | N | — | — | 班级ID |
| student_id | BIGINT UNSIGNED | N | — | — | 学生ID |
| count | INT UNSIGNED | N | 0 | — | AI计数结果 |
| violations | JSON | Y | NULL | — | 违规动作列表JSON |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_ar_session(session_id)`, `idx_ar_student(student_id)`, `idx_ar_task(task_id)`
**注意**：session_id 为字符串逻辑外键，未声明数据库级 FOREIGN KEY

---

### 8.3 training_record — 学生自主训练记录表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 记录ID |
| user_id | BIGINT UNSIGNED | Y | NULL | — | 用户ID |
| student_id | BIGINT UNSIGNED | Y | NULL | — | 学生ID |
| project | VARCHAR(32) | N | — | — | 训练项目 |
| result_json | JSON | Y | NULL | — | 训练结果JSON |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_tr_student(student_id)`, `idx_tr_user(user_id)`

---

### 8.4 ai_config — AI算法配置表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 配置ID |
| name | VARCHAR(128) | N | — | — | 配置名称 |
| category | VARCHAR(64) | N | — | — | 分类（跳绳/仰卧起坐/人脸识别等） |
| params | JSON | Y | NULL | — | 算法参数JSON |
| version | VARCHAR(32) | N | 'v1' | — | 版本号 |
| status | VARCHAR(32) | N | 'active' | — | 状态 |
| description | TEXT | Y | NULL | — | 配置描述 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

---

### 8.5 ai_model — AI模型管理表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 模型ID |
| name | VARCHAR(128) | N | — | — | 模型名称 |
| type | VARCHAR(64) | N | — | — | 模型类型（pose_estimation/object_detection/face_recognition） |
| file_url | VARCHAR(512) | Y | NULL | — | 模型文件URL |
| version | VARCHAR(32) | N | — | — | 模型版本 |
| status | VARCHAR(32) | N | 'active' | — | 状态：active/deprecated |
| accuracy | DECIMAL(5,2) | Y | NULL | — | 准确率(%) |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

---

## 9. 勋章与排行

### 9.1 badge — 勋章定义表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 勋章ID |
| name | VARCHAR(128) | N | — | — | 勋章名称 |
| icon | VARCHAR(512) | Y | NULL | — | 勋章图标URL |
| description | TEXT | Y | NULL | — | 勋章描述 |
| category | VARCHAR(64) | Y | NULL | — | 类别：skill/persistence/competition |
| condition_type | VARCHAR(64) | Y | NULL | — | 触发条件类型（daily_login/score_above/streak等） |
| condition_value | INT | N | 0 | — | 触发条件值 |
| status | VARCHAR(32) | N | 'active' | — | 状态 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

---

### 9.2 badge_award — 勋章授予记录表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 授予ID |
| badge_id | BIGINT UNSIGNED | N | — | FK → badge.id (CASCADE) | 勋章ID |
| student_id | BIGINT UNSIGNED | N | — | FK → student.id (CASCADE) | 学生ID |
| awarded_at | DATETIME(3) | N | — | — | 授予时间 |

**索引**：`idx_ba_badge(badge_id)`, `idx_ba_student(student_id)`

---

### 9.3 school_config — 学校级配置表（排行榜规则等）

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 配置ID |
| config_key | VARCHAR(64) | N | — | UK | 配置键 |
| config_json | JSON | Y | NULL | — | 配置值JSON |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**唯一约束**：`uk_school_config_key(config_key)`

---

## 10. 数据报告与预警

### 10.1 report — 学生体质报告表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 报告ID |
| student_id | BIGINT UNSIGNED | N | — | FK → student.id (CASCADE) | 学生ID |
| radar_data | JSON | N | — | — | 雷达图数据JSON（各项目得分） |
| dimension_scores | JSON | N | — | — | 维度得分JSON（力量/速度/耐力/柔韧/协调） |
| suggestions | TEXT | Y | NULL | — | AI生成的改善建议 |
| generated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 生成时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_report_student(student_id)`

---

### 10.2 alert — 安全预警表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 预警ID |
| class_id | BIGINT UNSIGNED | Y | NULL | — | 班级ID |
| student_id | BIGINT UNSIGNED | Y | NULL | — | 学生ID |
| type | VARCHAR(64) | N | 'ai_violation' | — | 预警类型：ai_violation/heart_rate/fall/collision |
| message | TEXT | N | — | — | 预警信息描述 |
| status | VARCHAR(16) | N | 'open' | — | 状态：open/resolved |
| violation_count | INT UNSIGNED | N | 0 | — | 违规次数 |
| period_date | VARCHAR(16) | Y | NULL | — | 统计周期日期 |
| resolved_at | DATETIME(3) | Y | NULL | — | 解决时间 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_alert_class(class_id)`, `idx_alert_student(student_id)`, `idx_alert_status(status)`, `idx_alert_type(type)`

---

### 10.3 exercise_prescription — 运动处方表（AI个性化训练方案）

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 处方ID |
| student_id | BIGINT UNSIGNED | N | — | FK → student.id (CASCADE) | 学生ID |
| title | VARCHAR(200) | N | — | — | 处方标题 |
| content | TEXT | Y | NULL | — | 处方内容描述 |
| category | VARCHAR(64) | Y | NULL | — | 分类（力量/耐力/柔韧/综合） |
| exercises | JSON | Y | NULL | — | 锻炼项目列表JSON |
| status | VARCHAR(32) | N | 'active' | — | 状态：active/completed/expired |
| source | VARCHAR(32) | Y | NULL | — | 来源：ai/manual |
| duration_days | INT | N | 0 | — | 持续天数 |
| start_date | DATE | Y | NULL | — | 开始日期 |
| end_date | DATE | Y | NULL | — | 结束日期 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_ep_student(student_id)`

---

## 11. 消息通知

### 11.1 message_record — 消息通知记录表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 消息ID |
| title | VARCHAR(200) | N | — | — | 消息标题 |
| content | TEXT | Y | NULL | — | 消息内容 |
| type | VARCHAR(32) | N | 'notification' | — | 类型：notification/homework_remind/parent_msg/system |
| target_type | VARCHAR(32) | N | 'all' | — | 目标范围：all/class/student/teacher/parent |
| target_ids | JSON | Y | NULL | — | 目标ID列表JSON |
| sender_id | BIGINT UNSIGNED | Y | NULL | — | 发送者用户ID |
| status | VARCHAR(32) | N | 'sent' | — | 状态：draft/sent/recalled |
| read_count | INT | N | 0 | — | 已读数量 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_mr_sender(sender_id)`, `idx_mr_type(type)`, `idx_mr_created(created_at)`

---

## 12. 系统管理

### 12.1 audit_log — 操作审计日志表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 日志ID |
| user_id | BIGINT UNSIGNED | Y | NULL | — | 操作人用户ID |
| username | VARCHAR(64) | N | '' | — | 操作人用户名 |
| action | VARCHAR(16) | N | — | — | 操作类型：CREATE/READ/UPDATE/DELETE |
| resource | VARCHAR(512) | N | — | — | 操作资源路径 |
| detail | TEXT | Y | NULL | — | 操作详情 |
| ip | VARCHAR(64) | N | '' | — | 客户端IP |
| duration | INT | N | 0 | — | 请求耗时(ms) |
| status | VARCHAR(16) | N | 'success' | — | 结果：success/error |
| error_message | VARCHAR(512) | Y | NULL | — | 错误信息 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_al_user(user_id)`, `idx_al_action(action)`, `idx_al_created(created_at)`

---

### 12.2 backup_record — 数据备份记录表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 备份ID |
| name | VARCHAR(200) | N | — | — | 备份名称 |
| type | VARCHAR(32) | N | 'full' | — | 备份类型：full/incremental |
| file_url | VARCHAR(512) | Y | NULL | — | 备份文件URL |
| file_size | BIGINT UNSIGNED | N | 0 | — | 备份文件大小(字节) |
| status | VARCHAR(32) | N | 'completed' | — | 状态：running/completed/failed |
| operator | VARCHAR(64) | Y | NULL | — | 操作人 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

---

### 12.3 sync_log — 教育局数据同步日志表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 日志ID |
| target | VARCHAR(64) | N | 'education_bureau' | — | 同步目标：education_bureau/third_party |
| status | VARCHAR(16) | N | 'success' | — | 状态：success/failed |
| record_count | INT UNSIGNED | N | 0 | — | 同步记录数 |
| request_body | LONGTEXT | Y | NULL | — | 请求报文 |
| response_body | LONGTEXT | Y | NULL | — | 响应报文 |
| error_message | TEXT | Y | NULL | — | 错误信息 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

**索引**：`idx_sl_target(target)`, `idx_sl_created(created_at)`

---

### 12.4 system_config — 系统全局配置表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 配置ID |
| config_key | VARCHAR(128) | N | — | UK | 配置键（如：site_name/upload_max_size） |
| config_value | TEXT | Y | NULL | — | 配置值 |
| category | VARCHAR(64) | Y | NULL | — | 分类（system/upload/notification） |
| description | VARCHAR(512) | Y | NULL | — | 配置说明 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**唯一约束**：`uk_system_config_key(config_key)`

---

### 12.5 app_version — APP版本管理表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 版本ID |
| platform | VARCHAR(32) | N | — | — | 平台：android/ios/wechat_mp/h5 |
| version | VARCHAR(32) | N | — | — | 版本号（如：1.0.0） |
| download_url | VARCHAR(512) | Y | NULL | — | 下载地址 |
| force_update | TINYINT | N | 0 | — | 是否强制更新：0=否 1=是 |
| release_notes | TEXT | Y | NULL | — | 更新说明 |
| status | VARCHAR(32) | N | 'active' | — | 状态：active/archived |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |

---

### 12.6 help_article — 帮助中心文章表

| 列名 | 类型 | 空 | 默认值 | 约束 | 说明 |
|------|------|:---:|--------|------|------|
| id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK | 文章ID |
| title | VARCHAR(200) | N | — | — | 文章标题 |
| content | TEXT | Y | NULL | — | 文章内容（Markdown/HTML） |
| category | VARCHAR(64) | Y | NULL | — | 分类（使用指南/常见问题/教学技巧） |
| sort_order | INT | N | 0 | — | 排序序号 |
| status | VARCHAR(32) | N | 'published' | — | 状态：draft/published/archived |
| view_count | INT | N | 0 | — | 浏览次数 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | — | 创建时间 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | ON UPDATE | 更新时间 |

**索引**：`idx_ha_category(category)`, `idx_ha_status(status)`

---

## 附录A：外键关系全景

| 源表.列 | → 目标表.列 | ON DELETE | 说明 |
|---------|------------|-----------|------|
| campus.school_id | school.id | RESTRICT | 校区→学校 |
| grade.school_id | school.id | RESTRICT | 年级→学校 |
| class.school_id | school.id | RESTRICT | 班级→学校 |
| class.grade_id | grade.id | RESTRICT | 班级→年级 |
| class.teacher_id | teacher.id | SET NULL | 班级→体育老师（延迟FK） |
| class.head_teacher_id | teacher.id | SET NULL | 班级→班主任（延迟FK） |
| class.pe_teacher_id | teacher.id | SET NULL | 班级→体育组长（延迟FK） |
| teacher.user_id | user.id | CASCADE | 教师→用户账号 |
| teacher.school_id | school.id | RESTRICT | 教师→学校 |
| student.user_id | user.id | CASCADE | 学生→用户账号 |
| student.class_id | class.id | RESTRICT | 学生→班级 |
| parent_student_access.parent_user_id | user.id | CASCADE | 家长绑定→用户 |
| parent_student_access.student_id | student.id | CASCADE | 家长绑定→学生 |
| user_role.user_id | user.id | CASCADE | 用户角色→用户 |
| user_role.role_id | role.id | CASCADE | 用户角色→角色 |
| task_checkin.task_id | task.id | CASCADE | 签到→任务 |
| task_checkin.student_id | student.id | CASCADE | 签到→学生 |
| score.task_id | task.id | CASCADE | 成绩→任务 |
| score.student_id | student.id | CASCADE | 成绩→学生 |
| score_review.score_id | score.id | CASCADE | 审核→成绩 |
| score_review.reviewer_id | user.id | SET NULL | 审核→审核人 |
| exam_standard.project_id | exam_project.id | CASCADE | 标准→项目 |
| exam_batch.plan_id | exam_plan.id | CASCADE | 批次→计划 |
| exam_batch.venue_id | venue.id | SET NULL | 批次→场地（延迟FK） |
| homework.created_by | user.id | RESTRICT | 作业→创建者 |
| homework_submission.homework_id | homework.id | CASCADE | 提交→作业 |
| homework_submission.student_id | student.id | CASCADE | 提交→学生 |
| homework_correction.submission_id | homework_submission.id | CASCADE | 批改→提交 |
| course_schedule.class_id | class.id | CASCADE | 课表→班级 |
| course_schedule.teacher_id | teacher.id | SET NULL | 课表→教师 |
| course_schedule.venue_id | venue.id | SET NULL | 课表→场地（延迟FK） |
| teaching_plan.teacher_id | teacher.id | SET NULL | 教学计划→教师 |
| device.school_id | school.id | SET NULL | 设备→学校 |
| rtsp_stream.device_id | device.id | SET NULL | 视频流→设备 |
| venue.school_id | school.id | SET NULL | 场地→学校 |
| ai_session.task_id | task.id | CASCADE | AI会话→任务 |
| ai_session.class_id | class.id | CASCADE | AI会话→班级 |
| badge_award.badge_id | badge.id | CASCADE | 勋章授予→勋章 |
| badge_award.student_id | student.id | CASCADE | 勋章授予→学生 |
| report.student_id | student.id | CASCADE | 报告→学生 |
| exercise_prescription.student_id | student.id | CASCADE | 运动处方→学生 |

---

## 附录B：唯一约束汇总

| 表名 | 约束名 | 列 |
|------|--------|-----|
| user | uk_user_username | username |
| role | uk_role_name | name |
| role | uk_role_code | code |
| user_role | uk_user_role | user_id, role_id |
| task_checkin | uk_checkin_task_student | task_id, student_id |
| parent_student_access | uk_parent_student | parent_user_id, student_id |
| device | uk_device_sn | sn |
| ai_session | uk_ai_session_id | session_id |
| school_config | uk_school_config_key | config_key |
| system_config | uk_system_config_key | config_key |

---

## 附录C：JSON列引用关系

以下列使用 JSON 数组存储关联ID，属于逻辑外键（非数据库级约束）：

| 表.列 | 引用目标 | 示例值 |
|--------|---------|--------|
| task.grade_ids | grade.id | [1, 2, 3] |
| task.class_ids | class.id | [10, 11, 12] |
| task.project_ids | exam_project.id | [1, 5, 8] |
| exam_plan.project_ids | exam_project.id | [1, 2, 3, 4] |
| exam_plan.grade_ids | grade.id | [1, 2] |
| exam_batch.class_ids | class.id | [10, 11] |
| homework.class_ids | class.id | [10, 11, 12] |
| role.permissions | 权限码字符串 | ["school:read", "student:write"] |
| teaching_plan.resource_ids | teaching_resource.id | [1, 2, 3] |
| message_record.target_ids | 各类目标ID | [100, 101] |
