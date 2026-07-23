import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const EfTransactionsLesson = ({
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
        学完本节后，你应该能在 TaskHub 中处理多步骤一致性操作：任务状态流转、批量关闭任务、项目归档、乐观并发、软删除和迁移脚本。重点是知道什么时候用事务，什么时候用 <code>ExecuteUpdateAsync()</code> 替代循环逐条 <code>SaveChangesAsync()</code>。
      </p>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          现在 TaskHub 已经有项目、成员、任务和评论关系。本节把写入路径补完整：任务状态变更需要记录操作日志，项目归档需要同时关闭未完成任务，批量更新要减少数据库往返。
        </p>
      </TeacherTask>

      <h3>基本事务：任务状态流转</h3>
      <p>
        状态流转通常不只是改一个字段，还要校验成员权限、更新任务、写入操作记录。这类多步写入应放进同一个事务。
      </p>
      <p>
        对照：TypeORM 的 <code>manager.transaction(...)</code>、Prisma 的{" "}
        <code>$transaction</code>。EF 里{" "}
        <code>BeginTransactionAsync</code> 打开数据库事务；
        <code>SaveChangesAsync</code> 只是把 Change Tracker 里的变更写成 SQL，
        <strong>还要</strong> <code>CommitAsync</code> 才真正提交事务。
        一步失败就 <code>RollbackAsync</code>，避免「任务改了、评论没写上」的半成功状态。
      </p>

      <LessonCode
        code={`public async Task<WorkItemSummaryDto> MoveWorkItemAsync(
    string workItemId,
    WorkItemStatus nextStatus,
    string operatorId)
{
    // await using：事务结束时自动 Dispose（类似 using + await）
    await using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        var item = await _context.WorkItems
            .Include(item => item.Project)
            .FirstOrDefaultAsync(item => item.Id == workItemId);

        if (item is null)
            throw new KeyNotFoundException("任务不存在");

        var isMember = await _context.ProjectMembers.AnyAsync(member =>
            member.ProjectId == item.ProjectId &&
            member.UserId == operatorId &&
            member.IsActive);

        if (!isMember)
            throw new UnauthorizedAccessException("不是项目成员");

        // 改已追踪实体 → SaveChanges 时生成 UPDATE
        item.Status = nextStatus;
        item.Touch();

        // 同事务内再插一条评论（操作日志）
        _context.WorkItemComments.Add(new WorkItemComment
        {
            WorkItemId = item.Id,
            AuthorId = operatorId,
            Content = $"状态变更为 {nextStatus}"
        });

        await _context.SaveChangesAsync(); // 写出 SQL，但仍在事务中
        await transaction.CommitAsync();   // 提交事务

        return new WorkItemSummaryDto(item.Id, item.ProjectId, item.Title, item.Status, null, item.DueDate);
    }
    catch
    {
        await transaction.RollbackAsync(); // 全部撤回
        throw;
    }
}`}
        language="csharp"
        title="任务状态流转事务"
      />
      <LessonQuote>
        单次 <code>SaveChangesAsync</code> 本身已在一个隐式事务里。
        只有「多次 SaveChanges / 混用原生 SQL / 必须中间读已写入数据」时，才需要显式{" "}
        <code>BeginTransactionAsync</code>。不要给每个简单 INSERT 都套一层事务模板。
      </LessonQuote>

      <h3>悲观锁</h3>
      <p>
        某些冲突频繁的操作可以在事务内锁定一行。例如归档项目时先锁定项目，避免同时有人继续创建任务或重复归档。
      </p>

      <LessonCode
        code={`public async Task ArchiveProjectAsync(string projectId, string operatorId)
{
    await using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        var project = await _context.Projects
            .FromSqlInterpolated($"""SELECT * FROM "Projects" WHERE "Id" = {projectId} FOR UPDATE""")
            .FirstOrDefaultAsync();

        if (project is null)
            throw new KeyNotFoundException("项目不存在");

        var isOwner = await _context.ProjectMembers.AnyAsync(member =>
            member.ProjectId == projectId &&
            member.UserId == operatorId &&
            member.Role == ProjectRole.Owner);

        if (!isOwner)
            throw new UnauthorizedAccessException("只有 Owner 可以归档项目");

        project.ArchivedAt = DateTime.UtcNow;
        project.Touch();

        await _context.WorkItems
            .Where(item => item.ProjectId == projectId && item.Status != WorkItemStatus.Done)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, WorkItemStatus.Archived)
                .SetProperty(item => item.UpdatedAt, DateTime.UtcNow));

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}`}
        language="csharp"
        title="项目归档与悲观锁"
      />

      <LessonQuote>
        <code>FOR UPDATE</code> 是 PostgreSQL / MySQL 常见写法，SQL Server 通常用 <code>WITH (UPDLOCK, ROWLOCK)</code>。课程主线用 PostgreSQL 表达，换数据库时语法要调整。
      </LessonQuote>

      <h3>乐观并发</h3>
      <p>
        普通任务编辑更适合乐观并发：读取时带版本，保存时检查版本。如果别人已经改过，就提示用户刷新后重试。
      </p>

      <LessonCode
        code={`public class WorkItem
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;

    [Timestamp]
    public byte[] RowVersion { get; set; } = [];
}

public async Task RenameWorkItemAsync(string id, string title)
{
    var item = await _context.WorkItems.FirstOrDefaultAsync(item => item.Id == id);
    if (item is null)
        throw new KeyNotFoundException("任务不存在");

    item.Title = title;

    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateConcurrencyException)
    {
        throw new InvalidOperationException("任务已被其他人修改，请刷新后重试");
    }
}`}
        language="csharp"
        title="任务编辑的乐观并发"
      />

      <h3>软删除</h3>
      <p>
        TaskHub 中任务删除通常应可恢复，因此用 <code>DeletedAt</code> 做软删除，再通过全局查询过滤器让普通查询自动排除。
      </p>

      <LessonCode
        code={`public async Task DeleteWorkItemSoftAsync(string id)
{
    var item = await _context.WorkItems.FindAsync(id);
    if (item is null)
        throw new KeyNotFoundException("任务不存在");

    item.DeletedAt = DateTime.UtcNow;
    item.Touch();

    await _context.SaveChangesAsync();
}

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<WorkItem>()
        .HasQueryFilter(item => item.DeletedAt == null);
}`}
        language="csharp"
        title="任务软删除"
      />

      <LessonQuote>
        全局过滤器会影响所有普通查询。后台回收站、恢复任务、审计导出这类场景需要显式使用 <code>IgnoreQueryFilters()</code>。
      </LessonQuote>

      <h3>批量操作</h3>
      <p>
        <code>ExecuteUpdateAsync()</code> / <code>ExecuteDeleteAsync()</code> 直接翻译成 SQL，不加载实体，不走 Change Tracker，适合批量关闭任务、批量归档、批量清理。
      </p>

      <LessonCode
        code={`// 批量关闭某个项目中已过期的任务
await _context.WorkItems
    .Where(item => item.ProjectId == projectId)
    .Where(item => item.DueDate < DateTime.UtcNow)
    .Where(item => item.Status != WorkItemStatus.Done)
    .ExecuteUpdateAsync(setters => setters
        .SetProperty(item => item.Status, WorkItemStatus.Archived)
        .SetProperty(item => item.UpdatedAt, DateTime.UtcNow));

// 批量插入项目成员
await _context.ProjectMembers.AddRangeAsync(membersToAdd);
await _context.SaveChangesAsync();`}
        language="csharp"
        title="批量关闭任务与批量添加成员"
      />

      <TeacherTask title="应用价值">
        <p>
          像批量关闭任务、批量添加项目成员这种场景，用批量操作可以大幅减少数据库往返次数。注意 <code>ExecuteUpdateAsync</code> 不经过 Change Tracker，也不会触发实体上的业务逻辑，所以要在表达式里显式设置 <code>UpdatedAt</code>。
        </p>
      </TeacherTask>

      <LessonTable
        headers={["维度", "ExecuteUpdateAsync()", "加载实体后修改"]}
        rows={[
          ["是否加载实体", "否", "是"],
          ["是否走 Change Tracker", "否", "是"],
          ["数据库往返", "一条 SQL", "查询 + 更新"],
          ["适用场景", "大批量、不需要实体逻辑", "需要校验或触发实体逻辑"],
        ]}
      />

      <h3>迁移</h3>
      <p>
        改完模型后用 <code>migrations add</code> 生成迁移，<code>database update</code> 应用。TaskHub 是多项目结构，命令要明确迁移项目和启动项目。
      </p>

      <LessonCode
        code={`# 创建迁移
dotnet ef migrations add AddProjectMembersAndWorkItems \
    --project TaskHub.Infrastructure \
    --startup-project TaskHub.Api

# 应用迁移到数据库
dotnet ef database update \
    --project TaskHub.Infrastructure \
    --startup-project TaskHub.Api

# 回滚到指定迁移
dotnet ef database update AddTaskHubCoreTables \
    --project TaskHub.Infrastructure \
    --startup-project TaskHub.Api`}
        language="bash"
        title="TaskHub 迁移命令"
      />

      <h4>生产迁移脚本</h4>
      <LessonCode
        code={`dotnet ef migrations script AddTaskHubCoreTables AddProjectMembersAndWorkItems \
    --idempotent \
    --project TaskHub.Infrastructure \
    --startup-project TaskHub.Api \
    -o ./artifacts/taskhub-migrations.sql`}
        language="bash"
        title="生产迁移脚本"
      />

      <h3>常见误区</h3>
      <ul>
        <li>在循环里逐条 <code>SaveChangesAsync()</code>，每次往返一次数据库。</li>
        <li>任务状态变更和操作记录没有放进同一个事务，导致数据不一致。</li>
        <li>用了全局软删除过滤器，却忘记回收站或恢复场景要 <code>IgnoreQueryFilters()</code>。</li>
      </ul>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能把任务状态流转、项目归档和批量关闭任务放到合适的事务与批量操作中，并会为 TaskHub 生成迁移脚本。
          </p>
        }
        id="ef-transactions-main"
        title="完成 TaskHub 事务、批量操作与迁移主线"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li><code>ExecuteUpdateAsync()</code> 和加载实体后修改有什么区别？</li>
        <li>任务状态变更为什么适合放进事务？</li>
        <li>乐观并发和悲观锁分别适合什么场景？</li>
        <li>生产环境为什么更推荐先生成迁移脚本再执行？</li>
        <li>软删除用全局过滤器时有哪些边界情况？</li>
      </ul>

      <LessonStep
        title="实战：TaskHub 事务与迁移"
        steps={[
          {
            title: "实现任务状态流转事务",
            content: <p>在事务中完成成员校验、任务状态更新和操作记录写入。</p>,
            code: `await using var transaction = await _context.Database.BeginTransactionAsync();
// 1. 查询任务
// 2. 校验 ProjectMember
// 3. 更新 WorkItem.Status
// 4. 写入 WorkItemComment 操作记录
await _context.SaveChangesAsync();
await transaction.CommitAsync();`,
            codeLanguage: "csharp",
            codeTitle: "状态流转事务步骤",
            checkpoints: ["开启事务", "校验项目成员", "更新任务状态", "写入操作记录", "提交或回滚"],
          },
          {
            title: "批量关闭过期任务",
            content: <p>使用 <code>ExecuteUpdateAsync</code> 关闭某项目中过期且未完成的任务。</p>,
            code: `await _context.WorkItems
    .Where(item => item.ProjectId == projectId)
    .Where(item => item.DueDate < DateTime.UtcNow)
    .Where(item => item.Status != WorkItemStatus.Done)
    .ExecuteUpdateAsync(setters => setters
        .SetProperty(item => item.Status, WorkItemStatus.Archived)
        .SetProperty(item => item.UpdatedAt, DateTime.UtcNow));`,
            codeLanguage: "csharp",
            codeTitle: "批量关闭任务",
            checkpoints: ["不先 ToListAsync", "不循环 SaveChangesAsync", "显式设置 UpdatedAt"],
          },
        ]}
      />
    </LessonShell>
  );
};
