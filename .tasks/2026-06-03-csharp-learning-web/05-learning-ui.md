---
task: csharp-learning-web
subtask: "05"
status: completed
depends-on: ["03", "04"]
created: 2026-06-03
updated: 2026-06-03
---

# 05 - 实现学习网页交互

## 目标

实现可持续学习使用的网页：完整阅读 `docs` 原文，支持代码复制、练习打卡、老师式引导和本地进度。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [learn-csharp/src/pages/home/index.tsx](../../learn-csharp/src/pages/home/index.tsx) — 当前页面实现
- [learn-csharp/src/components/code-copy/index.tsx](../../learn-csharp/src/components/code-copy/index.tsx) — 当前代码复制组件

## 任务详情

页面布局建议：

- 左侧：阶段目录、每阶段完成度、继续学习入口
- 中间：完整 Markdown 正文阅读区
- 右侧：当前章节小目录、老师提示、常见误区、阶段验收

交互要求：

- 点击章节更新当前学习位置。
- 代码块显示语言、标题、一键复制按钮。
- Markdown 中的练习清单可勾选，并持久化。
- 教学增强中的建议练习也可勾选，并持久化。
- 当前阅读章节可标记完成。
- 重置进度需要二次确认，避免误触。
- 点击右侧目录 anchor 能滚动到对应标题。
- 提供“继续学习”按钮，跳转到上次学习位置。
- 文档表格需要在小屏下横向滚动，不撑破页面。

UI 要求：

- 工作台式学习界面，不做 landing page。
- 保持文本可读，代码块横向滚动，不撑破布局。
- 移动端不出现横向滚动；侧栏在移动端改为上下布局。
- icon 使用已有 Ant Design icons。
- 正文排版应适合长期阅读：合理行高、段落间距、代码块对比度、表格边界清晰。

建议组件拆分：

- `pages/home/index.tsx`
  - 只负责组合 store、课程数据和布局组件，目标控制在 120 行以内。
- `components/course-layout`
  - 页面三栏布局和响应式容器。
- `components/course-sidebar`
  - 阶段目录、进度、继续学习。
- `components/course-content`
  - 当前模块正文渲染、章节完成按钮。
- `components/markdown-renderer`
  - Markdown block 渲染，内部复用代码复制组件。
- `components/code-copy`
  - 代码块复制按钮和复制反馈。
- `components/course-assistant`
  - 老师提示、常见误区、验收问题、建议练习。
- `stores/use-learning-progress-store.ts`
  - Zustand persist 状态，不混入 UI 渲染逻辑。
- `utils/markdown`
  - 轻量 Markdown 解析函数和类型。

文件大小约束：

- 单个业务组件文件超过 250 行时应优先拆分。
- 单个文件超过 500 行必须先拆分或说明原因。

## 结果

已实现学习网页交互：

- 使用结构化课程教材数据，内容由 `docs` 搬运后在前端维护。
- 正文支持段落、列表、表格、代码、引用、老师小任务、checklist 和下一步交互。
- 代码块可复制。
- checklist 与章节完成状态接入 Zustand persist。
- 页面拆分为布局、侧栏、正文、block renderer、教学助手等组件。
- 每章结尾提供下一步入口。

## 决策与备注

课程内容不再用 `?raw` 引用 docs，改为结构化教材数据，便于在正文中间插入教学任务。
