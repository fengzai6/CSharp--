import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const EfRelationshipsLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
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

      <h3>阶段验收问题</h3>
      <ul>
        <li>查询 DTO 时为什么优先用 <code>Select</code> 投影？</li>
        <li><code>Include</code> 适合什么场景，不适合什么场景？</li>
        <li>为什么权限、成员这类多对多关系推荐显式中间实体而不是 skip navigation？</li>
      </ul>

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="ef-relationships-checklist"
        items={[
          "用 EF Core 建模 User → UserRole → Role 多对多关系",
          "实现 Group 树形结构（自引用 + Organization）",
          "编写 GetAllAsync 的分页 + 搜索 + 排序 + 投影",
          "用 Include/ThenInclude 预加载一棵群组树，避免 N+1",
          "对只读列表接口加上 AsNoTracking() 优化性能",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
