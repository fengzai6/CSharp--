import type { ILessonBlock } from "@/components/lesson-ui";

export const csharpTypesBlocks = [
  {
    "text": "预估时间：2 周 | 目标：能用 C# 写干净的业务逻辑代码",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "本章你要掌握什么",
    "type": "heading"
  },
  {
    "text": "学完本章后，你应该能把 TypeScript 中常见的业务逻辑写成 C#：定义类型、处理空值、写 DTO、使用 LINQ 查询集合、编写异步方法。重点不是背语法，而是建立 C# 的类型、空值、值/引用、LINQ 和 Task 思维。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "老师提示",
    "type": "heading"
  },
  {
    "text": "你已经有后端经验，所以不要在 `if`、`for`、变量声明这种基础语法上消耗太多时间。真正需要反复练的是：可空引用类型、值类型和引用类型的赋值差异、LINQ 延迟执行、`async Task<T>` 的写法，以及 Entity 用 class、DTO 用 record 的边界。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "学习顺序建议",
    "type": "heading"
  },
  {
    "items": [
      "先学变量、可空引用类型、值类型 vs 引用类型。",
      "再学 class、interface、record 和泛型。",
      "然后集中练 LINQ，把数组/列表处理写熟。",
      "最后学 async/await，避免 `.Result` / `.Wait()`。"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "常见误区",
    "type": "heading"
  },
  {
    "items": [
      "把 `var` 当成 TypeScript 的 `any`。",
      "认为 `string` 可以随便为 `null`，忽略 Nullable 警告。",
      "在接口 DTO 中直接返回 EF Core Entity。",
      "对数据库查询过早 `ToList()`，导致后面的筛选在内存里执行。",
      "在异步代码里使用 `.Result` 或 `.Wait()`。"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "第 1 周：基础语法与类型系统",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "1.1 从 TypeScript 到 C#：变量与类型",
    "type": "heading"
  },
  {
    "level": 4,
    "text": "变量声明",
    "type": "heading"
  },
  {
    "code": "// TypeScript:\nlet name: string = \"hello\";\nconst MAX = 100;\nvar maybe = 42; // inferred: number\n\n// C#:\nstring name = \"hello\";\nconst int Max = 100;\nvar maybe = 42; // inferred: int (var 是编译期推断，不是 any!)",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**关键点**：`var` 不是 `any`。编译时确定类型，之后不可变。",
    "type": "paragraph"
  },
  {
    "code": "var x = 42;\nx = \"hello\"; // 编译错误！x 是 int",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 4,
    "text": "基本类型对照",
    "type": "heading"
  },
  {
    "headers": [
      "C#",
      "TypeScript",
      "说明"
    ],
    "rows": [
      [
        "`int` / `long`",
        "`number`",
        "整型，int 是 32 位，long 是 64 位"
      ],
      [
        "`double` / `float`",
        "`number`",
        "浮点，注意 `float` 需加 `f` 后缀"
      ],
      [
        "`decimal`",
        "无直接对应",
        "高精度小数，适合金额计算"
      ],
      [
        "`bool`",
        "`boolean`",
        "布尔，没有 `truthy/falsy`"
      ],
      [
        "`string`",
        "`string`",
        "引用类型，不可变"
      ],
      [
        "`char`",
        "`string`（1个字符）",
        "单字符，用单引号 `'A'`"
      ],
      [
        "`DateTime`",
        "`Date`",
        "日期时间"
      ]
    ],
    "type": "table"
  },
  {
    "level": 4,
    "text": "空值处理",
    "type": "heading"
  },
  {
    "code": "// TypeScript:\nlet name: string | null = null;\n\n// C# 8+ 可空引用类型：\nstring name = null;        // 编译警告（非空）\nstring? name = null;       // 编译通过（可空）\nstring nonNull = name!;    // 强制非空（告诉编译器别警告了）",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**设置**：在项目 `.csproj` 中添加 `<Nullable>enable</Nullable>` 启用可空引用类型检查。",
    "type": "quote"
  },
  {
    "level": 4,
    "text": "集合表达式（C# 12+）",
    "type": "heading"
  },
  {
    "code": "// 简洁集合初始化\nint[] numbers = [1, 2, 3, 4, 5];\nvar users = [user1, user2, user3];\n\n// 展开运算符（类似 TS 的 [...arr]）\nint[] combined = [1, 2, ..numbers, 6, 7];\nvar allItems = [header, ..items, footer];\n\n// TS 开发者对照：这直接等价 TypeScript 的 spread 语法\n// TS: const combined = [1, 2, ...numbers, 6, 7];",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 TS 对照**：集合表达式是 TS 开发者最自然的 C# 语法，数组/集合操作与 TS 的 `spread` 行为完全一致。",
    "type": "paragraph"
  },
  {
    "level": 3,
    "text": "1.2 值类型 vs 引用类型 — 最重要的概念",
    "type": "heading"
  },
  {
    "text": "这是 TS 开发者最需要切换的思维。",
    "type": "paragraph"
  },
  {
    "code": "// ============ 值类型 ============\nint x = 5;\nint y = x;      // y 复制了 x 的值\ny = 10;\nConsole.WriteLine(x); // 输出 5（x 没变）\n\nstruct Point {\n    public int X;\n    public int Y;\n}\nPoint p1 = new Point { X = 1, Y = 2 };\nPoint p2 = p1;       // 复制整个结构体\np2.X = 99;\nConsole.WriteLine(p1.X); // 输出 1（p1 没变）\n\n// ============ 引用类型 ============\nvar list1 = new List<int> { 1, 2, 3 };\nvar list2 = list1;     // 复制的是引用（指向同一个对象）\nlist2.Add(4);\nConsole.WriteLine(list1.Count); // 输出 4（list1 也变了！）\n\nclass User {\n    public string Name;\n}\nUser u1 = new User { Name = \"Alice\" };\nUser u2 = u1;          // 引用复制\nu2.Name = \"Bob\";\nConsole.WriteLine(u1.Name); // 输出 Bob",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**核心规则**：",
    "type": "paragraph"
  },
  {
    "headers": [
      "类型",
      "分类",
      "存储位置",
      "赋值行为"
    ],
    "rows": [
      [
        "`int`, `long`, `float`, `double`, `bool`, `char`, `decimal`",
        "值类型",
        "栈",
        "复制值"
      ],
      [
        "`struct`",
        "值类型",
        "栈",
        "复制整个结构"
      ],
      [
        "`enum`",
        "值类型",
        "栈",
        "复制值"
      ],
      [
        "`class`",
        "引用类型",
        "堆",
        "复制引用"
      ],
      [
        "`interface`",
        "引用类型",
        "堆",
        "复制引用"
      ],
      [
        "`string`",
        "引用类型（但不可变）",
        "堆",
        "复制引用（修改时创建新对象）"
      ],
      [
        "`array`, `List<T>`",
        "引用类型",
        "堆",
        "复制引用"
      ]
    ],
    "type": "table"
  },
  {
    "text": "**TS 对照**：",
    "type": "paragraph"
  },
  {
    "code": "TS 基本类型（number, string, boolean） → C# 值类型\nTS 对象（{ name: \"Alice\" }）           → C# 引用类型（class）",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "text": "但 C# 多了一层 **struct**（值类型对象），这让你可以创建轻量级的值类型数据容器，赋值时完全拷贝，不会产生共享状态的 bug。",
    "type": "paragraph"
  },
  {
    "level": 3,
    "text": "1.3 类与接口",
    "type": "heading"
  },
  {
    "level": 4,
    "text": "类",
    "type": "heading"
  },
  {
    "code": "// 类 = 引用类型\npublic class User\n{\n    // 字段（通常私有）\n    private string _name;\n\n    // 属性（公共访问口）\n    public string Name\n    {\n        get => _name;\n        set => _name = value.ToUpper(); // 自动转换\n    }\n\n    // C# 9+ 不可变属性（init 只能在构造时设置）\n    public string Id { get; init; }\n\n    // 构造函数\n    public User(string name)\n    {\n        Name = name;\n    }\n\n    // 方法\n    public void ChangeName(string newName)\n    {\n        _name = newName;\n    }\n\n    // 虚方法（允许子类重写）\n    public virtual string Greet() => $\"Hello, I'm {Name}\";\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 TS 对比**：",
    "type": "paragraph"
  },
  {
    "code": "// TypeScript\nclass User {\n    private _name: string;\n    public get Name(): string { return this._name; }\n    public set Name(value: string) { this._name = value.toUpperCase(); }\n\n    constructor(public id: string, name: string) {\n        this._name = name;\n    }\n}",
    "language": "typescript",
    "title": "typescript 示例",
    "type": "code"
  },
  {
    "text": "C# 的属性语法更繁琐，但有独立于 `get`/`set` 的 `init` 修饰符（不可变），且属性的 setter 可以有访问权限控制（`private set`、`init`）。",
    "type": "paragraph"
  },
  {
    "level": 4,
    "text": "接口",
    "type": "heading"
  },
  {
    "code": "// 接口 = 契约，不包含实现（C# 8 之前）\npublic interface IUserRepository\n{\n    Task<User> GetByIdAsync(string id);\n    Task<List<User>> GetAllAsync();\n    Task<User> CreateAsync(User user);\n}\n\n// C# 8+ 默认接口实现\npublic interface ILogger\n{\n    void Log(string message);\n\n    // 默认实现\n    public void LogError(string message) => Log($\"ERROR: {message}\");\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 TS 对比**：",
    "type": "paragraph"
  },
  {
    "code": "// TypeScript\ninterface IUserRepository {\n    getByIdAsync(id: string): Promise<User>;\n    createAsync(user: User): Promise<User>;\n}",
    "language": "typescript",
    "title": "typescript 示例",
    "type": "code"
  },
  {
    "text": "C# 接口不能包含字段、构造函数、属性实现。它是**纯契约**，这让多态和依赖注入更明确。",
    "type": "paragraph"
  },
  {
    "level": 4,
    "text": "abstract class vs interface",
    "type": "heading"
  },
  {
    "headers": [
      "",
      "`abstract class`",
      "`interface`"
    ],
    "rows": [
      [
        "可以有实现的方法",
        "✅",
        "C# 8+ ✅（默认实现）"
      ],
      [
        "可以有字段",
        "✅",
        "❌"
      ],
      [
        "可以有构造函数",
        "✅",
        "❌"
      ],
      [
        "可以多继承",
        "❌",
        "❌（但接口可以多实现）"
      ],
      [
        "可以多实现",
        "❌",
        "✅"
      ],
      [
        "访问修饰符",
        "`protected` 成员可用",
        "全部 `public`"
      ]
    ],
    "type": "table"
  },
  {
    "level": 3,
    "text": "1.4 枚举与标志",
    "type": "heading"
  },
  {
    "code": "// 基础枚举\npublic enum Role\n{\n    Guest = 0,\n    Member = 1,\n    Admin = 2,\n    SuperAdmin = 3\n}\n\n// 带 [Flags] 的标志枚举（可组合）\n[Flags]\npublic enum Permission\n{\n    None = 0,\n    Read = 1,       //  0001\n    Write = 2,      //  0010\n    Delete = 4,     //  0100\n    Execute = 8     //  1000\n}\n\n// 组合使用\nPermission userPerm = Permission.Read | Permission.Write;\nbool canRead = (userPerm & Permission.Read) == Permission.Read;\nbool canDelete = (userPerm & Permission.Delete) == Permission.Delete;",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 TS 对照**：你的项目里用 `as const` 替代 `enum`，C# 有原生的 `enum`，更强大且性能更好。",
    "type": "paragraph"
  },
  {
    "level": 3,
    "text": "1.5 泛型",
    "type": "heading"
  },
  {
    "code": "// 基础泛型\npublic class Repository<T> where T : class\n{\n    private List<T> _items = new();\n\n    public T GetById(string id) { /* ... */ }\n    public void Add(T item) { _items.Add(item); }\n    public void Remove(T item) { _items.Remove(item); }\n}\n\n// 泛型约束\npublic interface IService<T> where T : class, IEntity\n{\n    Task<T> GetByIdAsync(string id);\n    Task<List<T>> GetAllAsync();\n}\n\n// 多个约束\npublic class CacheService<TKey, TValue>\n    where TKey : notnull    // 非 null\n    where TValue : class    // 引用类型\n    where TKey : IComparable // 可比较\n{\n    // ...\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 TS 对照**：TS 泛型是类型擦除（编译期），C# 泛型是 reification（运行期）。这意味着 C# 的 `List<int>` 和 `List<string>` 在运行期是**不同类型**，可以有类型特定的优化。",
    "type": "paragraph"
  }
] satisfies ILessonBlock[];
