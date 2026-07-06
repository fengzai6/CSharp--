import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const EfRelationshipsLesson = ({
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
        学完本节后，你应该能用 EF Core 建模一对多、多对多、自引用树结构，并知道什么时候用{" "}
        <code>Include</code> 加载实体图、什么时候用 <code>Select</code> 投影 DTO、什么时候加{" "}
        <code>AsNoTracking()</code>。
      </p>

      <TeacherTask title="老师提示">
        <p>
          关系建模本身不难，难在<strong>查询策略</strong>。同一个关系，
          只读列表接口和"加载后要修改"的接口走完全不同的路子。把这条边界想清楚，
          是后端性能和正确性的分水岭。
        </p>
      </TeacherTask>

      <h3>一对多</h3>
      <p>
        用一个连接实体（如 <code>GroupMembership</code>）表达"一个用户有多条成员记录"。
        在 <code>IEntityTypeConfiguration&lt;T&gt;</code> 里用{" "}
        <code>HasOne / WithMany / HasForeignKey</code> 配置外键和级联行为。
      </p>

      <LessonCode
        code={`// User → GroupMemberships（一个用户有多个成员记录）
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
}`}
        language="csharp"
        title="一对多 + 连接实体配置"
      />

      <h3>多对多（通过连接表）</h3>
      <p>
        这里显式定义中间实体 <code>UserRole</code>、<code>RolePermission</code>，
        因为连接关系需要 <code>AssignedAt</code>、<code>IsActive</code>{" "}
        等额外字段。
      </p>

      <LessonCode
        code={`public class UserRole : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public List<UserRole> Users { get; set; } = new();
    public List<RolePermission> Permissions { get; set; } = new();
}

// 连接实体
public class RolePermission : BaseEntity
{
    public string RoleId { get; set; } = string.Empty;
    public string PermissionId { get; set; } = string.Empty;

    public Role Role { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}`}
        language="csharp"
        title="多对多实体"
      />

      <LessonCode
        code={`public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
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
}`}
        language="csharp"
        title="多对多配置"
      />

      <LessonQuote>
        关键差异：EF Core 支持不带额外字段的多对多 skip
        navigation。但权限、成员关系通常需要 <code>AssignedAt</code>、
        <code>IsActive</code> 等额外字段，所以更推荐显式定义中间实体。
      </LessonQuote>

      <h3>自引用树形结构</h3>
      <p>
        群组树用自引用关系实现：<code>Parent</code> 指向父节点，
        <code>Children</code> 是子节点列表。
      </p>

      <LessonCode
        code={`public class Group : BaseEntity
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
}`}
        language="csharp"
        title="自引用树结构"
      />

      <TeacherTask title="TypeORM 对照">
        <p>
          TypeORM 的 <code>GroupsService</code> 用 <code>TreeRepository</code>
          （嵌套集合模型）。EF Core 没有内置树仓库，但可以通过自引用关系加手动逻辑实现相同功能。
        </p>
      </TeacherTask>

      <h3>查询：Include 与投影</h3>
      <p>
        访问关系数据有两种常见方式：加载实体图（<code>Include / ThenInclude</code>）和投影 DTO
        （<code>Select</code>）。不要简单理解成某一种替代另一种，按场景选择。
      </p>

      <LessonCode
        code={`// 方式一：加载完整实体图，适合后续修改实体并 SaveChanges
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
    .ToListAsync();`}
        language="csharp"
        title="Include vs 投影"
      />

      <LessonQuote>
        选择规则：要改实体就用 tracking 查询和必要的 <code>Include</code>；
        只返回接口数据就优先用 <code>AsNoTracking()</code> + <code>Select</code> 投影。
      </LessonQuote>

      <h4>查询策略速查</h4>
      <LessonTable
        headers={["场景", "策略", "原因"]}
        rows={[
          ["列表 / 只读接口", "AsNoTracking() + Select 投影", "只取需要的字段，不承担追踪开销"],
          ["加载后要修改实体", "tracking 查询 + Include", "需要 Change Tracker 算出变更"],
          ["判断是否存在", "AnyAsync()", "翻译成 EXISTS，不加载实体"],
          ["按一批 id 查询", "Where(u => ids.Contains(u.Id))", "翻译成 IN"],
        ]}
      />

      <h3>分页查询示例</h3>
      <p>
        列表接口的典型写法：搜索条件、<code>CountAsync</code> 取总数、
        <code>Skip / Take</code> 分页、<code>Select</code> 投影成 DTO。
      </p>

      <LessonCode
        code={`public async Task<PagedResult<UserDto>> GetAllAsync(
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
}`}
        language="csharp"
        title="分页 + 搜索 + 投影"
      />

      <h3>避免 N+1 查询</h3>
      <p>
        关系数据没有预加载时，遍历集合会触发逐条查询（N+1）。用 <code>Include</code>{" "}
        / <code>ThenInclude</code> 一次性预加载。
      </p>

      <LessonCode
        code={`// 避免 N+1 查询 — 预加载
var groups = await _context.Groups
    .Include(g => g.Members)
        .ThenInclude(gm => gm.User)
    .Include(g => g.Children)
    .ToListAsync();`}
        language="csharp"
        title="预加载关系"
      />

      <h3>常见误区</h3>
      <ul>
        <li>查询列表接口时直接 <code>Include</code> 一整棵对象图，把不需要的数据全拉回来。</li>
        <li>只读查询忘记 <code>AsNoTracking()</code>。</li>
        <li>以为 EF Core 有 TypeORM TreeRepository 同款内置能力。</li>
      </ul>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能区分显式连接实体、自引用树结构、<code>Include</code> 和投影查询的适用场景。
          </p>
        }
        id="ef-relationships-main"
        title="完成关系建模与查询策略"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>查询 DTO 时为什么优先用 <code>Select</code> 投影？</li>
        <li><code>Include</code> 适合什么场景，不适合什么场景？</li>
        <li>为什么权限、成员这类多对多关系推荐显式中间实体而不是 skip navigation？</li>
      </ul>

      <TeacherTask title="Phase 4 主线任务">
        <p>
          在复刻项目中完成 Phase 4：实现群组系统 — 树形 Group 结构、Member
          关系、批量添加成员事务。
        </p>
      </TeacherTask>

      <LessonStep
        title="实战：EF Core 关系建模与高效查询"
        steps={[
          {
            title: "建模 User → UserRole → Role 多对多关系",
            content: (
              <div>
                <p>创建 UserRole 连接实体，配置 User 和 Role 之间的多对多关系。</p>
              </div>
            ),
            code: `// 1. 定义 UserRole 连接实体
public class UserRole : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // 导航属性
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

// 2. 定义 Role 实体
public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // 导航属性
    public List<UserRole> UserRoles { get; set; } = new();

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

// 3. 更新 User 实体
public class User : BaseEntity
{
    // ... 已有字段

    // 导航属性
    public List<UserRole> UserRoles { get; set; } = new();
}

// 4. 配置关系 Data/Configurations/UserRoleConfiguration.cs
public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        // 联合主键
        builder.HasKey(ur => new { ur.UserId, ur.RoleId });

        // User 一对多 UserRole
        builder.HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Role 一对多 UserRole
        builder.HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        // 索引优化查询
        builder.HasIndex(ur => ur.UserId);
        builder.HasIndex(ur => ur.RoleId);
    }
}

// 5. 在 DbContext 中注册配置
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.ApplyConfiguration(new UserRoleConfiguration());
    // 或者自动扫描
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
}`,
            codeLanguage: "csharp",
            codeTitle: "多对多关系建模",
            checkpoints: [
              "UserRole 连接实体已创建，包含 UserId、RoleId、AssignedAt、IsActive",
              "Role 实体已定义，包含 Name、Code、Description",
              "User 和 Role 都有 UserRoles 导航属性",
              "UserRoleConfiguration 配置了 HasOne/WithMany 关系",
              "使用联合主键 (UserId, RoleId)",
              "配置了级联删除 DeleteBehavior.Cascade",
              "创建了索引优化查询性能",
            ],
            reference: `为什么用显式连接实体：1) 可以添加 AssignedAt、IsActive 等业务字段；2) 更灵活的查询和过滤；3) 便于审计和历史记录。EF Core 也支持无连接实体的多对多（skip navigation），但大多数业务场景需要额外字段。`,
          },
          {
            title: "实现 Group 树形结构（自引用 + Organization）",
            content: (
              <div>
                <p>创建 Group 实体的自引用关系，支持树形层级结构和组织归属。</p>
              </div>
            ),
            code: `// 1. 定义 Group 实体
public class Group : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ParentId { get; set; }           // 父群组 ID
    public string? OrganizationId { get; set; }     // 所属组织 ID
    public bool IsOrganization { get; set; }        // 是否是组织根节点
    public bool IsActive { get; set; } = true;

    // 导航属性 — 自引用树结构
    public Group? Parent { get; set; }
    public List<Group> Children { get; set; } = new();
    public Group? Organization { get; set; }

    // 成员关系
    public List<GroupMember> Members { get; set; } = new();

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

// 2. 定义 GroupMember 连接实体
public class GroupMember : BaseEntity
{
    public string GroupId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public MemberRole Role { get; set; } = MemberRole.Member;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public Group Group { get; set; } = null!;
    public User User { get; set; } = null!;

    public override void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

public enum MemberRole
{
    Owner,
    Admin,
    Member
}

// 3. 配置自引用关系
public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        // 父子关系（自引用）
        builder.HasOne(g => g.Parent)
            .WithMany(g => g.Children)
            .HasForeignKey(g => g.ParentId)
            .OnDelete(DeleteBehavior.Restrict); // 防止级联删除破坏树结构

        // 组织关系
        builder.HasOne(g => g.Organization)
            .WithMany()
            .HasForeignKey(g => g.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(g => g.ParentId);
        builder.HasIndex(g => g.OrganizationId);
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "树形结构建模",
            checkpoints: [
              "Group 实体包含 ParentId 和 OrganizationId",
              "定义了 Parent、Children、Organization 导航属性",
              "GroupMember 连接实体包含 Role、JoinedAt",
              "GroupConfiguration 配置了自引用关系",
              "父子关系使用 DeleteBehavior.Restrict 防止误删",
              "组织关系使用 DeleteBehavior.SetNull",
              "理解为什么不用 Cascade（会破坏树的完整性）",
            ],
            reference: `自引用关系的删除策略很关键：Cascade 会导致删除父节点时连带删除所有子节点，这通常不是期望的行为。Restrict 要求手动处理子节点，更安全。树形查询时需要递归或多次 Include 来加载整棵树。`,
          },
          {
            title: "编写 GetAllAsync 的分页 + 搜索 + 排序 + 投影",
            content: (
              <div>
                <p>实现一个完整的用户列表查询，包含搜索、排序、分页和 DTO 投影。</p>
              </div>
            ),
            code: `// 1. 定义分页结果 DTO
public class PagedResult<T>
{
    public List<T> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(Total / (double)PageSize);
}

// 2. 定义 UserDto
public record UserDto(
    string Id,
    string Username,
    string Email,
    string? Nickname,
    string DisplayName,
    List<RoleDto> Roles,
    DateTime CreatedAt
);

public record RoleDto(
    string Name,
    string Code
);

// 3. 实现 GetAllAsync 方法
public async Task<PagedResult<UserDto>> GetAllAsync(
    int page = 1,
    int pageSize = 20,
    string? search = null,
    string? sortBy = "CreatedAt",
    bool ascending = false)
{
    // 构建查询
    var query = _context.Users.AsQueryable();

    // 搜索过滤
    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(u =>
            u.Username.Contains(search) ||
            u.Email.Contains(search) ||
            (u.Nickname != null && u.Nickname.Contains(search)));
    }

    // 计算总数
    var total = await query.CountAsync();

    // 排序
    query = sortBy switch
    {
        "Username" => ascending
            ? query.OrderBy(u => u.Username)
            : query.OrderByDescending(u => u.Username),
        "Email" => ascending
            ? query.OrderBy(u => u.Email)
            : query.OrderByDescending(u => u.Email),
        "CreatedAt" => ascending
            ? query.OrderBy(u => u.CreatedAt)
            : query.OrderByDescending(u => u.CreatedAt),
        _ => query.OrderByDescending(u => u.CreatedAt)
    };

    // 分页 + 投影
    var users = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(u => new UserDto(
            u.Id,
            u.Username,
            u.Email,
            u.Nickname,
            u.Nickname ?? u.Username,
            u.UserRoles
                .Where(ur => ur.IsActive)
                .Select(ur => new RoleDto(ur.Role.Name, ur.Role.Code))
                .ToList(),
            u.CreatedAt
        ))
        .AsNoTracking()  // 只读查询，不追踪
        .ToListAsync();

    return new PagedResult<UserDto>
    {
        Data = users,
        Total = total,
        Page = page,
        PageSize = pageSize
    };
}`,
            codeLanguage: "csharp",
            codeTitle: "分页查询实现",
            checkpoints: [
              "实现了 PagedResult<T> 泛型分页结果",
              "UserDto 和 RoleDto 使用 record 定义",
              "搜索支持 Username、Email、Nickname 多字段",
              "排序支持多个字段且支持升序/降序",
              "使用 Skip/Take 实现分页",
              "使用 Select 投影到 DTO，只查询需要的字段",
              "使用 AsNoTracking() 优化只读查询",
              "在 Select 中直接过滤 IsActive 角色",
            ],
            reference: `查询优化要点：1) Select 投影只查询需要的字段，减少数据传输；2) AsNoTracking() 避免追踪开销；3) 在数据库层面过滤（Where in Select）而非内存过滤；4) CountAsync() 在分页前执行，获取准确总数。`,
          },
          {
            title: "用 Include/ThenInclude 预加载群组树，避免 N+1",
            content: (
              <div>
                <p>实现群组树的查询，预加载所有关联数据，避免 N+1 查询问题。</p>
              </div>
            ),
            code: `// 场景：获取群组详情，包含成员和子群组
public async Task<Group?> GetGroupWithDetailsAsync(string groupId)
{
    return await _context.Groups
        .Include(g => g.Members)           // 预加载成员
            .ThenInclude(gm => gm.User)    // 预加载成员的用户信息
        .Include(g => g.Children)          // 预加载子群组
        .Include(g => g.Parent)            // 预加载父群组
        .Include(g => g.Organization)      // 预加载所属组织
        .FirstOrDefaultAsync(g => g.Id == groupId);
}

// 场景：获取某个用户所在的所有群组
public async Task<List<GroupDto>> GetUserGroupsAsync(string userId)
{
    return await _context.GroupMembers
        .Where(gm => gm.UserId == userId && gm.IsActive)
        .Include(gm => gm.Group)           // 预加载群组
            .ThenInclude(g => g.Parent)    // 预加载父群组
        .Select(gm => new GroupDto(
            gm.Group.Id,
            gm.Group.Name,
            gm.Group.Description,
            gm.Group.Parent != null ? gm.Group.Parent.Name : null,
            gm.Role.ToString(),
            gm.JoinedAt
        ))
        .AsNoTracking()
        .ToListAsync();
}

// 场景：获取完整的群组树（递归加载）
public async Task<List<Group>> GetGroupTreeAsync(string? parentId = null)
{
    var query = _context.Groups
        .Include(g => g.Members)
            .ThenInclude(gm => gm.User)
        .Where(g => g.ParentId == parentId);

    var groups = await query.ToListAsync();

    // 递归加载子节点（或使用多次查询拼装）
    foreach (var group in groups)
    {
        group.Children = await GetGroupTreeAsync(group.Id);
    }

    return groups;
}

// 更优的树查询：一次性加载所有节点，内存中组装树
public async Task<List<Group>> GetCompleteTreeAsync()
{
    // 一次性加载所有群组
    var allGroups = await _context.Groups
        .Include(g => g.Members)
            .ThenInclude(gm => gm.User)
        .ToListAsync();

    // 构建字典
    var groupDict = allGroups.ToDictionary(g => g.Id);

    // 组装树结构
    var rootGroups = new List<Group>();
    foreach (var group in allGroups)
    {
        if (group.ParentId == null)
        {
            rootGroups.Add(group);
        }
        else if (groupDict.TryGetValue(group.ParentId, out var parent))
        {
            parent.Children.Add(group);
        }
    }

    return rootGroups;
}`,
            codeLanguage: "csharp",
            codeTitle: "预加载关系数据",
            checkpoints: [
              "使用 Include 预加载一对多关系（Members）",
              "使用 ThenInclude 预加载更深层关系（User）",
              "理解递归查询的 N+1 问题",
              "掌握一次性加载 + 内存组装的优化方案",
              "对比两种树查询方式的性能差异",
              "测试查询，确认没有额外的 SQL 语句（查看日志）",
            ],
            reference: `N+1 问题：查询 N 个群组，每个群组再查询成员，总共 N+1 次查询。解决方案：1) Include 预加载；2) 一次性查询所有数据，内存组装。对于树结构，方案2通常更高效，尤其是深度不确定时。启用 SQL 日志可以观察实际执行的查询。`,
          },
          {
            title: "对只读列表接口加上 AsNoTracking() 优化",
            content: (
              <div>
                <p>识别只读查询场景，添加 AsNoTracking() 避免不必要的追踪开销。</p>
              </div>
            ),
            code: `// ❌ 错误：列表查询没有 AsNoTracking()
public async Task<List<UserDto>> GetAllUsersAsync()
{
    return await _context.Users
        .Select(u => new UserDto(u.Id, u.Username, u.Email))
        .ToListAsync();  // 追踪了所有用户实体，浪费内存
}

// ✅ 正确：列表查询加 AsNoTracking()
public async Task<List<UserDto>> GetAllUsersAsync()
{
    return await _context.Users
        .AsNoTracking()  // 不追踪实体变化
        .Select(u => new UserDto(u.Id, u.Username, u.Email))
        .ToListAsync();
}

// 场景对比
public class UserService
{
    // 场景1：只读列表 — 用 AsNoTracking + Select
    public async Task<List<UserDto>> GetUserListAsync()
    {
        return await _context.Users
            .AsNoTracking()
            .Select(u => new UserDto(u.Id, u.Username, u.Email))
            .ToListAsync();
    }

    // 场景2：查询后修改 — 需要追踪
    public async Task<User> UpdateUserAsync(string id, string newUsername)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);  // 默认追踪

        if (user == null) throw new NotFoundException();

        user.Username = newUsername;
        user.Touch();

        await _context.SaveChangesAsync();  // ChangeTracker 检测到修改
        return user;
    }

    // 场景3：只检查存在性 — 用 AnyAsync，不加载实体
    public async Task<bool> IsUsernameExistsAsync(string username)
    {
        return await _context.Users
            .AnyAsync(u => u.Username == username);  // 翻译成 EXISTS
    }

    // 场景4：按 ID 批量查询 — 用 Where + Contains
    public async Task<List<User>> GetUsersByIdsAsync(List<string> ids)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => ids.Contains(u.Id))  // 翻译成 IN
            .ToListAsync();
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "AsNoTracking 使用场景",
            checkpoints: [
              "识别只读查询场景（列表、详情展示、统计）",
              "为所有只读查询添加 AsNoTracking()",
              "理解追踪 vs 不追踪的性能差异",
              "掌握 AnyAsync、CountAsync 等不加载实体的查询",
              "理解 Contains 翻译成 IN 查询",
              "对比修改场景和只读场景的查询写法",
            ],
            reference: `AsNoTracking() 的性能提升：1) 不创建快照，节省内存；2) 不监听属性变化，节省 CPU；3) 查询速度提升 20-40%。何时不用：需要修改实体并 SaveChanges。记忆法则：只要不改实体，就加 AsNoTracking()。`,
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 完成！你已经掌握了 EF Core 的关系建模和高效查询策略。
            </p>
            <p>
              <strong>💡 核心要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                多对多关系推荐显式连接实体（可添加 AssignedAt、IsActive 等字段）
              </li>
              <li>
                自引用关系用 Restrict 删除策略，防止级联删除破坏树结构
              </li>
              <li>
                列表查询优先用 AsNoTracking() + Select 投影，只取需要的字段
              </li>
              <li>
                Include/ThenInclude 预加载关系数据，避免 N+1 查询
              </li>
              <li>
                树形结构可以一次性查询 + 内存组装，避免递归查询的性能问题
              </li>
              <li>
                查询策略：只读用 AsNoTracking + Select，修改用 tracking + Include
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 下一步：</strong>学习 EF Core 的事务、乐观锁、批量操作等高级特性。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
