# 蚁数智动平台 — 数据库迁移管理指南

> **技术栈**：TypeORM 0.3 + NestJS 10 + MySQL 8.0
> **建立日期**：2026-04-15
> **适用范围**：`backend/` 子项目

---

## 目录

1. [架构概述](#1-架构概述)
2. [环境配置](#2-环境配置)
3. [日常开发流程](#3-日常开发流程)
4. [命令速查](#4-命令速查)
5. [文件结构](#5-文件结构)
6. [迁移编写规范](#6-迁移编写规范)
7. [部署流程](#7-部署流程)
8. [常见场景](#8-常见场景)
9. [注意事项](#9-注意事项)
10. [历史迁移机制](#10-历史迁移机制)
11. [故障排查](#11-故障排查)

---

## 1. 架构概述

### 迁移机制选型

| 方案 | 说明 | 本项目采用 |
|------|------|:---:|
| `synchronize: true` | TypeORM 自动对齐实体与表结构，会丢数据 | 已禁用 |
| TypeORM Migrations | 版本化 SQL 变更，可回退，生产安全 | **采用** |
| 自研脚本 | `scripts/db-migrate-compat.js`，早期使用 | 已归档 |

### 核心原则

1. **所有 Schema 变更必须通过迁移文件**，禁止手动修改数据库
2. **迁移文件一旦提交不可修改**（已在其他环境执行过）
3. **每个迁移必须可回退**（`down()` 方法）
4. **应用启动时自动执行**未运行的迁移（`migrationsRun: true`）

### 关键文件

```
backend/
├── src/
│   ├── data-source.ts              ← TypeORM CLI 数据源（独立于 NestJS）
│   ├── migrations/
│   │   └── 1713100000000-Baseline.ts  ← V0 基线：45 张表初始 Schema
│   └── app.module.ts               ← NestJS 运行时配置（含 migrations 路径）
├── package.json                     ← npm scripts: migration:*
├── scripts/
│   └── db-migrate-compat.js         ← 旧迁移脚本（已归档，仅供参考）
└── .env.example                     ← 环境变量说明
```

---

## 2. 环境配置

### 环境变量

在 `backend/.env` 中配置：

```bash
# 数据库连接
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=smart_sports

# 迁移控制
DB_SYNC=false              # 保持 false（已用 migrations 管理 Schema）
DB_MIGRATIONS_RUN=true     # 应用启动时自动执行迁移（默认 true）
DB_LOGGING=true            # 开发时建议开启 SQL 日志
```

| 变量 | 用途 | 开发环境 | 生产环境 |
|------|------|----------|----------|
| `DB_SYNC` | TypeORM synchronize | `false` | **`false`（严禁修改）** |
| `DB_MIGRATIONS_RUN` | 启动时自动迁移 | `true` | `true`（或 `false` + 手动执行） |
| `DB_LOGGING` | SQL 日志 | `true` | `false` |

### 首次初始化

新环境初始化有两种方式：

**方式 A：通过迁移自动建表（推荐）**
```bash
cd backend
npm install
npm run migration:run
# 迁移会自动创建全部 45 张表
# 然后导入种子数据
mysql -u root -p smart_sports < ../db/seed_data.sql
```

**方式 B：直接执行 SQL 脚本**
```bash
mysql -u root -p < ../db/mysql_schema.sql
mysql -u root -p smart_sports < ../db/seed_data.sql
# 然后标记基线迁移为已执行（避免重复建表）
npm run migration:run
# 基线迁移检测到表已存在会自动跳过
```

---

## 3. 日常开发流程

### 场景：修改实体后生成迁移

```
┌─────────────────────┐
│  1. 修改 Entity 文件 │
│  (*.entity.ts)       │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  2. 生成迁移文件     │
│  npm run migration:  │
│  generate -- src/    │
│  migrations/XXX      │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  3. 检查生成的 SQL   │
│  确认变更无误        │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  4. 执行迁移         │
│  npm run migration:  │
│  run                 │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  5. 提交迁移文件     │
│  git add + commit    │
└─────────────────────┘
```

### 详细步骤

**Step 1：修改实体**

编辑 `src/*/entities/*.entity.ts`，例如给 `student` 表添加 `birthday` 字段：

```typescript
// src/student/entities/student.entity.ts
@Column({ name: 'birthday', type: 'date', nullable: true })
birthday: string | null;
```

**Step 2：生成迁移**

```bash
npm run migration:generate -- src/migrations/AddStudentBirthday
```

这会在 `src/migrations/` 下生成类似 `1713200000000-AddStudentBirthday.ts` 的文件，内含自动推导的 `ALTER TABLE` 语句。

**Step 3：检查生成的 SQL**

打开生成的文件，确认 `up()` 和 `down()` 中的 SQL 正确合理。自动生成可能有多余操作（如重建索引），需人工审核。

**Step 4：执行迁移**

```bash
npm run migration:run
```

或重启应用（`migrationsRun: true` 时自动执行）。

**Step 5：提交**

```bash
git add src/migrations/1713200000000-AddStudentBirthday.ts
git commit -m "feat(db): 学生表添加 birthday 字段"
```

---

## 4. 命令速查

所有命令在 `backend/` 目录下执行：

| 命令 | 功能 | 说明 |
|------|------|------|
| `npm run migration:generate -- src/migrations/Name` | 对比实体与数据库，自动生成迁移 | 最常用，需先 `build` |
| `npm run migration:run` | 执行所有未运行的迁移 | 按时间戳顺序执行 |
| `npm run migration:revert` | 回退最近一次迁移 | 执行 `down()` 方法 |
| `npm run migration:show` | 查看迁移状态 | 显示哪些已执行/未执行 |

> **注意**：所有 `migration:*` 命令内部会先执行 `npm run build`，确保 `dist/` 中有最新编译。

### 手动创建空迁移

当需要执行数据迁移（非 Schema 变更）时，手动创建迁移文件：

```bash
# 在 src/migrations/ 下创建，文件名格式：{timestamp}-{Name}.ts
# 时间戳用 Date.now() 生成
```

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillStudentGender1713300000000 implements MigrationInterface {
  name = 'BackfillStudentGender1713300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE student SET gender = 1 WHERE gender IS NULL AND id_card LIKE '%1'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 数据回填无法精确回退，记录日志即可
    console.warn('BackfillStudentGender: 数据回填无法自动回退');
  }
}
```

---

## 5. 文件结构

### 迁移文件命名规范

```
{timestamp}-{PascalCaseName}.ts
```

- **timestamp**：13 位 Unix 毫秒时间戳（`Date.now()`），保证全局唯一和执行顺序
- **Name**：PascalCase 描述性名称

示例：
```
1713100000000-Baseline.ts              ← 基线迁移（V0）
1713200000000-AddStudentBirthday.ts     ← 添加字段
1713300000000-CreateNotificationTable.ts ← 新建表
1713400000000-BackfillScoreUnits.ts     ← 数据回填
```

### 迁移跟踪表

TypeORM 自动创建 `migrations` 表（在 `smart_sports` 库中）：

```sql
-- TypeORM 自动管理，无需手动操作
CREATE TABLE `migrations` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `timestamp` BIGINT NOT NULL,
  `name`      VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
);
```

---

## 6. 迁移编写规范

### 必须遵循

1. **每个迁移文件只做一件事**：一个功能/一张表的变更
2. **`down()` 必须实现**：能回退 `up()` 的所有操作
3. **使用 `IF NOT EXISTS` / `IF EXISTS`**：保证幂等性
4. **大表 DDL 加注释**：评估锁表时间（> 100 万行需特别注意）
5. **不在迁移中写业务逻辑**：仅 Schema 变更和数据迁移

### 禁止事项

1. **禁止修改已提交的迁移文件**（其他环境可能已执行）
2. **禁止在迁移中使用 `synchronize`**
3. **禁止删除列/表而不备份数据**（先备份再删除）
4. **禁止在生产迁移中使用 `DROP TABLE`**（使用重命名归档）

### 推荐模式

**添加列**（安全操作）：
```typescript
await queryRunner.query(`ALTER TABLE \`student\` ADD COLUMN \`birthday\` DATE NULL COMMENT '出生日期'`);
```

**删除列**（危险操作，需先确认无引用）：
```typescript
// up: 先重命名为 _deprecated，保留一个版本观察
await queryRunner.query(`ALTER TABLE \`student\` CHANGE \`old_col\` \`_deprecated_old_col\` VARCHAR(32) NULL`);
// 下一个版本的迁移再真正删除
```

**重命名表**：
```typescript
await queryRunner.query(`RENAME TABLE \`old_name\` TO \`new_name\``);
```

---

## 7. 部署流程

### 开发环境

```bash
# 拉取最新代码后
cd backend
npm install
npm run dev
# migrationsRun: true → 自动执行新迁移
```

### 生产环境

```bash
# 方式1：应用启动自动迁移（简单场景）
npm run build
npm run start:prod
# 应用启动时自动执行

# 方式2：CI/CD 中先迁移再启动（推荐）
npm run build
npm run migration:run       # 先执行迁移
npm run start:prod           # 再启动应用
```

### Docker Compose 集成

```yaml
services:
  api:
    build: ./backend
    command: >
      sh -c "npm run migration:run && node dist/main.js"
    depends_on:
      mysql:
        condition: service_healthy
```

---

## 8. 常见场景

### 场景1：新建一张表

1. 创建 Entity 文件 `src/xxx/entities/xxx.entity.ts`
2. 在对应 Module 中注册 Entity
3. `npm run migration:generate -- src/migrations/CreateXxxTable`
4. 检查生成的 SQL → `npm run migration:run`

### 场景2：修改已有列类型

1. 修改 Entity 的 `@Column` 装饰器
2. `npm run migration:generate -- src/migrations/ChangeXxxColumnType`
3. **仔细检查**：TypeORM 可能生成 DROP + ADD 而非 ALTER，确认数据不会丢失
4. 测试通过后执行

### 场景3：添加外键约束

1. 在 Entity 中添加 `@ManyToOne` 关系
2. `npm run migration:generate -- src/migrations/AddXxxForeignKey`
3. 检查外键名、ON DELETE 策略

### 场景4：回退出错的迁移

```bash
npm run migration:revert     # 回退最近一次
npm run migration:revert     # 可多次执行，依次回退
```

### 场景5：跳过某个迁移

如果某个迁移不适用于当前环境，可手动标记为已执行：

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1713200000000, 'AddStudentBirthday1713200000000');
```

---

## 9. 注意事项

### synchronize 策略

| 场景 | DB_SYNC | 说明 |
|------|---------|------|
| 正常开发 | `false` | 通过迁移管理 Schema |
| 快速原型验证 | `true`（临时） | 验证后立即改回 `false` 并生成迁移 |
| 生产环境 | `false` | **严禁修改** |

### 与 autoLoadEntities 的关系

- `app.module.ts` 使用 `autoLoadEntities: true`（NestJS 自动加载）
- `data-source.ts` 使用 `entities: [glob pattern]`（CLI 需要显式路径）
- 两者加载的实体集合相同，只是机制不同

### 迁移与种子数据的区别

| | 迁移 (migrations) | 种子数据 (seed_data.sql) |
|---|---|---|
| 目的 | Schema 变更 | 初始化测试/基础数据 |
| 执行时机 | 每次部署自动执行 | 仅首次初始化 |
| 可回退 | 是 | 否 |
| 跟踪方式 | `migrations` 表 | 无跟踪 |
| 适用环境 | 所有环境 | 开发/测试 |

---

## 10. 历史迁移机制

### 旧方案：db-migrate-compat.js

在建立 TypeORM migrations 之前，项目使用 `scripts/db-migrate-compat.js` 管理 Schema 变更：

- 使用自建 `schema_migration` 表跟踪版本
- 包含 9 个已执行的迁移补丁（2026-04-02 ~ 2026-04-08）
- 具备实体文件扫描自动建表能力

**已有迁移清单**（历史记录，无需重新执行）：

| # | 迁移名 | 说明 |
|---|--------|------|
| 1 | `20260402_rename_school_class_to_class` | 重命名 school_class → class |
| 2 | `20260402_fix_grade_columns` | 修复 grade 表列定义 |
| 3 | `20260402_fix_training_record_columns` | 修复 training_record 列 |
| 4 | `20260402_create_task_checkin_table` | 创建 task_checkin 表 |
| 5 | `20260402_fix_class_core_columns` | 修复 class 核心列 |
| 6 | `20260403_fix_class_dual_ownership_columns` | 添加 class 多教师关联 |
| 7 | `20260403_backfill_teacher_school_id_from_class` | 回填 teacher.school_id |
| 8 | `20260407_fix_exam_project_defaults` | 修复 exam_project 默认值 |
| 9 | `20260408_normalize_exam_project_score_type` | 标准化 score_type 枚举 |

### 过渡策略

- 旧脚本保留在 `scripts/db-migrate-compat.js`，`npm run db:migrate:compat` 命令保留
- 新变更统一使用 TypeORM migrations
- `schema_migration` 表（旧）与 `migrations` 表（新）并存，互不冲突
- 基线迁移 `1713100000000-Baseline` 使用 `CREATE TABLE IF NOT EXISTS`，确保对已有数据库安全

---

## 11. 故障排查

### Q: 迁移执行报错 "Table already exists"

基线迁移使用 `IF NOT EXISTS`，不会报此错。若后续迁移报错：
1. 检查是否有人手动建了表
2. 使用 `npm run migration:show` 查看状态
3. 如需跳过，手动在 `migrations` 表插入记录

### Q: 生成的迁移文件为空

说明实体与当前数据库完全一致，无需迁移。

### Q: 生成了不期望的 DROP 操作

TypeORM 的 migration:generate 有时会生成过于激进的变更：
1. **永远在执行前检查生成的 SQL**
2. 可手动编辑迁移文件中的 SQL
3. 对于复杂变更建议手动编写迁移

### Q: 多人开发迁移冲突

1. 时间戳保证文件名不重复
2. 但两人可能同时修改同一张表 → 先 merge 的人正常执行，后 merge 的人需要 rebase 后重新生成
3. **规则**：同一张表的变更尽量由同一人完成

### Q: 生产环境需要回退迁移

```bash
# 1. 先确认回退的影响
npm run migration:show

# 2. 执行回退
npm run migration:revert

# 3. 验证数据完整性
```

> 生产回退需极其谨慎，建议先在 staging 环境验证。
