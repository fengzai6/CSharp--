import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const EngineeringTestingLesson = () => {
  return (
    <LessonShell>
      <h3>本章你要掌握什么</h3>
      <p>
        工程化不是最后补装饰，而是让项目可维护、可排错、可部署。本节聚焦测试分层：你应该能为纯业务逻辑写单元测试，再用
        WebApplicationFactory + Testcontainers 做关键接口的集成测试，并理解单元、集成、E2E
        各自适合验证什么。
      </p>

      <TeacherTask title="老师提示">
        <p>
          把测试作为工程化的最低线。建议的学习顺序是：先给纯业务逻辑写单元测试，再用
          WebApplicationFactory + Testcontainers 做关键接口集成测试。不要为了“高级”一开始就把所有东西堆满。
        </p>
      </TeacherTask>

      <h4>常见误区</h4>
      <ul>
        <li>用 EF Core InMemory 代替所有数据库集成测试。</li>
        <li>把单元测试和集成测试混在一起，导致测试又慢又脆。</li>
      </ul>

      <h3>测试框架对照</h3>
      <p>
        从 NestJS + Jest 迁移到 .NET，对应关系如下。重点记住三件套：
        <strong>xUnit</strong>（框架）、<strong>Moq</strong>（Mock）、
        <strong>FluentAssertions</strong>（断言）。
      </p>
      <LessonTable
        headers={["功能", "NestJS + Jest", ".NET"]}
        rows={[
          ["测试框架", "Jest", "xUnit"],
          ["Mock", "Jest 内置", "Moq / NSubstitute"],
          ["断言", "expect()", "FluentAssertions"],
          ["HTTP 测试", "supertest", "WebApplicationFactory"],
          ["数据库测试", "Prisma test / InMemory", "Testcontainers（真实容器）"],
          ["覆盖率", "Jest 内置", "Coverlet"],
          ["API 测试", "Jest + supertest", "Playwright（前端 E2E）"],
        ]}
      />

      <h3>项目结构</h3>
      <p>测试项目通常和业务项目分层放在 tests 目录下，按测试类型拆分：</p>
      <LessonCode
        code={`src/
├── MyApp.Api/                    # Web API 项目
├── MyApp.Core/                   # 领域层（纯 C# 类库）
├── MyApp.Infrastructure/         # 基础设施层（EF Core、Redis 等）
├── tests/
│   ├── MyApp.UnitTests/          # 单元测试
│   ├── MyApp.IntegrationTests/   # 集成测试
│   └── MyApp.E2ETests/           # 端到端测试`}
        language="text"
        title="分层项目结构"
      />

      <h3>单元测试</h3>
      <p>创建测试项目并安装依赖：</p>
      <LessonCode
        code={`# 创建测试项目
dotnet new xunit -n MyApp.UnitTests
dotnet add package Moq
dotnet add package FluentAssertions

# 运行测试
dotnet test`}
        language="bash"
        title="创建单元测试项目"
      />

      <p>
        单元测试用 Moq 隔离依赖，用 FluentAssertions 写断言。注意 xUnit 的
        <code>[Fact]</code> 对应 Jest 的单个测试，<code>[Theory]</code> +{" "}
        <code>[InlineData]</code> 用于参数化测试。
      </p>
      <LessonCode
        code={`using Moq;
using FluentAssertions;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IRoleService> _roleServiceMock;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _roleServiceMock = new Mock<IRoleService>();
        _userService = new UserService(
            _userRepositoryMock.Object,
            _roleServiceMock.Object);
    }

    [Fact]  // 类似 @Test
    public async Task CreateAsync_ShouldHashPassword()
    {
        // Arrange
        var dto = new CreateUserDto
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123"
        };

        _userRepositoryMock.Setup(r => r.UsernameExistsAsync("testuser"))
            .ReturnsAsync(false);
        _userRepositoryMock.Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        // Act
        var result = await _userService.CreateAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Username.Should().Be("testuser");
        result.PasswordHash.Should().NotBe("password123"); // 应被哈希

        _userRepositoryMock.Verify(
            r => r.CreateAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ShouldThrowWhenUsernameExists()
    {
        var dto = new CreateUserDto
        {
            Username = "existing",
            Email = "test@example.com",
            Password = "password123"
        };

        _userRepositoryMock.Setup(r => r.UsernameExistsAsync("existing"))
            .ReturnsAsync(true);

        Func<Task> act = async () => await _userService.CreateAsync(dto);

        await act.Should().ThrowAsync<DuplicateUsernameException>();
    }

    [Theory]  // 参数化测试
    [InlineData("user", "user@example.com", true)]
    [InlineData("", "user@example.com", false)]
    [InlineData("user", "", false)]
    public async Task CreateAsync_Validation(string username, string email, bool shouldPass)
    {
        var dto = new CreateUserDto { Username = username, Email = email, Password = "password123" };
        Func<Task> act = async () => await _userService.CreateAsync(dto);

        if (shouldPass)
            await act.Should().NotThrowAsync();
        else
            await act.Should().ThrowAsync<ValidationException>();
    }
}`}
        language="csharp"
        title="UserService 单元测试"
      />

      <h3>集成测试</h3>
      <p>
        集成测试用 <code>WebApplicationFactory&lt;Program&gt;</code>{" "}
        启动真实的应用管道（路由、中间件、DI），通过 <code>HttpClient</code>{" "}
        发起请求，相当于 supertest 的角色。
      </p>
      <LessonCode
        code={`using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

public class UsersControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public UsersControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateUser_ReturnsCreated()
    {
        var content = new StringContent(
            JsonSerializer.Serialize(new { username = "newuser", email = "new@test.com", password = "test1234" }),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PostAsync("/api/users", content);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<UserResponse>();
        result.Should().NotBeNull();
        result!.Username.Should().Be("newuser");
    }

    [Fact]
    public async Task GetUser_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/users/nonexistent-id");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}`}
        language="csharp"
        title="UsersController 集成测试"
      />

      <h3>测试运行命令</h3>
      <LessonCode
        code={`dotnet test                          # 运行所有测试
dotnet test --filter "Category=Unit" # 按分类运行
dotnet test --filter "FullyQualifiedName~UserServiceTests" # 按类名
dotnet test --collect:"XPlat Code Coverage" # 生成覆盖率
dotnet test --logger "console;verbosity=detailed" # 详细输出`}
        language="bash"
        title="dotnet test 常用命令"
      />

      <h3>Testcontainers — 集成测试最佳实践</h3>
      <LessonQuote>
        替代 InMemory DbContext，用真实 PostgreSQL 容器进行测试，避免 ORM
        模拟带来的测试偏差。
      </LessonQuote>
      <LessonCode
        code={`# 安装
dotnet add package Testcontainers.PostgreSQL`}
        language="bash"
        title="安装 Testcontainers"
      />
      <p>
        Testcontainers 在测试启动时拉起真实容器、结束时自动销毁。通过实现{" "}
        <code>IAsyncLifetime</code> 管理容器生命周期，并把真实连接字符串注入到{" "}
        <code>WebApplicationFactory</code>。
      </p>
      <LessonCode
        code={`using Testcontainers.PostgreSql;

public class TestPostgreSqlContainer : PostgreSqlContainer
{
    public TestPostgreSqlContainer() : base()
    {
        // Testcontainers 自动管理容器生命周期
    }
}

public class UsersControllerIntegrationTests : IAsyncLifetime
{
    private readonly TestPostgreSqlContainer _postgres;
    private readonly HttpClient _client;

    public UsersControllerIntegrationTests()
    {
        _postgres = new TestPostgreSqlContainer()
            .WithDatabase("testdb")
            .WithDatabasePassword("postgres");
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        // 用真实数据库连接字符串创建 WebApplicationFactory
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("Database:ConnectionString",
                    _postgres.GetConnectionString());
            });
        _client = factory.CreateClient();
    }

    public Task DisposeAsync() => _postgres.StopAsync();

    [Fact]
    public async Task CreateUser_ReturnsCreated()
    {
        // 使用真实 PostgreSQL，测试结果可靠
        var content = new StringContent(
            JsonSerializer.Serialize(new { username = "newuser", email = "new@test.com", password = "test1234" }),
            Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/users", content);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}`}
        language="csharp"
        title="基于 Testcontainers 的集成测试"
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>单元测试、集成测试、E2E 测试分别适合验证什么？</li>
        <li>为什么数据库集成测试更推荐 Testcontainers 而不是 EF Core InMemory？</li>
      </ul>

      <TeacherTask title="Phase 6 练习">
        <p>
          在复刻项目中完成 Phase 6：建立工程化体系 — 测试（单元+集成）、结构化日志、健康检查、Swagger、Redis
          缓存、Docker 发布。
        </p>
      </TeacherTask>

      <LessonStep
        title="实战：单元测试与集成测试"
        defaultCollapsed={true}
        steps={[
          {
            title: "为 UserService 编写单元测试",
            content: (
              <p>
                使用 xUnit + Moq + FluentAssertions 为 UserService 的业务逻辑编写单元测试。
              </p>
            ),
            code: `// 安装依赖
dotnet add package xunit
dotnet add package xunit.runner.visualstudio
dotnet add package Moq
dotnet add package FluentAssertions

// UserServiceTests.cs
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepo;
    private readonly Mock<IPasswordService> _mockPassword;
    private readonly UserService _sut; // System Under Test

    public UserServiceTests()
    {
        _mockRepo = new Mock<IUserRepository>();
        _mockPassword = new Mock<IPasswordService>();
        _sut = new UserService(_mockRepo.Object, _mockPassword.Object);
    }

    [Fact]
    public async Task CreateUserAsync_ValidInput_ReturnsUser()
    {
        // Arrange
        var dto = new CreateUserDto { Email = "test@example.com", Password = "Pass123!" };
        _mockPassword.Setup(x => x.HashPassword(dto.Password))
            .Returns("hashed_password");
        _mockRepo.Setup(x => x.AddAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        // Act
        var result = await _sut.CreateUserAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be(dto.Email);
        result.PasswordHash.Should().Be("hashed_password");
        _mockRepo.Verify(x => x.AddAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task CreateUserAsync_DuplicateEmail_ThrowsException()
    {
        // Arrange
        var dto = new CreateUserDto { Email = "existing@example.com", Password = "Pass123!" };
        _mockRepo.Setup(x => x.GetByEmailAsync(dto.Email))
            .ReturnsAsync(new User { Email = dto.Email });

        // Act & Assert
        await _sut.Invoking(s => s.CreateUserAsync(dto))
            .Should().ThrowAsync<DuplicateEmailException>()
            .WithMessage("*already exists*");
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "单元测试示例",
            checkpoints: [
              "使用 Mock 隔离依赖（Repository、PasswordService）",
              "遵循 AAA 模式：Arrange（准备）、Act（执行）、Assert（断言）",
              "用 FluentAssertions 让断言更易读（Should().Be()）",
              "用 Verify 验证 Mock 方法是否被调用",
            ],
            reference:
              "单元测试只测业务逻辑，不访问数据库或外部服务。Mock 让测试快速、隔离、可重复。",
          },
          {
            title: "用 Theory + InlineData 写参数化测试",
            content: (
              <p>
                使用 <code>[Theory]</code> 和 <code>[InlineData]</code> 编写参数化测试，避免重复代码。
              </p>
            ),
            code: `public class PasswordValidatorTests
{
    private readonly PasswordValidator _validator = new();

    [Theory]
    [InlineData("Pass123!", true)]
    [InlineData("ValidP@ss1", true)]
    [InlineData("short", false)]           // 太短
    [InlineData("nouppercase1!", false)]   // 无大写
    [InlineData("NOLOWERCASE1!", false)]   // 无小写
    [InlineData("NoDigits!", false)]       // 无数字
    [InlineData("NoSpecial123", false)]    // 无特殊字符
    public void Validate_PasswordStrength(string password, bool expected)
    {
        // Act
        var result = _validator.IsValid(password);

        // Assert
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData("test@example.com", true)]
    [InlineData("invalid-email", false)]
    [InlineData("@example.com", false)]
    [InlineData("test@", false)]
    public void Validate_EmailFormat(string email, bool expected)
    {
        // Act
        var result = EmailValidator.IsValid(email);

        // Assert
        result.Should().Be(expected);
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "参数化测试",
            checkpoints: [
              "[Theory] 标记参数化测试方法",
              "[InlineData] 提供每组测试数据",
              "一个测试方法覆盖多个边界场景",
              "测试报告会显示每组数据的执行结果",
            ],
            reference:
              "Theory 适合测试相同逻辑的不同输入。比写 10 个 [Fact] 方法更简洁，且易于添加新场景。",
          },
          {
            title: "编写 UsersController 集成测试",
            content: (
              <p>
                使用 <code>WebApplicationFactory</code> + <code>Testcontainers</code> 编写真实的集成测试，验证完整的请求-响应流程。
              </p>
            ),
            code: `// 安装依赖
dotnet add package Microsoft.AspNetCore.Mvc.Testing
dotnet add package Testcontainers

// IntegrationTestBase.cs
public class IntegrationTestBase : IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    protected HttpClient Client { get; private set; } = null!;
    protected ApplicationDbContext DbContext { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();

        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // 替换数据库连接为测试容器
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    services.AddDbContext<ApplicationDbContext>(options =>
                        options.UseNpgsql(_dbContainer.GetConnectionString()));
                });
            });

        Client = factory.CreateClient();
        DbContext = factory.Services.GetRequiredService<ApplicationDbContext>();
        await DbContext.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
    }
}

// UsersControllerTests.cs
public class UsersControllerTests : IntegrationTestBase
{
    [Fact]
    public async Task CreateUser_ValidInput_Returns201()
    {
        // Arrange
        var dto = new CreateUserDto
        {
            Email = "newuser@example.com",
            Password = "Pass123!",
            Username = "newuser"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/users", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        user.Should().NotBeNull();
        user!.Email.Should().Be(dto.Email);

        // 验证数据库
        var dbUser = await DbContext.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        dbUser.Should().NotBeNull();
    }

    [Fact]
    public async Task GetUsers_WithPagination_ReturnsPagedResult()
    {
        // Arrange
        await SeedUsersAsync(25);

        // Act
        var response = await Client.GetAsync("/api/users?page=2&pageSize=10");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<UserDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().HaveCount(10);
        result.TotalCount.Should().Be(25);
        result.Page.Should().Be(2);
    }

    private async Task SeedUsersAsync(int count)
    {
        for (int i = 0; i < count; i++)
        {
            DbContext.Users.Add(new User
            {
                Email = $"user{i}@example.com",
                Username = $"user{i}",
                PasswordHash = "hashed"
            });
        }
        await DbContext.SaveChangesAsync();
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "集成测试",
            checkpoints: [
              "WebApplicationFactory 启动真实的 ASP.NET Core 应用",
              "Testcontainers 提供真实的 PostgreSQL 容器",
              "测试完整的 HTTP 请求-响应流程",
              "验证数据库状态确保数据真正写入",
              "每个测试后容器自动清理",
            ],
            reference:
              "集成测试比单元测试慢，但能发现路由、序列化、数据库映射等问题。Testcontainers 比 InMemory 数据库更接近生产环境（支持 SQL 方言、约束等）。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经掌握了 .NET 的单元测试和集成测试。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                单元测试用 Mock 隔离依赖，快速验证业务逻辑
              </li>
              <li>
                集成测试用 WebApplicationFactory + Testcontainers 验证完整流程
              </li>
              <li>
                [Theory] + [InlineData] 实现参数化测试，避免重复代码
              </li>
              <li>
                AAA 模式（Arrange-Act-Assert）让测试结构清晰
              </li>
              <li>
                FluentAssertions 让断言更易读，Verify 验证 Mock 调用
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能编写单元测试、参数化测试、集成测试，理解测试分层。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
