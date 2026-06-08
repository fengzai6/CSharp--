import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const CsharpAsyncLesson = () => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能用 <code>async/await</code> 编写异步方法，理解 <code>Task</code> 与 Promise 的对应关系，区分 I/O 异步和 CPU 计算，并避免用 <code>.Result</code> 或 <code>.Wait()</code> 阻塞异步操作。
      </p>

      <h3>async/await 与 Task</h3>
      <p>
        C# 的异步基础模式和 TS 很像，但底层模型完全不同。先看写法，再理解差异。
      </p>

      <LessonCode
        code={`// 基础模式
public async Task<User> GetUserAsync(string id)
{
    var response = await httpClient.GetAsync($"/api/users/{id}");
    response.EnsureSuccessStatusCode();
    var json = await response.Content.ReadAsStringAsync();
    return JsonSerializer.Deserialize<User>(json);
}

// 并行执行 — 类似 Promise.all
public async Task<List<User>> GetUsersAsync(string[] ids)
{
    var tasks = ids.Select(id => GetUserAsync(id)).ToArray();
    return (await Task.WhenAll(tasks)).ToList();
}`}
        language="csharp"
        title="异步基础模式"
      />

      <h4>与 JS/TS 的核心差异</h4>
      <LessonTable
        headers={["", "JS / TS", "C#"]}
        rows={[
          ["底层模型", "Event Loop 单线程", "线程池"],
          ["await 行为", "在 Event Loop 上排队", "I/O 完成后回调在线程池执行"],
          ["擅长场景", "异步 I/O（单线程）", "I/O 密集（线程池 + async）"],
          ["CPU 密集", "会阻塞单线程", "用 Task.Run() 或 Parallel"],
        ]}
      />

      <LessonCode
        code={`// CPU 绑定操作 — 不要在请求线程里直接跑重计算
public async Task<int> ComputeExpensiveAsync(int n)
{
    // 错误：直接阻塞当前请求线程
    // return HeavyComputation(n);

    // 正确：用 Task.Run 放到线程池，并始终 await
    return await Task.Run(() => HeavyComputation(n));
}`}
        language="csharp"
        title="CPU 绑定操作的处理"
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
Func<string, User> parse = name => new User { Name = name };

int result = add(3, 4);  // 7
log("hello");`}
        language="csharp"
        title="Func 与 Action"
      />

      <LessonCode
        code={`public class UserManager
{
    // 事件声明
    public event EventHandler<UserChangedEventArgs>? UserChanged;

    protected virtual void OnUserChanged(User user, string action)
    {
        UserChanged?.Invoke(this, new UserChangedEventArgs(user, action));
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
      </ul>

      <LessonStep
        title="实战：async/await 与 Task"
        steps={[
          {
            title: "实现并行 API 调用",
            content: (
              <p>
                创建一个异步方法，并行调用 3 个 API，用 Task.WhenAll 等待所有结果返回后汇总。
              </p>
            ),
            code: `public async Task<List<User>> GetUsersFromMultipleSourcesAsync()
{
    // 创建 3 个任务（立即开始执行）
    var task1 = httpClient.GetFromJsonAsync<List<User>>("https://api1.com/users");
    var task2 = httpClient.GetFromJsonAsync<List<User>>("https://api2.com/users");
    var task3 = httpClient.GetFromJsonAsync<List<User>>("https://api3.com/users");

    // 等待所有任务完成
    var results = await Task.WhenAll(task1, task2, task3);

    // 汇总结果
    return results.SelectMany(users => users).ToList();
}`,
            codeLanguage: "csharp",
            codeTitle: "并行 API 调用",
            checkpoints: [
              "3 个任务同时启动（不要 await 每一个，那会变成串行）",
              "Task.WhenAll 等待所有任务完成",
              "用 SelectMany 展平结果",
            ],
            reference:
              "常见错误：await task1; await task2; await task3; 这是串行执行，总耗时是三者之和。正确做法是先启动所有任务，再 await Task.WhenAll，总耗时是最慢的那个。",
          },
          {
            title: "用委托替代回调函数",
            content: (
              <p>
                用 Func&lt;T, R&gt; 和 Action&lt;T&gt; 定义委托，实现类似 TS 回调函数的机制。
              </p>
            ),
            code: `// Func<T, R>：有返回值的委托
Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine(add(1, 2));  // 3

// Action<T>：无返回值的委托
Action<string> log = (message) => Console.WriteLine(message);
log("Hello");

// 高阶函数示例
public void ProcessUsers(List<User> users, Func<User, bool> predicate)
{
    var filtered = users.Where(predicate).ToList();
    Console.WriteLine($"Found {filtered.Count} users");
}

// 调用
ProcessUsers(users, u => u.Age > 18);`,
            codeLanguage: "csharp",
            codeTitle: "委托（Func 和 Action）",
            checkpoints: [
              "Func<T, R> 有返回值（最后一个类型是返回值）",
              "Action<T> 无返回值",
              "可以作为参数传递（类似 TS 的回调）",
            ],
            reference:
              "Func<int, int, int> 表示接受两个 int，返回一个 int。Action<string> 表示接受一个 string，无返回值。这是 C# 的一等函数支持。",
          },
          {
            title: "重构阻塞式异步代码",
            content: (
              <p>
                找出使用 .Result 或 .Wait() 的代码，改写为全程 await，避免死锁和线程阻塞。
              </p>
            ),
            code: `// ❌ 错误写法（阻塞线程，可能死锁）
public User GetUser(string id)
{
    var user = GetUserAsync(id).Result;  // 阻塞！
    return user;
}

// ✅ 正确写法（全程异步）
public async Task<User> GetUserAsync(string id)
{
    var user = await httpClient.GetFromJsonAsync<User>($"/users/{id}");
    return user;
}`,
            codeLanguage: "csharp",
            codeTitle: "避免阻塞异步",
            checkpoints: [
              "方法签名改为 async Task<T>",
              "用 await 替代 .Result 或 .Wait()",
              "调用方也要改成异步（async 传染性）",
            ],
            reference:
              "在 Web API 中用 .Result 会阻塞线程池线程，导致吞吐量下降甚至死锁。ASP.NET Core 默认同步上下文已移除，但阻塞仍会浪费线程。始终用 await。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经掌握了 C# 异步编程的核心模式。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                Task.WhenAll 实现并行等待，避免串行 await
              </li>
              <li>
                Func&lt;T, R&gt; 和 Action&lt;T&gt; 是 C# 的委托（类似 TS 回调）
              </li>
              <li>
                避免 .Result 和 .Wait()，全程使用 await
              </li>
              <li>
                async/await 是语法糖，底层是状态机（不是真正的线程）
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能实现并行异步调用、用委托传递函数、避免阻塞异步。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
