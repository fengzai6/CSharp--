import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
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
        学完本节后，你应该能用 EF Core 建模 TaskHub
        的项目成员、任务指派和评论关系，并知道什么时候用 <code>Include</code>{" "}
        加载实体图、什么时候用 <code>Select</code> 投影 DTO、什么时候加{" "}
        <code>AsNoTracking()</code>。
      </p>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          上一节已经创建了 <code>TaskHubDbContext</code>{" "}
          和核心实体。本节继续补齐关系：<code>Project</code> 通过{" "}
          <code>ProjectMember</code> 管理成员，<code>WorkItem</code>{" "}
          可以指派给用户并包含评论。
        </p>
      </TeacherTask>

      <h3>一对多：Project 与 WorkItem</h3>
      <p>
        一个项目有多条任务，任务必须属于一个项目。这是 TaskHub
        最核心的一对多关系。
      </p>
      <p>
        两套东西一起出现：<strong>导航属性</strong>（C# 对象图）和{" "}
        <strong>外键字段</strong>（表上的列）。
        <code>WorkItem.Project</code> 方便写代码跳转；
        <code>WorkItem.ProjectId</code> 才是库里真正的 FK。
        TypeORM 的 <code>@ManyToOne</code> + <code>@JoinColumn</code> 是同一回事，只是 EF 更常把配置写在 Fluent API 里。
      </p>

      <LessonCode
        code={`public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ArchivedAt { get; set; }

    // 导航：一侧的集合（默认不自动加载，见 Include / 投影）
    public List<WorkItem> WorkItems { get; set; } = new();
    public List<ProjectMember> Members { get; set; } = new();
}

public class WorkItem : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty; // 外键列
    public string Title { get; set; } = string.Empty;
    public WorkItemStatus Status { get; set; } = WorkItemStatus.Todo;

    public Project Project { get; set; } = null!; // 导航：多对一
}

// IEntityTypeConfiguration<T>：把关系配置从实体类上拆出去
public class WorkItemConfiguration : IEntityTypeConfiguration<WorkItem>
{
    public void Configure(EntityTypeBuilder<WorkItem> builder)
    {
        // HasOne + WithMany + HasForeignKey = 多对一 / 一对多
        builder.HasOne(item => item.Project)
            .WithMany(project => project.WorkItems)
            .HasForeignKey(item => item.ProjectId)
            .OnDelete(DeleteBehavior.Cascade); // 删项目时级联删任务

        // 复合索引：列表常按项目 + 状态筛
        builder.HasIndex(item => new { item.ProjectId, item.Status });
    }
}`}
        language="csharp"
        title="Project → WorkItem"
      />
      <LessonTable
        headers={["API", "意思"]}
        rows={[
          ["HasOne / WithMany", "多端有一个父；父端有多个子"],
          ["HasForeignKey", "指定 FK 属性（ProjectId）"],
          ["OnDelete(Cascade)", "删父时级联删子（按业务选 Restrict / SetNull）"],
          ["HasIndex", "建索引，加速查询，不改变关系语义"],
          ["null!", "告诉编译器「保存/查询后会有值」；不是运行时魔法"],
        ]}
      />

      <h3>多对多：ProjectMember 连接实体</h3>
      <p>
        项目和用户是多对多关系，但成员关系有 <code>Role</code>、
        <code>JoinedAt</code>、<code>IsActive</code>{" "}
        等业务字段，所以要显式建连接实体，而不是使用 skip navigation。
      </p>

      <LessonQuote>
        这里为了复用审计字段让 <code>ProjectMember</code> 继承了{" "}
        <code>BaseEntity</code>，但 EF 配置里真正用于唯一标识成员关系的是{" "}
        <code>ProjectId + UserId</code>
        。如果你不想让学习者混淆，也可以在真实项目里把成员关系单独建成不继承{" "}
        <code>BaseEntity</code> 的组合主键实体。
      </LessonQuote>

      <LessonCode
        code={`public class ProjectMember : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public ProjectRole Role { get; set; } = ProjectRole.Member;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class ProjectMemberConfiguration : IEntityTypeConfiguration<ProjectMember>
{
    public void Configure(EntityTypeBuilder<ProjectMember> builder)
    {
        builder.HasKey(member => new { member.ProjectId, member.UserId });

        builder.HasOne(member => member.Project)
            .WithMany(project => project.Members)
            .HasForeignKey(member => member.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(member => member.User)
            .WithMany(user => user.ProjectMembers)
            .HasForeignKey(member => member.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(member => member.UserId);
    }
}`}
        language="csharp"
        title="ProjectMember 连接实体"
      />

      <LessonQuote>
        关键差异：EF Core 支持不带额外字段的多对多 skip
        navigation。但项目成员关系通常需要角色、加入时间、是否停用等字段，所以
        TaskHub 主线使用显式连接实体。
      </LessonQuote>

      <h3>任务指派与评论</h3>
      <p>
        任务可以没有指派人，所以 <code>AssigneeId</code>{" "}
        是可空外键；评论必须属于一条任务和一个作者。
      </p>

      <LessonCode
        code={`public class WorkItem : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty;
    public string? AssigneeId { get; set; }
    public DateTime? DueDate { get; set; }

    public User? Assignee { get; set; }
    public List<WorkItemComment> Comments { get; set; } = new();
}

public class WorkItemComment : BaseEntity
{
    public string WorkItemId { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    public WorkItem WorkItem { get; set; } = null!;
    public User Author { get; set; } = null!;
}

public class WorkItemCommentConfiguration : IEntityTypeConfiguration<WorkItemComment>
{
    public void Configure(EntityTypeBuilder<WorkItemComment> builder)
    {
        builder.HasOne(comment => comment.WorkItem)
            .WithMany(item => item.Comments)
            .HasForeignKey(comment => comment.WorkItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(comment => comment.Author)
            .WithMany(user => user.Comments)
            .HasForeignKey(comment => comment.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}`}
        language="csharp"
        title="任务指派与评论关系"
      />

      <h3>查询：Include 与投影</h3>
      <p>
        访问关系数据有两种常见方式：加载实体图（
        <code>Include / ThenInclude</code>）和投影 DTO（<code>Select</code>
        ）。要修改实体时用 tracking 查询；只返回接口数据时优先投影。
      </p>

      <LessonCode
        code={`// 方式一：加载完整实体图，适合后续修改实体并 SaveChanges
var project = await _context.Projects
    .Include(project => project.Members)
        .ThenInclude(member => member.User)
    .FirstOrDefaultAsync(project => project.Id == projectId);

// 方式二：直接投影 DTO，适合列表接口和只读接口
var items = await _context.WorkItems
    .AsNoTracking()
    .Where(item => item.ProjectId == projectId)
    .Select(item => new WorkItemSummaryDto(
        item.Id,
        item.ProjectId,
        item.Title,
        item.Status,
        item.Assignee == null ? null : item.Assignee.Username,
        item.DueDate))
    .ToListAsync();`}
        language="csharp"
        title="Include vs 投影"
      />

      <LessonTable
        headers={["场景", "策略", "原因"]}
        rows={[
          [
            "任务列表 / 只读接口",
            "AsNoTracking() + Select 投影",
            "只取需要字段，不承担追踪开销",
          ],
          [
            "加载后要修改任务",
            "tracking 查询 + 必要 Include",
            "需要 Change Tracker 算出变更",
          ],
          ["判断成员是否存在", "AnyAsync()", "翻译成 EXISTS，不加载实体"],
          [
            "按一批任务 id 查询",
            "Where(item => ids.Contains(item.Id))",
            "翻译成 IN",
          ],
        ]}
      />

      <h3>分页查询示例</h3>
      <p>
        任务列表接口的典型写法：搜索条件、<code>CountAsync</code> 取总数、
        <code>Skip / Take</code> 分页、<code>Select</code> 投影成 DTO。
      </p>

      <LessonCode
        code={`public async Task<PagedResult<WorkItemSummaryDto>> GetProjectWorkItemsAsync(
    string projectId,
    int page = 1,
    int pageSize = 20,
    WorkItemStatus? status = null,
    string? search = null)
{
    var query = _context.WorkItems
        .AsNoTracking()
        .Where(item => item.ProjectId == projectId);

    if (status is not null)
        query = query.Where(item => item.Status == status);

    if (!string.IsNullOrWhiteSpace(search))
        query = query.Where(item => item.Title.Contains(search));

    var total = await query.CountAsync();

    var items = await query
        .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(item => new WorkItemSummaryDto(
            item.Id,
            item.ProjectId,
            item.Title,
            item.Status,
            item.Assignee == null ? null : item.Assignee.Username,
            item.DueDate))
        .ToListAsync();

    return new PagedResult<WorkItemSummaryDto>(items, total, page);
}`}
        language="csharp"
        title="任务列表分页 + 搜索 + 投影"
      />

      <h3>RefreshToken 实体</h3>
      <p>
        认证章节需要 Refresh Token 持久化。这里先补实体和配置，Auth 章节直接复用{" "}
        <code>TaskHubDbContext</code> 即可。
      </p>

      <LessonCode
        code={`public class RefreshToken : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt is not null;
    public bool IsActive => !IsExpired && !IsRevoked;

    public User User { get; set; } = null!;
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasIndex(token => token.TokenHash).IsUnique();

        builder.HasOne(token => token.User)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}`}
        language="csharp"
        title="RefreshToken"
      />

      <LessonQuote>
        只存 <code>TokenHash</code> 哈希值，不存明文。轮换时通过{" "}
        <code>RevokedAt</code> 标记撤销，不物理删除。
      </LessonQuote>

      <h3>避免 N+1 查询</h3>
      <p>
        关系数据没有预加载时，遍历集合可能触发逐条查询（N+1）。列表接口优先用投影；详情页确实要实体图时再用{" "}
        <code>Include</code>。
      </p>

      <LessonCode
        code={`// 获取任务详情，包含指派人和最近评论
var item = await _context.WorkItems
    .Include(item => item.Assignee)
    .Include(item => item.Comments.OrderByDescending(comment => comment.CreatedAt).Take(20))
        .ThenInclude(comment => comment.Author)
    .FirstOrDefaultAsync(item => item.Id == workItemId);`}
        language="csharp"
        title="预加载任务详情"
      />

      <h3>常见误区</h3>
      <ul>
        <li>
          查询列表接口时直接 <code>Include</code>{" "}
          一整棵对象图，把不需要的数据全拉回来。
        </li>
        <li>
          只读查询忘记 <code>AsNoTracking()</code>。
        </li>
        <li>
          项目成员这种带业务字段的多对多关系使用 skip
          navigation，后续无法记录角色和加入时间。
        </li>
      </ul>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能建模 <code>ProjectMember</code>
            、任务指派和评论关系，并能按场景选择 <code>Include</code> 或 DTO
            投影查询。
          </p>
        }
        id="ef-relationships-main"
        title="完成 TaskHub 关系建模与查询策略"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>
          查询 DTO 时为什么优先用 <code>Select</code> 投影？
        </li>
        <li>
          <code>Include</code> 适合什么场景，不适合什么场景？
        </li>
        <li>为什么项目成员关系推荐显式中间实体而不是 skip navigation？</li>
      </ul>

      <h3>写入 TaskHub.Infrastructure — 关系配置</h3>
      <p>
        上面的 <code>IEntityTypeConfiguration&lt;T&gt;</code> 配置类要落盘到{" "}
        <code>TaskHub.Infrastructure</code>，
        <code>ApplyConfigurationsFromAssembly</code> 才能自动发现并加载它们。
      </p>

      <LessonCode
        code={`# 创建目录
mkdir -p TaskHub.Infrastructure/Data/Configurations`}
        language="bash"
        title="创建 Configurations 目录"
      />

      <p>
        每个配置文件放在 <code>Data/Configurations/</code> 下，命名空间为{" "}
        <code>TaskHub.Infrastructure.Data.Configurations</code>。 注意{" "}
        <code>ProjectMemberConfiguration</code> 用 <code>HasKey</code> 指定了{" "}
        <code>ProjectId + UserId</code> 联合主键，这会覆盖{" "}
        <code>BaseEntity</code> 继承来的 <code>Id</code> 作为主键。
        <code>Id</code> 字段仍然存在（用于审计），但数据库主键是联合主键。
      </p>

      <h4>Data/Configurations/WorkItemConfiguration.cs</h4>
      <LessonCode
        code={`using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Infrastructure.Data.Configurations;

public class WorkItemConfiguration : IEntityTypeConfiguration<WorkItem>
{
    public void Configure(EntityTypeBuilder<WorkItem> builder)
    {
        builder.HasOne(item => item.Project)
            .WithMany(project => project.WorkItems)
            .HasForeignKey(item => item.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(item => new { item.ProjectId, item.Status });
    }
}`}
        language="csharp"
        title="Data/Configurations/WorkItemConfiguration.cs"
      />

      <h4>Data/Configurations/ProjectMemberConfiguration.cs</h4>
      <LessonCode
        code={`using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Infrastructure.Data.Configurations;

public class ProjectMemberConfiguration : IEntityTypeConfiguration<ProjectMember>
{
    public void Configure(EntityTypeBuilder<ProjectMember> builder)
    {
        builder.HasKey(member => new { member.ProjectId, member.UserId });

        builder.HasOne(member => member.Project)
            .WithMany(project => project.Members)
            .HasForeignKey(member => member.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(member => member.User)
            .WithMany(user => user.ProjectMembers)
            .HasForeignKey(member => member.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(member => member.UserId);
    }
}`}
        language="csharp"
        title="Data/Configurations/ProjectMemberConfiguration.cs"
      />

      <h4>Data/Configurations/WorkItemCommentConfiguration.cs</h4>
      <LessonCode
        code={`using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Infrastructure.Data.Configurations;

public class WorkItemCommentConfiguration : IEntityTypeConfiguration<WorkItemComment>
{
    public void Configure(EntityTypeBuilder<WorkItemComment> builder)
    {
        builder.HasOne(comment => comment.WorkItem)
            .WithMany(item => item.Comments)
            .HasForeignKey(comment => comment.WorkItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(comment => comment.Author)
            .WithMany(user => user.Comments)
            .HasForeignKey(comment => comment.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}`}
        language="csharp"
        title="Data/Configurations/WorkItemCommentConfiguration.cs"
      />

      <h4>Data/Configurations/RefreshTokenConfiguration.cs</h4>
      <LessonCode
        code={`using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskHub.Infrastructure.Models;

namespace TaskHub.Infrastructure.Data.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasIndex(token => token.TokenHash).IsUnique();

        builder.HasOne(token => token.User)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}`}
        language="csharp"
        title="Data/Configurations/RefreshTokenConfiguration.cs"
      />

      <p>
        写完运行 <code>dotnet build TaskHub.Api</code> 确认编译通过。
        如果编译失败，先检查：每个文件的 <code>namespace</code> 是否为{" "}
        <code>TaskHub.Infrastructure.Data.Configurations</code>、是否写了{" "}
        <code>using Microsoft.EntityFrameworkCore.Metadata.Builders;</code>（
        <code>EntityTypeBuilder</code> 来自这里）。
      </p>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已创建 <code>Data/Configurations/</code> 目录，写入{" "}
            <code>WorkItemConfiguration</code>、
            <code>ProjectMemberConfiguration</code>、
            <code>WorkItemCommentConfiguration</code>、
            <code>RefreshTokenConfiguration</code> 四个配置类，
            <code>dotnet build TaskHub.Api</code> 编译通过。
          </p>
        }
        id="ef-relationships-write-configs"
        title="将关系配置写入 TaskHub.Infrastructure"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
