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
      <p>
        先记住三条命名与返回类型约定——后面 EF Core、HttpClient、Service 接口都会反复出现：
      </p>
      <ul>
        <li>
          <strong>方法名加 <code>Async</code> 后缀</strong>：
          <code>GetWorkItemAsync</code> 一眼告诉调用方「这是异步方法，要 <code>await</code>」。
          TS 里没有强制约定；C# 社区把它当规范，库和框架都这么写。
        </li>
        <li>
          <strong>
            返回 <code>Task</code> 或 <code>Task&lt;T&gt;</code>
          </strong>
          ：无返回值用 <code>Task</code>（≈ <code>Promise&lt;void&gt;</code>），有返回值用{" "}
          <code>Task&lt;T&gt;</code>（≈ <code>Promise&lt;T&gt;</code>）。
          写了 <code>async</code> 的方法，编译器会自动包成 Task，你不必 <code>return Task.FromResult(...)</code>。
        </li>
        <li>
          <strong>禁止 <code>async void</code></strong>（事件处理器除外）：
          TS 的 <code>async function</code> 总是返回 Promise，调用方还能 <code>.catch</code>。
          C# 的 <code>async void</code> 不返回 Task，异常会直接冲到调用线程，几乎无法捕获。
          只在 UI / 事件回调里不得不用时才写 <code>async void</code>。
        </li>
      </ul>

      <LessonTable
        headers={["C#", "TS / JS 近似", "说明"]}
        rows={[
          ["Task", "Promise<void>", "无结果的异步操作"],
          ["Task<T>", "Promise<T>", "有结果的异步操作"],
          ["await task", "await promise", "写法几乎一样"],
          ["Task.WhenAll(tasks)", "Promise.all(promises)", "等全部完成，返回结果数组"],
          ["Task.WhenAny(tasks)", "Promise.race(promises)", "等第一个完成（返回的是那个 Task，不是结果本身）"],
          ["Task.FromResult(v)", "Promise.resolve(v)", "已完成的 Task，立刻有值"],
          ["Task.CompletedTask", "Promise.resolve()", "已完成、无返回值的 Task"],
          ["Task.Run(() => ...)", "无直接对应", "把 CPU 工作丢到线程池（见下文）"],
        ]}
      />

      <LessonCode
        code={`// 返回 Task<T?> — 有结果；方法名 Async 后缀是约定
public async Task<WorkItemSummaryDto?> GetWorkItemAsync(string id)
{
    // GetAsync 返回 Task<HttpResponseMessage>，await 后拿响应
    var response = await httpClient.GetAsync($"/api/work-items/{id}");
    // 非 2xx 直接抛 HttpRequestException（类似 fetch 后自己判 !res.ok 再 throw）
    response.EnsureSuccessStatusCode();
    // 读响应体也是异步 I/O
    var json = await response.Content.ReadAsStringAsync();
    // 同步反序列化；System.Text.Json 的 Deserialize，≈ JSON.parse + 类型
    return JsonSerializer.Deserialize<WorkItemSummaryDto>(json);
}

// 并行 — 类似 Promise.all
public async Task<List<WorkItemSummaryDto?>> GetWorkItemsAsync(string[] ids)
{
    // Select 立刻调用 GetWorkItemAsync → 每个请求已经发出去了
    // 这里得到的是 Task[]，不是「还没跑的函数」
    var tasks = ids.Select(id => GetWorkItemAsync(id)).ToArray();
    // WhenAll 等全部完成，返回结果数组
    return (await Task.WhenAll(tasks)).ToList();
}`}
        language="csharp"
        title="异步基础模式"
      />
      <p>
        对照上面两段代码，逐行在干什么：
      </p>
      <ul>
        <li>
          <code>httpClient.GetAsync(...)</code>：发 HTTP 请求，返回{" "}
          <code>Task&lt;HttpResponseMessage&gt;</code>。类似 <code>fetch</code>，但不会自动抛非 2xx。
        </li>
        <li>
          <code>EnsureSuccessStatusCode()</code>：状态码不是 2xx 就抛异常。
          TS 里你常写 <code>if (!res.ok) throw ...</code>，这里一行搞定。
        </li>
        <li>
          <code>ReadAsStringAsync()</code>：异步读响应体字符串。对应{" "}
          <code>await res.text()</code>。
        </li>
        <li>
          <code>JsonSerializer.Deserialize&lt;T&gt;(json)</code>：把 JSON 变成强类型对象。
          类似 <code>JSON.parse</code>，但带类型参数；属性名默认大小写不敏感匹配。
        </li>
        <li>
          <code>ids.Select(id =&gt; GetWorkItemAsync(id))</code>：
          <strong>调用当下就启动</strong>每个异步请求，得到已经在跑的 Task 集合。
          不是「把函数存起来晚点再调」。
        </li>
        <li>
          <code>Task.WhenAll(tasks)</code>：等这一批 Task 全部完成。
          等价 <code>Promise.all([p1, p2])</code>——传的是已经启动的 Promise，
          <strong>不是</strong> <code>Promise.all([() =&gt; fetch(...), ...])</code> 那种函数数组。
        </li>
      </ul>
      <LessonQuote>
        并行的关键：先把 Task 全部启动，再 <code>WhenAll</code>。
        如果写成 <code>foreach</code> 里一个个 <code>await GetWorkItemAsync(id)</code>，就是串行，总耗时是累加而不是取最长。
      </LessonQuote>

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
        一句话类比线程池：C# 服务器有一组可复用的工作线程。
        <strong>I/O 等待</strong>（HTTP、数据库、文件）期间线程可以去干别的，所以直接{" "}
        <code>await</code> 就对了，不必 <code>Task.Run</code>。
        <strong>CPU 重计算</strong>会一直占着当前线程；请求链路里才考虑{" "}
        <code>Task.Run</code> 把它挪到线程池另一条线上，避免堵请求。
      </p>

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
        C# 的「委托」就是<strong>类型化的函数引用</strong>。
        最常用两个内置委托：
      </p>
      <ul>
        <li>
          <code>Func&lt;T1, T2, TResult&gt;</code> ≈ TS 的{" "}
          <code>(t1: T1, t2: T2) =&gt; TResult</code>——有返回值
        </li>
        <li>
          <code>Action&lt;T&gt;</code> ≈ TS 的 <code>(t: T) =&gt; void</code>——无返回值
        </li>
      </ul>
      <p>
        Lambda 写法 <code>(a, b) =&gt; a + b</code> 和 TS 几乎一样。
        LINQ 的 <code>Where</code> / <code>Select</code> 参数，底层就是这些委托类型。
      </p>

      <LessonCode
        code={`// Func<入参..., 返回值>  — 有返回值
// Action<入参...>        — 无返回值（void）
Func<int, int, int> add = (a, b) => a + b;          // (a, b) => number
Action<string> log = msg => Console.WriteLine(msg); // (msg) => void
Func<string, WorkItem> createItem =
    title => new WorkItem(Guid.NewGuid().ToString(), "project-1", title);

int result = add(3, 4);  // 7 — 委托当普通函数调
log("hello");`}
        language="csharp"
        title="Func 与 Action"
      />

      <p>
        <code>event</code> 是在委托外面再加一层<strong>受限访问</strong>：
        外部只能 <code>+=</code> / <code>-=</code> 订阅或取消，
        <strong>不能</strong>直接赋值覆盖，也不能从类外随意 <code>Invoke</code>。
        类似「只暴露 on/off 的发布订阅」，不是普通函数字段。
      </p>
      <LessonCode
        code={`public class WorkItemManager
{
    // event = 受限的多播委托；外部只能 += / -=
    public event EventHandler<WorkItemChangedEventArgs>? WorkItemChanged;

    protected virtual void OnWorkItemChanged(WorkItem item, string action)
    {
        // ?.Invoke：没有订阅者时 WorkItemChanged 为 null，直接跳过
        // 有订阅者时，按订阅顺序依次调用所有处理函数
        WorkItemChanged?.Invoke(this, new WorkItemChangedEventArgs(item, action));
    }
}

// 订阅 / 取消（类外部）
// manager.WorkItemChanged += (sender, e) => { /* 处理 */ };
// manager.WorkItemChanged -= handler;`}
        language="csharp"
        title="事件"
      />
      <p>
        <code>EventHandler&lt;TEventArgs&gt;</code> 是框架约定的事件签名：
        <code>(object? sender, TEventArgs e)</code>。
        <code>sender</code> 是发布者，<code>e</code> 是事件数据。
        <code>?.Invoke(...)</code> 就是「有人订阅才通知」——空条件调用，避免空引用。
      </p>
      <LessonQuote>
        业务代码里你更常<strong>订阅</strong>框架事件（如 SignalR、UI），
        自己声明 <code>event</code> 的场景不多。先会读、会 <code>+=</code> 即可。
      </LessonQuote>

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
