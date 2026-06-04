---
task: csharp-learning-web
subtask: "03"
status: completed
depends-on: ["02"]
created: 2026-06-03
updated: 2026-06-03
---

# 03 - 建立课程内容模型

## 目标

建立从 `docs` 文档到网页学习内容的稳定映射，让网页正文以 `docs` 原文为主，同时支持代码复制、练习打卡和教学增强。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [docs/README.md](../../docs/README.md) — 学习路径总览
- [docs/00-环境准备与项目骨架.md](../../docs/00-环境准备与项目骨架.md) — 阶段 00
- [docs/01-CSharp语言核心.md](../../docs/01-CSharp语言核心.md) — 阶段 01
- [docs/02-ASPNET-Core框架.md](../../docs/02-ASPNET-Core框架.md) — 阶段 02
- [docs/03-EF-Core数据库.md](../../docs/03-EF-Core数据库.md) — 阶段 03
- [docs/04-认证授权.md](../../docs/04-认证授权.md) — 阶段 04
- [docs/05-SignalR实时通信.md](../../docs/05-SignalR实时通信.md) — 阶段 05
- [docs/06-工程化与进阶.md](../../docs/06-工程化与进阶.md) — 阶段 06

## 任务详情

内容来源原则：

- `docs/*.md` 是教材内容的来源，不是运行时数据源。
- 网页课程应把 docs 内容搬运到前端课程数据中，形成可自由编辑和插入教学任务的教材。
- 网页正文不能只展示摘要，也不能仅通过 `?raw` 引用 docs 原文。
- 教学增强内容可以直接插入正文中间，而不是只能放在侧栏。
- 如果文档内容需要优化，优先修改 `docs` 原文，再同步到网页。

建议内容模型：

- `CourseModule`
  - `id`
  - `order`
  - `title`
  - `duration`
  - `sourcePath`
  - `goal`
  - `rawMarkdown`
  - `teacherGuide`
  - `sections`
- `CourseSection`
  - `id`
  - `title`
  - `objective`
  - `blocks`
- `ContentBlock`
  - `type`: `heading | paragraph | list | table | code | quote | checklist | teacherTask | checkpoint | nextStep`
  - `content`
  - `language?`
  - `title?`
  - `items?`
- `TeacherGuide`
  - `learningGoals: string[]`
  - `teacherNotes: string[]`
  - `commonPitfalls: string[]`
  - `acceptanceQuestions: string[]`
  - `recommendedPractice: string[]`

实现方案二选一：

1. **前端结构化教材数据（推荐）**
   - 把 `docs` 内容搬运到 `src/data/course.ts` 或拆分到 `src/data/course/*.ts`。
   - 用结构化 block 表达正文、代码、表格、练习、小任务、检查点和下一步。
   - 优点：可以在内容中间自由插入任务、验收、提示和导航；网页不依赖 docs raw。
   - 缺点：docs 更新后需要人工同步教材数据。
2. **构建期静态转换**
   - 写脚本把 `docs/*.md` 转成 `src/data/generated/course-content.ts`。
   - 优点：运行时更简单。
   - 缺点：多一层生成流程，文档修改后需要重新生成。
3. **引入 Markdown 渲染依赖**
   - 使用成熟 Markdown 渲染库。
   - 优点：Markdown 兼容性最好。
   - 缺点：新增依赖需要用户确认；代码块/checklist 的交互定制仍需额外处理。

用户最新确认后的最终方案：

- 不采用 block 数据驱动渲染正文。
- 每节课一个完整 React 组件，组件内直接写完整教材内容。
- 公共交互抽成组件，例如 `TeacherTask`、`LessonChecklist`、`NextLesson`、`CodeCopy`、`LessonTable`。
- 只用轻量元信息描述模块、课程标题、时长、组件映射和进度 id。

轻量解析器最低支持范围：

- `#`、`##`、`###` 标题，并生成右侧目录 anchor。
- 普通段落。
- `>` 引用块。
- `-` / `1.` 列表。
- Markdown 表格。
- fenced code block，保留语言并提供复制按钮。
- `- [ ]` / `- [x]` checklist，映射为可持久化练习项。

教学增强维护方式：

- 单独创建 `course-guides.ts` 或在 `course.ts` 中维护小型 `teacherGuide` 元数据。
- 每个阶段至少包含：
  - 学习目标
  - 老师提示
  - 常见误区
  - 阶段验收问题
  - 建议练习

## 结果

已建立课程内容模型：

- `course.ts` 使用 Vite `?raw` 导入 `docs/*.md` 原文。
- `course.ts` 保留每章小型 `teacherGuide` 元数据，用于老师提示、常见误区、验收问题和建议练习。
- `utils/markdown` 提供轻量 Markdown 解析器，支持标题、段落、引用、列表、表格、代码块、checklist。

## 决策与备注

采用 Vite raw 导入 + 本地轻量解析，不新增 Markdown 依赖。
