import type { ILessonBlock } from "@/components/lesson-ui";

export const engineeringDeployBlocks = [
  {
    "level": 2,
    "text": "速率限制",
    "type": "heading"
  },
  {
    "level": 3,
    "text": ".NET 8 内置 Rate Limiting",
    "type": "heading"
  },
  {
    "code": "# .NET 7+ 内置，无需额外安装；学习时按当前 LTS SDK 使用",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "code": "// Program.cs\nbuilder.Services.AddRateLimiter(rateLimiterOptions =>\n{\n    // 全局默认：每 IP 每秒 10 请求\n    rateLimiterOptions.AddFixedWindowLimiter(\"default\", options =>\n    {\n        options.Window = TimeSpan.FromSeconds(1);\n        options.PermitLimit = 10;\n        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;\n        options.QueueLimit = 5;\n    });\n\n    // 认证用户更高限额\n    rateLimiterOptions.AddPolicy(\"authed\", context =>\n        RateLimitPartition.GetFixedWindowLimiter(\n            context.HttpContext.User.Identity?.Name ?? \"\",\n            _ => new FixedWindowRateLimiterOptions\n            {\n                PermitLimit = 50,\n                Window = TimeSpan.FromSeconds(1)\n            }));\n\n    // 登录端点：每 IP 每分钟 5 次\n    rateLimiterOptions.AddPolicy(\"login\", context =>\n        RateLimitPartition.GetFixedWindowLimiter(\n            context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? \"\",\n            _ => new FixedWindowRateLimiterOptions\n            {\n                PermitLimit = 5,\n                Window = TimeSpan.FromMinutes(1)\n            }));\n});\n\napp.UseRateLimiter();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "code": "// 使用\n[HttpPost(\"login\")]\n[EnableRateLimiting(\"login\")]  // 使用指定策略\npublic async Task<IActionResult> Login(LoginDto dto) { ... }",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "性能优化",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "1. 避免 N+1 查询",
    "type": "heading"
  },
  {
    "code": "// 错误：循环内查询\nforeach (var user in users)\n{\n    var roles = await _context.Roles.Where(r => r.UserId == user.Id).ToListAsync(); // N+1!\n}\n\n// 正确：预加载\nvar usersWithRoles = await _context.Users\n    .Include(u => u.Roles)\n    .ToListAsync();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "2. 分页限制",
    "type": "heading"
  },
  {
    "code": "[HttpGet]\npublic async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)\n{\n    if (pageSize < 1 || pageSize > 100)  // 最大 100\n        return BadRequest(\"pageSize 必须在 1-100 之间\");\n\n    var users = await _userService.GetAllAsync(page, pageSize);\n    return Ok(new {\n        data = users.Data,\n        pagination = new { page, pageSize, total = users.Total }\n    });\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "3. 异步最佳实践",
    "type": "heading"
  },
  {
    "code": "// ✅ 正确\npublic async Task<User?> GetByIdAsync(string id)\n{\n    return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);\n}\n\n// ✅ 正确：CPU 绑定用 Task.Run\npublic async Task<UserDto> GetWithSummaryAsync(string id)\n{\n    var user = await GetByIdAsync(id);\n    if (user == null) return null;\n\n    // 如果计算量大，放线程池\n    var summary = await Task.Run(() => HeavyCalculation(user));\n\n    return new UserDto { User = user, Summary = summary };\n}\n\n// ❌ 错误：阻塞调用\npublic User GetById(string id)\n{\n    return _context.Users.First(u => u.Id == id); // 阻塞线程\n}\n\n// ❌ 错误：.Result\npublic async Task<User?> GetByIdAsync(string id)\n{\n    return _context.Users.FirstAsync(u => u.Id == id).Result; // 死锁风险！\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "4. 连接池配置",
    "type": "heading"
  },
  {
    "code": "// appsettings.json\n\"Database\": {\n  \"ConnectionString\": \"Host=localhost;Database=myapp;Username=postgres;Password=secret;MaxPoolSize=100;MinPoolSize=5\"\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "code": "// 或使用连接字符串参数\noptions.UseNpgsql(connectionString, npgsqlOptions =>\n{\n    npgsqlOptions.CommandTimeout(30);  // 超时\n    npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);\n});",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "部署",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "Docker",
    "type": "heading"
  },
  {
    "text": "镜像版本要和项目 `TargetFramework` 保持一致。下面以 `net10.0` 为例；如果项目使用 `net8.0`，则把镜像标签改成 `8.0`。",
    "type": "quote"
  },
  {
    "code": "FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base\nWORKDIR /app\nEXPOSE 8080\nEXPOSE 8081  # Kestrel\n\nFROM mcr.microsoft.com/dotnet/sdk:10.0 AS build\nWORKDIR /src\nCOPY [\"MyApp.Api/MyApp.Api.csproj\", \"MyApp.Api/\"]\nCOPY [\"MyApp.Core/MyApp.Core.csproj\", \"MyApp.Core/\"]\nCOPY [\"MyApp.Infrastructure/MyApp.Infrastructure.csproj\", \"MyApp.Infrastructure/\"]\nRUN dotnet restore \"MyApp.Api/MyApp.Api.csproj\"\nCOPY . .\nWORKDIR \"/src/MyApp.Api\"\nRUN dotnet build \"MyApp.Api.csproj\" -c Release -o /app/build\n\nFROM build AS publish\nRUN dotnet publish \"MyApp.Api.csproj\" -c Release -o /app/publish /p:UseAppHost=false\n\nFROM base AS final\nWORKDIR /app\nCOPY --from=publish /app/publish .\nENV ASPNETCORE_URLS=http://+:8080\nENV ASPNETCORE_ENVIRONMENT=Production\nENTRYPOINT [\"dotnet\", \"MyApp.Api.dll\"]",
    "language": "dockerfile",
    "title": "dockerfile 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "AOT（提前编译）",
    "type": "heading"
  },
  {
    "level": 4,
    "text": "AOT 发布",
    "type": "heading"
  },
  {
    "code": "# 完整发布命令\ndotnet publish -c Release -r linux-x64 \\\n    -p:PublishAot=true \\\n    -p:StripSymbols=true \\\n    -p:DebuggerSupport=false \\\n    -o ./publish/aot",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "level": 4,
    "text": "AOT 的限制",
    "type": "heading"
  },
  {
    "headers": [
      "不支持",
      "说明"
    ],
    "rows": [
      [
        "动态加载程序集",
        "编译期必须知道所有类型"
      ],
      [
        "某些反射场景",
        "需要 `JsonSourceGenerator`"
      ],
      [
        "EF Core 动态查询",
        "需要静态配置"
      ],
      [
        "表达式编译",
        "部分 LINQ 表达式不被支持"
      ]
    ],
    "type": "table"
  },
  {
    "headers": [
      "需要谨慎评估",
      "说明"
    ],
    "rows": [
      [
        "Minimal API",
        "最适合 AOT 的 ASP.NET Core 风格"
      ],
      [
        "Controller",
        "可用性取决于反射、JSON 序列化和依赖库使用方式"
      ],
      [
        "SignalR",
        "初学阶段不要作为 AOT 练习目标"
      ],
      [
        "EF Core",
        "需要额外关注模型、查询和编译期限制"
      ],
      [
        "Serilog",
        "sink 和 enrichers 需要逐个确认兼容性"
      ]
    ],
    "type": "table"
  },
  {
    "level": 4,
    "text": "适用场景",
    "type": "heading"
  },
  {
    "items": [
      "✅ 微服务（小二进制文件、秒级启动）",
      "✅ 容器化部署（15-30MB vs 传统 200MB+）",
      "✅ Serverless（冷启动快）",
      "❌ 大型单体应用（编译慢、限制多）",
      "❌ 需要动态插件的系统"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 3,
    "text": "普通发布命令",
    "type": "heading"
  },
  {
    "code": "# 普通发布（非 AOT）\ndotnet publish MyApp.Api/MyApp.Api.csproj -c Release -o ./publish\n\n# 发布 + 自包含（不含 .NET 运行时）\ndotnet publish -c Release -r linux-x64 --self-contained -o ./publish",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": ".NET 生态总览",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "常见 NuGet 包速查",
    "type": "heading"
  },
  {
    "headers": [
      "需求",
      "NestJS 包",
      ".NET 包"
    ],
    "rows": [
      [
        "Web 框架",
        "`@nestjs/core`",
        "`Microsoft.AspNetCore.App`（内置）"
      ],
      [
        "ORM",
        "`@nestjs/typeorm`",
        "`Microsoft.EntityFrameworkCore`"
      ],
      [
        "数据库驱动",
        "`pg`",
        "`Npgsql.EntityFrameworkCore.PostgreSQL`"
      ],
      [
        "Redis",
        "`@nestjs-modules/ioredis`",
        "`StackExchange.Redis`"
      ],
      [
        "消息队列",
        "`@nestjs/microservices`",
        "`MassTransit` + `RabbitMQ.Client`"
      ],
      [
        "JWT",
        "`@nestjs/jwt`",
        "`System.IdentityModel.Tokens.Jwt`"
      ],
      [
        "验证",
        "`class-validator`",
        "`FluentValidation`"
      ],
      [
        "Swagger",
        "`@nestjs/swagger`",
        "`Swashbuckle.AspNetCore`"
      ],
      [
        "健康检查",
        "`@nestjs/terminus`",
        "`AspNetCore.HealthChecks`"
      ],
      [
        "日志",
        "`@nestjs/common` Logger",
        "`Microsoft.Extensions.Logging` + Serilog"
      ],
      [
        "缓存",
        "`cache-manager`",
        "`Microsoft.Extensions.Caching`"
      ],
      [
        "速率限制",
        "`@nestjs/throttler`",
        "`Microsoft.AspNetCore.RateLimiting`"
      ],
      [
        "测试",
        "`Jest` + `supertest`",
        "`xUnit` + `Moq` + `FluentAssertions`"
      ],
      [
        "HTTP 客户端",
        "`axios`",
        "`HttpClient`（内置）+ `Polly`（重试/熔断）"
      ]
    ],
    "type": "table"
  },
  {
    "level": 2,
    "text": "实战练习清单",
    "type": "heading"
  },
  {
    "id": "checklist-34",
    "items": [
      "为 UserService 编写单元测试（Moq + FluentAssertions）",
      "编写 UsersController 集成测试（WebApplicationFactory + Testcontainers）",
      "配置 Serilog 日志（生产级：Enrich + File + Console）",
      "实现 Redis 缓存服务",
      "添加健康检查端点",
      "配置 .NET 8 内置速率限制",
      "编写 Dockerfile 并容器化部署",
      "尝试 AOT 发布，对比启动性能和镜像大小"
    ],
    "title": "练习清单",
    "type": "checklist"
  },
  {
    "level": 2,
    "text": "阶段验收问题",
    "type": "heading"
  },
  {
    "items": [
      "单元测试、集成测试、E2E 测试分别适合验证什么？",
      "为什么数据库集成测试更推荐 Testcontainers？",
      "结构化日志相比字符串拼接有什么优势？",
      "live 和 ready 健康检查有什么区别？",
      "AOT 适合哪些场景，为什么 SignalR 初学阶段不适合作为 AOT 练习目标？"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "总结",
    "type": "heading"
  },
  {
    "text": "完成本阶段后，你已经具备复刻 `my-first-nest` 主要后端能力的基础。建议的下一步：",
    "type": "paragraph"
  },
  {
    "items": [
      "**从 README.md 的 Phase 1 开始**，用 C# 复刻 `my-first-nest` 的认证模块",
      "**对照阅读**每个阶段的 MD 文件与你的 NestJS 代码",
      "**遇到问题时**，Microsoft 官方文档是最佳的参考资源"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "text": "*祝你学习顺利！🚀*",
    "type": "paragraph"
  }
] satisfies ILessonBlock[];
