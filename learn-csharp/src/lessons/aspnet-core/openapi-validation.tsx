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

      <h3>数据验证</h3>
      <h4>方式一：Data Annotations</h4>
      <p>类似 NestJS 的 class-validator，用属性标注在 DTO 字段上：</p>

      <LessonCode
        code={`public class CreateUserDto
{
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [Phone]
    public string? Phone { get; set; }
}`}
        language="csharp"
        title="Data Annotations"
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
        code={`dotnet add package FluentValidation
dotnet add package FluentValidation.AspNetCore`}
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

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(50)
            .WithMessage("用户名长度应在 3-50 之间")
            .Must(BeUniqueUsername)
            .WithMessage("用户名已被注册");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .Must(BeUniqueEmail)
            .WithMessage("邮箱已被注册");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("密码必须包含大写字母")
            .Matches(@"[a-z]").WithMessage("密码必须包含小写字母")
            .Matches(@"\\d").WithMessage("密码必须包含数字");

        // 跨字段验证
        RuleFor(x => x)
            .Must(x => x.Password != x.Username)
            .WithMessage("密码不能与用户名相同");
    }

    private bool BeUniqueUsername(string username) =>
        !_userRepository.UsernameExists(username);

    private bool BeUniqueEmail(string email) =>
        !_userRepository.EmailExists(email);
}`}
        language="csharp"
        title="FluentValidation 验证器"
      />

      <p>注册验证器（全局自动校验）：</p>

      <LessonCode
        code={`builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();`}
        language="csharp"
        title="注册验证器"
      />
      <LessonQuote>
        <code>AddFluentValidationAutoValidation()</code> 主要服务 Controller
        模型绑定流程；Minimal API 通常用 Endpoint Filter 或在端点里显式调用验证器，不要混用两套写法。
      </LessonQuote>

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
var authGroup = app.MapGroup("/api/auth");
var userGroup = app.MapGroup("/api/users").RequireAuthorization();

// 登录 — 类似 NestJS @Post('login')
authGroup.MapPost("/login", async (LoginDto dto, IAuthService auth) =>
{
    var result = await auth.LoginAsync(dto);
    return Results.Ok(result);
});

// 获取用户 — 类似 NestJS @Get(':id')
userGroup.MapGet("/{id}", async (string id, IUserService service) =>
{
    var user = await service.GetByIdAsync(id);
    return user is null ? Results.NotFound() : Results.Ok(user);
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
app.MapGet("/users/{id}", async (string id, IUserService service) =>
    await service.GetByIdAsync(id))
    .AddEndpointFilter(async (context, next) =>
    {
        // 类似 canActivate()
        var userId = context.Arguments["id"] as string;
        if (userId == null)
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

      <h4>用 Swashbuckle 提供 Swagger UI</h4>
      <LessonCode
        code={`builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "My API",
        Version = "v1",
        Description = "基于 ASP.NET Core 的后端 API"
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
});`}
        language="csharp"
        title="SwaggerGen 配置"
      />

      <h4>Controller 中的 Swagger 装饰</h4>
      <p>
        用 XML 注释和 <code>[ProducesResponseType]</code>{" "}
        声明返回类型与状态码，让文档更完整：
      </p>

      <LessonCode
        code={`/// <summary>
/// 用户登录
/// </summary>
[HttpPost("login")]
[ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginDto dto)
{
    var response = await _authService.LoginAsync(dto);
    return Ok(response);
}`}
        language="csharp"
        title="ProducesResponseType"
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

      <h4>方式二：Feature-First 结构（推荐用于复刻项目）</h4>
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
│   └── Users/
│       ├── UserEndpoints.cs
│       ├── UserService.cs
│       └── UserValidators.cs
├── Data/
└── Shared/`}
        language="text"
        title="Feature-First 结构"
      />

      <TeacherTask title="老师提示">
        <p>
          复刻项目时用<strong>方式二（Feature-First）</strong>，更贴近你的 NestJS
          Modules 思路：每个 Feature 是一个独立单元，包含路由、逻辑、验证和映射。DTO
          推荐用 <code>record</code>。
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
    </LessonShell>
  );
};
