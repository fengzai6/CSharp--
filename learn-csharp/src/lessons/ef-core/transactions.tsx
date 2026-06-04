import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const EfTransactionsLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
  return (
    <LessonShell>
      <h3>本章你要掌握什么</h3>
      <p>
        学完本节后，你应该能用 EF Core 写事务、悲观锁、软删除和批量操作，
        知道什么时候用 <code>ExecuteUpdateAsync()</code> /{" "}
        <code>ExecuteDeleteAsync()</code> 替代"循环逐条 SaveChanges"，
        并能创建和应用迁移。
      </p>

      <TeacherTask title="老师提示">
        <p>
          一个高频反模式是在循环里逐条 <code>SaveChangesAsync()</code>，
          每次都往返一次数据库。能用批量操作就批量，能在一个事务里完成的就别拆开。
          这两点直接决定写入路径的性能。
        </p>
      </TeacherTask>

      <h3>基本事务</h3>
      <p>
        用 <code>Database.BeginTransactionAsync()</code> 开事务，
        成功 <code>CommitAsync()</code>，异常 <code>RollbackAsync()</code>。
        对应 TypeORM 的 <code>manager.transaction()</code>。
      </p>

      <LessonCode
        code={`public async Task UpdateUserRolesAsync(string userId, List<string> roleCodes)
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
}`}
        language="csharp"
        title="基本事务"
      />

      <h3>悲观锁</h3>
      <p>
        需要在事务内独占某行时，用 <code>FromSqlRaw</code> 加{" "}
        <code>FOR UPDATE</code> 锁定行，对应 TypeORM 的{" "}
        <code>lock: {`{ mode: 'pessimistic_write' }`}</code>。
      </p>

      <LessonCode
        code={`public async Task SetGroupLeaderAsync(string groupId, string userId)
{
    await using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        // 锁定 Group 行 — 对应 lock: { mode: 'pessimistic_write' }
        var group = await _context.Groups
            .FromSqlRaw("SELECT * FROM \\"groups\\" WHERE id = {0} FOR UPDATE", groupId)
            .FirstOrDefaultAsync();

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
}`}
        language="csharp"
        title="悲观锁"
      />

      <h3>软删除</h3>
      <p>
        EF Core 没有内置软删除，常见做法是标记字段 + 全局查询过滤器：
        删除时只改 <code>IsActive</code> / <code>DeletedAt</code>，
        查询时被过滤器自动排除。
      </p>

      <LessonCode
        code={`public async Task DeleteSoftAsync(string id)
{
    var user = await _context.Users.FindAsync(id);
    if (user == null)
        throw new NotFoundException("User not found");

    user.IsActive = false;
    user.DeletedAt = DateTime.UtcNow;
    user.Touch();

    await _context.SaveChangesAsync();
}`}
        language="csharp"
        title="软删除"
      />

      <LessonQuote>
        关键差异：TypeORM 有 <code>softRemove()</code> 方法。EF Core
        没有内置软删除，但通过全局查询过滤器 + 手动标记实现，更透明。注意后台管理或恢复场景需要用{" "}
        <code>IgnoreQueryFilters()</code> 忽略过滤器。
      </LessonQuote>

      <h3>批量操作（替代循环逐个更新）</h3>
      <p>
        <code>ExecuteDeleteAsync()</code> / <code>ExecuteUpdateAsync()</code>{" "}
        直接翻译成一条 SQL，不需要先加载实体，适合大批量写入；
        <code>AddRangeAsync</code> 批量插入。
      </p>

      <LessonCode
        code={`// 批量删除
await _context.Users.Where(u => ids.Contains(u.Id)).ExecuteDeleteAsync();

// 批量更新
await _context.Users
    .Where(u => ids.Contains(u.Id))
    .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, false)
                            .SetProperty(u => u.UpdatedAt, DateTime.UtcNow));

// 批量插入
await _context.Users.AddRangeAsync(usersToCreate);
await _context.SaveChangesAsync();

// TS 开发者对照：这替代了循环 save 操作
// NestJS: for (const item of items) { await repo.save(item); }
// EF Core: await repo.AddRangeAsync(items); await repo.SaveChangesAsync();`}
        language="csharp"
        title="批量操作"
      />

      <TeacherTask title="实战价值">
        <p>
          像 <code>GroupsService</code> 的 <code>addGroupMembers</code>{" "}
          批量添加成员这种场景，用批量操作可以大幅减少数据库往返次数。
          注意 <code>ExecuteUpdateAsync</code> 不经过 Change Tracker，
          也不会触发实体上的业务逻辑（如 <code>Touch()</code>），所以要在表达式里显式设置{" "}
          <code>UpdatedAt</code>。
        </p>
      </TeacherTask>

      <h4>批量更新 vs 加载后修改</h4>
      <LessonTable
        headers={["维度", "ExecuteUpdateAsync()", "加载实体后修改"]}
        rows={[
          ["是否加载实体", "否", "是"],
          ["是否走 Change Tracker", "否", "是"],
          ["数据库往返", "一条 SQL", "查询 + 更新"],
          ["适用场景", "大批量、不需要业务逻辑", "需要校验或触发实体逻辑"],
        ]}
      />

      <h3>性能优化</h3>
      <p>
        只读用 <code>AsNoTracking()</code>，只取需要的字段用投影，
        预加载避免 N+1，性能敏感场景可用 <code>FromSqlRaw</code> 原生 SQL。
      </p>

      <LessonCode
        code={`// 只读查询 — 禁用变更追踪，提升性能
var users = await _context.Users
    .AsNoTracking()
    .ToListAsync();

// 只读取需要的字段 — 投影
var userNames = await _context.Users
    .AsNoTracking()
    .Select(u => u.Username)
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
    .ToListAsync();`}
        language="csharp"
        title="性能优化"
      />

      <h3>迁移</h3>
      <p>
        改完模型后用 <code>migrations add</code> 生成迁移，
        <code>database update</code> 应用，必要时回滚到指定迁移。
      </p>

      <LessonCode
        code={`# 创建迁移
dotnet ef migrations add AddUsersAndRolesTables

# 应用迁移到数据库
dotnet ef database update

# 回滚迁移
dotnet ef database update 0      # 回滚到初始状态
dotnet ef database update AddUsersAndRolesTables  # 回滚到指定迁移`}
        language="bash"
        title="迁移命令"
      />

      <h3>常见误区</h3>
      <ul>
        <li>在循环里逐条 <code>SaveChangesAsync()</code>，每次往返一次数据库。</li>
        <li>需要原子性的多步写入没有放进同一个事务。</li>
        <li>用了全局软删除过滤器，却忘记后台管理或恢复场景要 <code>IgnoreQueryFilters()</code>。</li>
      </ul>

      <h3>阶段验收问题</h3>
      <ul>
        <li><code>ExecuteUpdateAsync()</code> 和加载实体后修改有什么区别？</li>
        <li>悲观锁在 EF Core 里怎么实现？对应 TypeORM 的什么写法？</li>
        <li>软删除用全局过滤器时有哪些边界情况？</li>
      </ul>

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="ef-transactions-checklist"
        items={[
          "实现 UpdateUserRolesAsync 的事务操作（替换角色）",
          "实现 SetGroupLeaderAsync 的悲观锁",
          "添加全局软删除过滤器，并验证恢复场景用 IgnoreQueryFilters",
          "用 ExecuteUpdateAsync 批量更新一批用户状态，替代循环 save",
          "创建 Migration 并应用到数据库，再回滚到指定迁移",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
