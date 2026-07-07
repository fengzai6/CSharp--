import {
  LessonCheckpoint,
  LessonCode,
  LessonCodeCompare,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const AspnetControllerDiLesson = ({
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
        学完本节后，你应该能写 Controller + Service + DTO 的最小 CRUD，正确选择 DI
        生命周期（Singleton / Scoped / Transient），用构造函数注入服务，配置 HTTP
        方法、路由参数和模型绑定，并用授权策略保护端点。
      </p>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          现在你已经有 <code>TaskHub.Core</code> 中的领域类型和 DTO。本节把它们接到 <code>TaskHub.Api</code>：先实现 Projects / WorkItems 的 Controller + Service 主线。
        </p>
      </TeacherTask>

      <h3>DI 依赖注入</h3>
      <p>
        ASP.NET Core 内置 DI 容器。注册服务后通过<strong>构造函数注入</strong>
        使用，与 NestJS 完全一致。<strong>关键差异</strong>：不需要{" "}
        <code>@Injectable()</code> 装饰器，任何可公开构造的类型都可以被注入。
      </p>

      <LessonCode
        code={`// 注册
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IWorkItemService, WorkItemService>();

// 使用 — 通过构造函数注入（与 NestJS 完全一致！）
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }
}`}
        language="csharp"
        title="注册与注入"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能在 <code>Program.cs</code> 注册 Service，并在 Controller 构造函数中注入接口使用。
          </p>
        }
        id="aspnet-controller-di-register-service"
        title="完成 DI 注册与构造函数注入"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h4>生命周期对照</h4>
      <LessonTable
        headers={["生命周期", "NestJS", "ASP.NET Core", "行为"]}
        rows={[
          ["Singleton", "默认 / scope: Scope.DEFAULT", "AddSingleton<T>()", "整个应用生命周期，全局唯一"],
          ["Scoped", "scope: Scope.REQUEST（近似）", "AddScoped<T>()", "每个 HTTP 请求内唯一"],
          ["Transient", "scope: Scope.TRANSIENT", "AddTransient<T>()", "每次注入创建新实例"],
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
        code={`public class WorkItemsController : ControllerBase
{
    // @Body → 方法参数（从 Request Body 绑定）
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkItemRequest request)
    {
        var item = await _workItemService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
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
        return Ok(await _workItemService.GetAllAsync(page, pageSize, search));
    }

    // @Headers
    [HttpGet("mine")]
    public IActionResult GetMyWorkItems([FromHeader] string authorization) { ... }
}`}
        language="csharp"
        title="FromBody / FromQuery / FromHeader"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能写出包含 <code>[HttpPost]</code>、<code>[HttpGet]</code>、
            <code>[FromBody]</code>、<code>[FromQuery]</code> 的 Controller 方法。
          </p>
        }
        id="aspnet-controller-di-controller-binding"
        title="完成 Controller 路由与模型绑定"
        onToggleChecklistItem={onToggleChecklistItem}
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
    options.AddPolicy("ProjectOwnerOnly", policy =>
        policy.RequireRole("ProjectOwner"));

    // 基于声明的策略
    options.AddPolicy("CanArchiveProject", policy =>
        policy.RequireClaim("permission", "project:archive"));

    // 基于资源的策略（自定义 Requirement）
    options.AddPolicy("ProjectOwner", policy =>
        policy.AddRequirements(new ProjectOwnerRequirement()));
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
        code={`public class ProjectOwnerRequirement : IAuthorizationRequirement { }

public class ProjectOwnerHandler : AuthorizationHandler<ProjectOwnerRequirement>
{
    private readonly IProjectService _projectService;

    public ProjectOwnerHandler(IProjectService projectService)
    {
        _projectService = projectService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ProjectOwnerRequirement requirement)
    {
        if (context.Resource is HttpContext httpContext)
        {
            var projectId = httpContext.Request.RouteValues["id"]?.ToString();
            var userId = httpContext.User.FindFirst("sub")?.Value;

            if (projectId != null && userId != null)
            {
                var isOwner = await _projectService.IsProjectOwnerAsync(projectId, userId);
                if (isOwner)
                {
                    context.Succeed(requirement);
                }
            }
        }
    }
}

// 注册
builder.Services.AddScoped<IAuthorizationHandler, ProjectOwnerHandler>();

// 使用
[Authorize(Policy = "ProjectOwner")]
[HttpDelete("{id}")]
public async Task<IActionResult> ArchiveProject(string id) { ... }`}
        language="csharp"
        title="ProjectOwnerHandler"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已理解 <code>[Authorize]</code>、Policy 和 <code>AuthorizationHandler</code>
            的分工，能把复杂授权逻辑收敛到可注入类中。
          </p>
        }
        id="aspnet-controller-di-authorization"
        title="完成授权策略理解"
        onToggleChecklistItem={onToggleChecklistItem}
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

      <TeacherTask title="Phase 1 主线任务">
        <p>
          在 TaskHub 中完成 Phase 1：实现 Projects / WorkItems CRUD — Controller + Service + DTO
          三层分离，并为项目归档、任务创建等操作预留授权策略入口。
        </p>
      </TeacherTask>

    </LessonShell>
  );
};
