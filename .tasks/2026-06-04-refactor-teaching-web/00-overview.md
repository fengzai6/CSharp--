---
task: refactor-teaching-web
status: in-progress
created: 2026-06-04
updated: 2026-06-08
---

# 学习网站架构重构与内容补全

## 目标

从老师和学生的立场重构学习网站，废除 block 数据驱动架构，改为 JSX 自由编写，并补全 docs 中的完整教学内容。

## 背景与约束

- 项目目录：`learn-csharp`
- 技术栈：React 19、Vite、TypeScript、Tailwind CSS、Ant Design、Zustand
- 文档来源：`docs/*.md`（共 4666 行内容）
- 当前问题：
  - 架构与既定决策冲突：00-overview.md 明确"课程正文不使用 block 数据驱动"，但代码仍使用 `StructuredLesson` + `ILessonBlock[]`
  - 内容不完整：docs 有完整教学内容，但网页只抽取了部分 block，丢失大量上下文
  - 教学体验僵硬：block 渲染缺乏灵活性，无法自由插入教学元素
  - 可扩展性差：每次新增教学元素都要扩展 block 类型和渲染逻辑
- 技术约束：
  - 不新增依赖
  - 保留现有 UI 组件（`LessonShell`、`LessonHeading`、`LessonCode`、`LessonChecklist` 等）
  - 保留 Zustand persist 进度存储
  - 保留课程数据结构（`courseModules`、`ICourseModule`、`ICourseSection`）
- 测试约束：
  - 使用 `yarn lint` 和 `yarn build` 做基础验证

## 子任务总览

| # | 状态 | 子任务 | 依赖 | 说明 |
|---|------|--------|------|------|
| 01 | completed | 废除 block 架构 | - | 删除 `StructuredLesson`、`ILessonBlock`、所有 block 数据文件，改为 JSX 自由编写 |
| 02 | completed | 补全文档内容 | 01 | 从 docs/*.md 搬运完整教学内容到 19 个课程组件，包括背景、思维差异、代码注释 |
| 03 | completed | 增强教学交互 | 02 | 添加对比表格、交互式代码示例、分步骤练习引导 |
| 04 | completed | 学生体验优化 | 02 | 添加学习路径指引、章节内快速跳转、进度统计可视化 |
| 05 | pending | 验证与审查 | 03,04 | 全流程测试，确保每章有清晰目标、验收标准、下一步引导 |

## 执行顺序

1. 先废除 block 架构，为 JSX 自由编写铺路
2. 再补全文档内容，恢复完整教学上下文
3. 然后增强教学交互和学生体验
4. 最后验证审查

## 共识与决策

- **2026-06-04 架构方向**：废除 block 数据驱动架构，改为每节课直接用 `LessonShell` + UI 组件自由组合 JSX。这与 2026-06-04 既定决策一致，但之前未完整执行。
- **2026-06-04 内容完整性**：课程内容应从 docs/*.md 完整搬运，不做过度摘要或省略教学上下文（背景、思维差异、常见误区、实战建议）。
- **2026-06-04 组件复用**：保留 `LessonShell`、`LessonCode`、`LessonChecklist`、`TeacherTask`、`LessonQuote`、`LessonTable`、`NextLesson` 等 UI 组件，删除 `StructuredLesson`、`ILessonBlock` 以及 `LessonTitle`/`LessonHeading`/`LessonSubheading`（标题改由 `.lesson-content` 全局样式 + header 渲染）。
- **2026-06-04 教学优先**：任何技术决策都应从"是否有利于学生理解"和"是否方便老师表达"的角度出发，架构灵活性让位于教学体验。
- **2026-06-04 节级连贯导航**：下一步导航由 `CourseContent` 数据驱动统一渲染（`utils/course.ts` 的 `getNextSection`），同章跳下一节、跨章进入下一章首节、最后一节显示"全部学完"。课程组件不再写 NextLesson；`ILessonComponentProps` 只保留 `completedChecklistIds` 和 `onToggleChecklistItem`。
- **2026-06-04 正文排版**：课程正文用语义化裸 HTML（h3/h4/p/ul/code 等），由 `index.css` 的 `.lesson-content` 全局样式统一渲染；行内代码用 `:not(pre) > code` 排除代码块。
- **2026-06-04 代码块转义**：`LessonCode` 的 `code` 是 JS 模板字符串，C# 正则反斜杠写 `\\`，TS 代码里反引号写 `` \` ``、`${}` 写 `\${}`。
- **2026-06-05 学生体验方向**：子任务 04 允许较大幅度调整 UI，将学习路径、进度、当前章助手和下一步引导统一优化；仍不新增依赖，不改变进度存储结构。
- **2026-06-08 色系修订**：大面积背景和面板使用更沉稳的蓝灰/浅 slate，teal 只用于主按钮、进度条、当前状态和少量强调，避免主题过亮。

## 变更日志

- 2026-06-04：创建任务计划，明确架构重构方向
- 2026-06-04：完成 01 废除 block 架构、节级导航基础设施改造、02 补全 19 节课内容（lint/build 通过）
- 2026-06-05：完成 04 学生体验优化，新增学习驾驶舱、正文学习状态条、当前章助手和更有活力的蓝绿色系（lint/build 通过）
- 2026-06-08：修正总览中 03 状态为 completed；将 04 色系收敛为蓝灰底 + teal 强调（lint/build 通过）
