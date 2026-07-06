import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  TeacherTask,
} from "@/components/lesson-ui";

export const EngineeringObservabilityLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: {
  completedChecklistIds: string[];
  onToggleChecklistItem: (checklistItemId: string) => void;
}) => {
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

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能配置结构化日志、缓存、健康检查，并能识别只读查询和异步阻塞的性能问题。
          </p>
        }
        id="engineering-observability-main"
        title="完成可观测性与性能主线"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <LessonStep
        title="实战：可观测性与性能优化"
        steps={[
          {
            title: "配置 Serilog 日志（生产级）",
            content: (
              <p>
                配置 Serilog 实现结构化日志，包含 Enrich 上下文信息、文件输出和控制台输出。
              </p>
            ),
            code: `// 安装包
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File
dotnet add package Serilog.Enrichers.Environment

// Program.cs
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .Enrich.WithProperty("Application", "MyApp")
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        "logs/log-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30)
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();  // 接管默认日志

    // ... 其他配置

    var app = builder.Build();
    app.UseSerilogRequestLogging();  // 记录 HTTP 请求
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "应用启动失败");
}
finally
{
    Log.CloseAndFlush();
}

// 使用示例
public class UserService
{
    private readonly ILogger<UserService> _logger;

    public async Task CreateAsync(User user)
    {
        _logger.LogInformation("创建用户 {Username} {Email}", user.Username, user.Email);

        try
        {
            await _repository.AddAsync(user);
            _logger.LogInformation("用户 {UserId} 创建成功", user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建用户失败 {Username}", user.Username);
            throw;
        }
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "Serilog 生产级配置",
            checkpoints: [
              "安装 Serilog.AspNetCore 及相关 Sink 包",
              "配置 Enrich（机器名、环境名、应用名）",
              "同时输出到 Console 和 File，文件按天滚动保留 30 天",
              "使用结构化日志模板（{占位符}），不要字符串拼接",
            ],
            reference:
              "结构化日志的优势：日志平台（如 Seq、ELK）可以把 Username、Email 当成可检索的字段，而不是死文本。异常日志把 ex 作为第一个参数传入会自动包含堆栈。",
          },
          {
            title: "实现内存缓存服务，再切换到 Redis",
            content: (
              <p>
                先实现内存缓存服务，掌握"先查缓存、未命中再查库并回填"模式，再切换到 Redis 分布式缓存。
              </p>
            ),
            code: `// 1. 内存缓存
dotnet add package Microsoft.Extensions.Caching.Memory

// Program.cs
builder.Services.AddMemoryCache();

// 内存缓存服务
public class CacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<CacheService> _logger;

    public CacheService(IMemoryCache cache, ILogger<CacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetOrCreateAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiry = null)
    {
        if (_cache.TryGetValue(key, out T? cached))
        {
            _logger.LogDebug("缓存命中 {CacheKey}", key);
            return cached;
        }

        _logger.LogDebug("缓存未命中 {CacheKey}", key);
        var value = await factory();

        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromMinutes(10)
        };
        _cache.Set(key, value, options);

        return value;
    }

    public void Remove(string key) => _cache.Remove(key);
}

// 使用示例
public async Task<User?> GetByIdAsync(string id)
{
    var cacheKey = $"user:{id}";
    return await _cacheService.GetOrCreateAsync(
        cacheKey,
        () => _context.Users.FirstOrDefaultAsync(u => u.Id == id),
        TimeSpan.FromMinutes(5));
}

// 2. 切换到 Redis
dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis

// Program.cs
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "MyApp:";
});

// Redis 缓存服务
public class RedisCacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IDistributedCache cache, ILogger<RedisCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetOrCreateAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiry = null)
    {
        var cached = await _cache.GetStringAsync(key);
        if (cached != null)
        {
            _logger.LogDebug("Redis 缓存命中 {CacheKey}", key);
            return JsonSerializer.Deserialize<T>(cached);
        }

        _logger.LogDebug("Redis 缓存未命中 {CacheKey}", key);
        var value = await factory();

        if (value != null)
        {
            var json = JsonSerializer.Serialize(value);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromMinutes(10)
            };
            await _cache.SetStringAsync(key, json, options);
        }

        return value;
    }

    public async Task RemoveAsync(string key) => await _cache.RemoveAsync(key);
}`,
            codeLanguage: "csharp",
            codeTitle: "内存缓存与 Redis 缓存",
            checkpoints: [
              "实现 GetOrCreateAsync 封装先查缓存、未命中再查库的模式",
              "内存缓存使用 IMemoryCache.TryGetValue",
              "Redis 缓存使用 IDistributedCache，值需序列化为 JSON",
              "两者接口保持一致，切换时只需改注册",
            ],
            reference:
              "内存缓存适合单机场景，Redis 适合多实例分布式场景。IDistributedCache 是抽象接口，可以无缝切换实现（内存、Redis、SQL Server 等）。",
          },
          {
            title: "添加健康检查端点，区分 live 与 ready",
            content: (
              <p>
                配置健康检查，暴露 <code>/health/live</code> 和 <code>/health/ready</code> 两个端点，对应 Kubernetes 的
                livenessProbe 和 readinessProbe。
              </p>
            ),
            code: `// 安装包
dotnet add package AspNetCore.HealthChecks.SqlServer
dotnet add package AspNetCore.HealthChecks.Redis

// Program.cs
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" })
    .AddSqlServer(
        builder.Configuration.GetConnectionString("Default")!,
        name: "sqlserver",
        failureStatus: HealthStatus.Degraded,
        tags: new[] { "ready" })
    .AddRedis(
        builder.Configuration.GetConnectionString("Redis")!,
        name: "redis",
        failureStatus: HealthStatus.Degraded,
        tags: new[] { "ready" });

var app = builder.Build();

// 存活检查 — 只检查进程是否活着
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("live")
});

// 就绪检查 — 检查依赖（数据库、Redis）是否就绪
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.TotalMilliseconds,
                description = e.Value.Description
            })
        });
        await context.Response.WriteAsync(result);
    }
});

// 自定义健康检查示例
public class DatabaseHealthCheck : IHealthCheck
{
    private readonly AppDbContext _context;

    public DatabaseHealthCheck(AppDbContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.Database.CanConnectAsync(cancellationToken);
            return HealthCheckResult.Healthy("数据库连接正常");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("数据库连接失败", ex);
        }
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "健康检查配置",
            checkpoints: [
              "区分 live 和 ready：live 只检查进程，ready 检查依赖",
              "用 tags 区分不同健康检查类型",
              "为数据库、Redis 等依赖配置失败状态（Degraded/Unhealthy）",
              "自定义 ResponseWriter 返回 JSON 格式的详细信息",
            ],
            reference:
              "live（存活）检查最简单，只回答进程是否还活着，失败时 K8s 会重启 Pod；ready（就绪）检查依赖是否就绪，未就绪时 K8s 不会把流量打进来。两者分开可以避免因依赖暂时不可用而频繁重启。",
          },
          {
            title: "排查并修复 N+1 查询",
            content: (
              <p>
                识别并修复 N+1 查询问题，使用 EF Core 的 <code>Include</code> 预加载关联数据。
              </p>
            ),
            code: `// ❌ 错误：N+1 查询
[HttpGet]
public async Task<IActionResult> GetUsers()
{
    var users = await _context.Users.ToListAsync();

    var result = new List<UserDto>();
    foreach (var user in users)
    {
        // 每个用户都查一次数据库 — N+1!
        var roles = await _context.Roles
            .Where(r => r.UserId == user.Id)
            .ToListAsync();

        result.Add(new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Roles = roles.Select(r => r.Name).ToList()
        });
    }

    return Ok(result);
}

// ✅ 正确：用 Include 预加载
[HttpGet]
public async Task<IActionResult> GetUsers()
{
    var users = await _context.Users
        .Include(u => u.Roles)  // 一次性加载所有关联
        .ToListAsync();

    var result = users.Select(u => new UserDto
    {
        Id = u.Id,
        Username = u.Username,
        Roles = u.Roles.Select(r => r.Name).ToList()
    });

    return Ok(result);
}

// 多层关联用 ThenInclude
var users = await _context.Users
    .Include(u => u.UserRoles)
        .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.Permissions)
    .ToListAsync();

// 如何排查 N+1
// 1. 启用 EF Core 日志查看生成的 SQL
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString);
    options.EnableSensitiveDataLogging();  // 开发环境启用
    options.LogTo(Console.WriteLine, LogLevel.Information);
});

// 2. 看日志中是否有重复的 SELECT 语句
// 错误示例会输出：
// SELECT * FROM Users
// SELECT * FROM Roles WHERE UserId = 1
// SELECT * FROM Roles WHERE UserId = 2
// SELECT * FROM Roles WHERE UserId = 3
// ...

// 正确示例会输出：
// SELECT u.*, r.*
// FROM Users u
// LEFT JOIN Roles r ON u.Id = r.UserId`,
            codeLanguage: "csharp",
            codeTitle: "修复 N+1 查询",
            checkpoints: [
              "识别 N+1：循环内调用数据库查询",
              "用 Include 预加载一对多关联",
              "用 ThenInclude 预加载多层关联",
              "启用 EF Core 日志查看生成的 SQL",
            ],
            reference:
              "N+1 查询是最常见的性能问题：查 N 个用户需要 1 次查用户 + N 次查角色。用 Include 可以一次性用 JOIN 加载所有数据，从 N+1 次查询降为 1 次。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经掌握了生产级的可观测性与性能优化。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                结构化日志用占位符（{"{Username}"}），不要字符串拼接
              </li>
              <li>
                Serilog 生产级配置：Enrich + Console + File（按天滚动）
              </li>
              <li>
                内存缓存单机，Redis 缓存分布式，IDistributedCache 抽象可无缝切换
              </li>
              <li>
                健康检查区分 live（进程存活）和 ready（依赖就绪）
              </li>
              <li>
                N+1 查询用 Include 预加载，启用 EF Core 日志排查 SQL
              </li>
              <li>
                永远不要用 .Result 或 .Wait() 同步等待异步方法
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能配置 Serilog、实现缓存服务、暴露健康检查端点、修复 N+1 查询。
            </p>
            <p className="text-sm text-gray-600">
              <strong>阶段验收问题：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
              <li>结构化日志相比字符串拼接有什么优势？</li>
              <li>live 和 ready 健康检查有什么区别？</li>
              <li>为什么不能用 .Result 同步等待异步方法？</li>
            </ul>
          </div>
        }
      />
    </LessonShell>
  );
};
