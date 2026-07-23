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
      <p>
        注册写法 <code>AddScoped&lt;IProjectService, ProjectService&gt;()</code>{" "}
        读作：需要 <code>IProjectService</code> 时，容器创建{" "}
        <code>ProjectService</code> 实例。接口在前、实现在后——Controller
        只依赖接口，方便单测 mock（和 NestJS 的{" "}
        <code>{"{ provide: IXxx, useClass: Xxx }"}</code> 一个意思）。
      </p>

      <LessonCode
        code={`// 注册：接口 → 实现；生命周期见下表
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IWorkItemService, WorkItemService>();

// 使用 — 通过构造函数注入（与 NestJS 完全一致！）
// 框架创建 Controller 时，自动解析构造函数参数并注入
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
      <p>
        NestJS 默认大多是 Singleton（DEFAULT）；ASP.NET Core
        没有「默认你不写就怎样」的业务服务——每个服务注册时必须显式选生命周期。和
        Nest 的 <code>Scope.REQUEST</code> 最接近的是 <code>AddScoped</code>
        ：同一 HTTP 请求内共享一个实例，请求结束释放。
      </p>
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
      <p>
        <strong>Captive dependency（俘虏依赖）</strong>
        ：Singleton 服务的构造函数里<strong>不能</strong>直接注入 Scoped
        服务。原因：Singleton 只创建一次，会把 Scoped 实例「抓住」变成事实上的单例，后续请求共用同一个
        DbContext——线程不安全、数据串请求。对照：NestJS 里 DEFAULT scope 注入
        REQUEST scope 也会有同类问题。解法：把外层也改成 Scoped，或在 Singleton
        内通过 <code>IServiceScopeFactory</code> 按需开短生命周期作用域（本节先记住别这样注入）。
      </p>

      <h3>Controller 与路由</h3>
      <p>
        Controller 继承 <code>ControllerBase</code>（API 专用基类，没有
        View 相关成员；若继承 <code>Controller</code> 会带上 MVC 视图能力，Web
        API 项目一般不需要）。用 <code>[ApiController]</code> 打开 API
        约定（自动 400、从 body 推断绑定源等），用 <code>[Route]</code>{" "}
        定前缀。对照 NestJS：
      </p>
      <p>
        路由里的 <code>[controller]</code> 是<strong>约定占位符</strong>
        ：类名去掉后缀 <code>Controller</code> 再转小写风格——
        <code>AuthController</code> → <code>api/Auth</code>（实际段名默认是去掉
        Controller 后的名字）。也可以写死{" "}
        <code>[Route(&quot;api/auth&quot;)]</code>，和 Nest 的{" "}
        <code>@Controller(&apos;auth&apos;)</code> 一样明确。
      </p>

      <LessonCodeCompare
        leftTitle="NestJS"
        leftCode={`@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginRequest) {
    return this.authService.login(dto);
  }
}`}
        leftLanguage="typescript"
        rightTitle="ASP.NET Core"
        rightCode={`[ApiController]
[Route("api/[controller]")] // AuthController → api/Auth
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")] // POST api/Auth/login
    public async Task<ActionResult> Login(LoginRequest dto)
    {
        // Ok(...) → 200 + JSON；ActionResult 让你能返回多种状态码
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

      <h4>返回类型：ActionResult / IActionResult</h4>
      <p>
        NestJS Controller 常直接 <code>return data</code>（默认 200）或抛{" "}
        <code>NotFoundException</code>。ASP.NET Core 习惯返回{" "}
        <code>IActionResult</code> / <code>ActionResult&lt;T&gt;</code>
        ，用工厂方法表达状态码：
      </p>
      <LessonTable
        headers={["方法", "HTTP", "NestJS 近似"]}
        rows={[
          ["Ok(data)", "200", "return data"],
          ["CreatedAtAction(...)", "201 + Location", "return 新建对象（需自设状态码）"],
          ["NoContent()", "204", "return; / @HttpCode(204)"],
          ["NotFound()", "404", "throw new NotFoundException()"],
          ["BadRequest(errors)", "400", "throw new BadRequestException()"],
          ["Unauthorized()", "401", "throw new UnauthorizedException()"],
          ["Forbid()", "403", "throw new ForbiddenException()"],
        ]}
      />
      <p>
        <code>ActionResult&lt;WorkItem&gt;</code> = 既能{" "}
        <code>return item</code>（隐式 200）也能{" "}
        <code>return NotFound()</code>；比裸 <code>IActionResult</code>{" "}
        多了 OpenAPI 对成功体类型的推断。
        <code>CreatedAtAction(nameof(GetById), new {"{"} id {"}"}, item)</code>{" "}
        会生成 201，并在 <code>Location</code> 头写入指向{" "}
        <code>GetById</code> 的 URL——REST 创建资源的惯用写法。
      </p>

      <h4>路由参数</h4>
      <LessonCodeCompare
        leftTitle="NestJS"
        leftCode={`@Get(':id')
findOne(@Param('id') id: string) { ... }`}
        leftLanguage="typescript"
        rightTitle="ASP.NET Core"
        rightCode={`[HttpGet("{id}")]
// 路径段名与参数名一致时，框架自动从路由绑定，无需 [FromRoute]
public ActionResult Get(string id) { ... }`}
        rightLanguage="csharp"
      />

      <h4>模型绑定</h4>
      <p>
        框架自动把请求数据绑定到方法参数，与 NestJS 的 <code>@Body</code>、{" "}
        <code>@Param</code>、<code>@Query</code>、<code>@Headers</code> 对应。
        有 <code>[ApiController]</code> 时，复杂类型参数默认从 Body
        读，简单类型从路由/查询串推断；写上 <code>[FromBody]</code> /{" "}
        <code>[FromQuery]</code> 更直观，也避免推断不符合预期。
      </p>

      <LessonCode
        code={`public class WorkItemsController : ControllerBase
{
    // @Body → 方法参数（从 Request Body 绑定 JSON）
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkItemRequest request)
    {
        var item = await _workItemService.CreateAsync(request);
        // 201 + Location: .../WorkItems/{id} + body
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    // @Param → URL 路径参数（{id} 与参数名 id 对应）
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id) { ... }

    // @Query → ?page=1&pageSize=20&search=foo
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        return Ok(await _workItemService.GetAllAsync(page, pageSize, search));
    }

    // @Headers → 读请求头；注意 header 名大小写在 HTTP/2 下不敏感
    [HttpGet("mine")]
    public IActionResult GetMyWorkItems([FromHeader] string authorization) { ... }
}`}
        language="csharp"
        title="FromBody / FromQuery / FromHeader"
      />

      <LessonQuote>
        <code>[ApiController]</code> 特性会让框架在模型绑定失败时自动返回 400 状态码和 <code>ModelState</code> 错误信息，不需要在每个 Action 里手动检查 <code>if (!ModelState.IsValid)</code>。这是与 NestJS 手动验证的重要差异——Nest 的{" "}
        <code>ValidationPipe</code> 是你在 <code>main.ts</code>{" "}
        里显式挂上的；这里打上特性就默认开启。
      </LessonQuote>

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
        对应 NestJS Guard。先分清两步：
        <strong>认证</strong>（Authentication）= 你是谁（解析 JWT，填{" "}
        <code>HttpContext.User</code>）；
        <strong>授权</strong>（Authorization）= 你能不能做（检查角色/策略）。
        管道里必须先 <code>UseAuthentication</code> 再{" "}
        <code>UseAuthorization</code>（上一课已讲）。端点上用{" "}
        <code>[Authorize]</code> 声明保护，对应 Nest 的{" "}
        <code>@UseGuards(JwtAuthGuard)</code>。
      </p>

      <LessonCodeCompare
        leftTitle="NestJS"
        leftCode={`@UseGuards(JwtAuthGuard)
@RolesGuard('admin')
@Post('delete')
async delete(@RequestUser() user: User, @Param('id') id: string) { ... }`}
        leftLanguage="typescript"
        rightTitle="ASP.NET Core"
        rightCode={`// 必须已登录（有有效身份）
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
// 且满足名为 AdminOnly 的策略（见下方配置）
[Authorize(Policy = "AdminOnly")]
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(string id) { ... }`}
        rightLanguage="csharp"
      />

      <h4>策略配置</h4>
      <p>
        Policy 是命名的授权规则集合，在 <code>Program.cs</code> 注册一次，端点用名字引用。
        比到处写角色字符串更集中，也好测。
      </p>
      <LessonCode
        code={`builder.Services.AddAuthorization(options =>
{
    // 角色：User.IsInRole("ProjectOwner") 为 true 才通过
    options.AddPolicy("ProjectOwnerOnly", policy =>
        policy.RequireRole("ProjectOwner"));

    // 声明（Claim）：JWT payload 里要有 permission=project:archive
    options.AddPolicy("CanArchiveProject", policy =>
        policy.RequireClaim("permission", "project:archive"));

    // 资源级：不能只靠 JWT 静态信息，要查库判断「是不是这个项目的 owner」
    options.AddPolicy("ProjectOwner", policy =>
        policy.AddRequirements(new ProjectOwnerRequirement()));
});`}
        language="csharp"
        title="授权策略"
      />

      <h4>自定义授权 Handler</h4>
      <p>
        复杂授权逻辑用 <code>IAuthorizationRequirement</code>（规则标记，可空类）+{" "}
        <code>AuthorizationHandler&lt;T&gt;</code>（真正判断），对应 NestJS 自定义
        Guard 的 <code>canActivate</code>。Handler 本身可注入 Service，因此能查库。
      </p>

      <LessonCode
        code={`// 规则标记：本身可以没有字段，只是类型身份
public class ProjectOwnerRequirement : IAuthorizationRequirement { }

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
        // 从当前请求取路由 id + JWT 里的 sub（用户 id）
        if (context.Resource is HttpContext httpContext)
        {
            var projectId = httpContext.Request.RouteValues["id"]?.ToString();
            var userId = httpContext.User.FindFirst("sub")?.Value;

            if (projectId != null && userId != null)
            {
                var isOwner = await _projectService.IsProjectOwnerAsync(projectId, userId);
                if (isOwner)
                {
                    context.Succeed(requirement); // 通过；不调用则默认失败 → 403
                }
            }
        }
    }
}

// Handler 必须注册进 DI，否则策略永远不会成功
builder.Services.AddScoped<IAuthorizationHandler, ProjectOwnerHandler>();

// 端点：名字对应上面 AddPolicy("ProjectOwner", ...)
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
        <li>
          <code>Ok()</code>、<code>NotFound()</code>、
          <code>CreatedAtAction()</code> 各对应什么 HTTP 状态码？
        </li>
      </ul>

      <h3>写入 TaskHub.Api — WorkItems CRUD</h3>
      <p>
        在 <code>TaskHub.Api</code> 中创建目录和文件，实现一个可跑通的 WorkItems CRUD（先不做 Projects，避免跨度太大）。Controller 模式默认没有启用，需要先在 <code>Program.cs</code> 注册。
      </p>
      <p>
        <code>mkdir -p</code>：递归创建目录，已存在不报错（macOS/Linux）。Windows
        PowerShell 可用 <code>New-Item -ItemType Directory -Force</code>。
      </p>

      <LessonCode
        code={`# 在仓库解决方案根目录执行；-p = 父目录不存在也一并创建
mkdir -p TaskHub.Api/Controllers
mkdir -p TaskHub.Api/Services
mkdir -p TaskHub.Api/Models/Requests`}
        language="bash"
        title="创建目录"
      />

      <h4>Models/Requests/CreateWorkItemRequest.cs</h4>
      <p>
        用 <code>record</code> 做请求 DTO：不可变、带位置参数构造函数，适合「只进不出」的入参。下一课验证会改成 class + 属性，以便挂 DataAnnotations。
      </p>
      <LessonCode
        code={`namespace TaskHub.Api.Models.Requests;

public record CreateWorkItemRequest(string ProjectId, string Title);`}
        language="csharp"
        title="Models/Requests/CreateWorkItemRequest.cs"
      />

      <h4>Services/IWorkItemService.cs</h4>
      <p>
        接口 + 实现拆分：Controller 只依赖接口，后续换 EF 实现不用改 Controller。
        返回 <code>Task&lt;T&gt;</code> 是为了和异步 I/O 对齐（即便当前是内存实现）。
      </p>
      <LessonCode
        code={`using TaskHub.Core.Models;
using TaskHub.Api.Models.Requests;

namespace TaskHub.Api.Services;

public interface IWorkItemService
{
    Task<List<WorkItem>> GetAllAsync(int page = 1, int pageSize = 20, string? search = null);
    Task<WorkItem?> GetByIdAsync(string id);
    Task<WorkItem> CreateAsync(CreateWorkItemRequest request);
}`}
        language="csharp"
        title="Services/IWorkItemService.cs"
      />

      <h4>Services/WorkItemService.cs</h4>
      <p>
        内存列表演示：<code>Task.FromResult</code> 把同步结果包成已完成的 Task（没有真正异步 I/O 时常用）。
        <code>Skip/Take</code> 是 LINQ 分页，类似 JS 的{" "}
        <code>arr.slice((page-1)*size, page*size)</code>。
      </p>
      <LessonCode
        code={`using TaskHub.Core.Models;
using TaskHub.Api.Models.Requests;

namespace TaskHub.Api.Services;

public class WorkItemService : IWorkItemService
{
    // ponytail: 内存列表，EF Core 接入后替换为 DbContext
    private readonly List<WorkItem> _items = new();

    public Task<List<WorkItem>> GetAllAsync(int page = 1, int pageSize = 20, string? search = null)
    {
        var query = _items.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(i => i.Title.Contains(search, StringComparison.OrdinalIgnoreCase));
        var result = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Task.FromResult(result);
    }

    public Task<WorkItem?> GetByIdAsync(string id)
    {
        return Task.FromResult(_items.FirstOrDefault(i => i.Id == id));
    }

    public Task<WorkItem> CreateAsync(CreateWorkItemRequest request)
    {
        var item = new WorkItem(Guid.NewGuid().ToString(), request.ProjectId, request.Title);
        _items.Add(item);
        return Task.FromResult(item);
    }
}`}
        language="csharp"
        title="Services/WorkItemService.cs"
      />

      <h4>Controllers/WorkItemsController.cs</h4>
      <p>
        三个端点：列表（query 分页）、详情、创建。注意{" "}
        <code>nameof(GetById)</code> 用编译期方法名，重构改名时不会写断字符串。
      </p>
      <LessonCode
        code={`using Microsoft.AspNetCore.Mvc;
using TaskHub.Api.Models.Requests;
using TaskHub.Api.Services;

namespace TaskHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")] // → api/WorkItems
public class WorkItemsController : ControllerBase
{
    private readonly IWorkItemService _workItemService;

    public WorkItemsController(IWorkItemService workItemService)
    {
        _workItemService = workItemService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        return Ok(await _workItemService.GetAllAsync(page, pageSize, search));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _workItemService.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkItemRequest request)
    {
        var item = await _workItemService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }
}`}
        language="csharp"
        title="Controllers/WorkItemsController.cs"
      />

      <h4>更新 Program.cs</h4>
      <p>
        在 <code>Program.cs</code> 中完成三处修改，对照文件中已有代码的位置。
        没有 <code>AddControllers()</code>，框架不会发现 Controller；没有{" "}
        <code>MapControllers()</code>，路由不会挂到管道终点。
      </p>

      <LessonCode
        code={`// 1. 文件顶部（var builder 之前）添加 using：
using TaskHub.Api.Services;

// 2. var builder = WebApplication.CreateBuilder(args); 之后添加：
builder.Services.AddControllers(); // 启用 Controller 发现、模型绑定、[ApiController] 行为
// 内存演示：Singleton 才能跨请求保住 _items 列表（见下方 Quote）
builder.Services.AddSingleton<IWorkItemService, WorkItemService>();

// 3. var app = builder.Build(); 之后，UseHttpsRedirection 之前添加：
app.MapControllers(); // 把 [Route]/[Http*] 注册为终端节点`}
        language="csharp"
        title="Program.cs 完整修改"
      />

      <LessonQuote>
        这里 <code>WorkItemService</code> 用 <code>AddSingleton</code> 注册，因为内部的 <code>_items</code> 列表是实例字段。如果用 <code>AddScoped</code>，每个 HTTP 请求会得到新实例，POST 创建的任务在下一个 GET 请求里就看不见了。后续接入 EF Core 的 <code>DbContext</code> 后，必须改回 <code>AddScoped</code> —— <code>DbContext</code> 不是线程安全的，必须每个请求一个实例。
      </LessonQuote>

      <h4>清理模板</h4>
      <p>
        删除模板的 weather forecast 代码（<code>var summaries</code>、<code>app.MapGet("/weatherforecast", ...)</code>、<code>WeatherForecast</code> record），保持 <code>Program.cs</code> 干净。这些是{" "}
        <code>dotnet new webapi</code> 生成的示例 Minimal API，和本课 Controller 主线无关。
      </p>

      <p>
        全部完成后运行 <code>dotnet build TaskHub.Api</code> 确认编译通过。
        该命令只编译不启动站点；成功会输出{" "}
        <code>Build succeeded</code>。若报找不到类型，检查 namespace /{" "}
        <code>using</code> 和项目引用是否齐全。
      </p>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已创建 <code>Controllers/</code>、<code>Services/</code>、<code>Models/Requests/</code> 目录，写入 <code>CreateWorkItemRequest</code>、<code>IWorkItemService</code>、<code>WorkItemService</code>、<code>WorkItemsController</code>，更新 <code>Program.cs</code> 注册 Controller 和 Service，删除模板 weather forecast 代码，<code>dotnet build TaskHub.Api</code> 编译通过。
          </p>
        }
        id="aspnet-controller-di-write-files"
        title="写入 WorkItems CRUD 到 TaskHub.Api"
        onToggleChecklistItem={onToggleChecklistItem}
      />

    </LessonShell>
  );
};
