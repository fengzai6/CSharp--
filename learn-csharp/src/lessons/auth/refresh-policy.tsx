import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  TeacherTask,
} from "@/components/lesson-ui";

export const AuthRefreshPolicyLesson = ({
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
        学完本节后，你应该能实现 Refresh Token 哈希存储与轮换，用 Role /
        Permission 建模 RBAC，并用 Policy 和 AuthorizationHandler
        处理角色、权限以及资源级授权。
      </p>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          上一节已经完成登录和 Access Token。本节继续在 TaskHub 的 <code>ProjectMember</code> 模型上实现 Refresh Token 轮换、项目角色策略和资源级授权。
        </p>
      </TeacherTask>

      <TeacherTask title="老师提示">
        <p>
          只用角色做所有权限判断会导致业务权限难扩展。角色（Role）描述身份，权限（Permission）描述具体能力，复杂场景再用
          Policy 和 Handler 组合判断。
        </p>
      </TeacherTask>

      <h3>Refresh Token</h3>
      <p>Refresh token 建议只把哈希存入数据库，明文只返回给客户端一次。</p>
      <LessonCode
        code={`public async Task<string> CreateRefreshTokenAsync(string userId)
{
    var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

    _context.RefreshTokens.Add(new RefreshToken
    {
        UserId = userId,
        TokenHash = tokenHash,
        ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays)
    });

    await _context.SaveChangesAsync();
    return rawToken;
}`}
        language="csharp"
        title="CreateRefreshTokenAsync"
      />

      <h4>刷新（轮换）步骤</h4>
      <ol>
        <li>对客户端传入的 refresh token 做同样哈希</li>
        <li>查询数据库是否存在</li>
        <li>检查是否过期、是否已撤销</li>
        <li>撤销旧 token</li>
        <li>签发新的 access token 和 refresh token</li>
      </ol>

      <LessonCode
        code={`public async Task<LoginResponse> RefreshAsync(string refreshToken)
{
    var tokenHash = Convert.ToBase64String(
        SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));

    var existingToken = await _context.RefreshTokens
        .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

    if (existingToken is null || !existingToken.IsActive)
        throw new UnauthorizedAccessException("Refresh Token 无效");

    // 撤销旧 token
    existingToken.RevokedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();

    var user = await _context.Users.FirstAsync(u => u.Id == existingToken.UserId);
    var accessToken = CreateAccessToken(user);
    var newRefreshToken = await CreateRefreshTokenAsync(user.Id);

    return new LoginResponse(accessToken, newRefreshToken);
}`}
        language="csharp"
        title="RefreshAsync — 轮换并撤销旧 token"
      />

      <LessonQuote>
        Refresh Token
        不要明文保存到数据库；存储的是哈希，明文只在创建时返回一次。
      </LessonQuote>

      <h3>项目角色与权限授权</h3>
      <p>
        TaskHub 的角色主要是项目内角色：Owner、Maintainer、Member。角色存在数据库的 <code>ProjectMember</code> 中，所以项目级操作不要只靠 <code>[Authorize(Policy = ...)]</code> 静态声明；先拿到具体项目，再用 <code>IAuthorizationService</code> 做资源级授权。
      </p>
      <LessonQuote>
        <code>[Authorize]</code> 适合回答“是否已登录”或“是否有全局 claim”。“是否是这个项目的 Owner”“是否能管理这个项目的成员”都必须结合具体 <code>Project</code> 和数据库成员关系判断。
      </LessonQuote>

      <h3>资源级授权</h3>
      <p>
        当权限取决于资源本身，例如“只有项目 Owner 才能归档项目或管理成员”，使用{" "}
        <code>IAuthorizationService</code>。
      </p>
      <LessonCode
        code={`public class ProjectOwnerRequirement : IAuthorizationRequirement { }

public class ProjectOwnerHandler : AuthorizationHandler<ProjectOwnerRequirement, Project>
{
    private readonly TaskHubDbContext _context;

    public ProjectOwnerHandler(TaskHubDbContext context)
    {
        _context = context;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ProjectOwnerRequirement requirement,
        Project project)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        var isOwner = _context.ProjectMembers.Any(member =>
            member.ProjectId == project.Id &&
            member.UserId == userId &&
            member.Role == ProjectRole.Owner &&
            member.IsActive);

        if (isOwner)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}`}
        language="csharp"
        title="Requirement 与 Handler"
      />
      <p>注册：</p>
      <LessonCode
        code={`builder.Services.AddScoped<IAuthorizationHandler, ProjectOwnerHandler>();`}
        language="csharp"
        title="注册 Handler"
      />
      <p>使用：</p>
      <LessonCode
        code={`var project = await _projectService.GetByIdAsync(id);
if (project is null)
    return NotFound();

var result = await _authorizationService.AuthorizeAsync(
    User,
    project,
    new ProjectOwnerRequirement());

if (!result.Succeeded)
    return Forbid();`}
        language="csharp"
        title="在 Controller 中授权"
      />

      <h3>SignalR 认证准备</h3>
      <p>
        SignalR 仍然复用 JWT 认证，但浏览器 WebSocket 常把 token 放在查询参数：
      </p>
      <LessonCode
        code={`// 在上一节已有的 AddJwtBearer 配置中追加 Events（不是另起一段）：
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("Jwt");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            ClockSkew = TimeSpan.FromMinutes(1),
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["Secret"]!))
        };

        // SignalR：浏览器 WebSocket 从查询参数取 token
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken)
                    && path.StartsWithSegments("/hubs/projects"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });`}
        language="csharp"
        title="从查询参数读取 token"
      />
      <LessonQuote>
        安全提醒：查询参数方式只应在 HTTPS 下使用。浏览器 WebSocket / SSE
        的限制让它成为常见做法，但服务器、代理或监控系统可能记录 query
        string，生产环境要避免把完整 URL 写入日志。
      </LessonQuote>

      <h3>写入 TaskHub.Api — 刷新令牌与资源级授权</h3>
      <p>
        上面的代码片段需要落盘到已有的文件中。本节会修改上一节已创建的 <code>TokenService</code>、<code>AuthService</code>、<code>AuthController</code>，并新增资源级授权 Handler。
      </p>

      <LessonCode
        code={`mkdir -p TaskHub.Api/Authorization`}
        language="bash"
        title="创建 Authorization 目录"
      />

      <h4>Models/Requests/RefreshRequest.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Api.Models.Requests;

public record RefreshRequest(string RefreshToken);`}
        language="csharp"
        title="Models/Requests/RefreshRequest.cs"
      />

      <h4>更新 Services/TokenService.cs</h4>
      <p>
        在上一节的 <code>TokenService</code> 末尾添加 <code>CreateRefreshTokenAsync</code> 方法，并补上需要的 using：
      </p>
      <LessonCode
        code={`// TokenService.cs 顶部 using 补充：
using System.Security.Cryptography;

// 在 TokenService 类末尾添加：
public async Task<string> CreateRefreshTokenAsync(string userId)
{
    var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

    _context.RefreshTokens.Add(new RefreshToken
    {
        UserId = userId,
        TokenHash = tokenHash,
        ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays)
    });

    await _context.SaveChangesAsync();
    return rawToken;
}`}
        language="csharp"
        title="TokenService.cs — 补充 CreateRefreshTokenAsync"
      />

      <h4>更新 Services/AuthService.cs</h4>
      <p>
        在 <code>AuthService</code> 中添加 <code>RefreshAsync</code> 方法，并把上一节的 <code>LoginAsync</code> 中 <code>RefreshToken: string.Empty</code> 改为真正签发 refresh token：
      </p>
      <LessonCode
        code={`// 1. 把 LoginAsync 的 return 改为：
var refreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);
return new LoginResponse(accessToken, refreshToken);

// 2. 在 AuthService 类末尾添加 RefreshAsync（AuthService.cs 顶部补 using System.Security.Cryptography;）：
public async Task<LoginResponse> RefreshAsync(string refreshToken)
{
    var tokenHash = Convert.ToBase64String(
        SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));

    var existingToken = await _context.RefreshTokens
        .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

    if (existingToken is null || !existingToken.IsActive)
        throw new UnauthorizedAccessException("Refresh Token 无效");

    existingToken.RevokedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();

    var user = await _context.Users.FirstAsync(u => u.Id == existingToken.UserId);
    var newAccessToken = _tokenService.CreateAccessToken(user);
    var newRefreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);

    return new LoginResponse(newAccessToken, newRefreshToken);
}`}
        language="csharp"
        title="AuthService.cs — 补充 RefreshAsync 并修改 LoginAsync"
      />

      <h4>更新 Controllers/AuthController.cs</h4>
      <p>
        在 <code>AuthController</code> 中添加刷新端点：
      </p>
      <LessonCode
        code={`[HttpPost("refresh")]
public async Task<IActionResult> Refresh(RefreshRequest request)
{
    var response = await _auth.RefreshAsync(request.RefreshToken);
    return Ok(response);
}`}
        language="csharp"
        title="AuthController.cs — 补充 Refresh 端点"
      />

      <h4>Authorization/ProjectOwnerHandler.cs</h4>
      <LessonCode
        code={`using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TaskHub.Core.Models;
using TaskHub.Infrastructure.Data;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Api.Authorization;

public class ProjectOwnerRequirement : IAuthorizationRequirement { }

public class ProjectOwnerHandler : AuthorizationHandler<ProjectOwnerRequirement, Project>
{
    private readonly TaskHubDbContext _context;

    public ProjectOwnerHandler(TaskHubDbContext context)
    {
        _context = context;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ProjectOwnerRequirement requirement,
        Project project)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        var isOwner = _context.ProjectMembers.Any(member =>
            member.ProjectId == project.Id &&
            member.UserId == userId &&
            member.Role == ProjectRole.Owner &&
            member.IsActive);

        if (isOwner)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}`}
        language="csharp"
        title="Authorization/ProjectOwnerHandler.cs"
      />

      <h4>更新 Program.cs</h4>
      <LessonCode
        code={`// 顶部 using 补充：
using Microsoft.AspNetCore.Authorization;
using TaskHub.Api.Authorization;

// builder.Services 部分补充：
builder.Services.AddScoped<IAuthorizationHandler, ProjectOwnerHandler>();

// 在上一节已有的 AddJwtBearer(options => { ... }) 内追加 Events（不要另起一段）：
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;

        if (!string.IsNullOrEmpty(accessToken)
            && path.StartsWithSegments("/hubs/projects"))
        {
            context.Token = accessToken;
        }

        return Task.CompletedTask;
    }
};`}
        language="csharp"
        title="Program.cs — 注册资源级授权 Handler + SignalR token"
      />

      <p>
        写完运行 <code>dotnet build TaskHub.Api</code> 确认编译通过。
        如果编译失败，先检查：<code>TokenService.cs</code> 是否补了 <code>using System.Security.Cryptography;</code>、<code>ProjectOwnerHandler.cs</code> 是否写了所有 using、<code>Program.cs</code> 是否补了 <code>using Microsoft.AspNetCore.Authorization;</code> 并注册了 <code>ProjectOwnerHandler</code>，以及 <code>OnMessageReceived</code> 是否写在已有的 <code>AddJwtBearer</code> 配置内。
      </p>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已在 <code>TokenService</code> 补充 <code>CreateRefreshTokenAsync</code>、在 <code>AuthService</code> 补充 <code>RefreshAsync</code> 并修改 <code>LoginAsync</code> 真正签发 refresh token、在 <code>AuthController</code> 补充 <code>/api/auth/refresh</code> 端点、创建 <code>ProjectOwnerHandler</code> 并注册到 <code>Program.cs</code>，且 JWT Bearer 已配置 <code>OnMessageReceived</code> 读取 <code>/hubs/projects</code> 的 <code>access_token</code>，<code>dotnet build TaskHub.Api</code> 编译通过。
          </p>
        }
        id="auth-refresh-policy-write-files"
        title="将刷新令牌与资源级授权写入 TaskHub.Api"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>Authentication 和 Authorization 分别回答什么问题？</li>
        <li>为什么 Refresh Token 只保存哈希？</li>
        <li>Access Token 和 Refresh Token 的生命周期应该如何设计？</li>
        <li>Role、Permission、Policy、Claim 分别承担什么职责？</li>
        <li>什么时候需要资源级授权？</li>
      </ul>

      <TeacherTask title="Phase 3 主线任务">
        <p>
          在 TaskHub 中完成 Phase 3：实现完整认证授权 — JWT 登录、Refresh Token
          轮换、项目角色/权限策略、资源级授权，并为 SignalR 项目通知 Hub 复用同一套 JWT 身份。
        </p>
      </TeacherTask>
    </LessonShell>
  );
};
