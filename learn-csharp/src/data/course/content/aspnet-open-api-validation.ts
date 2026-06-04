import type { ILessonBlock } from "@/components/lesson-ui";

export const aspnetOpenApiValidationBlocks = [
  {
    "level": 2,
    "text": "数据验证",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "方式一：Data Annotations（类似 NestJS 的 class-validator）",
    "type": "heading"
  },
  {
    "code": "public class CreateUserDto\n{\n    [Required(ErrorMessage = \"用户名不能为空\")]\n    [StringLength(50, MinimumLength = 3)]\n    public string Username { get; set; } = string.Empty;\n\n    [Required]\n    [EmailAddress]\n    public string Email { get; set; } = string.Empty;\n\n    [Required]\n    [StringLength(100, MinimumLength = 8)]\n    public string Password { get; set; } = string.Empty;\n\n    [Phone]\n    public string? Phone { get; set; }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**内置验证属性**：`[Required]`, `[StringLength]`, `[EmailAddress]`, `[Phone]`, `[Range]`, `[RegularExpression]`, `[Url]`, `[CreditCard]`",
    "type": "paragraph"
  },
  {
    "level": 3,
    "text": "方式二：FluentValidation（推荐，对应 class-validator）",
    "type": "heading"
  },
  {
    "code": "# 安装\ndotnet add package FluentValidation\ndotnet add package FluentValidation.DependencyInjectionExtensions",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "code": "using FluentValidation;\n\npublic class CreateUserDto\n{\n    public string Username { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string Password { get; set; } = string.Empty;\n}\n\n// 验证器 — 链式 API，比装饰器更灵活\npublic class CreateUserDtoValidator : AbstractValidator<CreateUserDto>\n{\n    public CreateUserDtoValidator()\n    {\n        RuleFor(x => x.Username)\n            .NotEmpty()\n            .MinimumLength(3)\n            .MaximumLength(50)\n            .WithMessage(\"用户名长度应在 3-50 之间\")\n            .Must(BeUniqueUsername)\n            .WithMessage(\"用户名已被注册\");\n\n        RuleFor(x => x.Email)\n            .NotEmpty()\n            .EmailAddress()\n            .Must(BeUniqueEmail)\n            .WithMessage(\"邮箱已被注册\");\n\n        RuleFor(x => x.Password)\n            .NotEmpty()\n            .MinimumLength(8)\n            .Matches(@\"[A-Z]\").WithMessage(\"密码必须包含大写字母\")\n            .Matches(@\"[a-z]\").WithMessage(\"密码必须包含小写字母\")\n            .Matches(@\"\\d\").WithMessage(\"密码必须包含数字\");\n\n        RuleFor(x => x)\n            .Must(x => x.Password != x.Username)\n            .WithMessage(\"密码不能与用户名相同\");\n    }\n\n    private bool BeUniqueUsername(string username)\n    {\n        // 检查数据库是否已存在\n        return !_userRepository.UsernameExists(username);\n    }\n\n    private bool BeUniqueEmail(string email)\n    {\n        return !_userRepository.EmailExists(email);\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**注册验证器**（全局自动校验）：",
    "type": "paragraph"
  },
  {
    "code": "// Program.cs\nbuilder.Services.AddFluentValidationAutoValidation();\nbuilder.Services.AddValidatorsFromAssemblyContaining<Program>();\n\n// 或者在 Startup.cs 中全局注册 ValidationFilter\nbuilder.Services.AddControllers(options =>\n{\n    options.ModelBindingMessageProvider.SetValueIsInvalidAccessor(\n        x => $\"{x.ModelName} 字段无效\");\n    options.ModelBindingMessageProvider.SetValueIsRequiredAccessor(\n        x => $\"{x.ModelName} 字段不能为空\");\n});",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 class-validator 对比**：",
    "type": "paragraph"
  },
  {
    "headers": [
      "",
      "class-validator",
      "FluentValidation"
    ],
    "rows": [
      [
        "配置方式",
        "装饰器",
        "独立类"
      ],
      [
        "跨字段验证",
        "有限",
        "✅ 完整支持"
      ],
      [
        "异步验证",
        "✅",
        "✅"
      ],
      [
        "数据库存在性检查",
        "手动",
        "内置支持"
      ],
      [
        "消息自定义",
        "简单",
        "强大"
      ],
      [
        "性能",
        "反射",
        "编译期表达式"
      ]
    ],
    "type": "table"
  },
  {
    "level": 2,
    "text": "中间件管道",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "与 NestJS 的对照",
    "type": "heading"
  },
  {
    "code": "NestJS 中间件              ASP.NET Core 中间件\n─────────────────         ─────────────────\napp.use(middleware)        app.Use(Middleware)",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "code": "// 中间件管道 — 按注册顺序执行\napp.UseHttpsRedirection();       // 1. HTTPS 重定向\napp.UseStaticFiles();            // 2. 静态文件\napp.UseSwagger();                // 3. Swagger UI\napp.UseAuthentication();         // 4. 认证（修改 HttpContext.User）\napp.UseAuthorization();          // 5. 授权（检查 [Authorize]）\napp.UseMiddleware<LoggingMiddleware>();  // 6. 自定义日志中间件\napp.MapControllers();            // 7. 路由到 Controller",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "自定义中间件",
    "type": "heading"
  },
  {
    "code": "// 基于委托的中间件（轻量级，推荐）\npublic class RequestTimeMiddleware\n{\n    private readonly RequestDelegate _next;\n    private readonly ILogger<RequestTimeMiddleware> _logger;\n\n    public RequestTimeMiddleware(RequestDelegate next, ILogger<RequestTimeMiddleware> logger)\n    {\n        _next = next;\n        _logger = logger;\n    }\n\n    public async Task InvokeAsync(HttpContext context)\n    {\n        var sw = System.Diagnostics.Stopwatch.StartNew();\n        await _next(context); // 调用下一个中间件\n        sw.Stop();\n        _logger.LogInformation(\"Request {Method} {Path} took {Ms}ms\",\n            context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds);\n    }\n}\n\n// 注册\napp.UseMiddleware<RequestTimeMiddleware>();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "全局异常处理中间件",
    "type": "heading"
  },
  {
    "code": "// 对应 NestJS 的 GlobalExceptionFilter\npublic class ExceptionMiddleware\n{\n    private readonly RequestDelegate _next;\n    private readonly ILogger<ExceptionMiddleware> _logger;\n\n    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)\n    {\n        _next = next;\n        _logger = logger;\n    }\n\n    public async Task InvokeAsync(HttpContext context)\n    {\n        try\n        {\n            await _next(context);\n        }\n        catch (Exception ex)\n        {\n            await HandleExceptionAsync(context, ex);\n        }\n    }\n\n    private static Task HandleExceptionAsync(HttpContext context, Exception exception)\n    {\n        context.Response.ContentType = \"application/json\";\n\n        var (statusCode, message) = exception switch\n        {\n            UnauthorizedAccessException => (401, \"未授权\"),\n            KeyNotFoundException => (404, \"资源未找到\"),\n            ArgumentException => (400, $\"参数错误: {exception.Message}\"),\n            _ => (500, \"服务器内部错误\")\n        };\n\n        context.Response.StatusCode = statusCode;\n\n        return context.Response.WriteAsJsonAsync(new\n        {\n            code = statusCode,\n            message,\n            timestamp = DateTime.UtcNow.ToString(\"o\")\n        });\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "Endpoint Filters — Minimal API 的端点级拦截",
    "type": "heading"
  },
  {
    "text": "Endpoint Filters 适合 Minimal API 的单个端点或端点组拦截。它不是 Middleware、Controller Filter 或 `[Authorize]` 的通用替代品：全局横切逻辑仍用 Middleware，Controller 项目仍优先使用 MVC Filter 和属性，认证授权仍用 ASP.NET Core 的 Authentication / Authorization。",
    "type": "quote"
  },
  {
    "code": "// 替代 NestJS Guard\napp.MapGet(\"/users/{id}\", async (string id, IUserService service) =>\n    await service.GetByIdAsync(id))\n    .AddEndpointFilter(async (context, next) =>\n    {\n        // 类似 canActivate()\n        var userId = context.Arguments[\"id\"] as string;\n        if (userId == null)\n            return Results.BadRequest(\"Invalid ID\");\n        return await next(context);\n    });\n\n// 替代 NestJS Interceptor（修改响应）\napp.MapGet(\"/users\", async (IUserService service) =>\n    await service.GetAllAsync())\n    .AddEndpointFilter(async (context, next) =>\n    {\n        var sw = System.Diagnostics.Stopwatch.StartNew();\n        var result = await next(context);\n        sw.Stop();\n        // 可以添加响应头\n        result.Headers[\"X-Response-Time\"] = sw.ElapsedMilliseconds.ToString();\n        return result;\n    });",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 NestJS 对照**：",
    "type": "paragraph"
  },
  {
    "items": [
      "Endpoint Filter = Guard（决定是否处理请求）",
      "Endpoint Filter + Result 修改 = Interceptor（修改请求/响应）",
      "比 Middleware 更细粒度（针对特定端点，不是全局管道）"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "配置管理",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "appsettings.json",
    "type": "heading"
  },
  {
    "code": "{\n  \"Server\": {\n    \"Port\": 8080,\n    \"ApiPrefix\": \"api/v1\"\n  },\n  \"Database\": {\n    \"ConnectionString\": \"Host=localhost;Database=myapp;Username=postgres;Password=secret\"\n  },\n  \"Jwt\": {\n    \"Secret\": \"your-secret-key\",\n    \"AccessTokenExpirationMinutes\": 15,\n    \"RefreshTokenExpirationDays\": 7\n  },\n  \"Redis\": {\n    \"ConnectionString\": \"localhost:6379\"\n  }\n}",
    "language": "json",
    "title": "json 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "读取配置",
    "type": "heading"
  },
  {
    "code": "// 方式一：IOptions<T>（推荐，支持热重载）\npublic class AppSettings\n{\n    public ServerSettings Server { get; set; } = new();\n    public DatabaseSettings Database { get; set; } = new();\n    public JwtSettings Jwt { get; set; } = new();\n    public RedisSettings Redis { get; set; } = new();\n}\n\npublic class ServerSettings\n{\n    public int Port { get; set; }\n    public string ApiPrefix { get; set; } = \"api/v1\";\n}\n\n// Program.cs 中绑定\nbuilder.Services.Configure<AppSettings>(builder.Configuration);\n\n// Service 中使用\npublic class UserService\n{\n    private readonly AppSettings _settings;\n\n    public UserService(IOptions<AppSettings> options)\n    {\n        _settings = options.Value;\n    }\n}\n\n// 方式二：直接注入（简单场景）\nbuilder.Services.Configure<JwtSettings>(\n    builder.Configuration.GetSection(\"Jwt\"));\n\n// 方式三：带验证（推荐，对应 NestJS ConfigModule 的 validate 钩子）\nbuilder.Services.AddOptions<JwtSettings>()\n    .Bind(builder.Configuration.GetSection(\"Jwt\"))\n    .ValidateDataAnnotations()\n    .ValidateOnStart();  // 应用启动时验证配置\n\n// 配合 Data Annotations：\npublic class JwtSettings\n{\n    [Required]\n    public string Secret { get; set; } = string.Empty;\n\n    [Range(1, 60)]\n    public int AccessTokenExpirationMinutes { get; set; } = 15;\n\n    [Range(1, 30)]\n    public int RefreshTokenExpirationDays { get; set; } = 7;\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**关键点**：`ValidateOnStart()` 可以在应用启动时立即发现配置错误，而不是在运行时才发现。",
    "type": "quote"
  },
  {
    "level": 3,
    "text": "环境配置",
    "type": "heading"
  },
  {
    "code": "// appsettings.Development.json — 覆盖 appsettings.json\n{\n  \"Database\": {\n    \"ConnectionString\": \"Host=localhost;Database=myapp_dev\"\n  },\n  \"Logging\": {\n    \"LogLevel\": {\n      \"Default\": \"Debug\"\n    }\n  }\n}\n\n// appsettings.Production.json",
    "language": "json",
    "title": "json 示例",
    "type": "code"
  },
  {
    "text": "环境变量映射：`Jwt__Secret` → `Jwt:Secret`",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "OpenAPI / Swagger API 文档",
    "type": "heading"
  },
  {
    "text": "现代 ASP.NET Core 先区分两件事：OpenAPI 是机器可读的 API 描述，Swagger UI 是展示和调试 OpenAPI 的页面。`.NET 9+` 可以使用 `Microsoft.AspNetCore.OpenApi` 生成 OpenAPI 文档；如果需要浏览器中的 Swagger UI，仍可使用 Swashbuckle 或 Scalar 等 UI 工具。",
    "type": "quote"
  },
  {
    "level": 3,
    "text": ".NET 9+ 内置 OpenAPI",
    "type": "heading"
  },
  {
    "code": "// Program.cs\nbuilder.Services.AddOpenApi();\n\nvar app = builder.Build();\n\nif (app.Environment.IsDevelopment())\n{\n    app.MapOpenApi();\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "使用 Swashbuckle 提供 Swagger UI",
    "type": "heading"
  },
  {
    "code": "builder.Services.AddSwaggerGen(c =>\n{\n    c.SwaggerDoc(\"v1\", new OpenApiInfo\n    {\n        Title = \"My API\",\n        Version = \"v1\",\n        Description = \"基于 ASP.NET Core 的后端 API\"\n    });\n\n    // JWT 认证支持\n    c.AddSecurityDefinition(\"Bearer\", new OpenApiSecurityScheme\n    {\n        Name = \"Authorization\",\n        Type = SecuritySchemeType.ApiKey,\n        Scheme = \"Bearer\",\n        BearerFormat = \"JWT\",\n        In = ParameterLocation.Header,\n        Description = \"输入格式: Bearer {your JWT token}\"\n    });\n\n    c.AddSecurityRequirement(new OpenApiSecurityRequirement\n    {\n        {\n            new OpenApiSecurityScheme\n            {\n                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = \"Bearer\" }\n            },\n            Array.Empty<string>()\n        }\n    });\n});",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "Controller 中的 Swagger 装饰器",
    "type": "heading"
  },
  {
    "code": "/// <summary>\n/// 用户登录\n/// </summary>\n/// <param name=\"dto\">登录凭据</param>\n/// <returns>Access Token</returns>\n[HttpPost(\"login\")]\n[ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]\n[ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]\npublic async Task<ActionResult<LoginResponse>> Login([FromBody] LoginDto dto)\n{\n    var response = await _authService.LoginAsync(dto);\n    return Ok(response);\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "架构最佳实践",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "推荐文件夹结构",
    "type": "heading"
  },
  {
    "level": 4,
    "text": "方式一：分层结构（传统，适合从 NestJS 过渡）",
    "type": "heading"
  },
  {
    "code": "src/\n├── Program.cs              # 入口 + 服务注册\n├── Models/\n│   ├── Entities/           # 数据库实体（对应 TypeORM Entity）\n│   │   ├── User.cs\n│   │   ├── Role.cs\n│   │   └── Group.cs\n│   ├── Dtos/               # 数据传输对象（推荐用 record）\n│   │   ├── Requests/\n│   │   │   ├── CreateUserRequest.cs\n│   │   │   └── UpdateUserRequest.cs\n│   │   └── Responses/\n│   │       ├── UserResponse.cs\n│   │       └── LoginResponse.cs\n│   └── Interfaces/         # 接口定义\n│       ├── IUserRepository.cs\n│       └── IUserService.cs\n├── Services/               # 业务逻辑\n│   ├── UserService.cs\n│   └── AuthService.cs\n├── Controllers/            # API 端点\n│   ├── UsersController.cs\n│   └── AuthController.cs\n├── Data/                   # 数据库\n│   ├── ApplicationDbContext.cs\n│   └── Extensions/\n│       └── DbContextExtensions.cs\n├── Middleware/             # 中间件\n│   ├── ExceptionMiddleware.cs\n│   ├── ResponseMiddleware.cs\n│   └── LoggingMiddleware.cs\n└── Shared/                 # 共享基础设施\n    ├── Exceptions/\n    ├── Helpers/\n    └── Constants/",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "level": 4,
    "text": "方式二：Feature-First 结构（推荐用于复刻项目）",
    "type": "heading"
  },
  {
    "text": "与 NestJS 的 `modules/user/` 类似，更扁平、更自包含：",
    "type": "paragraph"
  },
  {
    "code": "src/\n├── Program.cs\n├── Extensions/\n│   ├── ServiceCollectionExtensions.cs   # 服务注册\n│   └── EndpointMapperExtensions.cs      # 端点注册\n├── Features/\n│   ├── Auth/\n│   │   ├── AuthEndpoints.cs             # Minimal API 路由\n│   │   ├── AuthService.cs               # 业务逻辑\n│   │   ├── AuthValidators.cs            # FluentValidation\n│   │   └── AuthMappers.cs               # 对象映射\n│   ├── Users/\n│   │   ├── UserEndpoints.cs\n│   │   ├── UserService.cs\n│   │   ├── UserValidators.cs\n│   │   └── UserMappers.cs\n│   └── Groups/\n│       ├── GroupEndpoints.cs\n│       ├── GroupsService.cs\n│       └── GroupValidators.cs\n├── Data/\n│   └── ApplicationDbContext.cs\n├── Shared/\n│   ├── Middleware/\n│   ├── Exceptions/\n│   ├── Validators/\n│   └── Common/\n└── Program.cs                           # 入口",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "text": "**推荐策略**：复刻项目时用 **方式二（Feature-First）**，更贴近你的 NestJS Modules 思路，每个 Feature 是一个独立单元，包含路由、逻辑、验证和映射。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "实战练习清单",
    "type": "heading"
  },
  {
    "id": "checklist-51",
    "items": [
      "搭建最小 ASP.NET Core 项目，对比 `main.ts` 和 `Program.cs`",
      "实现 User CRUD API，使用 FluentValidation 验证 DTO",
      "配置 JWT 认证，实现登录端点",
      "编写全局异常处理中间件",
      "实现统一响应格式中间件",
      "添加 Swagger 文档和 JWT 认证装饰",
      "按 Feature-First 结构重组项目"
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
      "`builder.Services.Add...` 和 `app.Use...` 的职责有什么不同？",
      "为什么 `UseAuthentication()` 必须在 `UseAuthorization()` 前面？",
      "Controller 和 Minimal API 各自适合什么场景？",
      "Scoped 服务为什么适合每个 HTTP 请求内共享 DbContext？",
      "OpenAPI 和 Swagger UI 是同一件事吗？"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "下一步",
    "type": "heading"
  },
  {
    "text": "完成本阶段后，进入 [三、EF Core 数据库](03-EF-Core数据库.md)。",
    "type": "paragraph"
  }
] satisfies ILessonBlock[];
