---
task: csharp-learning-web
subtask: "01"
status: completed
depends-on: []
created: 2026-06-03
updated: 2026-06-03
---

# 01 - 清理当前临时实现

## 目标

清理当前不符合要求的实现，避免后续在错误结构上继续扩展。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [learn-csharp/src/data/course.ts](../../learn-csharp/src/data/course.ts) — 当前课程数据
- [learn-csharp/src/stores/use-learning-progress-store.ts](../../learn-csharp/src/stores/use-learning-progress-store.ts) — 当前进度存储
- [learn-csharp/src/pages/home/index.tsx](../../learn-csharp/src/pages/home/index.tsx) — 当前页面实现

## 任务详情

1. 检查当前实现中可保留的部分：
   - 三栏学习布局
   - 代码复制组件
   - 章节/步骤导航交互
2. 清理或替换不合格部分：
   - 删除手写 localStorage 读写逻辑
   - 避免把完整课程内容写成过度摘要式硬编码
   - 修正与项目风格不一致的文件/类型命名
   - 清理 `learn-csharp/src/data/course.ts` 中不适合作为课程来源的大段手写摘要数据
3. 保留已完成且符合方向的内容：
   - 文档中已修正的现代化口径可以保留
   - 可复制代码块组件如实现简单可保留，但应配合 Markdown code block 渲染重用
   - 页面布局思路可保留，但需要拆分组件
4. 保持工作区可构建，不引入中间不可恢复状态。

## 结果

已确认当前临时实现中需要替换的部分：

- `course.ts` 存在大段摘要式硬编码，后续将改为 `docs` raw Markdown + 教学增强元数据。
- `use-learning-progress-store.ts` 当前手写 localStorage，后续将替换为 Zustand `persist`。
- `pages/home/index.tsx` 目前文件较大，后续拆成布局、侧栏、正文、教学助手等组件。
- `code-copy` 组件可复用，但应改为 Markdown code block 渲染的一部分。

## 决策与备注

保留三栏学习布局思路和代码复制交互，替换课程来源与持久化实现。
