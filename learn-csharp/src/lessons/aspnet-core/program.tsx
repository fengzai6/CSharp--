import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const AspnetProgramLesson = () => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能读懂 <code>Program.cs</code>：分清哪些是{" "}
        <code>builder.Services.AddXXX()</code>（服务注册），哪些是{" "}
        <code>app.UseXXX()</code>（中间件管道），并理解请求从{" "}
        <code>app.Use...</code> 到 <code>MapControllers()</code>{" "}
        的执行路径，能写自定义中间件、全局异常处理和配置绑定。
      </p>

      <TeacherTask title="老师提示">
        <p>
          把 ASP.NET Core 对照 NestJS 学会很快，但不要完全套 NestJS 思维。它的核心是
          <strong>服务容器 + 中间件管道 + Endpoint/Controller</strong>
          。先看请求从 <code>app.Use...</code> 到 <code>MapControllers()</code>{" "}
          的路径，再看 Controller 和 Service。学习顺序建议：先读懂{" "}
          <code>Program.cs</code>，再写 Controller + Service + DTO 的最小 CRUD，然后补验证、异常处理、配置绑定和 OpenAPI。
        </p>
      </TeacherTask>

      <h3>项目结构：与 NestJS 的对照</h3>
      <p>
        ASP.NET Core 没有 NestJS 的 Module 概念，入口 <code>Program.cs</code>{" "}
        极简，对应关系如下：
      </p>

      <LessonTable
        headers={["NestJS", "ASP.NET Core"]}
        rows={[
          ["apps/server/src/main.ts", "Program.cs（入口，极简）"],
          ["app.module.ts", "builder.Services.AddXXX() / app.UseXXX()"],
          ["modules/user/user.controller.ts", "Controllers/UsersController.cs"],
          ["modules/user/user.service.ts", "Services/UserService.cs"],
          ["modules/user/dto/、entities/", "Models/Dtos/、Models/Entities/"],
          ["common/guards/、interceptors/", "Middleware/、Attributes/"],
          ["shared/database/", "Data/ApplicationDbContext.cs"],
        ]}
      />

      <h3>最小入口文件 Program.cs</h3>
      <p>
        比 NestJS 的 <code>main.ts</code> 更简洁。注册服务在{" "}
        <code>builder.Build()</code> 之前，配置中间件管道在之后：
      </p>

      <LessonCode
        code={`var builder = WebApplication.CreateBuilder(args);

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

app.Run();`}
        language="csharp"
        title="Program.cs"
      />

      <LessonQuote>
        <code>Program.cs</code> 是一个<strong>顶级语句文件</strong>（C#
        9+），不需要 <code>class Program</code> 和 <code>static void Main</code>。
      </LessonQuote>

      <h3>中间件管道</h3>
      <p>
        中间件对应 NestJS 的 <code>app.use(middleware)</code>，在 ASP.NET Core
        中是 <code>app.Use(Middleware)</code>，<strong>按注册顺序执行</strong>：
      </p>

      <LessonCode
        code={`// 中间件管道 — 按注册顺序执行
app.UseHttpsRedirection();       // 1. HTTPS 重定向
app.UseStaticFiles();            // 2. 静态文件
app.UseSwagger();                // 3. Swagger UI
app.UseAuthentication();         // 4. 认证（修改 HttpContext.User）
app.UseAuthorization();          // 5. 授权（检查 [Authorize]）
app.UseMiddleware<LoggingMiddleware>();  // 6. 自定义日志中间件
app.MapControllers();            // 7. 路由到 Controller`}
        language="csharp"
        title="中间件顺序"
      />

      <LessonQuote>
        <code>UseAuthentication()</code> 必须在 <code>UseAuthorization()</code>{" "}
        前面：认证先确定<strong>你是谁</strong>（填充{" "}
        <code>HttpContext.User</code>），授权才能判断<strong>你能不能做</strong>
        （检查 <code>[Authorize]</code>）。顺序写反会导致授权时拿不到用户身份。
      </LessonQuote>

      <h4>自定义中间件</h4>
      <p>
        基于委托的中间件最轻量。在 <code>InvokeAsync</code> 中调用{" "}
        <code>_next(context)</code> 把请求传给下一个中间件：
      </p>

      <LessonCode
        code={`public class RequestTimeMiddleware
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
app.UseMiddleware<RequestTimeMiddleware>();`}
        language="csharp"
        title="RequestTimeMiddleware"
      />

      <h4>全局异常处理中间件</h4>
      <p>
        对应 NestJS 的 <code>GlobalExceptionFilter</code>：在最外层{" "}
        <code>try/catch</code> 包住 <code>_next</code>，按异常类型映射状态码：
      </p>

      <LessonCode
        code={`public class ExceptionMiddleware
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
}`}
        language="csharp"
        title="ExceptionMiddleware"
      />

      <h4>统一响应格式中间件</h4>
      <p>
        对应 NestJS 的 <code>PostResponseInterceptor</code>，通过替换{" "}
        <code>Response.Body</code> 读取原始响应再包装：
      </p>

      <LessonCode
        code={`public class ResponseMiddleware
{
    private readonly RequestDelegate _next;

    public ResponseMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var originalBody = context.Response.Body;
        using var newBody = new MemoryStream();
        context.Response.Body = newBody;

        try
        {
            await _next(context);
        }
        finally
        {
            newBody.Seek(0, SeekOrigin.Begin);
            var responseBody = await new StreamReader(newBody).ReadToEndAsync();
            newBody.Seek(0, SeekOrigin.Begin);

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
        }
    }
}`}
        language="csharp"
        title="ResponseMiddleware"
      />

      <LessonQuote>
        常见误区：为了统一响应格式写过重的中间件，反而破坏状态码和 OpenAPI 描述。包装响应前要谨慎处理 204、错误码等边界。
      </LessonQuote>

      <h3>配置管理</h3>
      <p>
        配置放在 <code>appsettings.json</code>，可被环境专属文件覆盖：
      </p>

      <LessonCode
        code={`{
  "Server": {
    "Port": 8080,
    "ApiPrefix": "api/v1"
  },
  "Jwt": {
    "Secret": "your-secret-key",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  }
}`}
        language="json"
        title="appsettings.json"
      />

      <h4>读取配置：强类型绑定</h4>
      <p>
        推荐用 <code>IOptions&lt;T&gt;</code> 绑定强类型配置类，支持热重载，并可在启动时验证：
      </p>

      <LessonCode
        code={`// 绑定某个 Section
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

// Service 中使用
public class UserService
{
    private readonly JwtSettings _settings;
    public UserService(IOptions<JwtSettings> options)
    {
        _settings = options.Value;
    }
}

// 带验证（对应 NestJS ConfigModule 的 validate 钩子）
builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .ValidateDataAnnotations()
    .ValidateOnStart();  // 应用启动时验证配置

public class JwtSettings
{
    [Required]
    public string Secret { get; set; } = string.Empty;

    [Range(1, 60)]
    public int AccessTokenExpirationMinutes { get; set; } = 15;
}`}
        language="csharp"
        title="读取与验证配置"
      />

      <LessonQuote>
        <code>ValidateOnStart()</code>{" "}
        可以在应用启动时立即发现配置错误，而不是在运行时才发现。
      </LessonQuote>

      <h4>环境配置</h4>
      <p>
        <code>appsettings.Development.json</code> 会覆盖{" "}
        <code>appsettings.json</code> 中的同名键，另有{" "}
        <code>appsettings.Production.json</code>。环境变量映射规则：{" "}
        <code>Jwt__Secret</code> → <code>Jwt:Secret</code>。
      </p>

      <h3>阶段验收问题</h3>
      <ul>
        <li>
          <code>builder.Services.Add...</code> 和 <code>app.Use...</code>{" "}
          的职责有什么不同？
        </li>
        <li>
          为什么 <code>UseAuthentication()</code> 必须在{" "}
          <code>UseAuthorization()</code> 前面？
        </li>
      </ul>

      <LessonStep
        title="实战：Program.cs 与中间件"
        steps={[
          {
            title: "搭建最小 ASP.NET Core 项目",
            content: (
              <p>
                创建一个最小的 ASP.NET Core 项目，对比 NestJS 的 <code>main.ts</code> 和 C# 的 <code>Program.cs</code>，理解启动流程。
              </p>
            ),
            code: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

var app = builder.Build();
app.MapControllers();
app.Run();`,
            codeLanguage: "csharp",
            codeTitle: "最小 Program.cs",
            checkpoints: [
              "builder.Services 注册服务（类似 NestJS 的 Module providers）",
              "app 构建中间件管道（类似 NestJS 的 middleware）",
              "app.Run() 启动应用（类似 NestJS 的 app.listen()）",
            ],
            reference:
              "NestJS 用 @Module 装饰器注册服务，C# 用 builder.Services.AddXxx()。NestJS 用 app.use() 注册中间件，C# 用 app.UseXxx()。",
          },
          {
            title: "编写请求耗时中间件",
            content: (
              <p>
                创建一个自定义中间件，记录每个请求的耗时，并注册到管道中。
              </p>
            ),
            code: `// 中间件类
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimingMiddleware> _logger;

    public RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        await _next(context);
        sw.Stop();
        _logger.LogInformation("Request {Method} {Path} took {ElapsedMs}ms",
            context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds);
    }
}

// 注册到管道
app.UseMiddleware<RequestTimingMiddleware>();`,
            codeLanguage: "csharp",
            codeTitle: "请求耗时中间件",
            checkpoints: [
              "中间件通过构造函数注入 RequestDelegate 和 ILogger",
              "InvokeAsync 方法先执行 await _next(context)，再记录耗时",
              "用 app.UseMiddleware 注册到管道",
            ],
            reference:
              "中间件的执行顺序由注册顺序决定。如果在 _next(context) 之前记录，就是请求进入；之后记录，就是响应返回。",
          },
          {
            title: "编写全局异常处理中间件",
            content: (
              <p>
                创建异常处理中间件，捕获所有未处理的异常，并按异常类型映射为合适的 HTTP 状态码。
              </p>
            ),
            code: `public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = ex switch
            {
                NotFoundException => 404,
                UnauthorizedException => 401,
                ForbiddenException => 403,
                ValidationException => 400,
                _ => 500
            };
            await context.Response.WriteAsJsonAsync(new { error = ex.Message });
        }
    }
}

// 注册（放在管道最前面）
app.UseMiddleware<ExceptionHandlingMiddleware>();`,
            codeLanguage: "csharp",
            codeTitle: "异常处理中间件",
            checkpoints: [
              "用 try-catch 包裹 await _next(context)",
              "用 switch 表达式按异常类型映射状态码",
              "WriteAsJsonAsync 返回 JSON 错误响应",
            ],
            reference:
              "异常中间件应该放在管道最前面，这样能捕获后续所有中间件和 Controller 抛出的异常。",
          },
          {
            title: "实现统一响应格式中间件",
            content: (
              <p>
                创建中间件，将所有成功响应包装为统一格式（如 <code>{`{ data, success, message }`}</code>）。
              </p>
            ),
            code: `public class ResponseWrapperMiddleware
{
    private readonly RequestDelegate _next;

    public ResponseWrapperMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var originalBody = context.Response.Body;
        using var newBody = new MemoryStream();
        context.Response.Body = newBody;

        await _next(context);

        if (context.Response.StatusCode == 200)
        {
            newBody.Seek(0, SeekOrigin.Begin);
            var data = await new StreamReader(newBody).ReadToEndAsync();
            var wrapped = new { data = JsonDocument.Parse(data).RootElement, success = true };

            context.Response.Body = originalBody;
            await context.Response.WriteAsJsonAsync(wrapped);
        }
        else
        {
            newBody.Seek(0, SeekOrigin.Begin);
            await newBody.CopyToAsync(originalBody);
        }
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "响应包装中间件",
            checkpoints: [
              "替换 Response.Body 为 MemoryStream，拦截响应内容",
              "只包装 200 状态码的响应",
              "将原始响应体包装为 { data, success } 格式",
            ],
            reference:
              "这种中间件会影响性能（因为要读取和重写响应体）。生产环境建议在 Controller 层统一返回包装类型，而不是用中间件。",
          },
          {
            title: "用 IOptions 绑定配置",
            content: (
              <p>
                从 <code>appsettings.json</code> 读取配置，绑定为强类型对象，并启用启动时验证。
              </p>
            ),
            code: `// appsettings.json
{
  "JwtSettings": {
    "SecretKey": "your-secret-key",
    "ExpiresInMinutes": 60
  }
}

// 配置类
public class JwtSettings
{
    public string SecretKey { get; set; } = null!;
    public int ExpiresInMinutes { get; set; }
}

// Program.cs 注册
builder.Services.AddOptions<JwtSettings>()
    .BindConfiguration("JwtSettings")
    .ValidateDataAnnotations()
    .ValidateOnStart();

// 使用（通过构造函数注入）
public class AuthService
{
    private readonly JwtSettings _jwtSettings;

    public AuthService(IOptions<JwtSettings> options)
    {
        _jwtSettings = options.Value;
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "IOptions 配置绑定",
            checkpoints: [
              "用 BindConfiguration 绑定 appsettings.json 的指定节点",
              "ValidateOnStart 在启动时验证配置（避免运行时才发现配置错误）",
              "通过 IOptions<T> 注入，用 options.Value 访问配置",
            ],
            reference:
              "IOptions 是单例，配置在启动时加载后不会改变。如果需要热重载配置，用 IOptionsSnapshot 或 IOptionsMonitor。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经理解了 ASP.NET Core 的启动流程和中间件管道。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                Program.cs 分为两部分：builder（注册服务）和 app（配置管道）
              </li>
              <li>
                中间件通过 RequestDelegate 形成管道，执行顺序由注册顺序决定
              </li>
              <li>
                异常中间件放在最前面，能捕获后续所有异常
              </li>
              <li>
                IOptions 绑定强类型配置，ValidateOnStart 在启动时验证
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能搭建项目、编写自定义中间件、配置 IOptions。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
