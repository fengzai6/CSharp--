---
task: csharp-learning-web
subtask: "06"
status: completed
depends-on: ["05"]
created: 2026-06-03
updated: 2026-06-03
---

# 06 - 验证与审查

## 目标

确认实现满足学习网页目标，并且基础构建检查通过。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [05-learning-ui.md](05-learning-ui.md) — UI 与交互要求

## 任务详情

验证命令：

```bash
cd learn-csharp
yarn lint
yarn build
```

人工检查：

- 首屏能看到课程目录、当前章节、进度。
- 切换阶段和章节正常。
- 代码复制按钮可用。
- 勾选练习后刷新页面仍保留状态。
- 标记章节完成后总进度更新。
- 重置进度二次确认后生效。
- 正文内容来自 `docs` 原文，而不是摘要式重写。
- 每个阶段都有老师提示、常见误区、验收问题或建议练习。
- 右侧目录 anchor 能跳转到正文标题。
- 移动端宽度下无横向滚动和明显重叠。
- 主要业务文件没有超过 500 行。

文档一致性检查：

- `docs` 中的 fenced code block 在网页中保留语言和内容。
- `docs` 中的 checklist 在网页中可勾选。
- 表格、引用、列表在网页中有可读样式。

## 结果

验证结果：

- `yarn lint` 通过。
- `yarn build` 通过。
- 已确认不再存在 `?raw`、`rawMarkdown`、`CourseBlockRenderer`、`section.blocks` 等数据驱动正文残留。
- 课程正文已改为每节课独立 React 组件，位于 `learn-csharp/src/lessons/`。
- 公共教学组件位于 `learn-csharp/src/components/lesson-ui/`，包括代码、表格、老师任务、练习清单、下一步入口。
- 每个阶段结尾包含 `NextLesson` 交互。

## 决策与备注

验证命令执行日期：2026-06-04。
