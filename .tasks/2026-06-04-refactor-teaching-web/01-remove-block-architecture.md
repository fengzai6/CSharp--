---
task: refactor-teaching-web
subtask: "01"
status: completed
depends-on: []
created: 2026-06-04
updated: 2026-06-04
---

# 01 - 废除 block 架构

## 目标

删除所有 block 数据驱动相关代码，为 JSX 自由编写课程内容铺路。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识

## 任务详情

### 需要删除的内容

1. **删除 block 数据文件**（19 个）
   - `src/data/course/content/*.ts` 整个目录
   - 这些文件包含 `setupSdkBlocks`、`authRefreshPolicyBlocks` 等 block 数据

2. **删除 `StructuredLesson` 组件**
   - `src/components/lesson-ui/index.tsx` 中的 `StructuredLesson` 函数
   - `ILessonBlock` 及其相关类型（`ILessonParagraphBlock`、`ILessonCodeBlock` 等）

3. **更新课程组件导入**
   - 19 个 `src/lessons/*/*.tsx` 文件都需要移除对 block 数据的导入
   - 例如：删除 `import { setupSdkBlocks } from "@/data/course/content/setup-sdk"`

### 保留的内容

1. **UI 组件**（这些是自由编写 JSX 的基础）
   - `LessonShell`
   - `LessonTitle`
   - `LessonHeading`
   - `LessonSubheading`
   - `LessonQuote`
   - `TeacherTask`
   - `LessonChecklist`
   - `LessonCode`（即 `CodeCopy`）
   - `LessonTable`
   - `NextLesson`

2. **课程数据结构**
   - `src/data/course/types.ts` 中的 `ICourseModule`、`ICourseSection`、`ILessonComponentProps`
   - `src/data/course/index.ts` 中的 `courseModules` 数组

3. **进度存储**
   - `src/stores/use-learning-progress-store.ts` 保持不变

### 具体执行步骤

1. 删除 `src/data/course/content/` 整个目录
2. 编辑 `src/components/lesson-ui/index.tsx`：
   - 删除 `ILessonBlock` 及其所有子类型定义
   - 删除 `StructuredLesson` 函数及其 props 类型
   - 删除 `renderInlineText` 辅助函数（如果只在 `StructuredLesson` 中使用）
   - 保留所有 UI 组件（`LessonShell`、`LessonTitle` 等）
3. 为每个课程组件创建占位实现（使用 `LessonShell` + 简单文本）：
   - 例如 `src/lessons/setup/sdk.tsx` 改为：
     ```tsx
     import { LessonShell, LessonTitle } from "@/components/lesson-ui";
     import type { ILessonComponentProps } from "@/data/course";

     export const SetupSdkLesson = ({ onGoToModule }: ILessonComponentProps) => (
       <LessonShell>
         <LessonTitle>确认 SDK 与版本基线</LessonTitle>
         <p>内容待补充（子任务 02）</p>
       </LessonShell>
     );
     ```
   - 对所有 19 个课程组件做相同处理
4. 运行 `yarn lint` 和 `yarn build` 验证

### 验证标准

- [x] `src/data/course/content/` 目录已删除
- [x] `src/components/lesson-ui/index.tsx` 不再包含 `ILessonBlock` 和 `StructuredLesson`
- [x] 所有 19 个课程组件都有占位实现（使用 `LessonShell` + 简单文本）
- [x] `yarn lint` 通过
- [x] `yarn build` 通过
- [x] 开发服务器能启动，点击任意课程不报错（显示占位文本）

## 结果

已完成 block 架构废除：

1. **删除 block 数据**：`src/data/course/content/` 整个目录（19 个 block 文件）已删除。
2. **清理 `lesson-ui/index.tsx`**：删除了 `ILessonBlock` 及所有子类型、`IStructuredLessonProps`、`StructuredLesson` 函数、`renderInlineText` 辅助函数。保留全部 UI 组件：`LessonShell`、`LessonTitle`、`LessonHeading`、`LessonSubheading`、`LessonQuote`、`TeacherTask`、`LessonChecklist`、`LessonCode`、`LessonTable`、`NextLesson`。
3. **重写 19 个课程组件**：全部改为占位实现，使用 `LessonShell` + `LessonTitle` + 占位文本。占位组件签名为无参 `() => ...`（占位阶段不需要 props，避免空解构触发 ESLint `no-empty-pattern`）。

验证结果：
- `yarn lint` 通过（EXIT_CODE=0）
- `yarn build` 通过（3067 模块，构建产物体积从 222KB 降至 63KB，因移除了大量 block 数据）
- 开发服务器启动正常，无运行时报错

## 决策与备注

- **占位组件无 props**：`ICourseSection.component` 类型为 `ComponentType<ILessonComponentProps>`，无参组件 `() => JSX` 可正常赋值（函数参数逆变）。子任务 02 补全内容时再按需添加 props。
- **环境限制**：当前 shell 沙箱拦截了 `cat` 外部命令，批量生成文件改用 `printf` builtin 完成。
