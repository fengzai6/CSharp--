import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const EngineeringTestingLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: {
  completedChecklistIds: string[];
  onToggleChecklistItem: (checklistItemId: string) => void;
}) => {
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
├── TaskHub.Api/                    # Web API 项目
├── TaskHub.Core/                   # 领域层（纯 C# 类库）
├── TaskHub.Infrastructure/         # 基础设施层（EF Core、Redis 等）
├── tests/
│   ├── TaskHub.UnitTests/          # 单元测试
│   ├── TaskHub.IntegrationTests/   # 集成测试
│   └── TaskHub.E2ETests/           # 端到端测试`}
        language="text"
        title="分层项目结构"
      />

      <h3>单元测试</h3>
      <p>创建测试项目并安装依赖：</p>
      <LessonCode
        code={`# 创建测试项目
dotnet new xunit -n TaskHub.UnitTests
dotnet add TaskHub.UnitTests/TaskHub.UnitTests.csproj package Moq
dotnet add TaskHub.UnitTests/TaskHub.UnitTests.csproj package FluentAssertions

# 引用被测试的业务项目
dotnet add TaskHub.UnitTests/TaskHub.UnitTests.csproj reference TaskHub.Core/TaskHub.Core.csproj

# 把测试项目加入解决方案
dotnet sln add TaskHub.UnitTests/TaskHub.UnitTests.csproj

# 运行测试
dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj`}
        language="bash"
        title="创建单元测试项目"
      />

      <p>
        这组命令先创建 xUnit 测试项目，再安装 Mock 和断言库，最后用{" "}
        <code>dotnet test</code> 验证测试项目能跑起来。真实项目中还要把测试项目加入
        <code>.sln/.slnx</code>，并引用被测试的业务项目，例如 <code>TaskHub.Core</code>。
      </p>

      <p>
        单元测试用 Moq 隔离依赖，用 FluentAssertions 写断言。注意 xUnit 的
        <code>[Fact]</code> 对应 Jest 的单个测试，<code>[Theory]</code> +{" "}
        <code>[InlineData]</code> 用于参数化测试。
      </p>
      <LessonCode
        code={`using FluentAssertions;
using TaskHub.Core.Models;

[Trait("Category", "Unit")]
public class WorkItemTests
{
    [Fact]  // 类似 @Test
    public void MoveTo_ShouldChangeStatus()
    {
        // Arrange
        var item = new WorkItem("item-1", "project-1", "接入登录");
        item.Status.Should().Be(WorkItemStatus.Todo);

        // Act
        item.MoveTo(WorkItemStatus.InProgress);

        // Assert
        item.Status.Should().Be(WorkItemStatus.InProgress);
    }

    [Fact]
    public void MoveTo_ShouldAllowProgression()
    {
        var item = new WorkItem("item-1", "project-1", "接入登录");

        item.MoveTo(WorkItemStatus.InProgress);
        item.MoveTo(WorkItemStatus.Done);

        item.Status.Should().Be(WorkItemStatus.Done);
    }

    [Theory]  // 参数化测试
    [InlineData(WorkItemStatus.Todo, WorkItemStatus.InProgress)]
    [InlineData(WorkItemStatus.InProgress, WorkItemStatus.Done)]
    [InlineData(WorkItemStatus.Done, WorkItemStatus.Archived)]
    public void MoveTo_ShouldAcceptValidTransitions(WorkItemStatus current, WorkItemStatus next)
    {
        var item = new WorkItem("item-1", "project-1", "测试任务");
        item.MoveTo(current);

        item.MoveTo(next);

        item.Status.Should().Be(next);
    }
}`}
        language="csharp"
        title="WorkItem 单元测试"
      />

      <h3>集成测试</h3>
      <p>
        集成测试用 <code>WebApplicationFactory&lt;Program&gt;</code>{" "}
        启动真实的应用管道（路由、中间件、DI），通过 <code>HttpClient</code>{" "}
        发起请求，相当于 supertest 的角色。
      </p>

      <LessonCode
        code={`# 创建集成测试项目
dotnet new xunit -n TaskHub.IntegrationTests
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj package Microsoft.AspNetCore.Mvc.Testing
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj package FluentAssertions
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj package Testcontainers.PostgreSQL

# 引用被测试的启动项目（WebApplicationFactory<Program> 需要）
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj reference TaskHub.Api/TaskHub.Api.csproj

# 把测试项目加入解决方案
dotnet sln add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj`}
        language="bash"
        title="创建集成测试项目并安装依赖"
      />

      <p>
        为了让 <code>WebApplicationFactory&lt;Program&gt;</code> 在测试项目中可见，需要在 <code>TaskHub.Api/Program.cs</code> 末尾补一句，把顶层语句隐式生成的 <code>Program</code> 类暴露出来：
      </p>

      <LessonCode
        code={`// TaskHub.Api/Program.cs 末尾添加：
public partial class Program { }`}
        language="csharp"
        title="暴露 Program 类给测试项目"
      />

      <LessonCode
        code={`using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using TaskHub.Core.Models;

public class WorkItemsControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public WorkItemsControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateWorkItem_ReturnsCreated()
    {
        var content = new StringContent(
            JsonSerializer.Serialize(new { projectId = "project-1", title = "接入登录" }),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PostAsync("/api/work-items", content);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<WorkItem>();
        result.Should().NotBeNull();
        result!.Title.Should().Be("接入登录");
    }

    [Fact]
    public async Task GetWorkItem_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/work-items/nonexistent-id");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}`}
        language="csharp"
        title="WorkItemsController 集成测试"
      />

      <h3>测试运行命令</h3>
      <LessonCode
        code={`dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj                          # 运行单元测试
	dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj --filter "Category=Unit" # 按分类运行
	dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj --filter "FullyQualifiedName~WorkItemTests" # 按类名
	dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj --collect:"XPlat Code Coverage" # 生成覆盖率
	dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj --logger "console;verbosity=detailed" # 详细输出`}
        language="bash"
        title="dotnet test 常用命令"
      />

      <p>
        <code>dotnet test</code> 默认会先编译再运行所有测试。过滤参数用于缩小排查范围；覆盖率和详细日志适合在定位失败时使用，不建议每次本地快速反馈都全开。
      </p>

      <h3>Testcontainers — 集成测试最佳实践</h3>
      <LessonQuote>
        替代 InMemory DbContext，用真实 PostgreSQL 容器进行测试，避免 ORM
        模拟带来的测试偏差。
      </LessonQuote>
      <LessonCode
        code={`# 安装
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj package Testcontainers.PostgreSQL`}
        language="bash"
        title="安装 Testcontainers"
      />

      <p>
        这个包只负责在测试过程中启动 PostgreSQL 容器。它不是生产数据库驱动，也不是替代 EF Core provider；测试项目仍然要通过应用的真实数据访问代码连接到这个临时数据库。
      </p>
      <p>
        Testcontainers 在测试启动时拉起真实容器、结束时自动销毁。通过实现{" "}
        <code>IAsyncLifetime</code> 管理容器生命周期，并把真实连接字符串注入到{" "}
        <code>WebApplicationFactory</code>。
      </p>
      <LessonCode
        code={`using Testcontainers.PostgreSql;

public class WorkItemsControllerIntegrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres;
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public WorkItemsControllerIntegrationTests()
    {
        _postgres = new PostgreSqlBuilder()
            .WithDatabase("testdb")
            .WithUsername("postgres")
            .WithPassword("postgres")
            .Build();
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        // 用真实数据库连接字符串创建 WebApplicationFactory
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:Default",
                    _postgres.GetConnectionString());
            });
        _client = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        _factory.Dispose();
        await _postgres.StopAsync();
    }

    [Fact]
    public async Task CreateWorkItem_ReturnsCreated()
    {
        // 使用真实 PostgreSQL，测试结果可靠
        var content = new StringContent(
            JsonSerializer.Serialize(new { projectId = "project-1", title = "接入登录" }),
            Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/work-items", content);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}`}
        language="csharp"
        title="基于 Testcontainers 的集成测试"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能区分单元测试和集成测试的边界，并知道何时使用 Testcontainers 验证真实数据库流程。
          </p>
        }
        id="engineering-testing-main"
        title="完成测试分层主线"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>单元测试、集成测试、E2E 测试分别适合验证什么？</li>
        <li>为什么数据库集成测试更推荐 Testcontainers 而不是 EF Core InMemory？</li>
      </ul>

      <TeacherTask title="Phase 6 主线任务">
        <p>
          在 TaskHub 中完成 Phase 6：建立工程化体系 — 单元测试（聚焦业务规则）和集成测试（使用 WebApplicationFactory + Testcontainers）。
        </p>
      </TeacherTask>

      <LessonStep
        title="实战：单元测试与集成测试"
        defaultCollapsed={true}
        steps={[
          {
            title: "任务目标",
            content: (
              <p>
                给 TaskHub 补上一组会长期保留的测试资产：至少 1 个任务状态流转单测、1 个状态策略参数化测试、1 个接真实数据库的集成测试。
              </p>
            ),
            checkpoints: [
              "单测只覆盖业务规则，不直接访问数据库",
              "参数化测试覆盖密码、邮箱或分页等边界输入",
              "集成测试命中真实数据库环境，而不是 EF Core InMemory",
              "测试命名和断言能直接说明验证行为",
            ],
            reference:
              "保留的是测试交付物，不是再把正文里的示例代码重抄一遍。",
          },
          {
            title: "交付要求",
            content: (
              <p>
                完成后，应该能用 <code>dotnet test</code> 稳定跑过，并清楚说明哪些测试属于单元层、哪些属于集成层，以及为什么这样分层。
              </p>
            ),
            checkpoints: [
              "至少有一个失败场景断言而不只有 happy path",
              "集成测试能验证数据库真实读写结果",
              "测试结构能直接服务后续回归，而不是一次性演示代码",
            ],
          },
        ]}
      />
    </LessonShell>
  );
};
