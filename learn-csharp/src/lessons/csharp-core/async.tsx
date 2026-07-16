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

      <p>
        <code>HeavyComputation</code> 是普通同步方法，本身不返回 Task，不能直接{" "}
        <code>await</code>。它会堵在当前请求线程上。
        <code>Task.Run</code> 把计算搬到线程池，<code>await</code> 再等结果——两步各管一件事。
      </p>
      <LessonCode
        code={`// HeavyComputation 是同步方法，不能直接 await
int HeavyComputation(int n) { /* 重计算 */ }

public async Task<int> ComputeExpensiveAsync(int n)
{
    // 错误 1：直接调用 → 堵在请求线程上
    // return HeavyComputation(n);

    // 错误 2：Task.Run 但不 await → 请求立刻返回，结果还没算完
    // return Task.Run(() => HeavyComputation(n));

    // 正确：Task.Run 搬到线程池 + await 等结果
    return await Task.Run(() => HeavyComputation(n));
}`}
        language="csharp"
        title="CPU 绑定操作的处理"
      />
      <LessonQuote>
        在 ASP.NET Core 请求链路里，<code>Task.Run()</code> 不是免费的性能优化。长时间 CPU
        任务会继续占用线程池，更适合放到后台队列、<code>BackgroundService</code> 或独立 Worker。
        短时间计算用 <code>Task.Run</code> 是临时手段，不是默认方案。
      </LessonQuote>

      <h4>CancellationToken — 请求取消信号</h4>
      <p>
        客户端关掉页面、请求超时、或用户取消操作时，ASP.NET Core 会给当前请求一个{" "}
        <code>CancellationToken</code>。你要做的是把它<strong>一路往下传</strong>：
        Controller → Service → EF Core / HttpClient。底层库收到取消信号后，会停掉还在跑的数据库查询或 HTTP 调用，避免「人已经走了，服务器还在白干活」。
      </p>
      <p>
        不传会怎样？用户刷新页面取消了旧请求，你的服务仍然会把 SQL 跑完、把外部 API 调完，浪费连接和线程。
        ASP.NET Core 会自动把请求的 token 注入到 Action 参数里，你只要声明参数并继续传递即可。
      </p>
      <LessonCode
        code={`// ASP.NET Core 自动注入请求级 CancellationToken
[HttpGet("{id}")]
public async Task<ActionResult<WorkItemSummaryDto>> GetById(
    string id,
    CancellationToken cancellationToken)  // 客户端断开时，这个 token 会被取消
{
    // 继续往下传，不要在中间丢弃
    var item = await _workItemService.GetByIdAsync(id, cancellationToken);
    return item is null ? NotFound() : Ok(item);
}

public async Task<WorkItemSummaryDto?> GetByIdAsync(
    string id,
    CancellationToken cancellationToken)
{
    // EF Core / HttpClient 的 *Async 方法都支持 token
    // 取消后会抛 OperationCanceledException，请求自然结束
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

      <h4>不要 .Result / .Wait() — 始终 await</h4>
      <p>
        <code>.Result</code> 和 <code>.Wait()</code> 是<strong>同步阻塞</strong>等 Task 完成。
        问题不在「拿结果」，而在：当前线程被堵死，等异步回调；而某些环境下回调又要回到这个被堵死的线程才能继续——两边互相等，就是死锁。
      </p>
      <p>
        在 ASP.NET Core 里更常见的伤害是：请求线程被占着不放，高并发时线程池耗尽，整站变慢。
        正确做法：方法链里只要出现异步，就一路 <code>async</code>/<code>await</code> 到底，不要中途用同步方式「卡住等」。
      </p>
      <LessonCode
        code={`// ❌ 错误：同步阻塞异步
var item = GetWorkItemAsync(id).Result;   // 堵当前线程
GetWorkItemAsync(id).Wait();              // 同上
var item2 = GetWorkItemAsync(id).GetAwaiter().GetResult(); // 还是阻塞

// ✅ 正确：一路 await
var item3 = await GetWorkItemAsync(id);`}
        language="csharp"
        title="永远 await，不要 .Result / .Wait"
      />

      <h4>ConfigureAwait(false) — 库代码才需要关心</h4>
      <p>
        <code>await</code> 默认会尝试<strong>回到原来的同步上下文</strong>（比如旧版 ASP.NET、UI 线程）继续执行。
        在通用库 / NuGet 包里，你通常不需要这个上下文，回到它只是多余开销，甚至在错误场景下加剧死锁。
      </p>
      <p>
        所以规则很简单：
      </p>
      <ul>
        <li>
          <strong>写库代码</strong>（可复用的类库）：用{" "}
          <code>await xxx.ConfigureAwait(false)</code>
        </li>
        <li>
          <strong>写 ASP.NET Core 应用代码</strong>（Controller、Service）：一般<strong>不用写</strong>。
          ASP.NET Core 本身没有旧式同步上下文，默认 await 就够了。
        </li>
      </ul>
      <LessonCode
        code={`// 库代码示例：不依赖 HttpContext / UI 线程
public async Task<string> ReadConfigAsync(string path)
{
    // ConfigureAwait(false) = 完成后不必回到调用方原来的上下文
    var text = await File.ReadAllTextAsync(path).ConfigureAwait(false);
    return text.Trim();
}

// ASP.NET Core 业务代码：直接 await 即可，不必到处写 ConfigureAwait
public async Task<WorkItemSummaryDto?> GetByIdAsync(string id, CancellationToken ct)
{
    return await _context.WorkItems
        .AsNoTracking()
        .FirstOrDefaultAsync(item => item.Id == id, ct);
}`}
        language="csharp"
        title="ConfigureAwait：库写 false，应用通常不写"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能区分 I/O 异步和 CPU 计算，知道 CancellationToken 要一路下传，
            并且 Web API 代码里不能用 <code>.Result</code> / <code>.Wait()</code> 阻塞异步链路。
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
            <strong>CPU 绑定</strong> → 短任务可用 Task.Run，长任务放后台队列 / Worker
          </li>
          <li>
            <strong>请求取消</strong> → CancellationToken 从 Controller 传到 DB / HTTP
          </li>
          <li>
            <strong>不要 .Result 或 .Wait()</strong> → 同步阻塞异步，始终 await
          </li>
          <li>
            <strong>ConfigureAwait(false)</strong> → 库代码用；ASP.NET Core 业务代码通常不写
          </li>
        </ol>
      </TeacherTask>

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
