import type { ILessonBlock } from "@/components/lesson-ui";

export const efTransactionsBlocks = [
  {
    "level": 2,
    "text": "增删改查",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "创建",
    "type": "heading"
  },
  {
    "code": "public async Task<User> CreateAsync(CreateUserDto dto)\n{\n    var user = new User\n    {\n        Username = dto.Username,\n        Email = dto.Email,\n        PasswordHash = HashPassword(dto.Password),\n        IsActive = true\n    };\n\n    _context.Users.Add(user);\n    await _context.SaveChangesAsync();\n\n    return user;\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "查询",
    "type": "heading"
  },
  {
    "code": "// 单个查询 — 类似 findOne\npublic async Task<User?> GetByIdAsync(string id, bool includeRoles = false)\n{\n    var query = _context.Users\n        .AsNoTracking() // 只读查询，提升性能\n        .Where(u => u.Id == id);\n\n    if (includeRoles)\n    {\n        query = query\n            .Include(u => u.UserRoles)\n                .ThenInclude(ur => ur.Role)\n                    .ThenInclude(r => r.Permissions);\n    }\n\n    return await query.FirstOrDefaultAsync();\n}\n\n// 分页查询 — 类似 findAll\npublic async Task<PagedResult<User>> GetAllAsync(\n    int page = 1,\n    int pageSize = 20,\n    string? search = null)\n{\n    var query = _context.Users.AsQueryable();\n\n    // 搜索\n    if (!string.IsNullOrWhiteSpace(search))\n    {\n        query = query.Where(u =>\n            u.Username.Contains(search) ||\n            u.Email.Contains(search) ||\n            (u.Nickname != null && u.Nickname.Contains(search)));\n    }\n\n    // 排序 + 分页\n    var total = await query.CountAsync();\n\n    var users = await query\n        .OrderByDescending(u => u.CreatedAt)\n        .Skip((page - 1) * pageSize)\n        .Take(pageSize)\n        .Select(u => new UserDto\n        {\n            Id = u.Id,\n            Username = u.Username,\n            Email = u.Email,\n            Nickname = u.Nickname,\n            DisplayName = u.DisplayName,\n            SpecialRoles = u.SpecialRoles,\n            Roles = u.UserRoles.Select(ur => new RoleDto\n            {\n                Name = ur.Role.Name,\n                Code = ur.Role.Code\n            }).ToList()\n        })\n        .ToListAsync();\n\n    return new PagedResult<UserDto>\n    {\n        Data = users,\n        Total = total,\n        Page = page,\n        PageSize = pageSize\n    };\n}\n\n// Any / All / Contains — 类似 IN / EXISTS\npublic async Task<bool> UsernameExistsAsync(string username)\n{\n    return await _context.Users.AnyAsync(u => u.Username == username);\n}\n\npublic async Task<List<User>> GetByIdsAsync(IEnumerable<string> ids)\n{\n    return await _context.Users\n        .Where(u => ids.Contains(u.Id))\n        .ToListAsync();\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "更新",
    "type": "heading"
  },
  {
    "code": "public async Task<User> UpdateAsync(string id, UpdateUserDto dto)\n{\n    var user = await _context.Users.FindAsync(id);\n    if (user == null)\n        throw new NotFoundException(\"User not found\");\n\n    if (!string.IsNullOrWhiteSpace(dto.Username))\n        user.Username = dto.Username;\n    if (!string.IsNullOrWhiteSpace(dto.Email))\n        user.Email = dto.Email;\n    if (!string.IsNullOrWhiteSpace(dto.Nickname))\n        user.Nickname = dto.Nickname;\n\n    user.Touch(); // 更新 UpdatedAt\n    await _context.SaveChangesAsync();\n\n    return user;\n}\n\n// 批量更新\npublic async Task<int> UpdateStatusAsync(IEnumerable<string> ids, bool active)\n{\n    var users = await _context.Users\n        .Where(u => ids.Contains(u.Id))\n        .ToListAsync();\n\n    foreach (var user in users)\n    {\n        user.IsActive = active;\n        user.Touch();\n    }\n\n    return await _context.SaveChangesAsync();\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "删除（软删除）",
    "type": "heading"
  },
  {
    "code": "public async Task DeleteSoftAsync(string id)\n{\n    var user = await _context.Users.FindAsync(id);\n    if (user == null)\n        throw new NotFoundException(\"User not found\");\n\n    user.IsActive = false;\n    user.DeletedAt = DateTime.UtcNow;\n    user.Touch();\n\n    await _context.SaveChangesAsync();\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**关键差异**：TypeORM 有 `softRemove()` 方法。EF Core 没有内置软删除，但通过 **全局查询过滤器** + 手动标记实现，更透明。",
    "type": "quote"
  },
  {
    "level": 3,
    "text": "批量操作（替代循环逐个更新）",
    "type": "heading"
  },
  {
    "code": "// 批量删除\nawait _context.Users.Where(u => ids.Contains(u.Id)).ExecuteDeleteAsync();\n\n// 批量更新\nawait _context.Users\n    .Where(u => ids.Contains(u.Id))\n    .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, false)\n                            .SetProperty(u => u.UpdatedAt, DateTime.UtcNow));\n\n// 批量插入（已存在于 CRUD 中，此处补充）\nawait _context.Users.AddRangeAsync(usersToCreate);\nawait _context.SaveChangesAsync();\n\n// TS 开发者对照：这替代了你项目中的循环 save 操作\n// NestJS: for (const item of items) { await repo.save(item); }\n// EF Core: await repo.AddRangeAsync(items); await repo.SaveChangesAsync();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**实战价值**：你的 `GroupsService` 中有 `addGroupMembers` 批量添加成员的场景，用批量操作可以大幅减少数据库往返次数。",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "事务管理",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "基本事务",
    "type": "heading"
  },
  {
    "code": "public async Task UpdateUserRolesAsync(string userId, List<string> roleCodes)\n{\n    // 对应 TypeORM 的 manager.transaction()\n    await using var transaction = await _context.Database.BeginTransactionAsync();\n\n    try\n    {\n        // 1. 查询用户\n        var user = await _context.Users\n            .Include(u => u.UserRoles)\n            .FirstOrDefaultAsync(u => u.Id == userId);\n\n        if (user == null)\n            throw new NotFoundException(\"User not found\");\n\n        // 2. 获取目标角色\n        var roles = await _context.Roles\n            .Where(r => roleCodes.Contains(r.Code))\n            .ToListAsync();\n\n        // 3. 替换角色 — 删除旧的，添加新的\n        user.UserRoles.Clear();\n        foreach (var role in roles)\n        {\n            user.UserRoles.Add(new UserRole\n            {\n                UserId = userId,\n                RoleId = role.Id\n            });\n        }\n\n        // 4. 保存\n        await _context.SaveChangesAsync();\n\n        // 5. 提交\n        await transaction.CommitAsync();\n    }\n    catch\n    {\n        // 6. 回滚\n        await transaction.RollbackAsync();\n        throw;\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "悲观锁 — 对应你的 GroupsService 中的事务锁",
    "type": "heading"
  },
  {
    "code": "public async Task SetGroupLeaderAsync(string groupId, string userId)\n{\n    await using var transaction = await _context.Database.BeginTransactionAsync();\n\n    try\n    {\n        // 锁定 Group 行 — 对应 lock: { mode: 'pessimistic_write' }\n        var group = await _context.Groups\n            .FromSqlRaw(\"SELECT * FROM \\\"groups\\\" WHERE id = {0} FOR UPDATE\", groupId)\n            .FirstOrDefaultAsync();\n\n        // .NET 8+ 也有官方支持：\n        // var group = await _context.Groups\n        //     .FromSqlRaw(\"SELECT * FROM groups WHERE id = @p FOR UPDATE\", groupId)\n        //     .FirstOrDefaultAsync();\n\n        if (group == null)\n            throw new NotFoundException(\"Group not found\");\n\n        // 1. 找到旧 Leader\n        var oldLeader = await _context.GroupMembers\n            .Include(gm => gm.User)\n            .FirstOrDefaultAsync(gm =>\n                gm.GroupId == groupId &&\n                gm.Role == MemberRole.Leader);\n\n        // 2. 降级旧 Leader\n        if (oldLeader != null)\n        {\n            oldLeader.Role = MemberRole.Member;\n            await _context.SaveChangesAsync();\n        }\n\n        // 3. 设置新 Leader\n        var newMember = await _context.GroupMembers\n            .FirstOrDefaultAsync(gm =>\n                gm.GroupId == groupId &&\n                gm.UserId == userId);\n\n        if (newMember == null)\n            throw new NotFoundException(\"Member not found in group\");\n\n        newMember.Role = MemberRole.Leader;\n        await _context.SaveChangesAsync();\n\n        await transaction.CommitAsync();\n    }\n    catch\n    {\n        await transaction.RollbackAsync();\n        throw;\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "变更追踪",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "Change Tracker — EF Core 的核心机制",
    "type": "heading"
  },
  {
    "code": "// EF Core 自动追踪实体的变更状态\nvar user = _context.Users.First(u => u.Id == \"123\");\nuser.Username = \"newName\";  // EF 已追踪到变化\n\n// 查看变更状态\nforeach (var entry in _context.ChangeTracker.Entries<User>())\n{\n    Console.WriteLine($\"State: {entry.State}\");       // Added/Modified/Deleted/Unchanged\n    Console.WriteLine($\"Property: {entry.Property(u => u.Username).IsModified}\");\n    Console.WriteLine($\"Original: {entry.Property(u => u.Username).OriginalValue}\");\n    Console.WriteLine($\"Current: {entry.Property(u => u.Username).CurrentValue}\");\n}\n\n// 保存所有变更\nawait _context.SaveChangesAsync();\n\n// 手动标记状态\n_context.Users.Update(user);        // Modified\n_context.Users.Add(newUser);        // Added\n_context.Users.Remove(user);        // Deleted\n_context.Entry(user).State = EntityState.Detached; // 停止追踪",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 TypeORM 对照**：TypeORM 通过 `Repository.save()` 自动检测变更。EF Core 通过 Change Tracker 自动检测。但 EF Core 的追踪是上下文级别的，不同 DbContext 实例之间不共享追踪状态。",
    "type": "quote"
  },
  {
    "level": 3,
    "text": "性能优化",
    "type": "heading"
  },
  {
    "code": "// 只读查询 — 禁用变更追踪，提升性能\nvar users = await _context.Users\n    .AsNoTracking()\n    .ToListAsync();\n\n// 只读取需要的字段 — 投影\nvar userNames = await _context.Users\n    .AsNoTracking()\n    .Select(u => u.Username)\n    .ToListAsync();\n\n// 避免 N+1 查询 — 预加载\nvar groups = await _context.Groups\n    .Include(g => g.Members)\n        .ThenInclude(gm => gm.User)\n    .Include(g => g.Children)\n    .ToListAsync();\n\n// 原生 SQL — 性能敏感场景\nvar result = await _context.Users\n    .FromSqlRaw(\"\"\"\n        SELECT u.*, r.name as role_name \n        FROM users u \n        JOIN user_roles ur ON u.id = ur.user_id \n        JOIN roles r ON ur.role_id = r.id \n        WHERE u.active = true\n    \"\"\")\n    .ToListAsync();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "迁移",
    "type": "heading"
  },
  {
    "code": "# 创建迁移\ndotnet ef migrations add AddUsersAndRolesTables\ndotnet ef migrations add AddGroupTreeStructure\n\n# 应用迁移到数据库\ndotnet ef database update\n\n# 回滚迁移\ndotnet ef database update 0      # 回滚到初始状态\ndotnet ef database update AddUsersAndRolesTables  # 回滚到指定迁移\n\n# 从数据库反向生成迁移（Database First）\ndotnet ef migrations add InitialCreate --context ApplicationDbContext",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "实战练习清单",
    "type": "heading"
  },
  {
    "id": "checklist-28",
    "items": [
      "用 EF Core 建模 `User → UserRole → Role` 多对多关系",
      "实现 `Group` 树形结构（自引用 + Organization）",
      "编写 `UserService.GetAllAsync()` 的分页 + 搜索 + 排序",
      "实现 `UpdateUserRolesAsync()` 的事务操作",
      "实现 `SetGroupLeaderAsync()` 的悲观锁",
      "添加全局软删除过滤器",
      "创建 Migration 并应用到数据库",
      "用 `AsNoTracking()` 优化只读查询性能"
    ],
    "title": "练习清单",
    "type": "checklist"
  },
  {
    "level": 2,
    "text": "阶段验收问题",
    "type": "heading"
  },
  {
    "items": [
      "DbContext 为什么通常注册为 Scoped？",
      "查询 DTO 时为什么优先用 `Select` 投影？",
      "`Include` 适合什么场景，不适合什么场景？",
      "`ExecuteUpdateAsync()` 和加载实体后修改有什么区别？",
      "软删除用全局过滤器时有哪些边界情况？"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "下一步",
    "type": "heading"
  },
  {
    "text": "完成本阶段后，进入 [四、认证授权](04-认证授权.md)。",
    "type": "paragraph"
  }
] satisfies ILessonBlock[];
