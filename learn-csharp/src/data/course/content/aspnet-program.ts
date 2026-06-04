import type { ILessonBlock } from "@/components/lesson-ui";

export const aspnetProgramBlocks = [
  {
    "text": "预估时间：3 周 | 目标：能独立搭建 REST API 项目",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "本章你要掌握什么",
    "type": "heading"
  },
  {
    "text": "学完本章后，你应该能独立创建 ASP.NET Core Web API，理解 `Program.cs` 的服务注册和请求管道，写 Controller CRUD，配置 DI、验证、中间件、授权和 OpenAPI 文档。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "老师提示",
    "type": "heading"
  },
  {
    "text": "把 ASP.NET Core 对照 NestJS 学会很快，但不要完全套 NestJS 思维。ASP.NET Core 的核心是“服务容器 + 中间件管道 + Endpoint/Controller”。先看请求从 `app.Use...` 到 `MapControllers()` 的路径，再看 Controller 和 Service。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "学习顺序建议",
    "type": "heading"
  },
  {
    "items": [
      "先读懂 `Program.cs`：哪些是 `builder.Services`，哪些是 `app.Use`。",
      "再写 Controller + Service + DTO 的最小 CRUD。",
      "然后补验证、异常处理、配置绑定和 OpenAPI。",
      "最后再比较 Controller 和 Minimal API，不要一开始混用两套风格。"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "常见误区",
    "type": "heading"
  },
  {
    "items": [
      "把 `AddScoped` / `AddSingleton` / `AddTransient` 随便选。",
      "中间件顺序写错，例如先授权后认证。",
      "把 Endpoint Filters 当成 Middleware 或 Controller Filter 的通用替代。",
      "为了统一响应格式写过重的中间件，反而破坏状态码和 OpenAPI 描述。"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "项目结构与入口",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "与 NestJS 的对照",
    "type": "heading"
  },
  {
    "code": "NestJS                              ASP.NET Core\n├── apps/server/src/main.ts         ├── Program.cs（入口，极简）\n├── app.module.ts                   │    builder.Services.AddXXX()\n│                                   │    builder.Build()\n│                                   │    app.UseXXX() 中间件链\n│                                   │\n├── modules/user/                   ├── Controllers/UsersController.cs\n│   ├── user.controller.ts          │\n│   ├── user.service.ts             ├── Services/UserService.cs\n│   ├── user.module.ts              │\n│   ├── dto/                        ├── Models/\n│   └── entities/                   │   ├── Entities/User.cs\n│                                   │   ├── Dtos/\n│                                   │   │   ├── UserDto.cs\n│                                   │   │   ├── CreateUserDto.cs\n│                                   │   │   └── UpdateUserDto.cs\n│                                   │   └── Interfaces/\n│                                   │       └── IUserRepository.cs\n│                                   │\n├── common/guards/                  ├── Middleware/JwtAuthMiddleware.cs\n├── common/interceptors/            ├── Middleware/ResponseMiddleware.cs\n├── common/filters/                 ├── Middleware/ExceptionMiddleware.cs\n├── common/decorators/              ├── Attributes/JwtAuthAttribute.cs\n└── shared/database/                ├── Data/\n│                                   │   └── ApplicationDbContext.cs",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "最小入口文件",
    "type": "heading"
  },
  {
    "code": "// Program.cs — 比 NestJS 的 main.ts 更简洁\nvar builder = WebApplication.CreateBuilder(args);\n\n// 注册服务（替代 NestJS 的 module imports）\nbuilder.Services.AddControllers();\nbuilder.Services.AddEndpointsApiExplorer();\nbuilder.Services.AddSwaggerGen();\nbuilder.Services.AddDbContext<ApplicationDbContext>(\n    options => options.UseSqlServer(builder.Configuration.GetConnectionString(\"Default\")));\nbuilder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)\n    .AddJwtBearer();\n\nvar app = builder.Build();\n\n// 中间件管道\nif (app.Environment.IsDevelopment())\n{\n    app.UseSwagger();\n    app.UseSwaggerUI();\n}\n\napp.UseHttpsRedirection();\napp.UseAuthentication();\napp.UseAuthorization();\napp.MapControllers();\n\napp.Run();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "注意：`Program.cs` 是一个 **顶级语句文件**（C# 9+），不需要 `class Program` 和 `static void Main`。",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "DI 依赖注入",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "生命周期对照",
    "type": "heading"
  },
  {
    "headers": [
      "生命周期",
      "NestJS",
      "ASP.NET Core",
      "行为"
    ],
    "rows": [
      [
        "Singleton",
        "`scope: Scope.SINGLETON`",
        "`AddSingleton<T>()`",
        "整个应用生命周期，全局唯一"
      ],
      [
        "Scoped",
        "`scope: Scope.REQUEST`",
        "`AddScoped<T>()`",
        "每个 HTTP 请求内唯一"
      ],
      [
        "Transient",
        "默认",
        "`AddTransient<T>()`",
        "每次注入创建新实例"
      ]
    ],
    "type": "table"
  },
  {
    "level": 3,
    "text": "使用方式",
    "type": "heading"
  },
  {
    "code": "// 注册\nbuilder.Services.AddScoped<IUserService, UserService>();\nbuilder.Services.AddScoped<UserService>(); // 如果只有一种实现，可简化\n\n// 使用 — 通过构造函数注入（与 NestJS 完全一致！）\npublic class UsersController : ControllerBase\n{\n    private readonly IUserService _userService;\n\n    public UsersController(IUserService userService)\n    {\n        _userService = userService;\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**关键差异**：ASP.NET Core 内置 DI 容器，**不需要 `@Injectable()` 装饰器**。任何可公开构造的类型都可以被注入。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "Minimal API — 轻量 API 入口方式",
    "type": "heading"
  },
  {
    "text": "Minimal API 是 .NET 6 引入的轻量级 API 定义方式，不需要 Controller 类。它适合小型服务、网关、内部 API 和函数式端点组织。",
    "type": "paragraph"
  },
  {
    "code": "var builder = WebApplication.CreateBuilder(args);\n\nbuilder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)\n    .AddJwtBearer();\nbuilder.Services.AddAuthorization();\n\nvar app = builder.Build();\napp.UseAuthentication();\napp.UseAuthorization();\n\n// 路由分组（类似 NestJS 的 GlobalPrefix + Controller prefix）\nvar authGroup = app.MapGroup(\"/api/auth\");\nvar userGroup = app.MapGroup(\"/api/users\").RequireAuthorization();\n\n// 登录 — 类似 NestJS @Post('login')\nauthGroup.MapPost(\"/login\", async (LoginDto dto, IAuthService auth) =>\n{\n    var result = await auth.LoginAsync(dto);\n    return Results.Ok(result);\n});\n\n// 获取用户 — 类似 NestJS @Get(':id')\nuserGroup.MapGet(\"/{id}\", async (string id, IUserService service) =>\n{\n    var user = await service.GetByIdAsync(id);\n    return user is null ? Results.NotFound() : Results.Ok(user);\n});\n\n// 创建用户 — 类似 NestJS @Post()\nuserGroup.MapPost(\"/\", async (CreateUserDto dto, IAuthService auth) =>\n{\n    var user = await auth.CreateAsync(dto);\n    return Results.Created($\"/api/users/{user.Id}\", user);\n});\n\napp.Run();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "Minimal API vs Controller 对照",
    "type": "heading"
  },
  {
    "headers": [
      "维度",
      "Minimal API",
      "Controller"
    ],
    "rows": [
      [
        "代码量",
        "少 60-80%",
        "传统模式"
      ],
      [
        "学习曲线",
        "低（类似 TS 函数）",
        "中等"
      ],
      [
        "依赖注入",
        "参数即 DI",
        "构造函数注入"
      ],
      [
        "测试",
        "直接测试端点函数",
        "需模拟 ControllerBase"
      ],
      [
        "NestJS 对照",
        "类似 `@Controller` + `@Get` 函数",
        "类似 `@Controller` 类"
      ]
    ],
    "type": "table"
  },
  {
    "text": "**推荐策略**：先用 Controller 快速上手（与你的 NestJS 习惯匹配），完成一个稳定 CRUD 后再学习 Minimal API。不要一开始同时混用两套风格。",
    "type": "paragraph"
  }
] satisfies ILessonBlock[];
