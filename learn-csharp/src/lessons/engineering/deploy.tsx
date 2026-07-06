import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const EngineeringDeployLesson = ({
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
        本节聚焦发布相关能力：用内置速率限制保护接口，用 Docker
        容器化发布，并理解 AOT 的适用场景与限制。Docker 发布放在工程化的最后一步，AOT 则按需评估，不要把它当成所有 ASP.NET
        Core 项目的默认发布方式。
      </p>

      <h4>常见误区</h4>
      <ul>
        <li>Docker 镜像版本和 TargetFramework 不一致。</li>
        <li>把 AOT 当成所有 ASP.NET Core 项目的默认发布方式。</li>
      </ul>

      <h3>速率限制</h3>
      <p>
        .NET 7+ 内置 Rate Limiting，无需额外安装包。通过策略区分不同场景：全局默认限额、认证用户更高限额、登录端点更严格限额。
      </p>
      <LessonCode
        code={`// Program.cs
builder.Services.AddRateLimiter(rateLimiterOptions =>
{
    // 全局默认：每 IP 每秒 10 请求
    rateLimiterOptions.AddFixedWindowLimiter("default", options =>
    {
        options.Window = TimeSpan.FromSeconds(1);
        options.PermitLimit = 10;
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 5;
    });

    // 认证用户更高限额
    rateLimiterOptions.AddPolicy("authed", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.HttpContext.User.Identity?.Name ?? "",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 50,
                Window = TimeSpan.FromSeconds(1)
            }));

    // 登录端点：每 IP 每分钟 5 次
    rateLimiterOptions.AddPolicy("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));
});

app.UseRateLimiter();`}
        language="csharp"
        title="注册限流策略"
      />
      <p>
        在端点上用 <code>[EnableRateLimiting]</code> 指定要应用的策略：
      </p>
      <LessonCode
        code={`[HttpPost("login")]
[EnableRateLimiting("login")]  // 使用指定策略
public async Task<IActionResult> Login(LoginDto dto) { ... }`}
        language="csharp"
        title="在端点应用限流策略"
      />

      <h3>Docker</h3>
      <LessonQuote>
        镜像版本要和项目 <code>TargetFramework</code> 保持一致。下面以{" "}
        <code>net10.0</code> 为例；如果项目使用 <code>net8.0</code>，则把镜像标签改成{" "}
        <code>8.0</code>。
      </LessonQuote>
      <TeacherTask title="多阶段构建">
        <p>
          Dockerfile 用多阶段构建：在 <code>sdk</code> 镜像里 restore / build /
          publish，再把产物复制进体积更小的 <code>aspnet</code>
          运行时镜像，最终镜像不含 SDK，更小更安全。
        </p>
      </TeacherTask>
      <LessonCode
        code={`FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081  # Kestrel

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["MyApp.Api/MyApp.Api.csproj", "MyApp.Api/"]
COPY ["MyApp.Core/MyApp.Core.csproj", "MyApp.Core/"]
COPY ["MyApp.Infrastructure/MyApp.Infrastructure.csproj", "MyApp.Infrastructure/"]
RUN dotnet restore "MyApp.Api/MyApp.Api.csproj"
COPY . .
WORKDIR "/src/MyApp.Api"
RUN dotnet build "MyApp.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MyApp.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "MyApp.Api.dll"]`}
        language="dockerfile"
        title="多阶段构建 Dockerfile"
      />

      <h3>AOT（提前编译）</h3>
      <p>
        AOT 在发布时直接编译成原生机器码，启动更快、镜像更小，但有明显的兼容性限制。发布命令：
      </p>
      <LessonCode
        code={`# 完整发布命令
dotnet publish -c Release -r linux-x64 \\
    -p:PublishAot=true \\
    -p:StripSymbols=true \\
    -p:DebuggerSupport=false \\
    -o ./publish/aot`}
        language="bash"
        title="AOT 发布"
      />

      <h4>AOT 的限制</h4>
      <LessonTable
        headers={["不支持", "说明"]}
        rows={[
          ["动态加载程序集", "编译期必须知道所有类型"],
          ["某些反射场景", "需要 JsonSourceGenerator"],
          ["EF Core 动态查询", "需要静态配置"],
          ["表达式编译", "部分 LINQ 表达式不被支持"],
        ]}
      />
      <LessonTable
        headers={["需要谨慎评估", "说明"]}
        rows={[
          ["Minimal API", "最适合 AOT 的 ASP.NET Core 风格"],
          ["Controller", "可用性取决于反射、JSON 序列化和依赖库使用方式"],
          ["SignalR", "初学阶段不要作为 AOT 练习目标"],
          ["EF Core", "需要额外关注模型、查询和编译期限制"],
          ["Serilog", "sink 和 enrichers 需要逐个确认兼容性"],
        ]}
      />

      <h4>适用场景</h4>
      <ul>
        <li>✅ 微服务（小二进制文件、秒级启动）</li>
        <li>✅ 容器化部署（15-30MB vs 传统 200MB+）</li>
        <li>✅ Serverless（冷启动快）</li>
        <li>❌ 大型单体应用（编译慢、限制多）</li>
        <li>❌ 需要动态插件的系统</li>
      </ul>

      <h3>普通发布命令</h3>
      <LessonCode
        code={`# 普通发布（非 AOT）
dotnet publish MyApp.Api/MyApp.Api.csproj -c Release -o ./publish

# 发布 + 自包含（不含 .NET 运行时）
dotnet publish -c Release -r linux-x64 --self-contained -o ./publish`}
        language="bash"
        title="普通发布与自包含发布"
      />

      <h3>.NET 生态总览：常见 NuGet 包速查</h3>
      <LessonTable
        headers={["需求", "NestJS 包", ".NET 包"]}
        rows={[
          ["Web 框架", "@nestjs/core", "Microsoft.AspNetCore.App（内置）"],
          ["ORM", "@nestjs/typeorm", "Microsoft.EntityFrameworkCore"],
          ["数据库驱动", "pg", "Npgsql.EntityFrameworkCore.PostgreSQL"],
          ["Redis", "@nestjs-modules/ioredis", "StackExchange.Redis"],
          ["消息队列", "@nestjs/microservices", "MassTransit + RabbitMQ.Client"],
          ["JWT", "@nestjs/jwt", "System.IdentityModel.Tokens.Jwt"],
          ["验证", "class-validator", "FluentValidation"],
          ["Swagger", "@nestjs/swagger", "Swashbuckle.AspNetCore"],
          ["健康检查", "@nestjs/terminus", "AspNetCore.HealthChecks"],
          ["日志", "@nestjs/common Logger", "Microsoft.Extensions.Logging + Serilog"],
          ["缓存", "cache-manager", "Microsoft.Extensions.Caching"],
          ["速率限制", "@nestjs/throttler", "Microsoft.AspNetCore.RateLimiting"],
          ["测试", "Jest + supertest", "xUnit + Moq + FluentAssertions"],
          ["HTTP 客户端", "axios", "HttpClient（内置）+ Polly（重试/熔断）"],
        ]}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>为什么 Docker 镜像标签要和项目 TargetFramework 保持一致？</li>
        <li>AOT 适合哪些场景，为什么 SignalR 初学阶段不适合作为 AOT 练习目标？</li>
      </ul>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能说明限流、Docker 多阶段构建、普通发布和 AOT 发布各自解决的问题与适用边界。
          </p>
        }
        id="engineering-deploy-main"
        title="完成部署与限流主线"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>实战练习</h3>

      <LessonStep title="步骤 1：配置速率限制">
        <h4>任务目标</h4>
        <p>
          在项目中配置 .NET 内置速率限制，设置全局默认策略和登录端点专用策略。
        </p>

        <h4>详细步骤</h4>
        <ol>
          <li>
            在 <code>Program.cs</code> 中注册速率限制服务
          </li>
          <li>定义三个策略：default（全局默认）、authed（认证用户）、login（登录端点）</li>
          <li>添加 <code>UseRateLimiter</code> 中间件</li>
          <li>
            在登录端点上添加 <code>[EnableRateLimiting("login")]</code> 特性
          </li>
        </ol>

        <h4>代码示例</h4>
        <LessonCode
          code={`// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRateLimiter(rateLimiterOptions =>
{
    // 全局默认：每 IP 每秒 10 请求
    rateLimiterOptions.AddFixedWindowLimiter("default", options =>
    {
        options.Window = TimeSpan.FromSeconds(1);
        options.PermitLimit = 10;
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 5;
    });

    // 认证用户更高限额
    rateLimiterOptions.AddPolicy("authed", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.HttpContext.User.Identity?.Name ?? "",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 50,
                Window = TimeSpan.FromSeconds(1)
            }));

    // 登录端点：每 IP 每分钟 5 次
    rateLimiterOptions.AddPolicy("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));
});

var app = builder.Build();

app.UseRateLimiter();  // 在其他中间件之前
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();`}
          language="csharp"
          title="Program.cs"
        />

        <LessonCode
          code={`// Controllers/AuthController.cs
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting("login")]  // 应用登录限流策略
    public async Task<IActionResult> Login(LoginDto dto)
    {
        // 登录逻辑
        return Ok(new { token = "..." });
    }

    [HttpPost("register")]
    // 不加特性时使用全局默认策略
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        // 注册逻辑
        return Ok();
    }
}`}
          language="csharp"
          title="AuthController.cs"
        />

        <h4>检查点</h4>
        <ul>
          <li>使用 Postman 或 curl 快速发送多次登录请求，确认超过限额后返回 429 状态码</li>
          <li>检查响应头中是否包含 <code>Retry-After</code></li>
          <li>确认其他端点使用的是默认策略</li>
        </ul>

        <h4>参考答案</h4>
        <LessonCode
          code={`# 测试登录限流
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"username":"test","password":"test"}' \\
    -w "\\nStatus: %{http_code}\\n"
done

# 预期：前 5 次正常，后续请求返回 429 Too Many Requests`}
          language="bash"
          title="测试限流"
        />
      </LessonStep>

      <LessonStep title="步骤 2：编写多阶段 Dockerfile">
        <h4>任务目标</h4>
        <p>
          编写多阶段构建 Dockerfile，将项目容器化部署。
        </p>

        <h4>详细步骤</h4>
        <ol>
          <li>在项目根目录创建 <code>Dockerfile</code></li>
          <li>定义 4 个阶段：base（运行时）、build（构建）、publish（发布）、final（最终镜像）</li>
          <li>确保镜像版本与项目 <code>TargetFramework</code> 一致</li>
          <li>创建 <code>.dockerignore</code> 排除不需要的文件</li>
          <li>构建并运行容器</li>
        </ol>

        <h4>代码示例</h4>
        <LessonCode
          code={`FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# 先复制 csproj 文件，利用 Docker 层缓存
COPY ["MyApp.Api/MyApp.Api.csproj", "MyApp.Api/"]
COPY ["MyApp.Core/MyApp.Core.csproj", "MyApp.Core/"]
COPY ["MyApp.Infrastructure/MyApp.Infrastructure.csproj", "MyApp.Infrastructure/"]
RUN dotnet restore "MyApp.Api/MyApp.Api.csproj"
# 复制所有源代码
COPY . .
WORKDIR "/src/MyApp.Api"
RUN dotnet build "MyApp.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MyApp.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "MyApp.Api.dll"]`}
          language="dockerfile"
          title="Dockerfile"
        />

        <LessonCode
          code={`bin/
obj/
*.user
.vs/
.vscode/
*.suo
*.DotSettings.user
.idea/
node_modules/
publish/
*.log`}
          language="text"
          title=".dockerignore"
        />

        <h4>检查点</h4>
        <ul>
          <li>构建镜像成功，无依赖缺失或版本不匹配错误</li>
          <li>容器启动成功，能访问健康检查端点</li>
          <li>最终镜像大小合理（aspnet 运行时镜像约 200-300MB）</li>
          <li>确认镜像中不包含 SDK（通过 <code>docker exec</code> 检查）</li>
        </ul>

        <h4>参考答案</h4>
        <LessonCode
          code={`# 构建镜像
docker build -t myapp:1.0 .

# 查看镜像大小
docker images myapp:1.0

# 运行容器
docker run -d -p 8080:8080 --name myapp-container myapp:1.0

# 测试应用
curl http://localhost:8080/health

# 查看日志
docker logs myapp-container

# 进入容器检查（确认无 SDK）
docker exec -it myapp-container bash
ls /usr/share/dotnet  # 应该只有运行时，没有 sdk 目录

# 停止并删除容器
docker stop myapp-container
docker rm myapp-container`}
          language="bash"
          title="Docker 操作命令"
        />
      </LessonStep>

      <LessonStep title="步骤 3：尝试 AOT 发布">
        <h4>任务目标</h4>
        <p>
          使用 AOT 发布项目，对比启动性能和镜像大小。
        </p>

        <h4>详细步骤</h4>
        <ol>
          <li>
            在 <code>.csproj</code> 中添加 AOT 配置
          </li>
          <li>执行 AOT 发布命令</li>
          <li>创建 AOT 专用 Dockerfile</li>
          <li>构建 AOT 镜像并对比性能和大小</li>
        </ol>

        <h4>代码示例</h4>
        <LessonCode
          code={`<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>

    <!-- AOT 配置 -->
    <PublishAot>true</PublishAot>
    <StripSymbols>true</StripSymbols>
    <IlcOptimizationPreference>Speed</IlcOptimizationPreference>
  </PropertyGroup>
</Project>`}
          language="xml"
          title="MyApp.Api.csproj"
        />

        <LessonCode
          code={`# 本地 AOT 发布
dotnet publish -c Release -r linux-x64 \\
    -p:PublishAot=true \\
    -p:StripSymbols=true \\
    -p:DebuggerSupport=false \\
    -o ./publish/aot

# 查看发布产物
ls -lh ./publish/aot/MyApp.Api
# 预期：单个原生可执行文件，15-30MB

# 测试启动时间
time ./publish/aot/MyApp.Api &
# 预期：冷启动 < 100ms`}
          language="bash"
          title="AOT 发布命令"
        />

        <LessonCode
          code={`# AOT Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["MyApp.Api/MyApp.Api.csproj", "MyApp.Api/"]
COPY ["MyApp.Core/MyApp.Core.csproj", "MyApp.Core/"]
COPY ["MyApp.Infrastructure/MyApp.Infrastructure.csproj", "MyApp.Infrastructure/"]
RUN dotnet restore "MyApp.Api/MyApp.Api.csproj"
COPY . .
WORKDIR "/src/MyApp.Api"
RUN dotnet publish "MyApp.Api.csproj" -c Release -r linux-x64 \\
    -p:PublishAot=true \\
    -p:StripSymbols=true \\
    -o /app/publish

# 使用更小的运行时基础镜像
FROM mcr.microsoft.com/dotnet/runtime-deps:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
# AOT 生成的是原生可执行文件，不是 .dll
ENTRYPOINT ["./MyApp.Api"]`}
          language="dockerfile"
          title="Dockerfile.aot"
        />

        <h4>检查点</h4>
        <ul>
          <li>AOT 发布成功，无兼容性警告或错误</li>
          <li>启动时间明显快于普通发布（从秒级降到毫秒级）</li>
          <li>镜像大小显著减小（从 200MB+ 降到 30-50MB）</li>
          <li>应用功能正常，特别是 JSON 序列化和反射场景</li>
        </ul>

        <h4>参考答案</h4>
        <LessonCode
          code={`# 普通发布对比
dotnet publish -c Release -o ./publish/normal
ls -lh ./publish/normal  # 查看文件大小

# AOT 发布对比
dotnet publish -c Release -r linux-x64 -p:PublishAot=true -o ./publish/aot
ls -lh ./publish/aot

# 构建两个镜像对比
docker build -t myapp:normal -f Dockerfile .
docker build -t myapp:aot -f Dockerfile.aot .

# 对比镜像大小
docker images | grep myapp
# 预期：
# myapp:normal  250-300MB
# myapp:aot     30-50MB

# 对比启动时间
docker run -d -p 8080:8080 --name myapp-normal myapp:normal
docker logs myapp-normal  # 查看启动日志时间戳

docker run -d -p 8081:8080 --name myapp-aot myapp:aot
docker logs myapp-aot  # 对比启动速度

# 压测对比内存占用
docker stats myapp-normal myapp-aot`}
          language="bash"
          title="对比测试"
        />

        <LessonQuote>
          如果遇到 AOT 兼容性问题（如 JSON 序列化），需要使用 Source Generator：
        </LessonQuote>

        <LessonCode
          code={`// 使用 JsonSerializerContext 支持 AOT
[JsonSerializable(typeof(LoginDto))]
[JsonSerializable(typeof(UserDto))]
public partial class AppJsonSerializerContext : JsonSerializerContext { }

// Program.cs 中配置
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
});`}
          language="csharp"
          title="AOT JSON 序列化配置"
        />
      </LessonStep>

      <h3>总结与要点回顾</h3>
      <ul>
        <li>
          <strong>速率限制</strong>：.NET 内置 Rate Limiting，通过策略区分不同场景，用 <code>[EnableRateLimiting]</code> 在端点级别应用
        </li>
        <li>
          <strong>Docker 多阶段构建</strong>：在 sdk 镜像中构建，将产物复制到 aspnet 运行时镜像，最终镜像不含 SDK，更小更安全
        </li>
        <li>
          <strong>镜像版本一致性</strong>：镜像标签必须与项目 TargetFramework 一致，避免运行时不兼容
        </li>
        <li>
          <strong>AOT 适用场景</strong>：微服务、容器化、Serverless 场景受益明显；大型单体、动态插件系统不适合
        </li>
        <li>
          <strong>AOT 限制</strong>：不支持动态加载程序集、部分反射场景需要 Source Generator、EF Core 和 SignalR 需要额外关注兼容性
        </li>
        <li>
          <strong>性能对比</strong>：AOT 启动从秒级降到毫秒级，镜像从 200MB+ 降到 30-50MB，但编译时间更长
        </li>
      </ul>
    </LessonShell>
  );
};
