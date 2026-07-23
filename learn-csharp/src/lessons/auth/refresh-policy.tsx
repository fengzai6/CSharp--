import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
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
      <p>
        Access Token 短命（上一节约 15 分钟）；Refresh Token 更长，用来换新的
        Access，避免用户频繁输密码。对照前端：localStorage / 内存里存两份 token，axios
        拦截器在 401 时调 <code>/refresh</code> 再重试原请求。
      </p>
      <p>
        数据库<strong>只存哈希</strong>，明文只在创建时返回客户端一次。库被拖走时攻击者拿不到可用的
        refresh 明文；自己写「明文整串入库」等于把长期凭证裸放盘。
      </p>
      <LessonTable
        headers={["项", "Access Token", "Refresh Token"]}
        rows={[
          ["寿命", "短（分钟级）", "长（天级）"],
          ["放哪", "Authorization 头 / 内存", "安全存储；接口 body 提交刷新"],
          ["服务端存什么", "通常不存（无状态）", "只存哈希 + 过期/撤销字段"],
          ["被盗后果", "窗口短", "可一直换 Access → 必须可撤销、可轮换"],
        ]}
      />
      <LessonCode
        code={`public async Task<string> CreateRefreshTokenAsync(string userId)
{
    // 64 字节密码学随机数 → Base64 明文 token（只返回这一次）
    var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    // 入库的是 SHA256 哈希，不是 rawToken 本身
    var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

    _context.RefreshTokens.Add(new RefreshToken
    {
        UserId = userId,
        TokenHash = tokenHash,
        ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays)
    });

    await _context.SaveChangesAsync();
    return rawToken; // 明文只在这里给客户端
}`}
        language="csharp"
        title="CreateRefreshTokenAsync"
      />
      <LessonQuote>
        密码用慢哈希（PasswordHasher），Refresh Token 用快哈希（SHA256）即可：token
        本身是高熵随机串，撞库成本已经极高；慢哈希会拖垮每次刷新。两者目的不同，算法可以不同。
      </LessonQuote>

      <h4>刷新（轮换）步骤</h4>
      <p>
        轮换 = 每次刷新都作废旧 refresh、签发一对新 token。旧 token
        再来一次就失败。好处：泄漏后攻击者用一次就会和正主「撞车」，服务端可察觉异常（进阶可做重用检测，本节先做到撤销旧令牌）。
      </p>
      <ol>
        <li>对客户端传入的 refresh token 做同样哈希</li>
        <li>查询数据库是否存在</li>
        <li>检查是否过期、是否已撤销（<code>IsActive</code>）</li>
        <li>撤销旧 token（写 <code>RevokedAt</code>）</li>
        <li>签发新的 access token 和 refresh token</li>
      </ol>

      <LessonCode
        code={`public async Task<LoginResponse> RefreshAsync(string refreshToken)
{
    // 与创建时同一算法：明文 → SHA256 → Base64，再拿哈希去查库
    var tokenHash = Convert.ToBase64String(
        SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));

    var existingToken = await _context.RefreshTokens
        .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

    // IsActive 通常表示：未过期且 RevokedAt 为空
    if (existingToken is null || !existingToken.IsActive)
        throw new UnauthorizedAccessException("Refresh Token 无效");

    // 轮换关键步：立刻撤销旧 token，防止同一 refresh 被重复使用
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
        Refresh Token 不要明文保存到数据库；存储的是哈希，明文只在创建时返回一次。常见误判：把
        refresh 也做成「无状态 JWT 且永不落库」——泄漏后无法单点撤销，只能等过期。
      </LessonQuote>

      <h3>项目角色与权限授权</h3>
      <p>
        先把四个词分清，后面代码才不绕：
      </p>
      <LessonTable
        headers={["概念", "一句话", "TS / Nest 对照"]}
        rows={[
          [
            "Claim",
            "身份上的一条断言（键值对），如 sub、email、role",
            "JWT payload 字段；Nest 的 request.user 上属性",
          ],
          [
            "Role",
            "身份标签：Owner / Maintainer / Member",
            "@Roles('admin')；RBAC 里的角色名",
          ],
          [
            "Permission",
            "具体能力：能否删任务、能否管成员",
            "自定义权限码 + Guard；比角色更细",
          ],
          [
            "Policy",
            "命名好的授权规则集合（可含角色/claim/自定义逻辑）",
            "一组 Guard 条件起了名字；CASL 的 ability 规则类似",
          ],
          [
            "Handler",
            "实现某条 Policy/Requirement 的判断代码",
            "CanActivate 实现类；真正读 DB / 比 claim 的地方",
          ],
        ]}
      />
      <p>
        TaskHub 的角色主要是<strong>项目内</strong>角色：Owner、Maintainer、Member。角色存在数据库的{" "}
        <code>ProjectMember</code> 中，所以项目级操作不要只靠{" "}
        <code>[Authorize(Policy = ...)]</code>{" "}
        静态声明——那类装饰器看不到「这是哪一个
        Project」。正确路径：先拿到具体项目，再用{" "}
        <code>IAuthorizationService</code> 做资源级授权。
      </p>
      <LessonQuote>
        <code>[Authorize]</code> 适合回答「是否已登录」或「是否有全局 claim」。「是否是这个项目的
        Owner」「是否能管理这个项目的成员」都必须结合具体 <code>Project</code>{" "}
        和数据库成员关系判断。
      </LessonQuote>

      <h3>资源级授权</h3>
      <p>
        当权限取决于资源本身，例如「只有项目 Owner 才能归档项目或管理成员」，用{" "}
        <code>IAuthorizationService.AuthorizeAsync(user, resource, requirement)</code>
        。三件套：
      </p>
      <ul>
        <li>
          <strong>Requirement</strong>：标记「要满足什么规则」的空类型（如{" "}
          <code>ProjectOwnerRequirement</code>）
        </li>
        <li>
          <strong>Handler</strong>：读 <code>User</code> + 资源，查库后{" "}
          <code>Succeed</code> 或什么都不做
        </li>
        <li>
          <strong>Controller 调用</strong>：注入 <code>IAuthorizationService</code>
          ，失败返回 <code>Forbid()</code>（403）
        </li>
      </ul>
      <LessonCode
        code={`// Requirement：只是标记，本身通常没有字段
public class ProjectOwnerRequirement : IAuthorizationRequirement { }

// Handler：真正判断逻辑；第二个泛型参数 = 资源类型 Project
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
        Project project) // 框架把 Controller 传入的资源塞到这里
    {
        // 从已认证 User 取用户 Id（与签发时写入的 claim 对应）
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        // 资源级：必须同时匹配 project.Id + 当前用户 + Owner + 仍有效
        var isOwner = _context.ProjectMembers.Any(member =>
            member.ProjectId == project.Id &&
            member.UserId == userId &&
            member.Role == ProjectRole.Owner &&
            member.IsActive);

        if (isOwner)
        {
            context.Succeed(requirement); // 通过；不调用则视为未满足
        }

        return Task.CompletedTask;
    }
}`}
        language="csharp"
        title="Requirement 与 Handler"
      />
      <p>
        注册：Handler 必须进 DI，否则框架找不到实现，授权永远失败。
      </p>
      <LessonCode
        code={`// 把 Handler 注册为 IAuthorizationHandler；可注册多个，框架会依次尝试
builder.Services.AddScoped<IAuthorizationHandler, ProjectOwnerHandler>();`}
        language="csharp"
        title="注册 Handler"
      />
      <p>
        使用：先取资源（不存在 → 404），再授权（失败 → 403）。不要把「资源不存在」和「没权限」混成同一种状态码。
      </p>
      <LessonCode
        code={`var project = await _projectService.GetByIdAsync(id);
if (project is null)
    return NotFound(); // 404：没有这个资源

// User = ControllerBase 自带的当前 ClaimsPrincipal（认证中间件已填好）
var result = await _authorizationService.AuthorizeAsync(
    User,
    project,                       // 资源实例
    new ProjectOwnerRequirement()); // 要满足的规则

if (!result.Succeeded)
    return Forbid(); // 403：登录了但不是 Owner

// 通过后才执行业务（归档、改成员等）`}
        language="csharp"
        title="在 Controller 中授权"
      />
      <LessonQuote>
        401 vs 403：未登录 / token 无效 → 401；已登录但没权限 → 403。前端 axios
        拦截器里不要把 403 一律当「去登录」。
      </LessonQuote>

      <h3>SignalR 认证准备</h3>
      <p>
        SignalR 仍复用同一套 JWT 校验，但浏览器 WebSocket 很难像 fetch
        那样自定义 <code>Authorization</code> 头，常见做法是把 token 放查询参数{" "}
        <code>?access_token=...</code>。服务端在 JwtBearer 的{" "}
        <code>OnMessageReceived</code> 里，仅对 Hub 路径把 query 写回{" "}
        <code>context.Token</code>，后续校验与普通 API 相同。
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
                // 客户端连接时：/hubs/projects?access_token=eyJ...
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                // 只对 Hub 路径放开 query token，避免全站任意接口都接受 URL 里的 JWT
                if (!string.IsNullOrEmpty(accessToken)
                    && path.StartsWithSegments("/hubs/projects"))
                {
                    context.Token = accessToken; // 交给后续标准 JWT 校验
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
        code={`# -p：目录已存在不报错；Authorization 放资源级 Handler，与 Controllers/Services 并列
mkdir -p TaskHub.Api/Authorization`}
        language="bash"
        title="创建 Authorization 目录"
      />

      <h4>Models/Requests/RefreshRequest.cs</h4>
      <p>
        刷新接口 body：只收客户端保存的 refresh 明文。对照 TS{" "}
        <code>{`{ refreshToken: string }`}</code>。
      </p>
      <LessonCode
        code={`namespace TaskHub.Api.Models.Requests;

// POST /api/auth/refresh  body: { "refreshToken": "..." }
public record RefreshRequest(string RefreshToken);`}
        language="csharp"
        title="Models/Requests/RefreshRequest.cs"
      />

      <h4>更新 Services/TokenService.cs</h4>
      <p>
        在上一节 <code>TokenService</code> 末尾追加{" "}
        <code>CreateRefreshTokenAsync</code>。上节构造函数已注入{" "}
        <code>DbContext</code>，本节终于用到写库。
      </p>
      <LessonCode
        code={`// TokenService.cs 顶部 using 补充（RandomNumberGenerator / SHA256）：
using System.Security.Cryptography;

// 在 TokenService 类末尾添加（逻辑与上文 CreateRefreshTokenAsync 相同）：
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
    return rawToken; // 只返回明文一次
}`}
        language="csharp"
        title="TokenService.cs — 补充 CreateRefreshTokenAsync"
      />

      <h4>更新 Services/AuthService.cs</h4>
      <p>
        两处改动：① 登录成功真正签发 refresh；② 新增{" "}
        <code>RefreshAsync</code> 做轮换。别忘了{" "}
        <code>using System.Security.Cryptography;</code>（哈希用）。
      </p>
      <LessonCode
        code={`// 1. 把 LoginAsync 的 return 改为（去掉 string.Empty 占位）：
var refreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);
return new LoginResponse(accessToken, refreshToken);

// 2. 类末尾添加 RefreshAsync：
public async Task<LoginResponse> RefreshAsync(string refreshToken)
{
    // 与 TokenService 入库时同一套哈希，才能命中 TokenHash
    var tokenHash = Convert.ToBase64String(
        SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));

    var existingToken = await _context.RefreshTokens
        .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

    if (existingToken is null || !existingToken.IsActive)
        throw new UnauthorizedAccessException("Refresh Token 无效");

    // 先撤销旧的，再发新的（轮换）
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
        追加 <code>POST /api/auth/refresh</code>。通常{" "}
        <code>[AllowAnonymous]</code>
        （默认未加 <code>[Authorize]</code> 即可匿名）；凭 refresh 本身证明会话，不靠
        Access。
      </p>
      <LessonCode
        code={`// 加在 AuthController 里，与 login/register 并列：
// POST /api/auth/refresh
[HttpPost("refresh")]
public async Task<IActionResult> Refresh(RefreshRequest request)
{
    var response = await _auth.RefreshAsync(request.RefreshToken);
    // 返回新的 access + refresh；客户端应整对替换本地存储
    return Ok(response);
}`}
        language="csharp"
        title="AuthController.cs — 补充 Refresh 端点"
      />

      <h4>Authorization/ProjectOwnerHandler.cs</h4>
      <p>
        落盘完整文件：Requirement + Handler 可同文件。using 要齐——Claims、JWT
        claim 名、Authorization 基类、EF、模型。
      </p>
      <LessonCode
        code={`using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TaskHub.Core.Models;
using TaskHub.Infrastructure.Data;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Api.Authorization;

// 空标记：表示「调用方要求当前用户是该 Project 的 Owner」
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
        // 与上节 CreateAccessToken 写入的 claim 对齐
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
      <p>
        两处：① 注册 Handler 到 DI；② 在<strong>已有</strong>{" "}
        <code>AddJwtBearer</code> 的 <code>options</code> 里挂{" "}
        <code>Events</code>，不要再 <code>.AddJwtBearer</code> 一次（会盖掉或重复配置）。
      </p>
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
        // 仅 Hub：从 query 取 token 交给后续标准校验
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
        <li>
          Authentication 和 Authorization 分别回答什么问题？（你是谁 / 你能做什么）
        </li>
        <li>
          为什么 Refresh Token 只保存哈希？（库泄漏时攻击者拿不到可用明文；明文只返回一次）
        </li>
        <li>
          Access Token 和 Refresh Token 的生命周期应该如何设计？（短 Access + 长
          Refresh；刷新时轮换并撤销旧 Refresh）
        </li>
        <li>
          Role、Permission、Policy、Claim 分别承担什么职责？（身份标签 / 具体能力 /
          命名规则 / 身份断言）
        </li>
        <li>
          什么时候需要资源级授权？（权限取决于某个具体资源，如「这个项目的 Owner」）
        </li>
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
