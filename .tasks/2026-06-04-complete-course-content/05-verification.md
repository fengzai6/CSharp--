---
task: complete-course-content
subtask: "05"
status: completed
depends-on: ["02", "03", "04"]
created: 2026-06-04
updated: 2026-06-04
---

# 05 - 构建与覆盖复核

## 目标

验证课程网站可以构建，并复核 `docs/00-06` 的章节要点已进入课程页面。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [course/index.ts](../../learn-csharp/src/data/course/index.ts)
- [lesson-ui](../../learn-csharp/src/components/lesson-ui/index.tsx)

## 任务详情

- 运行项目构建命令。
- 按文档 H2/H3/H4 清单核对课程内容覆盖。
- 如发现遗漏，补齐后重新验证。
- 更新任务文档状态与结果。

## 结果

已完成：

- `node .tasks/2026-06-04-complete-course-content/check-heading-coverage.mjs`：`docs/00-06` H2/H3/H4 缺失数均为 0。
- `node .tasks/2026-06-04-complete-course-content/check-block-coverage.mjs`：docs 代码块 152 个，课程内容代码块 152 个，练习清单 7 个。
- `npm run lint`：通过。
- `npm run build`：通过。

## 决策与备注

暂无。
