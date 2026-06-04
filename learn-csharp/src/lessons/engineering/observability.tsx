import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const EngineeringObservabilityLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
  return (
    <LessonShell>
      <h3>本章你要掌握什么</h3>
      <p>
        本节聚焦运行期的可观测性与性能：配置结构化日志，接入缓存（内存与
        Redis），暴露区分 live 与 ready 的健康检查，并掌握几个关键的性能优化要点。日志、健康检查是工程化的最低线，缓存按需加入。
      </p>

      <h4>常见误区</h4>
      <ul>
        <li>日志用字符串拼接，丢失结构化字段。</li>
        <li>
          健康检查只做一个 <code>/health</code>，不区分 live 和 ready。
        </li>
      </ul>

      <h3>日志</h3>
      <p>
        .NET 的 <code>ILogger&lt;T&gt;</code> 通过 DI 注入，方法名与 NestJS Logger
        一一对应：
      </p>
      <LessonCode
        code={`NestJS Logger                   .NET ILogger
─────────────────               ──────────────
this.logger.log()               _logger.LogInformation()
this.logger.error()             _logger.LogError()
this.logger.warn()              _logger.LogWarning()
this.logger.debug()             _logger.LogDebug()
this.logger.verbose()           _logger.LogTrace()`}
        language="text"
        title="NestJS Logger 与 .NET ILogger 对照"
      />

      <TeacherTask title="结构化日志：不要拼接字符串">
        <p>
          用消息模板的占位符（如 <code>{"{Username}"}</code>）而不是字符串拼接。这样日志平台能把
          Username、Email 当成可检索的结构化字段，而不是一段死文本。异常日志把{" "}
          <code>ex</code> 作为第一个参数传入，会自动包含堆栈。
        </p>
      </TeacherTask>
      <LessonCode
        code={`public class UserService
{
    private readonly ILogger<UserService> _logger;

    public UserService(ILogger<UserService> logger)
    {
        _logger = logger;
    }

    public async Task CreateAsync(User user)
    {
        // 结构化日志 — 不需要拼接字符串
        _logger.LogInformation("Creating user {Username} with email {Email}",
            user.Username, user.Email);

        try
        {
            // ... 业务逻辑
            _logger.LogInformation("User {UserId} created successfully", user.Id);
        }
        catch (Exception ex)
        {
            // 异常日志 — 自动包含堆栈
            _logger.LogError(ex, "Failed to create user {Username}", user.Username);
            throw;
        }
    }
}`}
        language="csharp"
        title="ILogger 的结构化用法"
      />

      <h4>输出配置</h4>
      <p>
        日志级别和输出目标可以在 <code>appsettings.json</code> 中按命名空间精细控制：
      </p>
      <LessonCode
        code={`// appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    },
    "Console": {
      "LogLevel": {
        "Default": "Debug"
      }
    },
    "File": {
      "Path": "logs/log-.txt",
      "RollingInterval": "Day"
    }
  }
}`}
        language="json"
        title="appsettings.json 日志配置"
      />

      <h4>使用 Serilog（推荐，生产级）</h4>
      <LessonCode
        code={`dotnet add package Serilog
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File
dotnet add package Serilog.Sinks.Seq   # 集中日志平台`}
        language="bash"
        title="安装 Serilog"
      />
      <p>
        生产级配置通过 Enrich 注入机器名、环境名、应用名等上下文，并按天滚动文件、限制保留天数：
      </p>
      <LessonCode
        code={`Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()        // 机器名
    .Enrich.WithEnvironmentName()    // 环境名（Dev/Prod）
    .Enrich.WithProperty("Application", "MyApp")  // 应用名
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3} {SourceContext}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        "logs/log-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30)  // 保留 30 天
    .CreateLogger();`}
        language="csharp"
        title="Serilog 生产级配置"
      />

      <h3>缓存</h3>
      <h4>内存缓存</h4>
      <LessonCode
        code={`dotnet add package Microsoft.Extensions.Caching.Memory`}
        language="bash"
        title="安装内存缓存"
      />
      <p>
        通过 <code>IMemoryCache</code> 实现“先查缓存、未命中再查库并回填”的常见模式：
      </p>
      <LessonCode
        code={`public class InMemoryCacheService
{
    private readonly IMemoryCache _cache;

    public InMemoryCacheService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public T? Get<T>(string key)
    {
        return _cache.TryGetValue(key, out T? value) ? value : default;
    }

    public void Set<T>(string key, T value, TimeSpan? expiry = null)
    {
        var options = new MemoryCacheEntryOptions();
        options.AbsoluteExpirationRelativeToNow =
            expiry ?? TimeSpan.FromMinutes(30);
        _cache.Set(key, value, options);
    }

    public void Remove(string key) => _cache.Remove(key);

    // 带缓存的查询 — 类似 TypeORM 缓存
    public async Task<User?> GetUserWithCacheAsync(string id)
    {
        var cacheKey = $"user:{id}";

        // 先查缓存
        if (_cache.TryGetValue(cacheKey, out User? cachedUser))
            return cachedUser;

        // 查数据库
        var user = await _userRepository.GetByIdAsync(id);

        if (user != null)
            _cache.Set(cacheKey, user, TimeSpan.FromMinutes(10)); // 缓存 10 分钟

        return user;
    }
}`}
        language="csharp"
        title="IMemoryCache 缓存服务"
      />

      <h4>分布式缓存（Redis）</h4>
      <LessonCode
        code={`dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis`}
        language="bash"
        title="安装 Redis 缓存"
      />
      <p>
        注册 Redis 后，业务层换用 <code>IDistributedCache</code>，使用方式与内存缓存高度一致，差别是值需要序列化为字符串：
      </p>
      <LessonCode
        code={`// Program.cs
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "MyApp:";  // 前缀隔离
});

// 使用
public class UserService
{
    private readonly IDistributedCache _cache;

    public UserService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<User?> GetWithCacheAsync(string id)
    {
        var cacheKey = $"user:{id}";

        var cached = await _cache.GetStringAsync(cacheKey);
        if (cached != null)
            return JsonSerializer.Deserialize<User>(cached);

        var user = await _userRepository.GetByIdAsync(id);

        if (user != null)
        {
            var json = JsonSerializer.Serialize(user);
            await _cache.SetStringAsync(
                cacheKey,
                json,
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
        }

        return user;
    }
}`}
        language="csharp"
        title="IDistributedCache（Redis）"
      />

      <h3>健康检查</h3>
      <LessonCode
        code={`dotnet add package AspNetCore.HealthChecks.Uris
dotnet add package AspNetCore.HealthChecks.SqlServer
dotnet add package AspNetCore.HealthChecks.Redis`}
        language="bash"
        title="安装健康检查包"
      />
      <p>注册时为每个依赖设置失败状态（Degraded / Unhealthy）：</p>
      <LessonCode
        code={`// Program.cs
builder.Services.AddHealthChecks()
    .AddSqlServer(
        builder.Configuration.GetConnectionString("Default"),
        name: "sqlserver",
        failureStatus: HealthStatus.Degraded)
    .AddRedis(
        builder.Configuration.GetConnectionString("Redis"),
        name: "redis",
        failureStatus: HealthStatus.Degraded)
    .AddUrlGroup(
        new Uri("https://api.example.com/health"),
        name: "external-api",
        failureStatus: HealthStatus.Unhealthy);`}
        language="csharp"
        title="注册健康检查"
      />
      <TeacherTask title="区分 live 与 ready">
        <p>
          不要只暴露一个 <code>/health</code>。<strong>live（存活）</strong>
          最简单，只回答“进程还活着吗”，活着就不该被重启；
          <strong>ready（就绪）</strong>
          检查数据库、Redis 等依赖是否就绪，未就绪时不该把流量打进来。两者对应 Kubernetes
          的 livenessProbe 与 readinessProbe。
        </p>
      </TeacherTask>
      <LessonCode
        code={`// 暴露端点
app.MapHealthChecks("/health");              // 简易健康检查
app.MapHealthChecks("/health/ready", ...);   // 就绪检查
app.MapHealthChecks("/health/live", ...);    // 存活检查（最简单）`}
        language="csharp"
        title="暴露健康检查端点"
      />
      <LessonCode
        code={`{
  "status": "Healthy",
  "checks": [
    {
      "name": "sqlserver",
      "description": null,
      "status": "Healthy",
      "duration": "00:00:00.0023182"
    },
    {
      "name": "redis",
      "description": null,
      "status": "Healthy",
      "duration": "00:00:00.0012345"
    }
  ]
}`}
        language="json"
        title="健康检查响应"
      />

      <h3>性能优化</h3>
      <h4>避免 N+1 查询</h4>
      <LessonCode
        code={`// 错误：循环内查询
foreach (var user in users)
{
    var roles = await _context.Roles.Where(r => r.UserId == user.Id).ToListAsync(); // N+1!
}

// 正确：预加载
var usersWithRoles = await _context.Users
    .Include(u => u.Roles)
    .ToListAsync();`}
        language="csharp"
        title="用 Include 预加载"
      />

      <h4>分页限制</h4>
      <LessonCode
        code={`[HttpGet]
public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
{
    if (pageSize < 1 || pageSize > 100)  // 最大 100
        return BadRequest("pageSize 必须在 1-100 之间");

    var users = await _userService.GetAllAsync(page, pageSize);
    return Ok(new {
        data = users.Data,
        pagination = new { page, pageSize, total = users.Total }
    });
}`}
        language="csharp"
        title="限制分页大小"
      />

      <h4>异步最佳实践</h4>
      <LessonQuote>
        永远不要用 <code>.Result</code> 或 <code>.Wait()</code> 同步等待 Task，会有死锁风险；同步阻塞调用也会占满线程。
      </LessonQuote>
      <LessonCode
        code={`// ✅ 正确
public async Task<User?> GetByIdAsync(string id)
{
    return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
}

// ✅ 正确：CPU 绑定用 Task.Run
public async Task<UserDto> GetWithSummaryAsync(string id)
{
    var user = await GetByIdAsync(id);
    if (user == null) return null;

    // 如果计算量大，放线程池
    var summary = await Task.Run(() => HeavyCalculation(user));

    return new UserDto { User = user, Summary = summary };
}

// ❌ 错误：阻塞调用
public User GetById(string id)
{
    return _context.Users.First(u => u.Id == id); // 阻塞线程
}

// ❌ 错误：.Result
public async Task<User?> GetByIdAsync(string id)
{
    return _context.Users.FirstAsync(u => u.Id == id).Result; // 死锁风险！
}`}
        language="csharp"
        title="异步正确与错误写法"
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>结构化日志相比字符串拼接有什么优势？</li>
        <li>live 和 ready 健康检查有什么区别？</li>
        <li>
          为什么不能用 <code>.Result</code> 同步等待异步方法？
        </li>
      </ul>

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="engineering-observability-checklist"
        items={[
          "配置 Serilog 日志（生产级：Enrich + File + Console）",
          "实现一个内存缓存服务，再切换到 Redis 分布式缓存",
          "添加健康检查端点，区分 live 与 ready",
          "排查并修复一处 N+1 查询，用 Include 预加载",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
