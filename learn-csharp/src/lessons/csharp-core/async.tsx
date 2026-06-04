import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const CsharpAsyncLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
  return (
    <LessonShell>
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

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="csharp-async-checklist"
        items={[
          "实现一个异步方法，并行调用 3 个 API 并用 Task.WhenAll 汇总结果",
          "用 Func<T, R> 和 Action<T> 替代回调函数",
          "找出一段用了 .Result/.Wait() 的代码，改写成全程 await",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
