# 一、C# 语言核心

> 预估时间：2 周 | 目标：能用 C# 写干净的业务逻辑代码

---

## 本章你要掌握什么

学完本章后，你应该能把 TypeScript 中常见的业务逻辑写成 C#：定义类型、处理空值、写 DTO、使用 LINQ 查询集合、编写异步方法。重点不是背语法，而是建立 C# 的类型、空值、值/引用、LINQ 和 Task 思维。

## 老师提示

你已经有后端经验，所以不要在 `if`、`for`、变量声明这种基础语法上消耗太多时间。真正需要反复练的是：可空引用类型、值类型和引用类型的赋值差异、LINQ 延迟执行、`async Task<T>` 的写法，以及 Entity 用 class、DTO 用 record 的边界。

## 学习顺序建议

1. 先学变量、可空引用类型、值类型 vs 引用类型。
2. 再学 class、interface、record 和泛型。
3. 然后集中练 LINQ，把数组/列表处理写熟。
4. 最后学 async/await，避免 `.Result` / `.Wait()`。

## 常见误区

- 把 `var` 当成 TypeScript 的 `any`。
- 认为 `string` 可以随便为 `null`，忽略 Nullable 警告。
- 在接口 DTO 中直接返回 EF Core Entity。
- 对数据库查询过早 `ToList()`，导致后面的筛选在内存里执行。
- 在异步代码里使用 `.Result` 或 `.Wait()`。

## 第 1 周：基础语法与类型系统

### 1.1 从 TypeScript 到 C#：变量与类型

#### 变量声明

```csharp
// TypeScript:
let name: string = "hello";
const MAX = 100;
var maybe = 42; // inferred: number

// C#:
string name = "hello";
const int Max = 100;
var maybe = 42; // inferred: int (var 是编译期推断，不是 any!)
```

**关键点**：`var` 不是 `any`。编译时确定类型，之后不可变。

```csharp
var x = 42;
x = "hello"; // 编译错误！x 是 int
```

#### 基本类型对照

| C# | TypeScript | 说明 |
|-----|-----------|------|
| `int` / `long` | `number` | 整型，int 是 32 位，long 是 64 位 |
| `double` / `float` | `number` | 浮点，注意 `float` 需加 `f` 后缀 |
| `decimal` | 无直接对应 | 高精度小数，适合金额计算 |
| `bool` | `boolean` | 布尔，没有 `truthy/falsy` |
| `string` | `string` | 引用类型，不可变 |
| `char` | `string`（1个字符） | 单字符，用单引号 `'A'` |
| `DateTime` | `Date` | 日期时间 |

#### 空值处理

```csharp
// TypeScript:
let name: string | null = null;

// C# 8+ 可空引用类型：
string name = null;        // 编译警告（非空）
string? name = null;       // 编译通过（可空）
string nonNull = name!;    // 强制非空（告诉编译器别警告了）
```

> **设置**：在项目 `.csproj` 中添加 `<Nullable>enable</Nullable>` 启用可空引用类型检查。

---

#### 集合表达式（C# 12+）

```csharp
// 简洁集合初始化
int[] numbers = [1, 2, 3, 4, 5];
var users = [user1, user2, user3];

// 展开运算符（类似 TS 的 [...arr]）
int[] combined = [1, 2, ..numbers, 6, 7];
var allItems = [header, ..items, footer];

// TS 开发者对照：这直接等价 TypeScript 的 spread 语法
// TS: const combined = [1, 2, ...numbers, 6, 7];
```

**与 TS 对照**：集合表达式是 TS 开发者最自然的 C# 语法，数组/集合操作与 TS 的 `spread` 行为完全一致。

---

### 1.2 值类型 vs 引用类型 — 最重要的概念

这是 TS 开发者最需要切换的思维。

```csharp
// ============ 值类型 ============
int x = 5;
int y = x;      // y 复制了 x 的值
y = 10;
Console.WriteLine(x); // 输出 5（x 没变）

struct Point {
    public int X;
    public int Y;
}
Point p1 = new Point { X = 1, Y = 2 };
Point p2 = p1;       // 复制整个结构体
p2.X = 99;
Console.WriteLine(p1.X); // 输出 1（p1 没变）

// ============ 引用类型 ============
var list1 = new List<int> { 1, 2, 3 };
var list2 = list1;     // 复制的是引用（指向同一个对象）
list2.Add(4);
Console.WriteLine(list1.Count); // 输出 4（list1 也变了！）

class User {
    public string Name;
}
User u1 = new User { Name = "Alice" };
User u2 = u1;          // 引用复制
u2.Name = "Bob";
Console.WriteLine(u1.Name); // 输出 Bob
```

**核心规则**：

| 类型 | 分类 | 存储位置 | 赋值行为 |
|------|------|---------|---------|
| `int`, `long`, `float`, `double`, `bool`, `char`, `decimal` | 值类型 | 栈 | 复制值 |
| `struct` | 值类型 | 栈 | 复制整个结构 |
| `enum` | 值类型 | 栈 | 复制值 |
| `class` | 引用类型 | 堆 | 复制引用 |
| `interface` | 引用类型 | 堆 | 复制引用 |
| `string` | 引用类型（但不可变） | 堆 | 复制引用（修改时创建新对象） |
| `array`, `List<T>` | 引用类型 | 堆 | 复制引用 |

**TS 对照**：

```
TS 基本类型（number, string, boolean） → C# 值类型
TS 对象（{ name: "Alice" }）           → C# 引用类型（class）
```

但 C# 多了一层 **struct**（值类型对象），这让你可以创建轻量级的值类型数据容器，赋值时完全拷贝，不会产生共享状态的 bug。

---

### 1.3 类与接口

#### 类

```csharp
// 类 = 引用类型
public class User
{
    // 字段（通常私有）
    private string _name;

    // 属性（公共访问口）
    public string Name
    {
        get => _name;
        set => _name = value.ToUpper(); // 自动转换
    }

    // C# 9+ 不可变属性（init 只能在构造时设置）
    public string Id { get; init; }

    // 构造函数
    public User(string name)
    {
        Name = name;
    }

    // 方法
    public void ChangeName(string newName)
    {
        _name = newName;
    }

    // 虚方法（允许子类重写）
    public virtual string Greet() => $"Hello, I'm {Name}";
}
```

**与 TS 对比**：

```typescript
// TypeScript
class User {
    private _name: string;
    public get Name(): string { return this._name; }
    public set Name(value: string) { this._name = value.toUpperCase(); }

    constructor(public id: string, name: string) {
        this._name = name;
    }
}
```

C# 的属性语法更繁琐，但有独立于 `get`/`set` 的 `init` 修饰符（不可变），且属性的 setter 可以有访问权限控制（`private set`、`init`）。

#### 接口

```csharp
// 接口 = 契约，不包含实现（C# 8 之前）
public interface IUserRepository
{
    Task<User> GetByIdAsync(string id);
    Task<List<User>> GetAllAsync();
    Task<User> CreateAsync(User user);
}

// C# 8+ 默认接口实现
public interface ILogger
{
    void Log(string message);

    // 默认实现
    public void LogError(string message) => Log($"ERROR: {message}");
}
```

**与 TS 对比**：

```typescript
// TypeScript
interface IUserRepository {
    getByIdAsync(id: string): Promise<User>;
    createAsync(user: User): Promise<User>;
}
```

C# 接口不能包含字段、构造函数、属性实现。它是**纯契约**，这让多态和依赖注入更明确。

#### abstract class vs interface

| | `abstract class` | `interface` |
|---|---|---|
| 可以有实现的方法 | ✅ | C# 8+ ✅（默认实现） |
| 可以有字段 | ✅ | ❌ |
| 可以有构造函数 | ✅ | ❌ |
| 可以多继承 | ❌ | ❌（但接口可以多实现） |
| 可以多实现 | ❌ | ✅ |
| 访问修饰符 | `protected` 成员可用 | 全部 `public` |

---

### 1.4 枚举与标志

```csharp
// 基础枚举
public enum Role
{
    Guest = 0,
    Member = 1,
    Admin = 2,
    SuperAdmin = 3
}

// 带 [Flags] 的标志枚举（可组合）
[Flags]
public enum Permission
{
    None = 0,
    Read = 1,       //  0001
    Write = 2,      //  0010
    Delete = 4,     //  0100
    Execute = 8     //  1000
}

// 组合使用
Permission userPerm = Permission.Read | Permission.Write;
bool canRead = (userPerm & Permission.Read) == Permission.Read;
bool canDelete = (userPerm & Permission.Delete) == Permission.Delete;
```

**与 TS 对照**：你的项目里用 `as const` 替代 `enum`，C# 有原生的 `enum`，更强大且性能更好。

---

### 1.5 泛型

```csharp
// 基础泛型
public class Repository<T> where T : class
{
    private List<T> _items = new();

    public T GetById(string id) { /* ... */ }
    public void Add(T item) { _items.Add(item); }
    public void Remove(T item) { _items.Remove(item); }
}

// 泛型约束
public interface IService<T> where T : class, IEntity
{
    Task<T> GetByIdAsync(string id);
    Task<List<T>> GetAllAsync();
}

// 多个约束
public class CacheService<TKey, TValue>
    where TKey : notnull    // 非 null
    where TValue : class    // 引用类型
    where TKey : IComparable // 可比较
{
    // ...
}
```

**与 TS 对照**：TS 泛型是类型擦除（编译期），C# 泛型是 reification（运行期）。这意味着 C# 的 `List<int>` 和 `List<string>` 在运行期是**不同类型**，可以有类型特定的优化。

---

## 第 2 周：C# 核心特性

### 2.1 LINQ — 语言的查询能力

LINQ 是 C# 最强大的特性之一，它把查询变成了语言的第一公民。

#### 基础语法

```csharp
var users = new List<User>
{
    new User { Name = "Alice", Age = 30, City = "Beijing" },
    new User { Name = "Bob", Age = 25, City = "Shanghai" },
    new User { Name = "Charlie", Age = 35, City = "Beijing" },
    new User { Name = "Diana", Age = 28, City = "Shanghai" },
    new User { Name = "Eve", Age = 22, City = "Beijing" }
};

// 过滤（Where）— 类似 Array.prototype.filter
var beijingUsers = users.Where(u => u.City == "Beijing");

// 排序（OrderBy / OrderByDescending）— 类似 Array.prototype.sort
var sorted = users.OrderBy(u => u.Age).ThenBy(u => u.Name);
var newestFirst = users.OrderByDescending(u => u.Age);

// 投影（Select）— 类似 Array.prototype.map
var names = users.Select(u => u.Name).ToList();
var userSummary = users.Select(u => new {
    FullName = u.Name.ToUpper(),
    IsSenior = u.Age >= 30
}).ToList();

// 分组（GroupBy）
var byCity = users.GroupBy(u => u.City)
    .Select(g => new { City = g.Key, Count = g.Count(), AverageAge = g.Average(u => u.Age) });

// 连接（Join）— 类似 SQL JOIN
var innerJoin = users.Join(
    roles,
    user => user.Id,
    role => role.UserId,
    (user, role) => new { user.Name, role.RoleName }
);
```

#### 链式调用 vs 查询表达式

```csharp
// 方法语法（链式，推荐）
var result = users
    .Where(u => u.Age > 25)
    .OrderBy(u => u.Name)
    .Select(u => u.Name.ToUpper())
    .Take(10);

// 查询表达式（SQL 风格，可读性好）
var result = from u in users
             where u.Age > 25
             orderby u.Name
             select u.Name.ToUpper();
```

#### 延迟执行 vs 立即执行

```csharp
// 延迟执行（不真正查询，直到遍历时才执行）
var query = users.Where(u => u.Age > 25);

// 立即执行（返回列表，查询已执行）
var list = users.Where(u => u.Age > 25).ToList();
var count = users.Where(u => u.Age > 25).Count();
var first = users.Where(u => u.Age > 25).FirstOrDefault();
var array = users.Where(u => u.Age > 25).ToArray();
var dictionary = users.Where(u => u.Age > 25).ToDictionary(u => u.Name);
```

#### 常用 LINQ 操作速查

| 操作 | 方法 | 说明 |
|------|------|------|
| 过滤 | `.Where(predicate)` | 类似 `filter` |
| 投影 | `.Select(selector)` | 类似 `map` |
| 排序 | `.OrderBy`, `.OrderByDescending` | 升序/降序 |
| 跳过 | `.Skip(n)`, `.Take(n)` | 分页 |
| 连接 | `.Join(inner, outerKey, innerKey, result)` | SQL JOIN |
| 分组 | `.GroupBy(keySelector)` | GROUP BY |
| 集合 | `.Union`, `.Intersect`, `.Except` | 集合运算 |
| 元素 | `.First()`, `.FirstOrDefault()`, `.Single()`, `.SingleOrDefault()` | 获取单个 |
| 判定 | `.Any()`, `.All()`, `.Contains()` | 条件判断 |
| 聚合 | `.Sum()`, `.Average()`, `.Min()`, `.Max()`, `.Count()` | 统计 |
| 转换 | `.ToList()`, `.ToArray()`, `.ToDictionary()` | 立即执行 |

> **实战练习**：用 LINQ 重写你的 `UsersService.findAll()` 查询逻辑。

---

### 2.2 模式匹配

```csharp
// is 表达式
object obj = "hello";
if (obj is string s)
{
    Console.WriteLine($"String: {s.ToUpper()}");
}

// switch 表达式（C# 8+，类似 TS 的 switch 但更强大）
string GetStatus(int code) => code switch
{
    200 => "OK",
    400 => "Bad Request",
    401 or 403 => "Unauthorized",  // 匹配多个值
    >= 500 => "Server Error",       // 范围匹配
    _ => "Unknown"                   // default
};

// 类型模式
void Process(object obj)
{
    switch (obj)
    {
        case User user:
            Console.WriteLine($"User: {user.Name}");
            break;
        case int n when n > 0:
            Console.WriteLine($"Positive int: {n}");
            break;
        case null:
            Console.WriteLine("Null");
            break;
        default:
            Console.WriteLine($"Unknown: {obj}");
            break;
    }
}
```

---

### 2.3 异步编程 — async/await 与 Task

```csharp
// 基础模式
public async Task<User> GetUserAsync(string id)
{
    var response = await httpClient.GetAsync($"/api/users/{id}");
    response.EnsureSuccessStatusCode();
    var json = await response.Content.ReadAsStringAsync();
    return JsonSerializer.Deserialize<User>(json);
}

// 并行执行 — 类似 Promise.all
public async Task<(User? user, Role? role)> GetUserAndRoleAsync(string userId)
{
    var userTask = GetUserAsync(userId);
    var roleTask = GetRoleAsync(userId);
    return (await userTask, await roleTask);
}

// await Task.WhenAll
public async Task<List<User>> GetUsersAsync(string[] ids)
{
    var tasks = ids.Select(id => GetUserAsync(id)).ToArray();
    return (await Task.WhenAll(tasks)).ToList();
}
```

**与 JS/TS 的核心差异**：

```
JS/TS:      await 在 Event Loop 上排队，单线程，非阻塞
C#:         async/await 使用线程池线程，I/O 操作完成后回调在线程池上执行

JS:         适合 CPU 密集（单线程 + 异步 I/O）
C#:         适合 I/O 密集（线程池 + async/await），CPU 密集用 Task.Run() 或 Parallel
```

```csharp
// CPU 绑定操作 — 不要在请求线程里直接跑重计算
public async Task<int> ComputeExpensiveAsync(int n)
{
    // 错误做法：直接阻塞当前请求线程
    // return HeavyComputation(n);

    // 正确做法：用 Task.Run 放到线程池，并始终 await
    return await Task.Run(() => HeavyComputation(n));
}

// 真正的异步 CPU 操作（.NET 8+ 有异步迭代器）
public static async IAsyncEnumerable<int> AsyncRange(int start, int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(10); // 模拟异步
        yield return start + i;
    }
}
```

**Async/Await 黄金法则**：
1. **I/O 绑定** → 直接用 `async/await`（HTTP、数据库、文件）
2. **CPU 绑定** → 用 `Task.Run()` 或 `Parallel`
3. **不要 `.Result` 或 `.Wait()`** → 会产生死锁，始终 `await`
4. **ConfigureAwait(false)** → 库代码中使用，避免不必要的上下文切换

---

### 2.4 委托、事件与 Lambda

```csharp
// 委托 — 类型安全的函数引用
public delegate int MathOperation(int a, int b);

public int Add(int a, int b) => a + b;
public int Multiply(int a, int b) => a * b;

MathOperation operation = Add;
int result = operation(3, 4); // 7

// Func/Action — 内置委托，更常用
Func<int, int, int> add = (a, b) => a + b;
Action<string> log = msg => Console.WriteLine(msg);
Func<string, User> parse = name => new User { Name = name };

// 事件
public class UserChangedEventArgs : EventArgs
{
    public User User { get; }
    public string Action { get; }
    public UserChangedEventArgs(User user, string action)
    {
        User = user;
        Action = action;
    }
}

public class UserManager
{
    // 事件声明
    public event EventHandler<UserChangedEventArgs>? UserChanged;

    protected virtual void OnUserChanged(User user, string action)
    {
        UserChanged?.Invoke(this, new UserChangedEventArgs(user, action));
    }
}
```

**TS 对照**：C# 的 `Func<T, R>` 类似 TypeScript 的函数签名 `(T) => R`，`Action<T>` 类似 `(T) => void`。Lambda 语法 `(x) => x + 1` 与 TS 完全一致。

---

### 2.5 扩展方法

```csharp
// 扩展方法 — 为现有类型添加方法，不需要继承
public static class StringExtensions
{
    public static bool IsEmail(this string str)
    {
        return Regex.IsMatch(str, @"^[^@]+@[^@]+\.[^@]+$");
    }

    public static string ToKebabCase(this string str)
    {
        return Regex.Replace(str, "([A-Z])", "-$1")
                     .ToLower()
                     .TrimStart('-');
    }
}

// 使用
"hello@world.com".IsEmail();       // true
"UserName".ToKebabCase();          // "user-name"
```

**与 TS 对照**：类似在原型上添加方法，但有编译期类型安全。

---

### 2.6 Record 类型 — 不可变数据容器

这是 C# 9+ 引入的特性，已经是 DTO 定义的常用方式，对 TS 开发者尤其自然。

```csharp
// C# 9+ record — 不可变值对象（类似 TypeScript 的 const 对象）
public record UserDto(string Id, string Username, string Email);
public record CreateUserRequest(string Username, string Email, string Password);
public record PagedResult<T>(IEnumerable<T> Data, int Total, int Page, int PageSize);

// 等价于传统 class，但自动提供：
// - 不可变性（init 属性）
// - 值相等比较（== 比较内容而非引用）
// - 结构化克隆（with 表达式）

var user = new UserDto("1", "alice", "alice@example.com");
var updated = user with { Username = "alice_new" }; // 创建副本，只改一个字段

// 与 TS 对照：
// TS: type UserDto = { readonly id: string; readonly username: string; };
// TS: const updated = { ...user, username: 'alice_new' };
// C#: var updated = user with { Username = "alice_new" };
```

**关键差异**：
- 传统 `class` 使用引用相等（`==` 比较地址）
- `record` 使用值相等（`==` 比较内容），更贴近 TypeScript 的 `Object.is()` 语义
- `with` 表达式是 TS 展开语法的等价值

**实战建议**：你的 DTO 定义优先使用 `record`，Entity 使用 `class`（因为 EF Core 需要追踪实体变更）。

---

## 第 3 周：LINQ 深入

### 3.1 与 EF Core 结合的 LINQ

```csharp
// EF Core 中，LINQ 会被翻译成 SQL！
var users = await context.Users
    .Where(u => u.Age > 25)
    .OrderBy(u => u.Name)
    .Skip(0)
    .Take(20)
    .ToListAsync();

// 包含关联数据 — 类似 TypeORM 的 relations
var usersWithRoles = await context.Users
    .Include(u => u.Roles)
    .ThenInclude(r => r.Permissions)
    .Where(u => u.IsActive)
    .ToListAsync();

// Any / All / Contains — 翻译成 EXISTS / IN
var admins = await context.Users
    .Where(u => u.Roles.Any(r => r.Name == "Admin"))
    .ToListAsync();

var usersInCities = await context.Users
    .Where(u => cities.Contains(u.City))
    .ToListAsync();
```

### 3.2 Select 投影 — DTO 映射

```csharp
// 在数据库层直接投影，不加载完整实体
var userDtos = await context.Users
    .Where(u => u.IsActive)
    .Select(u => new UserDto
    {
        Id = u.Id,
        Name = u.Name,
        Email = u.Email,
        RoleNames = u.Roles.Select(r => r.Name).ToList()
    })
    .ToListAsync();
```

---

## 实战练习清单

- [ ] 用 C# 值类型创建 `Point`、`Money` 结构体
- [ ] 用 C# 引用类型创建 `User`、`Role` 类，练习引用复制行为
- [ ] 创建 LINQ 链式查询：过滤 + 排序 + 分组 + 投影
- [ ] 实现一个异步方法，并行调用 3 个 API 并汇总结果
- [ ] 用 `Func<T, R>` 和 `Action<T>` 替代回调函数
- [ ] 编写 3 个字符串扩展方法
- [ ] 用模式匹配重构 switch 语句

## 阶段验收问题

- `var` 和 `any` 最大区别是什么？
- `record` 为什么适合 DTO，而 Entity 通常还是用 `class`？
- LINQ 的延迟执行什么时候会真正触发？
- 为什么 Web API 代码里要避免 `.Result`？
- `IEnumerable<T>`、`IQueryable<T>` 和 `List<T>` 的学习重点分别是什么？

## 下一步

完成本阶段后，进入 [二、ASP.NET Core 框架](02-ASPNET-Core框架.md)。
