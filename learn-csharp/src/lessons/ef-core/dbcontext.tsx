import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const EfDbContextLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
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
        code={`# 安装 NuGet 包
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
# 如果使用 PostgreSQL
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL`}
        language="bash"
        title="安装 EF Core"
      />

      <h3>DbContext — 数据库上下文</h3>
      <p>
        <code>DbContext</code> 是工作单元入口。每个 <code>DbSet&lt;T&gt;</code>{" "}
        对应一张表；<code>OnModelCreating</code> 替代 TypeORM 的{" "}
        <code>@Entity</code> 装饰器，集中做实体配置。
      </p>

      <LessonCode
        code={`using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // DbSet — 每个 DbSet 对应一个表
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<Permission> Permissions => Set<Permission>();

    // 重写配置 — 替代 TypeORM 的 @Entity 装饰器
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 实体配置
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // 全局查询过滤器（类似软删除）
        modelBuilder.Entity<User>()
            .HasQueryFilter(u => u.IsActive);

        modelBuilder.Entity<GroupMember>()
            .HasQueryFilter(gm => gm.Group.IsActive);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // 所有 string 列默认用 nvarchar(max)
        configurationBuilder.Properties<string>()
            .HaveColumnType("nvarchar(max)");
    }
}`}
        language="csharp"
        title="ApplicationDbContext"
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
    public string? Nickname { get; set; }
    public string? Avatar { get; set; }
    public List<SpecialRole> SpecialRoles { get; set; } = new();
    public bool IsActive { get; set; } = true;

    // 导航属性 — 替代 TypeORM 的 @ManyToMany 等
    public List<UserRole> UserRoles { get; set; } = new();
    public List<GroupMembership> GroupMemberships { get; set; } = new();

    public string DisplayName => Nickname ?? Username;

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

public enum SpecialRole
{
    SuperAdmin,
    PlatformAdmin
}`}
        language="csharp"
        title="BaseEntity 与 User 实体"
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
var user = _context.Users.First(u => u.Id == "123");
user.Username = "newName";  // EF 已追踪到变化

// 查看变更状态
foreach (var entry in _context.ChangeTracker.Entries<User>())
{
    Console.WriteLine($"State: {entry.State}");       // Added/Modified/Deleted/Unchanged
    Console.WriteLine($"Property: {entry.Property(u => u.Username).IsModified}");
    Console.WriteLine($"Original: {entry.Property(u => u.Username).OriginalValue}");
    Console.WriteLine($"Current: {entry.Property(u => u.Username).CurrentValue}");
}

// 保存所有变更
await _context.SaveChangesAsync();

// 手动标记状态
_context.Users.Update(user);        // Modified
_context.Users.Add(newUser);        // Added
_context.Users.Remove(user);        // Deleted
_context.Entry(user).State = EntityState.Detached; // 停止追踪`}
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
dotnet ef migrations add AddUsersAndRolesTables
dotnet ef migrations add AddGroupTreeStructure

# 应用迁移到数据库
dotnet ef database update

# 回滚迁移
dotnet ef database update 0      # 回滚到初始状态
dotnet ef database update AddUsersAndRolesTables  # 回滚到指定迁移

# 从数据库反向生成迁移（Database First）
dotnet ef migrations add InitialCreate --context ApplicationDbContext`}
        language="bash"
        title="dotnet ef 迁移命令"
      />

      <h3>常见误区</h3>
      <ul>
        <li>只读查询忘记 <code>AsNoTracking()</code>，白白承担追踪开销。</li>
        <li>以为 EF Core 有 TypeORM TreeRepository 同款的内置树能力。</li>
        <li>全局查询过滤器做了软删除，却忘记后台管理或恢复场景需要忽略过滤器。</li>
      </ul>

      <h3>阶段验收问题</h3>
      <ul>
        <li>DbContext 为什么通常注册为 Scoped？</li>
        <li>EF Core 的变更追踪是上下文级别还是全局级别？这意味着什么？</li>
        <li>软删除用全局过滤器时有哪些边界情况？</li>
      </ul>

      <TeacherTask title="Phase 2 练习">
        <p>
          在复刻项目中完成 Phase 2：接入 EF Core + PostgreSQL，创建 DbContext 和
          Migration，跑通第一次 <code>dotnet ef database update</code>。
        </p>
      </TeacherTask>

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="ef-dbcontext-checklist"
        items={[
          "创建 ApplicationDbContext，定义 Users、Roles、Groups 等 DbSet",
          "抽出 BaseEntity 基类，让 User 继承它",
          "在 OnModelCreating 里为 User 添加 IsActive 的全局查询过滤器",
          "用 dotnet ef migrations add 创建迁移并 database update 应用",
          "打印 ChangeTracker 的实体状态，观察 Added/Modified/Unchanged",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
