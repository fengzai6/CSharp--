# 二、ASP.NET Core 框架

> 预估时间：3 周 | 目标：能独立搭建 REST API 项目

---

## 本章你要掌握什么

学完本章后，你应该能独立创建 ASP.NET Core Web API，理解 `Program.cs` 的服务注册和请求管道，写 Controller CRUD，配置 DI、验证、中间件、授权和 OpenAPI 文档。

## 老师提示

把 ASP.NET Core 对照 NestJS 学会很快，但不要完全套 NestJS 思维。ASP.NET Core 的核心是“服务容器 + 中间件管道 + Endpoint/Controller”。先看请求从 `app.Use...` 到 `MapControllers()` 的路径，再看 Controller 和 Service。

## 学习顺序建议

1. 先读懂 `Program.cs`：哪些是 `builder.Services`，哪些是 `app.Use`。
2. 再写 Controller + Service + DTO 的最小 CRUD。
3. 然后补验证、异常处理、配置绑定和 OpenAPI。
4. 最后再比较 Controller 和 Minimal API，不要一开始混用两套风格。

## 常见误区

- 把 `AddScoped` / `AddSingleton` / `AddTransient` 随便选。
- 中间件顺序写错，例如先授权后认证。
- 把 Endpoint Filters 当成 Middleware 或 Controller Filter 的通用替代。
- 为了统一响应格式写过重的中间件，反而破坏状态码和 OpenAPI 描述。

## 项目结构与入口

### 与 NestJS 的对照

```
NestJS                              ASP.NET Core
├── apps/server/src/main.ts         ├── Program.cs（入口，极简）
├── app.module.ts                   │    builder.Services.AddXXX()
│                                   │    builder.Build()
│                                   │    app.UseXXX() 中间件链
│                                   │
├── modules/user/                   ├── Controllers/UsersController.cs
│   ├── user.controller.ts          │
│   ├── user.service.ts             ├── Services/UserService.cs
│   ├── user.module.ts              │
│   ├── dto/                        ├── Models/
│   └── entities/                   │   ├── Entities/User.cs
│                                   │   ├── Dtos/
│                                   │   │   ├── UserDto.cs
│                                   │   │   ├── CreateUserDto.cs
│                                   │   │   └── UpdateUserDto.cs
│                                   │   └── Interfaces/
│                                   │       └── IUserRepository.cs
│                                   │
├── common/guards/                  ├── Middleware/JwtAuthMiddleware.cs
├── common/interceptors/            ├── Middleware/ResponseMiddleware.cs
├── common/filters/                 ├── Middleware/ExceptionMiddleware.cs
├── common/decorators/              ├── Attributes/JwtAuthAttribute.cs
└── shared/database/                ├── Data/
│                                   │   └── ApplicationDbContext.cs
```

### 最小入口文件

```csharp
// Program.cs — 比 NestJS 的 main.ts 更简洁
var builder = WebApplication.CreateBuilder(args);

// 注册服务（替代 NestJS 的 module imports）
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<ApplicationDbContext>(
    options => options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

var app = builder.Build();

// 中间件管道
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

> 注意：`Program.cs` 是一个 **顶级语句文件**（C# 9+），不需要 `class Program` 和 `static void Main`。

---

## DI 依赖注入

### 生命周期对照

| 生命周期 | NestJS | ASP.NET Core | 行为 |
|----------|--------|--------------|------|
| Singleton | `scope: Scope.SINGLETON` | `AddSingleton<T>()` | 整个应用生命周期，全局唯一 |
| Scoped | `scope: Scope.REQUEST` | `AddScoped<T>()` | 每个 HTTP 请求内唯一 |
| Transient | 默认 | `AddTransient<T>()` | 每次注入创建新实例 |

### 使用方式

```csharp
// 注册
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<UserService>(); // 如果只有一种实现，可简化

// 使用 — 通过构造函数注入（与 NestJS 完全一致！）
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }
}
```

**关键差异**：ASP.NET Core 内置 DI 容器，**不需要 `@Injectable()` 装饰器**。任何可公开构造的类型都可以被注入。

---

## Minimal API — 轻量 API 入口方式

Minimal API 是 .NET 6 引入的轻量级 API 定义方式，不需要 Controller 类。它适合小型服务、网关、内部 API 和函数式端点组织。

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();
builder.Services.AddAuthorization();

var app = builder.Build();
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

// 创建用户 — 类似 NestJS @Post()
userGroup.MapPost("/", async (CreateUserDto dto, IAuthService auth) =>
{
    var user = await auth.CreateAsync(dto);
    return Results.Created($"/api/users/{user.Id}", user);
});

app.Run();
```

### Minimal API vs Controller 对照

| 维度 | Minimal API | Controller |
|------|------------|------------|
| 代码量 | 少 60-80% | 传统模式 |
| 学习曲线 | 低（类似 TS 函数） | 中等 |
| 依赖注入 | 参数即 DI | 构造函数注入 |
| 测试 | 直接测试端点函数 | 需模拟 ControllerBase |
| NestJS 对照 | 类似 `@Controller` + `@Get` 函数 | 类似 `@Controller` 类 |

**推荐策略**：先用 Controller 快速上手（与你的 NestJS 习惯匹配），完成一个稳定 CRUD 后再学习 Minimal API。不要一开始同时混用两套风格。

---

## Controller 与路由

### 基础对照

```csharp
// NestJS
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}

// ASP.NET Core
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login(LoginDto dto)
    {
        return Ok(await _authService.LoginAsync(dto));
    }
}
```

### HTTP 方法映射

| HTTP | NestJS 装饰器 | ASP.NET Core 属性 |
|------|--------------|-------------------|
| GET | `@Get()` | `[HttpGet]` |
| POST | `@Post()` | `[HttpPost]` |
| PUT | `@Put()` | `[HttpPut]` |
| PATCH | `@Patch()` | `[HttpPatch]` |
| DELETE | `@Delete()` | `[HttpDelete]` |

### 路由参数

```csharp
// NestJS
@Get(':id')
findOne(@Param('id') id: string) { ... }

// ASP.NET Core
[HttpGet("{id}")]
public ActionResult Get(string id) { ... }
```

### 模型绑定

```csharp
// 自动绑定（与 NestJS @Body, @Param, @Query 类似）
public class UsersController : ControllerBase
{
    // @Body → 方法参数（从 Request Body 绑定）
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var user = await _userService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    // @Param → URL 路径参数
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id) { ... }

    // @Query → 查询参数
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        return Ok(await _userService.GetAllAsync(page, pageSize, search));
    }

    // @Headers
    [HttpGet("profile")]
    public IActionResult GetProfile([FromHeader] string authorization) { ... }
}
```

---

## 数据验证

### 方式一：Data Annotations（类似 NestJS 的 class-validator）

```csharp
public class CreateUserDto
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
}
```

**内置验证属性**：`[Required]`, `[StringLength]`, `[EmailAddress]`, `[Phone]`, `[Range]`, `[RegularExpression]`, `[Url]`, `[CreditCard]`

### 方式二：FluentValidation（推荐，对应 class-validator）

```bash
# 安装
dotnet add package FluentValidation
dotnet add package FluentValidation.DependencyInjectionExtensions
```

```csharp
using FluentValidation;

public class CreateUserDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// 验证器 — 链式 API，比装饰器更灵活
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
            .Matches(@"\d").WithMessage("密码必须包含数字");

        RuleFor(x => x)
            .Must(x => x.Password != x.Username)
            .WithMessage("密码不能与用户名相同");
    }

    private bool BeUniqueUsername(string username)
    {
        // 检查数据库是否已存在
        return !_userRepository.UsernameExists(username);
    }

    private bool BeUniqueEmail(string email)
    {
        return !_userRepository.EmailExists(email);
    }
}
```

**注册验证器**（全局自动校验）：

```csharp
// Program.cs
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// 或者在 Startup.cs 中全局注册 ValidationFilter
builder.Services.AddControllers(options =>
{
    options.ModelBindingMessageProvider.SetValueIsInvalidAccessor(
        x => $"{x.ModelName} 字段无效");
    options.ModelBindingMessageProvider.SetValueIsRequiredAccessor(
        x => $"{x.ModelName} 字段不能为空");
});
```

**与 class-validator 对比**：

| | class-validator | FluentValidation |
|---|---|---|
| 配置方式 | 装饰器 | 独立类 |
| 跨字段验证 | 有限 | ✅ 完整支持 |
| 异步验证 | ✅ | ✅ |
| 数据库存在性检查 | 手动 | 内置支持 |
| 消息自定义 | 简单 | 强大 |
| 性能 | 反射 | 编译期表达式 |

---

## 中间件管道

### 与 NestJS 的对照

```
NestJS 中间件              ASP.NET Core 中间件
─────────────────         ─────────────────
app.use(middleware)        app.Use(Middleware)
```

```csharp
// 中间件管道 — 按注册顺序执行
app.UseHttpsRedirection();       // 1. HTTPS 重定向
app.UseStaticFiles();            // 2. 静态文件
app.UseSwagger();                // 3. Swagger UI
app.UseAuthentication();         // 4. 认证（修改 HttpContext.User）
app.UseAuthorization();          // 5. 授权（检查 [Authorize]）
app.UseMiddleware<LoggingMiddleware>();  // 6. 自定义日志中间件
app.MapControllers();            // 7. 路由到 Controller
```

### 自定义中间件

```csharp
// 基于委托的中间件（轻量级，推荐）
public class RequestTimeMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimeMiddleware> _logger;

    public RequestTimeMiddleware(RequestDelegate next, ILogger<RequestTimeMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        await _next(context); // 调用下一个中间件
        sw.Stop();
        _logger.LogInformation("Request {Method} {Path} took {Ms}ms",
            context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds);
    }
}

// 注册
app.UseMiddleware<RequestTimeMiddleware>();
```

### 全局异常处理中间件

```csharp
// 对应 NestJS 的 GlobalExceptionFilter
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            UnauthorizedAccessException => (401, "未授权"),
            KeyNotFoundException => (404, "资源未找到"),
            ArgumentException => (400, $"参数错误: {exception.Message}"),
            _ => (500, "服务器内部错误")
        };

        context.Response.StatusCode = statusCode;

        return context.Response.WriteAsJsonAsync(new
        {
            code = statusCode,
            message,
            timestamp = DateTime.UtcNow.ToString("o")
        });
    }
}
```

---

## Endpoint Filters — Minimal API 的端点级拦截

> Endpoint Filters 适合 Minimal API 的单个端点或端点组拦截。它不是 Middleware、Controller Filter 或 `[Authorize]` 的通用替代品：全局横切逻辑仍用 Middleware，Controller 项目仍优先使用 MVC Filter 和属性，认证授权仍用 ASP.NET Core 的 Authentication / Authorization。

```csharp
// 替代 NestJS Guard
app.MapGet("/users/{id}", async (string id, IUserService service) =>
    await service.GetByIdAsync(id))
    .AddEndpointFilter(async (context, next) =>
    {
        // 类似 canActivate()
        var userId = context.Arguments["id"] as string;
        if (userId == null)
            return Results.BadRequest("Invalid ID");
        return await next(context);
    });

// 替代 NestJS Interceptor（修改响应）
app.MapGet("/users", async (IUserService service) =>
    await service.GetAllAsync())
    .AddEndpointFilter(async (context, next) =>
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = await next(context);
        sw.Stop();
        // 可以添加响应头
        result.Headers["X-Response-Time"] = sw.ElapsedMilliseconds.ToString();
        return result;
    });
```

**与 NestJS 对照**：
- Endpoint Filter = Guard（决定是否处理请求）
- Endpoint Filter + Result 修改 = Interceptor（修改请求/响应）
- 比 Middleware 更细粒度（针对特定端点，不是全局管道）

---

## 授权（Authorization）

### 与 NestJS Guard 的对照

```csharp
// NestJS
@UseGuards(JwtAuthGuard)
@RolesGuard('admin')
@Post('delete')
async delete(@RequestUser() user: User, @Param('id') id: string) { ... }

// ASP.NET Core
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[Authorize(Policy = "AdminOnly")]
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(string id) { ... }
```

### 策略配置

```csharp
// Program.cs
builder.Services.AddAuthorization(options =>
{
    // 基础策略
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    options.AddPolicy("SuperAdminOnly", policy =>
        policy.RequireRole("SuperAdmin"));

    // 基于声明的策略
    options.AddPolicy("CanDeleteUser", policy =>
        policy.RequireClaim("Permission", "user:delete"));

    // 基于资源的策略
    options.AddPolicy("OwnerOnly", policy =>
        policy.AddRequirements(new GroupOwnerRequirement()));
});
```

### 自定义授权 Handler

```csharp
// 复杂授权逻辑 — 对应 NestJS 自定义 Guard
public class GroupOwnerRequirement : IAuthorizationRequirement { }

public class GroupOwnerHandler : AuthorizationHandler<GroupOwnerRequirement>
{
    private readonly IGroupsService _groupsService;

    public GroupOwnerHandler(IGroupsService groupsService)
    {
        _groupsService = groupsService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        GroupOwnerRequirement requirement)
    {
        if (context.Resource is HttpContext httpContext)
        {
            var groupId = httpContext.Request.RouteValues["id"]?.ToString();
            var userId = httpContext.User.FindFirst("sub")?.Value;

            if (groupId != null && userId != null)
            {
                var isOwner = await _groupsService.IsGroupOwnerAsync(groupId, userId);
                if (isOwner)
                {
                    context.Succeed(requirement);
                }
            }
        }
    }
}

// 注册
builder.Services.AddScoped<IAuthorizationHandler, GroupOwnerHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("GroupOwner", policy =>
        policy.AddRequirements(new GroupOwnerRequirement()));
});

// 使用
[Authorize(Policy = "GroupOwner")]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteGroup(string id) { ... }
```

---

## 统一响应格式

### 对应 NestJS 的 PostResponseInterceptor

```csharp
// 中间件实现
public class ResponseMiddleware
{
    private readonly RequestDelegate _next;

    public ResponseMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 保存原始响应 body
        var originalBody = context.Response.Body;
        using var newBody = new MemoryStream();
        context.Response.Body = newBody;

        try
        {
            await _next(context);
        }
        catch
        {
            // 异常已由 ExceptionMiddleware 处理
            throw;
        }
        finally
        {
            // 修改响应格式
            newBody.Seek(0, SeekOrigin.Begin);
            var responseBody = await new StreamReader(newBody).ReadToEndAsync();
            newBody.Seek(0, SeekOrigin.Begin);

            // 包装统一响应
            var wrappedResponse = new
            {
                success = context.Response.StatusCode is >= 200 and < 300,
                code = context.Response.StatusCode,
                data = context.Response.StatusCode is 204 ? null : JsonConvert.DeserializeObject(responseBody),
                message = string.Empty,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            context.Response.ContentType = "application/json";
            context.Response.ContentLength = null;
            await context.Response.WriteAsJsonAsync(wrappedResponse);

            await newBody.CopyTo(originalBody);
        }
    }
}
```

---

## 配置管理

### appsettings.json

```json
{
  "Server": {
    "Port": 8080,
    "ApiPrefix": "api/v1"
  },
  "Database": {
    "ConnectionString": "Host=localhost;Database=myapp;Username=postgres;Password=secret"
  },
  "Jwt": {
    "Secret": "your-secret-key",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  }
}
```

### 读取配置

```csharp
// 方式一：IOptions<T>（推荐，支持热重载）
public class AppSettings
{
    public ServerSettings Server { get; set; } = new();
    public DatabaseSettings Database { get; set; } = new();
    public JwtSettings Jwt { get; set; } = new();
    public RedisSettings Redis { get; set; } = new();
}

public class ServerSettings
{
    public int Port { get; set; }
    public string ApiPrefix { get; set; } = "api/v1";
}

// Program.cs 中绑定
builder.Services.Configure<AppSettings>(builder.Configuration);

// Service 中使用
public class UserService
{
    private readonly AppSettings _settings;

    public UserService(IOptions<AppSettings> options)
    {
        _settings = options.Value;
    }
}

// 方式二：直接注入（简单场景）
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

// 方式三：带验证（推荐，对应 NestJS ConfigModule 的 validate 钩子）
builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .ValidateDataAnnotations()
    .ValidateOnStart();  // 应用启动时验证配置

// 配合 Data Annotations：
public class JwtSettings
{
    [Required]
    public string Secret { get; set; } = string.Empty;

    [Range(1, 60)]
    public int AccessTokenExpirationMinutes { get; set; } = 15;

    [Range(1, 30)]
    public int RefreshTokenExpirationDays { get; set; } = 7;
}
```

> **关键点**：`ValidateOnStart()` 可以在应用启动时立即发现配置错误，而不是在运行时才发现。

### 环境配置

```json
// appsettings.Development.json — 覆盖 appsettings.json
{
  "Database": {
    "ConnectionString": "Host=localhost;Database=myapp_dev"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Debug"
    }
  }
}

// appsettings.Production.json
```

环境变量映射：`Jwt__Secret` → `Jwt:Secret`

---

## OpenAPI / Swagger API 文档

> 现代 ASP.NET Core 先区分两件事：OpenAPI 是机器可读的 API 描述，Swagger UI 是展示和调试 OpenAPI 的页面。`.NET 9+` 可以使用 `Microsoft.AspNetCore.OpenApi` 生成 OpenAPI 文档；如果需要浏览器中的 Swagger UI，仍可使用 Swashbuckle 或 Scalar 等 UI 工具。

### .NET 9+ 内置 OpenAPI

```csharp
// Program.cs
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
```

### 使用 Swashbuckle 提供 Swagger UI

```csharp
builder.Services.AddSwaggerGen(c =>
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

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});
```

### Controller 中的 Swagger 装饰器

```csharp
/// <summary>
/// 用户登录
/// </summary>
/// <param name="dto">登录凭据</param>
/// <returns>Access Token</returns>
[HttpPost("login")]
[ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginDto dto)
{
    var response = await _authService.LoginAsync(dto);
    return Ok(response);
}
```

---

## 架构最佳实践

### 推荐文件夹结构

#### 方式一：分层结构（传统，适合从 NestJS 过渡）

```
src/
├── Program.cs              # 入口 + 服务注册
├── Models/
│   ├── Entities/           # 数据库实体（对应 TypeORM Entity）
│   │   ├── User.cs
│   │   ├── Role.cs
│   │   └── Group.cs
│   ├── Dtos/               # 数据传输对象（推荐用 record）
│   │   ├── Requests/
│   │   │   ├── CreateUserRequest.cs
│   │   │   └── UpdateUserRequest.cs
│   │   └── Responses/
│   │       ├── UserResponse.cs
│   │       └── LoginResponse.cs
│   └── Interfaces/         # 接口定义
│       ├── IUserRepository.cs
│       └── IUserService.cs
├── Services/               # 业务逻辑
│   ├── UserService.cs
│   └── AuthService.cs
├── Controllers/            # API 端点
│   ├── UsersController.cs
│   └── AuthController.cs
├── Data/                   # 数据库
│   ├── ApplicationDbContext.cs
│   └── Extensions/
│       └── DbContextExtensions.cs
├── Middleware/             # 中间件
│   ├── ExceptionMiddleware.cs
│   ├── ResponseMiddleware.cs
│   └── LoggingMiddleware.cs
└── Shared/                 # 共享基础设施
    ├── Exceptions/
    ├── Helpers/
    └── Constants/
```

#### 方式二：Feature-First 结构（推荐用于复刻项目）

与 NestJS 的 `modules/user/` 类似，更扁平、更自包含：

```
src/
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
│   ├── Users/
│   │   ├── UserEndpoints.cs
│   │   ├── UserService.cs
│   │   ├── UserValidators.cs
│   │   └── UserMappers.cs
│   └── Groups/
│       ├── GroupEndpoints.cs
│       ├── GroupsService.cs
│       └── GroupValidators.cs
├── Data/
│   └── ApplicationDbContext.cs
├── Shared/
│   ├── Middleware/
│   ├── Exceptions/
│   ├── Validators/
│   └── Common/
└── Program.cs                           # 入口
```

**推荐策略**：复刻项目时用 **方式二（Feature-First）**，更贴近你的 NestJS Modules 思路，每个 Feature 是一个独立单元，包含路由、逻辑、验证和映射。

---

## 实战练习清单

- [ ] 搭建最小 ASP.NET Core 项目，对比 `main.ts` 和 `Program.cs`
- [ ] 实现 User CRUD API，使用 FluentValidation 验证 DTO
- [ ] 配置 JWT 认证，实现登录端点
- [ ] 编写全局异常处理中间件
- [ ] 实现统一响应格式中间件
- [ ] 添加 Swagger 文档和 JWT 认证装饰
- [ ] 按 Feature-First 结构重组项目

## 阶段验收问题

- `builder.Services.Add...` 和 `app.Use...` 的职责有什么不同？
- 为什么 `UseAuthentication()` 必须在 `UseAuthorization()` 前面？
- Controller 和 Minimal API 各自适合什么场景？
- Scoped 服务为什么适合每个 HTTP 请求内共享 DbContext？
- OpenAPI 和 Swagger UI 是同一件事吗？

## 下一步

完成本阶段后，进入 [三、EF Core 数据库](03-EF-Core数据库.md)。
