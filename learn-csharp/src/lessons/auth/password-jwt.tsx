import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const AuthPasswordJwtLesson = ({
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
        学完本节后，你应该能区分认证（Authentication）与授权（Authorization），实现密码哈希、登录流程，并签发把
        role / permission 写入 claims 的短期 Access Token。
      </p>

      <TeacherTask title="老师提示">
        <p>
          认证授权是项目主干，不要为了快速跑通而牺牲安全习惯。密码不要自己写哈希算法，错误信息不要暴露账号是否存在，权限判断不要全部塞进
          Controller。
        </p>
      </TeacherTask>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          TaskHub 已经有用户、项目、项目成员和任务数据模型。本节在这个模型上补注册、登录、密码哈希和 JWT，让后续 Projects / WorkItems API 能真正按当前用户执行。
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
        TaskHub 先用 <code>User</code> 表达账号，用 <code>ProjectMember</code> 表达项目内角色。平台级角色可以后续补充，但项目权限不要脱离项目成员关系单独判断。
      </p>
      <LessonCode
        code={`public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public List<ProjectMember> ProjectMembers { get; set; } = new();
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}

public class ProjectMember
{
    public string ProjectId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public ProjectRole Role { get; set; } = ProjectRole.Member;
    public bool IsActive { get; set; } = true;

    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;
}

public enum ProjectRole
{
    Owner,
    Maintainer,
    Member
}`}
        language="csharp"
        title="TaskHub 认证相关模型"
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
      <p>
        安装 JwtBearer 包后，ASP.NET Core 才知道如何从请求头里的{" "}
        <code>Authorization: Bearer ...</code> 解析 JWT，并把解析结果放进{" "}
        <code>HttpContext.User</code>。
      </p>
      <LessonCode
        code="dotnet add TaskHub.Api/TaskHub.Api.csproj package Microsoft.AspNetCore.Authentication.JwtBearer"
        language="bash"
        title="安装 JwtBearer"
      />

      <p>配置：</p>
      <LessonCode
        code={`{
  "Jwt": {
    "Issuer": "taskhub",
    "Audience": "taskhub-client",
    "Secret": "replace-with-a-long-random-secret",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays": 7
  }
}`}
        language="json"
        title="appsettings.json"
      />

      <LessonQuote>
        示例里把 <code>Secret</code> 写在 JSON 中只是为了说明配置结构。真实项目不要把密钥提交到仓库：本地用
        <code>dotnet user-secrets</code>，部署时用环境变量或密钥服务，例如 <code>Jwt__Secret</code>。
      </LessonQuote>

      <LessonCode
        code={`# 本地开发密钥
dotnet user-secrets init
dotnet user-secrets set "Jwt:Secret" "a-long-random-secret-at-least-32-bytes"

# 生产环境环境变量写法
Jwt__Secret=a-long-random-secret-at-least-32-bytes`}
        language="bash"
        title="密钥配置方式"
      />

      <p>
        <code>dotnet user-secrets init</code> 会给当前项目启用本地密钥存储，
        <code>set</code> 会把密钥写到用户目录下，而不是写进仓库。生产环境的{" "}
        <code>Jwt__Secret</code> 使用双下划线表示配置层级，对应 JSON 里的{" "}
        <code>Jwt:Secret</code>。
      </p>

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
            ClockSkew = TimeSpan.FromMinutes(1),
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["Secret"]!))
        };
    });

builder.Services.AddAuthorization();`}
        language="csharp"
        title="注册 JWT 认证"
      />

      <h3>签发 Access Token</h3>
      <p>把用户身份和少量全局 claim 写入 token；项目级权限在具体项目接口里结合 <code>ProjectMember</code> 查询判断，避免把所有项目权限塞进 JWT。</p>
      <LessonCode
        code={`public string CreateAccessToken(User user)
{
    var claims = new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub, user.Id),
        new(ClaimTypes.NameIdentifier, user.Id),
        new(ClaimTypes.Name, user.Username),
        new(ClaimTypes.Email, user.Email)
    };

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
        .FirstOrDefaultAsync(u => u.Email == request.Email);

    if (user is null || !user.IsActive)
        throw new UnauthorizedAccessException("邮箱或密码错误");

    if (!_passwordService.Verify(user, request.Password))
        throw new UnauthorizedAccessException("邮箱或密码错误");

    var accessToken = _tokenService.CreateAccessToken(user);
    var refreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);

    return new LoginResponse(accessToken, refreshToken);
}`}
        language="csharp"
        title="LoginAsync"
      />

      <LessonQuote>
        错误信息不要区分"邮箱不存在"和"密码错误"，避免泄露账号是否存在。
      </LessonQuote>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能实现密码哈希校验、JWT Bearer 配置和登录签发 Access Token 的主流程。
          </p>
        }
        id="auth-password-jwt-main"
        title="完成密码登录与 JWT 主线"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <TeacherTask title="Phase 3 项目状态">
        <p>
          到这里，TaskHub 已经能完成用户登录、密码哈希校验和 Access Token 签发。下一节会加入 Refresh Token 轮换，并把项目 Owner / Maintainer / Member 的资源级权限接到项目 API 和 SignalR 通知上。
        </p>
      </TeacherTask>
    </LessonShell>
  );
};
