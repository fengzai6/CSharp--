import type { ILessonBlock } from "@/components/lesson-ui";

export const authPasswordJwtBlocks = [
  {
    "text": "预估时间：1-2 周 | 目标：能实现 JWT 登录、刷新令牌、RBAC 和策略授权",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "本章你要掌握什么",
    "type": "heading"
  },
  {
    "text": "学完本章后，你应该能实现登录、密码哈希、JWT 签发、Refresh Token 轮换、角色授权、权限授权和资源级授权，并能解释 Authentication 与 Authorization 的区别。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "老师提示",
    "type": "heading"
  },
  {
    "text": "认证授权是项目主干，不要为了快速跑通而牺牲安全习惯。密码不要自己写哈希算法，Refresh Token 不要明文入库，错误信息不要暴露账号是否存在，权限判断不要全部塞进 Controller。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "学习顺序建议",
    "type": "heading"
  },
  {
    "items": [
      "先区分 Authentication 和 Authorization。",
      "实现 PasswordService 和登录流程。",
      "签发短期 Access Token，并把 role / permission 写入 claims。",
      "实现 Refresh Token 哈希存储和轮换。",
      "用 Policy 和 AuthorizationHandler 处理复杂授权。"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "常见误区",
    "type": "heading"
  },
  {
    "items": [
      "用 SHA256 直接保存密码。",
      "Refresh Token 明文保存到数据库。",
      "Access Token 有效期设置过长。",
      "在 JWT 里塞太多用户资料。",
      "只用角色做所有权限判断，导致业务权限难扩展。"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "为什么单独学认证授权",
    "type": "heading"
  },
  {
    "text": "认证授权是后端项目主干，不适合散落在 ASP.NET Core 和 SignalR 章节里学习。",
    "type": "paragraph"
  },
  {
    "text": "本阶段目标：",
    "type": "paragraph"
  },
  {
    "items": [
      "明确 Authentication 和 Authorization 的区别",
      "实现登录并签发 JWT",
      "实现密码哈希和刷新令牌",
      "用 Role / Permission 建模 RBAC",
      "用 Policy 处理复杂授权"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "核心概念",
    "type": "heading"
  },
  {
    "headers": [
      "概念",
      "NestJS",
      "ASP.NET Core"
    ],
    "rows": [
      [
        "认证",
        "Passport Strategy / Guard",
        "Authentication Handler"
      ],
      [
        "授权",
        "Guard / Decorator",
        "Authorization Policy"
      ],
      [
        "当前用户",
        "`request.user`",
        "`HttpContext.User` / `ClaimsPrincipal`"
      ],
      [
        "角色",
        "`@Roles()`",
        "`RequireRole()` / `[Authorize(Roles = \"...\")]`"
      ],
      [
        "权限",
        "自定义 Guard",
        "Claim + Policy"
      ]
    ],
    "type": "table"
  },
  {
    "text": "区别：",
    "type": "paragraph"
  },
  {
    "code": "Authentication：你是谁\nAuthorization：你能做什么",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "text": "中间件顺序必须是：",
    "type": "paragraph"
  },
  {
    "code": "app.UseAuthentication();\napp.UseAuthorization();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "用户模型",
    "type": "heading"
  },
  {
    "code": "public class User\n{\n    public string Id { get; set; } = Guid.NewGuid().ToString();\n    public string Username { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string PasswordHash { get; set; } = string.Empty;\n    public bool IsActive { get; set; } = true;\n    public List<UserRole> UserRoles { get; set; } = new();\n    public List<RefreshToken> RefreshTokens { get; set; } = new();\n}\n\npublic class Role\n{\n    public string Id { get; set; } = Guid.NewGuid().ToString();\n    public string Code { get; set; } = string.Empty;\n    public string Name { get; set; } = string.Empty;\n    public List<RolePermission> Permissions { get; set; } = new();\n}\n\npublic class Permission\n{\n    public string Id { get; set; } = Guid.NewGuid().ToString();\n    public string Code { get; set; } = string.Empty; // 例如 user:delete\n    public string Name { get; set; } = string.Empty;\n}\n\npublic class UserRole\n{\n    public string UserId { get; set; } = string.Empty;\n    public string RoleId { get; set; } = string.Empty;\n    public User User { get; set; } = null!;\n    public Role Role { get; set; } = null!;\n}\n\npublic class RolePermission\n{\n    public string RoleId { get; set; } = string.Empty;\n    public string PermissionId { get; set; } = string.Empty;\n    public Role Role { get; set; } = null!;\n    public Permission Permission { get; set; } = null!;\n}\n\npublic class RefreshToken\n{\n    public string Id { get; set; } = Guid.NewGuid().ToString();\n    public string UserId { get; set; } = string.Empty;\n    public string TokenHash { get; set; } = string.Empty;\n    public DateTime ExpiresAt { get; set; }\n    public DateTime? RevokedAt { get; set; }\n    public User User { get; set; } = null!;\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "密码哈希",
    "type": "heading"
  },
  {
    "text": "不要自己写 SHA256 保存密码。使用成熟密码哈希库，例如 ASP.NET Core 内置的 `PasswordHasher<TUser>`。",
    "type": "paragraph"
  },
  {
    "code": "using Microsoft.AspNetCore.Identity;\n\npublic class PasswordService\n{\n    private readonly PasswordHasher<User> _hasher = new();\n\n    public string Hash(User user, string password)\n    {\n        return _hasher.HashPassword(user, password);\n    }\n\n    public bool Verify(User user, string password)\n    {\n        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);\n        return result is PasswordVerificationResult.Success\n            or PasswordVerificationResult.SuccessRehashNeeded;\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "JWT 配置",
    "type": "heading"
  },
  {
    "text": "安装包：",
    "type": "paragraph"
  },
  {
    "code": "dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "text": "配置：",
    "type": "paragraph"
  },
  {
    "code": "{\n  \"Jwt\": {\n    \"Issuer\": \"my-app\",\n    \"Audience\": \"my-app-client\",\n    \"Secret\": \"replace-with-a-long-random-secret\",\n    \"AccessTokenMinutes\": 15,\n    \"RefreshTokenDays\": 7\n  }\n}",
    "language": "json",
    "title": "json 示例",
    "type": "code"
  },
  {
    "text": "注册认证：",
    "type": "paragraph"
  },
  {
    "code": "builder.Services\n    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)\n    .AddJwtBearer(options =>\n    {\n        var jwt = builder.Configuration.GetSection(\"Jwt\");\n        options.TokenValidationParameters = new TokenValidationParameters\n        {\n            ValidateIssuer = true,\n            ValidateAudience = true,\n            ValidateLifetime = true,\n            ValidateIssuerSigningKey = true,\n            ValidIssuer = jwt[\"Issuer\"],\n            ValidAudience = jwt[\"Audience\"],\n            IssuerSigningKey = new SymmetricSecurityKey(\n                Encoding.UTF8.GetBytes(jwt[\"Secret\"]!))\n        };\n    });\n\nbuilder.Services.AddAuthorization();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "签发 Access Token",
    "type": "heading"
  },
  {
    "code": "public string CreateAccessToken(User user, IEnumerable<string> roles, IEnumerable<string> permissions)\n{\n    var claims = new List<Claim>\n    {\n        new(JwtRegisteredClaimNames.Sub, user.Id),\n        new(ClaimTypes.NameIdentifier, user.Id),\n        new(ClaimTypes.Name, user.Username),\n        new(ClaimTypes.Email, user.Email)\n    };\n\n    claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));\n    claims.AddRange(permissions.Select(permission => new Claim(\"permission\", permission)));\n\n    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));\n    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);\n\n    var token = new JwtSecurityToken(\n        issuer: _jwt.Issuer,\n        audience: _jwt.Audience,\n        claims: claims,\n        expires: DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes),\n        signingCredentials: credentials);\n\n    return new JwtSecurityTokenHandler().WriteToken(token);\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "登录流程",
    "type": "heading"
  },
  {
    "code": "public async Task<LoginResponse> LoginAsync(LoginRequest request)\n{\n    var user = await _context.Users\n        .Include(u => u.UserRoles)\n            .ThenInclude(ur => ur.Role)\n                .ThenInclude(r => r.Permissions)\n        .FirstOrDefaultAsync(u => u.Email == request.Email);\n\n    if (user is null || !user.IsActive)\n        throw new UnauthorizedAccessException(\"邮箱或密码错误\");\n\n    if (!_passwordService.Verify(user, request.Password))\n        throw new UnauthorizedAccessException(\"邮箱或密码错误\");\n\n    var roles = user.UserRoles.Select(ur => ur.Role.Code);\n    var permissions = user.UserRoles\n        .SelectMany(ur => ur.Role.Permissions)\n        .Select(rp => rp.Permission.Code)\n        .Distinct();\n\n    var accessToken = _tokenService.CreateAccessToken(user, roles, permissions);\n    var refreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);\n\n    return new LoginResponse(accessToken, refreshToken);\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "错误信息不要区分“邮箱不存在”和“密码错误”，避免泄露账号是否存在。",
    "type": "quote"
  }
] satisfies ILessonBlock[];
