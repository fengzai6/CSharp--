---
task: csharp-learning-web
subtask: "04"
status: completed
depends-on: ["03"]
created: 2026-06-03
updated: 2026-06-03
---

# 04 - 实现 Zustand persist 进度存储

## 目标

用 Zustand `persist` 中间件保存学习进度，并保持状态结构可迁移、可重置。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [learn-csharp/src/stores/use-learning-progress-store.ts](../../learn-csharp/src/stores/use-learning-progress-store.ts) — 当前进度存储

## 任务详情

状态建议：

- `completedSectionIds: string[]`：已完成的 Markdown section
- `completedChecklistIds: string[]`：已完成的文档 checklist 或教学练习项
- `lastModuleId: string`：上次学习阶段
- `lastSectionId: string`：上次学习章节
- `expandedModuleIds: string[]`：左侧目录展开状态，可选
- `updatedAt: string`

行为建议：

- `setActiveSection(moduleId, sectionId)`
- `toggleSection(sectionId)`
- `toggleChecklistItem(checklistItemId)`
- `resetProgress()`

实现要求：

- 使用 `zustand/middleware` 的 `persist`。
- 设置稳定 storage key，例如 `learn-csharp-progress-v1`。
- 使用 `partialize` 只持久化需要保存的字段。
- 如状态结构后续可能变化，保留 `version`。
- 不持久化复制按钮这类短暂 UI 状态。
- 不手写 `localStorage.getItem` / `localStorage.setItem` 作为主持久化逻辑。
- 需要提供 `resetProgress()`，且 UI 上重置必须二次确认。

验收标准：

- 刷新页面后当前章节、已完成章节、已勾选练习仍保留。
- 清空进度后状态恢复到第一阶段第一节。
- `yarn lint` 不出现 Zustand selector 相关性能问题；多个状态选择时使用 `useShallow`。

## 结果

已将进度存储改为 Zustand `persist`：

- storage key：`learn-csharp-progress-v1`
- 使用 `partialize` 只持久化学习进度字段
- 保存已完成 section、已完成 checklist、上次学习位置、目录展开状态和更新时间
- 复制按钮等短暂 UI 状态不持久化

## 决策与备注

不再手写 localStorage 作为主持久化逻辑。
