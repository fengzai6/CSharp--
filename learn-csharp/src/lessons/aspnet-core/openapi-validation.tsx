import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const AspnetOpenApiValidationLesson = () => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能用两种方式做模型验证（Data Annotations 与
        FluentValidation），用 Minimal API 写轻量端点，理解 Endpoint Filters
        的适用边界，配置 OpenAPI 文档和 Swagger UI，并按合理的文件夹结构组织项目。
      </p>

      <h3>数据验证</h3>
      <h4>方式一：Data Annotations</h4>
      <p>类似 NestJS 的 class-validator，用属性标注在 DTO 字段上：</p>

      <LessonCode
        code={`public class CreateUserDto
{
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [Phone]
    public string? Phone { get; set; }
}`}
        language="csharp"
        title="Data Annotations"
      />
      <p>
        内置验证属性：<code>[Required]</code>、<code>[StringLength]</code>、{" "}
        <code>[EmailAddress]</code>、<code>[Phone]</code>、<code>[Range]</code>、{" "}
        <code>[RegularExpression]</code>、<code>[Url]</code>、{" "}
        <code>[CreditCard]</code>。
      </p>

      <h4>方式二：FluentValidation（推荐）</h4>
      <p>
        对应 class-validator，但用独立类 + 链式 API，比装饰器更灵活，支持跨字段验证：
      </p>

      <LessonCode
        code={`dotnet add package FluentValidation
dotnet add package FluentValidation.DependencyInjectionExtensions`}
        language="bash"
        title="安装 FluentValidation"
      />

      <LessonCode
        code={`using FluentValidation;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(50)
            .WithMessage("用户名长度应在 3-50 之间")
            .Must(BeUniqueUsername)
            .WithMessage("用户名已被注册");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .Must(BeUniqueEmail)
            .WithMessage("邮箱已被注册");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("密码必须包含大写字母")
            .Matches(@"[a-z]").WithMessage("密码必须包含小写字母")
            .Matches(@"\\d").WithMessage("密码必须包含数字");

        // 跨字段验证
        RuleFor(x => x)
            .Must(x => x.Password != x.Username)
            .WithMessage("密码不能与用户名相同");
    }

    private bool BeUniqueUsername(string username) =>
        !_userRepository.UsernameExists(username);

    private bool BeUniqueEmail(string email) =>
        !_userRepository.EmailExists(email);
}`}
        language="csharp"
        title="FluentValidation 验证器"
      />

      <p>注册验证器（全局自动校验）：</p>

      <LessonCode
        code={`builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();`}
        language="csharp"
        title="注册验证器"
      />

      <h4>class-validator 与 FluentValidation 对比</h4>
      <LessonTable
        headers={["维度", "class-validator", "FluentValidation"]}
        rows={[
          ["配置方式", "装饰器", "独立类"],
          ["跨字段验证", "有限", "完整支持"],
          ["异步验证", "支持", "支持"],
          ["数据库存在性检查", "手动", "内置支持"],
          ["消息自定义", "简单", "强大"],
          ["性能", "反射", "编译期表达式"],
        ]}
      />

      <h3>Minimal API — 轻量 API 入口方式</h3>
      <p>
        .NET 6 引入的轻量级 API 定义方式，不需要 Controller 类，适合小型服务、网关、内部 API 和函数式端点组织：
      </p>

      <LessonCode
        code={`var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// 路由分组（类似 NestJS 的 GlobalPrefix + Controller prefix）
var authGroup = app.MapGroup("/api/auth");
var userGroup = app.MapGroup("/api/users").RequireAuthorization();

// 登录 — 类似 NestJS @Post('login')
authGroup.MapPost("/login", async (LoginDto dto, IAuthService auth) =>
{
    var result = await auth.LoginAsync(dto);
    return Results.Ok(result);
});

// 获取用户 — 类似 NestJS @Get(':id')
userGroup.MapGet("/{id}", async (string id, IUserService service) =>
{
    var user = await service.GetByIdAsync(id);
    return user is null ? Results.NotFound() : Results.Ok(user);
});

app.Run();`}
        language="csharp"
        title="Minimal API"
      />

      <h4>Minimal API vs Controller 对照</h4>
      <LessonTable
        headers={["维度", "Minimal API", "Controller"]}
        rows={[
          ["代码量", "少 60-80%", "传统模式"],
          ["学习曲线", "低（类似 TS 函数）", "中等"],
          ["依赖注入", "参数即 DI", "构造函数注入"],
          ["测试", "直接测试端点函数", "需模拟 ControllerBase"],
          ["NestJS 对照", "类似 @Controller + @Get 函数", "类似 @Controller 类"],
        ]}
      />

      <LessonQuote>
        推荐策略：先用 Controller 快速上手（与你的 NestJS 习惯匹配），完成一个稳定 CRUD 后再学习 Minimal API。不要一开始同时混用两套风格。
      </LessonQuote>

      <h3>Endpoint Filters — Minimal API 的端点级拦截</h3>
      <p>
        Endpoint Filters 适合 Minimal API 的单个端点或端点组拦截。它<strong>不是</strong>{" "}
        Middleware、Controller Filter 或 <code>[Authorize]</code> 的通用替代品：
      </p>

      <LessonCode
        code={`// 替代 NestJS Guard
app.MapGet("/users/{id}", async (string id, IUserService service) =>
    await service.GetByIdAsync(id))
    .AddEndpointFilter(async (context, next) =>
    {
        // 类似 canActivate()
        var userId = context.Arguments["id"] as string;
        if (userId == null)
            return Results.BadRequest("Invalid ID");
        return await next(context);
    });`}
        language="csharp"
        title="Endpoint Filter"
      />

      <ul>
        <li>Endpoint Filter = Guard（决定是否处理请求）</li>
        <li>Endpoint Filter + Result 修改 = Interceptor（修改请求/响应）</li>
        <li>比 Middleware 更细粒度（针对特定端点，不是全局管道）</li>
      </ul>

      <LessonQuote>
        常见误区：把 Endpoint Filters 当成 Middleware 或 Controller Filter
        的通用替代。全局横切逻辑仍用 Middleware，Controller 项目仍优先用 MVC Filter
        和属性，认证授权仍用 ASP.NET Core 的 Authentication / Authorization。
      </LessonQuote>

      <h3>OpenAPI / Swagger API 文档</h3>
      <LessonQuote>
        先区分两件事：OpenAPI 是<strong>机器可读的 API 描述</strong>，Swagger UI
        是<strong>展示和调试 OpenAPI 的页面</strong>。.NET 9+ 可以用{" "}
        <code>Microsoft.AspNetCore.OpenApi</code> 生成 OpenAPI 文档；需要浏览器中的
        Swagger UI 时，仍可用 Swashbuckle 或 Scalar 等 UI 工具。
      </LessonQuote>

      <h4>.NET 9+ 内置 OpenAPI</h4>
      <LessonCode
        code={`builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}`}
        language="csharp"
        title="内置 OpenAPI"
      />

      <h4>用 Swashbuckle 提供 Swagger UI</h4>
      <LessonCode
        code={`builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "My API",
        Version = "v1",
        Description = "基于 ASP.NET Core 的后端 API"
    });

    // JWT 认证支持
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "输入格式: Bearer {your JWT token}"
    });
});`}
        language="csharp"
        title="SwaggerGen 配置"
      />

      <h4>Controller 中的 Swagger 装饰</h4>
      <p>
        用 XML 注释和 <code>[ProducesResponseType]</code>{" "}
        声明返回类型与状态码，让文档更完整：
      </p>

      <LessonCode
        code={`/// <summary>
/// 用户登录
/// </summary>
[HttpPost("login")]
[ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginDto dto)
{
    var response = await _authService.LoginAsync(dto);
    return Ok(response);
}`}
        language="csharp"
        title="ProducesResponseType"
      />

      <h3>架构最佳实践</h3>
      <p>推荐两种文件夹结构：</p>

      <h4>方式一：分层结构（传统，适合从 NestJS 过渡）</h4>
      <LessonCode
        code={`src/
├── Program.cs              # 入口 + 服务注册
├── Models/
│   ├── Entities/           # 数据库实体（对应 TypeORM Entity）
│   ├── Dtos/               # 数据传输对象（推荐用 record）
│   │   ├── Requests/
│   │   └── Responses/
│   └── Interfaces/         # 接口定义
├── Services/               # 业务逻辑
├── Controllers/            # API 端点
├── Data/                   # 数据库 DbContext
├── Middleware/             # 中间件
└── Shared/                 # 共享基础设施`}
        language="text"
        title="分层结构"
      />

      <h4>方式二：Feature-First 结构（推荐用于复刻项目）</h4>
      <p>
        与 NestJS 的 <code>modules/user/</code> 类似，更扁平、更自包含：
      </p>

      <LessonCode
        code={`src/
├── Program.cs
├── Extensions/
│   ├── ServiceCollectionExtensions.cs   # 服务注册
│   └── EndpointMapperExtensions.cs      # 端点注册
├── Features/
│   ├── Auth/
│   │   ├── AuthEndpoints.cs             # Minimal API 路由
│   │   ├── AuthService.cs               # 业务逻辑
│   │   ├── AuthValidators.cs            # FluentValidation
│   │   └── AuthMappers.cs               # 对象映射
│   └── Users/
│       ├── UserEndpoints.cs
│       ├── UserService.cs
│       └── UserValidators.cs
├── Data/
└── Shared/`}
        language="text"
        title="Feature-First 结构"
      />

      <TeacherTask title="老师提示">
        <p>
          复刻项目时用<strong>方式二（Feature-First）</strong>，更贴近你的 NestJS
          Modules 思路：每个 Feature 是一个独立单元，包含路由、逻辑、验证和映射。DTO
          推荐用 <code>record</code>。
        </p>
      </TeacherTask>

      <h3>阶段验收问题</h3>
      <ul>
        <li>Controller 和 Minimal API 各自适合什么场景？</li>
        <li>OpenAPI 和 Swagger UI 是同一件事吗？</li>
        <li>FluentValidation 相比 Data Annotations 在跨字段验证上有什么优势？</li>
      </ul>

      <LessonStep
        title="实战任务：OpenAPI 文档与验证完整配置"
        steps={[
          {
            title: "为 CreateUserDto 编写 FluentValidation 验证器并全局注册",
            content: (
              <div>
                <p>安装 FluentValidation 包，创建验证器类，并在 Program.cs 中注册。</p>
              </div>
            ),
            code: `// 1. 安装包
dotnet add package FluentValidation
dotnet add package FluentValidation.DependencyInjectionExtensions

// 2. 创建验证器 Features/Users/UserValidators.cs
using FluentValidation;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("用户名不能为空")
            .MinimumLength(3).WithMessage("用户名至少3个字符")
            .MaximumLength(50).WithMessage("用户名最多50个字符");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("邮箱不能为空")
            .EmailAddress().WithMessage("邮箱格式不正确");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("密码不能为空")
            .MinimumLength(8).WithMessage("密码至少8个字符")
            .Matches(@"[A-Z]").WithMessage("密码必须包含大写字母")
            .Matches(@"[a-z]").WithMessage("密码必须包含小写字母")
            .Matches(@"\\d").WithMessage("密码必须包含数字");
    }
}

// 3. 在 Program.cs 中注册
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();`,
            codeLanguage: "csharp",
            codeTitle: "FluentValidation 验证器",
            checkpoints: [
              "FluentValidation 包已安装",
              "CreateUserDtoValidator 类继承 AbstractValidator<CreateUserDto>",
              "验证规则包含：非空、长度、格式检查",
              "Program.cs 中已调用 AddFluentValidationAutoValidation()",
              "Program.cs 中已调用 AddValidatorsFromAssemblyContaining<Program>()",
            ],
            reference: `验证器会自动应用到所有使用 CreateUserDto 的端点。如果验证失败，框架会自动返回 400 Bad Request 和详细的错误信息。`,
          },
          {
            title: "对比 Data Annotations 与 FluentValidation 的跨字段验证",
            content: (
              <div>
                <p>实现一个跨字段验证场景：确保密码不能与用户名相同。</p>
              </div>
            ),
            code: `// Data Annotations 方式 — 需要自定义验证属性
public class CreateUserDto : IValidatableObject
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    // 跨字段验证 — 需要实现接口方法
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (Password == Username)
        {
            yield return new ValidationResult(
                "密码不能与用户名相同",
                new[] { nameof(Password) }
            );
        }
    }
}

// FluentValidation 方式 — 更简洁直观
public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        // ... 其他规则

        // 跨字段验证 — 直接在验证器中声明
        RuleFor(x => x)
            .Must(x => x.Password != x.Username)
            .WithMessage("密码不能与用户名相同");

        // 或者使用条件规则
        RuleFor(x => x.Password)
            .Must((dto, password) => password != dto.Username)
            .WithMessage("密码不能与用户名相同");
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "跨字段验证对比",
            checkpoints: [
              "理解 Data Annotations 需要实现 IValidatableObject 接口",
              "理解 FluentValidation 可以直接在验证器中访问整个对象",
              "验证规则已添加到 CreateUserDtoValidator",
              "测试：提交 Username 和 Password 相同的数据，应返回 400 错误",
            ],
            reference: `FluentValidation 的优势：1) 不污染 DTO 类；2) 验证逻辑集中管理；3) 支持依赖注入（可以注入 DbContext 做数据库唯一性检查）；4) 更强的表达力（条件验证、自定义规则等）。`,
          },
          {
            title: "用 Minimal API + MapGroup 编写登录和获取用户端点",
            content: (
              <div>
                <p>创建一个 Auth Feature，用 Minimal API 实现登录端点和用户查询端点。</p>
              </div>
            ),
            code: `// Features/Auth/AuthEndpoints.cs
public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Authentication");

        // 登录端点
        group.MapPost("/login", async (
            LoginDto dto,
            IAuthService authService) =>
        {
            var result = await authService.LoginAsync(dto);
            return result != null
                ? Results.Ok(result)
                : Results.Unauthorized();
        })
        .WithName("Login")
        .WithOpenApi();

        return group;
    }
}

// Features/Users/UserEndpoints.cs
public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization(); // 整个组需要认证

        // 获取单个用户
        group.MapGet("/{id}", async (
            string id,
            IUserService userService) =>
        {
            var user = await userService.GetByIdAsync(id);
            return user != null
                ? Results.Ok(user)
                : Results.NotFound();
        })
        .WithName("GetUserById")
        .WithOpenApi();

        // 获取用户列表
        group.MapGet("/", async (
            [FromQuery] int page,
            [FromQuery] int pageSize,
            [FromQuery] string? search,
            IUserService userService) =>
        {
            var users = await userService.GetAllAsync(page, pageSize, search);
            return Results.Ok(users);
        })
        .WithName("GetUsers")
        .WithOpenApi();

        return group;
    }
}

// Program.cs 中注册
app.MapAuthEndpoints();
app.MapUserEndpoints();`,
            codeLanguage: "csharp",
            codeTitle: "Minimal API 端点",
            checkpoints: [
              "创建了 AuthEndpoints 和 UserEndpoints 静态类",
              "使用 MapGroup 对路由进行分组",
              "登录端点路径为 /api/auth/login",
              "用户端点路径为 /api/users 和 /api/users/{id}",
              "用户端点组使用了 RequireAuthorization()",
              "Program.cs 中已调用 MapAuthEndpoints() 和 MapUserEndpoints()",
            ],
            reference: `Minimal API 的优势：代码更简洁，依赖注入直接在参数中声明。MapGroup 可以为一组端点设置公共前缀、认证要求、标签等。WithOpenApi() 确保端点出现在 OpenAPI 文档中。`,
          },
          {
            title: "配置 Swagger 并添加 JWT Bearer 认证支持",
            content: (
              <div>
                <p>配置 Swashbuckle.AspNetCore，让 Swagger UI 支持 JWT 认证测试。</p>
              </div>
            ),
            code: `// 1. 安装包
dotnet add package Swashbuckle.AspNetCore

// 2. 在 Program.cs 中配置
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "学习项目 API",
        Version = "v1",
        Description = "基于 ASP.NET Core 的后端 API 文档"
    });

    // 配置 JWT Bearer 认证
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "请输入 JWT Token，格式：Bearer {your token}"
    });

    // 全局应用安全要求
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// 3. 启用 Swagger 中间件
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1");
    });
}

app.UseAuthentication();
app.UseAuthorization();`,
            codeLanguage: "csharp",
            codeTitle: "Swagger + JWT 配置",
            checkpoints: [
              "Swashbuckle.AspNetCore 包已安装",
              "SwaggerGen 已配置 OpenApiInfo（标题、版本、描述）",
              "已添加 Bearer 安全定义",
              "已添加全局安全要求",
              "访问 /swagger 可以看到 Swagger UI",
              "Swagger UI 右上角出现 Authorize 按钮",
              "点击 Authorize 可以输入 Bearer token",
            ],
            reference: `配置完成后，在 Swagger UI 中点击 Authorize 按钮，输入 "Bearer {token}"（注意有空格），所有需要认证的端点都会自动带上这个 token。这样可以方便地测试受保护的 API。`,
          },
          {
            title: "按 Feature-First 结构重组项目",
            content: (
              <div>
                <p>将项目从传统分层结构改为 Feature-First 结构，每个功能模块独立。</p>
              </div>
            ),
            code: `// 目标结构
src/
├── Program.cs
├── Extensions/
│   └── ServiceCollectionExtensions.cs   # 服务注册扩展
├── Features/
│   ├── Auth/
│   │   ├── AuthEndpoints.cs             # API 路由
│   │   ├── AuthService.cs               # 业务逻辑
│   │   ├── IAuthService.cs              # 接口
│   │   ├── Dtos/
│   │   │   ├── LoginDto.cs
│   │   │   └── LoginResponse.cs
│   │   └── Validators/
│   │       └── LoginDtoValidator.cs     # FluentValidation
│   └── Users/
│       ├── UserEndpoints.cs
│       ├── UserService.cs
│       ├── IUserService.cs
│       ├── Dtos/
│       │   ├── CreateUserDto.cs
│       │   └── UserDto.cs
│       └── Validators/
│           └── CreateUserDtoValidator.cs
├── Data/
│   ├── ApplicationDbContext.cs
│   └── Entities/
│       └── User.cs
└── Shared/
    └── Middleware/

// Extensions/ServiceCollectionExtensions.cs
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services)
    {
        // 注册所有 Feature 的服务
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();

        return services;
    }
}

// Program.cs 简化为
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddApplicationServices(); // 一行搞定所有服务注册
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

var app = builder.Build();

// 注册所有端点
app.MapAuthEndpoints();
app.MapUserEndpoints();

app.Run();`,
            codeLanguage: "csharp",
            codeTitle: "Feature-First 结构",
            checkpoints: [
              "创建了 Features/ 文件夹",
              "Auth 和 Users 功能模块各自独立",
              "每个 Feature 包含：Endpoints、Service、Dtos、Validators",
              "创建了 Extensions/ServiceCollectionExtensions.cs",
              "Program.cs 变得更简洁",
              "项目能正常编译和运行",
            ],
            reference: `Feature-First 的优势：1) 功能内聚，相关代码在一起；2) 易于查找和维护；3) 便于团队协作（按功能分工）；4) 便于删除功能（删除整个文件夹）。这种结构与 NestJS 的 Module 组织方式非常相似。`,
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 完成！你已经掌握了 ASP.NET Core 的验证、Minimal API、OpenAPI 文档和项目结构组织。
            </p>
            <p>
              <strong>💡 核心要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                FluentValidation 比 Data Annotations 更灵活，支持跨字段验证和依赖注入
              </li>
              <li>
                Minimal API 适合轻量级端点，MapGroup 可以组织路由和应用公共配置
              </li>
              <li>
                Swagger 配置 Bearer 认证后，可以在 UI 中方便地测试受保护的端点
              </li>
              <li>
                Feature-First 结构让功能内聚，类似 NestJS 的 Module 组织方式
              </li>
              <li>
                验证器、端点、服务都可以通过扩展方法集中注册，保持 Program.cs 简洁
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 下一步：</strong>学习 EF Core，为这些端点添加真实的数据库操作。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
