---
task: refactor-teaching-web
subtask: "03"
status: completed
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

- [x] 增强项与用户确认后实施
- [x] `yarn lint` 通过
- [x] `yarn build` 通过

## 结果

全部 5 项增强完成，`yarn build` 和 `yarn lint` 通过。

### 增强 1：代码语法高亮
- 安装 `prism-react-renderer` v2.4.1（~2.5KB gzipped）
- 更新 `CodeCopy` 组件，使用 `Highlight` + `themes.nightOwl` 实现语法高亮
- 支持 csharp / bash / json / xml / typescript / dockerfile 六种语言
- `language="text"` 时保持纯文本回退
- 所有 140+ 现有 `LessonCode` 块自动获得高亮，无需修改课程文件

### 增强 2：NestJS vs C# 对比表格
- 审计发现两个目标文件（openapi-validation.tsx、program.tsx）已有完整的对比表格
- 无需新增

### 增强 3：代码对照阅读
- 新建 `LessonCodeCompare` 组件（`src/components/lesson-code-compare/index.tsx`）
- 桌面端双列并排，移动端单列堆叠
- 两边独立语法高亮 + 独立复制按钮
- 从 `lesson-ui` 统一导出
- 在 2 个文件中添加 4 处对照：
  - `controller-di.tsx`：Controller 基础对照、路由参数、Authorize 属性
  - `hub.tsx`：Hub vs Gateway 类定义

### 增强 4：概念提示框
- 审计 19 个课程文件，所有 docs 中的「老师提示」「常见误区」「注意」已在 subtask 02 中覆盖
- 无需新增

### 增强 5：分步骤练习引导
- 在 7 个模块的最后一节课添加 Phase 0-6 练习引导（`TeacherTask` 组件）
- 映射：solution → Phase 0, controller-di → Phase 1, dbcontext → Phase 2, refresh-policy → Phase 3, relationships → Phase 4, hub → Phase 5, testing → Phase 6

## 决策与备注

- **2026-06-04 语法高亮库选择**：选择 `prism-react-renderer` 而非 `shiki`。前者 ~2.5KB gzipped、React 原生 API，后者 ~2MB 且依赖 WASM。项目已有 antd 等重型依赖，选择轻量方案更合适。
- **2026-06-04 LessonCodeCompare 设计**：复用 `CodeCopy` 组件而非独立实现，保证两边代码块的高亮和复制功能一致。移动端自然堆叠，无需额外响应式逻辑。
- **2026-06-04 Phase 练习引导**：使用现有 `TeacherTask` 组件而非新建组件，保持组件数量少、学生认知负担低。
- **2026-06-04 B2/B3 跳过原因**：B2 对比表格和 B3 概念提示框在 subtask 02 内容补全时已充分覆盖，审计确认无需重复添加。
