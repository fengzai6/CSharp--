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
          用消息模板的占位符（如 <code>{"{ProjectId}"}</code>）而不是字符串拼接。这样日志平台能把
          ProjectId、WorkItemId 当成可检索的结构化字段，而不是一段死文本。异常日志把{" "}
          <code>ex</code> 作为第一个参数传入，会自动包含堆栈。
        </p>
      </TeacherTask>
      <LessonCode
        code={`public class WorkItemService
{
    private readonly ILogger<WorkItemService> _logger;

    public WorkItemService(ILogger<WorkItemService> logger)
    {
        _logger = logger;
    }

    public async Task<WorkItemSummaryDto> MoveAsync(string workItemId, WorkItemStatus status, string operatorId)
    {
        // 结构化日志 — 不需要拼接字符串
        _logger.LogInformation("Moving work item {WorkItemId} to {Status} by {OperatorId}",
            workItemId, status, operatorId);

        try
        {
            // ... 业务逻辑
            var item = await MoveCoreAsync(workItemId, status, operatorId);
            _logger.LogInformation("Work item {WorkItemId} moved to {Status}", item.Id, item.Status);
            return item;
        }
        catch (Exception ex)
        {
            // 异常日志 — 自动包含堆栈
            _logger.LogError(ex, "Failed to move work item {WorkItemId}", workItemId);
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
        code={`dotnet add TaskHub.Api/TaskHub.Api.csproj package Serilog.AspNetCore
dotnet add TaskHub.Api/TaskHub.Api.csproj package Serilog.Sinks.Console
dotnet add TaskHub.Api/TaskHub.Api.csproj package Serilog.Sinks.File
dotnet add TaskHub.Api/TaskHub.Api.csproj package Serilog.Sinks.Seq
dotnet add TaskHub.Api/TaskHub.Api.csproj package Serilog.Enrichers.Environment`}
        language="bash"
        title="安装 Serilog"
      />
      <p>
        <code>Serilog</code> 是日志核心库，<code>Sinks</code>{" "}
        决定日志输出到哪里：Console 用于终端，File 用于本地文件，Seq 用于集中日志平台。只装核心库还不能把日志写到目标位置。
      </p>
      <p>
        生产级配置通过 Enrich 注入机器名、环境名、应用名等上下文，并按天滚动文件、限制保留天数：
      </p>
      <LessonCode
        code={`using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()        // 机器名
    .Enrich.WithEnvironmentName()    // 环境名（Dev/Prod）
    .Enrich.WithProperty("Application", "TaskHub")  // 应用名
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
        code={`dotnet add TaskHub.Api/TaskHub.Api.csproj package Microsoft.Extensions.Caching.Memory`}
        language="bash"
        title="安装内存缓存"
      />
      <p>
        内存缓存运行在当前应用进程里，速度快、接入简单，但多实例之间不共享。它适合缓存单实例内可重复计算或可重新加载的数据。
      </p>
      <p>
        通过 <code>IMemoryCache</code> 实现“先查缓存、未命中再查库并回填”的常见模式：
      </p>
      <LessonCode
        code={`// 独立示意类型，不落到 TaskHub 主线
public record ProjectDashboardDto(string ProjectId, int TotalTasks, int CompletedTasks);
public interface IProjectQueryService
{
    Task<ProjectDashboardDto?> GetDashboardAsync(string projectId);
}

public class InMemoryCacheService
{
    private readonly IMemoryCache _cache;
    private readonly IProjectQueryService _projectQueryService;

    public InMemoryCacheService(IMemoryCache cache, IProjectQueryService projectQueryService)
    {
        _cache = cache;
        _projectQueryService = projectQueryService;
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
    public async Task<ProjectDashboardDto?> GetProjectDashboardWithCacheAsync(string projectId)
    {
        var cacheKey = $"project:{projectId}:dashboard";

        // 先查缓存
        if (_cache.TryGetValue(cacheKey, out ProjectDashboardDto? cachedDashboard))
            return cachedDashboard;

        // 查数据库
        var dashboard = await _projectQueryService.GetDashboardAsync(projectId);

        if (dashboard != null)
            _cache.Set(cacheKey, dashboard, TimeSpan.FromMinutes(5)); // 缓存 5 分钟

        return dashboard;
    }
}`}
        language="csharp"
        title="IMemoryCache 缓存服务"
      />

      <h4>分布式缓存（Redis）</h4>
      <LessonCode
        code={`dotnet add TaskHub.Api/TaskHub.Api.csproj package Microsoft.Extensions.Caching.StackExchangeRedis`}
        language="bash"
        title="安装 Redis 缓存"
      />
      <p>
        Redis 缓存适合多实例共享缓存状态。安装包只是让 ASP.NET Core 能注册{" "}
        <code>IDistributedCache</code> 的 Redis 实现，真正的 Redis 地址仍然来自配置。
      </p>
      <p>
        注册 Redis 后，业务层换用 <code>IDistributedCache</code>，使用方式与内存缓存高度一致，差别是值需要序列化为字符串：
      </p>

      <LessonCode
        code={`{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=taskhub;Username=postgres;Password=postgres",
    "Redis": "localhost:6379"
  }
}`}
        language="json"
        title="appsettings.json（按需添加 Redis）"
      />

      <LessonQuote>
        没有启动 Redis 时，不要注册 <code>AddStackExchangeRedisCache</code> 和健康检查里的 <code>AddRedis</code>，否则启动会直接失败。先完成内存缓存，再按需切换到 Redis。
      </LessonQuote>

      <LessonCode
        code={`// Program.cs
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "TaskHub:";  // 前缀隔离
});

// 使用（复用上面定义的 ProjectDashboardDto 和 IProjectQueryService）
public class ProjectDashboardService
{
    private readonly IDistributedCache _cache;
    private readonly IProjectQueryService _projectQueryService;

    public ProjectDashboardService(IDistributedCache cache, IProjectQueryService projectQueryService)
    {
        _cache = cache;
        _projectQueryService = projectQueryService;
    }

    public async Task<ProjectDashboardDto?> GetWithCacheAsync(string projectId)
    {
        var cacheKey = $"project:{projectId}:dashboard";

        var cached = await _cache.GetStringAsync(cacheKey);
        if (cached != null)
            return JsonSerializer.Deserialize<ProjectDashboardDto>(cached);

        var dashboard = await _projectQueryService.GetDashboardAsync(projectId);

        if (dashboard != null)
        {
            var json = JsonSerializer.Serialize(dashboard);
            await _cache.SetStringAsync(
                cacheKey,
                json,
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
        }

        return dashboard;
    }
}`}
        language="csharp"
        title="IDistributedCache（Redis）"
      />

      <h3>健康检查</h3>
      <LessonCode
        code={`dotnet add TaskHub.Api/TaskHub.Api.csproj package AspNetCore.HealthChecks.Uris
dotnet add TaskHub.Api/TaskHub.Api.csproj package AspNetCore.HealthChecks.NpgSql
dotnet add TaskHub.Api/TaskHub.Api.csproj package AspNetCore.HealthChecks.Redis`}
        language="bash"
        title="安装健康检查包"
      />
      <p>
        健康检查按依赖类型安装扩展包：URI 用于外部 HTTP 服务，NpgSql 用于 TaskHub 的 PostgreSQL 数据库，Redis 用于缓存。装包只是提供检查器，是否检查、失败算降级还是不健康，要在注册时明确配置。
      </p>
      <p>注册时为每个依赖设置失败状态（Degraded / Unhealthy）：</p>
      <LessonCode
        code={`// Program.cs — 顶部 using：
using Microsoft.Extensions.Diagnostics.HealthChecks;

// builder.Services 部分：
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("Default"),
        name: "postgresql",
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
      "name": "postgresql",
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

      <h3>HTTP 客户端</h3>
      <p>
        调外部服务不要手动 <code>new HttpClient()</code>。ASP.NET Core 推荐用{" "}
        <code>IHttpClientFactory</code> 或 typed client 统一管理连接池、超时、基础地址和默认请求头。
      </p>
      <LessonCode
        code={`// 外部服务返回的用户资料 DTO（独立示例，不落到 TaskHub 主线）
public record UserProfile(string Id, string Username, string Email);

builder.Services.AddHttpClient<IProfileClient, ProfileClient>(client =>
{
    client.BaseAddress = new Uri("https://profile.example.com");
    client.Timeout = TimeSpan.FromSeconds(5);
});

public interface IProfileClient
{
    Task<UserProfile?> GetProfileAsync(string userId, CancellationToken cancellationToken);
}

public class ProfileClient : IProfileClient
{
    private readonly HttpClient _httpClient;

    public ProfileClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<UserProfile?> GetProfileAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        return await _httpClient.GetFromJsonAsync<UserProfile>(
            $"/api/profiles/{userId}",
            cancellationToken);
    }
}`}
        language="csharp"
        title="Typed HttpClient"
      />
      <LessonQuote>
        对外部依赖的重试、超时、熔断要按接口重要性配置，不要无脑重试所有 POST 请求。幂等 GET
        更适合重试；创建订单、扣款这类操作要先明确幂等键。
      </LessonQuote>

      <h3>性能优化</h3>
      <h4>避免 N+1 查询（排查方法）</h4>
      <p>
        排查 N+1 的基本方法是启用 EF Core 日志观察生成的 SQL。详细说明和修复代码见 EF Core 关系建模章节。
      </p>
      <LessonCode
        code={`// 启用 EF Core 日志查看生成的 SQL（开发环境）
builder.Services.AddDbContext<TaskHubDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging();  // 开发环境启用
    options.LogTo(Console.WriteLine, LogLevel.Information);
});

// 排查：看日志中是否有重复 SELECT 语句
// ❌ N+1 会输出：
//   SELECT * FROM WorkItems
//   SELECT * FROM WorkItemComments WHERE WorkItemId = 1
//   SELECT * FROM WorkItemComments WHERE WorkItemId = 2
// ✅ 正确会输出（一次性 JOIN）：
//   SELECT w.*, c.* FROM WorkItems w
//   LEFT JOIN WorkItemComments c ON w.Id = c.WorkItemId`}
        language="csharp"
        title="排查 N+1 查询"
      />

      <h4>分页限制</h4>
      <LessonCode
        code={`[HttpGet]
public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
{
    if (pageSize < 1 || pageSize > 100)  // 最大 100
        return BadRequest("pageSize 必须在 1-100 之间");

    var items = await _workItemService.GetProjectWorkItemsAsync(projectId, page, pageSize);
    return Ok(new {
        data = items.Data,
        pagination = new { page, pageSize, total = items.Total }
    });
}`}
        language="csharp"
        title="限制分页大小"
      />

      <h4>异步最佳实践</h4>
      <LessonQuote>
        永远不要用 <code>.Result</code> 或 <code>.Wait()</code> 同步等待 Task，详细说明见 C# 核心章节。
      </LessonQuote>

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
dotnet add TaskHub.Api/TaskHub.Api.csproj package Serilog.AspNetCore
dotnet add TaskHub.Api/TaskHub.Api.csproj package Serilog.Sinks.Console
dotnet add TaskHub.Api/TaskHub.Api.csproj package Serilog.Sinks.File
dotnet add TaskHub.Api/TaskHub.Api.csproj package Serilog.Enrichers.Environment

// Program.cs
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .Enrich.WithProperty("Application", "TaskHub")
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
public class WorkItemService
{
    private readonly ILogger<WorkItemService> _logger;
    private readonly IWorkItemRepository _workItemRepository;

    public WorkItemService(ILogger<WorkItemService> logger, IWorkItemRepository workItemRepository)
    {
        _logger = logger;
        _workItemRepository = workItemRepository;
    }

    public async Task MoveAsync(string workItemId, WorkItemStatus status, string operatorId)
    {
        _logger.LogInformation("移动任务 {WorkItemId} 到 {Status}，操作人 {OperatorId}",
            workItemId, status, operatorId);

        try
        {
            // ... 业务逻辑（省略已有依赖注入）
            await Task.CompletedTask;
            _logger.LogInformation("任务 {WorkItemId} 状态变更成功", workItemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "任务 {WorkItemId} 状态变更失败", workItemId);
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
              "结构化日志的优势：日志平台（如 Seq、ELK）可以把 WorkItemId、ProjectId 当成可检索的字段，而不是死文本。异常日志把 ex 作为第一个参数传入会自动包含堆栈。",
          },
          {
            title: "实现内存缓存服务，再切换到 Redis",
            content: (
              <p>
                先实现内存缓存服务，掌握"先查缓存、未命中再查库并回填"模式，再切换到 Redis 分布式缓存。
              </p>
            ),
            code: `// 1. 内存缓存
dotnet add TaskHub.Api/TaskHub.Api.csproj package Microsoft.Extensions.Caching.Memory

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
public async Task<ProjectDashboardDto?> GetDashboardAsync(string projectId)
{
    var cacheKey = $"project:{projectId}:dashboard";
    return await _cacheService.GetOrCreateAsync(
        cacheKey,
        () => _projectQueryService.GetDashboardAsync(projectId),
        TimeSpan.FromMinutes(5));
}

// 2. 切换到 Redis
dotnet add TaskHub.Api/TaskHub.Api.csproj package Microsoft.Extensions.Caching.StackExchangeRedis

// Program.cs
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "TaskHub:";
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
dotnet add TaskHub.Api/TaskHub.Api.csproj package AspNetCore.HealthChecks.NpgSql
dotnet add TaskHub.Api/TaskHub.Api.csproj package AspNetCore.HealthChecks.Redis

// Program.cs 顶部 using：
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text.Json;

// Program.cs
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" })
    .AddNpgSql(
        builder.Configuration.GetConnectionString("Default")!,
        name: "postgresql",
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
    private readonly TaskHubDbContext _context;

    public DatabaseHealthCheck(TaskHubDbContext context)
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
public async Task<IActionResult> GetWorkItems(string projectId)
{
    var items = await _context.WorkItems
        .Where(item => item.ProjectId == projectId)
        .ToListAsync();

    var result = new List<WorkItemDetailDto>();
    foreach (var item in items)
    {
        // 每个任务都查一次数据库 — N+1!
        var comments = await _context.WorkItemComments
            .Where(comment => comment.WorkItemId == item.Id)
            .ToListAsync();

        result.Add(new WorkItemDetailDto
        {
            Id = item.Id,
            Title = item.Title,
            CommentCount = comments.Count
        });
    }

    return Ok(result);
}

// ✅ 正确：用 Include 预加载
[HttpGet]
public async Task<IActionResult> GetWorkItems(string projectId)
{
    var items = await _context.WorkItems
        .Where(item => item.ProjectId == projectId)
        .Include(item => item.Comments)  // 一次性加载关联评论
        .ToListAsync();

    var result = items.Select(item => new WorkItemDetailDto
    {
        Id = item.Id,
        Title = item.Title,
        CommentCount = item.Comments.Count
    });

    return Ok(result);
}

// 多层关联用 ThenInclude
var items = await _context.WorkItems
    .Include(item => item.Comments)
        .ThenInclude(comment => comment.Author)
    .ToListAsync();

// 如何排查 N+1
// 1. 启用 EF Core 日志查看生成的 SQL
builder.Services.AddDbContext<TaskHubDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging();  // 开发环境启用
    options.LogTo(Console.WriteLine, LogLevel.Information);
});

// 2. 看日志中是否有重复的 SELECT 语句
// 错误示例会输出：
// SELECT * FROM WorkItems
// SELECT * FROM WorkItemComments WHERE WorkItemId = 1
// SELECT * FROM WorkItemComments WHERE WorkItemId = 2
// SELECT * FROM WorkItemComments WHERE WorkItemId = 3
// ...

// 正确示例会输出：
// SELECT w.*, c.*
// FROM WorkItems w
// LEFT JOIN WorkItemComments c ON w.Id = c.WorkItemId`,
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
