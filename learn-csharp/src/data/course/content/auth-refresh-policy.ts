import type { ILessonBlock } from "@/components/lesson-ui";

export const authRefreshPolicyBlocks = [
  {
    "level": 2,
    "text": "Refresh Token",
    "type": "heading"
  },
  {
    "text": "Refresh token 建议只把哈希存入数据库，明文只返回给客户端一次。",
    "type": "paragraph"
  },
  {
    "code": "public async Task<string> CreateRefreshTokenAsync(string userId)\n{\n    var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));\n    var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));\n\n    _context.RefreshTokens.Add(new RefreshToken\n    {\n        UserId = userId,\n        TokenHash = tokenHash,\n        ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays)\n    });\n\n    await _context.SaveChangesAsync();\n    return rawToken;\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "刷新时：",
    "type": "paragraph"
  },
  {
    "items": [
      "对客户端传入的 refresh token 做同样哈希",
      "查询数据库是否存在",
      "检查是否过期、是否已撤销",
      "撤销旧 token",
      "签发新的 access token 和 refresh token"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "Role 授权",
    "type": "heading"
  },
  {
    "code": "builder.Services.AddAuthorization(options =>\n{\n    options.AddPolicy(\"AdminOnly\", policy =>\n        policy.RequireRole(\"Admin\"));\n});",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "使用：",
    "type": "paragraph"
  },
  {
    "code": "[Authorize(Policy = \"AdminOnly\")]\n[HttpDelete(\"{id}\")]\npublic async Task<IActionResult> DeleteUser(string id)\n{\n    await _userService.DeleteAsync(id);\n    return NoContent();\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "Permission 授权",
    "type": "heading"
  },
  {
    "text": "权限更适合用 claim：",
    "type": "paragraph"
  },
  {
    "code": "builder.Services.AddAuthorization(options =>\n{\n    options.AddPolicy(\"CanDeleteUser\", policy =>\n        policy.RequireClaim(\"permission\", \"user:delete\"));\n});",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "使用：",
    "type": "paragraph"
  },
  {
    "code": "[Authorize(Policy = \"CanDeleteUser\")]\n[HttpDelete(\"{id}\")]\npublic async Task<IActionResult> DeleteUser(string id)\n{\n    await _userService.DeleteAsync(id);\n    return NoContent();\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "资源级授权",
    "type": "heading"
  },
  {
    "text": "当权限取决于资源本身，例如“只能删除自己创建的 group”，使用 `IAuthorizationService`。",
    "type": "paragraph"
  },
  {
    "code": "public class GroupOwnerRequirement : IAuthorizationRequirement { }\n\npublic class GroupOwnerHandler : AuthorizationHandler<GroupOwnerRequirement, Group>\n{\n    protected override Task HandleRequirementAsync(\n        AuthorizationHandlerContext context,\n        GroupOwnerRequirement requirement,\n        Group group)\n    {\n        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)\n            ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);\n\n        if (userId == group.OwnerId)\n        {\n            context.Succeed(requirement);\n        }\n\n        return Task.CompletedTask;\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "注册：",
    "type": "paragraph"
  },
  {
    "code": "builder.Services.AddSingleton<IAuthorizationHandler, GroupOwnerHandler>();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "使用：",
    "type": "paragraph"
  },
  {
    "code": "var group = await _groupService.GetByIdAsync(id);\nif (group is null)\n    return NotFound();\n\nvar result = await _authorizationService.AuthorizeAsync(\n    User,\n    group,\n    new GroupOwnerRequirement());\n\nif (!result.Succeeded)\n    return Forbid();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "SignalR 认证准备",
    "type": "heading"
  },
  {
    "text": "SignalR 仍然复用 JWT 认证，但浏览器 WebSocket 常把 token 放在查询参数：",
    "type": "paragraph"
  },
  {
    "code": "options.Events = new JwtBearerEvents\n{\n    OnMessageReceived = context =>\n    {\n        var accessToken = context.Request.Query[\"access_token\"];\n        var path = context.HttpContext.Request.Path;\n\n        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments(\"/chat\"))\n        {\n            context.Token = accessToken;\n        }\n\n        return Task.CompletedTask;\n    }\n};",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "安全提醒：这个查询参数方式只应在 HTTPS 下使用。浏览器 WebSocket / SSE 的限制让它成为常见做法，但服务器、代理或监控系统可能记录 query string，生产环境要避免把完整 URL 写入日志。",
    "type": "quote"
  },
  {
    "text": "SignalR 章节只需要在这个基础上使用 `[Authorize]`。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "实战练习清单",
    "type": "heading"
  },
  {
    "id": "checklist-28",
    "items": [
      "实现 `PasswordService`，完成密码哈希和校验",
      "实现登录接口，返回 access token 和 refresh token",
      "把 refresh token 哈希后存入数据库",
      "给用户写入 role claim 和 permission claim",
      "用 `[Authorize]` 保护一个接口",
      "实现 `AdminOnly` 和 `CanDeleteUser` 两个 policy",
      "实现 refresh token 轮换",
      "给 SignalR JWT 查询参数读取做好配置"
    ],
    "title": "练习清单",
    "type": "checklist"
  },
  {
    "level": 2,
    "text": "阶段验收问题",
    "type": "heading"
  },
  {
    "items": [
      "Authentication 和 Authorization 分别回答什么问题？",
      "为什么 Refresh Token 只保存哈希？",
      "Access Token 和 Refresh Token 的生命周期应该如何设计？",
      "Role、Permission、Policy、Claim 分别承担什么职责？",
      "什么时候需要资源级授权？"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "下一步",
    "type": "heading"
  },
  {
    "text": "完成本阶段后，进入 [五、SignalR 实时通信](05-SignalR实时通信.md)。",
    "type": "paragraph"
  }
] satisfies ILessonBlock[];
