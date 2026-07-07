import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const CsharpAsyncLesson = ({
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
        学完本节后，你应该能用 <code>async/await</code> 编写异步方法，理解 <code>Task</code> 与 Promise 的对应关系，区分 I/O 异步和 CPU 计算，并避免用 <code>.Result</code> 或 <code>.Wait()</code> 阻塞异步操作。
      </p>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          前两节已经在 <code>TaskHub.Core</code> 建立了实体、枚举和 DTO。本节补服务接口的异步形状：后续 API、EF Core 和测试都会沿用 <code>Task&lt;T&gt;</code>、<code>CancellationToken</code> 和 <code>Async</code> 命名。
        </p>
      </TeacherTask>

      <h3>async/await 与 Task</h3>
      <p>
        C# 的异步基础模式和 TS 很像，但底层模型完全不同。先看写法，再理解差异。
      </p>

      <LessonCode
        code={`// 基础模式
public async Task<WorkItemSummaryDto?> GetWorkItemAsync(string id)
{
    var response = await httpClient.GetAsync($"/api/work-items/{id}");
    response.EnsureSuccessStatusCode();
    var json = await response.Content.ReadAsStringAsync();
    return JsonSerializer.Deserialize<WorkItemSummaryDto>(json);
}

// 并行执行 — 类似 Promise.all
public async Task<List<WorkItemSummaryDto?>> GetWorkItemsAsync(string[] ids)
{
    var tasks = ids.Select(id => GetWorkItemAsync(id)).ToArray();
    return (await Task.WhenAll(tasks)).ToList();
}`}
        language="csharp"
        title="异步基础模式"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能写出返回 <code>Task&lt;T&gt;</code> 的异步方法，并用 <code>Task.WhenAll</code>
            表达并行等待。
          </p>
        }
        id="csharp-async-task-when-all"
        title="掌握 Task 异步基础"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h4>与 JS/TS 的核心差异</h4>
      <LessonTable
        headers={["", "JS / TS", "C#"]}
        rows={[
          ["底层模型", "Event Loop 单线程", "线程池"],
          ["await 行为", "在 Event Loop 上排队", "I/O 完成后回调在线程池执行"],
          ["擅长场景", "异步 I/O（单线程）", "I/O 密集（线程池 + async）"],
          ["CPU 密集", "会阻塞单线程", "短任务可 Task.Run，长任务用后台队列 / Worker"],
        ]}
      />

      <LessonCode
        code={`// CPU 绑定操作 — 不要在请求线程里直接跑重计算
public async Task<int> ComputeExpensiveAsync(int n)
{
    // 错误：直接阻塞当前请求线程
    // return HeavyComputation(n);

    // 临时可用：把短时间 CPU 计算放到线程池，并始终 await
    return await Task.Run(() => HeavyComputation(n));
}`}
        language="csharp"
        title="CPU 绑定操作的处理"
      />

      <LessonQuote>
        在 ASP.NET Core 请求链路里，<code>Task.Run()</code> 不是免费的性能优化。长时间 CPU
        任务会继续占用线程池，更适合放到后台队列、<code>BackgroundService</code> 或独立 Worker。
      </LessonQuote>

      <h4>CancellationToken</h4>
      <p>
        Web API 请求取消、客户端断开或超时时，应该把 <code>CancellationToken</code>{" "}
        从 Controller 传到 Service、EF Core 和 HttpClient，避免后台继续做无意义工作。
      </p>
      <LessonCode
        code={`[HttpGet("{id}")]
public async Task<ActionResult<WorkItemSummaryDto>> GetById(
    string id,
    CancellationToken cancellationToken)
{
    var item = await _workItemService.GetByIdAsync(id, cancellationToken);
    return item is null ? NotFound() : Ok(item);
}

public async Task<WorkItemSummaryDto?> GetByIdAsync(
    string id,
    CancellationToken cancellationToken)
{
    return await _context.WorkItems
        .AsNoTracking()
        .Where(item => item.Id == id)
        .Select(item => new WorkItemSummaryDto(
            item.Id,
            item.ProjectId,
            item.Title,
            item.Status,
            item.Assignee == null ? null : item.Assignee.Username,
            item.DueDate))
        .FirstOrDefaultAsync(cancellationToken);
}`}
        language="csharp"
        title="传递 CancellationToken"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能区分 I/O 异步和 CPU 计算，并知道 Web API 代码里不能用
            <code>.Result</code> / <code>.Wait()</code> 阻塞异步链路。
          </p>
        }
        id="csharp-async-no-blocking"
        title="避免阻塞异步"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <TeacherTask title="Async/Await 黄金法则">
        <ol>
          <li>
            <strong>I/O 绑定</strong> → 直接用 async/await（HTTP、数据库、文件）
          </li>
          <li>
            <strong>CPU 绑定</strong> → 用 Task.Run() 或 Parallel
          </li>
          <li>
            <strong>请求取消</strong> → 传递 CancellationToken 到数据库和 HTTP 调用
          </li>
          <li>
            <strong>不要 .Result 或 .Wait()</strong> → 会产生死锁，始终 await
          </li>
          <li>
            <strong>ConfigureAwait(false)</strong> →
            库代码中使用，避免不必要的上下文切换
          </li>
        </ol>
      </TeacherTask>

      <LessonQuote>
        在 Web API 代码里使用 <code>.Result</code> 或 <code>.Wait()</code>{" "}
        是最常见的异步错误，会在高并发下导致线程池耗尽甚至死锁。只要方法链里有异步，就一路{" "}
        <code>async</code>/<code>await</code> 到底。
      </LessonQuote>

      <h3>委托、事件与 Lambda</h3>
      <p>
        C# 的 <code>Func&lt;T, R&gt;</code> 类似 TS 的函数签名{" "}
        <code>(T) =&gt; R</code>，<code>Action&lt;T&gt;</code> 类似{" "}
        <code>(T) =&gt; void</code>。Lambda 语法和 TS 完全一致。
      </p>

      <LessonCode
        code={`// Func / Action — 内置委托，最常用
Func<int, int, int> add = (a, b) => a + b;
Action<string> log = msg => Console.WriteLine(msg);
Func<string, WorkItem> createItem = title => new WorkItem(Guid.NewGuid().ToString(), "project-1", title);

int result = add(3, 4);  // 7
log("hello");`}
        language="csharp"
        title="Func 与 Action"
      />

      <LessonCode
        code={`public class WorkItemManager
{
    // 事件声明
    public event EventHandler<WorkItemChangedEventArgs>? WorkItemChanged;

    protected virtual void OnWorkItemChanged(WorkItem item, string action)
    {
        WorkItemChanged?.Invoke(this, new WorkItemChangedEventArgs(item, action));
    }
}`}
        language="csharp"
        title="事件"
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>
          <code>var</code> 和 <code>any</code> 最大区别是什么？
        </li>
        <li>
          <code>record</code> 为什么适合 DTO，而 Entity 通常还是用{" "}
          <code>class</code>？
        </li>
        <li>LINQ 的延迟执行什么时候会真正触发？</li>
        <li>
          为什么 Web API 代码里要避免 <code>.Result</code>？
        </li>
        <li>为什么 CancellationToken 要从 Controller 一路传到数据库查询？</li>
      </ul>

      <TeacherTask title="TaskHub 本节产物">
        <p>
          到这里，C# 核心章节已经为 TaskHub 准备好领域类型、DTO、LINQ 投影和异步服务形状。下一章进入 <code>TaskHub.Api</code>，把这些 Core 类型接到 HTTP Controller、DI 和验证流程里。
        </p>
      </TeacherTask>
    </LessonShell>
  );
};
