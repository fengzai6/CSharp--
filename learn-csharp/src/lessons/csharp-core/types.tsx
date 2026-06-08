import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const CsharpTypesLesson = () => {
  return (
    <LessonShell>
      <h3>本章你要掌握什么</h3>
      <p>
        学完本章后，你应该能把 TypeScript 中常见的业务逻辑写成 C#：定义类型、处理空值、写
        DTO、使用 LINQ 查询集合、编写异步方法。重点不是背语法，而是建立 C# 的类型、空值、值/引用、LINQ
        和 Task 思维。
      </p>

      <TeacherTask title="老师提示">
        <p>
          你已经有后端经验，所以不要在 <code>if</code>、<code>for</code>
          、变量声明这种基础语法上消耗太多时间。真正需要反复练的是：可空引用类型、值类型和引用类型的赋值差异、LINQ
          延迟执行、<code>async Task&lt;T&gt;</code> 的写法，以及 Entity 用 class、DTO
          用 record 的边界。
        </p>
      </TeacherTask>

      <h3>从 TypeScript 到 C#：变量与类型</h3>
      <p>
        <code>var</code> 不是 <code>any</code>。它在编译时确定类型，之后不可变。
      </p>

      <LessonCode
        code={`// TypeScript:
let name: string = "hello";
const MAX = 100;
var maybe = 42; // inferred: number

// C#:
string name = "hello";
const int Max = 100;
var maybe = 42; // 编译期推断为 int，不是 any!

var x = 42;
x = "hello"; // 编译错误！x 是 int`}
        language="csharp"
        title="变量声明"
      />

      <h4>基本类型对照</h4>
      <LessonTable
        headers={["C#", "TypeScript", "说明"]}
        rows={[
          ["int / long", "number", "整型，int 是 32 位，long 是 64 位"],
          ["double / float", "number", "浮点，float 需加 f 后缀"],
          ["decimal", "无直接对应", "高精度小数，适合金额计算"],
          ["bool", "boolean", "布尔，没有 truthy/falsy"],
          ["char", "string（1 个字符）", "单字符，用单引号 'A'"],
          ["string", "string", "引用类型，不可变"],
          ["DateTime", "Date", "日期时间"],
        ]}
      />

      <h4>空值处理</h4>
      <LessonCode
        code={`// C# 8+ 可空引用类型：
string name = null;        // 编译警告（非空）
string? name = null;       // 编译通过（可空）
string nonNull = name!;    // 强制非空（告诉编译器别警告了）`}
        language="csharp"
        title="可空引用类型"
      />
      <LessonQuote>
        在项目 <code>.csproj</code> 中添加 <code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code>{" "}
        启用可空引用类型检查。不要忽略 Nullable 警告。
      </LessonQuote>

      <h3>值类型 vs 引用类型 — 最重要的概念</h3>
      <p>这是 TS 开发者最需要切换的思维。</p>

      <LessonCode
        code={`// ============ 值类型：复制值 ============
int x = 5;
int y = x;      // y 复制了 x 的值
y = 10;
Console.WriteLine(x); // 输出 5（x 没变）

struct Point { public int X; public int Y; }
Point p1 = new Point { X = 1, Y = 2 };
Point p2 = p1;       // 复制整个结构体
p2.X = 99;
Console.WriteLine(p1.X); // 输出 1（p1 没变）

// ============ 引用类型：复制引用 ============
var list1 = new List<int> { 1, 2, 3 };
var list2 = list1;     // 复制的是引用（指向同一个对象）
list2.Add(4);
Console.WriteLine(list1.Count); // 输出 4（list1 也变了！）`}
        language="csharp"
        title="值类型与引用类型的赋值差异"
      />

      <h4>核心规则</h4>
      <LessonTable
        headers={["类型", "分类", "赋值行为"]}
        rows={[
          ["int/long/float/double/bool/char/decimal", "值类型", "复制值"],
          ["struct", "值类型", "复制整个结构"],
          ["enum", "值类型", "复制值"],
          ["class", "引用类型", "复制引用"],
          ["interface", "引用类型", "复制引用"],
          ["string", "引用类型（不可变）", "复制引用，修改时创建新对象"],
          ["array / List<T>", "引用类型", "复制引用"],
        ]}
      />

      <TeacherTask title="对照 TS 理解">
        <p>
          TS 基本类型（number/string/boolean）对应 C# 值类型；TS 对象对应 C#
          引用类型（class）。但 C# 多了一层 <strong>struct</strong>
          （值类型对象），让你能创建轻量级的值类型数据容器，赋值时完全拷贝，不会产生共享状态的
          bug。
        </p>
      </TeacherTask>

      <h3>类与接口</h3>
      <LessonCode
        code={`public class User
{
    private string _name;

    // 属性（公共访问口）
    public string Name
    {
        get => _name;
        set => _name = value.ToUpper();
    }

    // C# 9+ 不可变属性（init 只能在构造时设置）
    public string Id { get; init; }

    public User(string name) => Name = name;

    // 虚方法（允许子类重写）
    public virtual string Greet() => $"Hello, I'm {Name}";
}`}
        language="csharp"
        title="类 = 引用类型"
      />

      <LessonCode
        code={`// 接口 = 纯契约，不包含字段、构造函数
public interface IUserRepository
{
    Task<User> GetByIdAsync(string id);
    Task<List<User>> GetAllAsync();
}

// C# 8+ 默认接口实现
public interface ILogger
{
    void Log(string message);
    public void LogError(string message) => Log($"ERROR: {message}");
}`}
        language="csharp"
        title="接口"
      />

      <h4>abstract class vs interface</h4>
      <LessonTable
        headers={["能力", "abstract class", "interface"]}
        rows={[
          ["可以有实现的方法", "✅", "C# 8+ ✅（默认实现）"],
          ["可以有字段", "✅", "❌"],
          ["可以有构造函数", "✅", "❌"],
          ["可以多继承/多实现", "❌ 单继承", "✅ 多实现"],
          ["访问修饰符", "protected 可用", "全部 public"],
        ]}
      />

      <h3>枚举与标志</h3>
      <LessonCode
        code={`public enum Role { Guest = 0, Member = 1, Admin = 2 }

// 带 [Flags] 的标志枚举（可组合）
[Flags]
public enum Permission
{
    None = 0,
    Read = 1,       // 0001
    Write = 2,      // 0010
    Delete = 4,     // 0100
    Execute = 8     // 1000
}

Permission userPerm = Permission.Read | Permission.Write;
bool canRead = (userPerm & Permission.Read) == Permission.Read;`}
        language="csharp"
        title="枚举"
      />
      <p>
        你的 TS 项目里用 <code>as const</code> 替代 enum，C# 有原生的{" "}
        <code>enum</code>，更强大且性能更好。
      </p>

      <h3>泛型</h3>
      <LessonCode
        code={`public class Repository<T> where T : class
{
    private List<T> _items = new();
    public void Add(T item) => _items.Add(item);
}

// 多个约束
public class CacheService<TKey, TValue>
    where TKey : notnull
    where TValue : class
{
    // ...
}`}
        language="csharp"
        title="泛型与约束"
      />
      <TeacherTask title="与 TS 的本质差异">
        <p>
          TS 泛型是类型擦除（编译期），C# 泛型是 reification（运行期）。这意味着 C# 的{" "}
          <code>List&lt;int&gt;</code> 和 <code>List&lt;string&gt;</code>{" "}
          在运行期是<strong>不同类型</strong>，可以有类型特定的优化。
        </p>
      </TeacherTask>

      <LessonStep
        title="实战：理解值类型与引用类型"
        steps={[
          {
            title: "创建值类型结构体并验证复制行为",
            content: (
              <p>
                创建一个 <code>Point</code> 结构体（struct），验证值类型赋值时会复制整个值，修改新变量不影响原变量。
              </p>
            ),
            code: `struct Point
{
    public int X;
    public int Y;
}

// 测试代码
var p1 = new Point { X = 1, Y = 2 };
var p2 = p1;  // 复制整个结构体
p2.X = 99;
Console.WriteLine(p1.X);  // 输出 1（p1 没变）
Console.WriteLine(p2.X);  // 输出 99`,
            codeLanguage: "csharp",
            codeTitle: "值类型复制行为",
            checkpoints: [
              "创建 Point 结构体，包含 X 和 Y 两个字段",
              "赋值 p2 = p1 后，修改 p2.X 不影响 p1.X",
              "理解值类型赋值是深拷贝（复制值）",
            ],
            reference:
              "值类型（struct）适合小数据（如坐标、颜色、金额），因为复制成本低。大数据用 class（引用类型），避免频繁复制。",
          },
          {
            title: "创建引用类型类并验证引用复制",
            content: (
              <p>
                创建一个 <code>User</code> 类（class），验证引用类型赋值时只复制引用（指针），修改新变量会影响原变量。
              </p>
            ),
            code: `class User
{
    public string Name { get; set; }
    public int Age { get; set; }
}

// 测试代码
var u1 = new User { Name = "Alice", Age = 30 };
var u2 = u1;  // 复制引用（指针）
u2.Name = "Bob";
Console.WriteLine(u1.Name);  // 输出 "Bob"（u1 被影响了！）
Console.WriteLine(u2.Name);  // 输出 "Bob"`,
            codeLanguage: "csharp",
            codeTitle: "引用类型复制行为",
            checkpoints: [
              "创建 User 类，包含 Name 和 Age 属性",
              "赋值 u2 = u1 后，修改 u2.Name 会同时影响 u1.Name",
              "理解引用类型赋值是浅拷贝（复制引用，不复制对象本身）",
            ],
            reference:
              "这是 TS 开发者最需要适应的点。TS 的对象都是引用类型，但 C# 有值类型（struct）和引用类型（class）的区别。选错类型会导致意外的副作用或性能问题。",
          },
          {
            title: "启用可空引用类型检查",
            content: (
              <p>
                在 <code>.csproj</code> 文件中添加 <code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code>，体验编译器如何帮你发现潜在的空引用错误。
              </p>
            ),
            code: `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`,
            codeLanguage: "xml",
            codeTitle: ".csproj 配置",
            checkpoints: [
              "在 .csproj 中添加 <Nullable>enable</Nullable>",
              "编译项目，看到关于可能为 null 的警告",
              "理解 string? 表示可空，string 表示非空",
            ],
            reference:
              "启用后，string name = null; 会编译警告。必须写成 string? name = null; 才能通过。这是 C# 的严格空值检查，类似 TS 的 strictNullChecks。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经理解了 C# 类型系统的核心差异。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                值类型（struct）赋值时复制整个值，适合小数据
              </li>
              <li>
                引用类型（class）赋值时复制引用，多个变量可能指向同一对象
              </li>
              <li>
                var 是编译期类型推断，不是 any（推断后类型不可变）
              </li>
              <li>
                启用 Nullable 检查可以在编译期发现潜在的空引用错误
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能区分值类型和引用类型，理解赋值行为差异，启用 Nullable 检查。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
