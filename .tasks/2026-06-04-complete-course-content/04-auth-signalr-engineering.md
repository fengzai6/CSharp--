---
task: complete-course-content
subtask: "04"
status: completed
depends-on: ["01"]
created: 2026-06-04
updated: 2026-06-04
---

# 04 - 04-06 文档搬运

## 目标

将认证授权、SignalR 和工程化文档内容搬运进学习网站。

## 必读文档

- [00-overview.md](00-overview.md) — 总览与共识
- [docs/04-认证授权.md](../../docs/04-认证授权.md)
- [docs/05-SignalR实时通信.md](../../docs/05-SignalR实时通信.md)
- [docs/06-工程化与进阶.md](../../docs/06-工程化与进阶.md)
- [auth lessons](../../learn-csharp/src/lessons/auth)
- [signalr lessons](../../learn-csharp/src/lessons/signalr)
- [engineering lessons](../../learn-csharp/src/lessons/engineering)

## 任务详情

- 覆盖认证授权核心概念、用户模型、密码哈希、JWT 配置、Access Token、登录流程、Refresh Token、Role、Permission、资源级授权、SignalR 认证准备、练习和验收。
- 覆盖 SignalR 对照、安装配置、Hub 概念、客户端/服务端调用、完整聊天 Hub、JWT 认证、前端连接、连接管理、连接统计、GroupsService 对照、断线重连、练习和验收。
- 覆盖测试、集成测试、Testcontainers、日志、Serilog、缓存、Redis、健康检查、Swagger/OpenAPI、速率限制、性能优化、Docker、AOT、发布命令、生态包速查、练习和验收。

## 结果

已完成：

- `docs/04-认证授权.md` 已拆分搬运到 auth 两个课程内容文件。
- `docs/05-SignalR实时通信.md` 已拆分搬运到 signalr 两个课程内容文件。
- `docs/06-工程化与进阶.md` 已拆分搬运到 engineering 三个课程内容文件。
- 标题覆盖检查中，04、05、06 文档 H2/H3/H4 缺失数为 0。

## 决策与备注

暂无。
