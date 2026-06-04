---
task: complete-course-content
subtask: "01"
status: completed
depends-on: []
created: 2026-06-04
updated: 2026-06-04
---

# 01 - 课程内容结构增强

## 目标

增强课程页面的内容组件，使长文、代码块、表格、清单、任务与验收问题可以稳定承载，减少后续搬运重复代码。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [lesson-ui](../../learn-csharp/src/components/lesson-ui/index.tsx) — 现有课程内容组件
- [course/index.ts](../../learn-csharp/src/data/course/index.ts) — 课程模块与章节结构

## 任务详情

- 保留现有 `LessonShell`、`LessonTitle`、`LessonHeading`、`LessonSubheading`、`LessonQuote`、`TeacherTask`、`LessonChecklist`、`LessonCode`、`LessonTable`、`NextLesson` 对外能力。
- 增加适合长课程内容的复用组件或数据驱动渲染能力。
- 不修改运行时为 Markdown 渲染。
- 遵循现有 TypeScript/React 代码风格。

## 结果

已完成：

- 在 `learn-csharp/src/components/lesson-ui/index.tsx` 中新增结构化课程内容渲染能力。
- 保留原有课程 UI 组件能力，新增 `StructuredLesson` 与 `ILessonBlock`。
- 支持段落、引用、标题、列表、代码块、表格、练习清单和下一步跳转。
- 未引入运行时 Markdown 读取或解析。

## 决策与备注

- 长内容优先通过结构化课程数据渲染，避免每个 lesson 手写大量重复 JSX。
