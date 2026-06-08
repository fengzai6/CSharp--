import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const CsharpLinqRecordLesson = () => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能用 LINQ 处理集合操作（过滤、排序、投影、分组），理解延迟执行的原理，并能用 record 定义简洁的 DTO，区分它与 class 的使用场景。
      </p>

      <h3>LINQ — 语言级的查询能力</h3>
      <p>
        LINQ 是 C# 最强大的特性之一，它把查询变成了语言的第一公民。列表、数据库、XML、JSON
        都用同一套查询语法。
      </p>

      <LessonCode
        code={`// 过滤（Where）— 类似 Array.prototype.filter
var beijingUsers = users.Where(u => u.City == "Beijing");

// 排序（OrderBy / ThenBy）
var sorted = users.OrderBy(u => u.Age).ThenBy(u => u.Name);

// 投影（Select）— 类似 Array.prototype.map
var names = users.Select(u => u.Name).ToList();

// 分组（GroupBy）
var byCity = users.GroupBy(u => u.City)
    .Select(g => new { City = g.Key, Count = g.Count(), AvgAge = g.Average(u => u.Age) });`}
        language="csharp"
        title="LINQ 基础操作"
      />

      <h4>链式调用 vs 查询表达式</h4>
      <LessonCode
        code={`// 方法语法（链式，推荐）
var result = users
    .Where(u => u.Age > 25)
    .OrderBy(u => u.Name)
    .Select(u => u.Name.ToUpper())
    .Take(10);

// 查询表达式（SQL 风格）
var result = from u in users
             where u.Age > 25
             orderby u.Name
             select u.Name.ToUpper();`}
        language="csharp"
        title="两种 LINQ 写法"
      />

      <h4>延迟执行 vs 立即执行</h4>
      <LessonCode
        code={`// 延迟执行：不真正查询，直到遍历时才执行
var query = users.Where(u => u.Age > 25);

// 立即执行：查询已执行，返回结果
var list = users.Where(u => u.Age > 25).ToList();
var count = users.Where(u => u.Age > 25).Count();
var first = users.Where(u => u.Age > 25).FirstOrDefault();`}
        language="csharp"
        title="延迟执行与立即执行"
      />
      <LessonQuote>
        对数据库查询过早 <code>ToList()</code>{" "}
        会导致后面的筛选在内存里执行。在 EF Core 中，尽量让筛选、排序、分页都在{" "}
        <code>ToListAsync()</code> 之前完成，这样才会翻译成 SQL。
      </LessonQuote>

      <h4>常用 LINQ 操作速查</h4>
      <LessonTable
        headers={["操作", "方法", "说明"]}
        rows={[
          ["过滤", ".Where(predicate)", "类似 filter"],
          ["投影", ".Select(selector)", "类似 map"],
          ["排序", ".OrderBy / .OrderByDescending", "升序/降序"],
          ["分页", ".Skip(n) / .Take(n)", "跳过/取前 n 个"],
          ["分组", ".GroupBy(keySelector)", "GROUP BY"],
          ["元素", ".First / .FirstOrDefault / .Single", "获取单个"],
          ["判定", ".Any / .All / .Contains", "条件判断"],
          ["聚合", ".Sum / .Average / .Min / .Max / .Count", "统计"],
          ["转换", ".ToList / .ToArray / .ToDictionary", "立即执行"],
        ]}
      />

      <h3>模式匹配</h3>
      <LessonCode
        code={`// switch 表达式（C# 8+，比 TS switch 更强大）
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
        case User user: Console.WriteLine(user.Name); break;
        case int n when n > 0: Console.WriteLine($"正数 {n}"); break;
        case null: Console.WriteLine("Null"); break;
    }
}`}
        language="csharp"
        title="switch 表达式与类型模式"
      />

      <h3>扩展方法</h3>
      <LessonCode
        code={`// 为现有类型添加方法，不需要继承
public static class StringExtensions
{
    public static bool IsEmail(this string str)
        => Regex.IsMatch(str, @"^[^@]+@[^@]+\\.[^@]+$");
}

// 使用
"hello@world.com".IsEmail();   // true`}
        language="csharp"
        title="扩展方法"
      />

      <h3>Record 类型 — 不可变数据容器</h3>
      <p>
        C# 9+ 引入的特性，已是 DTO 定义的常用方式，对 TS 开发者尤其自然。
      </p>
      <LessonCode
        code={`public record UserDto(string Id, string Username, string Email);
public record PagedResult<T>(IEnumerable<T> Data, int Total, int Page);

var user = new UserDto("1", "alice", "alice@example.com");
// with 表达式：创建副本，只改一个字段（等价 TS 的展开语法）
var updated = user with { Username = "alice_new" };`}
        language="csharp"
        title="record 与 with 表达式"
      />

      <LessonTable
        headers={["特性", "class", "record"]}
        rows={[
          ["相等比较", "引用相等（比较地址）", "值相等（比较内容）"],
          ["不可变性", "需手动写 init", "默认 init 属性"],
          ["克隆", "需手动实现", "with 表达式"],
          ["适用场景", "Entity（EF 需追踪变更）", "DTO / 值对象"],
        ]}
      />
      <TeacherTask title="实战边界">
        <p>
          你的 DTO 定义优先使用 <code>record</code>，Entity 使用{" "}
          <code>class</code>（因为 EF Core 需要追踪实体变更）。这是后续 EF Core
          章节的重要边界。
        </p>
      </TeacherTask>

      <h3>与 EF Core 结合的 LINQ</h3>
      <p>
        在 EF Core 中，LINQ 会被翻译成 SQL。在数据库层直接投影成 DTO，可以避免加载完整实体。
      </p>
      <LessonCode
        code={`// 包含关联数据 — 类似 TypeORM 的 relations
var usersWithRoles = await context.Users
    .Include(u => u.Roles)
    .Where(u => u.IsActive)
    .ToListAsync();

// 在数据库层直接投影成 DTO
var userDtos = await context.Users
    .Where(u => u.IsActive)
    .Select(u => new UserDto
    {
        Id = u.Id,
        Name = u.Name,
        RoleNames = u.Roles.Select(r => r.Name).ToList()
    })
    .ToListAsync();`}
        language="csharp"
        title="LINQ to EF Core"
      />

      <LessonStep
        title="实战：LINQ 与 record"
        steps={[
          {
            title: "创建 LINQ 链式查询",
            content: (
              <p>
                创建一个 User 集合，用 LINQ 实现：过滤（年龄 &gt; 18）→ 排序（按年龄升序）→ 分组（按城市）→ 投影（提取姓名列表）。
              </p>
            ),
            code: `var users = new List<User>
{
    new User("Alice", 25, "Beijing"),
    new User("Bob", 17, "Shanghai"),
    new User("Carol", 30, "Beijing"),
    new User("David", 22, "Shanghai")
};

var result = users
    .Where(u => u.Age > 18)
    .OrderBy(u => u.Age)
    .GroupBy(u => u.City)
    .Select(g => new
    {
        City = g.Key,
        Names = g.Select(u => u.Name).ToList()
    });

foreach (var group in result)
{
    Console.WriteLine($"{group.City}: {string.Join(", ", group.Names)}");
}`,
            codeLanguage: "csharp",
            codeTitle: "LINQ 链式查询",
            checkpoints: [
              "Where 过滤出年龄大于 18 的用户",
              "OrderBy 按年龄升序排序",
              "GroupBy 按城市分组",
              "Select 投影为匿名对象，包含城市和姓名列表",
            ],
            reference:
              "LINQ 是延迟执行的。这些操作不会立即执行，只有在 foreach 或 ToList() 时才真正遍历。这类似 JS 的 Iterator，但更强大。",
          },
          {
            title: "用模式匹配重构 if-else",
            content: (
              <p>
                把传统的 if-else 逻辑改写为 switch 表达式（模式匹配），让代码更简洁。
              </p>
            ),
            code: `// 传统写法
string GetDiscount(int age)
{
    if (age < 18) return "学生票";
    else if (age >= 60) return "老年票";
    else return "全价票";
}

// 模式匹配写法
string GetDiscount(int age) => age switch
{
    < 18 => "学生票",
    >= 60 => "老年票",
    _ => "全价票"
};`,
            codeLanguage: "csharp",
            codeTitle: "模式匹配",
            checkpoints: [
              "用 switch 表达式替代 if-else",
              "用关系模式（< 18, >= 60）简化条件",
              "_ 是通配符，相当于 default",
            ],
            reference:
              "switch 表达式是 C# 8+ 的特性，类似 Rust 的 match。它必须覆盖所有情况（exhaustive），编译器会检查。",
          },
          {
            title: "用 record 定义 DTO",
            content: (
              <p>
                把 class 改写成 record，体验 record 的简洁性和不可变性，并用 with 表达式生成副本。
              </p>
            ),
            code: `// class 写法
class UserDto
{
    public string Id { get; set; }
    public string Name { get; set; }
    public int Age { get; set; }
}

// record 写法（更简洁）
public record UserDto(string Id, string Name, int Age);

// 使用 with 表达式生成副本
var user1 = new UserDto("1", "Alice", 25);
var user2 = user1 with { Age = 26 };  // 只修改 Age，其他字段不变

Console.WriteLine(user1.Age);  // 25
Console.WriteLine(user2.Age);  // 26`,
            codeLanguage: "csharp",
            codeTitle: "record 与 with 表达式",
            checkpoints: [
              "用 record 定义 DTO，一行搞定属性声明",
              "用 with 表达式生成副本，原对象不变",
              "理解 record 默认是不可变的",
            ],
            reference:
              "record 适合 DTO、配置对象、事件消息等不可变数据。class 适合 Entity、聚合根等需要可变性的业务对象。",
          },
          {
            title: "验证 record 和 class 的相等比较差异",
            content: (
              <p>
                用 record 和 class 各定义一个 Point 类型，验证它们的相等比较行为差异。
              </p>
            ),
            code: `// record：值相等
public record PointRecord(int X, int Y);

var r1 = new PointRecord(1, 2);
var r2 = new PointRecord(1, 2);
Console.WriteLine(r1 == r2);  // True（值相等）

// class：引用相等
public class PointClass
{
    public int X { get; set; }
    public int Y { get; set; }
}

var c1 = new PointClass { X = 1, Y = 2 };
var c2 = new PointClass { X = 1, Y = 2 };
Console.WriteLine(c1 == c2);  // False（引用不同）`,
            codeLanguage: "csharp",
            codeTitle: "record vs class 相等比较",
            checkpoints: [
              "record 使用值相等（比较所有字段）",
              "class 使用引用相等（比较对象地址）",
              "理解何时用 record、何时用 class",
            ],
            reference:
              "record 自动实现 Equals、GetHashCode、ToString，非常适合 DTO。但如果需要继承复杂的业务逻辑，用 class。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经掌握了 LINQ 和 record 的核心用法。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                LINQ 链式调用（Where/OrderBy/GroupBy/Select）类似 JS 数组方法
              </li>
              <li>
                LINQ 是延迟执行，只有在 foreach 或 ToList() 时才真正遍历
              </li>
              <li>
                switch 表达式（模式匹配）比 if-else 更简洁，编译器检查完整性
              </li>
              <li>
                record 适合 DTO（值相等、不可变），class 适合 Entity（引用相等、可变）
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能用 LINQ 处理集合、用 switch 表达式重构、用 record 定义 DTO。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
