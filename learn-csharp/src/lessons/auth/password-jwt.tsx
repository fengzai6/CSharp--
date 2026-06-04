import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const AuthPasswordJwtLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能区分认证（Authentication）与授权（Authorization），实现密码哈希、登录流程，并签发把
        role / permission 写入 claims 的短期 Access Token。
      </p>

      <TeacherTask title="老师提示">
        <p>
          认证授权是项目主干，不要为了快速跑通而牺牲安全习惯。密码不要自己写哈希算法，错误信息不要暴露账号是否存在，权限判断不要全部塞进
          Controller。
        </p>
      </TeacherTask>

      <h3>Authentication vs Authorization</h3>
      <p>这是两个不同的问题，必须先分清：</p>
      <LessonCode
        code={`Authentication：你是谁
Authorization：你能做什么`}
        language="text"
        title="两者区别"
      />

      <h4>核心概念对照</h4>
      <LessonTable
        headers={["概念", "NestJS", "ASP.NET Core"]}
        rows={[
          ["认证", "Passport Strategy / Guard", "Authentication Handler"],
          ["授权", "Guard / Decorator", "Authorization Policy"],
          ["当前用户", "request.user", "HttpContext.User / ClaimsPrincipal"],
          [
            "角色",
            "@Roles()",
            'RequireRole() / [Authorize(Roles = "...")]',
          ],
          ["权限", "自定义 Guard", "Claim + Policy"],
        ]}
      />

      <p>中间件顺序必须是先认证、后授权：</p>
      <LessonCode
        code={`app.UseAuthentication();
app.UseAuthorization();`}
        language="csharp"
        title="中间件顺序"
      />

      <h3>用户模型</h3>
      <p>
        用 <code>User</code>、<code>Role</code>、<code>Permission</code> 以及关联表建模
        RBAC，<code>RefreshToken</code> 只存哈希（下一节详述）。
      </p>
      <LessonCode
        code={`public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public List<UserRole> UserRoles { get; set; } = new();
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}

public class Role
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<RolePermission> Permissions { get; set; } = new();
}

public class Permission
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Code { get; set; } = string.Empty; // 例如 user:delete
    public string Name { get; set; } = string.Empty;
}`}
        language="csharp"
        title="实体模型（核心部分）"
      />

      <h3>密码哈希</h3>
      <p>
        不要自己写 SHA256 保存密码。使用成熟密码哈希库，例如 ASP.NET Core 内置的{" "}
        <code>PasswordHasher&lt;TUser&gt;</code>。
      </p>
      <LessonCode
        code={`using Microsoft.AspNetCore.Identity;

public class PasswordService
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(User user, string password)
    {
        return _hasher.HashPassword(user, password);
    }

    public bool Verify(User user, string password)
    {
        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result is PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
    }
}`}
        language="csharp"
        title="PasswordService"
      />

      <h3>JWT 配置</h3>
      <p>安装包：</p>
      <LessonCode
        code="dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer"
        language="bash"
        title="安装 JwtBearer"
      />

      <p>配置：</p>
      <LessonCode
        code={`{
  "Jwt": {
    "Issuer": "my-app",
    "Audience": "my-app-client",
    "Secret": "replace-with-a-long-random-secret",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays": 7
  }
}`}
        language="json"
        title="appsettings.json"
      />

      <p>注册认证：</p>
      <LessonCode
        code={`builder.Services
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
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["Secret"]!))
        };
    });

builder.Services.AddAuthorization();`}
        language="csharp"
        title="注册 JWT 认证"
      />

      <h3>签发 Access Token</h3>
      <p>把 role 和 permission 写入 claims，便于后续授权判断：</p>
      <LessonCode
        code={`public string CreateAccessToken(User user, IEnumerable<string> roles, IEnumerable<string> permissions)
{
    var claims = new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub, user.Id),
        new(ClaimTypes.NameIdentifier, user.Id),
        new(ClaimTypes.Name, user.Username),
        new(ClaimTypes.Email, user.Email)
    };

    claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
    claims.AddRange(permissions.Select(permission => new Claim("permission", permission)));

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: _jwt.Issuer,
        audience: _jwt.Audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes),
        signingCredentials: credentials);

    return new JwtSecurityTokenHandler().WriteToken(token);
}`}
        language="csharp"
        title="CreateAccessToken"
      />

      <TeacherTask title="安全要点">
        <p>
          Access Token 有效期不要设置过长（示例为 15 分钟），也不要在 JWT
          里塞太多用户资料。短期 Access Token 配合 Refresh Token 才是更安全的组合。
        </p>
      </TeacherTask>

      <h3>登录流程</h3>
      <LessonCode
        code={`public async Task<LoginResponse> LoginAsync(LoginRequest request)
{
    var user = await _context.Users
        .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.Permissions)
        .FirstOrDefaultAsync(u => u.Email == request.Email);

    if (user is null || !user.IsActive)
        throw new UnauthorizedAccessException("邮箱或密码错误");

    if (!_passwordService.Verify(user, request.Password))
        throw new UnauthorizedAccessException("邮箱或密码错误");

    var roles = user.UserRoles.Select(ur => ur.Role.Code);
    var permissions = user.UserRoles
        .SelectMany(ur => ur.Role.Permissions)
        .Select(rp => rp.Permission.Code)
        .Distinct();

    var accessToken = _tokenService.CreateAccessToken(user, roles, permissions);
    var refreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);

    return new LoginResponse(accessToken, refreshToken);
}`}
        language="csharp"
        title="LoginAsync"
      />

      <LessonQuote>
        错误信息不要区分“邮箱不存在”和“密码错误”，避免泄露账号是否存在。
      </LessonQuote>

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="auth-password-jwt-checklist"
        items={[
          "实现 PasswordService，完成密码哈希和校验",
          "实现登录接口，返回 access token 和 refresh token",
          "给用户写入 role claim 和 permission claim",
          "配置并注册 JWT 认证，确认中间件顺序正确",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
