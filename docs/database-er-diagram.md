# 蚁数智动平台 — 数据库ER图

> 生成日期：2026-04-11
> 数据源：`backend/src/*/entities/*.entity.ts`（TypeORM实体定义）
> 数据库：MySQL 8.0（库名 `smart_sports`）
> 实体总数：45张表

---

## 一、ER关系总图（Mermaid）

```mermaid
erDiagram
    %% =========================================
    %% 领域1：用户与组织架构
    %% =========================================

    user {
        bigint id PK
        varchar_64 username UK
        varchar_255 password
        varchar_32 role "默认student"
        varchar_64 name
        varchar_20 phone
        varchar_512 avatar
        datetime created_at
    }

    student {
        bigint id PK
        bigint user_id FK
        bigint class_id FK
        varchar_32 student_no
        varchar_20 parent_phone
        varchar_32 id_card
        tinyint gender
    }

    teacher {
        bigint id PK
        bigint user_id FK
        bigint school_id FK
        varchar_32 teacher_no
        varchar_64 subject "默认体育"
    }

    parent_student_access {
        bigint id PK
        bigint parent_user_id FK "→user"
        bigint student_id FK "→student"
        varchar_16 status "pending/approved/rejected"
        bigint reviewed_by_user_id FK
        datetime reviewed_at
        datetime created_at
    }

    school {
        bigint id PK
        varchar_128 name
        varchar_64 code
        varchar_512 address
        varchar_20 phone
        varchar_128 principal
        varchar_512 logo
        varchar_32 status
        datetime created_at
        datetime updated_at
    }

    campus {
        bigint id PK
        bigint school_id FK
        varchar_128 name
        varchar_512 address
        varchar_20 phone
        varchar_32 status
        datetime created_at
    }

    grade {
        bigint id PK
        varchar_64 name
        int sort_order
        varchar_16 school_year
        bigint school_id FK
        varchar_32 status
        datetime created_at
    }

    class {
        bigint id PK
        varchar_128 name
        varchar_32 class_no
        bigint school_id FK
        bigint grade_id FK
        varchar_32 grade
        varchar_32 school_year
        bigint teacher_id FK "体育老师"
        bigint head_teacher_id FK "班主任"
        bigint pe_teacher_id FK "体育组长"
    }

    %% --- 用户与组织关系 ---
    user ||--o| student : "1:1 账号→学生"
    user ||--o| teacher : "1:1 账号→教师"
    user ||--o{ parent_student_access : "家长绑定"
    student ||--o{ parent_student_access : "被绑定"
    student }o--|| class : "所属班级"
    teacher }o--o| school : "所属学校"
    school ||--o{ campus : "多校区"
    school ||--o{ grade : "年级"
    school ||--o{ class : "班级"
    grade ||--o{ class : "年级→班级"
    class }o--o| teacher : "teacher_id"
    class }o--o| teacher : "head_teacher_id"
    class }o--o| teacher : "pe_teacher_id"

    %% =========================================
    %% 领域2：RBAC权限
    %% =========================================

    role {
        bigint id PK
        varchar_64 name UK
        varchar_32 code UK
        varchar_256 description
        json permissions "权限码数组"
        varchar_32 status
        datetime created_at
    }

    user_role {
        bigint id PK
        bigint user_id FK "→user"
        bigint role_id FK "→role"
        datetime created_at
    }

    user ||--o{ user_role : "用户角色"
    role ||--o{ user_role : "角色分配"

    %% =========================================
    %% 领域3：体测管理
    %% =========================================

    task {
        bigint id PK
        varchar_128 name
        varchar_32 type
        json grade_ids "年级ID数组"
        json class_ids "班级ID数组"
        json project_ids "项目ID数组"
        datetime start_time
        datetime end_time
        varchar_16 status "draft/ongoing/finished"
        datetime created_at
        datetime updated_at
    }

    task_checkin {
        bigint id PK
        bigint task_id FK "→task"
        bigint student_id FK "→student"
        boolean checked
        datetime updated_at
    }

    score {
        bigint id PK
        bigint task_id FK
        bigint student_id FK
        varchar_64 project
        varchar_64 result
        varchar_32 unit
        varchar_16 review_status "pending/approved/rejected"
        varchar_255 review_remark
        tinyint sync_status "0未上报/1已上报/2失败"
        tinyint sync_retry_count
        datetime synced_at
        datetime created_at
        datetime updated_at
    }

    score_review {
        bigint id PK
        bigint score_id FK "→score"
        bigint reviewer_id FK "→user"
        varchar_32 status
        varchar_128 original_result
        varchar_128 corrected_result
        text reason
        text comment
        datetime created_at
    }

    task ||--o{ task_checkin : "签到"
    student ||--o{ task_checkin : "学生签到"
    task ||--o{ score : "任务成绩"
    student ||--o{ score : "学生成绩"
    score ||--o{ score_review : "成绩审核"

    %% =========================================
    %% 领域4：考试项目与标准
    %% =========================================

    exam_project {
        bigint id PK
        varchar_128 name
        varchar_64 category
        varchar_16 unit
        varchar_32 scoreType "count/time/distance"
        text description
        json params
        tinyint enabled
        int sort_order
        datetime created_at
        datetime updated_at
    }

    exam_standard {
        bigint id PK
        bigint project_id FK "→exam_project"
        varchar_32 gender
        int age_min
        int age_max
        varchar_32 grade_level
        json score_rules "评分规则"
        varchar_32 version
        tinyint enabled
        datetime created_at
        datetime updated_at
    }

    exam_plan {
        bigint id PK
        varchar_128 name
        varchar_16 school_year
        varchar_32 status "draft/active/completed"
        date start_date
        date end_date
        json project_ids
        json grade_ids
        text description
        datetime created_at
        datetime updated_at
    }

    exam_batch {
        bigint id PK
        bigint plan_id FK "→exam_plan"
        varchar_128 name
        date batch_date
        varchar_32 status
        json class_ids
        bigint venue_id FK "→venue"
        text notes
        datetime created_at
    }

    exam_project ||--o{ exam_standard : "考核标准"
    exam_plan ||--o{ exam_batch : "批次"

    %% =========================================
    %% 领域5：作业管理
    %% =========================================

    homework {
        bigint id PK
        varchar_128 title
        text description
        datetime deadline
        json class_ids
        bigint created_by FK "→user"
        datetime created_at
        datetime updated_at
    }

    homework_submission {
        bigint id PK
        bigint homework_id FK
        bigint student_id FK
        text content
        varchar_1024 video_url
        varchar_32 status
        decimal_5_2 teacher_score
        varchar_500 comment
        decimal_5_2 ai_score
        datetime submitted_at
    }

    homework_correction {
        bigint id PK
        bigint submission_id FK "→homework_submission"
        bigint reviewer_id FK "→user"
        decimal_5_2 ai_score
        decimal_5_2 manual_score
        text comment
        varchar_32 correction_type
        varchar_32 status
        datetime created_at
    }

    homework ||--o{ homework_submission : "作业提交"
    student ||--o{ homework_submission : "学生提交"
    homework_submission ||--o{ homework_correction : "批改"

    %% =========================================
    %% 领域6：教学管理
    %% =========================================

    course_schedule {
        bigint id PK
        bigint class_id FK "→class"
        bigint teacher_id FK "→teacher"
        varchar_64 subject
        tinyint day_of_week
        int period
        varchar_8 start_time
        varchar_8 end_time
        bigint venue_id FK "→venue"
        varchar_16 school_year
        tinyint semester
        varchar_32 status
        datetime created_at
    }

    teaching_plan {
        bigint id PK
        varchar_200 title
        bigint teacher_id FK "→teacher"
        bigint grade_id FK "→grade"
        varchar_16 school_year
        tinyint semester
        text content
        json resource_ids
        varchar_32 status
        datetime created_at
        datetime updated_at
    }

    teaching_resource {
        bigint id PK
        varchar_200 title
        varchar_32 type
        varchar_64 category
        varchar_512 file_url
        bigint file_size
        text description
        bigint uploader_id FK "→user"
        int download_count
        varchar_32 status
        datetime created_at
    }

    class ||--o{ course_schedule : "班级课表"
    teacher ||--o{ course_schedule : "教师课表"
    teacher ||--o{ teaching_plan : "教学计划"
    grade ||--o{ teaching_plan : "年级计划"

    %% =========================================
    %% 领域7：设备与场地
    %% =========================================

    device {
        bigint id PK
        varchar_128 name
        varchar_64 type
        varchar_64 sn UK
        varchar_64 ip
        varchar_32 status "online/offline/error"
        varchar_64 firmware_version
        bigint school_id FK "→school"
        varchar_256 location
        datetime last_heartbeat
        datetime created_at
        datetime updated_at
    }

    rtsp_stream {
        bigint id PK
        varchar_128 name
        varchar_512 url
        bigint device_id FK "→device"
        varchar_32 status
        varchar_16 protocol
        varchar_32 resolution
        int fps
        int latency
        tinyint encrypted
        datetime created_at
    }

    venue {
        bigint id PK
        varchar_128 name
        varchar_64 type
        varchar_512 location
        int capacity
        varchar_32 status
        text facilities
        text rules
        bigint school_id FK "→school"
        datetime created_at
        datetime updated_at
    }

    school ||--o{ device : "学校设备"
    device ||--o{ rtsp_stream : "视频流"
    school ||--o{ venue : "学校场地"
    venue ||--o{ course_schedule : "场地排课"
    venue ||--o{ exam_batch : "场地体测"

    %% =========================================
    %% 领域8：AI识别与训练
    %% =========================================

    ai_session {
        bigint id PK
        varchar_64 session_id UK
        bigint task_id FK "→task"
        bigint class_id FK "→class"
        varchar_64 project
        varchar_16 status "running/ended"
        datetime ended_at
        datetime created_at
        datetime updated_at
    }

    ai_record {
        bigint id PK
        varchar_64 session_id FK "→ai_session"
        bigint task_id FK "→task"
        bigint class_id FK "→class"
        bigint student_id FK "→student"
        int count
        json violations
        datetime created_at
    }

    training_record {
        bigint id PK
        bigint user_id FK "→user"
        bigint student_id FK "→student"
        varchar_32 project
        json result_json
        datetime created_at
    }

    ai_config {
        bigint id PK
        varchar_128 name
        varchar_64 category
        json params
        varchar_32 version
        varchar_32 status
        text description
        datetime created_at
        datetime updated_at
    }

    ai_model {
        bigint id PK
        varchar_128 name
        varchar_64 type
        varchar_512 file_url
        varchar_32 version
        varchar_32 status
        decimal_5_2 accuracy
        datetime created_at
    }

    task ||--o{ ai_session : "AI会话"
    class ||--o{ ai_session : "班级会话"
    ai_session ||--o{ ai_record : "识别记录"
    student ||--o{ ai_record : "学生记录"
    student ||--o{ training_record : "训练记录"

    %% =========================================
    %% 领域9：勋章与排行
    %% =========================================

    badge {
        bigint id PK
        varchar_128 name
        varchar_512 icon
        text description
        varchar_64 category "技能/坚持/竞赛"
        varchar_64 condition_type
        int condition_value
        varchar_32 status
        datetime created_at
    }

    badge_award {
        bigint id PK
        bigint badge_id FK "→badge"
        bigint student_id FK "→student"
        datetime awarded_at
    }

    school_config {
        bigint id PK
        varchar_64 config_key UK
        json config_json
        datetime created_at
        datetime updated_at
    }

    badge ||--o{ badge_award : "勋章授予"
    student ||--o{ badge_award : "获得勋章"

    %% =========================================
    %% 领域10：数据报告与预警
    %% =========================================

    report {
        bigint id PK
        bigint student_id FK "→student"
        json radar_data
        json dimension_scores
        text suggestions
        datetime generated_at
        datetime updated_at
    }

    alert {
        bigint id PK
        bigint class_id FK "→class"
        bigint student_id FK "→student"
        varchar_64 type "ai_violation等"
        text message
        varchar_16 status "open/resolved"
        int violation_count
        varchar_16 period_date
        datetime resolved_at
        datetime created_at
        datetime updated_at
    }

    exercise_prescription {
        bigint id PK
        bigint student_id FK "→student"
        varchar_200 title
        text content
        varchar_64 category
        json exercises
        varchar_32 status
        varchar_32 source
        int duration_days
        date start_date
        date end_date
        datetime created_at
        datetime updated_at
    }

    student ||--o{ report : "体质报告"
    student ||--o{ alert : "预警"
    class ||--o{ alert : "班级预警"
    student ||--o{ exercise_prescription : "运动处方"

    %% =========================================
    %% 领域11：消息通知
    %% =========================================

    message_record {
        bigint id PK
        varchar_200 title
        text content
        varchar_32 type "notification等"
        varchar_32 target_type "all/class/student"
        json target_ids
        bigint sender_id FK "→user"
        varchar_32 status
        int read_count
        datetime created_at
    }

    %% =========================================
    %% 领域12：系统管理
    %% =========================================

    audit_log {
        bigint id PK
        bigint user_id FK "→user"
        varchar_64 username
        varchar_16 action
        varchar_512 resource
        text detail
        varchar_64 ip
        int duration
        varchar_16 status
        varchar_512 error_message
        datetime created_at
    }

    backup_record {
        bigint id PK
        varchar_200 name
        varchar_32 type "full/incremental"
        varchar_512 file_url
        bigint file_size
        varchar_32 status
        varchar_64 operator
        datetime created_at
    }

    sync_log {
        bigint id PK
        varchar_64 target "education_bureau"
        varchar_16 status "success/failed"
        int record_count
        longtext request_body
        longtext response_body
        text error_message
        datetime created_at
    }

    system_config {
        bigint id PK
        varchar_128 config_key UK
        text config_value
        varchar_64 category
        varchar_512 description
        datetime updated_at
    }

    app_version {
        bigint id PK
        varchar_32 platform
        varchar_32 version
        varchar_512 download_url
        tinyint force_update
        text release_notes
        varchar_32 status
        datetime created_at
    }

    help_article {
        bigint id PK
        varchar_200 title
        text content
        varchar_64 category
        int sort_order
        varchar_32 status
        int view_count
        datetime created_at
        datetime updated_at
    }

    user ||--o{ audit_log : "操作日志"
```

---

## 二、实体关系汇总表

### 2.1 显式外键关系（TypeORM @ManyToOne + @JoinColumn）

| 源表 | 外键字段 | 目标表 | 删除策略 | 说明 |
|------|---------|--------|---------|------|
| student | user_id | user | CASCADE | 用户删→学生删 |
| student | class_id | class | RESTRICT | 不可删有学生的班级 |
| teacher | user_id | user | CASCADE | 用户删→教师删 |
| teacher | school_id | school | RESTRICT | 不可删有教师的学校 |
| grade | school_id | school | RESTRICT | 不可删有年级的学校 |
| class | school_id | school | RESTRICT | 不可删有班级的学校 |
| class | grade_id | grade | RESTRICT | 不可删有班级的年级 |
| class | teacher_id | teacher | SET NULL | 教师删→置空 |
| class | head_teacher_id | teacher | SET NULL | 班主任删→置空 |
| class | pe_teacher_id | teacher | SET NULL | 体育组长删→置空 |
| score | task_id | task | CASCADE | 任务删→成绩删 |
| score | student_id | student | CASCADE | 学生删→成绩删 |
| homework_submission | homework_id | homework | CASCADE | 作业删→提交删 |
| homework_submission | student_id | student | CASCADE | 学生删→提交删 |

### 2.2 逻辑外键关系（仅Column定义，无@ManyToOne装饰器）

| 源表 | 外键字段 | 目标表 | 说明 |
|------|---------|--------|------|
| campus | school_id | school | 校区→学校 |
| parent_student_access | parent_user_id | user | 家长账号 |
| parent_student_access | student_id | student | 被绑定学生 |
| parent_student_access | reviewed_by_user_id | user | 审核人 |
| user_role | user_id | user | 用户 |
| user_role | role_id | role | 角色 |
| task_checkin | task_id | task | 签到任务 |
| task_checkin | student_id | student | 签到学生 |
| score_review | score_id | score | 审核成绩 |
| score_review | reviewer_id | user | 审核人 |
| exam_standard | project_id | exam_project | 项目标准 |
| exam_batch | plan_id | exam_plan | 批次→计划 |
| exam_batch | venue_id | venue | 批次→场地 |
| homework | created_by | user | 作业创建者 |
| homework_correction | submission_id | homework_submission | 批改→提交 |
| homework_correction | reviewer_id | user | 批改人 |
| course_schedule | class_id | class | 课表→班级 |
| course_schedule | teacher_id | teacher | 课表→教师 |
| course_schedule | venue_id | venue | 课表→场地 |
| teaching_plan | teacher_id | teacher | 计划→教师 |
| teaching_plan | grade_id | grade | 计划→年级 |
| teaching_resource | uploader_id | user | 上传者 |
| device | school_id | school | 设备→学校 |
| rtsp_stream | device_id | device | 视频流→设备 |
| venue | school_id | school | 场地→学校 |
| ai_session | task_id | task | AI会话→任务 |
| ai_session | class_id | class | AI会话→班级 |
| ai_record | session_id | ai_session.session_id | AI记录→会话 |
| ai_record | task_id | task | AI记录→任务 |
| ai_record | class_id | class | AI记录→班级 |
| ai_record | student_id | student | AI记录→学生 |
| training_record | user_id | user | 训练→用户 |
| training_record | student_id | student | 训练→学生 |
| badge_award | badge_id | badge | 授奖→勋章 |
| badge_award | student_id | student | 授奖→学生 |
| report | student_id | student | 报告→学生 |
| alert | class_id | class | 预警→班级 |
| alert | student_id | student | 预警→学生 |
| exercise_prescription | student_id | student | 处方→学生 |
| message_record | sender_id | user | 发送者 |
| audit_log | user_id | user | 日志→用户 |

### 2.3 JSON数组引用关系（非外键，存储ID列表）

| 源表 | 字段 | 引用目标 | 说明 |
|------|------|---------|------|
| task | grade_ids | grade | 任务关联年级 |
| task | class_ids | class | 任务关联班级 |
| task | project_ids | exam_project | 任务关联项目 |
| homework | class_ids | class | 作业关联班级 |
| exam_plan | project_ids | exam_project | 计划关联项目 |
| exam_plan | grade_ids | grade | 计划关联年级 |
| exam_batch | class_ids | class | 批次关联班级 |
| teaching_plan | resource_ids | teaching_resource | 计划关联资源 |
| message_record | target_ids | user/class/student | 消息目标 |

---

## 三、领域分组说明

### 领域1 — 用户与组织架构（7表）
`user` → `student` / `teacher` / `parent_student_access`
`school` → `campus` / `grade` → `class`

核心设计：`user` 是统一登录账号表，`student`/`teacher` 通过 `user_id` 一对一关联实现角色扩展。`parent_student_access` 是家长-学生多对多的中间表。

### 领域2 — RBAC权限（2表）
`role` ←→ `user_role` ←→ `user`

核心设计：`role.permissions` 以JSON数组存储权限码（如 `school:read`、`student:write`）。`user_role` 是用户-角色多对多中间表。

### 领域3 — 体测管理（4表）
`task` → `task_checkin` / `score` → `score_review`

核心设计：`task` 存储体测任务，通过JSON字段引用年级/班级/项目。`score` 记录每个学生每个项目的成绩，支持审核状态和数据上报同步。

### 领域4 — 考试项目与标准（4表）
`exam_project` → `exam_standard`
`exam_plan` → `exam_batch`

核心设计：`exam_project` 定义运动项目（跳绳/跑步等），`exam_standard` 按性别/年龄/年级配置评分标准。`exam_plan` → `exam_batch` 管理体测计划和分批次执行。

### 领域5 — 作业管理（3表）
`homework` → `homework_submission` → `homework_correction`

核心设计：教师发布作业，学生提交（含视频），支持AI自动批改 + 教师人工复核双重评分机制。

### 领域6 — 教学管理（3表）
`course_schedule`、`teaching_plan`、`teaching_resource`

核心设计：课表按 班级×星期×节次 排列，关联教师和场地。教学计划按学期管理，可引用教学资源库。

### 领域7 — 设备与场地（3表）
`device` → `rtsp_stream`、`venue`

核心设计：设备通过SN唯一标识，支持心跳在线监控。RTSP视频流关联设备。场地供课表和体测批次引用。

### 领域8 — AI识别与训练（5表）
`ai_session` → `ai_record`、`training_record`、`ai_config`、`ai_model`

核心设计：`ai_session` 跟踪每次AI识别会话（任务+班级+项目维度），`ai_record` 记录每个学生的识别结果和违规信息。`training_record` 记录学生自主训练数据。

### 领域9 — 勋章与排行（3表）
`badge` → `badge_award`、`school_config`

核心设计：勋章定义触发条件（技能类/坚持类/竞赛类），`badge_award` 记录学生获奖。`school_config` 存储排行榜等学校级配置。

### 领域10 — 数据报告与预警（3表）
`report`、`alert`、`exercise_prescription`

核心设计：`report` 存储学生体质雷达图数据。`alert` 记录安全预警事件。`exercise_prescription` 存储AI生成的个性化运动处方。

### 领域11 — 消息通知（1表）
`message_record`

核心设计：支持全员/班级/个人三种推送范围，通过 `target_type` + `target_ids` 灵活配置。

### 领域12 — 系统管理（6表）
`audit_log`、`backup_record`、`sync_log`、`system_config`、`app_version`、`help_article`

核心设计：操作审计日志、数据备份记录、教育局数据同步日志、系统配置、APP版本管理、帮助中心。

---

## 四、唯一约束索引汇总

| 表 | 唯一约束 | 说明 |
|----|---------|------|
| user | username | 登录名唯一 |
| role | name | 角色名唯一 |
| role | code | 角色编码唯一 |
| device | sn | 设备序列号唯一 |
| ai_session | session_id | 会话ID唯一 |
| system_config | config_key | 配置键唯一 |
| school_config | config_key | 学校配置键唯一 |
| parent_student_access | [parent_user_id, student_id] | 家长-学生绑定唯一 |
| task_checkin | [task_id, student_id] | 任务-学生签到唯一 |

---

## 五、数据统计

| 统计项 | 数值 |
|--------|------|
| 实体总数 | 45 |
| 显式外键关系 (@ManyToOne) | 14 |
| 逻辑外键关系 (仅Column) | 30 |
| JSON数组引用关系 | 9 |
| 唯一约束索引 | 9 |
| 领域分组 | 12 |
