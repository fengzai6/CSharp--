import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const EngineeringDeployLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
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

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="engineering-deploy-checklist"
        items={[
          "配置 .NET 内置速率限制，为登录端点单独设置策略",
          "编写多阶段构建 Dockerfile 并容器化部署",
          "尝试 AOT 发布，对比启动性能和镜像大小",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
