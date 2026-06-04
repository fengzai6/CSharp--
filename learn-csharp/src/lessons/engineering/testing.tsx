import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const EngineeringTestingLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
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

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="engineering-testing-checklist"
        items={[
          "为 UserService 编写单元测试（Moq + FluentAssertions）",
          "用 [Theory] + [InlineData] 写一组参数化校验测试",
          "编写 UsersController 集成测试（WebApplicationFactory + Testcontainers）",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
