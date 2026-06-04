import type { ILessonBlock } from "@/components/lesson-ui";

export const engineeringObservabilityBlocks = [
  {
    "level": 2,
    "text": "日志",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "与 NestJS Logger 的对照",
    "type": "heading"
  },
  {
    "code": "NestJS Logger                   .NET ILogger\n─────────────────               ──────────────\nthis.logger.log()               _logger.LogInformation()\nthis.logger.error()             _logger.LogError()\nthis.logger.warn()              _logger.LogWarning()\nthis.logger.debug()             _logger.LogDebug()\nthis.logger.verbose()           _logger.LogTrace()",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "使用方式",
    "type": "heading"
  },
  {
    "code": "public class UserService\n{\n    private readonly ILogger<UserService> _logger;\n\n    public UserService(ILogger<UserService> logger)\n    {\n        _logger = logger;\n    }\n\n    public async Task CreateAsync(User user)\n    {\n        // 结构化日志 — 不需要拼接字符串\n        _logger.LogInformation(\"Creating user {Username} with email {Email}\",\n            user.Username, user.Email);\n\n        try\n        {\n            // ... 业务逻辑\n            _logger.LogInformation(\"User {UserId} created successfully\", user.Id);\n        }\n        catch (Exception ex)\n        {\n            // 异常日志 — 自动包含堆栈\n            _logger.LogError(ex, \"Failed to create user {Username}\", user.Username);\n            throw;\n        }\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "输出配置",
    "type": "heading"
  },
  {
    "code": "// appsettings.json\n{\n  \"Logging\": {\n    \"LogLevel\": {\n      \"Default\": \"Information\",\n      \"Microsoft.AspNetCore\": \"Warning\",\n      \"Microsoft.EntityFrameworkCore\": \"Warning\"\n    },\n    \"Console\": {\n      \"LogLevel\": {\n        \"Default\": \"Debug\"\n      }\n    },\n    \"File\": {\n      \"Path\": \"logs/log-.txt\",\n      \"RollingInterval\": \"Day\"\n    }\n  }\n}",
    "language": "json",
    "title": "json 示例",
    "type": "code"
  },
  {
    "code": "// appsettings.Development.json\n{\n  \"Logging\": {\n    \"LogLevel\": {\n      \"Default\": \"Debug\",\n      \"Microsoft\": \"Warning\"\n    }\n  }\n}",
    "language": "json",
    "title": "json 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "使用 Serilog（推荐，生产级）",
    "type": "heading"
  },
  {
    "code": "dotnet add package Serilog\ndotnet add package Serilog.Sinks.Console\ndotnet add package Serilog.Sinks.File\ndotnet add package Serilog.Sinks.Seq   # 集中日志平台",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "level": 4,
    "text": "生产级配置",
    "type": "heading"
  },
  {
    "code": "Log.Logger = new LoggerConfiguration()\n    .MinimumLevel.Debug()\n    .MinimumLevel.Override(\"Microsoft\", LogEventLevel.Warning)\n    .MinimumLevel.Override(\"Microsoft.EntityFrameworkCore\", LogEventLevel.Warning)\n    .Enrich.FromLogContext()\n    .Enrich.WithMachineName()        // 机器名\n    .Enrich.WithEnvironmentName()    // 环境名（Dev/Prod）\n    .Enrich.WithProperty(\"Application\", \"MyApp\")  // 应用名\n    .WriteTo.Console(\n        outputTemplate: \"[{Timestamp:HH:mm:ss} {Level:u3} {SourceContext}] {Message:lj}{NewLine}{Exception}\")\n    .WriteTo.File(\n        \"logs/log-.txt\",\n        rollingInterval: RollingInterval.Day,\n        retainedFileCountLimit: 30)  // 保留 30 天\n    .CreateLogger();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 4,
    "text": "最小配置",
    "type": "heading"
  },
  {
    "code": "Log.Logger = new LoggerConfiguration()\n    .MinimumLevel.Debug()\n    .Enrich.FromLogContext()\n    .WriteTo.Console()\n    .WriteTo.File(\"logs/log-.txt\", rollingInterval: RollingInterval.Day)\n    .CreateLogger();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "finally { Log.CloseAndFlush(); }",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "缓存",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "内存缓存 — 对应你的 CacheService",
    "type": "heading"
  },
  {
    "code": "dotnet add package Microsoft.Extensions.Caching.Memory",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "code": "public class InMemoryCacheService\n{\n    private readonly IMemoryCache _cache;\n\n    public InMemoryCacheService(IMemoryCache cache)\n    {\n        _cache = cache;\n    }\n\n    public T? Get<T>(string key)\n    {\n        return _cache.TryGetValue(key, out T? value) ? value : default;\n    }\n\n    public void Set<T>(string key, T value, TimeSpan? expiry = null)\n    {\n        var options = new MemoryCacheEntryOptions();\n        if (expiry.HasValue)\n        {\n            options.AbsoluteExpirationRelativeToNow = expiry.Value;\n        }\n        else\n        {\n            options.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);\n        }\n\n        _cache.Set(key, value, options);\n    }\n\n    public void Remove(string key)\n    {\n        _cache.Remove(key);\n    }\n\n    // 带缓存的查询 — 类似 TypeORM 缓存\n    public async Task<User?> GetUserWithCacheAsync(string id)\n    {\n        var cacheKey = $\"user:{id}\";\n\n        // 先查缓存\n        if (_cache.TryGetValue(cacheKey, out User? cachedUser))\n        {\n            return cachedUser;\n        }\n\n        // 查数据库\n        var user = await _userRepository.GetByIdAsync(id);\n\n        if (user != null)\n        {\n            // 缓存 10 分钟\n            _cache.Set(cacheKey, user, TimeSpan.FromMinutes(10));\n        }\n\n        return user;\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "分布式缓存（Redis）",
    "type": "heading"
  },
  {
    "code": "dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "code": "// Program.cs\nbuilder.Services.AddStackExchangeRedisCache(options =>\n{\n    options.Configuration = builder.Configuration.GetConnectionString(\"Redis\");\n    options.InstanceName = \"MyApp:\";  // 前缀隔离\n});\n\n// 使用 — 与 IMemoryCache 完全相同\npublic class UserService\n{\n    private readonly IDistributedCache _cache;\n\n    public UserService(IDistributedCache cache)\n    {\n        _cache = cache;\n    }\n\n    public async Task<User?> GetWithCacheAsync(string id)\n    {\n        var cacheKey = $\"user:{id}\";\n\n        var cached = await _cache.GetStringAsync(cacheKey);\n        if (cached != null)\n        {\n            return JsonSerializer.Deserialize<User>(cached);\n        }\n\n        var user = await _userRepository.GetByIdAsync(id);\n\n        if (user != null)\n        {\n            var json = JsonSerializer.Serialize(user);\n            await _cache.SetStringAsync(\n                cacheKey,\n                json,\n                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });\n        }\n\n        return user;\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "健康检查",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "与 NestJS Health Checks 对照",
    "type": "heading"
  },
  {
    "code": "dotnet add package AspNetCore.HealthChecks.Uris\ndotnet add package AspNetCore.HealthChecks.SqlServer\ndotnet add package AspNetCore.HealthChecks.Redis",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "code": "// Program.cs\nbuilder.Services.AddHealthChecks()\n    .AddSqlServer(\n        builder.Configuration.GetConnectionString(\"Default\"),\n        name: \"sqlserver\",\n        failureStatus: HealthStatus.Degraded)\n    .AddRedis(\n        builder.Configuration.GetConnectionString(\"Redis\"),\n        name: \"redis\",\n        failureStatus: HealthStatus.Degraded)\n    .AddUrlGroup(\n        new Uri(\"https://api.example.com/health\"),\n        name: \"external-api\",\n        failureStatus: HealthStatus.Unhealthy);",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "code": "// 暴露端点\napp.MapHealthChecks(\"/health\");              // 简易健康检查\napp.MapHealthChecks(\"/health/ready\", ...);   // 就绪检查\napp.MapHealthChecks(\"/health/live\", ...);    // 存活检查（最简单）",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "code": "// 响应\n{\n  \"status\": \"Healthy\",\n  \"checks\": [\n    {\n      \"name\": \"sqlserver\",\n      \"description\": null,\n      \"status\": \"Healthy\",\n      \"duration\": \"00:00:00.0023182\"\n    },\n    {\n      \"name\": \"redis\",\n      \"description\": null,\n      \"status\": \"Healthy\",\n      \"duration\": \"00:00:00.0012345\"\n    }\n  ]\n}",
    "language": "json",
    "title": "json 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "Swagger / OpenAPI",
    "type": "heading"
  },
  {
    "text": "OpenAPI 是 API 描述规范，Swagger UI 是常见展示工具。`.NET 9+` 可以用 `Microsoft.AspNetCore.OpenApi` 生成文档；需要交互式 UI 时，再接入 Swashbuckle、Scalar 等工具。",
    "type": "quote"
  },
  {
    "level": 3,
    "text": ".NET 9+ 内置 OpenAPI",
    "type": "heading"
  },
  {
    "code": "builder.Services.AddOpenApi();\n\nvar app = builder.Build();\n\nif (app.Environment.IsDevelopment())\n{\n    app.MapOpenApi();\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "文档版本控制",
    "type": "heading"
  },
  {
    "code": "builder.Services.AddEndpointsApiExplorer();\nbuilder.Services.AddSwaggerGen(c =>\n{\n    c.SwaggerDoc(\"v1\", new OpenApiInfo\n    {\n        Title = \"My API\",\n        Version = \"v1\",\n        Description = \"后端 API v1\",\n        Contact = new OpenApiContact { Name = \"Support\", Email = \"support@example.com\" }\n    });\n\n    c.SwaggerDoc(\"v2\", new OpenApiInfo\n    {\n        Title = \"My API\",\n        Version = \"v2\",\n        Description = \"后端 API v2（新功能）\"\n    });\n\n    // 认证\n    c.AddSecurityDefinition(\"Bearer\", new OpenApiSecurityScheme\n    {\n        Name = \"Authorization\",\n        Type = SecuritySchemeType.ApiKey,\n        Scheme = \"Bearer\",\n        BearerFormat = \"JWT\",\n        In = ParameterLocation.Header,\n        Description = \"Bearer {token}\"\n    });\n\n    c.AddSecurityRequirement(new OpenApiSecurityRequirement\n    {\n        { new OpenApiSecurityScheme\n        {\n            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = \"Bearer\" }\n        }, Array.Empty<string>() }\n    });\n});",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  }
] satisfies ILessonBlock[];
