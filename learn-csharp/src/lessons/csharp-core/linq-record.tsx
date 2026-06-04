import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const CsharpLinqRecordLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
  return (
    <LessonShell>
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

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="csharp-linq-record-checklist"
        items={[
          "创建 LINQ 链式查询：过滤 + 排序 + 分组 + 投影",
          "用模式匹配（switch 表达式）重构一段 if-else",
          "把一个 DTO 改写成 record，并用 with 表达式生成副本",
          "用 record 和 class 各写一个类型，验证相等比较的差异",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
