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
      <h4>方式一：Data Annotations</h4>
      <p>类似 NestJS 的 class-validator，用属性标注在 DTO 字段上。这个 class 替换了上一节 <code>controller-di</code> 中的 <code>record CreateWorkItemRequest(string ProjectId, string Title)</code>，新增了 <code>Description</code>、<code>AssigneeId</code>、<code>DueDate</code> 字段：</p>

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
        title="Models/Requests/CreateWorkItemRequest.cs"
      />
      <p>
        内置验证属性：<code>[Required]</code>、<code>[StringLength]</code>、{" "}
        <code>[EmailAddress]</code>、<code>[Phone]</code>、<code>[Range]</code>、{" "}
        <code>[RegularExpression]</code>、<code>[Url]</code>、{" "}
        <code>[CreditCard]</code>。
      </p>

      <h4>方式二：FluentValidation（推荐）</h4>
      <p>
        对应 class-validator，但用独立类 + 链式 API，比装饰器更灵活，支持跨字段验证：
      </p>

      <LessonCode
        code={`dotnet add TaskHub.Api/TaskHub.Api.csproj package FluentValidation
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

        // 跨字段验证
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

// 2. builder.Services 部分添加：
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();`}
        language="csharp"
        title="注册验证器"
      />
      <LessonQuote>
        <code>AddFluentValidationAutoValidation()</code> 主要服务 Controller
        模型绑定流程；Minimal API 通常用 Endpoint Filter 或在端点里显式调用验证器，不要混用两套写法。
      </LessonQuote>

      <h4>落盘</h4>
      <p>
        把上面的验证器写入文件，<code>AddValidatorsFromAssemblyContaining&lt;Program&gt;</code> 会自动扫描并注册：
      </p>

      <LessonCode
        code={`mkdir -p TaskHub.Api/Validators`}
        language="bash"
        title="创建 Validators 目录"
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

      <p>
        写完运行 <code>dotnet build TaskHub.Api</code> 确认编译通过。
      </p>

      <h4>class-validator 与 FluentValidation 对比</h4>
      <LessonTable
        headers={["维度", "class-validator", "FluentValidation"]}
        rows={[
          ["配置方式", "装饰器", "独立类"],
          ["跨字段验证", "有限", "完整支持"],
          ["异步验证", "支持", "支持"],
          ["数据库存在性检查", "手动", "内置支持"],
          ["消息自定义", "简单", "强大"],
          ["性能", "反射", "编译期表达式"],
        ]}
      />

      <h3>Minimal API — 轻量 API 入口方式</h3>
      <p>
        .NET 6 引入的轻量级 API 定义方式，不需要 Controller 类，适合小型服务、网关、内部 API 和函数式端点组织：
      </p>

      <LessonCode
        code={`var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// 路由分组（类似 NestJS 的 GlobalPrefix + Controller prefix）
var projectsGroup = app.MapGroup("/api/projects").RequireAuthorization();
var workItemsGroup = app.MapGroup("/api/work-items").RequireAuthorization();

// 创建项目 — 类似 NestJS @Post()
projectsGroup.MapPost("/", async (CreateProjectRequest request, IProjectService projects) =>
{
    var project = await projects.CreateAsync(request);
    return Results.Created($"/api/projects/{project.Id}", project);
});

// 获取任务 — 类似 NestJS @Get(':id')
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
          ["测试", "直接测试端点函数", "需模拟 ControllerBase"],
          ["NestJS 对照", "类似 @Controller + @Get 函数", "类似 @Controller 类"],
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

      <LessonCode
        code={`// 替代 NestJS Guard
app.MapGet("/work-items/{id}", async (string id, IWorkItemService service) =>
    await service.GetByIdAsync(id))
    .AddEndpointFilter(async (context, next) =>
    {
        // 类似 canActivate()
        var workItemId = context.HttpContext.Request.RouteValues["id"]?.ToString();
        if (workItemId == null)
            return Results.BadRequest("Invalid ID");
        return await next(context);
    });`}
        language="csharp"
        title="Endpoint Filter"
      />

      <ul>
        <li>Endpoint Filter = Guard（决定是否处理请求）</li>
        <li>Endpoint Filter + Result 修改 = Interceptor（修改请求/响应）</li>
        <li>比 Middleware 更细粒度（针对特定端点，不是全局管道）</li>
      </ul>

      <LessonQuote>
        常见误区：把 Endpoint Filters 当成 Middleware 或 Controller Filter
        的通用替代。全局横切逻辑仍用 Middleware，Controller 项目仍优先用 MVC Filter
        和属性，认证授权仍用 ASP.NET Core 的 Authentication / Authorization。
      </LessonQuote>

      <h3>OpenAPI / Swagger API 文档</h3>
      <LessonQuote>
        先区分两件事：OpenAPI 是<strong>机器可读的 API 描述</strong>，Swagger UI
        是<strong>展示和调试 OpenAPI 的页面</strong>。.NET 9+ 可以用{" "}
        <code>Microsoft.AspNetCore.OpenApi</code> 生成 OpenAPI 文档；需要浏览器中的
        Swagger UI 时，仍可用 Swashbuckle 或 Scalar 等 UI 工具。
      </LessonQuote>

      <h4>.NET 9+ 内置 OpenAPI</h4>
      <LessonCode
        code={`builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}`}
        language="csharp"
        title="内置 OpenAPI"
      />

      <h4>用 Swashbuckle 提供 Swagger UI（含 JWT 认证支持）</h4>
      <p>
        如果你在 setup 章节选择了 Scalar，这里可以跳过；Scalar 的 JWT 支持在 Auth 章节再补。如果选择 Swashbuckle，按以下步骤配置：
      </p>

      <LessonCode
        code={`dotnet add TaskHub.Api/TaskHub.Api.csproj package Swashbuckle.AspNetCore`}
        language="bash"
        title="安装 Swashbuckle"
      />

      <LessonCode
        code={`// 1. 文件顶部添加 using：
using Microsoft.OpenApi.Models;

// 2. builder.Services 部分添加：
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TaskHub API",
        Version = "v1",
        Description = "任务协作系统后端 API"
    });

    // JWT 认证支持
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
    app.UseSwagger();
    app.UseSwaggerUI();
}`}
        language="csharp"
        title="Program.cs 完整 Swashbuckle 配置"
      />

      <h4>Controller 中的 Swagger 装饰</h4>
      <p>
        用 XML 注释和 <code>[ProducesResponseType]</code>{" "}
        声明返回类型与状态码，让文档更完整：
      </p>

      <LessonCode
        code={`/// <summary>
/// 创建任务
/// </summary>
[HttpPost]
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
        在 Controller 和 Service 中经常需要把 Entity 转换为 DTO（或反向）。课程主线全程使用手动映射（<code>new WorkItemSummaryDto(...)</code>），这在小项目中够用，而且好处是映射逻辑完全透明。当字段差异变大时，可以考虑 <code>Mapster</code> 或 <code>AutoMapper</code>，但不要因为"看起来高级"而过早引入。
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
            已能为 DTO 配置 FluentValidation，区分 OpenAPI 与 Swagger UI，并为项目选择一种稳定目录结构。
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
      </ul>

      <TeacherTask title="Phase 1 项目状态">
        <p>
          到这里，TaskHub 的 Projects / WorkItems API 已具备 Controller、Service、DTO、FluentValidation 和 OpenAPI 描述。下一章会把这些接口背后的数据从示例逻辑推进到 EF Core 持久化。
        </p>
      </TeacherTask>
    </LessonShell>
  );
};
