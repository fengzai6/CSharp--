---
task: refactor-teaching-web
subtask: "02"
status: completed
depends-on: ["01"]
created: 2026-06-04
updated: 2026-06-04
---

# 02 - 补全文档内容

## 目标

从 docs/*.md 完整搬运教学内容到 19 个课程组件，恢复被 block 架构丢失的教学上下文。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [01-remove-block-architecture.md](01-remove-block-architecture.md) — 前置架构重构
- `docs/00-环境准备与项目骨架.md`（266 行）
- `docs/01-CSharp语言核心.md`（709 行）
- `docs/02-ASPNET-Core框架.md`（972 行）
- `docs/03-EF-Core数据库.md`（772 行）
- `docs/04-认证授权.md`（452 行）
- `docs/05-SignalR实时通信.md`（511 行）
- `docs/06-工程化与进阶.md`（923 行）

## 任务详情

### 课程组件与文档章节映射

| 模块 | 课程组件 | 对应文档章节 |
|------|----------|--------------|
| setup | sdk / solution / first-api | docs/00 |
| csharp-core | types / linq-record / async | docs/01 |
| aspnet-core | program / controller-di / openapi-validation | docs/02 |
| ef-core | dbcontext / relationships / transactions | docs/03 |
| auth | password-jwt / refresh-policy | docs/04 |
| signalr | hub / auth-reconnect | docs/05 |
| engineering | testing / observability / deploy | docs/06 |

### 内容搬运原则

1. **完整性**：搬运文档的完整内容，包括：
   - 章节背景（"为什么先学这一章"）
   - 与 NestJS 的思维差异对比
   - 完整代码示例（带注释）
   - 常见误区
   - 老师提示
2. **合理分节**：每个文档章节按课程组件数量拆分到对应 section
3. **使用 JSX 组件**：用 `LessonHeading`、`LessonCode`、`LessonTable`、`LessonQuote` 等组件组织内容
4. **保留交互**：每节课结尾保留 `LessonChecklist`（练习打卡）和 `NextLesson`（下一步引导）
5. **不脱离原文**：不自行编造内容，以 docs 原文为准；如发现 docs 有错误，先记录到「决策与备注」再询问

### 执行策略

- 按模块逐个处理（setup → csharp-core → aspnet-core → ef-core → auth → signalr → engineering）
- 每完成一个模块，运行一次 `yarn build` 验证
- 单个课程组件如超过 500 行，考虑拆分子组件

### 验证标准

- [x] 19 个课程组件都有完整内容（非占位文本）
- [x] 内容覆盖对应 docs 章节的核心知识点
- [x] 每节课保留练习打卡（下一步导航改为由 CourseContent 统一渲染，见决策）
- [x] `yarn lint` 通过
- [x] `yarn build` 通过
- [ ] 手动检查每章内容显示正常（需用户在浏览器确认视觉效果）

## 结果

19 个课程组件全部补全完成，共约 5054 行 JSX，忠实搬运 docs/*.md 的核心内容。

- setup（3 节）、csharp-core（3 节）：手动编写，建立写法模板。
- aspnet-core、ef-core、auth、signalr、engineering（13 节）：用 5 个并行 agent 搬运初稿，再统一审查修正。

每节课结构：裸 HTML 语义化排版（h3/h4/p/ul/code 等，由 `.lesson-content` 全局样式渲染）+ 教学卡片组件（TeacherTask 老师提示、LessonQuote 引用、LessonTable 对照表、LessonCode 代码块、LessonChecklist 练习打卡）。

审查发现并修复的问题：
- `aspnet-core/openapi-validation.tsx`：C# 正则 `@"\d"` 在 JS 模板字符串里漏转义（`\d` 会丢反斜杠渲染成 `d`），改为 `\\d`。
- 全局核查：无 LessonTitle/NextLesson 残留、无 CodeCopy 误用、19 个组件导出名匹配、TS 代码块的反引号与 `${}` 转义正确、C# 正则/引号转义正确。

验证结果：`yarn lint` 通过（EXIT 0），`yarn build` 通过，dev server 启动无运行时错误。

## 决策与备注

- **2026-06-04 节级连贯导航**：原计划课程组件各自处理"下一步"，但课程组件只能跳模块（onGoToModule），无法跳到模块内下一节。经与用户确认，改为**数据驱动的统一导航**：在 `utils/course.ts` 增加 `getNextSection`，由 `CourseContent` 根据课程顺序自动渲染"下一步"（同章跳下一节，跨章进入下一章第一节，最后一节显示"全部学完/回到开头"）。课程组件不再写 NextLesson。相应改动：`ILessonComponentProps` 移除 onGoToModule、`NextLesson` 改为通用 onClick、`CourseContent` header 改为显示"章名 + 节标题 + 目标"层次。
- **2026-06-04 课程正文排版**：建立 `.lesson-content` 全局排版层（index.css），课程组件用语义化裸 HTML（h3/h4/p/ul/ol/li/code/strong/a），样式统一管理。行内代码用 `:not(pre) > code` 排除代码块。特殊视觉卡片（TeacherTask/LessonQuote/LessonChecklist/LessonCode/LessonTable）保留为组件。
- **2026-06-04 标题去重**：节标题由 CourseContent header 统一显示，课程正文不再放 LessonTitle，故删除 lesson-ui 的 LessonTitle/LessonHeading/LessonSubheading 死代码组件。
- **代码块转义规则**：LessonCode 的 code 是 JS 模板字符串，C# 正则反斜杠需写 `\\`，TS 代码里的反引号写 `` \` ``、`${}` 写 `\${}`。这是后续维护课程代码块的注意点。
