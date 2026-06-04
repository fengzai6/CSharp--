import type { ILessonBlock } from "@/components/lesson-ui";

export const efRelationshipsBlocks = [
  {
    "level": 3,
    "text": "关系映射",
    "type": "heading"
  },
  {
    "level": 4,
    "text": "1. 一对多",
    "type": "heading"
  },
  {
    "code": "// User → GroupMemberships（一个用户有多个成员记录）\npublic class GroupMembership : BaseEntity\n{\n    public string GroupId { get; set; } = string.Empty;\n    public string UserId { get; set; } = string.Empty;\n    public MemberRole Role { get; set; } = MemberRole.Member;\n    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;\n    public bool IsActive { get; set; } = true;\n\n    // 导航属性\n    public Group Group { get; set; } = null!;\n    public User User { get; set; } = null!;\n}\n\n// 配置\npublic class GroupMembershipConfiguration : IEntityTypeConfiguration<GroupMembership>\n{\n    public void Configure(EntityTypeBuilder<GroupMembership> builder)\n    {\n        builder.HasKey(gm => new { gm.GroupId, gm.UserId }); // 联合主键\n\n        builder.HasOne(gm => gm.Group)\n            .WithMany(g => g.Members)\n            .HasForeignKey(gm => gm.GroupId)\n            .OnDelete(DeleteBehavior.Cascade);\n\n        builder.HasOne(gm => gm.User)\n            .WithMany(u => u.GroupMemberships)\n            .HasForeignKey(gm => gm.UserId)\n            .OnDelete(DeleteBehavior.Cascade);\n\n        builder.HasIndex(gm => gm.UserId);\n        builder.HasIndex(gm => gm.GroupId);\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 4,
    "text": "2. 多对多（通过连接表）",
    "type": "heading"
  },
  {
    "code": "// 这里显式使用中间实体，因为连接关系需要 AssignedAt、IsActive 等额外字段\npublic class UserRole : BaseEntity\n{\n    public string UserId { get; set; } = string.Empty;\n    public string RoleId { get; set; } = string.Empty;\n    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;\n    public bool IsActive { get; set; } = true;\n\n    // 导航属性\n    public User User { get; set; } = null!;\n    public Role Role { get; set; } = null!;\n}\n\npublic class Role : BaseEntity\n{\n    public string Name { get; set; } = string.Empty;\n    public string Code { get; set; } = string.Empty;\n    public string? Description { get; set; }\n    public bool IsActive { get; set; } = true;\n\n    // 导航属性\n    public List<UserRole> Users { get; set; } = new();\n    public List<RolePermission> Permissions { get; set; } = new();\n}\n\npublic class Permission : BaseEntity\n{\n    public string Name { get; set; } = string.Empty;\n    public string Code { get; set; } = string.Empty;\n    public string? Resource { get; set; }\n    public string? Action { get; set; }\n    public string? Description { get; set; }\n    public bool IsActive { get; set; } = true;\n\n    // 导航属性\n    public List<RolePermission> Roles { get; set; } = new();\n}\n\n// 连接实体\npublic class RolePermission : BaseEntity\n{\n    public string RoleId { get; set; } = string.Empty;\n    public string PermissionId { get; set; } = string.Empty;\n\n    // 导航属性\n    public Role Role { get; set; } = null!;\n    public Permission Permission { get; set; } = null!;\n}\n\n// 多对多配置\npublic class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>\n{\n    public void Configure(EntityTypeBuilder<UserRole> builder)\n    {\n        builder.HasKey(ur => new { ur.UserId, ur.RoleId });\n\n        builder.HasOne(ur => ur.User)\n            .WithMany(u => u.UserRoles)\n            .HasForeignKey(ur => ur.UserId)\n            .OnDelete(DeleteBehavior.Cascade);\n\n        builder.HasOne(ur => ur.Role)\n            .WithMany(r => r.Users)\n            .HasForeignKey(ur => ur.RoleId)\n            .OnDelete(DeleteBehavior.Cascade);\n    }\n}\n\npublic class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>\n{\n    public void Configure(EntityTypeBuilder<RolePermission> builder)\n    {\n        builder.HasKey(rp => new { rp.RoleId, rp.PermissionId });\n\n        builder.HasOne(rp => rp.Role)\n            .WithMany(r => r.Permissions)\n            .HasForeignKey(rp => rp.RoleId)\n            .OnDelete(DeleteBehavior.Cascade);\n\n        builder.HasOne(rp => rp.Permission)\n            .WithMany(p => p.Roles)\n            .HasForeignKey(rp => rp.PermissionId)\n            .OnDelete(DeleteBehavior.Cascade);\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**关键差异**：EF Core 支持不带额外字段的多对多 skip navigation。但你的权限、成员关系通常需要 `AssignedAt`、`IsActive`、`Role` 等额外字段，所以更推荐显式定义中间实体。",
    "type": "quote"
  },
  {
    "level": 4,
    "text": "3. 自引用树形结构",
    "type": "heading"
  },
  {
    "code": "public class Group : BaseEntity\n{\n    public string Name { get; set; } = string.Empty;\n    public string? Description { get; set; }\n    public string? ParentId { get; set; }\n    public string? OrganizationId { get; set; }\n    public bool IsOrganization { get; set; }\n    public bool IsActive { get; set; } = true;\n\n    // 导航属性 — 自引用\n    public Group? Parent { get; set; }\n    public List<Group> Children { get; set; } = new();\n    public Group? Organization { get; set; }\n\n    // 扁平成员列表（通过 GroupMembership 连接表）\n    public List<GroupMembership> Members { get; set; } = new();\n}\n\n// 树形结构配置\npublic class GroupConfiguration : IEntityTypeConfiguration<Group>\n{\n    public void Configure(EntityTypeBuilder<Group> builder)\n    {\n        builder.HasOne(g => g.Parent)\n            .WithMany(g => g.Children)\n            .HasForeignKey(g => g.ParentId)\n            .OnDelete(DeleteBehavior.Restrict); // 防止级联删除破坏树\n\n        builder.HasOne(g => g.Organization)\n            .WithMany()\n            .HasForeignKey(g => g.OrganizationId)\n            .OnDelete(DeleteBehavior.SetNull);\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**TypeORM 对照**：你的 `GroupsService` 使用 `TreeRepository`（嵌套集合模型）。EF Core 没有内置树仓库，但可以通过自引用关系 + 手动逻辑实现相同功能。",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "关系数据查询：Include 与投影",
    "type": "heading"
  },
  {
    "text": "EF Core 中访问关系数据有两种常见方式：加载实体图和投影 DTO。不要简单理解成某一种替代另一种。",
    "type": "paragraph"
  },
  {
    "code": "// 方式一：加载完整实体图，适合后续修改实体并 SaveChanges\nvar users = await _context.Users\n    .Include(u => u.UserRoles)\n        .ThenInclude(ur => ur.Role)\n    .ToListAsync();\n\n// 方式二：直接投影 DTO，适合列表接口和只读接口\nvar userDtos = await _context.Users\n    .AsNoTracking()\n    .Select(u => new\n    {\n        u.Id,\n        u.Username,\n        Roles = u.UserRoles\n            .Where(ur => ur.IsActive)\n            .Select(ur => new { ur.Role.Name, ur.Role.Code })\n            .ToList()\n    })\n    .ToListAsync();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**选择规则**：要改实体就用 tracking 查询和必要的 `Include`；只返回接口数据就优先用 `AsNoTracking()` + `Select` 投影。",
    "type": "quote"
  }
] satisfies ILessonBlock[];
