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

      <LessonCode
        code={`using Microsoft.EntityFrameworkCore;

public class TaskHubDbContext : DbContext
{
    public TaskHubDbContext(DbContextOptions<TaskHubDbContext> options)
        : base(options) { }

    // DbSet — 每个 DbSet 对应一个表
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();
    public DbSet<WorkItemComment> WorkItemComments => Set<WorkItemComment>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // 重写配置 — 替代 TypeORM 的 @Entity 装饰器
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 实体配置
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskHubDbContext).Assembly);

        // 全局查询过滤器（类似软删除）
        modelBuilder.Entity<User>()
            .HasQueryFilter(u => u.IsActive);

        modelBuilder.Entity<Project>()
            .HasQueryFilter(project => project.ArchivedAt == null);

        modelBuilder.Entity<WorkItem>()
            .HasQueryFilter(item => item.DeletedAt == null);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Provider 中立的约定：限制默认长度，具体列类型交给数据库 provider 映射
        configurationBuilder.Properties<string>()
            .HaveMaxLength(500);
    }
}`}
        language="csharp"
        title="TaskHubDbContext"
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
        code={`# 创建迁移
dotnet ef migrations add AddTaskHubCoreTables \
    --project TaskHub.Infrastructure \
    --startup-project TaskHub.Api
dotnet ef migrations add AddWorkItemComments \
    --project TaskHub.Infrastructure \
    --startup-project TaskHub.Api

# 应用迁移到数据库
dotnet ef database update --project TaskHub.Infrastructure --startup-project TaskHub.Api

# 回滚迁移
dotnet ef database update 0 --project TaskHub.Infrastructure --startup-project TaskHub.Api
dotnet ef database update AddTaskHubCoreTables --project TaskHub.Infrastructure --startup-project TaskHub.Api

# 从已有数据库反向生成 DbContext 和实体（Database First）
dotnet ef dbcontext scaffold "Host=localhost;Database=taskhub;Username=postgres;Password=postgres" \
    Npgsql.EntityFrameworkCore.PostgreSQL \
    --context TaskHubDbContext \
    --output-dir Models/Entities \
    --context-dir Data`}
        language="bash"
        title="dotnet ef 迁移命令"
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

      <TeacherTask title="Phase 2 主线任务">
        <p>
          在 TaskHub 中完成 Phase 2：接入 EF Core + PostgreSQL，创建 DbContext 和
          Migration，跑通第一次 <code>dotnet ef database update</code>。
        </p>
      </TeacherTask>
    </LessonShell>
  );
};
