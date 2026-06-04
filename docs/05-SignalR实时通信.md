# 五、SignalR 实时通信

> 预估时间：1 周 | 目标：能用 SignalR 实现房间、点对点消息、广播

---

## 本章你要掌握什么

学完本章后，你应该能创建 SignalR Hub，实现房间、点对点消息、广播、JWT 认证接入和断线重连后的业务状态恢复。

## 老师提示

SignalR 和 Socket.IO 不兼容。学习时不要试图复用 Socket.IO 客户端，也不要把 SignalR 的 Groups 当成数据库里的群组成员关系。Groups 是连接级分组，业务成员关系仍然要落库。

## 学习顺序建议

1. 先搭建最小 Hub，并用前端客户端连接。
2. 实现 JoinRoom、LeaveRoom、SendMessage。
3. 接入 JWT 认证，确认 `Context.User` 可用。
4. 实现点对点消息和广播。
5. 最后处理自动重连和重连后的房间恢复。

## 常见误区

- 使用 Socket.IO 客户端连接 SignalR Hub。
- 用静态字典当作多实例部署下的全局在线用户表。
- 认为自动重连会自动恢复所有业务房间。
- 在日志中记录包含 `access_token` 的完整 URL。

## 与 NestJS WebSocket 的对照

```
NestJS Socket.IO                    ASP.NET Core SignalR
─────────────────                   ───────────────────
@WebSocketGateway                   [Authorize] + Hub<T>
@SubscribeMessage('join-room')      [HubMethodName("JoinRoom")]
client.join(room)                   await Groups.AddToGroupAsync()
client.to(room).emit()              await Clients.Group(room).SendAsync()
client.emit('msg', data)            await Clients.Caller.SendAsync()
```

> **重要差异**：SignalR 有自己的协议（基于 WebSocket / SSE / Long Polling），与 Socket.IO **不兼容**。前端需要使用 SignalR 客户端库（`@microsoft/signalr`）。

---

## 安装与配置

```bash
dotnet add package Microsoft.AspNetCore.SignalR
```

```csharp
// Program.cs
builder.Services.AddSignalR();

var app = builder.Build();

app.MapHub<ChatHub>("/chat");
app.MapHub<NotificationHub>("/notifications");

app.Run();
```

---

## Hub 核心概念

### Hub 对应 Gateway

```csharp
// NestJS
@WebSocketGateway({ namespace: '/socket' })
export class SocketGateway implements OnGatewayConnection { ... }

// SignalR
public class ChatHub : Hub
{
    // Hub 是 SignalR 的核心类，类似 Gateway
    // - 继承 Hub 获得连接管理、组管理、消息发送能力
    // - 方法名默认对所有客户端暴露（除非加 [NotAuthorized] 属性）
}
```

### 客户端调用服务端方法

```csharp
// 客户端调用 SendMessage 方法。
// 如果需要自定义暴露名称，可以写 [HubMethodName("send-message")]。
public async Task SendMessage(string room, string message)
{
    var userId = Context.UserIdentifier;
    var userName = Context.Items["Username"]?.ToString() ?? "Unknown";

    // 发送给房间内所有人（包括自己）
    await Clients.Group(room).SendAsync("ReceiveMessage", new
    {
        UserId = userId,
        Username = userName,
        Message = message,
        Room = room,
        Timestamp = DateTime.UtcNow
    });
}
```

### 服务端调用客户端方法

```csharp
// 发送消息给特定连接
await Clients.Caller.SendAsync("NewMessage", data);       // 当前连接
await Clients.All.SendAsync("Broadcast", data);           // 所有连接
await Clients.Clients(connectionIds).SendAsync("Msg", data); // 指定连接
await Clients.Users(userId).SendAsync("Msg", data);       // 指定用户（多设备）
await Clients.Group(roomId).SendAsync("Msg", data);       // 指定房间
await Clients.Groups(groupIds).SendAsync("Msg", data);    // 多个房间
```

---

## 实现聊天系统

### 完整 Hub 示例

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

[Authorize]  // 需要 JWT 认证
public class ChatHub : Hub
{
    // 教学示例：只记录连接与用户映射。
    // 真实项目的房间成员关系应持久化到数据库，重连后重新查询。
    private static readonly ConcurrentDictionary<string, string> _userConnections = new();
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(ILogger<ChatHub> logger)
    {
        _logger = logger;
    }

    // ---- 连接生命周期 ----

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        var username = Context.User?.FindFirst("name")?.Value ?? "Unknown";

        if (string.IsNullOrEmpty(userId))
            throw new HubException("Unauthorized connection");

        // 记录连接。多实例部署时不要依赖静态字段，应改用 Redis backplane 或持久化存储。
        _userConnections[Context.ConnectionId] = userId;

        // 通知房间内其他用户
        var usernameList = _userConnections.Count;
        await Clients.Group("system").SendAsync("UserConnected", new
        {
            UserId = userId,
            Username = username,
            TotalOnline = usernameList
        });

        _logger.LogInformation("Connection {ConnectionId} connected. User: {UserId}",
            Context.ConnectionId, userId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _userConnections.TryRemove(Context.ConnectionId, out var removedUserId);

        // 通知房间内用户离开
        if (!string.IsNullOrEmpty(removedUserId))
        {
            await Clients.All.SendAsync("UserLeft", new
            {
                UserId = removedUserId,
                Username = Context.User?.FindFirst("name")?.Value ?? "Unknown"
            });
        }

        _logger.LogInformation("Connection {ConnectionId} disconnected.", Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }

    // ---- 房间操作 ----

    public async Task JoinRoom(string room)
    {
        var userId = Context.UserIdentifier;

        await Groups.AddToGroupAsync(Context.ConnectionId, room);

        // 通知房间内其他用户
        await Clients.Group(room).SendAsync("UserJoinedRoom", new
        {
            UserId = userId,
            Username = Context.User?.FindFirst("name")?.Value ?? "Unknown",
            Room = room
        });
    }

    public async Task LeaveRoom(string room)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);

        var userId = Context.UserIdentifier;
        await Clients.Group(room).SendAsync("UserLeftRoom", new
        {
            UserId = userId,
            Room = room
        });
    }

    // ---- 消息 ----

    public async Task SendMessage(string room, string message)
    {
        var userId = Context.UserIdentifier;
        var username = Context.User?.FindFirst("name")?.Value ?? "Unknown";

        // 验证消息
        if (string.IsNullOrWhiteSpace(message) || message.Length > 2000)
        {
            throw new ArgumentException("消息不能为空且不超过 2000 字符");
        }

        var messageData = new
        {
            SenderId = userId,
            SenderUsername = username,
            Room = room,
            Message = message,
            Timestamp = DateTime.UtcNow.ToString("o")
        };

        // 发送给房间内所有人
        await Clients.Group(room).SendAsync("ReceiveMessage", messageData);

        _logger.LogDebug("Message sent to room {Room} by {User}", room, username);
    }

    public async Task SendDirectMessage(string targetUserId, string message)
    {
        var userId = Context.UserIdentifier;
        var username = Context.User?.FindFirst("name")?.Value ?? "Unknown";

        // 发送给目标用户（可能有多设备连接）
        await Clients.Users(targetUserId).SendAsync("DirectMessage", new
        {
            SenderId = userId,
            SenderUsername = username,
            Message = message,
            Timestamp = DateTime.UtcNow.ToString("o")
        });

        // 也发送确认给发送者
        await Clients.Caller.SendAsync("MessageSent", new
        {
            TargetUserId = targetUserId,
            Message = message,
            Timestamp = DateTime.UtcNow.ToString("o")
        });
    }

    public async Task Broadcast(string message)
    {
        var userId = Context.UserIdentifier;
        var username = Context.User?.FindFirst("name")?.Value ?? "Unknown";

        await Clients.All.SendExcept(Context.ConnectionId).SendAsync("BroadcastMessage", new
        {
            SenderId = userId,
            SenderUsername = username,
            Message = message,
            Timestamp = DateTime.UtcNow.ToString("o")
        });
    }

    // ---- 心跳/健康检查 ----

    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
    }
}
```

---

## 认证集成

### JWT 认证 — 对应你的 `WsJwtGuard`

```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };

        // SignalR 会自动将 token 添加到 ClaimsPrincipal
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // SignalR 的 access_token 在查询参数中
                var accessToken = context.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chat"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });
```

> **与 NestJS 对照**：
> - NestJS：手动提取 token → `jwtService.verify()` → 设置 `client.user`
> - SignalR：JWT 中间件自动解析 token → `Context.User` 自动填充
>
> **安全提醒**：浏览器 WebSocket / SSE 连接常通过 `access_token` 查询参数传递 JWT。必须使用 HTTPS，并避免在网关、日志、监控系统中记录完整 URL。

### 前端连接

```typescript
// 前端使用 @microsoft/signalr
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://api.example.com/chat", {
        accessTokenFactory: () => localStorage.getItem("accessToken")!,
    })
    .withAutomaticReconnect()
    .build();

// 监听服务端消息
connection.on("ReceiveMessage", (data) => {
    console.log(`[${data.senderUsername}]: ${data.message}`);
});

connection.on("UserJoinedRoom", (data) => {
    console.log(`${data.username} joined room ${data.room}`);
});

connection.on("UserLeftRoom", (data) => {
    console.log(`${data.userId} left room ${data.room}`);
});

// 调用服务端方法
async function sendMessage(room: string, message: string) {
    await connection.invoke("SendMessage", room, message);
}

async function joinRoom(room: string) {
    await connection.invoke("JoinRoom", room);
}

// 启动连接
connection.start().catch(err => console.error(err.toString()));
```

---

## 连接管理

### 连接信息

```csharp
// Hub 上下文中可访问的连接信息
public class ChatHub : Hub
{
    public async Task GetConnectionInfo()
    {
        var info = new
        {
            ConnectionId = Context.ConnectionId,     // 唯一连接 ID
            UserIdentifier = Context.UserIdentifier, // JWT sub 或自定义
            User = Context.User,                     // ClaimsPrincipal
            Items = Context.Items,                   // 任意键值对
            Aborted = Context.Features.Get<IHttpConnectionFeature>()?.Transport,
            Protocol = Context.Protocol,
            LocalIpAddress = Context.Features.Get<IHttpConnectionFeature>()?.LocalIpAddress,
            RemoteIpAddress = Context.Features.Get<IHttpConnectionFeature>()?.RemoteIpAddress,
        };
    }
}
```

### 连接统计

```csharp
public static class ConnectionTracker
{
    private static int _connectedCount = 0;

    public static void RegisterConnection() => Interlocked.Increment(ref _connectedCount);
    public static void UnregisterConnection() => Interlocked.Decrement(ref _connectedCount);
    public static int Count => _connectedCount;
}

public class ChatHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        ConnectionTracker.RegisterConnection();
        await Clients.All.SendAsync("ConnectionCountChanged", ConnectionTracker.Count);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        ConnectionTracker.UnregisterConnection();
        await Clients.All.SendAsync("ConnectionCountChanged", ConnectionTracker.Count);
        await base.OnDisconnectedAsync(exception);
    }
}
```

---

## 与 GroupsService 的对照

### 你的 NestJS 代码 → SignalR 实现

```csharp
// NestJS: getGroupMemberRole(groupId, userId)
// → 检查用户是否在组中，以及是否是 Leader
// → SignalR 用 Group 管理实现类似逻辑

// NestJS: handleJoinRoom → client.join(data.room)
// → SignalR: await Groups.AddToGroupAsync(Context.ConnectionId, room)

// NestJS: client.to(data.room).emit('room-message', payload)
// → SignalR: await Clients.Group(room).SendAsync("ReceiveMessage", payload)

// NestJS: client.broadcast.emit('broadcast-message', payload)
// → SignalR: await Clients.All.SendExcept(Context.ConnectionId).SendAsync("BroadcastMessage", payload)

// NestJS: getUserSockets(targetUserId) → for loop emit
// → SignalR: await Clients.Users(targetUserId).SendAsync("DirectMessage", payload)
```

### 断线重连 — 客户端内置重连，业务状态需要恢复

```typescript
// SignalR 客户端支持自动重连，但房间、当前会话等业务状态需要重连后恢复
const connection = new signalR.HubConnectionBuilder()
    .withAutomaticReconnect()  // 自动重连
    .build();

// 自定义重连行为
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chat", {
        transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // 延迟递增
    .build();

connection.onreconnecting((error) => {
    console.log(`Reconnecting... Error: ${error}`);
    // UI 显示 "正在重连..."
});

connection.onreconnected((connectionId) => {
    console.log(`Reconnected! New ConnectionId: ${connectionId}`);
    // 重新加入房间
    connection.invoke("JoinRoom", currentRoom).catch(() => {});
});
```

---

## 实战练习清单

- [ ] 搭建最小 SignalR Hub 项目
- [ ] 实现 JWT 认证集成
- [ ] 实现 `JoinRoom` / `LeaveRoom` / `SendMessage`
- [ ] 实现 `SendDirectMessage`（点对点）
- [ ] 实现 `Broadcast`（广播）
- [ ] 实现连接统计（在线人数）
- [ ] 实现断线重连 + 自动加入房间
- [ ] 对比 SignalR 与你的 NestJS Socket.IO 实现

## 阶段验收问题

- SignalR 和 Socket.IO 为什么不能直接互通？
- `Clients.Caller`、`Clients.Group`、`Clients.Users` 分别发送给谁？
- Groups 和数据库里的群组成员关系有什么区别？
- WebSocket 查询参数传 JWT 有什么安全注意事项？
- 自动重连后为什么要重新 JoinRoom？

## 下一步

完成本阶段后，进入 [六、工程化与进阶](06-工程化与进阶.md)。
