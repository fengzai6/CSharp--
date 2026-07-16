import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const CsharpLinqRecordLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: {
  completedChecklistIds: string[];
  onToggleChecklistItem: (checklistItemId: string) => void;
}) => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能用 LINQ 处理集合操作（过滤、排序、投影、分组），理解延迟执行的原理，并能用 record 定义简洁的 DTO，区分它与 class 的使用场景。
      </p>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          上一节已经在 <code>TaskHub.Core</code> 建立了任务、项目和权限相关类型。本节继续用这些类型练 LINQ 和 <code>record</code>，为后面的任务列表接口和 EF Core 投影做准备。
        </p>
      </TeacherTask>

      <h3>LINQ — 语言级的查询能力</h3>
      <p>
        LINQ 是 C# 最强大的特性之一，它把查询变成了语言的第一公民。列表、数据库、XML、JSON
        都用同一套查询语法。
      </p>

      <LessonCode
        code={`// 过滤（Where）— 类似 Array.prototype.filter
var openItems = workItems.Where(item => item.Status != WorkItemStatus.Done);

// 排序（OrderBy / ThenBy）
var sorted = workItems
    .OrderBy(item => item.DueDate)
    .ThenByDescending(item => item.UpdatedAt);

// 投影（Select）— 类似 Array.prototype.map
var titles = workItems.Select(item => item.Title).ToList();

// 分组（GroupBy）
var byStatus = workItems.GroupBy(item => item.Status)
    .Select(group => new { Status = group.Key, Count = group.Count() });`}
        language="csharp"
        title="LINQ 基础操作"
      />

      <h4>链式调用 vs 查询表达式</h4>
      <LessonCode
        code={`// 方法语法（链式，推荐）
var result = workItems
    .Where(item => item.ProjectId == projectId)
    .OrderBy(item => item.DueDate)
    .Select(item => item.Title.ToUpper())
    .Take(10);

// 查询表达式（SQL 风格）
var result = from item in workItems
             where item.ProjectId == projectId
             orderby item.DueDate
             select item.Title.ToUpper();`}
        language="csharp"
        title="两种 LINQ 写法"
      />

      <h4>延迟执行 vs 立即执行</h4>
      <LessonCode
        code={`// 延迟执行：不真正查询，直到遍历时才执行
var query = workItems.Where(item => item.Status == WorkItemStatus.InProgress);

// 立即执行：查询已执行，返回结果
var list = workItems.Where(item => item.Status == WorkItemStatus.InProgress).ToList();
var count = workItems.Where(item => item.Status == WorkItemStatus.InProgress).Count();
var first = workItems.Where(item => item.Status == WorkItemStatus.InProgress).FirstOrDefault();`}
        language="csharp"
        title="延迟执行与立即执行"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已确认 LINQ 查询在 <code>foreach</code>、<code>ToList()</code>、
            <code>Count()</code> 这类操作前不会真正执行。
          </p>
        }
        id="csharp-linq-deferred"
        title="验证 LINQ 延迟执行"
        onToggleChecklistItem={onToggleChecklistItem}
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
      <p>
        C# 有<strong>两种 switch</strong>：
        <code>switch</code> <strong>语句</strong>（传统写法，处理控制流）
        和 <code>switch</code> <strong>表达式</strong>（C# 8+，用于求值）。
        两者变量位置相反——语句沿用 C 风格 <code>switch(x)</code>，表达式写成 <code>x switch {'{}'}</code> 是因为它本质上是表达式，放在赋值/返回的位置更自然。
      </p>
      <LessonCode
        code={`// switch 表达式：一个值进、一个值出（类似更强大的三元运算符）
// 适合把输入映射成输出，每个分支必须返回结果
string GetStatus(int code) => code switch
{
    200 => "OK",
    400 => "Bad Request",
    401 or 403 => "Unauthorized",  // 匹配多个值
    >= 500 => "Server Error",       // 范围匹配
    _ => "Unknown"                   // default
};

// switch 语句：根据不同情况执行不同逻辑
// 适合分支里需要做多件事、或需要 when 守卫条件的场景
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
      <p>
        扩展方法可以给已有类型"添加"方法，不需要继承或修改原类型。关键在第一个参数前面的 <code>this</code> 关键字——它告诉编译器这个方法挂在哪个类型上。<code>StringExtensions</code> 只是约定俗成的命名，真正决定"扩展 string"的是 <code>this string str</code>。
      </p>
      <p>
        扩展方法必须写在 <code>static class</code> 里，通常放在 <code>Extensions/</code> 目录下按类型拆分（如 <code>StringExtensions.cs</code>），再通过命名空间引入。
      </p>
      <LessonCode
        code={`using System.Text.RegularExpressions;

// static class + this 关键字 = 扩展方法
public static class StringExtensions
{
    // this string str → 扩展的是 string 类型
    public static bool IsEmail(this string str)
        => Regex.IsMatch(str, @"^[^@]+@[^@]+\\.[^@]+$");
}

// 调用方看起来就像 string 原生方法
"hello@world.com".IsEmail();   // true`}
        language="csharp"
        title="Extensions/StringExtensions.cs"
      />

      <h3>Record 类型 — 值语义 DTO</h3>
      <p>
        C# 9+ 引入的特性，已是 DTO 定义的常用方式，对 TS 开发者尤其自然。位置 record
        默认生成 init-only 属性，但 record 本身不等于强制不可变；如果你显式写 <code>set</code>，它仍然可以被修改。
      </p>
      <LessonCode
        code={`public record WorkItemSummaryDto(
    string Id,
    string ProjectId,
    string Title,
    WorkItemStatus Status,
    string? AssigneeName,
    DateTime? DueDate);

public record PagedResult<T>(IEnumerable<T> Data, int Total, int Page);

var item = new WorkItemSummaryDto("1", "project-1", "接入登录", WorkItemStatus.Todo, null, null);
// with 表达式：创建副本，只改一个字段（等价 TS 的展开语法）
var updated = item with { Status = WorkItemStatus.InProgress };`}
        language="csharp"
        title="record 与 with 表达式"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能用 <code>record</code> 定义 DTO，并用 <code>with</code> 创建只改部分字段的副本。
          </p>
        }
        id="csharp-linq-record-dto"
        title="掌握 record DTO 写法"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <LessonTable
        headers={["特性", "class", "record"]}
        rows={[
          ["相等比较", "引用相等（比较地址）", "值相等（比较内容）"],
          ["不可变性", "需手动写 init / readonly", "位置 record 默认 init-only，显式 set 仍可变"],
          ["克隆", "需手动实现", "with 表达式"],
          ["适用场景", "Entity（EF 需追踪变更）", "DTO / 值对象"],
        ]}
      />
      <TeacherTask title="使用边界">
        <p>
          你的 DTO 定义优先使用 <code>record</code>，Entity 使用{" "}
          <code>class</code>（因为 EF Core 需要追踪实体变更）。这是后续 EF Core
          章节的重要边界。
        </p>
      </TeacherTask>

      <h3>与 EF Core 结合的 LINQ</h3>
      <p>
        在 EF Core 中，LINQ 会被翻译成 SQL。同一个业务需求（比如「任务列表要显示负责人名字」）通常有两种实现路径：
      </p>
      <LessonCode
        code={`// 场景：任务列表需要负责人名字，数据在两张表（WorkItems + Users）

// 方案 A：Include — 加载完整 User 实体
// 适合：后面要改这条任务、改负责人，需要 SaveChanges
var items = await context.WorkItems
    .Include(w => w.Assignee)   // 整个 User 实体进内存，进 Change Tracker
    .ToListAsync();
// items[0].Assignee.Username

// 方案 B：Select 投影 — 只取需要的字段
// 适合：列表只读展示，不改库，少传字段、不进 Change Tracker
var dtos = await context.WorkItems
    .Select(w => new WorkItemSummaryDto(
        w.Id,
        w.Title,
        w.Assignee == null ? null : w.Assignee.Username))  // SQL 只查这一列
    .ToListAsync();`}
        language="csharp"
        title="EF Core 查询：同一个需求的两种路径"
      />

      <h3>写入 TaskHub.Core</h3>
      <p>
        把上面的 record DTO 写入 <code>TaskHub.Core/Models/</code> 目录。两个文件都放在 <code>TaskHub.Core.Models</code> 命名空间下，与上一节的枚举和实体在同一命名空间。
      </p>

      <h4>Models/WorkItemSummaryDto.cs</h4>
      <LessonCode
        code={`using TaskHub.Core.Models;

namespace TaskHub.Core.Models;

public record WorkItemSummaryDto(
    string Id,
    string ProjectId,
    string Title,
    WorkItemStatus Status,
    string? AssigneeName,
    DateTime? DueDate);`}
        language="csharp"
        title="Models/WorkItemSummaryDto.cs"
      />

      <h4>Models/PagedResult.cs</h4>
      <LessonCode
        code={`namespace TaskHub.Core.Models;

public record PagedResult<T>(IEnumerable<T> Data, int Total, int Page);`}
        language="csharp"
        title="Models/PagedResult.cs"
      />

      <p>
        写完运行 <code>dotnet build TaskHub.Core</code> 确认编译通过。
        项目启用了 <code>ImplicitUsings</code>，所以 <code>IEnumerable&lt;T&gt;</code> 和 <code>DateTime</code> 等常用类型会自动可用，不需要额外 <code>using</code>。<code>WorkItemSummaryDto.cs</code>
        中的 <code>using TaskHub.Core.Models;</code> 是冗余的但无妨（同命名空间不报错），清掉也行，保留也行。
      </p>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已把 <code>WorkItemSummaryDto</code> 和 <code>PagedResult&lt;T&gt;</code> 写入 <code>Models/</code> 目录，<code>dotnet build TaskHub.Core</code> 编译通过。
          </p>
        }
        id="csharp-linq-write-files"
        title="写入 DTO 到 TaskHub.Core"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
