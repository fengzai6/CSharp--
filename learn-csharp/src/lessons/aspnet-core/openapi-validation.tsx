import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const AspnetOpenApiValidationLesson = ({
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
        学完本节后，你应该能用两种方式做模型验证（Data Annotations 与
        FluentValidation），用 Minimal API 写轻量端点，理解 Endpoint Filters
        的适用边界，配置 OpenAPI 文档和 Swagger UI，并按合理的文件夹结构组织项目。
      </p>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          上一节已经有 Projects / WorkItems 的 Controller + Service 主线。本节给创建项目、创建任务、更新任务状态这些入口补验证和 OpenAPI 描述，让接口契约可以被前端和测试稳定复用。
        </p>
      </TeacherTask>

      <h3>数据验证</h3>
      <p>
        验证发生在「模型绑定之后、Action 之前」：请求 JSON 先变成 DTO 实例，再跑规则；失败则直接
        400，进不了业务代码。对照 NestJS：就是全局{" "}
        <code>ValidationPipe</code> + DTO 上的 class-validator 装饰器。
      </p>
      <h4>方式一：Data Annotations</h4>
      <p>
        类似 NestJS 的 class-validator，用属性标注在 DTO 字段上。这个 class 替换了上一节{" "}
        <code>controller-di</code> 中的{" "}
        <code>record CreateWorkItemRequest(string ProjectId, string Title)</code>
        ，新增了 <code>Description</code>、<code>AssigneeId</code>、
        <code>DueDate</code> 字段。为何从 record 改成 class？DataAnnotations
        和 FluentValidation 都更习惯可写属性；位置参数 record 也能验证，但教学示例用 class 更直观。
      </p>

      <LessonCode
        code={`using System.ComponentModel.DataAnnotations;

namespace TaskHub.Api.Models.Requests;

public class CreateWorkItemRequest
{
    [Required(ErrorMessage = "项目 ID 不能为空")] // ≈ @IsNotEmpty()
    public string ProjectId { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)] // ≈ @Length(2, 120)
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    public string? AssigneeId { get; set; }
    public DateTime? DueDate { get; set; }
}`}
        language="csharp"
        title="Models/Requests/CreateWorkItemRequest.cs"
      />
      <p>
        内置验证属性：<code>[Required]</code>、<code>[StringLength]</code>、{" "}
        <code>[EmailAddress]</code>、<code>[Phone]</code>、<code>[Range]</code>、{" "}
        <code>[RegularExpression]</code>、<code>[Url]</code>、{" "}
        <code>[CreditCard]</code>。简单字段够用；跨字段（「截止时间必须晚于现在」）写起来别扭，这时上 FluentValidation。
      </p>

      <h4>方式二：FluentValidation（推荐）</h4>
      <p>
        对应 class-validator，但规则写在<strong>独立验证器类</strong>里用链式
        API，不污染 DTO，跨字段、异步、查库都更顺手。
      </p>

      <LessonCode
        code={`# 在解决方案根目录执行；把包加进 TaskHub.Api 项目的 PackageReference
# 副作用：修改 TaskHub.Api.csproj，还原时会下载 NuGet 包
dotnet add TaskHub.Api/TaskHub.Api.csproj package FluentValidation
dotnet add TaskHub.Api/TaskHub.Api.csproj package FluentValidation.AspNetCore`}
        language="bash"
        title="安装 FluentValidation"
      />

      <p>
        这里装两个包是因为职责不同：<code>FluentValidation</code> 提供验证规则本身，
        <code>FluentValidation.AspNetCore</code> 把验证接入 ASP.NET Core 的模型绑定流程。只安装前者，你可以手动调用验证器；安装后者，Controller
        才能在请求进入 Action 前自动校验 DTO。
      </p>

      <LessonCode
        code={`using FluentValidation;

// AbstractValidator<T>：T 是被验证的 DTO 类型
public class CreateWorkItemRequestValidator : AbstractValidator<CreateWorkItemRequest>
{
    public CreateWorkItemRequestValidator()
    {
        // RuleFor 指定字段；链式 NotEmpty / Length 等类似 class-validator
        RuleFor(x => x.ProjectId)
            .NotEmpty()
            .WithMessage("项目 ID 不能为空");

        RuleFor(x => x.Title)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(120)
            .WithMessage("任务标题长度应在 2-120 之间");

        // When：仅当 Description 有值时才限制长度（null 跳过）
        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => x.Description is not null);

        // 跨字段：RuleFor(x => x) 针对整个对象，class-validator 要自定义装饰器才好做
        RuleFor(x => x)
            .Must(x => x.DueDate is null || x.DueDate.Value > DateTime.UtcNow)
            .WithMessage("截止时间必须晚于当前时间");
    }
}`}
        language="csharp"
        title="FluentValidation 验证器"
      />

      <p>注册验证器（全局自动校验）：</p>

      <LessonCode
        code={`// 1. 文件顶部添加 using：
using FluentValidation;
using FluentValidation.AspNetCore;
using TaskHub.Api.Validators;

// 2. builder.Services 部分添加：
// 接入 MVC 模型验证，失败自动 400（需配合 [ApiController]）
builder.Services.AddFluentValidationAutoValidation();
// 扫描 CreateWorkItemRequestValidator 所在程序集，注册所有 AbstractValidator<>
builder.Services.AddValidatorsFromAssemblyContaining<CreateWorkItemRequestValidator>();`}
        language="csharp"
        title="注册验证器"
      />
      <LessonQuote>
        <code>AddFluentValidationAutoValidation()</code> 主要服务 Controller
        模型绑定流程；Minimal API 通常用 Endpoint Filter 或在端点里显式调用验证器，不要混用两套写法。
      </LessonQuote>

      <h4>落盘</h4>
      <p>
        先用 class 版 <code>CreateWorkItemRequest</code> 覆盖上一节的 record（验证器依赖 <code>Description</code> / <code>DueDate</code>），再写入验证器；<code>AddValidatorsFromAssemblyContaining&lt;CreateWorkItemRequestValidator&gt;</code> 会自动扫描并注册：
      </p>

      <LessonCode
        code={`mkdir -p TaskHub.Api/Validators`}
        language="bash"
        title="创建 Validators 目录"
      />

      <LessonCode
        code={`using System.ComponentModel.DataAnnotations;

namespace TaskHub.Api.Models.Requests;

public class CreateWorkItemRequest
{
    [Required(ErrorMessage = "项目 ID 不能为空")]
    public string ProjectId { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    public string? AssigneeId { get; set; }
    public DateTime? DueDate { get; set; }
}`}
        language="csharp"
        title="Models/Requests/CreateWorkItemRequest.cs（覆盖旧 record）"
      />

      <LessonCode
        code={`using FluentValidation;
using TaskHub.Api.Models.Requests;

namespace TaskHub.Api.Validators;

public class CreateWorkItemRequestValidator : AbstractValidator<CreateWorkItemRequest>
{
    public CreateWorkItemRequestValidator()
    {
        RuleFor(x => x.ProjectId)
            .NotEmpty()
            .WithMessage("项目 ID 不能为空");

        RuleFor(x => x.Title)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(120)
            .WithMessage("任务标题长度应在 2-120 之间");

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => x.Description is not null);

        RuleFor(x => x)
            .Must(x => x.DueDate is null || x.DueDate.Value > DateTime.UtcNow)
            .WithMessage("截止时间必须晚于当前时间");
    }
}`}
        language="csharp"
        title="Validators/CreateWorkItemRequestValidator.cs"
      />

      <h4>更新 Program.cs</h4>
      <LessonCode
        code={`// 1. 文件顶部添加 using：
using FluentValidation;
using FluentValidation.AspNetCore;
using TaskHub.Api.Validators;

// 2. builder.Services 部分添加：
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateWorkItemRequestValidator>();`}
        language="csharp"
        title="Program.cs 注册 FluentValidation"
      />

      <p>
        写完运行 <code>dotnet build TaskHub.Api</code> 确认编译通过。如果报 <code>Description</code> / <code>DueDate</code> 找不到，先确认已用 class 版覆盖旧 record；如果自动校验不生效，先确认 <code>Program.cs</code> 已注册 FluentValidation，且 Controller 上有 <code>[ApiController]</code>。
      </p>

      <h4>class-validator 与 FluentValidation 对比</h4>
      <LessonTable
        headers={["维度", "class-validator", "FluentValidation"]}
        rows={[
          ["配置方式", "装饰器写在 DTO 上", "独立 Validator 类"],
          ["跨字段验证", "有限（常要自定义装饰器）", "RuleFor(x => x) + Must 完整支持"],
          ["异步验证", "支持", "支持（MustAsync）"],
          ["数据库存在性检查", "手动", "可在 Validator 里注入 Service"],
          ["消息自定义", "简单", "WithMessage / 本地化更强"],
          ["性能", "反射", "编译期表达式树"],
        ]}
      />

      <h3>Minimal API — 轻量 API 入口方式</h3>
      <p>
        .NET 6 引入的轻量级 API 定义方式，不需要 Controller 类，适合小型服务、网关、内部 API 和函数式端点组织。
        心智模型：像 Express 的 <code>app.get(&apos;/x&apos;, handler)</code>，或 Nest
        里不用 class、直接挂路由函数。
      </p>
      <p>
        参数列表里的服务类型（如 <code>IProjectService</code>
        ）会从 DI 解析——这叫<strong>参数注入</strong>，不必写构造函数。简单类型从路由/查询绑定，复杂类型默认从
        Body 绑定（和 Minimal API 的约定一致）。
      </p>

      <LessonCode
        code={`var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// MapGroup：公共前缀 + 可链式 RequireAuthorization（组内端点默认要登录）
// 类似 NestJS 的 GlobalPrefix + Controller prefix + @UseGuards 挂在 Controller 上
var projectsGroup = app.MapGroup("/api/projects").RequireAuthorization();
var workItemsGroup = app.MapGroup("/api/work-items").RequireAuthorization();

// MapPost：POST /api/projects/
// request 从 Body 绑定；projects 从 DI 注入
projectsGroup.MapPost("/", async (CreateProjectRequest request, IProjectService projects) =>
{
    var project = await projects.CreateAsync(request);
    // Results.* ≈ ControllerBase 的 Ok/Created/NotFound 工厂
    return Results.Created($"/api/projects/{project.Id}", project);
});

// MapGet：GET /api/work-items/{id}；id 来自路由段
workItemsGroup.MapGet("/{id}", async (string id, IWorkItemService service) =>
{
    var item = await service.GetByIdAsync(id);
    return item is null ? Results.NotFound() : Results.Ok(item);
});

app.Run();`}
        language="csharp"
        title="Minimal API"
      />

      <h4>Minimal API vs Controller 对照</h4>
      <LessonTable
        headers={["维度", "Minimal API", "Controller"]}
        rows={[
          ["代码量", "少 60-80%", "传统模式"],
          ["学习曲线", "低（类似 TS 函数）", "中等"],
          ["依赖注入", "参数即 DI", "构造函数注入"],
          ["返回值", "Results.Ok / Created / ...", "Ok() / CreatedAtAction() / ..."],
          ["测试", "直接测试端点函数", "需模拟 ControllerBase"],
          ["NestJS 对照", "类似 app 上直接挂 handler", "类似 @Controller 类"],
        ]}
      />

      <LessonQuote>
        推荐策略：先用 Controller 快速上手（与你的 NestJS 习惯匹配），完成一个稳定 CRUD 后再学习 Minimal API。不要一开始同时混用两套风格。
      </LessonQuote>

      <h3>Endpoint Filters — Minimal API 的端点级拦截</h3>
      <p>
        Endpoint Filters 适合 Minimal API 的单个端点或端点组拦截。它<strong>不是</strong>{" "}
        Middleware、Controller Filter 或 <code>[Authorize]</code> 的通用替代品：
      </p>
      <p>
        执行时机：路由已匹配到该端点之后、handler 运行前后。可短路返回{" "}
        <code>Results.BadRequest(...)</code>，也可 <code>await next(context)</code>{" "}
        后改写结果。对照：比全局 Middleware 细，比 Nest Interceptor 更贴「单个路由」。
      </p>

      <LessonCode
        code={`// 挂在单个 MapGet 上：只影响这一条路由
app.MapGet("/work-items/{id}", async (string id, IWorkItemService service) =>
    await service.GetByIdAsync(id))
    .AddEndpointFilter(async (context, next) =>
    {
        // context：本次调用参数 + HttpContext；next：真正的 handler（或下一个 Filter）
        var workItemId = context.HttpContext.Request.RouteValues["id"]?.ToString();
        if (workItemId == null)
            return Results.BadRequest("Invalid ID"); // 短路，不进 handler
        return await next(context);
    });`}
        language="csharp"
        title="Endpoint Filter"
      />

      <ul>
        <li>Endpoint Filter 做「能不能进 handler」≈ Nest Guard 的 canActivate</li>
        <li>Endpoint Filter 改 Result ≈ Nest Interceptor 改响应</li>
        <li>比 Middleware 更细粒度（针对特定端点，不是全局管道）</li>
      </ul>

      <LessonQuote>
        常见误区：把 Endpoint Filters 当成 Middleware 或 Controller Filter
        的通用替代。全局横切逻辑仍用 Middleware，Controller 项目仍优先用 MVC Filter
        和属性，认证授权仍用 ASP.NET Core 的 Authentication / Authorization。
      </LessonQuote>

      <h3>OpenAPI / Swagger API 文档</h3>
      <LessonQuote>
        先区分两件事：OpenAPI 是<strong>机器可读的 API 描述</strong>（一份 JSON/YAML
        契约，前端可用来生成类型），Swagger UI / Scalar 是
        <strong>展示和调试这份契约的网页</strong>
        。很多人把「Swagger」当作文档总称，实际要分清「文档数据」和「文档 UI」。
      </LessonQuote>
      <p>
        对照 NestJS：<code>@nestjs/swagger</code> 的{" "}
        <code>SwaggerModule.createDocument</code> ≈ 生成 OpenAPI；
        <code>SwaggerModule.setup(&apos;api&apos;, ...)</code> ≈ 挂 UI。在 .NET
        里这两步也是分开注册的。
      </p>

      <h4>.NET 9+ 内置 OpenAPI</h4>
      <p>
        <code>AddOpenApi</code> + <code>MapOpenApi</code> 只产出文档端点（常见{" "}
        <code>/openapi/v1.json</code>
        ），<strong>不带</strong>浏览器 UI。需要点一点试接口时，再加 Swashbuckle 的
        Swagger UI 或 Scalar。
      </p>
      <LessonCode
        code={`builder.Services.AddOpenApi(); // 注册 OpenAPI 文档生成服务

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // 暴露 OpenAPI JSON 端点（无 UI）
}`}
        language="csharp"
        title="内置 OpenAPI"
      />

      <h4>用 Swashbuckle 提供 Swagger UI（含 JWT 认证支持）</h4>
      <p>
        如果你在 setup 章节选择了 Scalar，这里可以跳过；Scalar 的 JWT 支持在 Auth 章节再补。如果选择 Swashbuckle，按以下步骤配置：
      </p>

      <LessonCode
        code={`# --version 钉死版本，避免 major 升级悄悄改 API
# 副作用：写入 csproj PackageReference，需能访问 NuGet
dotnet add TaskHub.Api/TaskHub.Api.csproj package Swashbuckle.AspNetCore --version 7.1.0`}
        language="bash"
        title="安装 Swashbuckle"
      />

      <LessonCode
        code={`// 1. 文件顶部添加 using：
using Microsoft.OpenApi.Models;

// 2. builder.Services 部分添加：
builder.Services.AddEndpointsApiExplorer(); // 收集端点元数据，供 Swagger 生成用
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TaskHub API",
        Version = "v1",
        Description = "任务协作系统后端 API"
    });

    // 让 Swagger UI 右上角出现 Authorize，可填 Bearer Token
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "输入格式: Bearer {your JWT token}"
    });
});

// 3. var app = builder.Build(); 之后，开发环境判断内添加：
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();   // 提供 swagger.json
    app.UseSwaggerUI(); // 浏览器打开 /swagger 调试
}`}
        language="csharp"
        title="Program.cs 完整 Swashbuckle 配置"
      />
      <p>
        跑起来后开发环境访问 <code>/swagger</code> 应看到 UI；
        <code>/swagger/v1/swagger.json</code> 是原始 OpenAPI 文档。生产环境示例用{" "}
        <code>IsDevelopment()</code> 包住，避免把调试 UI 暴露到公网。
      </p>

      <h4>Controller 中的 Swagger 装饰</h4>
      <p>
        用 XML 注释和 <code>[ProducesResponseType]</code>{" "}
        声明返回类型与状态码，让文档更完整。对照 Nest：类似{" "}
        <code>@ApiOkResponse</code> / <code>@ApiResponse</code>。
      </p>

      <LessonCode
        code={`/// <summary>
/// 创建任务 — 出现在 Swagger 操作描述里（需开启 XML 注释生成，可选）
/// </summary>
[HttpPost]
// 告诉文档生成器：成功是 201 + WorkItemSummaryDto；失败可能是 400 校验错误
[ProducesResponseType(typeof(WorkItemSummaryDto), StatusCodes.Status201Created)]
[ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
public async Task<ActionResult<WorkItemSummaryDto>> Create([FromBody] CreateWorkItemRequest request)
{
    var item = await _workItemService.CreateAsync(request);
    return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
}`}
        language="csharp"
        title="ProducesResponseType"
      />

      <h3>DTO ↔ Entity 映射</h3>
      <p>
        在 Controller 和 Service 中经常需要把 Entity 转换为 DTO（或反向）。课程主线全程使用手动映射（<code>new WorkItemSummaryDto(...)</code>），这在小项目中够用，而且好处是映射逻辑完全透明。当字段差异变大时，可以考虑 <code>Mapster</code> 或 <code>AutoMapper</code>，但不要因为&quot;看起来高级&quot;而过早引入。
      </p>
      <p>
        对照 TS：就是手写{" "}
        <code>{"{ id: entity.id, title: entity.title }"}</code>
        ，或 class-transformer 的 <code>plainToInstance</code>
        。扩展方法 <code>ToDto(this WorkItem)</code> 让调用变成{" "}
        <code>item.ToDto()</code>，读起来顺。
      </p>
      <LessonCode
        code={`// 手动映射（课程主线使用的方式）
public static WorkItemSummaryDto ToDto(this WorkItem item) => new(
    item.Id, item.ProjectId, item.Title, item.Status,
    null,  // AssigneeName — EF 接入后从 navigation 属性取
    null   // DueDate — EF 接入后从实体取
);`}
        language="csharp"
        title="手动映射"
      />

      <h3>架构最佳实践</h3>
      <p>推荐两种文件夹结构：</p>

      <h4>方式一：分层结构（传统，适合从 NestJS 过渡）</h4>
      <LessonCode
        code={`src/
├── Program.cs              # 入口 + 服务注册
├── Models/
│   ├── Entities/           # 数据库实体（对应 TypeORM Entity）
│   ├── Dtos/               # 数据传输对象（推荐用 record）
│   │   ├── Requests/
│   │   └── Responses/
│   └── Interfaces/         # 接口定义
├── Services/               # 业务逻辑
├── Controllers/            # API 端点
├── Data/                   # 数据库 DbContext
├── Middleware/             # 中间件
└── Shared/                 # 共享基础设施`}
        language="text"
        title="分层结构"
      />

      <h4>方式二：Feature-First 结构（可作为后续重构选择）</h4>
      <p>
        与 NestJS 的 <code>modules/user/</code> 类似，更扁平、更自包含：
      </p>

      <LessonCode
        code={`src/
├── Program.cs
├── Extensions/
│   ├── ServiceCollectionExtensions.cs   # 服务注册
│   └── EndpointMapperExtensions.cs      # 端点注册
├── Features/
│   ├── Auth/
│   │   ├── AuthEndpoints.cs             # Minimal API 路由
│   │   ├── AuthService.cs               # 业务逻辑
│   │   ├── AuthValidators.cs            # FluentValidation
│   │   └── AuthMappers.cs               # 对象映射
│   └── WorkItems/
│       ├── WorkItemEndpoints.cs
│       ├── WorkItemService.cs
│       └── WorkItemValidators.cs
├── Data/
└── Shared/`}
        language="text"
        title="Feature-First 结构"
      />

      <TeacherTask title="老师提示">
        <p>
          TaskHub 主线当前保持 Api/Core/Infrastructure 三项目结构，早期先用 Controller 降低迁移成本。Feature-First 可以作为单个项目内部组织方式参考，但不要因此打破 Core 不依赖外层的边界。
        </p>
      </TeacherTask>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已用 class 版 <code>CreateWorkItemRequest</code> 替换旧 record，写入 <code>CreateWorkItemRequestValidator</code> 并注册 FluentValidation，能区分 OpenAPI 与 Swagger UI，并为项目选择一种稳定目录结构，<code>dotnet build TaskHub.Api</code> 编译通过。
          </p>
        }
        id="aspnet-openapi-validation-main"
        title="完成验证与 API 文档主线"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>Controller 和 Minimal API 各自适合什么场景？</li>
        <li>OpenAPI 和 Swagger UI 是同一件事吗？</li>
        <li>FluentValidation 相比 Data Annotations 在跨字段验证上有什么优势？</li>
        <li>
          <code>AddOpenApi</code> 和 <code>AddSwaggerGen</code>{" "}
          哪个自带浏览器调试 UI？
        </li>
      </ul>

      <TeacherTask title="Phase 1 项目状态">
        <p>
          到这里，TaskHub 的 Projects / WorkItems API 已具备 Controller、Service、DTO、FluentValidation 和 OpenAPI 描述。下一章会把这些接口背后的数据从示例逻辑推进到 EF Core 持久化。
        </p>
      </TeacherTask>
    </LessonShell>
  );
};
