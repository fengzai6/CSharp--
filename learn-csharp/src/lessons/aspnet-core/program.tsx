import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const AspnetProgramLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
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

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="aspnet-program-checklist"
        items={[
          "搭建最小 ASP.NET Core 项目，对比 main.ts 和 Program.cs",
          "编写一个自定义中间件（如请求耗时日志）并注册到管道",
          "编写全局异常处理中间件，按异常类型映射状态码",
          "实现统一响应格式中间件",
          "用 IOptions 绑定 appsettings.json 中的强类型配置并启用 ValidateOnStart",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
