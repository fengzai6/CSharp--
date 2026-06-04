import type { ILessonBlock } from "@/components/lesson-ui";

export const aspnetControllerDiBlocks = [
  {
    "level": 2,
    "text": "Controller 与路由",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "基础对照",
    "type": "heading"
  },
  {
    "code": "// NestJS\n@Controller('auth')\nexport class AuthController {\n  @Post('login')\n  async login(@Body() dto: LoginDto) {\n    return this.authService.login(dto);\n  }\n}\n\n// ASP.NET Core\n[ApiController]\n[Route(\"api/[controller]\")]\npublic class AuthController : ControllerBase\n{\n    private readonly IAuthService _authService;\n\n    public AuthController(IAuthService authService)\n    {\n        _authService = authService;\n    }\n\n    [HttpPost(\"login\")]\n    public async Task<ActionResult> Login(LoginDto dto)\n    {\n        return Ok(await _authService.LoginAsync(dto));\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "HTTP 方法映射",
    "type": "heading"
  },
  {
    "headers": [
      "HTTP",
      "NestJS 装饰器",
      "ASP.NET Core 属性"
    ],
    "rows": [
      [
        "GET",
        "`@Get()`",
        "`[HttpGet]`"
      ],
      [
        "POST",
        "`@Post()`",
        "`[HttpPost]`"
      ],
      [
        "PUT",
        "`@Put()`",
        "`[HttpPut]`"
      ],
      [
        "PATCH",
        "`@Patch()`",
        "`[HttpPatch]`"
      ],
      [
        "DELETE",
        "`@Delete()`",
        "`[HttpDelete]`"
      ]
    ],
    "type": "table"
  },
  {
    "level": 3,
    "text": "路由参数",
    "type": "heading"
  },
  {
    "code": "// NestJS\n@Get(':id')\nfindOne(@Param('id') id: string) { ... }\n\n// ASP.NET Core\n[HttpGet(\"{id}\")]\npublic ActionResult Get(string id) { ... }",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "模型绑定",
    "type": "heading"
  },
  {
    "code": "// 自动绑定（与 NestJS @Body, @Param, @Query 类似）\npublic class UsersController : ControllerBase\n{\n    // @Body → 方法参数（从 Request Body 绑定）\n    [HttpPost]\n    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)\n    {\n        var user = await _userService.CreateAsync(dto);\n        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);\n    }\n\n    // @Param → URL 路径参数\n    [HttpGet(\"{id}\")]\n    public async Task<IActionResult> GetById(string id) { ... }\n\n    // @Query → 查询参数\n    [HttpGet]\n    public async Task<IActionResult> GetAll(\n        [FromQuery] int page = 1,\n        [FromQuery] int pageSize = 20,\n        [FromQuery] string? search = null)\n    {\n        return Ok(await _userService.GetAllAsync(page, pageSize, search));\n    }\n\n    // @Headers\n    [HttpGet(\"profile\")]\n    public IActionResult GetProfile([FromHeader] string authorization) { ... }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "授权（Authorization）",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "与 NestJS Guard 的对照",
    "type": "heading"
  },
  {
    "code": "// NestJS\n@UseGuards(JwtAuthGuard)\n@RolesGuard('admin')\n@Post('delete')\nasync delete(@RequestUser() user: User, @Param('id') id: string) { ... }\n\n// ASP.NET Core\n[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]\n[Authorize(Policy = \"AdminOnly\")]\n[HttpDelete(\"{id}\")]\npublic async Task<IActionResult> Delete(string id) { ... }",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "策略配置",
    "type": "heading"
  },
  {
    "code": "// Program.cs\nbuilder.Services.AddAuthorization(options =>\n{\n    // 基础策略\n    options.AddPolicy(\"AdminOnly\", policy =>\n        policy.RequireRole(\"Admin\"));\n\n    options.AddPolicy(\"SuperAdminOnly\", policy =>\n        policy.RequireRole(\"SuperAdmin\"));\n\n    // 基于声明的策略\n    options.AddPolicy(\"CanDeleteUser\", policy =>\n        policy.RequireClaim(\"Permission\", \"user:delete\"));\n\n    // 基于资源的策略\n    options.AddPolicy(\"OwnerOnly\", policy =>\n        policy.AddRequirements(new GroupOwnerRequirement()));\n});",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "自定义授权 Handler",
    "type": "heading"
  },
  {
    "code": "// 复杂授权逻辑 — 对应 NestJS 自定义 Guard\npublic class GroupOwnerRequirement : IAuthorizationRequirement { }\n\npublic class GroupOwnerHandler : AuthorizationHandler<GroupOwnerRequirement>\n{\n    private readonly IGroupsService _groupsService;\n\n    public GroupOwnerHandler(IGroupsService groupsService)\n    {\n        _groupsService = groupsService;\n    }\n\n    protected override async Task HandleRequirementAsync(\n        AuthorizationHandlerContext context,\n        GroupOwnerRequirement requirement)\n    {\n        if (context.Resource is HttpContext httpContext)\n        {\n            var groupId = httpContext.Request.RouteValues[\"id\"]?.ToString();\n            var userId = httpContext.User.FindFirst(\"sub\")?.Value;\n\n            if (groupId != null && userId != null)\n            {\n                var isOwner = await _groupsService.IsGroupOwnerAsync(groupId, userId);\n                if (isOwner)\n                {\n                    context.Succeed(requirement);\n                }\n            }\n        }\n    }\n}\n\n// 注册\nbuilder.Services.AddScoped<IAuthorizationHandler, GroupOwnerHandler>();\nbuilder.Services.AddAuthorization(options =>\n{\n    options.AddPolicy(\"GroupOwner\", policy =>\n        policy.AddRequirements(new GroupOwnerRequirement()));\n});\n\n// 使用\n[Authorize(Policy = \"GroupOwner\")]\n[HttpDelete(\"{id}\")]\npublic async Task<IActionResult> DeleteGroup(string id) { ... }",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "统一响应格式",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "对应 NestJS 的 PostResponseInterceptor",
    "type": "heading"
  },
  {
    "code": "// 中间件实现\npublic class ResponseMiddleware\n{\n    private readonly RequestDelegate _next;\n\n    public ResponseMiddleware(RequestDelegate next)\n    {\n        _next = next;\n    }\n\n    public async Task InvokeAsync(HttpContext context)\n    {\n        // 保存原始响应 body\n        var originalBody = context.Response.Body;\n        using var newBody = new MemoryStream();\n        context.Response.Body = newBody;\n\n        try\n        {\n            await _next(context);\n        }\n        catch\n        {\n            // 异常已由 ExceptionMiddleware 处理\n            throw;\n        }\n        finally\n        {\n            // 修改响应格式\n            newBody.Seek(0, SeekOrigin.Begin);\n            var responseBody = await new StreamReader(newBody).ReadToEndAsync();\n            newBody.Seek(0, SeekOrigin.Begin);\n\n            // 包装统一响应\n            var wrappedResponse = new\n            {\n                success = context.Response.StatusCode is >= 200 and < 300,\n                code = context.Response.StatusCode,\n                data = context.Response.StatusCode is 204 ? null : JsonConvert.DeserializeObject(responseBody),\n                message = string.Empty,\n                timestamp = DateTime.UtcNow.ToString(\"o\")\n            };\n\n            context.Response.ContentType = \"application/json\";\n            context.Response.ContentLength = null;\n            await context.Response.WriteAsJsonAsync(wrappedResponse);\n\n            await newBody.CopyTo(originalBody);\n        }\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  }
] satisfies ILessonBlock[];
