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
          TaskHub 已经有用户、项目、项目成员、任务和 <code>RefreshToken</code> 数据模型（EF Core 章节已配置）。本节在这个基础上实现注册、登录、密码哈希和 JWT，让后续 API 能真正按当前用户执行。
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
      <p>
        对照前端：登录拿到 JWT 是<strong>认证</strong>；某个按钮根据角色灰掉、接口返回
        403 是<strong>授权</strong>。NestJS 里 Passport 把用户塞进{" "}
        <code>request.user</code> 是认证；<code>@Roles()</code> / 自定义 Guard
        拦请求是授权。ASP.NET Core 把「解析 token → 填 User」和「按 Policy
        判断能不能进」拆成两套中间件，概念一一对应。
      </p>

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

      <p>
        <code>HttpContext.User</code> 类型是 <code>ClaimsPrincipal</code>
        ——一堆 Claim（键值对）组成的「当前身份」。例如{" "}
        <code>sub=用户Id</code>、<code>email=...</code>
        。前端 decode JWT payload 看到的字段，校验通过后就变成这些 Claim。
      </p>

      <p>
        中间件顺序必须是先认证、后授权。认证先把 token 解析成{" "}
        <code>User</code>；授权再读 <code>User</code> 做 Policy 判断。顺序反了，授权时
        User 还是匿名，已登录请求也会被当未登录。
      </p>
      <LessonCode
        code={`// 先认证：读 Authorization: Bearer ...，验签后写入 HttpContext.User
app.UseAuthentication();
// 后授权：读 User + [Authorize] / Policy，决定 200 / 401 / 403
app.UseAuthorization();`}
        language="csharp"
        title="中间件顺序"
      />
      <LessonQuote>
        常见误判：前端 axios 拦截器里「没 token 就跳登录」≈ 客户端自检；真正安全边界在服务端{" "}
        <code>UseAuthentication</code> + <code>UseAuthorization</code>
        。只靠前端藏按钮不够。
      </LessonQuote>

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
        不要自己写 SHA256 / MD5 保存密码。密码库会帮你做：随机 salt、慢哈希（抗暴力）、算法版本标记。自己拼{" "}
        <code>SHA256(password + salt)</code> 很容易缺迭代次数、缺 rehash 升级路径。
      </p>
      <p>
        对照 Node：常用 <code>bcrypt</code> / <code>argon2</code>。ASP.NET Core 内置的{" "}
        <code>PasswordHasher&lt;TUser&gt;</code>（在{" "}
        <code>Microsoft.AspNetCore.Identity</code>
        命名空间）默认用 PBKDF2，用法类似「调库，别自研」。
      </p>
      <LessonTable
        headers={["做法", "问题"]}
        rows={[
          ["明文存密码", "库一泄漏全军覆没"],
          ["SHA256(password)", "太快，可被 GPU 撞库；无 salt 时彩虹表可查"],
          ["SHA256(password+固定salt)", "仍太快；全站同一 salt 削弱防护"],
          [
            "PasswordHasher / bcrypt / argon2",
            "内置随机 salt + 慢哈希 + 结果可升级，生产默认选这个",
          ],
        ]}
      />
      <LessonCode
        code={`using Microsoft.AspNetCore.Identity;

public class PasswordService
{
    // Identity 自带实现：Hash 结果里已含算法版本 + salt + 哈希
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(User user, string password)
    {
        // 第二个参数是明文密码；返回值整串写入 User.PasswordHash
        return _hasher.HashPassword(user, password);
    }

    public bool Verify(User user, string password)
    {
        // 用库内 salt/参数校验，不要自己拆 PasswordHash 字符串
        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        // SuccessRehashNeeded：密码对，但算法参数已升级 → 登录成功后应重新 Hash 并写库
        return result is PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
    }
}`}
        language="csharp"
        title="PasswordService"
      />
      <LessonQuote>
        为什么 <code>HashPassword</code> 要传 <code>user</code>？接口约定需要
        TUser；多数场景哈希本身不依赖用户字段，但统一走 Identity
        的签名，便于以后换实现。库选 bcrypt 时 Node 侧也是{" "}
        <code>bcrypt.hash(plain, rounds)</code>，同样不要自写算法。
      </LessonQuote>

      <h3>JWT 配置</h3>
      <p>
        安装 JwtBearer 包后，ASP.NET Core 才知道如何从请求头里的{" "}
        <code>Authorization: Bearer ...</code> 解析 JWT，并把解析结果放进{" "}
        <code>HttpContext.User</code>。对照 NestJS：类似安装{" "}
        <code>@nestjs/passport</code> + <code>passport-jwt</code>，并注册{" "}
        <code>JwtStrategy</code>。
      </p>
      <LessonCode
        code={`# 把 JwtBearer 认证处理程序加进 Api 项目依赖
# 没有这个包，AddJwtBearer 编译都过不了
dotnet add TaskHub.Api/TaskHub.Api.csproj package Microsoft.AspNetCore.Authentication.JwtBearer`}
        language="bash"
        title="安装 JwtBearer"
      />

      <p>
        配置：在已有 <code>appsettings.json</code> 上<strong>追加</strong>{" "}
        <code>Jwt</code> 节点，不要整文件覆盖掉 EF 章的{" "}
        <code>ConnectionStrings</code>：
      </p>
      <LessonCode
        code={`{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=taskhub;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Issuer": "taskhub",
    "Audience": "taskhub-client",
    "Secret": "replace-with-a-long-random-secret",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays": 7
  }
}`}
        language="json"
        title="appsettings.json — 保留 ConnectionStrings 并追加 Jwt"
      />
      <LessonTable
        headers={["配置项", "干什么"]}
        rows={[
          [
            "Issuer",
            "签发方标识（iss）。校验时 token 的 iss 必须匹配，防别的服务发的 token 被误收",
          ],
          [
            "Audience",
            "受众（aud）。标明 token 给谁用；校验失败说明 token 不是发给本 API 的",
          ],
          [
            "Secret",
            "对称签名密钥。HS256 下签发与校验共用；泄漏 ≈ 任何人可伪造 token",
          ],
          [
            "AccessTokenMinutes",
            "Access Token 有效分钟数。短一点（如 15）降低被盗后可用窗口",
          ],
          [
            "RefreshTokenDays",
            "Refresh Token 有效天数。下一节轮换会用到；Access 过期后靠它换新",
          ],
        ]}
      />

      <LessonQuote>
        示例里把 <code>Secret</code> 写在 JSON 中只是为了说明配置结构。真实项目不要把密钥提交到仓库：本地用
        <code>dotnet user-secrets</code>，部署时用环境变量或密钥服务，例如{" "}
        <code>Jwt__Secret</code>。
      </LessonQuote>

      <LessonCode
        code={`# init：给项目启用本地密钥存储（写 UserSecretsId 到 csproj，密钥不进 git）
dotnet user-secrets init --project TaskHub.Api/TaskHub.Api.csproj
# set：把 Jwt:Secret 写到用户目录下的 secrets.json，覆盖 appsettings 同名项
dotnet user-secrets set "Jwt:Secret" "a-long-random-secret-at-least-32-bytes" --project TaskHub.Api/TaskHub.Api.csproj

# 生产：环境变量用双下划线表示层级，等价 JSON 的 Jwt.Secret
Jwt__Secret=a-long-random-secret-at-least-32-bytes`}
        language="bash"
        title="密钥配置方式"
      />

      <p>
        <code>dotnet user-secrets init</code> 启用本地密钥；
        <code>set</code> 写入用户目录而不是仓库。生产{" "}
        <code>Jwt__Secret</code> 的双下划线对应 JSON 的 <code>Jwt:Secret</code>
        （ASP.NET 配置系统约定，类似 Nest 里 env 覆盖 config）。
      </p>

      <p>
        注册认证：<code>AddAuthentication</code> 声明默认方案；
        <code>AddJwtBearer</code> 挂上「怎么验 Bearer token」；
        <code>AddAuthorization</code> 打开授权管线（Policy /{" "}
        <code>[Authorize]</code>）。缺任一段，中间件有了也验不了。
      </p>
      <LessonCode
        code={`// Program.cs 顶部 using：
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

// builder.Services 部分：
builder.Services
    // 默认认证方案名 = JwtBearer（后续 [Authorize] 默认走它）
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // 读 appsettings / user-secrets / 环境变量 合并后的 "Jwt" 段
        var jwt = builder.Configuration.GetSection("Jwt");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,            // 校验 iss
            ValidateAudience = true,          // 校验 aud
            ValidateLifetime = true,          // 校验 exp / nbf
            ValidateIssuerSigningKey = true,  // 必须用密钥验签，防篡改
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            // 时钟偏差容忍：多机/时钟不同步时给 1 分钟缓冲（默认 5 分钟偏宽）
            ClockSkew = TimeSpan.FromMinutes(1),
            // 对称密钥：和签发时用的 Secret 同一把
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["Secret"]!))
        };
    });

// 只注册认证不注册授权 → [Authorize] / Policy 不会按预期工作
builder.Services.AddAuthorization();`}
        language="csharp"
        title="注册 JWT 认证"
      />
      <LessonQuote>
        常见误判：前端只 <code>jwt.verify(token, secret)</code>{" "}
        就够了；服务端还要固定校验 Issuer / Audience /
        Lifetime，否则别的环境签发的、过期的、甚至签名算法被降级的 token
        可能被放过。上面四个 <code>Validate*</code> 建议生产保持{" "}
        <code>true</code>。
      </LessonQuote>

      <h3>签发 Access Token</h3>
      <p>
        Claim = 一段「关于当前用户的断言」（键值对）。JWT payload 里的{" "}
        <code>sub</code>、<code>email</code> 都是 claim。把用户身份和少量全局
        claim 写入 token；项目级权限在具体项目接口里结合{" "}
        <code>ProjectMember</code> 查询判断，避免把所有项目权限塞进 JWT（token
        变大、权限变更还要等过期）。
      </p>
      <LessonTable
        headers={["Claim 写法", "含义"]}
        rows={[
          [
            "JwtRegisteredClaimNames.Sub",
            "标准 JWT 字段 sub（subject），通常放用户 Id",
          ],
          [
            "ClaimTypes.NameIdentifier",
            ".NET 生态里「用户 Id」常用 claim 类型；很多 API 默认读它",
          ],
          ["ClaimTypes.Name / Email", "显示名、邮箱；可选，按业务需要放"],
        ]}
      />
      <p>
        同时写 <code>Sub</code> 和 <code>NameIdentifier</code>
        ，是因为不同中间件/库认的名字不完全一样，两边都写最省事。对照 Nest
        的 <code>JwtService.sign({`{ sub, email }`})`</code>：字段自己定，这里多了
        .NET 约定类型。
      </p>
      <LessonCode
        code={`public string CreateAccessToken(User user)
{
    // payload 里的声明；校验通过后进入 HttpContext.User.Claims
    var claims = new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub, user.Id),
        new(ClaimTypes.NameIdentifier, user.Id),
        new(ClaimTypes.Name, user.Username),
        new(ClaimTypes.Email, user.Email)
    };

    // 密钥 → 签名凭证（算法 HS256 = HMAC-SHA256）
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    // 组装 header.payload.signature 三部分所需材料
    var token = new JwtSecurityToken(
        issuer: _jwt.Issuer,       // 写入 iss
        audience: _jwt.Audience,   // 写入 aud
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes), // exp
        signingCredentials: credentials);

    // 序列化成可放在 Authorization: Bearer 后的字符串
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

      <h3>注册流程</h3>
      <p>
        顺序：业务唯一性检查 → 建用户 → 哈希密码写入 → SaveChanges。不要先存明文再改哈希。对照 Nest：Service 里{" "}
        <code>bcrypt.hash</code> 再 <code>users.create</code>。
      </p>
      <LessonCode
        code={`public async Task<User> RegisterAsync(RegisterRequest request)
{
    // 业务校验：邮箱是否已占用（AnyAsync ≈ EXISTS 查询，不拉整行）
    var emailExists = await _context.Users
        .AnyAsync(u => u.Email == request.Email);

    if (emailExists)
        throw new ArgumentException("该邮箱已被注册");

    var user = new User
    {
        Username = request.Username,
        Email = request.Email
        // PasswordHash 先空着，下一行再 Hash 写入
    };

    user.PasswordHash = _passwordService.Hash(user, request.Password);

    _context.Users.Add(user);
    await _context.SaveChangesAsync();

    return user;
}`}
        language="csharp"
        title="RegisterAsync"
      />

      <LessonQuote>
        注册流程用 FluentValidation 做输入校验（邮箱格式、密码强度），用 Service 做业务校验（邮箱唯一性）。两者职责不要混——验证器不查库，Service 不做格式正则。
      </LessonQuote>

      <h3>登录流程</h3>
      <p>
        登录只做三件事：找用户 → 验密码 → 签发 token。找不到用户、停用、密码错，对外同一句「邮箱或密码错误」，避免被枚举账号。
      </p>
      <LessonCode
        code={`public async Task<LoginResponse> LoginAsync(LoginRequest request)
{
    var user = await _context.Users
        .FirstOrDefaultAsync(u => u.Email == request.Email);

    // 用户不存在或已停用：同一错误文案
    if (user is null || !user.IsActive)
        throw new UnauthorizedAccessException("邮箱或密码错误");

    if (!_passwordService.Verify(user, request.Password))
        throw new UnauthorizedAccessException("邮箱或密码错误");

    var accessToken = _tokenService.CreateAccessToken(user);

    // Refresh Token 在下一节补上，这里先返回空字符串占位
    return new LoginResponse(accessToken, RefreshToken: string.Empty);
}`}
        language="csharp"
        title="LoginAsync"
      />

      <LessonQuote>
        错误信息不要区分「邮箱不存在」和「密码错误」，避免泄露账号是否存在。对照前端：接口统一 401，不要返回{" "}
        <code>{`{ reason: "user_not_found" }`}</code>。
      </LessonQuote>

      <h3>写入 TaskHub.Api — 认证类型</h3>
      <p>
        上面的代码片段引用了多个类型，需要逐个落盘到 <code>TaskHub.Api</code>。先创建目录：
      </p>

      <LessonCode
        code={`# 创建目录
mkdir -p TaskHub.Api/Models/Requests`}
        language="bash"
        title="创建目录"
      />

      <p>
        下面三个都是 <code>record</code>：位置参数自动变成只读属性，适合当
        DTO。对照 TS 的{" "}
        <code>{`type LoginRequest = { email: string; password: string }`}</code>
        ，这里多了运行时类型，ASP.NET 会按属性名从 JSON body 反序列化（默认
        camelCase ↔ PascalCase）。
      </p>

      <h4>Models/Requests/RegisterRequest.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Api.Models.Requests;

// POST body: { "username", "email", "password" }
public record RegisterRequest(string Username, string Email, string Password);`}
        language="csharp"
        title="Models/Requests/RegisterRequest.cs"
      />

      <h4>Models/Requests/LoginRequest.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Api.Models.Requests;

// POST body: { "email", "password" }
public record LoginRequest(string Email, string Password);`}
        language="csharp"
        title="Models/Requests/LoginRequest.cs"
      />

      <h4>Models/Requests/LoginResponse.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Api.Models.Requests;

// 登录/刷新统一返回这对 token；本节 RefreshToken 先占位为空串
public record LoginResponse(string AccessToken, string RefreshToken);`}
        language="csharp"
        title="Models/Requests/LoginResponse.cs"
      />

      <h4>Services/JwtSettings.cs</h4>
      <p>
        把 <code>appsettings</code> 的 <code>Jwt</code> 段绑成强类型类。配合{" "}
        <code>Configure&lt;JwtSettings&gt;</code> +{" "}
        <code>IOptions&lt;JwtSettings&gt;</code> 注入，避免到处{" "}
        <code>configuration["Jwt:Secret"]</code> 字符串。对照 Nest 的{" "}
        <code>ConfigService.get('jwt.secret')</code>，这里多了编译期属性名。
      </p>
      <LessonCode
        code={`namespace TaskHub.Api.Services;

public class JwtSettings
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}`}
        language="csharp"
        title="Services/JwtSettings.cs"
      />

      <h4>Services/TokenService.cs</h4>
      <LessonCode
        code={`using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TaskHub.Infrastructure.Data;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Api.Services;

public class TokenService
{
    private readonly JwtSettings _jwt;
    // DbContext 留给下一节 CreateRefreshTokenAsync 写库用；本节签发 Access 还不查库
    private readonly TaskHubDbContext _context;

    // IOptions<T>：DI 注入已绑定好的配置快照；.Value 取出 JwtSettings 实例
    public TokenService(IOptions<JwtSettings> jwt, TaskHubDbContext context)
    {
        _jwt = jwt.Value;
        _context = context;
    }

    public string CreateAccessToken(User user)
    {
        // 与上文「签发 Access Token」段同一逻辑；落盘时把 using / 注入写全
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
    }
}`}
        language="csharp"
        title="Services/TokenService.cs"
      />

      <h4>Services/PasswordService.cs</h4>
      <LessonCode
        code={`using Microsoft.AspNetCore.Identity;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Api.Services;

public class PasswordService
{
    // 直接 new 即可；生产若要可测/可换实现，可再 DI 注入 IPasswordHasher<User>
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(User user, string password)
    {
        // 返回值整串写入 User.PasswordHash，不要自己拆格式
        return _hasher.HashPassword(user, password);
    }

    public bool Verify(User user, string password)
    {
        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        // SuccessRehashNeeded：密码对但参数已升级 → 业务上可当成功，有空再 rehash 写回
        return result is PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
    }
}`}
        language="csharp"
        title="Services/PasswordService.cs"
      />

      <h4>Services/AuthService.cs</h4>
      <p>
        编排层：注入 DbContext + 密码 + Token 三个依赖，对外只暴露 Register /
        Login。对照 Nest 的 <code>AuthService</code>。
      </p>
      <LessonCode
        code={`using Microsoft.EntityFrameworkCore;
using TaskHub.Api.Models.Requests;
using TaskHub.Infrastructure.Data;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Api.Services;

public class AuthService
{
    private readonly TaskHubDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly TokenService _tokenService;

    // 三个依赖都由 Program.cs AddScoped 注册后自动注入
    public AuthService(TaskHubDbContext context, PasswordService passwordService, TokenService tokenService)
    {
        _context = context;
        _passwordService = passwordService;
        _tokenService = tokenService;
    }

    public async Task<User> RegisterAsync(RegisterRequest request)
    {
        // 业务唯一性（邮箱）；格式校验交给 FluentValidation，不在这里写正则
        var emailExists = await _context.Users.AnyAsync(u => u.Email == request.Email);
        if (emailExists)
            throw new ArgumentException("该邮箱已被注册");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email
        };
        // 先 Hash 再落库，绝不先存明文
        user.PasswordHash = _passwordService.Hash(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        // 不存在 / 停用 / 密码错：同一文案，防枚举
        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException("邮箱或密码错误");

        if (!_passwordService.Verify(user, request.Password))
            throw new UnauthorizedAccessException("邮箱或密码错误");

        var accessToken = _tokenService.CreateAccessToken(user);

        // Refresh Token 下一节补；先占位空串让 LoginResponse 形状固定
        return new LoginResponse(accessToken, RefreshToken: string.Empty);
    }
}`}
        language="csharp"
        title="Services/AuthService.cs"
      />

      <h4>Controllers/AuthController.cs</h4>
      <p>
        Controller 只做 HTTP 进出：绑请求体、调 Service、返回状态码。不要在这里写哈希或
        JWT 细节。对照 Nest：<code>@Controller(&apos;auth&apos;)</code> + 注入
        Service。
      </p>
      <LessonCode
        code={`using Microsoft.AspNetCore.Mvc;
using TaskHub.Api.Models.Requests;
using TaskHub.Api.Services;

namespace TaskHub.Api.Controllers;

// [ApiController]：自动 400 模型校验、从 body 绑复杂类型等约定
// [Route]：[controller] = 类名去掉 Controller 后缀 → "auth"
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    // DI 注入：Program.cs 里 AddScoped<AuthService>() 后由框架构造
    public AuthController(AuthService auth) => _auth = auth;

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var user = await _auth.RegisterAsync(request);
        // 不回传 PasswordHash
        return Ok(new { user.Id, user.Username, user.Email });
    }

    // POST /api/auth/login → { accessToken, refreshToken }
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var response = await _auth.LoginAsync(request);
        return Ok(response);
    }
}`}
        language="csharp"
        title="Controllers/AuthController.cs"
      />

      <h4>更新 appsettings.json</h4>
      <p>
        在已有 <code>TaskHub.Api/appsettings.json</code> 上<strong>追加</strong> <code>Jwt</code> 节点，不要整文件覆盖掉 EF 章的 <code>ConnectionStrings</code>。本地可用 user-secrets 覆盖 <code>Secret</code>：
      </p>
      <LessonCode
        code={`{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=taskhub;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Issuer": "taskhub",
    "Audience": "taskhub-client",
    "Secret": "replace-with-a-long-random-secret",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays": 7
  }
}`}
        language="json"
        title="appsettings.json — 保留 ConnectionStrings 并追加 Jwt"
      />

      <h4>更新 Program.cs</h4>
      <p>
        三块都要齐：DI 注册服务、配置 JwtBearer 校验参数、管道里挂中间件。只注册服务不挂{" "}
        <code>UseAuthentication</code>，Controller 上的 <code>[Authorize]</code>{" "}
        仍当没登录。
      </p>
      <LessonCode
        code={`// 1. 文件顶部添加 using：
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using TaskHub.Api.Services;

// 2. builder.Services 部分添加：
// 把 "Jwt" 配置段绑到 JwtSettings，供 IOptions<JwtSettings> 注入
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
// Scoped：每个 HTTP 请求一个实例（TokenService 里有 DbContext）
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AuthService>();

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
    });

builder.Services.AddAuthorization();

// 3. var app = builder.Build(); 之后，MapControllers 前添加：
// 顺序固定：Authentication → Authorization → 端点
app.UseAuthentication();
app.UseAuthorization();`}
        language="csharp"
        title="Program.cs 注册认证服务"
      />

      <p>
        写完运行 <code>dotnet build TaskHub.Api</code> 确认编译通过（只编译，不启动）。
        如果编译失败，先检查：<code>TokenService.cs</code> 是否写了所有 using（特别是{" "}
        <code>System.IdentityModel.Tokens.Jwt</code> 和{" "}
        <code>Microsoft.IdentityModel.Tokens</code>）、
        <code>Program.cs</code> 是否注册了 <code>TokenService</code>、
        <code>PasswordService</code>、<code>AuthService</code> 以及 JWT Bearer。
      </p>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已创建认证相关的 DTO（<code>RegisterRequest</code>、<code>LoginRequest</code>、<code>LoginResponse</code>）、配置类（<code>JwtSettings</code>）、服务（<code>TokenService</code>、<code>PasswordService</code>、<code>AuthService</code>）、<code>AuthController</code>（注册 <code>/api/auth/register</code> 和 <code>/api/auth/login</code>），并在 <code>appsettings.json</code> 写入 <code>Jwt</code> 配置段（本地 Secret 可用 user-secrets 覆盖），在 <code>Program.cs</code> 注册 JWT Bearer、启用 <code>UseAuthentication</code> / <code>UseAuthorization</code>，<code>dotnet build TaskHub.Api</code> 编译通过。
          </p>
        }
        id="auth-password-jwt-write-files"
        title="将认证类型写入 TaskHub.Api"
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
