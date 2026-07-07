---
task: taskhub-course-refactor
status: completed
created: 2026-07-07
updated: 2026-07-07
---

# TaskHub 贯穿项目课程重构

## 目标

将 `learn-csharp` 课程从“章节知识点并列讲解”重构为“围绕一个任务协作系统逐节推进”的连贯学习路径，使学习者完成全部课程后刚好产出一个可运行、可扩展的 ASP.NET Core 后端项目。

## 背景与约束

- 当前课程内容来自完整文档搬运，知识覆盖较全，但章节之间存在上下文断裂。
- Setup 已创建多项目结构，但后续章节仍出现重新创建最小 API、独立示例项目或泛化代码片段。
- 重构目标不是删减知识点，而是把知识点挂到同一个项目的成长路径上。
- 贯穿项目使用任务协作系统，暂定项目名 `TaskHub`。
- 课程仍面向有 TypeScript / NestJS 背景的后端或全栈开发者。
- 继续使用现有课程组件：`LessonCheckpoint` 承担正文主线任务确认，`TeacherTask` 承担老师提示和阶段任务，`LessonStep` 只保留真实独立实战。
- 每节正文必须说明“承接上节已有项目状态”和“本节完成后的项目状态”。
- 不凭空引入项目中不存在的前端组件、API 或类型声明。
- 实施课程内容改动后至少执行 `yarn lint` 和 `yarn build` 验证。

## 贯穿项目定义

`TaskHub` 是一个轻量任务协作系统后端，覆盖以下业务能力：

- 用户注册、登录、密码哈希、JWT 与 Refresh Token。
- 工作空间或项目空间管理。
- 项目成员与角色权限。
- 任务列表、任务详情、指派、状态流转、截止时间。
- 任务评论与操作记录。
- 任务变更、评论新增、成员加入的实时通知。
- 基础测试、日志、健康检查、Docker 发布与限流。

## 最终项目结构

课程主线使用三项目结构，保持 Setup 中建立的编译期依赖边界：

```text
TaskHub/
├── TaskHub.sln
├── TaskHub.Api/              # HTTP API、Program.cs、Controller 或 Endpoint、SignalR Hub
├── TaskHub.Core/             # 领域模型、DTO、接口、纯业务规则
└── TaskHub.Infrastructure/   # EF Core、数据库配置、外部服务实现、Token/Password 实现
```

依赖方向固定为：

```text
TaskHub.Api -> TaskHub.Core
TaskHub.Api -> TaskHub.Infrastructure
TaskHub.Infrastructure -> TaskHub.Core
TaskHub.Core 不依赖外层项目
```

## 课程主线产物地图

| 模块 | 章节 | 本节完成后的项目状态 |
| --- | --- | --- |
| Setup | 确认 SDK 与版本基线 | 本机 SDK 可用，知道后续 `TaskHub` 的 TargetFramework 要与 SDK 匹配。 |
| Setup | 搭建 Solution 与多项目结构 | 创建 `TaskHub.sln`、`TaskHub.Api`、`TaskHub.Core`、`TaskHub.Infrastructure`，建立正确项目引用。 |
| Setup | 运行最小 Web API | 继续运行已有 `TaskHub.Api`，访问 OpenAPI/Swagger，给 `TaskHub.Api` 安装第一个 NuGet 包，不再新建 `Todo.Api`。 |
| C# 核心 | 类型、空值和值/引用 | 在 `TaskHub.Core` 建立基础领域类型，如 `User`、`Project`、`WorkItem`、`WorkItemStatus`，理解 nullable 与实体字段边界。 |
| C# 核心 | LINQ 与 record | 为任务列表、项目成员、评论摘要编写 DTO record 和 LINQ 投影示例。 |
| C# 核心 | async/await 与 Task | 为用户、项目、任务服务定义异步接口，理解 I/O 异步与阻塞风险。 |
| ASP.NET Core | Program.cs 与请求管道 | 在 `TaskHub.Api` 中整理服务注册、中间件管道、OpenAPI、ProblemDetails 和配置绑定。 |
| ASP.NET Core | Controller、Service 与 DI | 实现 Projects / WorkItems 的最小 CRUD，建立 Controller + Service + DTO 的主线。 |
| ASP.NET Core | 验证、OpenAPI 与结构 | 为创建项目、创建任务、更新任务状态接入 FluentValidation，并完善 OpenAPI 描述。 |
| EF Core | DbContext 与实体配置 | 在 `TaskHub.Infrastructure` 创建 `TaskHubDbContext`，映射用户、项目、任务、评论等实体并生成第一批迁移。 |
| EF Core | 关系建模与查询策略 | 建模项目成员、任务指派、任务评论，讲清 Include、投影、AsNoTracking 与分页查询。 |
| EF Core | 事务、批量操作与迁移 | 实现任务状态流转、项目归档、批量关闭任务等一致性操作。 |
| Auth | 密码哈希与 JWT | 实现注册、登录、密码哈希、Access Token 签发，并保护需要登录的 TaskHub API。 |
| Auth | Refresh Token 与 Policy | 实现 Refresh Token 轮换、项目角色和权限策略，例如项目 Owner 才能管理成员。 |
| SignalR | Hub、Groups 与消息发送 | 创建项目级通知 Hub，任务变更和评论新增时向项目成员推送消息。 |
| SignalR | 认证与断线重连 | 复用 JWT 保护 Hub，重连后按用户所属项目恢复 Groups。 |
| 工程化 | 测试分层 | 为 Core 纯业务规则、服务层和关键 API 流程建立测试示例。 |
| 工程化 | 日志、缓存、健康检查 | 加入结构化日志、健康检查、常用查询缓存策略和可观测性说明。 |
| 工程化 | Docker、限流与 AOT | 容器化 `TaskHub.Api`，加入限流说明，并解释 AOT 对该项目的适用边界。 |

## 重构设计原则

### 每节内容结构

每节建议统一包含以下教学骨架：

1. 上节结束时的项目状态。
2. 本节要推进的 TaskHub 能力。
3. 本节新增或修改的文件位置。
4. 核心概念讲解，优先用 TypeScript / NestJS 对照。
5. 正文主线任务，使用 `LessonCheckpoint` 确认。
6. 本节结束后的项目状态。
7. 常见误区与阶段验收问题。

### 示例代码原则

- 示例代码优先使用 `TaskHub` 领域对象，不再频繁切换 `Todo`、`User`、`Group` 等孤立上下文。
- 可以保留小段对照代码，但必须明确它是对照，不是当前项目要新建的主线文件。
- 命令示例必须基于同一个项目目录，例如 `dotnet run --project TaskHub.Api`。
- NuGet 安装命令必须说明安装到哪个项目，例如 FluentValidation 安装到 `TaskHub.Api`，EF provider 安装到 `TaskHub.Infrastructure`。

### 实战区原则

- 正文已经推进 TaskHub 主线时，不再用 `LessonStep` 重复正文任务。
- 只有需要组合多个知识点形成额外交付物时，才保留独立实战。
- 阶段任务优先写成“TaskHub 当前阶段验收”，不写成泛化练习。

## 实施批次

| # | 状态 | 子任务 | 依赖 | 说明 |
| --- | --- | --- | --- | --- |
| 01 | completed | Setup 主线改造 | - | 统一项目名为 `TaskHub`，修复重新新建 API 的断点。 |
| 02 | completed | C# 核心领域化 | 01 | 将类型、LINQ、async 示例收敛到 Core 领域模型、DTO 和服务接口。 |
| 03 | completed | ASP.NET Core CRUD 主线 | 02 | 建立 Projects / WorkItems API，贯穿 Program、DI、验证和 OpenAPI。 |
| 04 | completed | EF Core 持久化主线 | 03 | 将实体、关系、查询、事务落到 TaskHub 数据模型。 |
| 05 | completed | Auth 与 SignalR 主线 | 04 | 认证授权与实时通知复用已有用户、项目、任务上下文。 |
| 06 | completed | 工程化与全局验收 | 05 | 测试、日志、健康检查、Docker、限流围绕最终 TaskHub 项目收尾。 |

## 子任务详情

### 01 - Setup 主线改造

目标：让前三节从环境确认自然进入同一个 `TaskHub` 多项目后端。

设计方案：

- `setup-sdk.tsx` 保留 SDK、global.json、控制台项目等基础认知，但结尾引导下一节进入 `TaskHub`。
- `setup-solution.tsx` 将 `MyApp` 替换为 `TaskHub`，明确三项目职责和引用方向。
- `setup-first-api.tsx` 不再创建 `Todo.Api`，改为进入已有 `TaskHub` 根目录并运行 `TaskHub.Api`。
- NuGet 示例改为安装到明确项目，例如 `dotnet add TaskHub.Api/TaskHub.Api.csproj package FluentValidation`。
- `src/data/course/index.ts` 中 Setup 模块目标改为“创建并运行 TaskHub 项目骨架”。

验收点：

- Setup 三节命令连续执行不会生成第二套无关项目。
- 本章结束时用户拥有可运行的 `TaskHub.Api/Core/Infrastructure`。

### 02 - C# 核心领域化

目标：让 C# 语法不再像孤立语法课，而是在 `TaskHub.Core` 中服务后续业务。

设计方案：

- 类型章节围绕 `User`、`Project`、`WorkItem`、`Comment`、`WorkItemStatus` 讲 class、enum、nullable、值/引用类型。
- LINQ 与 record 章节围绕任务列表筛选、项目成员摘要、评论摘要讲 DTO record 与投影。
- async 章节围绕 `IProjectService`、`IWorkItemService`、`IClock` 等接口讲 `Task<T>`、异步方法命名和避免 `.Result`。
- 保留 TypeScript 对照，例如 `record` 与 DTO、`var` 与 `any` 的区别。

验收点：

- C# 核心章节产物能被 ASP.NET Core 和 EF Core 章节自然复用。
- 章节中不出现与 TaskHub 无关的大段业务模型。

### 03 - ASP.NET Core CRUD 主线

目标：将 ASP.NET Core 章节统一成 `TaskHub.Api` 的 HTTP 接口搭建过程。

设计方案：

- Program 章节讲 `TaskHub.Api` 的服务注册、中间件顺序、ProblemDetails、配置绑定和 OpenAPI。
- Controller/DI 章节实现 Projects 和 WorkItems 的最小 CRUD。
- 验证/OpenAPI 章节为创建项目、创建任务、更新任务状态接入 FluentValidation，并完善 OpenAPI 响应描述。
- Minimal API 可作为对照内容保留，但主线优先使用 Controller，避免同一项目早期混用两套风格。

验收点：

- ASP.NET Core 结束时，`TaskHub.Api` 有可理解的项目与任务 API。
- 每个示例都能解释它放在 `Api`、`Core` 还是 `Infrastructure`。

### 04 - EF Core 持久化主线

目标：把 TaskHub 从内存或接口示例推进到数据库持久化。

设计方案：

- DbContext 章节创建 `TaskHubDbContext`，映射用户、项目、任务、评论。
- 关系建模章节加入 `ProjectMember`、任务指派、评论关系和项目内权限查询。
- 查询策略使用任务列表、项目看板、任务详情作为示例，区分 Include 和 Select 投影。
- 事务章节围绕任务状态流转、项目归档、批量关闭任务讲一致性操作。

验收点：

- EF 章节结束后，TaskHub 主要业务数据能落库并查询。
- 查询示例能服务后续 Auth 和 SignalR，而不是一次性演示代码。

### 05 - Auth 与 SignalR 主线

目标：在已有用户、项目、任务模型上加入安全边界和实时协作能力。

设计方案：

- Auth 第一节实现注册、登录、密码哈希、JWT 签发和基础 `[Authorize]`。
- Auth 第二节实现 Refresh Token 轮换与项目角色策略，例如 Owner、Maintainer、Member。
- SignalR 第一节创建 `ProjectNotificationHub`，任务变更、评论新增时向项目 Group 广播。
- SignalR 第二节复用 JWT 认证 Hub，重连后根据数据库成员关系恢复项目 Groups。

验收点：

- 认证授权不再独立造一套 User / Role 示例，而是复用 TaskHub 数据模型。
- SignalR 的 Group 与数据库项目成员关系边界讲清楚。

### 06 - 工程化与全局验收

目标：让最终 TaskHub 具备基本可维护性和可交付性。

设计方案：

- 测试章节围绕 Core 纯业务规则、服务层、API 流程分层讲测试。
- 可观测性章节围绕任务 API、登录流程、实时通知加入结构化日志、健康检查和缓存策略。
- 部署章节围绕 `TaskHub.Api` 写 Dockerfile、环境变量、限流与 AOT 适用边界。
- 全局验收检查课程导航、章节目标、TeacherTask、LessonCheckpoint 是否都指向同一主线。

验收点：

- 用户完成课程后能说清楚 TaskHub 从项目骨架到部署的完整路径。
- 课程中不再出现会让用户误以为要重新开项目的断点。

## 共识与决策

- **2026-07-07 贯穿项目决策**：课程重构以任务协作系统 `TaskHub` 为唯一主线项目，因为它能自然覆盖 CRUD、EF 关系、认证授权、SignalR 实时通知和工程化。
- **2026-07-07 重构方式决策**：先写完整规划文档，明确每节产物状态，再逐批实施，避免全量直接修改导致上下文跑偏。
- **2026-07-07 内容保留决策**：本次不是压缩课程，而是把已有知识点重新挂到同一个项目上下文；与主线无关的独立示例应改成 TaskHub 示例或明确标注为对照。
- **2026-07-07 结构决策**：继续使用 `Api/Core/Infrastructure` 三项目结构，保持 Core 不依赖外层的编译期边界。

## 变更日志

- 2026-07-07：创建 TaskHub 贯穿项目课程重构规划，明确每节课程完成后的项目状态和后续实施批次。
- 2026-07-07：开始实施课程重构，先推进 Setup 主线改造。
- 2026-07-07：完成 Setup 与 C# 核心第一轮主线化，开始推进 ASP.NET Core 与 EF Core 主线。
- 2026-07-07：完成全部课程主线化改造，验证 `yarn lint` 与 `yarn build` 通过。
- 2026-07-07：根据独立 review 修复部署命名残留、Redis 返回值错误、资源级授权示例断线、async 返回类型、健康检查数据库栈、EF 工具说明和规划命名同步问题。
