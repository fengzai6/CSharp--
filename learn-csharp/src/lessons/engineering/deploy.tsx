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
        .NET 7+ 内置 Rate Limiting，无需额外安装包——对应 NestJS 的{" "}
        <code>@nestjs/throttler</code>，或前端网关/Nginx 的限流规则。通过命名策略区分场景：全局默认限额、认证用户更高限额、登录端点更严格限额。
      </p>
      <p>
        核心概念：
        <strong>Partition（分区键）</strong>
        决定「按什么计数」（IP、用户名）；
        <strong>FixedWindow</strong>
        是固定时间窗（如每秒/每分钟重置计数），像「这一分钟最多 N
        次」；超限默认返回 <code>429 Too Many Requests</code>。
      </p>
      <LessonCode
        code={`// Program.cs 顶部 using：
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

// builder.Services 部分：
builder.Services.AddRateLimiter(rateLimiterOptions =>
{
    // AddPolicy 只是注册命名策略，不会自动全局生效
    // GetFixedWindowLimiter(partitionKey, optionsFactory)
    //   partitionKey：按谁计数（这里按 IP）
    //   Window / PermitLimit：窗口内允许的请求数
    //   QueueLimit：窗口满后最多排队几个；0 = 直接 429
    rateLimiterOptions.AddPolicy("default", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip",
            _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromSeconds(1),
                PermitLimit = 10,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 5
            }));

    // 认证用户更高限额（partition 换成用户名，已登录才能用）
    rateLimiterOptions.AddPolicy("authed", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.User.Identity?.Name ?? "",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 50,
                Window = TimeSpan.FromSeconds(1)
            }));

    // 登录端点：每 IP 每分钟 5 次（防暴力破解）
    rateLimiterOptions.AddPolicy("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// 顺序重要：依赖 User 身份的策略必须放在 UseAuthentication 之后
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

// 把 default 策略绑到所有 Controller 端点（否则 AddPolicy 等于白注册）
app.MapControllers().RequireRateLimiting("default");`}
        language="csharp"
        title="注册限流策略"
      />
      <LessonQuote>
        <code>AddPolicy("default", ...)</code> 只是注册命名策略，不会自动成为全局默认。
        Controller 项目可以在 <code>MapControllers()</code> 后用 <code>RequireRateLimiting("default")</code>{" "}
        明确绑定；登录接口再用 <code>[EnableRateLimiting("login")]</code> 覆盖为更严格策略。
      </LessonQuote>
      <p>
        在端点上用 <code>[EnableRateLimiting]</code>{" "}
        指定策略（覆盖 MapControllers 上的 default）：
      </p>
      <LessonCode
        code={`// Controllers/AuthController.cs 顶部 using 追加：
using Microsoft.AspNetCore.RateLimiting;

[HttpPost("login")]
[EnableRateLimiting("login")]  // 覆盖 default，改用更严的 login 策略
public async Task<IActionResult> Login(LoginRequest dto) { ... }`}
        language="csharp"
        title="在端点应用限流策略"
      />

      <h3>Docker</h3>
      <LessonQuote>
        镜像版本要和项目 <code>TargetFramework</code> 保持一致。下面以{" "}
        <code>net10.0</code> 为例；如果项目使用 <code>net8.0</code>，则把镜像标签改成{" "}
        <code>8.0</code>。标签对不上时，运行时可能直接起不来或缺少 API。
      </LessonQuote>
      <TeacherTask title="多阶段构建">
        <p>
          Dockerfile 用多阶段构建：在 <code>sdk</code> 镜像里 restore / build /
          publish，再把产物复制进体积更小的 <code>aspnet</code>
          运行时镜像，最终镜像不含 SDK，更小更安全。前端同学可类比：用 Node
          镜像 <code>npm run build</code>，再用 nginx 镜像只拷{" "}
          <code>dist/</code>。
        </p>
      </TeacherTask>
      <LessonTable
        headers={["阶段", "基础镜像", "干什么"]}
        rows={[
          [
            "base",
            "aspnet:10.0",
            "只含运行时；给 final 复用，体积小",
          ],
          [
            "build",
            "sdk:10.0",
            "restore + build；含编译器，最终镜像不要它",
          ],
          [
            "publish",
            "继承 build",
            "dotnet publish 产出可部署文件",
          ],
          [
            "final",
            "继承 base",
            "只 COPY 发布产物 + ENTRYPOINT",
          ],
        ]}
      />
      <LessonCode
        code={`# base：运行时基底（无 SDK）
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# build：SDK 镜像，负责编译
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# 先只 COPY csproj → restore：依赖不变时命中 Docker 层缓存（≈ 先 copy package.json 再 npm i）
COPY ["TaskHub.Api/TaskHub.Api.csproj", "TaskHub.Api/"]
COPY ["TaskHub.Core/TaskHub.Core.csproj", "TaskHub.Core/"]
COPY ["TaskHub.Infrastructure/TaskHub.Infrastructure.csproj", "TaskHub.Infrastructure/"]
RUN dotnet restore "TaskHub.Api/TaskHub.Api.csproj"
# 再 COPY 源码（源码变了不会让 restore 层失效）
COPY . .
WORKDIR "/src/TaskHub.Api"
RUN dotnet build "TaskHub.Api.csproj" -c Release -o /app/build

# publish：从 build 继续，产出发布目录
FROM build AS publish
# UseAppHost=false：不生成原生 apphost 可执行文件，容器里用 dotnet xxx.dll 启动即可
RUN dotnet publish "TaskHub.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# final：只拿运行时 + 发布产物
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# 监听所有网卡 8080（容器内；宿主机映射用 -p）
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "TaskHub.Api.dll"]`}
        language="dockerfile"
        title="多阶段构建 Dockerfile"
      />
      <p>
        关键 flag / 指令副作用：
      </p>
      <ul>
        <li>
          <code>dotnet restore</code>：还原 NuGet 包到本地缓存；失败通常是源或 csproj
          路径问题。
        </li>
        <li>
          <code>-c Release</code>：发布配置，开启优化、关掉部分调试符号。
        </li>
        <li>
          <code>/p:UseAppHost=false</code>
          ：不生成平台相关的启动壳，减小产物；容器内用{" "}
          <code>dotnet TaskHub.Api.dll</code> 启动。
        </li>
        <li>
          <code>ASPNETCORE_URLS=http://+:8080</code>
          ：绑定 0.0.0.0:8080，否则容器外 <code>-p 8080:8080</code>{" "}
          可能连不上（默认有时只听 localhost）。
        </li>
        <li>
          <code>ASPNETCORE_ENVIRONMENT=Production</code>
          ：走生产配置（更少详细错误页、读 Production 配置覆盖）。
        </li>
      </ul>

      <h3>AOT（提前编译）</h3>
      <p>
        AOT（Ahead-of-Time）在<strong>发布时</strong>
        把 IL 编成原生机器码，产物是原生可执行文件，不再依赖目标机上的{" "}
        <code>dotnet</code> 主机跑 DLL。收益：启动更快、镜像更小；代价：编译更慢、反射/动态加载受限。前端无完全对应；可粗比「构建期把 JS
        编成原生扩展」——发布形态变了，不是日常{" "}
        <code>dotnet run</code> 的替代。
      </p>
      <LessonCode
        code={`# 完整发布命令（确认库兼容后再用；不是开发期默认）
dotnet publish TaskHub.Api/TaskHub.Api.csproj -c Release -r linux-x64 \\
    -p:PublishAot=true \\
    -p:StripSymbols=true \\
    -p:DebuggerSupport=false \\
    -o ./publish/aot`}
        language="bash"
        title="AOT 发布"
      />

      <p>参数拆解：</p>
      <ul>
        <li>
          <code>dotnet publish</code>：生成可部署产物（≈{" "}
          <code>npm run build</code> 出 dist），不是 <code>dotnet run</code>。
        </li>
        <li>
          <code>-c Release</code>：发布配置。
        </li>
        <li>
          <code>-r linux-x64</code>
          ：RID（Runtime Identifier），指定目标 OS/CPU；AOT
          必须交叉编译到明确平台，换机器架构要重发。
        </li>
        <li>
          <code>-p:PublishAot=true</code>：打开原生 AOT。
        </li>
        <li>
          <code>-p:StripSymbols=true</code>
          ：剥离调试符号，体积更小，排错信息更少。
        </li>
        <li>
          <code>-p:DebuggerSupport=false</code>
          ：去掉调试器支持，进一步瘦身。
        </li>
        <li>
          <code>-o ./publish/aot</code>：输出目录。
        </li>
      </ul>

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
      <LessonQuote>
        边界：TaskHub 这种带 EF Core + 可能 SignalR 的教学项目，默认用普通{" "}
        <code>dotnet publish</code> / 多阶段 Docker 即可。AOT
        是「确认兼容后的优化项」，不是工程化必选项。
      </LessonQuote>

      <h3>普通发布命令</h3>
      <LessonCode
        code={`# 框架依赖发布（默认）：产物是 DLL，目标机需安装匹配的 .NET Runtime
dotnet publish TaskHub.Api/TaskHub.Api.csproj -c Release -o ./publish

# 自包含发布：Runtime 打进产物，目标机可不预装 .NET；体积明显变大
# -r 指定目标平台；--self-contained 打开自包含
dotnet publish TaskHub.Api/TaskHub.Api.csproj -c Release -r linux-x64 --self-contained -o ./publish`}
        language="bash"
        title="普通发布与自包含发布"
      />

      <p>
        三种发布形态对照：
      </p>
      <LessonTable
        headers={["形态", "产物", "目标机要求", "何时用"]}
        rows={[
          [
            "框架依赖（默认 publish）",
            "DLL + 依赖",
            "需装 .NET Runtime",
            "容器用 aspnet 镜像时首选",
          ],
          [
            "自包含 --self-contained",
            "含 Runtime 的目录/可执行文件",
            "可不装 Runtime",
            "裸机/无 Runtime 环境",
          ],
          [
            "AOT PublishAot",
            "原生可执行文件",
            "无 .NET 主机依赖",
            "冷启动/体积敏感且库兼容",
          ],
        ]}
      />
      <p>
        初学阶段先掌握框架依赖 + Docker 多阶段；自包含和 AOT
        是部署约束出现后再评估。
      </p>

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
          code={`// 在已有 Program.cs 上追加，不要整文件覆盖。

// 顶部 using 追加：
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

// builder.Services 部分追加：
builder.Services.AddRateLimiter(rateLimiterOptions =>
{
    // 默认策略：每 IP 每秒 10 请求。命名策略需要绑定到端点才会生效。
    rateLimiterOptions.AddPolicy("default", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip",
            _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromSeconds(1),
                PermitLimit = 10,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 5
            }));

    // 认证用户更高限额
    rateLimiterOptions.AddPolicy("authed", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.User.Identity?.Name ?? "",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 50,
                Window = TimeSpan.FromSeconds(1)
            }));

    // 登录端点：每 IP 每分钟 5 次
    rateLimiterOptions.AddPolicy("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// var app = builder.Build(); 之后，认证中间件附近追加/调整：
app.UseAuthentication();
app.UseRateLimiter();  // 依赖用户身份的限流策略要放在认证之后
app.UseAuthorization();

// 已有 MapControllers 处改为：
app.MapControllers().RequireRateLimiting("default");`}
          language="csharp"
          title="Program.cs — 追加限流（勿整文件覆盖）"
        />

        <LessonCode
          code={`// Controllers/AuthController.cs
// 顶部 using 追加（不要整文件覆盖 Auth 章已有实现）：
using Microsoft.AspNetCore.RateLimiting;

// 在已有 Login 端点上追加特性，保留 AuthService 注入与真实登录逻辑：
[HttpPost("login")]
[EnableRateLimiting("login")]
public async Task<IActionResult> Login(LoginRequest request)
{
    // 保留 Auth 章已有实现：var response = await _auth.LoginAsync(request);
}`}
          language="csharp"
          title="AuthController.cs — 仅追加限流特性"
        />

        <h4>检查点</h4>
        <ul>
          <li>使用 Postman 或 curl 快速发送多次登录请求，确认超过限额后返回 429 状态码</li>
          <li>检查响应头中是否包含 <code>Retry-After</code></li>
          <li>确认其他 Controller 端点通过 <code>RequireRateLimiting("default")</code> 使用默认策略</li>
        </ul>

        <h4>参考答案</h4>
        <LessonCode
          code={`# 测试登录限流
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"email":"test@example.com","password":"test"}' \\
    -w "\\nStatus: %{http_code}\\n"
done

# 预期：前 5 次正常，后续请求返回 429 Too Many Requests`}
          language="bash"
          title="测试限流"
        />
        <p>
          这段脚本用循环连续请求登录端点，目的是触发登录策略的每分钟限制。
          <code>-H</code> 设置 JSON 请求头，<code>-d</code> 发送请求体，
          <code>-w</code> 打印状态码。只看响应内容不够，限流是否生效主要看状态码是否变成
          <code>429</code>。
        </p>
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
COPY ["TaskHub.Api/TaskHub.Api.csproj", "TaskHub.Api/"]
COPY ["TaskHub.Core/TaskHub.Core.csproj", "TaskHub.Core/"]
COPY ["TaskHub.Infrastructure/TaskHub.Infrastructure.csproj", "TaskHub.Infrastructure/"]
RUN dotnet restore "TaskHub.Api/TaskHub.Api.csproj"
# 复制所有源代码
COPY . .
WORKDIR "/src/TaskHub.Api"
RUN dotnet build "TaskHub.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TaskHub.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "TaskHub.Api.dll"]`}
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
docker build -t taskhub:1.0 .

# 查看镜像大小
docker images taskhub:1.0

# 运行容器
docker run -d -p 8080:8080 --name taskhub-container taskhub:1.0

# 测试应用
curl http://localhost:8080/health/live

# 查看日志
docker logs taskhub-container

# 进入容器检查（确认无 SDK）
docker exec -it taskhub-container sh
ls /usr/share/dotnet  # 应该只有运行时，没有 sdk 目录

# 停止并删除容器
docker stop taskhub-container
docker rm taskhub-container`}
          language="bash"
          title="Docker 操作命令"
        />
        <p>
          这组命令按真实发布排查顺序排列：先构建镜像，再运行容器，再访问健康检查确认应用可用，最后看日志和进入容器验证最终镜像只包含运行时。删除容器是清理步骤，避免下次运行同名容器失败。
        </p>
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
          title="TaskHub.Api.csproj"
        />

        <LessonCode
          code={`# 本地 AOT 发布
dotnet publish TaskHub.Api/TaskHub.Api.csproj -c Release -r linux-x64 \\
    -p:PublishAot=true \\
    -p:StripSymbols=true \\
    -p:DebuggerSupport=false \\
    -o ./publish/aot

# 查看发布产物
ls -lh ./publish/aot/TaskHub.Api
# 预期：单个原生可执行文件，15-30MB

# 测试启动时间
time ./publish/aot/TaskHub.Api &
# 预期：冷启动 < 100ms`}
          language="bash"
          title="AOT 发布命令"
        />

        <p>
          这段不是为了马上替换普通发布，而是用同一个项目观察 AOT 的产物形态和启动时间。看到单个原生可执行文件，说明产物不再依赖
          <code>dotnet TaskHub.Api.dll</code> 这种运行方式；如果发布失败，优先检查反射、JSON 序列化和第三方库兼容性。
        </p>

        <LessonCode
          code={`# AOT Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["TaskHub.Api/TaskHub.Api.csproj", "TaskHub.Api/"]
COPY ["TaskHub.Core/TaskHub.Core.csproj", "TaskHub.Core/"]
COPY ["TaskHub.Infrastructure/TaskHub.Infrastructure.csproj", "TaskHub.Infrastructure/"]
RUN dotnet restore "TaskHub.Api/TaskHub.Api.csproj"
COPY . .
WORKDIR "/src/TaskHub.Api"
RUN dotnet publish "TaskHub.Api.csproj" -c Release -r linux-x64 \\
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
ENTRYPOINT ["./TaskHub.Api"]`}
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
dotnet publish TaskHub.Api/TaskHub.Api.csproj -c Release -o ./publish/normal
ls -lh ./publish/normal  # 查看文件大小

# AOT 发布对比
dotnet publish TaskHub.Api/TaskHub.Api.csproj -c Release -r linux-x64 -p:PublishAot=true -o ./publish/aot
ls -lh ./publish/aot

# 构建两个镜像对比
docker build -t taskhub:normal -f Dockerfile .
docker build -t taskhub:aot -f Dockerfile.aot .

# 对比镜像大小
docker images | grep taskhub
# 预期：
# taskhub:normal  250-300MB
# taskhub:aot     30-50MB

# 对比启动时间
docker run -d -p 8080:8080 --name taskhub-normal taskhub:normal
docker logs taskhub-normal  # 查看启动日志时间戳

docker run -d -p 8081:8080 --name taskhub-aot taskhub:aot
docker logs taskhub-aot  # 对比启动速度

# 压测对比内存占用
docker stats taskhub-normal taskhub-aot`}
          language="bash"
          title="对比测试"
        />

        <p>
          对比测试关注三个指标：发布产物大小、容器镜像大小和启动时间。AOT 的价值不是“更高级”，而是在冷启动、镜像体积或资源占用成为瓶颈时，用兼容性成本换运行期收益。
        </p>

        <LessonQuote>
          如果遇到 AOT 兼容性问题（如 JSON 序列化），需要使用 Source Generator：
        </LessonQuote>

        <LessonCode
          code={`// TaskHub.Api/AppJsonSerializerContext.cs
using System.Text.Json.Serialization;
using TaskHub.Api.Models.Requests;
using TaskHub.Core.Models;

[JsonSerializable(typeof(LoginRequest))]
[JsonSerializable(typeof(WorkItemSummaryDto))]
public partial class AppJsonSerializerContext : JsonSerializerContext { }

// Program.cs 中配置（Controller 项目）
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.TypeInfoResolverChain.Insert(
        0, AppJsonSerializerContext.Default);
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
