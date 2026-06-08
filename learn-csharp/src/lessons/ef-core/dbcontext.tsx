import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const EfDbContextLesson = () => {
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

      <LessonStep
        title="实战任务：搭建 EF Core + DbContext 基础架构"
        steps={[
          {
            title: "创建 ApplicationDbContext 并定义 DbSet",
            content: (
              <div>
                <p>安装 EF Core 包，创建 DbContext，定义 Users、Roles、Groups 等表。</p>
              </div>
            ),
            code: `// 1. 安装 NuGet 包
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
// 如果用 PostgreSQL
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

// 2. 创建 Data/ApplicationDbContext.cs
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // 定义 DbSet — 每个对应一张表
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // 实体配置将在后续步骤添加
    }
}

// 3. 在 Program.cs 中注册
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
    // 或 PostgreSQL: options.UseNpgsql(...)

// 4. 在 appsettings.json 中配置连接字符串
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=LearnCSharp;Trusted_Connection=True;"
  }
}`,
            codeLanguage: "csharp",
            codeTitle: "ApplicationDbContext",
            checkpoints: [
              "EF Core 包已安装（SqlServer 或 PostgreSQL）",
              "ApplicationDbContext 类已创建并继承 DbContext",
              "已定义 Users、Roles、Groups、UserRoles、GroupMembers 五个 DbSet",
              "Program.cs 中已用 AddDbContext 注册（Scoped 生命周期）",
              "appsettings.json 中已配置数据库连接字符串",
            ],
            reference: `DbContext 自动注册为 Scoped 生命周期，意味着每个 HTTP 请求内共享一个实例，请求结束自动释放。不要在 Singleton 服务中注入 DbContext，会导致跨请求共享和线程安全问题。`,
          },
          {
            title: "抽出 BaseEntity 基类，让 User 继承",
            content: (
              <div>
                <p>创建一个基类统一管理 Id、CreatedAt、UpdatedAt 等公共字段。</p>
              </div>
            ),
            code: `// Data/Entities/BaseEntity.cs
public abstract class BaseEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public abstract void Touch(); // 抽象方法，子类实现更新逻辑
}

// Data/Entities/User.cs
public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public string? Avatar { get; set; }
    public bool IsActive { get; set; } = true;

    // 导航属性
    public List<UserRole> UserRoles { get; set; } = new();
    public List<GroupMember> GroupMemberships { get; set; } = new();

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

// Data/Entities/Role.cs
public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public List<UserRole> UserRoles { get; set; } = new();

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

// Data/Entities/Group.cs
public class Group : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public List<GroupMember> Members { get; set; } = new();

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "BaseEntity 和实体类",
            checkpoints: [
              "BaseEntity 类包含 Id、CreatedAt、UpdatedAt",
              "BaseEntity 定义了抽象方法 Touch()",
              "User、Role、Group 都继承自 BaseEntity",
              "User 包含 Username、Email、PasswordHash、IsActive",
              "实体中使用导航属性表达关系（UserRoles、GroupMemberships）",
              "所有实体都实现了 Touch() 方法",
            ],
            reference: `使用基类的好处：1) 减少重复代码；2) 统一审计字段；3) 可以在基类中添加通用方法。导航属性（如 UserRoles）用于表达关系，EF Core 会根据导航属性自动推断外键。`,
          },
          {
            title: "在 OnModelCreating 中添加全局查询过滤器",
            content: (
              <div>
                <p>为 User 实体添加 IsActive 的全局过滤器，实现软删除功能。</p>
              </div>
            ),
            code: `// Data/ApplicationDbContext.cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // 为 User 添加全局查询过滤器（软删除）
    modelBuilder.Entity<User>()
        .HasQueryFilter(u => u.IsActive);

    // 为 Group 添加全局查询过滤器
    modelBuilder.Entity<Group>()
        .HasQueryFilter(g => g.IsActive);

    // 配置索引
    modelBuilder.Entity<User>()
        .HasIndex(u => u.Email)
        .IsUnique();

    modelBuilder.Entity<User>()
        .HasIndex(u => u.Username)
        .IsUnique();

    // 配置字符串长度
    modelBuilder.Entity<User>()
        .Property(u => u.Username)
        .HasMaxLength(50);

    modelBuilder.Entity<User>()
        .Property(u => u.Email)
        .HasMaxLength(100);
}

// 使用时的效果
// 默认查询会自动过滤掉 IsActive = false 的记录
var activeUsers = await _context.Users.ToListAsync(); // 只返回 IsActive = true 的用户

// 需要查询包括已停用的用户时，使用 IgnoreQueryFilters()
var allUsers = await _context.Users
    .IgnoreQueryFilters()
    .ToListAsync(); // 返回所有用户，包括 IsActive = false`,
            codeLanguage: "csharp",
            codeTitle: "全局查询过滤器",
            checkpoints: [
              "OnModelCreating 中已为 User 添加 HasQueryFilter",
              "过滤条件为 u => u.IsActive",
              "同样为 Group 添加了过滤器",
              "添加了 Email 和 Username 的唯一索引",
              "配置了字符串字段的最大长度",
              "理解 IgnoreQueryFilters() 的作用场景",
            ],
            reference: `全局查询过滤器在所有查询中自动生效，无需手动添加 Where 条件。但在恢复已删除记录、后台管理等场景，需要用 IgnoreQueryFilters() 暂时禁用过滤器。注意：过滤器不影响 Find()、Add()、Update()、Remove() 这些直接操作。`,
          },
          {
            title: "创建迁移并应用到数据库",
            content: (
              <div>
                <p>使用 EF Core 迁移工具生成数据库迁移脚本并应用。</p>
              </div>
            ),
            code: `# 1. 创建初始迁移
dotnet ef migrations add InitialCreate

# 这会在项目中生成 Migrations/ 文件夹，包含：
# - <timestamp>_InitialCreate.cs       (迁移定义)
# - <timestamp>_InitialCreate.Designer.cs (元数据)
# - ApplicationDbContextModelSnapshot.cs  (当前模型快照)

# 2. 查看将要执行的 SQL
dotnet ef migrations script

# 3. 应用迁移到数据库
dotnet ef database update

# 4. 验证数据库
# 连接到数据库，检查表是否创建成功：
# - Users 表
# - Roles 表
# - Groups 表
# - UserRoles 表
# - GroupMembers 表
# - __EFMigrationsHistory 表（迁移历史记录）

# 5. 回滚迁移（如需要）
dotnet ef database update 0  # 回滚所有迁移
dotnet ef database update InitialCreate  # 回滚到指定迁移

# 6. 删除迁移（未应用时）
dotnet ef migrations remove`,
            codeLanguage: "bash",
            codeTitle: "EF Core 迁移命令",
            checkpoints: [
              "成功执行 dotnet ef migrations add InitialCreate",
              "Migrations/ 文件夹已生成，包含迁移文件",
              "成功执行 dotnet ef database update",
              "数据库中已创建所有表",
              "数据库中存在 __EFMigrationsHistory 表",
              "理解 migrations script、update、remove 的区别",
            ],
            reference: `迁移文件记录了数据库结构的变化历史。每次修改实体后，运行 migrations add 生成新迁移，再用 database update 应用。__EFMigrationsHistory 表记录已应用的迁移，确保不会重复执行。`,
          },
          {
            title: "打印 ChangeTracker 状态，观察实体追踪",
            content: (
              <div>
                <p>编写测试代码，观察 EF Core 的变更追踪机制。</p>
              </div>
            ),
            code: `// 创建一个测试端点或单元测试
public class ChangeTrackerTestService
{
    private readonly ApplicationDbContext _context;

    public ChangeTrackerTestService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task DemoChangeTrackerAsync()
    {
        // 1. 新增实体 — 状态为 Added
        var newUser = new User
        {
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = "hash123"
        };
        _context.Users.Add(newUser);
        PrintTrackerState("添加新用户后");

        // 2. 保存后状态变为 Unchanged
        await _context.SaveChangesAsync();
        PrintTrackerState("保存后");

        // 3. 修改实体属性 — 状态变为 Modified
        newUser.Username = "updateduser";
        PrintTrackerState("修改用户名后");

        // 4. 保存后再次变为 Unchanged
        await _context.SaveChangesAsync();
        PrintTrackerState("再次保存后");

        // 5. 标记删除 — 状态变为 Deleted
        _context.Users.Remove(newUser);
        PrintTrackerState("标记删除后");

        await _context.SaveChangesAsync();
        PrintTrackerState("删除保存后");
    }

    private void PrintTrackerState(string stage)
    {
        Console.WriteLine($"\\n===== {stage} =====");
        foreach (var entry in _context.ChangeTracker.Entries<User>())
        {
            Console.WriteLine($"Entity: {entry.Entity.Username}");
            Console.WriteLine($"  State: {entry.State}");

            if (entry.State == EntityState.Modified)
            {
                foreach (var prop in entry.Properties)
                {
                    if (prop.IsModified)
                    {
                        Console.WriteLine($"  Modified Property: {prop.Metadata.Name}");
                        Console.WriteLine($"    Original: {prop.OriginalValue}");
                        Console.WriteLine($"    Current: {prop.CurrentValue}");
                    }
                }
            }
        }
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "ChangeTracker 追踪测试",
            checkpoints: [
              "创建了测试方法观察 ChangeTracker",
              "理解 Added 状态（新增实体）",
              "理解 Modified 状态（修改已追踪实体）",
              "理解 Unchanged 状态（SaveChanges 后）",
              "理解 Deleted 状态（调用 Remove 后）",
              "能够打印出修改前后的属性值",
              "理解 SaveChangesAsync 会重置追踪状态",
            ],
            reference: `ChangeTracker 是 EF Core 的核心机制。它自动追踪查询出来的实体，你直接修改属性即可，SaveChanges 时自动生成 UPDATE 语句。但这也有性能开销：只读查询应该用 AsNoTracking() 避免追踪。Detached 状态表示实体未被追踪。`,
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 完成！你已经搭建了 EF Core 的基础架构，理解了 DbContext 和变更追踪机制。
            </p>
            <p>
              <strong>💡 核心要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                DbContext 是工作单元，通常注册为 Scoped（每个 HTTP 请求一个实例）
              </li>
              <li>
                BaseEntity 基类统一管理审计字段，减少重复代码
              </li>
              <li>
                全局查询过滤器实现软删除，但恢复场景需要 IgnoreQueryFilters()
              </li>
              <li>
                迁移工具记录数据库结构变化，migrations add + database update 是标准流程
              </li>
              <li>
                ChangeTracker 自动追踪实体变化，直接修改属性即可，SaveChanges 时自动生成 SQL
              </li>
              <li>
                只读查询应使用 AsNoTracking() 避免追踪开销
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 下一步：</strong>学习 EF Core 的关系映射、Include 预加载、分页查询等高级特性。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
