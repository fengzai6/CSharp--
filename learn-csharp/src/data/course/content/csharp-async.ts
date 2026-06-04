import type { ILessonBlock } from "@/components/lesson-ui";

export const csharpAsyncBlocks = [
  {
    "level": 3,
    "text": "2.3 异步编程 — async/await 与 Task",
    "type": "heading"
  },
  {
    "code": "// 基础模式\npublic async Task<User> GetUserAsync(string id)\n{\n    var response = await httpClient.GetAsync($\"/api/users/{id}\");\n    response.EnsureSuccessStatusCode();\n    var json = await response.Content.ReadAsStringAsync();\n    return JsonSerializer.Deserialize<User>(json);\n}\n\n// 并行执行 — 类似 Promise.all\npublic async Task<(User? user, Role? role)> GetUserAndRoleAsync(string userId)\n{\n    var userTask = GetUserAsync(userId);\n    var roleTask = GetRoleAsync(userId);\n    return (await userTask, await roleTask);\n}\n\n// await Task.WhenAll\npublic async Task<List<User>> GetUsersAsync(string[] ids)\n{\n    var tasks = ids.Select(id => GetUserAsync(id)).ToArray();\n    return (await Task.WhenAll(tasks)).ToList();\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 JS/TS 的核心差异**：",
    "type": "paragraph"
  },
  {
    "code": "JS/TS:      await 在 Event Loop 上排队，单线程，非阻塞\nC#:         async/await 使用线程池线程，I/O 操作完成后回调在线程池上执行\n\nJS:         适合 CPU 密集（单线程 + 异步 I/O）\nC#:         适合 I/O 密集（线程池 + async/await），CPU 密集用 Task.Run() 或 Parallel",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "code": "// CPU 绑定操作 — 不要在请求线程里直接跑重计算\npublic async Task<int> ComputeExpensiveAsync(int n)\n{\n    // 错误做法：直接阻塞当前请求线程\n    // return HeavyComputation(n);\n\n    // 正确做法：用 Task.Run 放到线程池，并始终 await\n    return await Task.Run(() => HeavyComputation(n));\n}\n\n// 真正的异步 CPU 操作（.NET 8+ 有异步迭代器）\npublic static async IAsyncEnumerable<int> AsyncRange(int start, int count)\n{\n    for (int i = 0; i < count; i++)\n    {\n        await Task.Delay(10); // 模拟异步\n        yield return start + i;\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**Async/Await 黄金法则**：",
    "type": "paragraph"
  },
  {
    "items": [
      "**I/O 绑定** → 直接用 `async/await`（HTTP、数据库、文件）",
      "**CPU 绑定** → 用 `Task.Run()` 或 `Parallel`",
      "**不要 `.Result` 或 `.Wait()`** → 会产生死锁，始终 `await`",
      "**ConfigureAwait(false)** → 库代码中使用，避免不必要的上下文切换"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "实战练习清单",
    "type": "heading"
  },
  {
    "id": "checklist-9",
    "items": [
      "用 C# 值类型创建 `Point`、`Money` 结构体",
      "用 C# 引用类型创建 `User`、`Role` 类，练习引用复制行为",
      "创建 LINQ 链式查询：过滤 + 排序 + 分组 + 投影",
      "实现一个异步方法，并行调用 3 个 API 并汇总结果",
      "用 `Func<T, R>` 和 `Action<T>` 替代回调函数",
      "编写 3 个字符串扩展方法",
      "用模式匹配重构 switch 语句"
    ],
    "title": "练习清单",
    "type": "checklist"
  },
  {
    "level": 2,
    "text": "阶段验收问题",
    "type": "heading"
  },
  {
    "items": [
      "`var` 和 `any` 最大区别是什么？",
      "`record` 为什么适合 DTO，而 Entity 通常还是用 `class`？",
      "LINQ 的延迟执行什么时候会真正触发？",
      "为什么 Web API 代码里要避免 `.Result`？",
      "`IEnumerable<T>`、`IQueryable<T>` 和 `List<T>` 的学习重点分别是什么？"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "下一步",
    "type": "heading"
  },
  {
    "text": "完成本阶段后，进入 [二、ASP.NET Core 框架](02-ASPNET-Core框架.md)。",
    "type": "paragraph"
  }
] satisfies ILessonBlock[];
