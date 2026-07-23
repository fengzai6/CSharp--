import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const AspnetProgramLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: {
  completedChecklistIds: string[];
  onToggleChecklistItem: (checklistItemId: string) => void;
}) => {
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
          ["shared/database/", "Data/TaskHubDbContext.cs"],
        ]}
      />

      <h3>最小入口文件 Program.cs</h3>
      <p>
        比 NestJS 的 <code>main.ts</code> 更简洁。记住两段：
        <strong>注册服务</strong>在 <code>builder.Build()</code> 之前（放进 DI
        容器），<strong>配置管道</strong>在之后（决定每个请求怎么走）。
      </p>
      <p>
        对照 NestJS：<code>builder.Services.AddXXX()</code> ≈{" "}
        <code>app.module.ts</code> 里的 <code>imports</code> /{" "}
        <code>providers</code>；<code>app.UseXXX()</code> ≈{" "}
        <code>main.ts</code> 里的 <code>app.use(...)</code> 中间件链。
      </p>

      <LessonCode
        code={`// WebApplication.CreateBuilder：读配置、建 DI 容器、准备主机
// args 来自命令行，和 process.argv 类似
var builder = WebApplication.CreateBuilder(args);

// —— 以下都是「注册」，还不会处理 HTTP ——
builder.Services.AddControllers();          // 启用 Controller 发现与模型绑定
builder.Services.AddEndpointsApiExplorer(); // 给 OpenAPI/Swagger 提供端点元数据
builder.Services.AddSwaggerGen();           // 生成 OpenAPI 文档 + Swagger UI 后端
builder.Services.AddDbContext<TaskHubDbContext>(
    options => options.UseNpgsql(
        builder.Configuration.GetConnectionString("Default"))); // 读 ConnectionStrings:Default
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(); // 注册「怎么验 JWT」，真正拦截请求要靠后面的 UseAuthentication

// Build：冻结服务注册，得到可跑的 WebApplication（≈ NestJS 的 NestFactory.create 之后）
var app = builder.Build();

// —— 以下是「管道」，顺序就是请求经过的顺序 ——
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();    // 提供 /swagger/v1/swagger.json
    app.UseSwaggerUI();  // 提供 /swagger 页面
}

app.UseHttpsRedirection(); // HTTP → HTTPS 重定向
app.UseAuthentication();   // 解析 Token，填充 HttpContext.User
app.UseAuthorization();    // 检查 [Authorize] / Policy
app.MapControllers();      // 把 URL 映射到 Controller Action（终端节点，不是中间件）

app.Run(); // 阻塞监听端口，类似 app.listen()`}
        language="csharp"
        title="Program.cs"
      />

      <LessonTable
        headers={["代码", "一句话", "NestJS / Node 对照"]}
        rows={[
          [
            "WebApplication.CreateBuilder(args)",
            "创建主机 + 配置 + DI 容器",
            "NestFactory.create 之前的配置阶段",
          ],
          [
            "builder.Services.Add...",
            "把类型放进 DI 容器",
            "Module providers / imports",
          ],
          ["builder.Build()", "冻结注册，得到 app", "create 完成后的 app 实例"],
          ["app.Use...", "按顺序挂中间件", "app.use(middleware)"],
          [
            "app.MapControllers()",
            "注册 Controller 路由终点",
            "控制器路由挂载（不是中间件）",
          ],
          ["app.Run()", "开始监听，阻塞当前线程", "await app.listen(port)"],
        ]}
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能在 <code>Program.cs</code> 中区分服务注册、应用构建和中间件管道三段代码。
          </p>
        }
        id="aspnet-program-structure"
        title="读懂 Program.cs 主流程"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <LessonQuote>
        <code>Program.cs</code> 是一个<strong>顶级语句文件</strong>（C#
        9+），不需要 <code>class Program</code> 和 <code>static void Main</code>
        ——编译器会帮你生成入口方法。文件从上到下就是启动顺序。
      </LessonQuote>

      <h3>中间件管道</h3>
      <p>
        中间件是「洋葱模型」：请求从外往里进，响应从里往外回。对应 Express/NestJS 的{" "}
        <code>app.use((req, res, next) =&gt; ...)</code>，在 ASP.NET Core 里是{" "}
        <code>app.Use...</code> / <code>app.UseMiddleware&lt;T&gt;()</code>，
        <strong>按注册顺序执行</strong>。
      </p>
      <p>
        和 NestJS 别混：Nest 的 Middleware / Guard / Pipe / Interceptor
        是分层概念；ASP.NET Core 的中间件是<strong>统一的 HTTP 管道</strong>
        。认证、授权、异常、CORS 多数先挂成中间件；Controller 上的{" "}
        <code>[Authorize]</code>、模型验证则发生在管道末端的 Endpoint 阶段。
      </p>
      <p>
        还有一个容易混的点：<code>app.UseXxx()</code> 挂的是<strong>管道中间环</strong>，
        会调用 <code>next</code> 继续往下；<code>app.MapControllers()</code> /{" "}
        <code>MapGet</code> 挂的是<strong>终端节点（Endpoint）</strong>
        ——匹配到路由后就进入 Action，不再把请求交给后面的中间件。所以「管道中间件」尽量写在{" "}
        <code>Map*</code> 前面。
      </p>

      <LessonCode
        code={`// 中间件管道 — 按注册顺序「进入」；await _next 之后再「返回」
app.UseHttpsRedirection();       // 1. HTTP→HTTPS 301/307；本地纯 HTTP 调试时可能要关掉
app.UseStaticFiles();            // 2. wwwroot 静态文件；命中则短路，不再往后
app.UseSwagger();                // 3. 提供 /swagger/v1/swagger.json（文档 JSON）
app.UseAuthentication();         // 4. 认证：解析 Token → 填充 HttpContext.User
app.UseAuthorization();          // 5. 授权：检查 [Authorize] / Policy（依赖上一步的 User）
app.UseMiddleware<LoggingMiddleware>();  // 6. 自定义（可在 next 前后各做一次）
app.MapControllers();            // 7. 终端：路由到 Controller（不是 Use* 中间件）`}
        language="csharp"
        title="中间件顺序"
      />

      <LessonTable
        headers={["能力", "ASP.NET Core", "NestJS 近似"]}
        rows={[
          ["全局横切（日志/异常/CORS）", "Middleware（app.Use...）", "Middleware"],
          ["认证（你是谁）", "UseAuthentication + Auth Handler", "Passport / AuthGuard 前置"],
          ["授权（你能不能）", "UseAuthorization + [Authorize]", "Guard（canActivate）"],
          ["入参校验", "Model Binding + Filter / FluentValidation", "Pipe（ValidationPipe）"],
          ["改请求/响应", "Middleware 或 Filter", "Interceptor"],
          ["路由终点", "MapControllers / Minimal API Map*", "Controller 方法"],
        ]}
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能解释 <code>UseAuthentication()</code> 必须在 <code>UseAuthorization()</code>
            之前，并能判断自定义中间件应该放在管道的哪个位置。
          </p>
        }
        id="aspnet-program-middleware-order"
        title="确认中间件顺序"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <LessonQuote>
        <code>UseAuthentication()</code> 必须在 <code>UseAuthorization()</code>{" "}
        前面：认证先确定<strong>你是谁</strong>（填充{" "}
        <code>HttpContext.User</code>），授权才能判断<strong>你能不能做</strong>
        （检查 <code>[Authorize]</code>）。顺序写反会导致授权时拿不到用户身份。
        <code>MapControllers()</code> 应尽量靠后——它是终点，放太前后面的中间件跑不到 Controller。
      </LessonQuote>

      <h4>自定义中间件</h4>
      <p>
        约定式类中间件：构造函数收 <code>RequestDelegate next</code>（下一个环节，≈
        Express 的 <code>next</code>），再加需要的 DI 服务；公开{" "}
        <code>Invoke</code> / <code>InvokeAsync(HttpContext)</code>。在{" "}
        <code>await _next(context)</code> <strong>之前</strong>改请求，
        <strong>之后</strong>看响应（如下面计时）。
      </p>

      <LessonCode
        code={`public class RequestTimeMiddleware
{
    // RequestDelegate ≈ (req, res, next) 里的 next：调用就进入管道下一环
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimeMiddleware> _logger;

    // 构造函数参数由 DI 注入；RequestDelegate 由框架自动传入
    public RequestTimeMiddleware(RequestDelegate next, ILogger<RequestTimeMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        await _next(context); // 放行：后续中间件 + Controller 跑完再回来
        sw.Stop();
        // 结构化日志：{Method} 等是占位符，不是字符串插值
        _logger.LogInformation("Request {Method} {Path} took {Ms}ms",
            context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds);
    }
}

// 注册到管道当前位置（顺序敏感）
app.UseMiddleware<RequestTimeMiddleware>();`}
        language="csharp"
        title="RequestTimeMiddleware"
      />

      <LessonQuote>
        不调用 <code>_next</code> = 短路（像 Express 里不调{" "}
        <code>next()</code> 直接
        <code>res.end()</code>）。全局异常处理中间件要尽早注册，才能包住后面所有环节。
      </LessonQuote>

      <h4>全局异常处理中间件</h4>
      <p>
        对应 NestJS 的 <code>ExceptionFilter</code> /{" "}
        <code>BaseExceptionFilter</code>：在最外层 <code>try/catch</code> 包住{" "}
        <code>_next</code>，按异常类型映射状态码。自己写中间件灵活；新项目也可用内置{" "}
        <code>app.UseExceptionHandler()</code> + <code>ProblemDetails</code>（见下）。
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

      <h4>ProblemDetails：标准错误响应</h4>
      <p>
        新项目优先用 <code>ProblemDetails</code> 表达错误：ASP.NET Core 对 RFC 7807
        的内置支持。响应形如{" "}
        <code>{`{ type, title, status, detail, ... }`}</code>
        ，比自创 <code>{`{ code, message }`}</code> 更容易被 OpenAPI、前端和监控识别。
      </p>
      <p>
        对照 NestJS：常手写{" "}
        <code>{`{ statusCode, message, error }`}</code> 或自定义
        ExceptionFilter。这里框架已内置标准形状，Controller 里直接{" "}
        <code>Problem(...)</code> 即可。
      </p>
      <LessonCode
        code={`// 注册：让框架用 ProblemDetails 形状输出错误
builder.Services.AddProblemDetails();

var app = builder.Build();

// 未处理异常 → ProblemDetails（替代自写 ExceptionMiddleware 的常见选择）
// 必须尽量靠前：要包住后面整条管道，否则 catch 不到后面抛的异常
app.UseExceptionHandler();
// 空 404/401 等「只有状态码、没有正文」的响应，也补成 ProblemDetails JSON
app.UseStatusCodePages();

// Controller 内主动返回标准错误（继承 ControllerBase 才有 Problem()）
[HttpGet("{id}")]
public async Task<ActionResult<WorkItemSummaryDto>> GetById(string id)
{
    var item = await _workItemService.GetByIdAsync(id);
    return item is null
        ? Problem(statusCode: 404, title: "任务不存在") // ≈ NestJS 的 NotFoundException
        : Ok(item); // 200 + JSON body
}`}
        language="csharp"
        title="ProblemDetails"
      />

      <h4>CORS</h4>
      <p>
        浏览器跨域（Vite 前端调本机 API）需要 CORS。和 Express 的{" "}
        <code>cors()</code> 一样分两步：先 <code>AddCors</code> 注册策略名，再{" "}
        <code>UseCors</code> 挂到管道。生产环境务必{" "}
        <code>WithOrigins(...)</code> 白名单，不要 <code>AllowAnyOrigin()</code>
        ；若要带 Cookie / 凭证，必须具体 Origin，且不能和{" "}
        <code>AllowAnyOrigin</code> 并用。
      </p>
      <LessonCode
        code={`// 1) 注册策略（builder 阶段）
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173") // Vite 默认端口
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()); // 允许带 Cookie；此时不能 AllowAnyOrigin
});

// 2) 挂中间件：放在 UseAuthentication 之前（预检 OPTIONS 要尽早响应）
app.UseCors("AllowFrontend");`}
        language="csharp"
        title="CORS"
      />

      <h4>统一响应格式中间件</h4>
      <p>
        对应 NestJS 的响应 Interceptor：替换{" "}
        <code>Response.Body</code> 为内存流，等下游写完再读出、包一层{" "}
        <code>{`{ success, code, data }`}</code>。能用，但容易踩 204
        空体、错误状态被盖住、OpenAPI 与真实响应不一致等问题——课程展示写法，新项目优先{" "}
        <code>ProblemDetails</code> + 明确 DTO，而不是全局硬包一层。
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
        配置默认来自 <code>appsettings.json</code>，可被环境专属文件、环境变量、命令行参数覆盖。
        对照 NestJS：类似 <code>ConfigModule.forRoot()</code> +{" "}
        <code>ConfigService.get(&apos;Jwt.Secret&apos;)</code>，但 .NET 用{" "}
        <strong>分层配置源</strong>自动合并，键用 <code>:</code> 分层（JSON 嵌套对象）。
      </p>

      <LessonCode
        code={`{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=taskhub;..."
  },
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
      <p>
        <code>builder.Configuration.GetConnectionString(&quot;Default&quot;)</code>{" "}
        是读 <code>ConnectionStrings:Default</code> 的快捷方式，等价于{" "}
        <code>GetSection(&quot;ConnectionStrings&quot;)[&quot;Default&quot;]</code>
        。业务配置则用 <code>GetSection(&quot;Jwt&quot;)</code> 整段绑定。
      </p>

      <h4>读取配置：强类型绑定</h4>
      <p>
        推荐把配置 Section 绑成 C# 类，再通过 <code>IOptions&lt;T&gt;</code>{" "}
        注入——对应 NestJS 里定义{" "}
        <code>interface JwtConfig {"{"} secret: string {"}"}</code> 再{" "}
        <code>ConfigService.get&lt;JwtConfig&gt;(&apos;Jwt&apos;)</code>
        。好处：类型安全、可启动时校验，避免到处写魔法字符串。
      </p>

      <LessonCode
        code={`// 绑定某个 Section（键 "Jwt" 对应 JSON 根下的 Jwt 对象）
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

// Service 中使用：构造函数注入 IOptions<T>，.Value 才是配置实例
public class TokenService
{
    private readonly JwtSettings _settings;
    public TokenService(IOptions<JwtSettings> options)
    {
        _settings = options.Value; // 注意：是 .Value，不是 options 本身
    }
}

// 带验证（对应 NestJS ConfigModule 的 validate 钩子）
builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .ValidateDataAnnotations() // 检查 [Required] / [Range] 等
    .ValidateOnStart();        // 启动失败而不是第一次发 Token 才炸

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
        在应用启动时立刻校验配置；Secret 空了、过期分钟数写 0，进程直接起不来——比请求打进来才 500 好查。
      </LessonQuote>

      <LessonTable
        headers={["选项类型", "行为", "NestJS / 何时用"]}
        rows={[
          [
            "IOptions<T>",
            "启动时读一次，之后不变",
            "≈ 模块初始化时读 config；适合 Singleton、配置基本固定",
          ],
          [
            "IOptionsSnapshot<T>",
            "每个 HTTP 请求取一次快照",
            "Scoped 服务里想读到文件热更新后的值",
          ],
          [
            "IOptionsMonitor<T>",
            "可 OnChange 监听 + 随时 CurrentValue",
            "Singleton 里也要读最新配置时用它",
          ],
        ]}
      />
      <p>
        常见误判：在 <code>AddSingleton</code> 的服务里注入{" "}
        <code>IOptionsSnapshot&lt;T&gt;</code>
        ——Snapshot 按请求作用域设计，会触发 captive dependency（单例抓住了短生命周期依赖）。Singleton 要热更新请用{" "}
        <code>IOptionsMonitor&lt;T&gt;</code>。
      </p>

      <h4>环境配置</h4>
      <p>
        加载顺序（后写覆盖先写）：<code>appsettings.json</code> →{" "}
        <code>appsettings.{"{Environment}"}.json</code> → 环境变量 → 命令行。
        环境名由 <code>ASPNETCORE_ENVIRONMENT</code> 决定（Development / Production
        等），本地 <code>dotnet run</code> 默认 Development。
      </p>
      <p>
        环境变量键映射：JSON 里的 <code>Jwt:Secret</code> 写成{" "}
        <code>Jwt__Secret</code>（双下划线代替 <code>:</code>
        ，Linux/macOS 环境变量不能含冒号）。对照 Node：类似{" "}
        <code>process.env.JWT_SECRET</code>，但 .NET 会按层级自动合并进{" "}
        <code>IConfiguration</code>，不必手写解析。
      </p>
      <LessonCode
        code={`# 当前 shell 临时覆盖（副作用：只影响这个终端会话）
export ASPNETCORE_ENVIRONMENT=Development
export Jwt__Secret="dev-only-secret"

dotnet run --project TaskHub.Api
# 也可用命令行：dotnet run --Jwt:Secret=dev-only-secret`}
        language="bash"
        title="环境变量与命令行覆盖"
      />

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
        <li>
          <code>Jwt__Secret</code> 环境变量对应 JSON 里的哪一层键？Singleton 服务该注入{" "}
          <code>IOptions</code> / <code>IOptionsSnapshot</code> /{" "}
          <code>IOptionsMonitor</code> 里的哪一个？
        </li>
      </ul>
    </LessonShell>
  );
};
