import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 基线迁移 — V0 初始 Schema
 *
 * 本迁移标记当前 45 张表结构（db/mysql_schema.sql）为版本基线。
 *
 * up():
 *   - 检查 school 表是否已存在（代表 schema 已通过 mysql_schema.sql 或 synchronize 创建）
 *   - 若已存在则跳过（幂等），若不存在则从 mysql_schema.sql 全量建表
 *
 * down():
 *   - 基线迁移不可回退（回退即删库），仅打印警告
 *
 * 背景:
 *   在本迁移之前，表结构通过以下方式管理：
 *   1. TypeORM synchronize: true（开发环境自动同步）
 *   2. scripts/db-migrate-compat.js（9个自研迁移补丁）
 *   3. db/mysql_schema.sql（全量建表脚本）
 *   本迁移将这些方式统一为 TypeORM migrations 机制。
 */
export class Baseline1713100000000 implements MigrationInterface {
  name = 'Baseline1713100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查是否已有表结构（幂等：若已存在则跳过）
    const result = await queryRunner.query(`
      SELECT COUNT(*) AS c
        FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'school'
    `);
    if (Number(result[0].c) > 0) {
      console.log('[Baseline] 表已存在，跳过基线建表（已有 schema 被标记为 V0）');
      return;
    }

    console.log('[Baseline] 首次初始化，创建全部 45 张表...');

    // 关闭外键检查以避免创建顺序依赖
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    // =========================================================================
    // 领域1：用户与组织架构（8表）
    // =========================================================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`school\` (
        \`id\`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '学校ID',
        \`name\`       VARCHAR(128)    NOT NULL                COMMENT '学校名称',
        \`code\`       VARCHAR(64)     NULL                    COMMENT '学校编码',
        \`address\`    VARCHAR(512)    NULL                    COMMENT '学校地址',
        \`phone\`      VARCHAR(20)     NULL                    COMMENT '联系电话',
        \`principal\`  VARCHAR(128)    NULL                    COMMENT '校长姓名',
        \`logo\`       VARCHAR(512)    NULL                    COMMENT '学校Logo URL',
        \`status\`     VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态',
        \`created_at\` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
        \`updated_at\` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学校信息表'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`campus\` (
        \`id\`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '校区ID',
        \`school_id\`  BIGINT UNSIGNED NOT NULL                COMMENT '所属学校ID',
        \`name\`       VARCHAR(128)    NOT NULL                COMMENT '校区名称',
        \`address\`    VARCHAR(512)    NULL                    COMMENT '校区地址',
        \`phone\`      VARCHAR(20)     NULL                    COMMENT '联系电话',
        \`status\`     VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态',
        \`created_at\` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_campus_school\` (\`school_id\`),
        CONSTRAINT \`fk_campus_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`school\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校区信息表'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`user\` (
        \`id\`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
        \`username\`   VARCHAR(64)     NOT NULL                COMMENT '登录用户名',
        \`password\`   VARCHAR(255)    NOT NULL                COMMENT '密码（BCrypt哈希）',
        \`role\`       VARCHAR(32)     NOT NULL DEFAULT 'student' COMMENT '默认角色',
        \`name\`       VARCHAR(64)     NOT NULL DEFAULT ''     COMMENT '姓名',
        \`phone\`      VARCHAR(20)     NULL                    COMMENT '手机号',
        \`avatar\`     VARCHAR(512)    NULL                    COMMENT '头像URL',
        \`created_at\` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_username\` (\`username\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户账号表'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`grade\` (
        \`id\`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '年级ID',
        \`name\`        VARCHAR(64)     NOT NULL                COMMENT '年级名称',
        \`sort_order\`  INT             NOT NULL DEFAULT 0      COMMENT '排序序号',
        \`school_year\` VARCHAR(16)     NOT NULL                COMMENT '学年',
        \`school_id\`   BIGINT UNSIGNED NULL                    COMMENT '所属学校ID',
        \`status\`      VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态',
        \`created_at\`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_grade_school\` (\`school_id\`),
        CONSTRAINT \`fk_grade_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`school\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='年级信息表'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`class\` (
        \`id\`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '班级ID',
        \`name\`            VARCHAR(128)    NOT NULL                COMMENT '班级名称',
        \`class_no\`        VARCHAR(32)     NULL                    COMMENT '班级编号',
        \`school_id\`       BIGINT UNSIGNED NOT NULL                COMMENT '所属学校ID',
        \`grade_id\`        BIGINT UNSIGNED NOT NULL                COMMENT '所属年级ID',
        \`grade\`           VARCHAR(32)     NOT NULL                COMMENT '年级名称（冗余）',
        \`school_year\`     VARCHAR(32)     NOT NULL                COMMENT '学年',
        \`teacher_id\`      BIGINT UNSIGNED NULL                    COMMENT '体育老师ID',
        \`head_teacher_id\` BIGINT UNSIGNED NULL                    COMMENT '班主任ID',
        \`pe_teacher_id\`   BIGINT UNSIGNED NULL                    COMMENT '体育组长ID',
        PRIMARY KEY (\`id\`),
        KEY \`idx_class_school\` (\`school_id\`),
        KEY \`idx_class_grade\` (\`grade_id\`),
        KEY \`idx_class_teacher\` (\`teacher_id\`),
        CONSTRAINT \`fk_class_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`school\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`fk_class_grade\`  FOREIGN KEY (\`grade_id\`)  REFERENCES \`grade\`(\`id\`)  ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级信息表'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`teacher\` (
        \`id\`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '教师ID',
        \`user_id\`    BIGINT UNSIGNED NOT NULL                COMMENT '关联用户ID',
        \`school_id\`  BIGINT UNSIGNED NULL                    COMMENT '所属学校ID',
        \`teacher_no\` VARCHAR(32)     NOT NULL                COMMENT '教师工号',
        \`subject\`    VARCHAR(64)     NOT NULL DEFAULT '体育'  COMMENT '任教学科',
        PRIMARY KEY (\`id\`),
        KEY \`idx_teacher_user\` (\`user_id\`),
        KEY \`idx_teacher_school\` (\`school_id\`),
        CONSTRAINT \`fk_teacher_user\`   FOREIGN KEY (\`user_id\`)   REFERENCES \`user\`(\`id\`)   ON DELETE CASCADE  ON UPDATE CASCADE,
        CONSTRAINT \`fk_teacher_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`school\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师信息表'
    `);

    // class 表的教师外键（延迟添加）
    await queryRunner.query(`
      ALTER TABLE \`class\`
        ADD CONSTRAINT \`fk_class_teacher\`      FOREIGN KEY (\`teacher_id\`)      REFERENCES \`teacher\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT \`fk_class_head_teacher\` FOREIGN KEY (\`head_teacher_id\`) REFERENCES \`teacher\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT \`fk_class_pe_teacher\`   FOREIGN KEY (\`pe_teacher_id\`)   REFERENCES \`teacher\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`student\` (
        \`id\`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '学生ID',
        \`user_id\`      BIGINT UNSIGNED NOT NULL                COMMENT '关联用户ID',
        \`class_id\`     BIGINT UNSIGNED NOT NULL                COMMENT '所属班级ID',
        \`student_no\`   VARCHAR(32)     NOT NULL                COMMENT '学号',
        \`parent_phone\` VARCHAR(20)     NULL                    COMMENT '家长手机号',
        \`id_card\`      VARCHAR(32)     NULL                    COMMENT '身份证号',
        \`gender\`       TINYINT UNSIGNED NULL                   COMMENT '性别：0=女 1=男',
        PRIMARY KEY (\`id\`),
        KEY \`idx_student_user\` (\`user_id\`),
        KEY \`idx_student_class\` (\`class_id\`),
        CONSTRAINT \`fk_student_user\`  FOREIGN KEY (\`user_id\`)  REFERENCES \`user\`(\`id\`)  ON DELETE CASCADE  ON UPDATE CASCADE,
        CONSTRAINT \`fk_student_class\` FOREIGN KEY (\`class_id\`) REFERENCES \`class\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生信息表'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`parent_student_access\` (
        \`id\`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '绑定ID',
        \`parent_user_id\`     BIGINT UNSIGNED NOT NULL                COMMENT '家长用户ID',
        \`student_id\`         BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
        \`status\`             VARCHAR(16)     NOT NULL DEFAULT 'pending' COMMENT '状态',
        \`reviewed_by_user_id\` BIGINT UNSIGNED NULL                   COMMENT '审核人用户ID',
        \`reviewed_at\`        DATETIME(3)     NULL                    COMMENT '审核时间',
        \`created_at\`         DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_parent_student\` (\`parent_user_id\`, \`student_id\`),
        KEY \`idx_psa_student\` (\`student_id\`),
        CONSTRAINT \`fk_psa_parent\`  FOREIGN KEY (\`parent_user_id\`) REFERENCES \`user\`(\`id\`)    ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_psa_student\` FOREIGN KEY (\`student_id\`)     REFERENCES \`student\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家长-学生绑定关系表'
    `);

    // =========================================================================
    // 领域2：RBAC权限（2表）
    // =========================================================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`role\` (
        \`id\`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色ID',
        \`name\`        VARCHAR(64)     NOT NULL                COMMENT '角色名称',
        \`code\`        VARCHAR(32)     NOT NULL                COMMENT '角色编码',
        \`description\` VARCHAR(256)    NULL                    COMMENT '角色描述',
        \`permissions\` JSON            NULL                    COMMENT '权限码数组',
        \`status\`      VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态',
        \`created_at\`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_role_name\` (\`name\`),
        UNIQUE KEY \`uk_role_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色定义表'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`user_role\` (
        \`id\`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关联ID',
        \`user_id\`    BIGINT UNSIGNED NOT NULL                COMMENT '用户ID',
        \`role_id\`    BIGINT UNSIGNED NOT NULL                COMMENT '角色ID',
        \`created_at\` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_role\` (\`user_id\`, \`role_id\`),
        KEY \`idx_ur_role\` (\`role_id\`),
        CONSTRAINT \`fk_ur_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_ur_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-角色关联表'
    `);

    // =========================================================================
    // 领域3-12 的剩余表（使用简洁的批量 CREATE TABLE）
    // 完整定义见 db/mysql_schema.sql，此处为可执行版本
    // =========================================================================

    // --- 领域3：体测管理 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`task\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(128) NOT NULL, \`type\` VARCHAR(32) NOT NULL, \`grade_ids\` JSON NOT NULL, \`class_ids\` JSON NOT NULL, \`project_ids\` JSON NOT NULL, \`start_time\` DATETIME(3) NOT NULL, \`end_time\` DATETIME(3) NOT NULL, \`status\` VARCHAR(16) NOT NULL DEFAULT 'draft', \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_task_status\` (\`status\`), KEY \`idx_task_time\` (\`start_time\`, \`end_time\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`task_checkin\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`task_id\` BIGINT UNSIGNED NOT NULL, \`student_id\` BIGINT UNSIGNED NOT NULL, \`checked\` TINYINT(1) NOT NULL DEFAULT 0, \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), UNIQUE KEY \`uk_checkin_task_student\` (\`task_id\`, \`student_id\`), KEY \`idx_checkin_student\` (\`student_id\`), CONSTRAINT \`fk_checkin_task\` FOREIGN KEY (\`task_id\`) REFERENCES \`task\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT \`fk_checkin_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`score\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`task_id\` BIGINT UNSIGNED NOT NULL, \`student_id\` BIGINT UNSIGNED NOT NULL, \`project\` VARCHAR(64) NOT NULL, \`result\` VARCHAR(64) NOT NULL, \`unit\` VARCHAR(32) NOT NULL, \`review_status\` VARCHAR(16) NOT NULL DEFAULT 'pending', \`review_remark\` VARCHAR(255) NULL, \`ai_raw_data\` JSON NULL, \`sync_status\` TINYINT UNSIGNED NOT NULL DEFAULT 0, \`sync_retry_count\` TINYINT UNSIGNED NOT NULL DEFAULT 0, \`synced_at\` DATETIME(3) NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_score_task\` (\`task_id\`), KEY \`idx_score_student\` (\`student_id\`), KEY \`idx_score_review\` (\`review_status\`), KEY \`idx_score_project\` (\`project\`), CONSTRAINT \`fk_score_task\` FOREIGN KEY (\`task_id\`) REFERENCES \`task\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT \`fk_score_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`score_review\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`score_id\` BIGINT UNSIGNED NOT NULL, \`reviewer_id\` BIGINT UNSIGNED NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'pending', \`original_result\` VARCHAR(128) NULL, \`corrected_result\` VARCHAR(128) NULL, \`reason\` TEXT NULL, \`comment\` TEXT NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_sr_score\` (\`score_id\`), KEY \`idx_sr_reviewer\` (\`reviewer_id\`), CONSTRAINT \`fk_sr_score\` FOREIGN KEY (\`score_id\`) REFERENCES \`score\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT \`fk_sr_reviewer\` FOREIGN KEY (\`reviewer_id\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // --- 领域4：考试项目与标准 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`exam_project\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(128) NOT NULL, \`category\` VARCHAR(64) NULL, \`unit\` VARCHAR(16) NULL, \`score_type\` VARCHAR(32) NOT NULL DEFAULT 'count', \`description\` TEXT NULL, \`params\` JSON NULL, \`enabled\` TINYINT NOT NULL DEFAULT 1, \`sort_order\` INT NOT NULL DEFAULT 0, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`exam_standard\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`project_id\` BIGINT UNSIGNED NOT NULL, \`gender\` VARCHAR(32) NOT NULL, \`age_min\` INT NULL, \`age_max\` INT NULL, \`grade_level\` VARCHAR(32) NULL, \`score_rules\` JSON NULL, \`version\` VARCHAR(32) NOT NULL DEFAULT 'v1', \`enabled\` TINYINT NOT NULL DEFAULT 1, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_es_project\` (\`project_id\`), KEY \`idx_es_gender_grade\` (\`gender\`, \`grade_level\`), CONSTRAINT \`fk_es_project\` FOREIGN KEY (\`project_id\`) REFERENCES \`exam_project\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`exam_plan\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(128) NOT NULL, \`school_year\` VARCHAR(16) NOT NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'draft', \`start_date\` DATE NULL, \`end_date\` DATE NULL, \`project_ids\` JSON NULL, \`grade_ids\` JSON NULL, \`description\` TEXT NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`exam_batch\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`plan_id\` BIGINT UNSIGNED NOT NULL, \`name\` VARCHAR(128) NOT NULL, \`batch_date\` DATE NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'pending', \`class_ids\` JSON NULL, \`venue_id\` BIGINT UNSIGNED NULL, \`notes\` TEXT NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_eb_plan\` (\`plan_id\`), CONSTRAINT \`fk_eb_plan\` FOREIGN KEY (\`plan_id\`) REFERENCES \`exam_plan\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // --- 领域5：作业管理 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`homework\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`title\` VARCHAR(128) NOT NULL, \`description\` TEXT NULL, \`deadline\` DATETIME(3) NOT NULL, \`class_ids\` JSON NOT NULL, \`created_by\` BIGINT UNSIGNED NOT NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_hw_creator\` (\`created_by\`), KEY \`idx_hw_deadline\` (\`deadline\`), CONSTRAINT \`fk_hw_creator\` FOREIGN KEY (\`created_by\`) REFERENCES \`user\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`homework_submission\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`homework_id\` BIGINT UNSIGNED NOT NULL, \`student_id\` BIGINT UNSIGNED NOT NULL, \`content\` TEXT NULL, \`video_url\` VARCHAR(1024) NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'submitted', \`teacher_score\` DECIMAL(5,2) NULL, \`comment\` VARCHAR(500) NULL, \`ai_score\` DECIMAL(5,2) NULL, \`submitted_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_hs_homework\` (\`homework_id\`), KEY \`idx_hs_student\` (\`student_id\`), CONSTRAINT \`fk_hs_homework\` FOREIGN KEY (\`homework_id\`) REFERENCES \`homework\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT \`fk_hs_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`homework_correction\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`submission_id\` BIGINT UNSIGNED NOT NULL, \`reviewer_id\` BIGINT UNSIGNED NULL, \`ai_score\` DECIMAL(5,2) NULL, \`manual_score\` DECIMAL(5,2) NULL, \`comment\` TEXT NULL, \`correction_type\` VARCHAR(32) NOT NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'pending', \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_hc_submission\` (\`submission_id\`), CONSTRAINT \`fk_hc_submission\` FOREIGN KEY (\`submission_id\`) REFERENCES \`homework_submission\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // --- 领域6：教学管理 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`course_schedule\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`class_id\` BIGINT UNSIGNED NOT NULL, \`teacher_id\` BIGINT UNSIGNED NULL, \`subject\` VARCHAR(64) NOT NULL DEFAULT '体育', \`day_of_week\` TINYINT NOT NULL, \`period\` INT NOT NULL, \`start_time\` VARCHAR(8) NOT NULL, \`end_time\` VARCHAR(8) NOT NULL, \`venue_id\` BIGINT UNSIGNED NULL, \`school_year\` VARCHAR(16) NOT NULL, \`semester\` TINYINT NOT NULL DEFAULT 1, \`status\` VARCHAR(32) NOT NULL DEFAULT 'active', \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_cs_class\` (\`class_id\`), KEY \`idx_cs_teacher\` (\`teacher_id\`), KEY \`idx_cs_day_period\` (\`day_of_week\`, \`period\`), CONSTRAINT \`fk_cs_class\` FOREIGN KEY (\`class_id\`) REFERENCES \`class\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT \`fk_cs_teacher\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`teacher\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`teaching_plan\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`title\` VARCHAR(200) NOT NULL, \`teacher_id\` BIGINT UNSIGNED NULL, \`grade_id\` BIGINT UNSIGNED NULL, \`school_year\` VARCHAR(16) NOT NULL, \`semester\` TINYINT NOT NULL DEFAULT 1, \`content\` TEXT NULL, \`resource_ids\` JSON NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'draft', \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_tp_teacher\` (\`teacher_id\`), CONSTRAINT \`fk_tp_teacher\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`teacher\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`teaching_resource\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`title\` VARCHAR(200) NOT NULL, \`type\` VARCHAR(32) NOT NULL, \`category\` VARCHAR(64) NULL, \`file_url\` VARCHAR(512) NOT NULL, \`file_size\` BIGINT UNSIGNED NOT NULL DEFAULT 0, \`description\` TEXT NULL, \`uploader_id\` BIGINT UNSIGNED NULL, \`download_count\` INT NOT NULL DEFAULT 0, \`status\` VARCHAR(32) NOT NULL DEFAULT 'active', \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_tr_uploader\` (\`uploader_id\`), KEY \`idx_tr_type\` (\`type\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // --- 领域7：设备与场地 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`device\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(128) NOT NULL, \`type\` VARCHAR(64) NOT NULL, \`sn\` VARCHAR(64) NOT NULL, \`ip\` VARCHAR(64) NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'offline', \`firmware_version\` VARCHAR(64) NULL, \`school_id\` BIGINT UNSIGNED NULL, \`location\` VARCHAR(256) NULL, \`last_heartbeat\` DATETIME NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), UNIQUE KEY \`uk_device_sn\` (\`sn\`), KEY \`idx_device_school\` (\`school_id\`), KEY \`idx_device_status\` (\`status\`), CONSTRAINT \`fk_device_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`school\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`rtsp_stream\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(128) NOT NULL, \`url\` VARCHAR(512) NOT NULL, \`device_id\` BIGINT UNSIGNED NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'inactive', \`protocol\` VARCHAR(16) NOT NULL DEFAULT 'rtsp', \`resolution\` VARCHAR(32) NULL, \`fps\` INT NOT NULL DEFAULT 25, \`latency\` INT NOT NULL DEFAULT 0, \`encrypted\` TINYINT NOT NULL DEFAULT 0, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_rs_device\` (\`device_id\`), CONSTRAINT \`fk_rs_device\` FOREIGN KEY (\`device_id\`) REFERENCES \`device\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`venue\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(128) NOT NULL, \`type\` VARCHAR(64) NULL, \`location\` VARCHAR(512) NULL, \`capacity\` INT NOT NULL DEFAULT 0, \`status\` VARCHAR(32) NOT NULL DEFAULT 'available', \`facilities\` TEXT NULL, \`rules\` TEXT NULL, \`school_id\` BIGINT UNSIGNED NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_venue_school\` (\`school_id\`), CONSTRAINT \`fk_venue_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`school\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 延迟外键：exam_batch → venue, course_schedule → venue
    await queryRunner.query(`ALTER TABLE \`exam_batch\` ADD CONSTRAINT \`fk_eb_venue\` FOREIGN KEY (\`venue_id\`) REFERENCES \`venue\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE \`course_schedule\` ADD CONSTRAINT \`fk_cs_venue\` FOREIGN KEY (\`venue_id\`) REFERENCES \`venue\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);

    // --- 领域8：AI识别与训练 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`ai_session\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`session_id\` VARCHAR(64) NOT NULL, \`task_id\` BIGINT UNSIGNED NOT NULL, \`class_id\` BIGINT UNSIGNED NOT NULL, \`project\` VARCHAR(64) NOT NULL, \`status\` VARCHAR(16) NOT NULL DEFAULT 'running', \`ended_at\` DATETIME(3) NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), UNIQUE KEY \`uk_ai_session_id\` (\`session_id\`), KEY \`idx_ais_task\` (\`task_id\`), KEY \`idx_ais_class\` (\`class_id\`), CONSTRAINT \`fk_ais_task\` FOREIGN KEY (\`task_id\`) REFERENCES \`task\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT \`fk_ais_class\` FOREIGN KEY (\`class_id\`) REFERENCES \`class\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`ai_record\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`session_id\` VARCHAR(64) NOT NULL, \`task_id\` BIGINT UNSIGNED NOT NULL, \`class_id\` BIGINT UNSIGNED NOT NULL, \`student_id\` BIGINT UNSIGNED NOT NULL, \`count\` INT UNSIGNED NOT NULL DEFAULT 0, \`violations\` JSON NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_ar_session\` (\`session_id\`), KEY \`idx_ar_student\` (\`student_id\`), KEY \`idx_ar_task\` (\`task_id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`training_record\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`user_id\` BIGINT UNSIGNED NULL, \`student_id\` BIGINT UNSIGNED NULL, \`project\` VARCHAR(32) NOT NULL, \`result_json\` JSON NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_tr_student\` (\`student_id\`), KEY \`idx_tr_user\` (\`user_id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`ai_config\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(128) NOT NULL, \`category\` VARCHAR(64) NOT NULL, \`params\` JSON NULL, \`version\` VARCHAR(32) NOT NULL DEFAULT 'v1', \`status\` VARCHAR(32) NOT NULL DEFAULT 'active', \`description\` TEXT NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`ai_model\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(128) NOT NULL, \`type\` VARCHAR(64) NOT NULL, \`file_url\` VARCHAR(512) NULL, \`version\` VARCHAR(32) NOT NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'active', \`accuracy\` DECIMAL(5,2) NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // --- 领域9：勋章与排行 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`badge\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(128) NOT NULL, \`icon\` VARCHAR(512) NULL, \`description\` TEXT NULL, \`category\` VARCHAR(64) NULL, \`condition_type\` VARCHAR(64) NULL, \`condition_value\` INT NOT NULL DEFAULT 0, \`status\` VARCHAR(32) NOT NULL DEFAULT 'active', \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`badge_award\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`badge_id\` BIGINT UNSIGNED NOT NULL, \`student_id\` BIGINT UNSIGNED NOT NULL, \`awarded_at\` DATETIME(3) NOT NULL, PRIMARY KEY (\`id\`), KEY \`idx_ba_badge\` (\`badge_id\`), KEY \`idx_ba_student\` (\`student_id\`), CONSTRAINT \`fk_ba_badge\` FOREIGN KEY (\`badge_id\`) REFERENCES \`badge\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT \`fk_ba_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`school_config\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`config_key\` VARCHAR(64) NOT NULL, \`config_json\` JSON NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), UNIQUE KEY \`uk_school_config_key\` (\`config_key\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // --- 领域10：数据报告与预警 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`report\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`student_id\` BIGINT UNSIGNED NOT NULL, \`radar_data\` JSON NOT NULL, \`dimension_scores\` JSON NOT NULL, \`suggestions\` TEXT NULL, \`generated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_report_student\` (\`student_id\`), CONSTRAINT \`fk_report_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`alert\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`class_id\` BIGINT UNSIGNED NULL, \`student_id\` BIGINT UNSIGNED NULL, \`type\` VARCHAR(64) NOT NULL DEFAULT 'ai_violation', \`message\` TEXT NOT NULL, \`status\` VARCHAR(16) NOT NULL DEFAULT 'open', \`violation_count\` INT UNSIGNED NOT NULL DEFAULT 0, \`period_date\` VARCHAR(16) NULL, \`resolved_at\` DATETIME(3) NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_alert_class\` (\`class_id\`), KEY \`idx_alert_student\` (\`student_id\`), KEY \`idx_alert_status\` (\`status\`), KEY \`idx_alert_type\` (\`type\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`exercise_prescription\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`student_id\` BIGINT UNSIGNED NOT NULL, \`title\` VARCHAR(200) NOT NULL, \`content\` TEXT NULL, \`category\` VARCHAR(64) NULL, \`exercises\` JSON NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'active', \`source\` VARCHAR(32) NULL, \`duration_days\` INT NOT NULL DEFAULT 0, \`start_date\` DATE NULL, \`end_date\` DATE NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_ep_student\` (\`student_id\`), CONSTRAINT \`fk_ep_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // --- 领域11：消息通知 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`message_record\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`title\` VARCHAR(200) NOT NULL, \`content\` TEXT NULL, \`type\` VARCHAR(32) NOT NULL DEFAULT 'notification', \`target_type\` VARCHAR(32) NOT NULL DEFAULT 'all', \`target_ids\` JSON NULL, \`sender_id\` BIGINT UNSIGNED NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'sent', \`read_count\` INT NOT NULL DEFAULT 0, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_mr_sender\` (\`sender_id\`), KEY \`idx_mr_type\` (\`type\`), KEY \`idx_mr_created\` (\`created_at\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // --- 领域12：系统管理 ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`audit_log\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`user_id\` BIGINT UNSIGNED NULL, \`username\` VARCHAR(64) NOT NULL DEFAULT '', \`action\` VARCHAR(16) NOT NULL, \`resource\` VARCHAR(512) NOT NULL, \`detail\` TEXT NULL, \`ip\` VARCHAR(64) NOT NULL DEFAULT '', \`duration\` INT NOT NULL DEFAULT 0, \`status\` VARCHAR(16) NOT NULL DEFAULT 'success', \`error_message\` VARCHAR(512) NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_al_user\` (\`user_id\`), KEY \`idx_al_action\` (\`action\`), KEY \`idx_al_created\` (\`created_at\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`backup_record\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(200) NOT NULL, \`type\` VARCHAR(32) NOT NULL DEFAULT 'full', \`file_url\` VARCHAR(512) NULL, \`file_size\` BIGINT UNSIGNED NOT NULL DEFAULT 0, \`status\` VARCHAR(32) NOT NULL DEFAULT 'completed', \`operator\` VARCHAR(64) NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`sync_log\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`target\` VARCHAR(64) NOT NULL DEFAULT 'education_bureau', \`status\` VARCHAR(16) NOT NULL DEFAULT 'success', \`record_count\` INT UNSIGNED NOT NULL DEFAULT 0, \`request_body\` LONGTEXT NULL, \`response_body\` LONGTEXT NULL, \`error_message\` TEXT NULL, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_sl_target\` (\`target\`), KEY \`idx_sl_created\` (\`created_at\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`system_config\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`config_key\` VARCHAR(128) NOT NULL, \`config_value\` TEXT NULL, \`category\` VARCHAR(64) NULL, \`description\` VARCHAR(512) NULL, \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), UNIQUE KEY \`uk_system_config_key\` (\`config_key\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`app_version\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`platform\` VARCHAR(32) NOT NULL, \`version\` VARCHAR(32) NOT NULL, \`download_url\` VARCHAR(512) NULL, \`force_update\` TINYINT NOT NULL DEFAULT 0, \`release_notes\` TEXT NULL, \`status\` VARCHAR(32) NOT NULL DEFAULT 'active', \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`help_article\` (\`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \`title\` VARCHAR(200) NOT NULL, \`content\` TEXT NULL, \`category\` VARCHAR(64) NULL, \`sort_order\` INT NOT NULL DEFAULT 0, \`status\` VARCHAR(32) NOT NULL DEFAULT 'published', \`view_count\` INT NOT NULL DEFAULT 0, \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), KEY \`idx_ha_category\` (\`category\`), KEY \`idx_ha_status\` (\`status\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 恢复外键检查
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('[Baseline] 45 张表创建完成');
  }

  public async down(): Promise<void> {
    console.warn('[Baseline] 基线迁移不支持回退（等同于删除全部表）。如需重建请使用 db/mysql_schema.sql');
  }
}
