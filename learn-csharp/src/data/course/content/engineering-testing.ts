import type { ILessonBlock } from "@/components/lesson-ui";

export const engineeringTestingBlocks = [
  {
    "text": "预估时间：持续 | 目标：建立完整的 .NET 工程化体系",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "本章你要掌握什么",
    "type": "heading"
  },
  {
    "text": "学完本章后，你应该能为核心业务写测试，配置结构化日志、缓存、健康检查、限流和 Docker 发布，并理解 AOT 的适用场景与限制。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "老师提示",
    "type": "heading"
  },
  {
    "text": "工程化不是最后补装饰，而是让项目可维护、可排错、可部署。你可以先把测试、日志、健康检查作为最低线，再逐步加入缓存、限流、Docker、AOT。不要为了“高级”而一开始把所有东西堆满。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "学习顺序建议",
    "type": "heading"
  },
  {
    "items": [
      "先给纯业务逻辑写单元测试。",
      "再用 WebApplicationFactory + Testcontainers 做关键接口集成测试。",
      "配置结构化日志和健康检查。",
      "接入缓存和限流。",
      "最后做 Docker 发布，并评估是否需要 AOT。"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "常见误区",
    "type": "heading"
  },
  {
    "items": [
      "用 EF Core InMemory 代替所有数据库集成测试。",
      "日志用字符串拼接，丢失结构化字段。",
      "健康检查只做一个 `/health`，不区分 live 和 ready。",
      "Docker 镜像版本和 TargetFramework 不一致。",
      "把 AOT 当成所有 ASP.NET Core 项目的默认发布方式。"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "测试",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "测试框架对照",
    "type": "heading"
  },
  {
    "headers": [
      "功能",
      "NestJS + Jest",
      ".NET"
    ],
    "rows": [
      [
        "测试框架",
        "Jest",
        "**xUnit**"
      ],
      [
        "Mock",
        "Jest 内置",
        "**Moq** / NSubstitute"
      ],
      [
        "断言",
        "`expect()`",
        "**FluentAssertions**"
      ],
      [
        "HTTP 测试",
        "`supertest`",
        "**WebApplicationFactory**"
      ],
      [
        "数据库测试",
        "Prisma test/InMemory",
        "**Testcontainers**（真实容器）"
      ],
      [
        "覆盖率",
        "Jest 内置",
        "**Coverlet**"
      ],
      [
        "API 测试",
        "Jest + supertest",
        "**Playwright**（前端 E2E）"
      ]
    ],
    "type": "table"
  },
  {
    "level": 3,
    "text": "项目结构",
    "type": "heading"
  },
  {
    "code": "src/\n├── MyApp.Api/                    # Web API 项目\n├── MyApp.Core/                   # 领域层（纯 C# 类库）\n├── MyApp.Infrastructure/         # 基础设施层（EF Core、Redis 等）\n├── tests/\n│   ├── MyApp.UnitTests/          # 单元测试\n│   ├── MyApp.IntegrationTests/   # 集成测试\n│   └── MyApp.E2ETests/           # 端到端测试",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "单元测试",
    "type": "heading"
  },
  {
    "code": "# 创建测试项目\ndotnet new xunit -n MyApp.UnitTests\ndotnet add package Moq\ndotnet add package FluentAssertions\n\n# 运行测试\ndotnet test",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "code": "using Moq;\nusing FluentAssertions;\n\npublic class UserServiceTests\n{\n    private readonly Mock<IUserRepository> _userRepositoryMock;\n    private readonly Mock<IRoleService> _roleServiceMock;\n    private readonly UserService _userService;\n\n    public UserServiceTests()\n    {\n        _userRepositoryMock = new Mock<IUserRepository>();\n        _roleServiceMock = new Mock<IRoleService>();\n        _userService = new UserService(\n            _userRepositoryMock.Object,\n            _roleServiceMock.Object);\n    }\n\n    [Fact]  // 类似 @Test\n    public async Task CreateAsync_ShouldHashPassword()\n    {\n        // Arrange\n        var dto = new CreateUserDto\n        {\n            Username = \"testuser\",\n            Email = \"test@example.com\",\n            Password = \"password123\"\n        };\n\n        _userRepositoryMock.Setup(r => r.UsernameExistsAsync(\"testuser\"))\n            .ReturnsAsync(false);\n        _userRepositoryMock.Setup(r => r.CreateAsync(It.IsAny<User>()))\n            .ReturnsAsync((User u) => u);\n\n        // Act\n        var result = await _userService.CreateAsync(dto);\n\n        // Assert\n        result.Should().NotBeNull();\n        result.Username.Should().Be(\"testuser\");\n        result.PasswordHash.Should().NotBe(\"password123\"); // 应被哈希\n\n        _userRepositoryMock.Verify(\n            r => r.CreateAsync(It.IsAny<User>()), Times.Once);\n    }\n\n    [Fact]\n    public async Task CreateAsync_ShouldThrowWhenUsernameExists()\n    {\n        // Arrange\n        var dto = new CreateUserDto\n        {\n            Username = \"existing\",\n            Email = \"test@example.com\",\n            Password = \"password123\"\n        };\n\n        _userRepositoryMock.Setup(r => r.UsernameExistsAsync(\"existing\"))\n            .ReturnsAsync(true);\n\n        // Act\n        Func<Task> act = async () => await _userService.CreateAsync(dto);\n\n        // Assert\n        await act.Should().ThrowAsync<DuplicateUsernameException>();\n    }\n\n    [Theory]  // 参数化测试\n    [InlineData(\"user\", \"user@example.com\", true)]\n    [InlineData(\"\", \"user@example.com\", false)]\n    [InlineData(\"user\", \"\", false)]\n    public async Task CreateAsync_Validation(string username, string email, bool shouldPass)\n    {\n        var dto = new CreateUserDto { Username = username, Email = email, Password = \"password123\" };\n        Func<Task> act = async () => await _userService.CreateAsync(dto);\n\n        if (shouldPass)\n        {\n            await act.Should().NotThrowAsync();\n        }\n        else\n        {\n            await act.Should().ThrowAsync<ValidationException>();\n        }\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "集成测试",
    "type": "heading"
  },
  {
    "code": "using Microsoft.AspNetCore.Mvc.Testing;\nusing Microsoft.Extensions.DependencyInjection;\n\npublic class UsersControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>\n{\n    private readonly HttpClient _client;\n    private readonly WebApplicationFactory<Program> _factory;\n\n    public UsersControllerIntegrationTests(WebApplicationFactory<Program> factory)\n    {\n        _factory = factory;\n        _client = factory.CreateClient();\n    }\n\n    [Fact]\n    public async Task CreateUser_ReturnsCreated()\n    {\n        // Arrange\n        var content = new StringContent(\n            JsonSerializer.Serialize(new { username = \"newuser\", email = \"new@test.com\", password = \"test1234\" }),\n            Encoding.UTF8,\n            \"application/json\");\n\n        // Act\n        var response = await _client.PostAsync(\"/api/users\", content);\n\n        // Assert\n        response.StatusCode.Should().Be(HttpStatusCode.Created);\n        var result = await response.Content.ReadFromJsonAsync<UserResponse>();\n        result.Should().NotBeNull();\n        result!.Username.Should().Be(\"newuser\");\n    }\n\n    [Fact]\n    public async Task GetUser_ReturnsNotFound()\n    {\n        var response = await _client.GetAsync(\"/api/users/nonexistent-id\");\n        response.StatusCode.Should().Be(HttpStatusCode.NotFound);\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "测试运行命令",
    "type": "heading"
  },
  {
    "code": "dotnet test                          # 运行所有测试\ndotnet test --filter \"Category=Unit\" # 按分类运行\ndotnet test --filter \"FullyQualifiedName~UserServiceTests\" # 按类名\ndotnet test --collect:\"XPlat Code Coverage\" # 生成覆盖率\ndotnet test --logger \"console;verbosity=detailed\" # 详细输出",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "Testcontainers — 集成测试最佳实践",
    "type": "heading"
  },
  {
    "text": "替代 InMemory DbContext，用真实 PostgreSQL 容器进行测试，避免 ORM 模拟带来的测试偏差。",
    "type": "quote"
  },
  {
    "code": "# 安装\ndotnet add package Testcontainers.PostgreSQL",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "code": "using Testcontainers.PostgreSql;\n\npublic class TestPostgreSqlContainer : PostgreSqlContainer\n{\n    public TestPostgreSqlContainer() : base()\n    {\n        // Testcontainers 自动管理容器生命周期\n    }\n}\n\npublic class UsersControllerIntegrationTests : IAsyncLifetime\n{\n    private readonly TestPostgreSqlContainer _postgres;\n    private readonly HttpClient _client;\n\n    public UsersControllerIntegrationTests()\n    {\n        _postgres = new TestPostgreSqlContainer()\n            .WithDatabase(\"testdb\")\n            .WithDatabasePassword(\"postgres\");\n    }\n\n    public async Task InitializeAsync()\n    {\n        await _postgres.StartAsync();\n\n        // 用真实数据库连接字符串创建 WebApplicationFactory\n        var factory = new WebApplicationFactory<Program>()\n            .WithWebHostBuilder(builder =>\n            {\n                builder.UseSetting(\"Database:ConnectionString\",\n                    _postgres.GetConnectionString());\n            });\n        _client = factory.CreateClient();\n    }\n\n    public Task DisposeAsync() => _postgres.StopAsync();\n\n    [Fact]\n    public async Task CreateUser_ReturnsCreated()\n    {\n        // 使用真实 PostgreSQL，测试结果可靠\n        var content = new StringContent(\n            JsonSerializer.Serialize(new { username = \"newuser\", email = \"new@test.com\", password = \"test1234\" }),\n            Encoding.UTF8, \"application/json\");\n\n        var response = await _client.PostAsync(\"/api/users\", content);\n        response.StatusCode.Should().Be(HttpStatusCode.Created);\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  }
] satisfies ILessonBlock[];
