import type { ILessonBlock } from "@/components/lesson-ui";

export const efDbContextBlocks = [
  {
    "text": "预估时间：2 周 | 目标：能用 EF Core 建模复杂关系并处理事务",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "本章你要掌握什么",
    "type": "heading"
  },
  {
    "text": "学完本章后，你应该能用 EF Core 建模用户、角色、权限、群组树结构，写迁移，完成分页查询、关系查询、事务和批量操作，并知道什么时候使用 `AsNoTracking()`、投影、`Include` 和 `ExecuteUpdateAsync()`。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "老师提示",
    "type": "heading"
  },
  {
    "text": "EF Core 最容易学歪的地方是把它当成 TypeORM Repository 的同款替代。你要重点理解 `DbContext` 是工作单元，Change Tracker 会追踪实体变化。只读接口和修改实体的查询策略不同，这是后端性能和正确性的分水岭。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "学习顺序建议",
    "type": "heading"
  },
  {
    "items": [
      "先建立 DbContext、Entity、Configuration 和 Migration 的基本流程。",
      "再建模一对多、多对多、自引用树结构。",
      "然后练分页查询、投影和 `AsNoTracking()`。",
      "最后处理事务、悲观锁、软删除和批量更新。"
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
      "查询列表接口时直接 `Include` 一整棵对象图。",
      "只读查询忘记 `AsNoTracking()`。",
      "在循环里逐条 `SaveChangesAsync()`。",
      "以为 EF Core 有 TypeORM TreeRepository 同款内置能力。",
      "全局查询过滤器用了软删除，却忘记后台管理或恢复场景需要忽略过滤器。"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "当前学习重点",
    "type": "heading"
  },
  {
    "text": "学习 EF Core 时先掌握稳定主线，不要一开始追版本特性：",
    "type": "paragraph"
  },
  {
    "items": [
      "**DbContext 是工作单元**：一次请求通常使用一个 scoped `DbContext`",
      "**默认查询会追踪实体**：只读查询需要显式加 `AsNoTracking()`",
      "**投影优先**：列表接口优先用 `Select` 映射 DTO，只取需要的字段",
      "**关系加载按场景选择**：修改完整实体图用 `Include/ThenInclude`，只返回 DTO 用投影",
      "**批量更新/删除**：`ExecuteUpdateAsync()` 和 `ExecuteDeleteAsync()` 适合不需要加载实体的批量操作"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "与 TypeORM 的对照",
    "type": "heading"
  },
  {
    "headers": [
      "概念",
      "TypeORM",
      "EF Core"
    ],
    "rows": [
      [
        "ORM 定义",
        "`@Entity`, `@Column`",
        "Fluent API 或 Data Annotations"
      ],
      [
        "关系",
        "`@OneToMany`, `@ManyToMany`",
        "`.HasMany()`, `.WithMany()`"
      ],
      [
        "仓储",
        "`Repository<T>`",
        "`DbContext.Set<T>()`（内置）"
      ],
      [
        "迁移",
        "`typeorm migrations:generate`",
        "`dotnet ef migrations add`"
      ],
      [
        "事务",
        "`manager.transaction()`",
        "`Database.BeginTransaction()`"
      ],
      [
        "变更追踪",
        "运行时追踪",
        "Change Tracker"
      ],
      [
        "软删除",
        "手动/插件",
        "全局查询过滤器"
      ],
      [
        "树结构",
        "`TreeRepository`",
        "自引用关系"
      ]
    ],
    "type": "table"
  },
  {
    "level": 2,
    "text": "安装与配置",
    "type": "heading"
  },
  {
    "code": "# 安装 NuGet 包\ndotnet add package Microsoft.EntityFrameworkCore.SqlServer\ndotnet add package Microsoft.EntityFrameworkCore.Tools\n# 如果使用 PostgreSQL\ndotnet add package Npgsql.EntityFrameworkCore.PostgreSQL",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "DbContext — 数据库上下文",
    "type": "heading"
  },
  {
    "code": "using Microsoft.EntityFrameworkCore;\n\npublic class ApplicationDbContext : DbContext\n{\n    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)\n        : base(options) { }\n\n    // DbSet — 每个 DbSet 对应一个表\n    public DbSet<User> Users => Set<User>();\n    public DbSet<Role> Roles => Set<Role>();\n    public DbSet<Group> Groups => Set<Group>();\n    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();\n    public DbSet<Permission> Permissions => Set<Permission>();\n\n    // 重写配置 — 替代 TypeORM 的 @Entity 装饰器\n    protected override void OnModelCreating(ModelBuilder modelBuilder)\n    {\n        base.OnModelCreating(modelBuilder);\n\n        // 实体配置\n        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);\n\n        // 全局查询过滤器（类似软删除）\n        modelBuilder.Entity<User>()\n            .HasQueryFilter(u => u.IsActive);\n\n        modelBuilder.Entity<GroupMember>()\n            .HasQueryFilter(gm => gm.Group.IsActive);\n    }\n\n    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)\n    {\n        // 所有 string 列默认用 nvarchar(max)\n        configurationBuilder.Properties<string>()\n            .HaveColumnType(\"nvarchar(max)\");\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "实体建模",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "简单实体",
    "type": "heading"
  },
  {
    "code": "// 基础实体基类\npublic abstract class BaseEntity\n{\n    public string Id { get; set; } = Guid.NewGuid().ToString();\n    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;\n    public DateTime? UpdatedAt { get; set; }\n    public DateTime? DeletedAt { get; set; }\n\n    public abstract void Touch();\n}\n\npublic class User : BaseEntity\n{\n    public string Username { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string PasswordHash { get; set; } = string.Empty;\n    public string? Nickname { get; set; }\n    public string? Avatar { get; set; }\n    public List<SpecialRole> SpecialRoles { get; set; } = new();\n    public bool IsActive { get; set; } = true;\n\n    // 导航属性 — 替代 TypeORM 的 @ManyToMany 等\n    public List<UserRole> UserRoles { get; set; } = new();\n    public List<GroupMembership> GroupMemberships { get; set; } = new();\n\n    public string DisplayName => Nickname ?? Username;\n\n    public override void Touch()\n    {\n        UpdatedAt = DateTime.UtcNow;\n    }\n}\n\n// 基类\npublic enum SpecialRole\n{\n    SuperAdmin,\n    PlatformAdmin\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  }
] satisfies ILessonBlock[];
