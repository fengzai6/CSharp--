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
      <p>
        测试项目通常和业务项目分层放在 <code>tests/</code>{" "}
        目录下，按测试类型拆分。这和前端 monorepo 里把{" "}
        <code>*.test.ts</code> 与 <code>*.e2e.ts</code>{" "}
        分开类似：单元测试只引用领域层，集成测试才引用 API 启动项目。
      </p>
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
      <LessonQuote>
        为什么单测引用 <code>TaskHub.Core</code>、集成测试引用{" "}
        <code>TaskHub.Api</code>？单元测试只验证纯业务规则，不应拉起
        Web/EF；集成测试要启动真实管道，必须引用含 <code>Program</code>{" "}
        的启动项目。
      </LessonQuote>

      <h3>单元测试</h3>
      <p>创建测试项目并安装依赖：</p>
      <LessonCode
        code={`# 创建 xUnit 测试项目（-n 指定项目名，会生成目录 + .csproj）
dotnet new xunit -n TaskHub.UnitTests

# 安装 Mock 与断言库（包装到测试项目，不影响业务项目）
dotnet add TaskHub.UnitTests/TaskHub.UnitTests.csproj package Moq
dotnet add TaskHub.UnitTests/TaskHub.UnitTests.csproj package FluentAssertions

# 引用被测试的业务项目（reference = project reference，不是 NuGet）
dotnet add TaskHub.UnitTests/TaskHub.UnitTests.csproj reference TaskHub.Core/TaskHub.Core.csproj

# 把测试项目加入解决方案（之后 dotnet test 解决方案会一并跑到）
dotnet sln add TaskHub.UnitTests/TaskHub.UnitTests.csproj

# 运行该测试项目（先编译再跑；无失败时 exit code = 0）
dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj`}
        language="bash"
        title="创建单元测试项目"
      />

      <p>
        命令对照：<code>dotnet new xunit</code> ≈{" "}
        <code>npm init</code> + 装 Jest；<code>dotnet add ... package</code> ≈{" "}
        <code>npm i -D</code>；<code>dotnet add ... reference</code>{" "}
        是项目间依赖，无 npm 直接对应（更像 monorepo 里{" "}
        <code>workspace:</code> 引用）。
      </p>

      <h4>Fact / Theory / Trait</h4>
      <LessonTable
        headers={["xUnit", "Jest / Vitest", "用途"]}
        rows={[
          ["[Fact]", "test() / it()", "无参数的单个用例"],
          [
            "[Theory] + [InlineData(...)]",
            "test.each / it.each",
            "同一逻辑多组输入，每组数据算一条用例",
          ],
          [
            '[Trait("Category", "Unit")]',
            "describe 分组 / 自定义 tag",
            "给类或方法打标签，配合 --filter 筛选",
          ],
        ]}
      />
      <p>
        命名习惯：方法名用 <code>方法_场景_期望</code>
        （如 <code>MoveTo_ShouldChangeStatus</code>
        ），读失败报告时不用点开代码也能知道验了什么。结构用
        Arrange（准备）→ Act（调用）→ Assert（断言），和 Jest 里
        given/when/then 同一思路。
      </p>
      <p>
        断言库对照：FluentAssertions 的{" "}
        <code>item.Status.Should().Be(...)</code> ≈ Jest{" "}
        <code>expect(item.status).toBe(...)</code>；
        <code>result.Should().NotBeNull()</code> ≈{" "}
        <code>expect(result).not.toBeNull()</code>
        。失败信息会打印实际值，比手写{" "}
        <code>Assert.Equal</code> 更易读。
      </p>
      <LessonCode
        code={`using FluentAssertions;
using TaskHub.Core.Models;

[Trait("Category", "Unit")]  // 打标签，供 --filter "Category=Unit" 使用
public class WorkItemTests
{
    [Fact]  // ≈ test('MoveTo 应改变状态', () => { ... })
    public void MoveTo_ShouldChangeStatus()
    {
        // Arrange — 准备数据
        var item = new WorkItem("item-1", "project-1", "接入登录");
        item.Status.Should().Be(WorkItemStatus.Todo);

        // Act — 调用被测方法
        item.MoveTo(WorkItemStatus.InProgress);

        // Assert — 验证结果（≈ expect(...).toBe(...)）
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

    // Theory ≈ test.each([[a,b],[c,d]])('...', (current, next) => { ... })
    // 每个 InlineData 会生成一条独立用例；一条失败不影响其他数据行
    [Theory]
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

      <h4>Moq — 隔离依赖</h4>
      <p>
        上面的 <code>WorkItem</code>{" "}
        是纯领域对象，没有外部依赖，所以还用不到 Mock。一旦测的是
        Service（依赖 Repository / 外部 API），就要用{" "}
        <strong>Moq</strong> 伪造依赖——对应 Jest 的{" "}
        <code>jest.fn()</code> / <code>vi.fn()</code>
        ，或 <code>jest.mock(&apos;./repo&apos;)</code>。
      </p>
      <LessonCode
        code={`using FluentAssertions;
using Moq;
using TaskHub.Core.Models;
using TaskHub.Core.Services;

// 假设 IWorkItemRepository 是接口（业务层依赖抽象，才能被 Mock）
public class WorkItemServiceTests
{
    [Fact]
    public async Task GetById_ShouldReturnItem_WhenExists()
    {
        // 1) 创建 Mock：≈ const repo = { findById: vi.fn() }
        var repo = new Mock<IWorkItemRepository>();

        // 2) 约定返回值：≈ repo.findById.mockResolvedValue(item)
        //    It.IsAny<string>() ≈ expect.any(String) / 任意参数
        var expected = new WorkItem("item-1", "project-1", "接入登录");
        repo.Setup(r => r.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(expected);

        // 3) 把 Mock.Object（实现了接口的替身）注入被测服务
        var service = new WorkItemService(repo.Object);

        // Act
        var result = await service.GetByIdAsync("item-1");

        // Assert
        result.Should().NotBeNull();
        result!.Title.Should().Be("接入登录");

        // 4) 验证调用次数：≈ expect(repo.findById).toHaveBeenCalledOnce()
        repo.Verify(r => r.FindByIdAsync("item-1"), Times.Once);
    }
}`}
        language="csharp"
        title="Moq 基本用法（对照 Jest mock）"
      />
      <LessonQuote>
        常见误判：单元测试里 new 真实 DbContext 或 HttpClient。单测目标是业务规则，依赖一律
        Mock；连真实数据库是集成测试的事。另一个坑：Mock 的是具体类而不是接口——优先对接口做
        <code>Mock&lt;IXxx&gt;</code>，和前端 mock 模块边界同一原则。
      </LessonQuote>

      <h3>集成测试</h3>
      <p>
        集成测试用 <code>WebApplicationFactory&lt;Program&gt;</code>{" "}
        在进程内启动真实应用管道（路由、中间件、DI、过滤器），再通过{" "}
        <code>HttpClient</code> 发请求。角色上 ≈ NestJS 测试里的{" "}
        <code>supertest(app.getHttpServer())</code>，或前端对真实 dev
        server 发请求——但这里不占端口，工厂在内存里 host 应用。
      </p>

      <LessonCode
        code={`# 创建集成测试项目
dotnet new xunit -n TaskHub.IntegrationTests

# Mvc.Testing 提供 WebApplicationFactory（集成测试核心包）
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj package Microsoft.AspNetCore.Mvc.Testing
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj package FluentAssertions
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj package Testcontainers.PostgreSQL

# 必须引用 API 启动项目：工厂要靠 Program 入口组装应用
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj reference TaskHub.Api/TaskHub.Api.csproj

dotnet sln add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj`}
        language="bash"
        title="创建集成测试项目并安装依赖"
      />

      <p>
        为什么要 <code>public partial class Program {"{}"}</code>？.NET
        6+ 顶层语句会生成一个隐式的内部{" "}
        <code>Program</code> 类，测试项目默认看不到它。在{" "}
        <code>Program.cs</code>{" "}
        末尾补一行 partial，等于把这个入口类型公开给{" "}
        <code>WebApplicationFactory&lt;Program&gt;</code>
        。没有这行，编译会报找不到 <code>Program</code>。
      </p>

      <LessonCode
        code={`// TaskHub.Api/Program.cs 末尾添加：
// partial = 与顶层语句生成的 Program 合并成同一个类型
public partial class Program { }`}
        language="csharp"
        title="暴露 Program 类给测试项目"
      />

      <h4>IClassFixture 与 CreateClient</h4>
      <p>
        <code>IClassFixture&lt;T&gt;</code>{" "}
        表示「这个测试类共享一份 T 实例」——工厂只启动一次，类里所有{" "}
        <code>[Fact]</code>{" "}
        复用同一应用。Jest 里没有完全等同的语法，接近{" "}
        <code>beforeAll</code> 里建一次 app、各{" "}
        <code>test</code> 共用。构造函数参数由 xUnit 注入 fixture，不用你手动{" "}
        <code>new</code>。
      </p>
      <p>
        <code>factory.CreateClient()</code>{" "}
        返回已指向内存 host 的 <code>HttpClient</code>
        ，后续 <code>PostAsync</code> / <code>GetAsync</code>{" "}
        走完整中间件管道，不是直接调 Controller 方法。
      </p>

      <LessonCode
        code={`using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using TaskHub.Core.Models;

// IClassFixture：本类所有测试共享同一个 WebApplicationFactory 实例
public class WorkItemsControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    // xUnit 把 fixture 注入构造函数（你不用 new factory）
    public WorkItemsControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient(); // 内存 HttpClient，指向测试 host
    }

    [Fact]
    public async Task CreateWorkItem_ReturnsCreated()
    {
        var content = new StringContent(
            JsonSerializer.Serialize(new { projectId = "project-1", title = "接入登录" }),
            Encoding.UTF8,
            "application/json");

        // 走完整管道：路由 → 中间件 → Controller → DI 服务
        var response = await _client.PostAsync("/api/work-items", content);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<WorkItem>();
        result.Should().NotBeNull();
        result!.Title.Should().Be("接入登录"); // ! = 已断言非 null，压制可空警告
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
        code={`# 跑整个测试项目（先 build 再执行；失败 exit code ≠ 0，CI 靠这个拦）
dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj

# --filter：只跑匹配的用例（缩小排查范围）
# Trait 写法：Category=Unit（对应 [Trait("Category","Unit")]）
dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj --filter "Category=Unit"

# 按类名模糊匹配（~ 表示 contains）
dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj --filter "FullyQualifiedName~WorkItemTests"

# 收集覆盖率（需要 Coverlet 相关收集器；输出到 TestResults/）
dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj --collect:"XPlat Code Coverage"

# 控制台详细日志（看每个用例名与失败堆栈；本地排错用，日常别全开）
dotnet test TaskHub.UnitTests/TaskHub.UnitTests.csproj --logger "console;verbosity=detailed"`}
        language="bash"
        title="dotnet test 常用命令"
      />

      <p>
        <code>dotnet test</code> ≈ <code>npm test</code> /{" "}
        <code>vitest run</code>：默认编译后跑全部。
        <code>--filter</code> ≈ Jest 的 <code>-t</code> / Vitest 的{" "}
        <code>-t</code>；
        <code>--collect</code> ≈ <code>--coverage</code>；
        <code>--logger</code> 控制输出格式，不影响测哪些用例。副作用：覆盖率与
        detailed 日志会变慢、产物更大，适合 CI 或排错，不适合每次保存都开。
      </p>

      <h3>Testcontainers — 集成测试最佳实践</h3>
      <LessonQuote>
        替代 InMemory DbContext，用真实 PostgreSQL 容器进行测试，避免 ORM
        模拟带来的测试偏差。InMemory 不支持真实约束、事务和部分
        SQL，测过不等于生产能跑。
      </LessonQuote>
      <LessonCode
        code={`# 安装（仅测试项目需要；运行测试的机器要有 Docker）
dotnet add TaskHub.IntegrationTests/TaskHub.IntegrationTests.csproj package Testcontainers.PostgreSQL`}
        language="bash"
        title="安装 Testcontainers"
      />

      <p>
        这个包只负责在测试过程中启动 PostgreSQL 容器。它不是生产数据库驱动，也不是替代
        EF Core provider；测试项目仍然要通过应用的真实数据访问代码连接到这个临时数据库。
      </p>
      <p>
        <code>IAsyncLifetime</code> 是 xUnit 的异步生命周期接口：
        <code>InitializeAsync</code> 在类内第一个测试前执行（≈{" "}
        <code>beforeAll</code>），
        <code>DisposeAsync</code> 在类结束后执行（≈{" "}
        <code>afterAll</code>
        ）。容器要异步启动/停止，所以这里用它，而不是构造函数里同步{" "}
        <code>Start</code>。
      </p>
      <p>
        <code>WithWebHostBuilder</code>{" "}
        在测试里改配置（这里覆盖连接字符串），不改生产{" "}
        <code>appsettings.json</code>
        。<code>= null!</code>{" "}
        是「稍后在 InitializeAsync 赋值」的写法，避免可空警告——不是运行时魔法。
      </p>
      <p>
        用下面这个类<strong>完整替换</strong>上一节的{" "}
        <code>WorkItemsControllerIntegrationTests</code>
        （不要两个类并存，否则会 CS0101 重复定义）。
      </p>
      <LessonCode
        code={`using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.PostgreSql;

// IAsyncLifetime：异步 beforeAll / afterAll
public class WorkItemsControllerIntegrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres;
    // null! = 稍后在 InitializeAsync 赋值（告诉编译器“不会一直是 null”）
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public WorkItemsControllerIntegrationTests()
    {
        // 只 Build 配置，还不启动容器（启动放 InitializeAsync）
        _postgres = new PostgreSqlBuilder()
            .WithDatabase("testdb")
            .WithUsername("postgres")
            .WithPassword("postgres")
            .Build();
    }

    public async Task InitializeAsync() // ≈ beforeAll
    {
        await _postgres.StartAsync(); // 拉镜像（首次慢）并启动容器

        // WithWebHostBuilder：覆盖配置，把连接串指到临时容器
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:Default",
                    _postgres.GetConnectionString());
            });
        _client = _factory.CreateClient();
    }

    public async Task DisposeAsync() // ≈ afterAll
    {
        _client.Dispose();
        _factory.Dispose();
        await _postgres.StopAsync(); // 停容器；Testcontainers 会清理
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
      <LessonQuote>
        副作用提醒：首次 <code>StartAsync</code>{" "}
        会拉 PostgreSQL 镜像，需要本机 Docker 可用；CI
        同样要给 Runner 配 Docker。容器端口是动态映射的，所以必须用{" "}
        <code>GetConnectionString()</code>
        ，不要写死 <code>localhost:5432</code>。
      </LessonQuote>

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
