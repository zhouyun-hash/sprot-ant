/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function toSnakeCase(name) {
  return name.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const idx = s.indexOf('=');
    if (idx <= 0) continue;
    const k = s.slice(0, idx).trim();
    const v = s.slice(idx + 1).trim();
    env[k] = v;
  }
  return env;
}

async function existsTable(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?`,
    [tableName],
  );
  return Number(rows[0].c) > 0;
}

async function existsColumn(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );
  return Number(rows[0].c) > 0;
}

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migration (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(128) NOT NULL,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uk_schema_migration_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function hasMigration(conn, name) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS c FROM schema_migration WHERE name = ?',
    [name],
  );
  return Number(rows[0].c) > 0;
}

async function markMigration(conn, name) {
  await conn.query('INSERT INTO schema_migration(name) VALUES (?)', [name]);
}

async function applyMigration(conn, name, fn) {
  if (await hasMigration(conn, name)) {
    console.log(`- skip ${name} (already applied)`);
    return;
  }
  await fn();
  await markMigration(conn, name);
  console.log(`- done ${name}`);
}

function listEntityFiles(dir) {
  const out = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      out.push(...listEntityFiles(full));
    } else if (it.isFile() && it.name.endsWith('.entity.ts')) {
      out.push(full);
    }
  }
  return out;
}

function parseOptionValue(argText, key) {
  const strMatch = argText.match(new RegExp(`${key}\\s*:\\s*'([^']+)'`));
  if (strMatch) return strMatch[1];
  const boolMatch = argText.match(new RegExp(`${key}\\s*:\\s*(true|false)`));
  if (boolMatch) return boolMatch[1] === 'true';
  const numMatch = argText.match(new RegExp(`${key}\\s*:\\s*(\\d+)`));
  if (numMatch) return Number(numMatch[1]);
  return undefined;
}

function mapSqlType(kind, argText, tsType) {
  if (kind === 'PrimaryGeneratedColumn') return 'BIGINT UNSIGNED';
  const declared = parseOptionValue(argText, 'type');
  switch (declared) {
    case 'bigint':
      return parseOptionValue(argText, 'unsigned') === true
        ? 'BIGINT UNSIGNED'
        : 'BIGINT';
    case 'int':
      return 'INT';
    case 'tinyint':
      return 'TINYINT';
    case 'boolean':
      return 'TINYINT(1)';
    case 'varchar': {
      const len = parseOptionValue(argText, 'length') || 255;
      return `VARCHAR(${len})`;
    }
    case 'text':
      return 'TEXT';
    case 'json':
    case 'simple-json':
      return 'JSON';
    case 'datetime':
      return 'DATETIME(3)';
    case 'date':
      return 'DATE';
    case 'decimal': {
      const p = parseOptionValue(argText, 'precision') || 10;
      const s = parseOptionValue(argText, 'scale') || 2;
      return `DECIMAL(${p},${s})`;
    }
    default:
      break;
  }
  if (tsType === 'number') return 'INT';
  if (tsType === 'boolean') return 'TINYINT(1)';
  if (tsType === 'Date') return 'DATETIME(3)';
  return 'VARCHAR(255)';
}

function parseEntityFile(content) {
  const em = content.match(/@Entity\('([^']+)'\)/);
  if (!em) return null;
  const table = em[1];

  const lines = content.split(/\r?\n/);
  const cols = [];
  for (let i = 0; i < lines.length; i++) {
    const d = lines[i].trim();
    const dm = d.match(
      /^@(PrimaryGeneratedColumn|Column|CreateDateColumn|UpdateDateColumn)\((.*)\)$/,
    );
    if (!dm) continue;
    const kind = dm[1];
    const argText = dm[2] || '';

    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    if (j >= lines.length) continue;
    const pm = lines[j].trim().match(/^([a-zA-Z_]\w*)\??:\s*([a-zA-Z_]\w*)/);
    if (!pm) continue;
    const prop = pm[1];
    const tsType = pm[2];
    const explicitName = parseOptionValue(argText, 'name');
    // 与 TypeORM 默认一致：未写 name 时用属性名（多为 camelCase）
    const colName = explicitName || prop;
    const nullable = Boolean(parseOptionValue(argText, 'nullable'));
    const sqlType = mapSqlType(kind, argText, tsType);

    cols.push({
      kind,
      name: colName,
      sqlType,
      nullable,
      primary: kind === 'PrimaryGeneratedColumn',
    });
  }

  if (!cols.some((c) => c.primary)) {
    cols.unshift({
      kind: 'PrimaryGeneratedColumn',
      name: 'id',
      sqlType: 'BIGINT UNSIGNED',
      nullable: false,
      primary: true,
    });
  }
  return { table, cols };
}

async function ensureEntityTables(conn) {
  const srcRoot = path.resolve(__dirname, '..', 'src');
  const files = listEntityFiles(srcRoot);
  const entities = files
    .map((f) => parseEntityFile(fs.readFileSync(f, 'utf8')))
    .filter(Boolean);

  let created = 0;
  let altered = 0;

  for (const e of entities) {
    const table = e.table;
    const hasTable = await existsTable(conn, table);
    if (!hasTable) {
      const defs = e.cols.map((c) => {
        if (c.primary) {
          return `\`${c.name}\` ${c.sqlType} NOT NULL AUTO_INCREMENT`;
        }
        const nullSql = c.nullable ? 'NULL' : 'NOT NULL';
        let extra = '';
        if (c.kind === 'CreateDateColumn') {
          extra = ' DEFAULT CURRENT_TIMESTAMP(3)';
        } else if (c.kind === 'UpdateDateColumn') {
          extra = ' DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)';
        }
        return `\`${c.name}\` ${c.sqlType} ${nullSql}${extra}`;
      });
      const primary = e.cols.find((c) => c.primary);
      defs.push(`PRIMARY KEY (\`${primary.name}\`)`);
      await conn.query(
        `CREATE TABLE \`${table}\` (${defs.join(',')}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      created++;
      continue;
    }

    for (const c of e.cols) {
      // 非破坏性：只补不存在列
      if (await existsColumn(conn, table, c.name)) continue;
      if (c.primary) {
        await conn.query(
          `ALTER TABLE \`${table}\` ADD COLUMN \`${c.name}\` ${c.sqlType} NOT NULL AUTO_INCREMENT PRIMARY KEY`,
        );
      } else {
        const nullSql = c.nullable ? 'NULL' : 'NOT NULL';
        let extra = '';
        if (c.kind === 'CreateDateColumn') {
          extra = ' DEFAULT CURRENT_TIMESTAMP(3)';
        } else if (c.kind === 'UpdateDateColumn') {
          extra = ' DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)';
        }
        await conn.query(
          `ALTER TABLE \`${table}\` ADD COLUMN \`${c.name}\` ${c.sqlType} ${nullSql}${extra}`,
        );
      }
      altered++;
    }
  }

  console.log(
    `- entity guard checked ${entities.length} entities, created ${created} tables, added ${altered} columns`,
  );
}

/** 与历史 mysql_schema.sql 种子一致：明文密码 Admin123456（bcrypt） */
const DEFAULT_ADMIN_HASH =
  '$2b$10$bKIogYfYJU3BbtFQENVD2eyvR66VU0zXR6RMVvWm92tYZJA6ukS7K';

async function ensureDefaultAdmin(conn) {
  if (!(await existsTable(conn, 'user'))) {
    console.log('- skip default admin (no user table yet)');
    return;
  }
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS c FROM `user` WHERE username = ?',
    ['admin'],
  );
  if (Number(rows[0].c) > 0) return;
  await conn.query(
    'INSERT INTO `user` (`username`, `password`, `role`, `name`) VALUES (?, ?, ?, ?)',
    ['admin', DEFAULT_ADMIN_HASH, 'admin', '系统管理员'],
  );
  console.log(
    '- seeded default admin (username: admin, password: Admin123456 — 登录后请修改)',
  );
}

async function main() {
  const fileEnv = loadEnv();
  const host = process.env.DB_HOST || fileEnv.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || fileEnv.DB_PORT || 3306);
  const user = process.env.DB_USERNAME || fileEnv.DB_USERNAME || 'root';
  const password = process.env.DB_PASSWORD || fileEnv.DB_PASSWORD || '';
  const database = process.env.DB_DATABASE || fileEnv.DB_DATABASE || 'smart_sports';

  const conn = await mysql.createConnection({ host, port, user, password, database });
  console.log(`Connected: ${user}@${host}:${port}/${database}`);
  await ensureMigrationsTable(conn);

  await applyMigration(conn, '20260402_rename_school_class_to_class', async () => {
    const hasClass = await existsTable(conn, 'class');
    const hasSchoolClass = await existsTable(conn, 'school_class');
    if (!hasClass && hasSchoolClass) {
      await conn.query('RENAME TABLE `school_class` TO `class`');
      return;
    }
    if (!hasClass && !hasSchoolClass) {
      await conn.query(`
        CREATE TABLE \`class\` (
          \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          \`name\` VARCHAR(128) NOT NULL,
          \`grade\` VARCHAR(32) NOT NULL,
          \`school_year\` VARCHAR(32) NOT NULL,
          \`teacher_id\` BIGINT UNSIGNED DEFAULT NULL,
          PRIMARY KEY (\`id\`),
          KEY \`idx_class_teacher\` (\`teacher_id\`),
          KEY \`idx_class_grade_year\` (\`grade\`, \`school_year\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  });

  await applyMigration(conn, '20260402_fix_grade_columns', async () => {
    const hasGrade = await existsTable(conn, 'grade');
    if (!hasGrade) return;

    const hasSortOrder = await existsColumn(conn, 'grade', 'sort_order');
    const hasSortOrderCamel = await existsColumn(conn, 'grade', 'sortOrder');
    if (!hasSortOrder && hasSortOrderCamel) {
      await conn.query(
        'ALTER TABLE `grade` CHANGE COLUMN `sortOrder` `sort_order` INT NOT NULL DEFAULT 0',
      );
    } else if (!hasSortOrder) {
      await conn.query(
        'ALTER TABLE `grade` ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0 AFTER `name`',
      );
    }

    const hasSchoolYear = await existsColumn(conn, 'grade', 'school_year');
    const hasSchoolYearCamel = await existsColumn(conn, 'grade', 'schoolYear');
    if (!hasSchoolYear && hasSchoolYearCamel) {
      await conn.query(
        'ALTER TABLE `grade` CHANGE COLUMN `schoolYear` `school_year` VARCHAR(16) NOT NULL',
      );
    }
  });

  await applyMigration(conn, '20260402_fix_training_record_columns', async () => {
    const hasTrainingRecord = await existsTable(conn, 'training_record');
    if (!hasTrainingRecord) return;

    if (!(await existsColumn(conn, 'training_record', 'user_id'))) {
      await conn.query('ALTER TABLE `training_record` ADD COLUMN `user_id` BIGINT UNSIGNED NULL');
    }
    if (!(await existsColumn(conn, 'training_record', 'student_id'))) {
      await conn.query('ALTER TABLE `training_record` ADD COLUMN `student_id` BIGINT UNSIGNED NULL');
    }
    if (!(await existsColumn(conn, 'training_record', 'result_json'))) {
      await conn.query('ALTER TABLE `training_record` ADD COLUMN `result_json` JSON NULL');
    }
    if (!(await existsColumn(conn, 'training_record', 'created_at'))) {
      await conn.query(
        'ALTER TABLE `training_record` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)',
      );
    }
  });

  await applyMigration(conn, '20260402_create_task_checkin_table', async () => {
    if (await existsTable(conn, 'task_checkin')) return;
    await conn.query(`
      CREATE TABLE \`task_checkin\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`task_id\` BIGINT UNSIGNED NOT NULL,
        \`student_id\` BIGINT UNSIGNED NOT NULL,
        \`checked\` TINYINT(1) NOT NULL DEFAULT 0,
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_task_checkin_task_student\` (\`task_id\`, \`student_id\`),
        KEY \`idx_task_checkin_task\` (\`task_id\`),
        KEY \`idx_task_checkin_student\` (\`student_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  });

  await applyMigration(conn, '20260402_fix_class_core_columns', async () => {
    const hasClass = await existsTable(conn, 'class');
    if (!hasClass) return;
    if (!(await existsColumn(conn, 'class', 'school_year'))) {
      await conn.query(
        'ALTER TABLE `class` ADD COLUMN `school_year` VARCHAR(32) NOT NULL DEFAULT "2025-2026" AFTER `grade`',
      );
    }
    if (!(await existsColumn(conn, 'class', 'teacher_id'))) {
      await conn.query(
        'ALTER TABLE `class` ADD COLUMN `teacher_id` BIGINT UNSIGNED NULL AFTER `school_year`',
      );
    }
  });

  await applyMigration(conn, '20260403_fix_class_dual_ownership_columns', async () => {
    const hasClass = await existsTable(conn, 'class');
    if (!hasClass) return;

    // 必须先有 class_no，再在其后追加 school_id（旧脚本顺序错误会导致 Unknown column 'class_no'）
    if (!(await existsColumn(conn, 'class', 'class_no'))) {
      await conn.query(
        'ALTER TABLE `class` ADD COLUMN `class_no` VARCHAR(32) NULL AFTER `name`',
      );
    }
    if (!(await existsColumn(conn, 'class', 'school_id'))) {
      await conn.query(
        'ALTER TABLE `class` ADD COLUMN `school_id` BIGINT UNSIGNED NULL AFTER `class_no`',
      );
    }
    if (!(await existsColumn(conn, 'class', 'grade_id'))) {
      await conn.query(
        'ALTER TABLE `class` ADD COLUMN `grade_id` BIGINT UNSIGNED NULL AFTER `school_id`',
      );
    }
    if (!(await existsColumn(conn, 'class', 'head_teacher_id'))) {
      await conn.query(
        'ALTER TABLE `class` ADD COLUMN `head_teacher_id` BIGINT UNSIGNED NULL AFTER `teacher_id`',
      );
    }
    if (!(await existsColumn(conn, 'class', 'pe_teacher_id'))) {
      await conn.query(
        'ALTER TABLE `class` ADD COLUMN `pe_teacher_id` BIGINT UNSIGNED NULL AFTER `head_teacher_id`',
      );
    }
  });

  await applyMigration(conn, '20260403_backfill_teacher_school_id_from_class', async () => {
    const hasTeacher = await existsTable(conn, 'teacher');
    const hasClass = await existsTable(conn, 'class');
    if (!hasTeacher || !hasClass) return;
    if (!(await existsColumn(conn, 'teacher', 'school_id'))) return;
    if (!(await existsColumn(conn, 'teacher', 'id'))) return;
    if (!(await existsColumn(conn, 'class', 'school_id'))) return;
    if (!(await existsColumn(conn, 'class', 'head_teacher_id'))) return;
    if (!(await existsColumn(conn, 'class', 'pe_teacher_id'))) return;

    // 回填 teacher.school_id：优先使用该教师任教班级（班主任/体育老师）中的 school_id。
    await conn.query(`
      UPDATE \`teacher\` t
      INNER JOIN (
        SELECT x.teacher_id, MIN(x.school_id) AS school_id
        FROM (
          SELECT c.head_teacher_id AS teacher_id, c.school_id
          FROM \`class\` c
          WHERE c.head_teacher_id IS NOT NULL AND c.school_id IS NOT NULL
          UNION ALL
          SELECT c.pe_teacher_id AS teacher_id, c.school_id
          FROM \`class\` c
          WHERE c.pe_teacher_id IS NOT NULL AND c.school_id IS NOT NULL
        ) x
        GROUP BY x.teacher_id
      ) m ON m.teacher_id = t.id
      SET t.school_id = m.school_id
      WHERE t.school_id IS NULL
    `);
  });

  await applyMigration(conn, '20260407_fix_exam_project_defaults', async () => {
    const hasExamProject = await existsTable(conn, 'exam_project');
    if (!hasExamProject) return;
    if (await existsColumn(conn, 'exam_project', 'enabled')) {
      await conn.query(
        'ALTER TABLE `exam_project` MODIFY COLUMN `enabled` TINYINT NOT NULL DEFAULT 1',
      );
      await conn.query('UPDATE `exam_project` SET `enabled` = 1 WHERE `enabled` IS NULL');
    }
    if (await existsColumn(conn, 'exam_project', 'sort_order')) {
      await conn.query(
        'ALTER TABLE `exam_project` MODIFY COLUMN `sort_order` INT NOT NULL DEFAULT 0',
      );
      await conn.query(
        'UPDATE `exam_project` SET `sort_order` = 0 WHERE `sort_order` IS NULL',
      );
    }
    if (await existsColumn(conn, 'exam_project', 'score_type')) {
      await conn.query(
        "ALTER TABLE `exam_project` MODIFY COLUMN `score_type` VARCHAR(32) NOT NULL DEFAULT 'count'",
      );
      await conn.query(
        "UPDATE `exam_project` SET `score_type` = 'count' WHERE `score_type` IS NULL OR `score_type` = ''",
      );
    }
  });

  await applyMigration(conn, '20260408_normalize_exam_project_score_type', async () => {
    const hasExamProject = await existsTable(conn, 'exam_project');
    if (!hasExamProject) return;
    if (!(await existsColumn(conn, 'exam_project', 'score_type'))) return;
    await conn.query(`
      UPDATE \`exam_project\` SET \`score_type\` = 'time'
      WHERE \`score_type\` IN ('计时','timing','TIME','Time')
    `);
    await conn.query(`
      UPDATE \`exam_project\` SET \`score_type\` = 'count'
      WHERE \`score_type\` IN ('计数','COUNT','Count')
         OR \`score_type\` IS NULL
         OR \`score_type\` = ''
    `);
    await conn.query(`
      UPDATE \`exam_project\` SET \`score_type\` = 'distance'
      WHERE \`score_type\` IN ('计距','DISTANCE','Distance')
    `);
    await conn.query(`
      UPDATE \`exam_project\` SET \`score_type\` = 'count'
      WHERE \`score_type\` NOT IN ('time','count','distance')
    `);
  });

  // 每次执行都进行一次“全实体表结构守护”，确保新实体也被纳入。
  await ensureEntityTables(conn);

  await ensureDefaultAdmin(conn);

  await conn.end();
  console.log('Schema compatibility migrations complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

