import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const EfTransactionsLesson = () => {
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

      <LessonStep
        title="实战：事务与迁移"
        steps={[
          {
            title: "实现事务操作替换用户角色",
            content: (
              <p>
                实现 <code>UpdateUserRolesAsync</code> 方法，在事务中先删除用户的所有旧角色，再添加新角色，确保操作的原子性。
              </p>
            ),
            code: `public async Task UpdateUserRolesAsync(string userId, List<string> newRoleIds)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
        // 删除旧角色
        var oldRoles = await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .ToListAsync();
        _context.UserRoles.RemoveRange(oldRoles);

        // 添加新角色
        var newRoles = newRoleIds.Select(roleId => new UserRole
        {
            UserId = userId,
            RoleId = roleId
        });
        await _context.UserRoles.AddRangeAsync(newRoles);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}`,
            codeLanguage: "csharp",
            codeTitle: "事务操作",
            checkpoints: [
              "用 BeginTransactionAsync 开启事务",
              "先删除旧角色，再添加新角色",
              "SaveChangesAsync 后 CommitAsync",
              "异常时 RollbackAsync 回滚",
            ],
            reference:
              "事务确保多个操作要么全部成功，要么全部失败。如果只 SaveChangesAsync 不 CommitAsync，事务不会提交。",
          },
          {
            title: "实现悲观锁",
            content: (
              <p>
                用 <code>FromSqlRaw</code> 执行 SELECT FOR UPDATE 实现悲观锁，防止并发修改群组领导者。
              </p>
            ),
            code: `public async Task SetGroupLeaderAsync(string groupId, string newLeaderId)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    // 悲观锁：锁定行直到事务结束
    var group = await _context.Groups
        .FromSqlRaw("SELECT * FROM Groups WHERE Id = {0} FOR UPDATE", groupId)
        .FirstOrDefaultAsync();

    if (group == null) throw new NotFoundException();

    group.LeaderId = newLeaderId;
    await _context.SaveChangesAsync();
    await transaction.CommitAsync();
}`,
            codeLanguage: "csharp",
            codeTitle: "悲观锁",
            checkpoints: [
              "用 FROM SqlRaw 执行 SELECT FOR UPDATE",
              "锁定行后，其他事务会等待",
              "修改后 SaveChangesAsync + CommitAsync",
            ],
            reference:
              "FOR UPDATE 是 PostgreSQL/MySQL 的语法，SQL Server 用 WITH (UPDLOCK, ROWLOCK)。悲观锁适合冲突频繁的场景，否则用乐观锁（版本号）。",
          },
          {
            title: "添加软删除过滤器",
            content: (
              <p>
                在 <code>OnModelCreating</code> 中添加全局查询过滤器，自动过滤已删除的实体。恢复时用 <code>IgnoreQueryFilters</code>。
              </p>
            ),
            code: `// BaseEntity
public abstract class BaseEntity
{
    public string Id { get; set; }
    public bool IsDeleted { get; set; }
}

// OnModelCreating
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<User>()
        .HasQueryFilter(u => !u.IsDeleted);
    modelBuilder.Entity<Group>()
        .HasQueryFilter(g => !g.IsDeleted);
}

// 恢复已删除实体（需要 IgnoreQueryFilters）
public async Task<User?> GetDeletedUserAsync(string id)
{
    return await _context.Users
        .IgnoreQueryFilters()
        .FirstOrDefaultAsync(u => u.Id == id && u.IsDeleted);
}`,
            codeLanguage: "csharp",
            codeTitle: "软删除过滤器",
            checkpoints: [
              "HasQueryFilter 添加全局过滤器",
              "所有查询自动过滤 IsDeleted = true",
              "用 IgnoreQueryFilters 查询已删除实体",
            ],
            reference:
              "软删除适合需要恢复数据的场景。硬删除（物理删除）数据无法恢复，但节省存储空间。",
          },
          {
            title: "批量更新用 ExecuteUpdateAsync",
            content: (
              <p>
                用 <code>ExecuteUpdateAsync</code> 直接生成 UPDATE SQL，避免加载实体、循环修改、SaveChanges 的低效模式。
              </p>
            ),
            code: `// ❌ 低效写法（N+1 问题）
var users = await _context.Users.Where(u => u.IsActive).ToListAsync();
foreach (var user in users)
{
    user.LastLoginAt = DateTime.UtcNow;
}
await _context.SaveChangesAsync();

// ✅ 高效写法（一条 UPDATE SQL）
await _context.Users
    .Where(u => u.IsActive)
    .ExecuteUpdateAsync(setters => setters
        .SetProperty(u => u.LastLoginAt, DateTime.UtcNow));`,
            codeLanguage: "csharp",
            codeTitle: "批量更新",
            checkpoints: [
              "ExecuteUpdateAsync 直接生成 UPDATE SQL",
              "不需要 ToListAsync 和 SaveChangesAsync",
              "性能大幅提升（一次数据库往返 vs N+1 次）",
            ],
            reference:
              "ExecuteUpdateAsync 是 EF Core 7+ 的特性，类似 TypeORM 的 update().set().execute()。适合批量更新简单字段，不适合复杂业务逻辑。",
          },
          {
            title: "创建和回滚迁移",
            content: (
              <p>
                用 <code>dotnet ef migrations</code> 创建迁移、应用到数据库，并回滚到指定迁移。
              </p>
            ),
            code: `# 创建迁移
dotnet ef migrations add AddSoftDelete

# 应用到数据库
dotnet ef database update

# 查看所有迁移
dotnet ef migrations list

# 回滚到指定迁移
dotnet ef database update PreviousMigrationName

# 移除最后一个迁移（未应用的）
dotnet ef migrations remove`,
            codeLanguage: "bash",
            codeTitle: "迁移管理",
            checkpoints: [
              "migrations add 生成迁移文件",
              "database update 应用迁移",
              "回滚时指定目标迁移名称",
              "remove 只能移除未应用的迁移",
            ],
            reference:
              "迁移文件存储在 Migrations 文件夹。生产环境建议在 CI/CD 中自动应用迁移，不要手动执行。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经掌握了 EF Core 的事务、锁和迁移。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                事务确保多操作原子性，异常时回滚
              </li>
              <li>
                悲观锁用 FOR UPDATE，适合冲突频繁场景
              </li>
              <li>
                软删除用全局过滤器，恢复时用 IgnoreQueryFilters
              </li>
              <li>
                ExecuteUpdateAsync 批量更新，避免 N+1
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能实现事务操作、配置软删除、批量更新、管理迁移。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
