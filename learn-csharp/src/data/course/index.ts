import { AspnetControllerDiLesson } from "@/lessons/aspnet-core/controller-di";
import { AspnetOpenApiValidationLesson } from "@/lessons/aspnet-core/openapi-validation";
import { AspnetProgramLesson } from "@/lessons/aspnet-core/program";
import { AuthPasswordJwtLesson } from "@/lessons/auth/password-jwt";
import { AuthRefreshPolicyLesson } from "@/lessons/auth/refresh-policy";
import { CsharpAsyncLesson } from "@/lessons/csharp-core/async";
import { CsharpLinqRecordLesson } from "@/lessons/csharp-core/linq-record";
import { CsharpTypesLesson } from "@/lessons/csharp-core/types";
import { EfDbContextLesson } from "@/lessons/ef-core/dbcontext";
import { EfRelationshipsLesson } from "@/lessons/ef-core/relationships";
import { EfTransactionsLesson } from "@/lessons/ef-core/transactions";
import { EngineeringDeployLesson } from "@/lessons/engineering/deploy";
import { EngineeringObservabilityLesson } from "@/lessons/engineering/observability";
import { EngineeringTestingLesson } from "@/lessons/engineering/testing";
import { SetupFirstApiLesson } from "@/lessons/setup/first-api";
import { SetupSdkLesson } from "@/lessons/setup/sdk";
import { SetupSolutionLesson } from "@/lessons/setup/solution";
import { SignalrAuthReconnectLesson } from "@/lessons/signalr/auth-reconnect";
import { SignalrHubLesson } from "@/lessons/signalr/hub";

export type {
  ICourseModule,
  ICourseSection,
  ILessonComponentProps,
  ITeacherGuide,
} from "./types";

export const courseModules = [
  {
    id: "setup",
    order: "00",
    title: "环境准备与项目骨架",
    duration: "1-2 天",
    sourcePath: "src/lessons/setup",
    goal: "能创建、运行、调试一个最小 .NET 项目。",
    teacherGuide: {
      teacherNotes: [
        "这一章不要追求理解所有模板代码，先把项目跑起来。",
        "后面任何编译失败、API 文档打不开、包还原失败，都先回到本章排查。",
      ],
      commonPitfalls: [
        "把 .sln 当成项目本体。",
        "TargetFramework 与本机 SDK 不匹配。",
        "端口写死为 5000，没有看终端输出。",
      ],
      acceptanceQuestions: [
        ".sln 和 .csproj 分别解决什么问题？",
        "为什么 Core 不应该依赖 Infrastructure？",
        "NuGet 包安装后会写入哪个文件？",
      ],
    },
    sections: [
      {
        id: "setup-sdk",
        title: "确认 SDK 与版本基线",
        objective: "知道本机使用哪个 SDK，并能固定项目 SDK。",
        component: SetupSdkLesson,
      },
      {
        id: "setup-solution",
        title: "搭建 Solution 与多项目结构",
        objective: "能创建 Api/Core/Infrastructure 三层项目并建立依赖方向。",
        component: SetupSolutionLesson,
      },
      {
        id: "setup-first-api",
        title: "运行最小 Web API",
        objective: "能运行 Web API、安装 NuGet 包并访问 API 文档。",
        component: SetupFirstApiLesson,
      },
    ],
  },
  {
    id: "csharp-core",
    order: "01",
    title: "C# 语言核心",
    duration: "2-3 周",
    sourcePath: "src/lessons/csharp-core",
    goal: "能用 C# 写干净的业务逻辑代码。",
    teacherGuide: {
      teacherNotes: [
        "你已经有 TypeScript 基础，重点放在 C# 类型系统和 LINQ 思维。",
        "DTO 优先 record，Entity 优先 class，这是后续 EF Core 的重要边界。",
      ],
      commonPitfalls: ["把 var 当成 any。", "忽略 Nullable 警告。", "异步方法中使用 .Result 或 .Wait()。"],
      acceptanceQuestions: [
        "var 和 any 最大区别是什么？",
        "LINQ 延迟执行什么时候触发？",
        "为什么 DTO 适合 record？",
      ],
    },
    sections: [
      {
        id: "csharp-types",
        title: "类型、空值和值/引用",
        objective: "建立 C# 类型系统的基本直觉。",
        component: CsharpTypesLesson,
      },
      {
        id: "csharp-linq-record",
        title: "LINQ 与 record",
        objective: "能用 LINQ 处理集合，并用 record 表达 DTO。",
        component: CsharpLinqRecordLesson,
      },
      {
        id: "csharp-async",
        title: "async/await 与 Task",
        objective: "能区分 I/O 异步和 CPU 计算，并避免阻塞异步。",
        component: CsharpAsyncLesson,
      },
    ],
  },
  {
    id: "aspnet-core",
    order: "02",
    title: "ASP.NET Core 框架",
    duration: "3-4 周",
    sourcePath: "src/lessons/aspnet-core",
    goal: "能独立搭建 REST API 项目。",
    teacherGuide: {
      teacherNotes: ["先理解请求从 Middleware 到 Controller 的路径。", "Controller 和 Minimal API 都要了解，但一开始不要混用。"],
      commonPitfalls: ["中间件顺序写错。", "随意选择 DI 生命周期。", "把 Endpoint Filters 当成所有拦截逻辑的替代品。"],
      acceptanceQuestions: [
        "AddScoped、AddSingleton、AddTransient 有什么区别？",
        "UseAuthentication 为什么要在 UseAuthorization 前面？",
        "OpenAPI 和 Swagger UI 是同一件事吗？",
      ],
    },
    sections: [
      { id: "aspnet-program", title: "Program.cs 与请求管道", objective: "看懂 ASP.NET Core 从启动到处理请求的主流程。", component: AspnetProgramLesson },
      { id: "aspnet-controller-di", title: "Controller、Service 与 DI", objective: "能写标准 Controller + Service API。", component: AspnetControllerDiLesson },
      { id: "aspnet-openapi-validation", title: "验证、OpenAPI 与结构", objective: "能给 DTO 做验证，并生成 API 描述。", component: AspnetOpenApiValidationLesson },
    ],
  },
  {
    id: "ef-core",
    order: "03",
    title: "EF Core 数据库",
    duration: "2-3 周",
    sourcePath: "src/lessons/ef-core",
    goal: "能用 EF Core 建模复杂关系并处理事务。",
    teacherGuide: {
      teacherNotes: ["DbContext 是工作单元，不只是 Repository 替代品。", "只读查询和修改实体的查询策略要分开。"],
      commonPitfalls: ["列表接口 Include 一整棵对象图。", "只读查询忘记 AsNoTracking。", "循环里逐条 SaveChangesAsync。"],
      acceptanceQuestions: ["DbContext 为什么通常是 Scoped？", "Include 和 Select 投影分别适合什么场景？", "软删除全局过滤器有什么边界情况？"],
    },
    sections: [
      { id: "ef-dbcontext", title: "DbContext 与实体配置", objective: "理解 DbContext、DbSet、实体配置和迁移的基本关系。", component: EfDbContextLesson },
      { id: "ef-relationships", title: "关系建模与查询策略", objective: "能建模多对多、自引用树结构，并选择合适查询方式。", component: EfRelationshipsLesson },
      { id: "ef-transactions", title: "事务、批量操作与迁移", objective: "能处理多步骤一致性操作，并使用批量更新优化数据库往返。", component: EfTransactionsLesson },
    ],
  },
  {
    id: "auth",
    order: "04",
    title: "认证授权",
    duration: "1-2 周",
    sourcePath: "src/lessons/auth",
    goal: "能实现 JWT 登录、刷新令牌、RBAC 和策略授权。",
    teacherGuide: {
      teacherNotes: ["认证授权不要为了快而牺牲安全习惯。", "权限判断尽量放到 Policy/Handler，而不是堆在 Controller。"],
      commonPitfalls: ["自己写密码哈希算法。", "Refresh Token 明文入库。", "Access Token 有效期设置过长。"],
      acceptanceQuestions: ["为什么 Refresh Token 只保存哈希？", "Role、Permission、Claim、Policy 分别负责什么？", "什么时候需要资源级授权？"],
    },
    sections: [
      { id: "auth-password-jwt", title: "密码哈希与 JWT", objective: "实现登录并签发短期 Access Token。", component: AuthPasswordJwtLesson },
      { id: "auth-refresh-policy", title: "Refresh Token 与 Policy", objective: "实现刷新令牌轮换和权限策略。", component: AuthRefreshPolicyLesson },
    ],
  },
  {
    id: "signalr",
    order: "05",
    title: "SignalR 实时通信",
    duration: "1 周",
    sourcePath: "src/lessons/signalr",
    goal: "能用 SignalR 实现房间、点对点消息、广播。",
    teacherGuide: {
      teacherNotes: ["SignalR 与 Socket.IO 不兼容，前端必须使用 SignalR 客户端。", "Groups 是连接级分组，业务成员关系仍要落库。"],
      commonPitfalls: ["用 Socket.IO 客户端连接 SignalR。", "用静态字典当多实例全局在线表。", "自动重连后忘记重新加入房间。"],
      acceptanceQuestions: ["Clients.Caller、Clients.Group、Clients.User 分别发送给谁？", "Groups 和数据库群组成员关系有什么区别？", "WebSocket 查询参数传 JWT 有什么安全注意事项？"],
    },
    sections: [
      { id: "signalr-hub", title: "Hub、Groups 与消息发送", objective: "搭建最小 Hub，并实现房间消息。", component: SignalrHubLesson },
      { id: "signalr-auth-reconnect", title: "认证与断线重连", objective: "复用 JWT 保护 Hub，并在重连后恢复房间状态。", component: SignalrAuthReconnectLesson },
    ],
  },
  {
    id: "engineering",
    order: "06",
    title: "工程化与进阶",
    duration: "持续",
    sourcePath: "src/lessons/engineering",
    goal: "建立完整的 .NET 工程化体系。",
    teacherGuide: {
      teacherNotes: ["工程化是可维护性的底线，不是最后装饰。", "先做测试、日志、健康检查，再逐步加缓存、限流、Docker 和 AOT。"],
      commonPitfalls: ["用 EF Core InMemory 代替所有数据库测试。", "日志只拼字符串，不保留结构化字段。", "Docker 镜像版本和 TargetFramework 不一致。"],
      acceptanceQuestions: ["单元测试、集成测试、E2E 分别验证什么？", "live 和 ready 健康检查有什么区别？", "AOT 适合哪些场景？"],
    },
    sections: [
      { id: "engineering-testing", title: "测试分层", objective: "知道哪些逻辑该单测，哪些流程该集成测试。", component: EngineeringTestingLesson },
      { id: "engineering-observability", title: "日志、缓存、健康检查", objective: "给应用加上基础可观测和性能辅助能力。", component: EngineeringObservabilityLesson },
      { id: "engineering-deploy", title: "Docker、限流与 AOT", objective: "能容器化发布，并知道 AOT 的适用边界。", component: EngineeringDeployLesson },
    ],
  },
];
