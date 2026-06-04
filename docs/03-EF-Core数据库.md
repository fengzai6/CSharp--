# 三、EF Core 数据库

> 预估时间：2 周 | 目标：能用 EF Core 建模复杂关系并处理事务

---

## 本章你要掌握什么

学完本章后，你应该能用 EF Core 建模用户、角色、权限、群组树结构，写迁移，完成分页查询、关系查询、事务和批量操作，并知道什么时候使用 `AsNoTracking()`、投影、`Include` 和 `ExecuteUpdateAsync()`。

## 老师提示

EF Core 最容易学歪的地方是把它当成 TypeORM Repository 的同款替代。你要重点理解 `DbContext` 是工作单元，Change Tracker 会追踪实体变化。只读接口和修改实体的查询策略不同，这是后端性能和正确性的分水岭。

## 学习顺序建议

1. 先建立 DbContext、Entity、Configuration 和 Migration 的基本流程。
2. 再建模一对多、多对多、自引用树结构。
3. 然后练分页查询、投影和 `AsNoTracking()`。
4. 最后处理事务、悲观锁、软删除和批量更新。

## 常见误区

- 查询列表接口时直接 `Include` 一整棵对象图。
- 只读查询忘记 `AsNoTracking()`。
- 在循环里逐条 `SaveChangesAsync()`。
- 以为 EF Core 有 TypeORM TreeRepository 同款内置能力。
- 全局查询过滤器用了软删除，却忘记后台管理或恢复场景需要忽略过滤器。

## 当前学习重点

学习 EF Core 时先掌握稳定主线，不要一开始追版本特性：

1. **DbContext 是工作单元**：一次请求通常使用一个 scoped `DbContext`
2. **默认查询会追踪实体**：只读查询需要显式加 `AsNoTracking()`
3. **投影优先**：列表接口优先用 `Select` 映射 DTO，只取需要的字段
4. **关系加载按场景选择**：修改完整实体图用 `Include/ThenInclude`，只返回 DTO 用投影
5. **批量更新/删除**：`ExecuteUpdateAsync()` 和 `ExecuteDeleteAsync()` 适合不需要加载实体的批量操作

---

## 与 TypeORM 的对照

| 概念 | TypeORM | EF Core |
|------|---------|---------|
| ORM 定义 | `@Entity`, `@Column` | Fluent API 或 Data Annotations |
| 关系 | `@OneToMany`, `@ManyToMany` | `.HasMany()`, `.WithMany()` |
| 仓储 | `Repository<T>` | `DbContext.Set<T>()`（内置） |
| 迁移 | `typeorm migrations:generate` | `dotnet ef migrations add` |
| 事务 | `manager.transaction()` | `Database.BeginTransaction()` |
| 变更追踪 | 运行时追踪 | Change Tracker |
| 软删除 | 手动/插件 | 全局查询过滤器 |
| 树结构 | `TreeRepository` | 自引用关系 |

---

## 安装与配置

```bash
# 安装 NuGet 包
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
# 如果使用 PostgreSQL
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
```

### DbContext — 数据库上下文

```csharp
using Microsoft.EntityFrameworkCore;

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
}
```

---

## 实体建模

### 简单实体

```csharp
// 基础实体基类
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

// 基类
public enum SpecialRole
{
    SuperAdmin,
    PlatformAdmin
}
```

---

### 关系映射

#### 1. 一对多

```csharp
// User → GroupMemberships（一个用户有多个成员记录）
public class GroupMembership : BaseEntity
{
    public string GroupId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public MemberRole Role { get; set; } = MemberRole.Member;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // 导航属性
    public Group Group { get; set; } = null!;
    public User User { get; set; } = null!;
}

// 配置
public class GroupMembershipConfiguration : IEntityTypeConfiguration<GroupMembership>
{
    public void Configure(EntityTypeBuilder<GroupMembership> builder)
    {
        builder.HasKey(gm => new { gm.GroupId, gm.UserId }); // 联合主键

        builder.HasOne(gm => gm.Group)
            .WithMany(g => g.Members)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(gm => gm.User)
            .WithMany(u => u.GroupMemberships)
            .HasForeignKey(gm => gm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(gm => gm.UserId);
        builder.HasIndex(gm => gm.GroupId);
    }
}
```

#### 2. 多对多（通过连接表）

```csharp
// 这里显式使用中间实体，因为连接关系需要 AssignedAt、IsActive 等额外字段
public class UserRole : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // 导航属性
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // 导航属性
    public List<UserRole> Users { get; set; } = new();
    public List<RolePermission> Permissions { get; set; } = new();
}

public class Permission : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Resource { get; set; }
    public string? Action { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // 导航属性
    public List<RolePermission> Roles { get; set; } = new();
}

// 连接实体
public class RolePermission : BaseEntity
{
    public string RoleId { get; set; } = string.Empty;
    public string PermissionId { get; set; } = string.Empty;

    // 导航属性
    public Role Role { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}

// 多对多配置
public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.HasKey(ur => new { ur.UserId, ur.RoleId });

        builder.HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ur => ur.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.HasKey(rp => new { rp.RoleId, rp.PermissionId });

        builder.HasOne(rp => rp.Role)
            .WithMany(r => r.Permissions)
            .HasForeignKey(rp => rp.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rp => rp.Permission)
            .WithMany(p => p.Roles)
            .HasForeignKey(rp => rp.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

> **关键差异**：EF Core 支持不带额外字段的多对多 skip navigation。但你的权限、成员关系通常需要 `AssignedAt`、`IsActive`、`Role` 等额外字段，所以更推荐显式定义中间实体。

#### 3. 自引用树形结构

```csharp
public class Group : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ParentId { get; set; }
    public string? OrganizationId { get; set; }
    public bool IsOrganization { get; set; }
    public bool IsActive { get; set; } = true;

    // 导航属性 — 自引用
    public Group? Parent { get; set; }
    public List<Group> Children { get; set; } = new();
    public Group? Organization { get; set; }

    // 扁平成员列表（通过 GroupMembership 连接表）
    public List<GroupMembership> Members { get; set; } = new();
}

// 树形结构配置
public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.HasOne(g => g.Parent)
            .WithMany(g => g.Children)
            .HasForeignKey(g => g.ParentId)
            .OnDelete(DeleteBehavior.Restrict); // 防止级联删除破坏树

        builder.HasOne(g => g.Organization)
            .WithMany()
            .HasForeignKey(g => g.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
```

> **TypeORM 对照**：你的 `GroupsService` 使用 `TreeRepository`（嵌套集合模型）。EF Core 没有内置树仓库，但可以通过自引用关系 + 手动逻辑实现相同功能。

---

## 增删改查

### 创建

```csharp
public async Task<User> CreateAsync(CreateUserDto dto)
{
    var user = new User
    {
        Username = dto.Username,
        Email = dto.Email,
        PasswordHash = HashPassword(dto.Password),
        IsActive = true
    };

    _context.Users.Add(user);
    await _context.SaveChangesAsync();

    return user;
}
```

### 查询

```csharp
// 单个查询 — 类似 findOne
public async Task<User?> GetByIdAsync(string id, bool includeRoles = false)
{
    var query = _context.Users
        .AsNoTracking() // 只读查询，提升性能
        .Where(u => u.Id == id);

    if (includeRoles)
    {
        query = query
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.Permissions);
    }

    return await query.FirstOrDefaultAsync();
}

// 分页查询 — 类似 findAll
public async Task<PagedResult<User>> GetAllAsync(
    int page = 1,
    int pageSize = 20,
    string? search = null)
{
    var query = _context.Users.AsQueryable();

    // 搜索
    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(u =>
            u.Username.Contains(search) ||
            u.Email.Contains(search) ||
            (u.Nickname != null && u.Nickname.Contains(search)));
    }

    // 排序 + 分页
    var total = await query.CountAsync();

    var users = await query
        .OrderByDescending(u => u.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(u => new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            Nickname = u.Nickname,
            DisplayName = u.DisplayName,
            SpecialRoles = u.SpecialRoles,
            Roles = u.UserRoles.Select(ur => new RoleDto
            {
                Name = ur.Role.Name,
                Code = ur.Role.Code
            }).ToList()
        })
        .ToListAsync();

    return new PagedResult<UserDto>
    {
        Data = users,
        Total = total,
        Page = page,
        PageSize = pageSize
    };
}

// Any / All / Contains — 类似 IN / EXISTS
public async Task<bool> UsernameExistsAsync(string username)
{
    return await _context.Users.AnyAsync(u => u.Username == username);
}

public async Task<List<User>> GetByIdsAsync(IEnumerable<string> ids)
{
    return await _context.Users
        .Where(u => ids.Contains(u.Id))
        .ToListAsync();
}
```

### 更新

```csharp
public async Task<User> UpdateAsync(string id, UpdateUserDto dto)
{
    var user = await _context.Users.FindAsync(id);
    if (user == null)
        throw new NotFoundException("User not found");

    if (!string.IsNullOrWhiteSpace(dto.Username))
        user.Username = dto.Username;
    if (!string.IsNullOrWhiteSpace(dto.Email))
        user.Email = dto.Email;
    if (!string.IsNullOrWhiteSpace(dto.Nickname))
        user.Nickname = dto.Nickname;

    user.Touch(); // 更新 UpdatedAt
    await _context.SaveChangesAsync();

    return user;
}

// 批量更新
public async Task<int> UpdateStatusAsync(IEnumerable<string> ids, bool active)
{
    var users = await _context.Users
        .Where(u => ids.Contains(u.Id))
        .ToListAsync();

    foreach (var user in users)
    {
        user.IsActive = active;
        user.Touch();
    }

    return await _context.SaveChangesAsync();
}
```

### 删除（软删除）

```csharp
public async Task DeleteSoftAsync(string id)
{
    var user = await _context.Users.FindAsync(id);
    if (user == null)
        throw new NotFoundException("User not found");

    user.IsActive = false;
    user.DeletedAt = DateTime.UtcNow;
    user.Touch();

    await _context.SaveChangesAsync();
}
```

> **关键差异**：TypeORM 有 `softRemove()` 方法。EF Core 没有内置软删除，但通过 **全局查询过滤器** + 手动标记实现，更透明。

### 批量操作（替代循环逐个更新）

```csharp
// 批量删除
await _context.Users.Where(u => ids.Contains(u.Id)).ExecuteDeleteAsync();

// 批量更新
await _context.Users
    .Where(u => ids.Contains(u.Id))
    .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, false)
                            .SetProperty(u => u.UpdatedAt, DateTime.UtcNow));

// 批量插入（已存在于 CRUD 中，此处补充）
await _context.Users.AddRangeAsync(usersToCreate);
await _context.SaveChangesAsync();

// TS 开发者对照：这替代了你项目中的循环 save 操作
// NestJS: for (const item of items) { await repo.save(item); }
// EF Core: await repo.AddRangeAsync(items); await repo.SaveChangesAsync();
```

> **实战价值**：你的 `GroupsService` 中有 `addGroupMembers` 批量添加成员的场景，用批量操作可以大幅减少数据库往返次数。

---

## 事务管理

### 基本事务

```csharp
public async Task UpdateUserRolesAsync(string userId, List<string> roleCodes)
{
    // 对应 TypeORM 的 manager.transaction()
    await using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        // 1. 查询用户
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new NotFoundException("User not found");

        // 2. 获取目标角色
        var roles = await _context.Roles
            .Where(r => roleCodes.Contains(r.Code))
            .ToListAsync();

        // 3. 替换角色 — 删除旧的，添加新的
        user.UserRoles.Clear();
        foreach (var role in roles)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = userId,
                RoleId = role.Id
            });
        }

        // 4. 保存
        await _context.SaveChangesAsync();

        // 5. 提交
        await transaction.CommitAsync();
    }
    catch
    {
        // 6. 回滚
        await transaction.RollbackAsync();
        throw;
    }
}
```

### 悲观锁 — 对应你的 GroupsService 中的事务锁

```csharp
public async Task SetGroupLeaderAsync(string groupId, string userId)
{
    await using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        // 锁定 Group 行 — 对应 lock: { mode: 'pessimistic_write' }
        var group = await _context.Groups
            .FromSqlRaw("SELECT * FROM \"groups\" WHERE id = {0} FOR UPDATE", groupId)
            .FirstOrDefaultAsync();

        // .NET 8+ 也有官方支持：
        // var group = await _context.Groups
        //     .FromSqlRaw("SELECT * FROM groups WHERE id = @p FOR UPDATE", groupId)
        //     .FirstOrDefaultAsync();

        if (group == null)
            throw new NotFoundException("Group not found");

        // 1. 找到旧 Leader
        var oldLeader = await _context.GroupMembers
            .Include(gm => gm.User)
            .FirstOrDefaultAsync(gm =>
                gm.GroupId == groupId &&
                gm.Role == MemberRole.Leader);

        // 2. 降级旧 Leader
        if (oldLeader != null)
        {
            oldLeader.Role = MemberRole.Member;
            await _context.SaveChangesAsync();
        }

        // 3. 设置新 Leader
        var newMember = await _context.GroupMembers
            .FirstOrDefaultAsync(gm =>
                gm.GroupId == groupId &&
                gm.UserId == userId);

        if (newMember == null)
            throw new NotFoundException("Member not found in group");

        newMember.Role = MemberRole.Leader;
        await _context.SaveChangesAsync();

        await transaction.CommitAsync();
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

---

## 关系数据查询：Include 与投影

EF Core 中访问关系数据有两种常见方式：加载实体图和投影 DTO。不要简单理解成某一种替代另一种。

```csharp
// 方式一：加载完整实体图，适合后续修改实体并 SaveChanges
var users = await _context.Users
    .Include(u => u.UserRoles)
        .ThenInclude(ur => ur.Role)
    .ToListAsync();

// 方式二：直接投影 DTO，适合列表接口和只读接口
var userDtos = await _context.Users
    .AsNoTracking()
    .Select(u => new
    {
        u.Id,
        u.Username,
        Roles = u.UserRoles
            .Where(ur => ur.IsActive)
            .Select(ur => new { ur.Role.Name, ur.Role.Code })
            .ToList()
    })
    .ToListAsync();
```

> **选择规则**：要改实体就用 tracking 查询和必要的 `Include`；只返回接口数据就优先用 `AsNoTracking()` + `Select` 投影。

---

## 变更追踪

### Change Tracker — EF Core 的核心机制

```csharp
// EF Core 自动追踪实体的变更状态
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
_context.Entry(user).State = EntityState.Detached; // 停止追踪
```

> **与 TypeORM 对照**：TypeORM 通过 `Repository.save()` 自动检测变更。EF Core 通过 Change Tracker 自动检测。但 EF Core 的追踪是上下文级别的，不同 DbContext 实例之间不共享追踪状态。

### 性能优化

```csharp
// 只读查询 — 禁用变更追踪，提升性能
var users = await _context.Users
    .AsNoTracking()
    .ToListAsync();

// 只读取需要的字段 — 投影
var userNames = await _context.Users
    .AsNoTracking()
    .Select(u => u.Username)
    .ToListAsync();

// 避免 N+1 查询 — 预加载
var groups = await _context.Groups
    .Include(g => g.Members)
        .ThenInclude(gm => gm.User)
    .Include(g => g.Children)
    .ToListAsync();

// 原生 SQL — 性能敏感场景
var result = await _context.Users
    .FromSqlRaw("""
        SELECT u.*, r.name as role_name 
        FROM users u 
        JOIN user_roles ur ON u.id = ur.user_id 
        JOIN roles r ON ur.role_id = r.id 
        WHERE u.active = true
    """)
    .ToListAsync();
```

---

## 迁移

```bash
# 创建迁移
dotnet ef migrations add AddUsersAndRolesTables
dotnet ef migrations add AddGroupTreeStructure

# 应用迁移到数据库
dotnet ef database update

# 回滚迁移
dotnet ef database update 0      # 回滚到初始状态
dotnet ef database update AddUsersAndRolesTables  # 回滚到指定迁移

# 从数据库反向生成迁移（Database First）
dotnet ef migrations add InitialCreate --context ApplicationDbContext
```

---

## 实战练习清单

- [ ] 用 EF Core 建模 `User → UserRole → Role` 多对多关系
- [ ] 实现 `Group` 树形结构（自引用 + Organization）
- [ ] 编写 `UserService.GetAllAsync()` 的分页 + 搜索 + 排序
- [ ] 实现 `UpdateUserRolesAsync()` 的事务操作
- [ ] 实现 `SetGroupLeaderAsync()` 的悲观锁
- [ ] 添加全局软删除过滤器
- [ ] 创建 Migration 并应用到数据库
- [ ] 用 `AsNoTracking()` 优化只读查询性能

## 阶段验收问题

- DbContext 为什么通常注册为 Scoped？
- 查询 DTO 时为什么优先用 `Select` 投影？
- `Include` 适合什么场景，不适合什么场景？
- `ExecuteUpdateAsync()` 和加载实体后修改有什么区别？
- 软删除用全局过滤器时有哪些边界情况？

## 下一步

完成本阶段后，进入 [四、认证授权](04-认证授权.md)。
