# C# 学习计划

> 基于 `my-first-nest` 项目水平定制 | 2026-05-18

## 你的当前水平

通过分析 `my-first-nest` 项目，确认你具备：

- **架构**：Monorepo + NestJS 模块化，Module/Controller/Service 分层
- **认证授权**：JWT Access/Refresh Token、RBAC 权限模型、Passport 策略
- **数据库**：TypeORM 复杂关系（ManyToMany/OneToMany）、TreeRepository、事务、悲观锁
- **WebSocket**：Socket.IO Gateway、房间系统、点对点消息、广播
- **工程化**：Global Exception Filter、Guard、Interceptor、Middleware、Pipe、DTO 验证
- **前端**：React 19 + Zustand + React Query

你的水平相当于**中高级后端开发者**。C# 学习的重点不在"如何写 API"，而在**理解 C#/.NET 生态的思维方式差异**。

## 学习路径

| 阶段 | 内容 | 预估时间 |
|------|------|----------|
| [零、环境准备与项目骨架](00-环境准备与项目骨架.md) | SDK、`.sln`、`.csproj`、NuGet、运行与调试 | 1-2 天 |
| [一、C# 语言核心](01-CSharp语言核心.md) | 基础语法、值类型 vs 引用类型、record、泛型、LINQ、async/await | 2-3 周 |
| [二、ASP.NET Core 框架](02-ASPNET-Core框架.md) | Controller、Minimal API、DI、验证、中间件、配置、Swagger | 3-4 周 |
| [三、EF Core 数据库](03-EF-Core数据库.md) | DbContext、实体建模、迁移、CRUD、关系映射、事务、性能基础 | 2-3 周 |
| [四、认证授权](04-认证授权.md) | 密码哈希、JWT、Refresh Token、RBAC、Policy 授权 | 1-2 周 |
| [五、SignalR 实时通信](05-SignalR实时通信.md) | Hub 模型、房间、点对点消息、认证集成、断线重连 | 1 周 |
| [六、工程化与进阶](06-工程化与进阶.md) | 测试、日志、缓存、健康检查、限流、Docker、AOT | 持续 |

## 与 NestJS 最重要的 5 个思维差异

1. **静态类型是契约** — C# 的强类型是运行时的保证，`int` 不会是 `null`，`List<T>` 每一项都是 `T`
2. **值类型 vs 引用类型** — `int x = 5; int y = x;` 修改 y 不影响 x，但 `User a = b;` 是引用复制
3. **async/await 使用线程池** — 不是 Event Loop。CPU 绑定用 `Task.Run()`，I/O 绑定直接用 `async`
4. **LINQ 是语言级能力** — 列表、数据库、XML、JSON 统一查询语法，学会 LINQ 等于学会一套新语言
5. **中间件是请求管道** — 日志/认证/错误处理/CORS 全部是中间件，在到达 Controller 之前处理一切

## 实战项目建议

用 C# + ASP.NET Core 完全复刻 `my-first-nest`：

```
Phase 0: 项目骨架（Solution + Api/Core/Infrastructure）
Phase 1: 用户 CRUD（Controller + Service + DTO + Validation）
Phase 2: 数据库接入（EF Core + Migration + PostgreSQL）
Phase 3: 认证授权（User/Role/Permission + JWT + Refresh Token）
Phase 4: 群组系统（树形 Group + Member 关系 + 事务）
Phase 5: 实时通信（SignalR Hub + 房间 + 点对点消息）
Phase 6: 工程化（测试、日志、健康检查、Swagger、Redis、Docker）
```

## 老师式学习方法

每一阶段都按同一个节奏推进：

1. **先跑起来**：优先完成最小可运行示例，不先追求架构完整。
2. **再补概念**：对照 NestJS 理解 .NET 的不同思维方式。
3. **最后做练习**：每章末尾的练习必须落到同一个复刻项目中。
4. **阶段验收**：能运行、能解释、能改动，才进入下一章。

如果某一章的示例跑不通，先停在当前章排查，不要跳到下一章。
