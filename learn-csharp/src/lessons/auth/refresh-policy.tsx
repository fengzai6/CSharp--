import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const AuthRefreshPolicyLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能实现 Refresh Token 哈希存储与轮换，用 Role / Permission 建模
        RBAC，并用 Policy 和 AuthorizationHandler 处理角色、权限以及资源级授权。
      </p>

      <TeacherTask title="老师提示">
        <p>
          只用角色做所有权限判断会导致业务权限难扩展。角色（Role）描述身份，权限（Permission）描述具体能力，复杂场景再用
          Policy 和 Handler 组合判断。
        </p>
      </TeacherTask>

      <h3>Refresh Token</h3>
      <p>
        Refresh token 建议只把哈希存入数据库，明文只返回给客户端一次。
      </p>
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
        Refresh Token 不要明文保存到数据库；存储的是哈希，明文只在创建时返回一次。
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
        安全提醒：查询参数方式只应在 HTTPS 下使用。浏览器 WebSocket / SSE 的限制让它成为常见做法，但服务器、代理或监控系统可能记录
        query string，生产环境要避免把完整 URL 写入日志。
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

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="auth-refresh-policy-checklist"
        items={[
          "把 refresh token 哈希后存入数据库",
          "实现 refresh token 轮换",
          "用 [Authorize] 保护一个接口",
          "实现 AdminOnly 和 CanDeleteUser 两个 policy",
          "实现一个资源级授权的 AuthorizationHandler",
          "给 SignalR JWT 查询参数读取做好配置",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
