import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const EfDbContextLesson = ({
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
        学完本节后，你应该能用 EF Core 搭起 <code>DbContext</code>、<code>DbSet</code>
        、实体配置和迁移的基本流程。重点不是把它当成 TypeORM Repository
        的同款替代，而是理解 <code>DbContext</code> 是<strong>工作单元</strong>，Change
        Tracker 会追踪实体变化。
      </p>

      <TeacherTask title="老师提示">
        <p>
          EF Core 最容易学歪的地方，是把它当成 TypeORM Repository
          的同款替代。你要重点理解：一次请求通常使用一个 scoped{" "}
          <code>DbContext</code>，它是工作单元；默认查询会追踪实体，只读查询需要显式加{" "}
          <code>AsNoTracking()</code>。这是后端性能和正确性的分水岭。
        </p>
      </TeacherTask>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          前面已经完成 Projects / WorkItems API 的接口形状。本节把这些业务对象落到 <code>TaskHub.Infrastructure</code>：创建 <code>TaskHubDbContext</code>、实体配置和第一批迁移。
        </p>
      </TeacherTask>

      <h3>与 TypeORM 的对照</h3>
      <LessonTable
        headers={["概念", "TypeORM", "EF Core"]}
        rows={[
          ["ORM 定义", "@Entity, @Column", "Fluent API 或 Data Annotations"],
          ["关系", "@OneToMany, @ManyToMany", ".HasMany(), .WithMany()"],
          ["仓储", "Repository<T>", "DbContext.Set<T>()（内置）"],
          ["迁移", "typeorm migrations:generate", "dotnet ef migrations add"],
          ["事务", "manager.transaction()", "Database.BeginTransaction()"],
          ["变更追踪", "运行时追踪", "Change Tracker"],
          ["软删除", "手动/插件", "全局查询过滤器"],
          ["树结构", "TreeRepository", "自引用关系"],
        ]}
      />

      <h3>安装与配置</h3>
      <p>EF Core 通过 NuGet 安装，按数据库选择对应的 provider：</p>

      <LessonCode
        code={`# 安装到 Infrastructure：数据库 provider 和 EF Core 运行时
dotnet add TaskHub.Infrastructure/TaskHub.Infrastructure.csproj package Npgsql.EntityFrameworkCore.PostgreSQL

# 安装到 Api：设计期迁移工具通常由启动项目参与执行
dotnet add TaskHub.Api/TaskHub.Api.csproj package Microsoft.EntityFrameworkCore.Design`}
        language="bash"
        title="安装 EF Core"
      />

      <p>
        这里的包分两类：数据库 provider 负责把 EF Core 查询翻译成具体数据库的 SQL，
        <code>Microsoft.EntityFrameworkCore.Design</code> 让启动项目能参与设计期迁移。真正执行 <code>dotnet ef</code>{" "}
        命令还需要安装 <code>dotnet-ef</code> 工具。实际项目只选一个数据库 provider，例如 SQL Server 或 PostgreSQL，不需要两个都装。
      </p>

      <LessonCode
        code={`# 如果本机还没有 dotnet ef 命令，先安装工具
dotnet tool install --global dotnet-ef

# 或在仓库内使用本地 tool manifest
dotnet new tool-manifest
dotnet tool install dotnet-ef`}
        language="bash"
        title="安装 dotnet-ef 工具"
      />

      <h3>DbContext — 数据库上下文</h3>
      <p>
        <code>DbContext</code> 是工作单元入口。每个 <code>DbSet&lt;T&gt;</code>{" "}
        对应一张表；<code>OnModelCreating</code> 替代 TypeORM 的{" "}
        <code>@Entity</code> 装饰器，集中做实体配置。
      </p>
      <p>
        用 TS 心智模型拆开三块：
      </p>
      <ul>
        <li>
          <strong>DbContext</strong> ≈ 一次请求内的「数据库会话 + 事务边界」。
          不是全局单例 Repository；更像 TypeORM 的{" "}
          <code>EntityManager</code> / Prisma 的一次 client 使用范围。
        </li>
        <li>
          <strong>DbSet&lt;T&gt;</strong> ≈ 这张表的入口：
          <code>_context.WorkItems</code> 用来查询/增删，不是「已经加载的数组」。
        </li>
        <li>
          <strong>Change Tracker</strong>：查出来的实体默认被记住；你改属性后，
          <code>SaveChangesAsync</code> 会生成 UPDATE。只读列表若不需要追踪，加{" "}
          <code>AsNoTracking()</code>（见后文与关系课）。
        </li>
      </ul>

      <LessonCode
        code={`using Microsoft.EntityFrameworkCore;

public class TaskHubDbContext : DbContext
{
    // options 由 DI 注入：连接串、Provider（Npgsql）等在 Program.cs 注册时配好
    public TaskHubDbContext(DbContextOptions<TaskHubDbContext> options)
        : base(options) { }

    // DbSet — 每个属性对应一张表的入口（不是内存列表）
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();
    public DbSet<WorkItemComment> WorkItemComments => Set<WorkItemComment>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // 模型配置入口 — 替代 TypeORM 散落的 @Entity / @Column
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 扫描本程序集里所有 IEntityTypeConfiguration<T> 并应用
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskHubDbContext).Assembly);

        // 全局查询过滤器：之后所有查询默认带上这些条件（软删除 / 未归档）
        modelBuilder.Entity<User>()
            .HasQueryFilter(u => u.IsActive);

        modelBuilder.Entity<Project>()
            .HasQueryFilter(project => project.ArchivedAt == null);

        modelBuilder.Entity<WorkItem>()
            .HasQueryFilter(item => item.DeletedAt == null);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // 全局约定：所有 string 默认最长 500（具体列类型仍由 Provider 映射）
        configurationBuilder.Properties<string>()
            .HaveMaxLength(500);
    }
}`}
        language="csharp"
        title="TaskHubDbContext"
      />

      <LessonTable
        headers={["成员", "干什么", "TS / ORM 对照"]}
        rows={[
          [
            "DbSet<T> / Set<T>()",
            "表入口：查询、Add、Remove",
            "repository 或 prisma.xxx，但是会话内的",
          ],
          [
            "OnModelCreating",
            "集中配置表结构、关系、过滤器",
            "TypeORM 的 entity 装饰器 / Prisma schema",
          ],
          [
            "ApplyConfigurationsFromAssembly",
            "加载分散的 IEntityTypeConfiguration 类",
            "把配置从巨石 OnModelCreating 拆出去",
          ],
          [
            "HasQueryFilter",
            "默认 WHERE，常用于软删除",
            "全局 scope；管理后台要 IgnoreQueryFilters()",
          ],
          [
            "ConfigureConventions",
            "默认列规则（长度、精度）",
            "无直接对应；减少重复 Fluent 配置",
          ],
        ]}
      />

      <LessonQuote>
        DbContext 通常注册为 Scoped：一次 HTTP 请求共用一个实例，请求结束随作用域释放。它不是线程安全的，不要在多个请求或并发任务间共享同一个实例。
      </LessonQuote>

      <h3>实体建模</h3>
      <p>
        实体就是普通的 C# class（引用类型）。常见做法是抽一个{" "}
        <code>BaseEntity</code> 基类，统一放 <code>Id</code>、
        <code>CreatedAt</code> 等公共字段；导航属性用来表达关系，替代 TypeORM 的{" "}
        <code>@ManyToMany</code> 等装饰器。
      </p>

      <LessonCode
        code={`// 基础实体基类
public abstract class BaseEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public abstract void Touch();
}

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public List<ProjectMember> ProjectMembers { get; set; } = new();
    public List<WorkItem> AssignedWorkItems { get; set; } = new();
    public List<WorkItemComment> Comments { get; set; } = new();
    public List<RefreshToken> RefreshTokens { get; set; } = new();

    public string DisplayName => Username;

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ArchivedAt { get; set; }

    public List<ProjectMember> Members { get; set; } = new();
    public List<WorkItem> WorkItems { get; set; } = new();

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

public class WorkItem : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public WorkItemStatus Status { get; set; } = WorkItemStatus.Todo;
    public string? AssigneeId { get; set; }
    public DateTime? DueDate { get; set; }

    public Project Project { get; set; } = null!;
    public User? Assignee { get; set; }
    public List<WorkItemComment> Comments { get; set; } = new();

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}`}
        language="csharp"
        title="BaseEntity 与 TaskHub 核心实体"
      />

      <TeacherTask title="对照 TypeORM 理解">
        <p>
          TypeORM 用 <code>@Column</code> 装饰器声明列。EF Core 默认走约定（property
          自动映射成列），需要定制时再在 <code>IEntityTypeConfiguration&lt;T&gt;</code>{" "}
          里用 Fluent API 配置。约定优先、配置兜底，是 EF Core 的基本心智模型。
        </p>
      </TeacherTask>

      <h3>变更追踪 — EF Core 的核心机制</h3>
      <p>
        EF Core 默认会自动追踪查出来的实体。你直接改实体的属性，
        <code>SaveChangesAsync()</code> 时它会算出 UPDATE 语句，不需要手动调用 save。
      </p>

      <LessonCode
        code={`// EF Core 自动追踪实体的变更状态
var item = _context.WorkItems.First(item => item.Id == "123");
item.Status = WorkItemStatus.InProgress;  // EF 已追踪到变化

// 查看变更状态
foreach (var entry in _context.ChangeTracker.Entries<WorkItem>())
{
    Console.WriteLine($"State: {entry.State}");       // Added/Modified/Deleted/Unchanged
    Console.WriteLine($"Property: {entry.Property(item => item.Status).IsModified}");
    Console.WriteLine($"Original: {entry.Property(item => item.Status).OriginalValue}");
    Console.WriteLine($"Current: {entry.Property(item => item.Status).CurrentValue}");
}

// 保存所有变更
await _context.SaveChangesAsync();

// 手动标记状态
_context.WorkItems.Update(item);        // Modified
_context.WorkItems.Add(newItem);        // Added
_context.WorkItems.Remove(item);        // Deleted
_context.Entry(item).State = EntityState.Detached; // 停止追踪`}
        language="csharp"
        title="Change Tracker"
      />

      <TeacherTask title="与 TypeORM 对照">
        <p>
          TypeORM 通过 <code>Repository.save()</code> 自动检测变更，EF Core
          通过 Change Tracker 自动检测。但 EF Core
          的追踪是<strong>上下文级别</strong>的：不同 <code>DbContext</code>{" "}
          实例之间不共享追踪状态。
        </p>
      </TeacherTask>

      <h3>迁移</h3>
      <p>
        迁移把实体模型的变化记录成可重放的脚本，再应用到数据库。对应 TypeORM 的{" "}
        <code>migrations:generate</code> + <code>migration:run</code>。
      </p>

      <LessonCode
        code={`# 创建迁移：对比「当前模型」和「已有迁移历史」，生成 C# 迁移类
# --project：DbContext 所在项目（模型与迁移文件落在这里）
# --startup-project：能跑起来的项目（读 appsettings、DI 注册）
dotnet ef migrations add AddTaskHubCoreTables \
    --project TaskHub.Infrastructure \
    --startup-project TaskHub.Api
dotnet ef migrations add AddWorkItemComments \
    --project TaskHub.Infrastructure \
    --startup-project TaskHub.Api

# 应用迁移：执行尚未应用的迁移 SQL，改真实数据库
dotnet ef database update --project TaskHub.Infrastructure --startup-project TaskHub.Api

# 回滚：update 到指定迁移名；0 表示清空所有迁移（危险，学习环境再用）
dotnet ef database update 0 --project TaskHub.Infrastructure --startup-project TaskHub.Api
dotnet ef database update AddTaskHubCoreTables --project TaskHub.Infrastructure --startup-project TaskHub.Api

# Database First：从已有库反向生成实体（本课主线是 Code First，了解即可）
dotnet ef dbcontext scaffold "Host=localhost;Database=taskhub;Username=postgres;Password=postgres" \
    Npgsql.EntityFrameworkCore.PostgreSQL \
    --context TaskHubDbContext \
    --output-dir Models/Entities \
    --context-dir Data`}
        language="bash"
        title="dotnet ef 迁移命令"
      />

      <LessonTable
        headers={["命令 / flag", "干什么", "副作用"]}
        rows={[
          [
            "migrations add <Name>",
            "生成迁移 C# 文件",
            "不改数据库；Name 进入类名与历史",
          ],
          [
            "--project",
            "DbContext 与迁移所在 csproj",
            "迁出文件写入该项目",
          ],
          [
            "--startup-project",
            "启动项目（配置 + DI）",
            "EF 靠它找到连接串和 DbContext 注册",
          ],
          [
            "database update",
            "把未应用迁移打到数据库",
            "改表结构；可指定目标迁移名回滚",
          ],
          [
            "database update 0",
            "回滚到空库（无迁移）",
            "删掉迁移创建的对象，学习库慎用",
          ],
          [
            "dbcontext scaffold",
            "从库生成实体代码",
            "覆盖/生成 Models；与 Code First 主线相反",
          ],
        ]}
      />

      <p>
        <code>migrations add</code> 只生成迁移文件，不会改数据库；
        <code>database update</code> 才会把迁移应用到数据库；
        <code>dbcontext scaffold</code> 是反向工程，用已有数据库生成 C# 模型。学习 Code First 时，主线只需要先掌握
        <code>migrations add</code> 和 <code>database update</code>。
      </p>

      <h3>注册 DbContext</h3>
      <p>
        在 <code>TaskHub.Api</code> 的 <code>Program.cs</code> 注册数据库上下文，连接字符串放在 <code>appsettings.json</code> 中。
      </p>
      <LessonCode
        code={`// appsettings.json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=taskhub;Username=postgres;Password=postgres"
  }
}`}
        language="json"
        title="appsettings.json"
      />
      <LessonCode
        code={`// TaskHub.Api/Program.cs
builder.Services.AddDbContext<TaskHubDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// 运行迁移（开发环境）
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TaskHubDbContext>();
    db.Database.Migrate();
}`}
        language="csharp"
        title="注册 TaskHubDbContext"
      />
      <LessonQuote>
        <code>AddDbContext</code> 默认注册为 <code>Scoped</code>，每次 HTTP 请求一个实例。生产环境推荐用 <code>dotnet ef database update</code> 应用迁移，而不是在 <code>Program.cs</code> 里调 <code>Migrate()</code>。
      </LessonQuote>

      <h3>常见误区</h3>
      <ul>
        <li>只读查询忘记 <code>AsNoTracking()</code>，白白承担追踪开销。</li>
        <li>以为 EF Core 有 TypeORM TreeRepository 同款的内置树能力。</li>
        <li>全局查询过滤器做了软删除，却忘记后台管理或恢复场景需要忽略过滤器。</li>
      </ul>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能创建 <code>TaskHubDbContext</code>、定义 <code>DbSet</code>、注册
            DbContext，并跑通一次迁移命令。
          </p>
        }
        id="ef-dbcontext-main"
        title="完成 EF Core 基础接入"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>DbContext 为什么通常注册为 Scoped？</li>
        <li>EF Core 的变更追踪是上下文级别还是全局级别？这意味着什么？</li>
        <li>软删除用全局过滤器时有哪些边界情况？</li>
      </ul>

      <h3>写入 TaskHub.Infrastructure</h3>
      <p>
        上面的代码片段最终要落盘到 <code>TaskHub.Infrastructure</code> 中。先清理模板、安装包、创建目录：
      </p>

      <LessonCode
        code={`# 1. 删除模板文件
rm TaskHub.Infrastructure/Class1.cs

# 2. 安装 NuGet 包（如果上面还没执行）
dotnet add TaskHub.Infrastructure/TaskHub.Infrastructure.csproj package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add TaskHub.Api/TaskHub.Api.csproj package Microsoft.EntityFrameworkCore.Design

# 3. 创建目录
mkdir -p TaskHub.Infrastructure/Data
mkdir -p TaskHub.Infrastructure/Models`}
        language="bash"
        title="清理模板、安装包、创建目录"
      />

      <p>
        然后逐个创建文件。<code>Models/</code> 下的实体使用 <code>TaskHub.Infrastructure.Models</code> 命名空间，
        引用 Core 的枚举时需要 <code>using TaskHub.Core.Models;</code>。
        <code>Data/TaskHubDbContext.cs</code> 使用 <code>TaskHub.Infrastructure.Data</code> 命名空间。
      </p>

      <p>
        注意：这里存在两个不同命名空间的 <code>WorkItem</code>，请并存使用，不要互相替换。
        <code>TaskHub.Core.Models.WorkItem</code> 继续供 Api 内存服务、单测和 SignalR <code>MoveAsync</code>（含 <code>MoveTo</code>）使用；
        <code>TaskHub.Infrastructure.Models.WorkItem</code> 只给 EF / <code>DbContext</code> 使用。
        当前主线不要删除 Core 版，也不要把 <code>WorkItemService</code> 直接改成 Infrastructure 实体。
      </p>

      <h4>Models/BaseEntity.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Infrastructure.Models;

public abstract class BaseEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public abstract void Touch();
}`}
        language="csharp"
        title="Models/BaseEntity.cs"
      />

      <h4>Models/User.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Infrastructure.Models;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public List<ProjectMember> ProjectMembers { get; set; } = new();
    public List<WorkItem> AssignedWorkItems { get; set; } = new();
    public List<WorkItemComment> Comments { get; set; } = new();
    public List<RefreshToken> RefreshTokens { get; set; } = new();

    public string DisplayName => Username;

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}`}
        language="csharp"
        title="Models/User.cs"
      />

      <h4>Models/Project.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Infrastructure.Models;

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ArchivedAt { get; set; }

    public List<ProjectMember> Members { get; set; } = new();
    public List<WorkItem> WorkItems { get; set; } = new();

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}`}
        language="csharp"
        title="Models/Project.cs"
      />

      <h4>Models/WorkItem.cs</h4>
      <LessonCode
        code={`using TaskHub.Core.Models;

namespace TaskHub.Infrastructure.Models;

public class WorkItem : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public WorkItemStatus Status { get; set; } = WorkItemStatus.Todo;
    public string? AssigneeId { get; set; }
    public DateTime? DueDate { get; set; }

    public Project Project { get; set; } = null!;
    public User? Assignee { get; set; }
    public List<WorkItemComment> Comments { get; set; } = new();

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}`}
        language="csharp"
        title="Models/WorkItem.cs"
      />

      <h4>Models/ProjectMember.cs</h4>
      <LessonCode
        code={`using TaskHub.Core.Models;

namespace TaskHub.Infrastructure.Models;

public class ProjectMember : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public ProjectRole Role { get; set; } = ProjectRole.Member;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}`}
        language="csharp"
        title="Models/ProjectMember.cs"
      />

      <h4>Models/WorkItemComment.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Infrastructure.Models;

public class WorkItemComment : BaseEntity
{
    public string WorkItemId { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    public WorkItem WorkItem { get; set; } = null!;
    public User Author { get; set; } = null!;

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}`}
        language="csharp"
        title="Models/WorkItemComment.cs"
      />

      <h4>Models/RefreshToken.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Infrastructure.Models;

public class RefreshToken : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt is not null;
    public bool IsActive => !IsExpired && !IsRevoked;

    public User User { get; set; } = null!;

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}`}
        language="csharp"
        title="Models/RefreshToken.cs"
      />

      <h4>Data/TaskHubDbContext.cs</h4>
      <LessonCode
        code={`using Microsoft.EntityFrameworkCore;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Infrastructure.Data;

public class TaskHubDbContext : DbContext
{
    public TaskHubDbContext(DbContextOptions<TaskHubDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();
    public DbSet<WorkItemComment> WorkItemComments => Set<WorkItemComment>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskHubDbContext).Assembly);

        modelBuilder.Entity<User>()
            .HasQueryFilter(u => u.IsActive);

        modelBuilder.Entity<Project>()
            .HasQueryFilter(project => project.ArchivedAt == null);

        modelBuilder.Entity<WorkItem>()
            .HasQueryFilter(item => item.DeletedAt == null);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<string>()
            .HaveMaxLength(500);
    }
}`}
        language="csharp"
        title="Data/TaskHubDbContext.cs"
      />

      <h4>更新 Program.cs</h4>
      <p>
        在 <code>TaskHub.Api</code> 的 <code>Program.cs</code> 中完成两处修改：
      </p>

      <LessonCode
        code={`// 1. 文件顶部添加 using：
using Microsoft.EntityFrameworkCore;
using TaskHub.Infrastructure.Data;

// 2. builder.Services 部分添加：
builder.Services.AddDbContext<TaskHubDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));`}
        language="csharp"
        title="Program.cs 注册 DbContext"
      />

      <p>
        同时在 <code>appsettings.json</code> 中添加连接字符串（确保本机已安装 PostgreSQL）：
      </p>

      <LessonCode
        code={`{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=taskhub;Username=postgres;Password=postgres"
  }
}`}
        language="json"
        title="appsettings.json"
      />

      <p>
        写完运行 <code>dotnet build TaskHub.Api</code> 确认编译通过。
        如果编译失败，先检查：每个文件的 <code>namespace</code> 是否正确、<code>WorkItem.cs</code> 和 <code>ProjectMember.cs</code> 是否写了 <code>using TaskHub.Core.Models;</code>、<code>TaskHubDbContext.cs</code> 是否写了 <code>using TaskHub.Infrastructure.Models;</code>、<code>Program.cs</code> 是否写了 <code>using Microsoft.EntityFrameworkCore;</code> 和 <code>using TaskHub.Infrastructure.Data;</code>。
      </p>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已删除 <code>Class1.cs</code>，创建 <code>Data/</code> 和 <code>Models/</code> 目录，写入所有实体和 <code>TaskHubDbContext</code>，注册 DbContext 到 <code>Program.cs</code>，配置连接字符串，<code>dotnet build TaskHub.Api</code> 编译通过。
          </p>
        }
        id="ef-dbcontext-write-files"
        title="将实体与 DbContext 写入 TaskHub.Infrastructure"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
