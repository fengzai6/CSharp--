import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  TeacherTask,
} from "@/components/lesson-ui";

export const AuthRefreshPolicyLesson = () => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能实现 Refresh Token 哈希存储与轮换，用 Role /
        Permission 建模 RBAC，并用 Policy 和 AuthorizationHandler
        处理角色、权限以及资源级授权。
      </p>

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

      <LessonQuote>
        Refresh Token
        不要明文保存到数据库；存储的是哈希，明文只在创建时返回一次。
      </LessonQuote>

      <h3>Role 授权</h3>
      <p>角色授权用 Policy 包装，便于在 Controller 上声明：</p>
      <LessonCode
        code={`builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));
});`}
        language="csharp"
        title="注册 AdminOnly Policy"
      />
      <LessonCode
        code={`[Authorize(Policy = "AdminOnly")]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteUser(string id)
{
    await _userService.DeleteAsync(id);
    return NoContent();
}`}
        language="csharp"
        title="使用 AdminOnly"
      />

      <h3>Permission 授权</h3>
      <p>权限更适合用 claim：</p>
      <LessonCode
        code={`builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanDeleteUser", policy =>
        policy.RequireClaim("permission", "user:delete"));
});`}
        language="csharp"
        title="注册 CanDeleteUser Policy"
      />
      <LessonCode
        code={`[Authorize(Policy = "CanDeleteUser")]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteUser(string id)
{
    await _userService.DeleteAsync(id);
    return NoContent();
}`}
        language="csharp"
        title="使用 CanDeleteUser"
      />

      <h3>资源级授权</h3>
      <p>
        当权限取决于资源本身，例如“只能删除自己创建的 group”，使用{" "}
        <code>IAuthorizationService</code>。
      </p>
      <LessonCode
        code={`public class GroupOwnerRequirement : IAuthorizationRequirement { }

public class GroupOwnerHandler : AuthorizationHandler<GroupOwnerRequirement, Group>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        GroupOwnerRequirement requirement,
        Group group)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId == group.OwnerId)
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
        code={`builder.Services.AddSingleton<IAuthorizationHandler, GroupOwnerHandler>();`}
        language="csharp"
        title="注册 Handler"
      />
      <p>使用：</p>
      <LessonCode
        code={`var group = await _groupService.GetByIdAsync(id);
if (group is null)
    return NotFound();

var result = await _authorizationService.AuthorizeAsync(
    User,
    group,
    new GroupOwnerRequirement());

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
        code={`options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;

        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chat"))
        {
            context.Token = accessToken;
        }

        return Task.CompletedTask;
    }
};`}
        language="csharp"
        title="从查询参数读取 token"
      />
      <LessonQuote>
        安全提醒：查询参数方式只应在 HTTPS 下使用。浏览器 WebSocket / SSE
        的限制让它成为常见做法，但服务器、代理或监控系统可能记录 query
        string，生产环境要避免把完整 URL 写入日志。
      </LessonQuote>

      <h3>阶段验收问题</h3>
      <ul>
        <li>Authentication 和 Authorization 分别回答什么问题？</li>
        <li>为什么 Refresh Token 只保存哈希？</li>
        <li>Access Token 和 Refresh Token 的生命周期应该如何设计？</li>
        <li>Role、Permission、Policy、Claim 分别承担什么职责？</li>
        <li>什么时候需要资源级授权？</li>
      </ul>

      <TeacherTask title="Phase 3 练习">
        <p>
          在复刻项目中完成 Phase 3：实现完整认证授权 — JWT 登录、Refresh Token
          轮换、Role/Permission RBAC、Policy 授权。
        </p>
      </TeacherTask>

      <LessonStep
        title="实战：Refresh Token 与授权策略"
        defaultCollapsed={true}
        steps={[
          {
            title: "Refresh Token 哈希存储",
            content: (
              <p>
                创建 RefreshToken 实体并哈希存储，避免明文泄露。
              </p>
            ),
            code: `// RefreshToken.cs
public class RefreshToken
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// TokenService.cs
public async Task<string> CreateRefreshTokenAsync(string userId)
{
    var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    var tokenHash = Convert.ToBase64String(
        SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))
    );

    _context.RefreshTokens.Add(new RefreshToken
    {
        UserId = userId,
        TokenHash = tokenHash,
        ExpiresAt = DateTime.UtcNow.AddDays(7)
    });

    await _context.SaveChangesAsync();
    return rawToken; // 只返回一次明文
}`,
            codeLanguage: "csharp",
            codeTitle: "Refresh Token 存储",
            checkpoints: [
              "用 SHA256 哈希后存储，数据库不保存明文",
              "明文 token 只在创建时返回给客户端",
              "设置过期时间（通常 7-30 天）",
              "添加 IsRevoked 字段支持主动撤销",
            ],
            reference:
              "Refresh Token 泄露风险高（长期有效），必须哈希存储。Access Token 短期有效（15分钟）可以不存储。",
          },
          {
            title: "实现 Refresh Token 轮换",
            content: (
              <p>
                每次刷新时，废弃旧 token 并颁发新 token，防止 token 被重放攻击。
              </p>
            ),
            code: `[HttpPost("refresh")]
public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
{
    // 1. 验证 refresh token
    var tokenHash = Convert.ToBase64String(
        SHA256.HashData(Encoding.UTF8.GetBytes(dto.RefreshToken))
    );

    var storedToken = await _context.RefreshTokens
        .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.IsRevoked);

    if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow)
        return Unauthorized(new { message = "Invalid or expired refresh token" });

    // 2. 废弃旧 token
    storedToken.IsRevoked = true;

    // 3. 生成新 token 对
    var user = await _userService.GetByIdAsync(storedToken.UserId);
    var newAccessToken = _tokenService.CreateAccessToken(user);
    var newRefreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);

    await _context.SaveChangesAsync();

    return Ok(new
    {
        accessToken = newAccessToken,
        refreshToken = newRefreshToken
    });
}`,
            codeLanguage: "csharp",
            codeTitle: "Token 轮换",
            checkpoints: [
              "验证 refresh token 的哈希值和有效期",
              "废弃旧 token（设置 IsRevoked = true）",
              "生成新的 access token 和 refresh token",
              "返回新 token 对给客户端",
            ],
            reference:
              "轮换（Rotation）让每个 refresh token 只能用一次。如果检测到已废弃的 token 被重用，说明可能被盗，应撤销该用户的所有 token。",
          },
          {
            title: "用 [Authorize] 和 Policy 保护接口",
            content: (
              <p>
                配置基于角色和权限的授权策略。
              </p>
            ),
            code: `// Program.cs
builder.Services.AddAuthorization(options =>
{
    // 基于角色的策略
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    // 基于权限的策略
    options.AddPolicy("CanDeleteUser", policy =>
        policy.RequireClaim("permission", "users.delete"));

    // 组合策略
    options.AddPolicy("CanManageUsers", policy =>
        policy.RequireAssertion(context =>
            context.User.IsInRole("Admin") ||
            context.User.HasClaim("permission", "users.manage")
        ));
});

// Controller
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    [HttpGet]
    [Authorize] // 只需登录
    public async Task<IActionResult> GetAll() { }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDeleteUser")] // 需要特定权限
    public async Task<IActionResult> Delete(string id) { }

    [HttpPost("admin/reset-password")]
    [Authorize(Policy = "AdminOnly")] // 仅管理员
    public async Task<IActionResult> ResetPassword() { }
}`,
            codeLanguage: "csharp",
            codeTitle: "授权策略",
            checkpoints: [
              "AddPolicy 在 Program.cs 中定义策略",
              "[Authorize] 用于需要登录的接口",
              "[Authorize(Policy = \"...\")] 用于需要特定权限的接口",
              "RequireRole / RequireClaim / RequireAssertion 三种策略方式",
            ],
            reference:
              "Policy 比直接用 [Authorize(Roles = \"Admin\")] 更灵活，可以组合多个条件，且策略名称更语义化。",
          },
          {
            title: "实现资源级授权 Handler",
            content: (
              <p>
                对于需要验证资源所有权的场景（如"只有文章作者才能编辑"），实现自定义 AuthorizationHandler。
              </p>
            ),
            code: `// 定义需求
public class ResourceOwnerRequirement : IAuthorizationRequirement
{
    public string ResourceType { get; }

    public ResourceOwnerRequirement(string resourceType)
    {
        ResourceType = resourceType;
    }
}

// 实现 Handler
public class ResourceOwnerHandler : AuthorizationHandler<ResourceOwnerRequirement>
{
    private readonly IHttpContextAccessor _httpContext;
    private readonly IArticleRepository _articleRepo;

    public ResourceOwnerHandler(
        IHttpContextAccessor httpContext,
        IArticleRepository articleRepo)
    {
        _httpContext = httpContext;
        _articleRepo = articleRepo;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ResourceOwnerRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            context.Fail();
            return;
        }

        // 从路由获取资源 ID
        var routeData = _httpContext.HttpContext?.GetRouteData();
        var resourceId = routeData?.Values["id"]?.ToString();
        if (resourceId == null)
        {
            context.Fail();
            return;
        }

        // 检查所有权
        if (requirement.ResourceType == "Article")
        {
            var article = await _articleRepo.GetByIdAsync(resourceId);
            if (article?.AuthorId == userId)
            {
                context.Succeed(requirement);
                return;
            }
        }

        context.Fail();
    }
}

// 注册
builder.Services.AddSingleton<IAuthorizationHandler, ResourceOwnerHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanEditOwnArticle", policy =>
        policy.Requirements.Add(new ResourceOwnerRequirement("Article")));
});

// 使用
[HttpPut("articles/{id}")]
[Authorize(Policy = "CanEditOwnArticle")]
public async Task<IActionResult> UpdateArticle(string id, UpdateArticleDto dto) { }`,
            codeLanguage: "csharp",
            codeTitle: "资源级授权",
            checkpoints: [
              "定义 Requirement 表示授权需求",
              "实现 AuthorizationHandler 处理授权逻辑",
              "从 HttpContext 获取资源 ID 并验证所有权",
              "注册 Handler 和 Policy",
            ],
            reference:
              "资源级授权适合只有所有者才能操作的场景。Handler 在 Controller 之前执行，验证失败返回 403 Forbidden。",
          },
          {
            title: "配置 SignalR 的 JWT 认证",
            content: (
              <p>
                SignalR 的 WebSocket 连接不支持 HTTP Header，需要从查询参数读取 JWT。
              </p>
            ),
            code: `// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!)
            ),
            ValidateIssuer = false,
            ValidateAudience = false
        };

        // 从查询参数读取 token（SignalR 需要）
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

// Hub
[Authorize]
public class ChatHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = Context.User?.Identity?.Name;

        await Clients.All.SendAsync("UserConnected", new
        {
            UserId = userId,
            UserName = userName
        });

        await base.OnConnectedAsync();
    }
}

// 前端连接
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/chat", {
        accessTokenFactory: () => localStorage.getItem("accessToken")
    })
    .build();`,
            codeLanguage: "csharp",
            codeTitle: "SignalR JWT 认证",
            checkpoints: [
              "在 JwtBearerEvents.OnMessageReceived 中从查询参数读取 token",
              "检查路径是否为 SignalR Hub 路径",
              "Hub 用 [Authorize] 保护",
              "前端通过 accessTokenFactory 传递 token",
            ],
            reference:
              "WebSocket 握手时无法设置 Authorization Header，所以 SignalR 用查询参数传递 token。生产环境需确保 HTTPS，避免 token 泄露。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经掌握了完整的认证授权体系。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                Refresh Token 必须哈希存储，轮换机制防止重放攻击
              </li>
              <li>
                Policy 授权比直接用 Roles 更灵活，支持组合条件
              </li>
              <li>
                资源级授权用 AuthorizationHandler 实现所有权验证
              </li>
              <li>
                SignalR 从查询参数读取 JWT（WebSocket 限制）
              </li>
              <li>
                认证（Authentication）确认身份，授权（Authorization）确认权限
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能实现 Token 轮换、Policy 授权、资源级授权、SignalR 认证。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
