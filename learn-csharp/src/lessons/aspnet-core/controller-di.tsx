import {
  LessonCode,
  LessonCodeCompare,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const AspnetControllerDiLesson = () => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能写 Controller + Service + DTO 的最小 CRUD，正确选择 DI
        生命周期（Singleton / Scoped / Transient），用构造函数注入服务，配置 HTTP
        方法、路由参数和模型绑定，并用授权策略保护端点。
      </p>

      <h3>DI 依赖注入</h3>
      <p>
        ASP.NET Core 内置 DI 容器。注册服务后通过<strong>构造函数注入</strong>
        使用，与 NestJS 完全一致。<strong>关键差异</strong>：不需要{" "}
        <code>@Injectable()</code> 装饰器，任何可公开构造的类型都可以被注入。
      </p>

      <LessonCode
        code={`// 注册
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<UserService>(); // 如果只有一种实现，可简化

// 使用 — 通过构造函数注入（与 NestJS 完全一致！）
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }
}`}
        language="csharp"
        title="注册与注入"
      />

      <h4>生命周期对照</h4>
      <LessonTable
        headers={["生命周期", "NestJS", "ASP.NET Core", "行为"]}
        rows={[
          ["Singleton", "scope: Scope.SINGLETON", "AddSingleton<T>()", "整个应用生命周期，全局唯一"],
          ["Scoped", "scope: Scope.REQUEST", "AddScoped<T>()", "每个 HTTP 请求内唯一"],
          ["Transient", "默认", "AddTransient<T>()", "每次注入创建新实例"],
        ]}
      />

      <LessonQuote>
        常见误区：把 <code>AddScoped</code> / <code>AddSingleton</code> /{" "}
        <code>AddTransient</code> 随便选。DbContext 这类按请求共享的资源应当用{" "}
        <code>Scoped</code>，每个 HTTP 请求内是同一个实例，请求结束即释放。
      </LessonQuote>

      <h3>Controller 与路由</h3>
      <p>
        Controller 继承 <code>ControllerBase</code>，用 <code>[ApiController]</code>{" "}
        和 <code>[Route]</code> 标注。对照 NestJS：
      </p>

      <LessonCodeCompare
        leftTitle="NestJS"
        leftCode={`@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}`}
        leftLanguage="typescript"
        rightTitle="ASP.NET Core"
        rightCode={`[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login(LoginDto dto)
    {
        return Ok(await _authService.LoginAsync(dto));
    }
}`}
        rightLanguage="csharp"
      />

      <h4>HTTP 方法映射</h4>
      <LessonTable
        headers={["HTTP", "NestJS 装饰器", "ASP.NET Core 属性"]}
        rows={[
          ["GET", "@Get()", "[HttpGet]"],
          ["POST", "@Post()", "[HttpPost]"],
          ["PUT", "@Put()", "[HttpPut]"],
          ["PATCH", "@Patch()", "[HttpPatch]"],
          ["DELETE", "@Delete()", "[HttpDelete]"],
        ]}
      />

      <h4>路由参数</h4>
      <LessonCodeCompare
        leftTitle="NestJS"
        leftCode={`@Get(':id')
findOne(@Param('id') id: string) { ... }`}
        leftLanguage="typescript"
        rightTitle="ASP.NET Core"
        rightCode={`[HttpGet("{id}")]
public ActionResult Get(string id) { ... }`}
        rightLanguage="csharp"
      />

      <h4>模型绑定</h4>
      <p>
        框架自动把请求数据绑定到方法参数，与 NestJS 的 <code>@Body</code>、{" "}
        <code>@Param</code>、<code>@Query</code>、<code>@Headers</code> 对应：
      </p>

      <LessonCode
        code={`public class UsersController : ControllerBase
{
    // @Body → 方法参数（从 Request Body 绑定）
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var user = await _userService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    // @Param → URL 路径参数
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id) { ... }

    // @Query → 查询参数
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        return Ok(await _userService.GetAllAsync(page, pageSize, search));
    }

    // @Headers
    [HttpGet("profile")]
    public IActionResult GetProfile([FromHeader] string authorization) { ... }
}`}
        language="csharp"
        title="FromBody / FromQuery / FromHeader"
      />

      <h3>授权（Authorization）</h3>
      <p>
        对应 NestJS Guard，用 <code>[Authorize]</code> 属性按认证方案或策略保护端点：
      </p>

<LessonCodeCompare
        leftTitle="NestJS"
        leftCode={`@UseGuards(JwtAuthGuard)
@RolesGuard('admin')
@Post('delete')
async delete(@RequestUser() user: User, @Param('id') id: string) { ... }`}
        leftLanguage="typescript"
        rightTitle="ASP.NET Core"
        rightCode={`[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[Authorize(Policy = "AdminOnly")]
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(string id) { ... }`}
        rightLanguage="csharp"
      />

      <h4>策略配置</h4>
      <LessonCode
        code={`builder.Services.AddAuthorization(options =>
{
    // 基础策略（基于角色）
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    // 基于声明的策略
    options.AddPolicy("CanDeleteUser", policy =>
        policy.RequireClaim("Permission", "user:delete"));

    // 基于资源的策略（自定义 Requirement）
    options.AddPolicy("OwnerOnly", policy =>
        policy.AddRequirements(new GroupOwnerRequirement()));
});`}
        language="csharp"
        title="授权策略"
      />

      <h4>自定义授权 Handler</h4>
      <p>
        复杂授权逻辑用 <code>IAuthorizationRequirement</code> +{" "}
        <code>AuthorizationHandler&lt;T&gt;</code>，对应 NestJS 自定义 Guard：
      </p>

      <LessonCode
        code={`public class GroupOwnerRequirement : IAuthorizationRequirement { }

public class GroupOwnerHandler : AuthorizationHandler<GroupOwnerRequirement>
{
    private readonly IGroupsService _groupsService;

    public GroupOwnerHandler(IGroupsService groupsService)
    {
        _groupsService = groupsService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        GroupOwnerRequirement requirement)
    {
        if (context.Resource is HttpContext httpContext)
        {
            var groupId = httpContext.Request.RouteValues["id"]?.ToString();
            var userId = httpContext.User.FindFirst("sub")?.Value;

            if (groupId != null && userId != null)
            {
                var isOwner = await _groupsService.IsGroupOwnerAsync(groupId, userId);
                if (isOwner)
                {
                    context.Succeed(requirement);
                }
            }
        }
    }
}

// 注册
builder.Services.AddScoped<IAuthorizationHandler, GroupOwnerHandler>();

// 使用
[Authorize(Policy = "GroupOwner")]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteGroup(string id) { ... }`}
        language="csharp"
        title="GroupOwnerHandler"
      />

      <TeacherTask title="对照 NestJS 理解">
        <p>
          NestJS 用 <code>@Injectable()</code> 标记并在 Module 的{" "}
          <code>providers</code> 里注册；ASP.NET Core 直接在 <code>Program.cs</code>
          的 <code>builder.Services</code> 里注册，构造函数注入的写法完全一样。授权方面，NestJS 的
          <code>canActivate()</code> Guard 对应这里的{" "}
          <code>AuthorizationHandler</code>，都是把判断逻辑收敛到一个可注入的类里。
        </p>
      </TeacherTask>

      <h3>阶段验收问题</h3>
      <ul>
        <li>Scoped 服务为什么适合每个 HTTP 请求内共享 DbContext？</li>
        <li>
          构造函数注入时，注册成 <code>Singleton</code> 的服务里能不能直接注入一个{" "}
          <code>Scoped</code> 服务？为什么要小心？
        </li>
      </ul>

      <TeacherTask title="Phase 1 练习">
        <p>
          在复刻项目中完成 Phase 1：实现 User CRUD — Controller + Service + DTO
          三层分离，加入 FluentValidation 验证。
        </p>
      </TeacherTask>

      <LessonStep
        title="实战：从零搭建 User CRUD API"
        steps={[
          {
            title: "创建 DTO 类",
            content: (
              <p>
                在 <code>Core</code> 项目中创建 <code>DTOs</code> 文件夹，新建 <code>CreateUserDto.cs</code> 和 <code>UserDto.cs</code>。
              </p>
            ),
            code: `// Core/DTOs/CreateUserDto.cs
public record CreateUserDto(
    string Username,
    string Email,
    string Password
);

// Core/DTOs/UserDto.cs
public record UserDto(
    string Id,
    string Username,
    string Email,
    DateTime CreatedAt
);`,
            codeLanguage: "csharp",
            codeTitle: "DTO 定义",
            checkpoints: [
              "用 record 定义 DTO（简洁且不可变）",
              "CreateUserDto 包含创建用户需要的字段",
              "UserDto 是返回给客户端的数据，不包含密码",
            ],
            reference:
              "为什么用 record：record 自动实现值相等性、不可变性、ToString()，非常适合 DTO 场景。如果需要可变对象或继承，才用 class。",
          },
          {
            title: "定义 Service 接口和实现",
            content: (
              <p>
                在 <code>Core</code> 项目中创建 <code>IUserService.cs</code> 接口，然后在 <code>Infrastructure</code> 项目中创建 <code>UserService.cs</code> 实现。
              </p>
            ),
            code: `// Core/Services/IUserService.cs
public interface IUserService
{
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<UserDto?> GetByIdAsync(string id);
    Task<List<UserDto>> GetAllAsync(int page, int pageSize, string? search);
    Task DeleteAsync(string id);
}

// Infrastructure/Services/UserService.cs
public class UserService : IUserService
{
    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        // TODO: 实现创建逻辑
        throw new NotImplementedException();
    }

    public async Task<UserDto?> GetByIdAsync(string id)
    {
        // TODO: 实现查询逻辑
        throw new NotImplementedException();
    }

    public async Task<List<UserDto>> GetAllAsync(int page, int pageSize, string? search)
    {
        // TODO: 实现列表逻辑
        throw new NotImplementedException();
    }

    public async Task DeleteAsync(string id)
    {
        // TODO: 实现删除逻辑
        throw new NotImplementedException();
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "Service 接口与实现",
            checkpoints: [
              "接口定义在 Core（业务层），实现在 Infrastructure（基础设施层）",
              "所有方法都是异步的（返回 Task）",
              "GetByIdAsync 返回可空类型（用户可能不存在）",
            ],
            reference:
              "为什么接口和实现分离：Core 定义业务规则，Infrastructure 处理技术细节（数据库、缓存等）。这样 Core 不依赖具体实现，便于测试和替换。",
          },
          {
            title: "在 Program.cs 中注册 Service",
            content: (
              <p>
                在 <code>Api</code> 项目的 <code>Program.cs</code> 中，用 DI 容器注册 UserService。
              </p>
            ),
            code: `// Program.cs
var builder = WebApplication.CreateBuilder(args);

// 注册 UserService（Scoped 生命周期）
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
// ... 后续代码`,
            codeLanguage: "csharp",
            codeTitle: "注册 Service",
            checkpoints: [
              "用 AddScoped 注册（每个 HTTP 请求内唯一实例）",
              "接口和实现类型都要指定：AddScoped<接口, 实现>()",
              "注册必须在 builder.Build() 之前",
            ],
            reference:
              "为什么用 Scoped：UserService 可能会注入 DbContext（也是 Scoped），所以生命周期要一致。如果用 Singleton，会导致跨请求共享 DbContext，引发线程安全问题。",
          },
          {
            title: "创建 Controller",
            content: (
              <p>
                在 <code>Api</code> 项目的 <code>Controllers</code> 文件夹中，创建 <code>UsersController.cs</code>，通过构造函数注入 IUserService。
              </p>
            ),
            code: `// Controllers/UsersController.cs
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    // 构造函数注入
    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var user = await _userService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var users = await _userService.GetAllAsync(page, pageSize, search);
        return Ok(users);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _userService.DeleteAsync(id);
        return NoContent();
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "UsersController",
            checkpoints: [
              "继承 ControllerBase（API 专用基类）",
              "[ApiController] 启用模型验证和自动绑定",
              "[Route(\"api/[controller]\")] 生成路由：api/users",
              "构造函数注入 IUserService（不需要任何装饰器）",
              "每个端点都有明确的 HTTP 方法属性",
            ],
            reference:
              "CreatedAtAction 是什么：返回 201 Created 状态码，并在 Location header 中返回新资源的 URL（如 /api/users/123）。这是 RESTful 最佳实践。",
          },
          {
            title: "测试 API",
            content: (
              <p>
                运行项目，访问 Swagger，测试刚创建的端点。虽然 Service 还是空实现（抛异常），但能验证路由、注入、模型绑定是否正常。
              </p>
            ),
            code: `dotnet run --project Api`,
            codeLanguage: "bash",
            codeTitle: "运行项目",
            checkpoints: [
              "Swagger 页面能看到 /api/users 的所有端点",
              "GET、POST、DELETE 方法都正确显示",
              "点击 POST 端点，能看到 CreateUserDto 的字段",
              "点击 GET /api/users，能看到 page、pageSize、search 查询参数",
            ],
            reference:
              "如果 Swagger 看不到端点：1) 检查 Controller 是否有 [ApiController] 和 [Route]；2) 确认 Program.cs 中调用了 AddControllers() 和 MapControllers()；3) 检查命名空间是否正确。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经搭建了一个完整的 Controller + Service + DTO 三层架构。
            </p>
            <p>
              <strong>💡 架构要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                DTO 定义在 Core，用 record 表达（简洁、不可变、值相等）
              </li>
              <li>
                Service 接口在 Core，实现在 Infrastructure（依赖方向：Api → Infrastructure → Core）
              </li>
              <li>
                DI 注册在 Program.cs，用 AddScoped（每个请求内唯一实例）
              </li>
              <li>
                Controller 通过构造函数注入 Service，不需要装饰器
              </li>
              <li>
                路由通过 [Route] 和 [Http*] 属性配置，模型绑定自动完成
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 下一步：</strong>补全 UserService 的实现逻辑（需要先学习 EF Core 章节）。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
