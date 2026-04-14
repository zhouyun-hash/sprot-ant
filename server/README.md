# server/ — Spring Boot (已归档)

> **状态：已废弃 (DEPRECATED)**
> **归档日期：2026-04-14**
> **替代方案：`../backend/` (NestJS)**

## 归档原因

根据开发计划关键决策"统一后端 — 聚焦 NestJS，废弃 Spring Boot"：

- NestJS 后端已完成85%（43个模块、45个实体、46个控制器），功能远超本项目
- 本 Spring Boot 项目仅30%完成（仅体测模块有实质逻辑，其余95%为骨架代码）
- 维护两套后端成本极高且功能完全重叠
- NestJS 更适合 TypeScript 全栈团队协作

## 已迁移到 NestJS 的内容

| 功能 | Spring Boot 位置 | NestJS 位置 | 状态 |
|------|-----------------|-------------|------|
| Score upsert (幂等插入/更新) | `pe/service/impl/PeScoreServiceImpl.java` | `backend/src/score/score.service.ts` | 已迁移 |
| Task 状态机 (cancel/finish) | `pe/service/impl/PeTaskServiceImpl.java` | `backend/src/task/task.service.ts` | 已迁移 |
| aiRawData 字段 | `entity/PeScore.java` | `backend/src/score/entities/score.entity.ts` | 已迁移 |

## 注意事项

- 本目录仅作历史参考，**不再投入开发**
- 如需查看体测模块的 Java 实现逻辑，可参考 `module/pe/` 目录
- 数据库连接配置指向同一个 `smart_sports` 库，请勿同时启动两个后端以免冲突
