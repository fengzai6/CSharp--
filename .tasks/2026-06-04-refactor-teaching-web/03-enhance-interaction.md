---
task: refactor-teaching-web
subtask: "03"
status: pending
depends-on: ["02"]
created: 2026-06-04
updated: 2026-06-04
---

# 03 - 增强教学交互

## 目标

在补全内容的基础上，添加有利于教学和理解的交互元素。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [02-restore-content.md](02-restore-content.md) — 内容补全结果

## 任务详情

### 候选增强项（按价值排序，实施前与用户确认范围）

1. **NestJS vs C# 对比表格**
   - docs 中大量涉及与 NestJS 的思维差异
   - 用 `LessonTable` 在关键节点呈现对比（如 TypeORM vs EF Core、Socket.IO vs SignalR）

2. **代码示例的"对照阅读"**
   - 关键概念配 NestJS 代码和 C# 代码并排对比
   - 帮助有 NestJS 基础的学习者快速迁移

3. **分步骤练习引导**
   - 把"实战项目建议"的 Phase 0-6 落实到对应章节
   - 每章末尾的练习指向同一个复刻项目

4. **概念提示框**
   - 用 `TeacherTask` 和 `LessonQuote` 标注重点、易错点

### 约束

- 不新增依赖
- 复用现有 UI 组件，必要时新增轻量组件（需确认）
- 交互元素服务于教学，不为炫技

### 验证标准

- [ ] 增强项与用户确认后实施
- [ ] `yarn lint` 通过
- [ ] `yarn build` 通过

## 结果

待填写

## 决策与备注

待填写
