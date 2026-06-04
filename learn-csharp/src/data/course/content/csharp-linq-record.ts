import type { ILessonBlock } from "@/components/lesson-ui";

export const csharpLinqRecordBlocks = [
  {
    "level": 2,
    "text": "第 2 周：C# 核心特性",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "2.1 LINQ — 语言的查询能力",
    "type": "heading"
  },
  {
    "text": "LINQ 是 C# 最强大的特性之一，它把查询变成了语言的第一公民。",
    "type": "paragraph"
  },
  {
    "level": 4,
    "text": "基础语法",
    "type": "heading"
  },
  {
    "code": "var users = new List<User>\n{\n    new User { Name = \"Alice\", Age = 30, City = \"Beijing\" },\n    new User { Name = \"Bob\", Age = 25, City = \"Shanghai\" },\n    new User { Name = \"Charlie\", Age = 35, City = \"Beijing\" },\n    new User { Name = \"Diana\", Age = 28, City = \"Shanghai\" },\n    new User { Name = \"Eve\", Age = 22, City = \"Beijing\" }\n};\n\n// 过滤（Where）— 类似 Array.prototype.filter\nvar beijingUsers = users.Where(u => u.City == \"Beijing\");\n\n// 排序（OrderBy / OrderByDescending）— 类似 Array.prototype.sort\nvar sorted = users.OrderBy(u => u.Age).ThenBy(u => u.Name);\nvar newestFirst = users.OrderByDescending(u => u.Age);\n\n// 投影（Select）— 类似 Array.prototype.map\nvar names = users.Select(u => u.Name).ToList();\nvar userSummary = users.Select(u => new {\n    FullName = u.Name.ToUpper(),\n    IsSenior = u.Age >= 30\n}).ToList();\n\n// 分组（GroupBy）\nvar byCity = users.GroupBy(u => u.City)\n    .Select(g => new { City = g.Key, Count = g.Count(), AverageAge = g.Average(u => u.Age) });\n\n// 连接（Join）— 类似 SQL JOIN\nvar innerJoin = users.Join(\n    roles,\n    user => user.Id,\n    role => role.UserId,\n    (user, role) => new { user.Name, role.RoleName }\n);",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 4,
    "text": "链式调用 vs 查询表达式",
    "type": "heading"
  },
  {
    "code": "// 方法语法（链式，推荐）\nvar result = users\n    .Where(u => u.Age > 25)\n    .OrderBy(u => u.Name)\n    .Select(u => u.Name.ToUpper())\n    .Take(10);\n\n// 查询表达式（SQL 风格，可读性好）\nvar result = from u in users\n             where u.Age > 25\n             orderby u.Name\n             select u.Name.ToUpper();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 4,
    "text": "延迟执行 vs 立即执行",
    "type": "heading"
  },
  {
    "code": "// 延迟执行（不真正查询，直到遍历时才执行）\nvar query = users.Where(u => u.Age > 25);\n\n// 立即执行（返回列表，查询已执行）\nvar list = users.Where(u => u.Age > 25).ToList();\nvar count = users.Where(u => u.Age > 25).Count();\nvar first = users.Where(u => u.Age > 25).FirstOrDefault();\nvar array = users.Where(u => u.Age > 25).ToArray();\nvar dictionary = users.Where(u => u.Age > 25).ToDictionary(u => u.Name);",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 4,
    "text": "常用 LINQ 操作速查",
    "type": "heading"
  },
  {
    "headers": [
      "操作",
      "方法",
      "说明"
    ],
    "rows": [
      [
        "过滤",
        "`.Where(predicate)`",
        "类似 `filter`"
      ],
      [
        "投影",
        "`.Select(selector)`",
        "类似 `map`"
      ],
      [
        "排序",
        "`.OrderBy`, `.OrderByDescending`",
        "升序/降序"
      ],
      [
        "跳过",
        "`.Skip(n)`, `.Take(n)`",
        "分页"
      ],
      [
        "连接",
        "`.Join(inner, outerKey, innerKey, result)`",
        "SQL JOIN"
      ],
      [
        "分组",
        "`.GroupBy(keySelector)`",
        "GROUP BY"
      ],
      [
        "集合",
        "`.Union`, `.Intersect`, `.Except`",
        "集合运算"
      ],
      [
        "元素",
        "`.First()`, `.FirstOrDefault()`, `.Single()`, `.SingleOrDefault()`",
        "获取单个"
      ],
      [
        "判定",
        "`.Any()`, `.All()`, `.Contains()`",
        "条件判断"
      ],
      [
        "聚合",
        "`.Sum()`, `.Average()`, `.Min()`, `.Max()`, `.Count()`",
        "统计"
      ],
      [
        "转换",
        "`.ToList()`, `.ToArray()`, `.ToDictionary()`",
        "立即执行"
      ]
    ],
    "type": "table"
  },
  {
    "text": "**实战练习**：用 LINQ 重写你的 `UsersService.findAll()` 查询逻辑。",
    "type": "quote"
  },
  {
    "level": 3,
    "text": "2.2 模式匹配",
    "type": "heading"
  },
  {
    "code": "// is 表达式\nobject obj = \"hello\";\nif (obj is string s)\n{\n    Console.WriteLine($\"String: {s.ToUpper()}\");\n}\n\n// switch 表达式（C# 8+，类似 TS 的 switch 但更强大）\nstring GetStatus(int code) => code switch\n{\n    200 => \"OK\",\n    400 => \"Bad Request\",\n    401 or 403 => \"Unauthorized\",  // 匹配多个值\n    >= 500 => \"Server Error\",       // 范围匹配\n    _ => \"Unknown\"                   // default\n};\n\n// 类型模式\nvoid Process(object obj)\n{\n    switch (obj)\n    {\n        case User user:\n            Console.WriteLine($\"User: {user.Name}\");\n            break;\n        case int n when n > 0:\n            Console.WriteLine($\"Positive int: {n}\");\n            break;\n        case null:\n            Console.WriteLine(\"Null\");\n            break;\n        default:\n            Console.WriteLine($\"Unknown: {obj}\");\n            break;\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "2.4 委托、事件与 Lambda",
    "type": "heading"
  },
  {
    "code": "// 委托 — 类型安全的函数引用\npublic delegate int MathOperation(int a, int b);\n\npublic int Add(int a, int b) => a + b;\npublic int Multiply(int a, int b) => a * b;\n\nMathOperation operation = Add;\nint result = operation(3, 4); // 7\n\n// Func/Action — 内置委托，更常用\nFunc<int, int, int> add = (a, b) => a + b;\nAction<string> log = msg => Console.WriteLine(msg);\nFunc<string, User> parse = name => new User { Name = name };\n\n// 事件\npublic class UserChangedEventArgs : EventArgs\n{\n    public User User { get; }\n    public string Action { get; }\n    public UserChangedEventArgs(User user, string action)\n    {\n        User = user;\n        Action = action;\n    }\n}\n\npublic class UserManager\n{\n    // 事件声明\n    public event EventHandler<UserChangedEventArgs>? UserChanged;\n\n    protected virtual void OnUserChanged(User user, string action)\n    {\n        UserChanged?.Invoke(this, new UserChangedEventArgs(user, action));\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**TS 对照**：C# 的 `Func<T, R>` 类似 TypeScript 的函数签名 `(T) => R`，`Action<T>` 类似 `(T) => void`。Lambda 语法 `(x) => x + 1` 与 TS 完全一致。",
    "type": "paragraph"
  },
  {
    "level": 3,
    "text": "2.5 扩展方法",
    "type": "heading"
  },
  {
    "code": "// 扩展方法 — 为现有类型添加方法，不需要继承\npublic static class StringExtensions\n{\n    public static bool IsEmail(this string str)\n    {\n        return Regex.IsMatch(str, @\"^[^@]+@[^@]+\\.[^@]+$\");\n    }\n\n    public static string ToKebabCase(this string str)\n    {\n        return Regex.Replace(str, \"([A-Z])\", \"-$1\")\n                     .ToLower()\n                     .TrimStart('-');\n    }\n}\n\n// 使用\n\"hello@world.com\".IsEmail();       // true\n\"UserName\".ToKebabCase();          // \"user-name\"",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 TS 对照**：类似在原型上添加方法，但有编译期类型安全。",
    "type": "paragraph"
  },
  {
    "level": 3,
    "text": "2.6 Record 类型 — 不可变数据容器",
    "type": "heading"
  },
  {
    "text": "这是 C# 9+ 引入的特性，已经是 DTO 定义的常用方式，对 TS 开发者尤其自然。",
    "type": "paragraph"
  },
  {
    "code": "// C# 9+ record — 不可变值对象（类似 TypeScript 的 const 对象）\npublic record UserDto(string Id, string Username, string Email);\npublic record CreateUserRequest(string Username, string Email, string Password);\npublic record PagedResult<T>(IEnumerable<T> Data, int Total, int Page, int PageSize);\n\n// 等价于传统 class，但自动提供：\n// - 不可变性（init 属性）\n// - 值相等比较（== 比较内容而非引用）\n// - 结构化克隆（with 表达式）\n\nvar user = new UserDto(\"1\", \"alice\", \"alice@example.com\");\nvar updated = user with { Username = \"alice_new\" }; // 创建副本，只改一个字段\n\n// 与 TS 对照：\n// TS: type UserDto = { readonly id: string; readonly username: string; };\n// TS: const updated = { ...user, username: 'alice_new' };\n// C#: var updated = user with { Username = \"alice_new\" };",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**关键差异**：",
    "type": "paragraph"
  },
  {
    "items": [
      "传统 `class` 使用引用相等（`==` 比较地址）",
      "`record` 使用值相等（`==` 比较内容），更贴近 TypeScript 的 `Object.is()` 语义",
      "`with` 表达式是 TS 展开语法的等价值"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "text": "**实战建议**：你的 DTO 定义优先使用 `record`，Entity 使用 `class`（因为 EF Core 需要追踪实体变更）。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "第 3 周：LINQ 深入",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "3.1 与 EF Core 结合的 LINQ",
    "type": "heading"
  },
  {
    "code": "// EF Core 中，LINQ 会被翻译成 SQL！\nvar users = await context.Users\n    .Where(u => u.Age > 25)\n    .OrderBy(u => u.Name)\n    .Skip(0)\n    .Take(20)\n    .ToListAsync();\n\n// 包含关联数据 — 类似 TypeORM 的 relations\nvar usersWithRoles = await context.Users\n    .Include(u => u.Roles)\n    .ThenInclude(r => r.Permissions)\n    .Where(u => u.IsActive)\n    .ToListAsync();\n\n// Any / All / Contains — 翻译成 EXISTS / IN\nvar admins = await context.Users\n    .Where(u => u.Roles.Any(r => r.Name == \"Admin\"))\n    .ToListAsync();\n\nvar usersInCities = await context.Users\n    .Where(u => cities.Contains(u.City))\n    .ToListAsync();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "3.2 Select 投影 — DTO 映射",
    "type": "heading"
  },
  {
    "code": "// 在数据库层直接投影，不加载完整实体\nvar userDtos = await context.Users\n    .Where(u => u.IsActive)\n    .Select(u => new UserDto\n    {\n        Id = u.Id,\n        Name = u.Name,\n        Email = u.Email,\n        RoleNames = u.Roles.Select(r => r.Name).ToList()\n    })\n    .ToListAsync();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  }
] satisfies ILessonBlock[];
