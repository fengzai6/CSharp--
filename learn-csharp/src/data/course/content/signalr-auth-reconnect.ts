import type { ILessonBlock } from "@/components/lesson-ui";

export const signalrAuthReconnectBlocks = [
  {
    "level": 2,
    "text": "认证集成",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "JWT 认证 — 对应你的 `WsJwtGuard`",
    "type": "heading"
  },
  {
    "code": "// Program.cs\nbuilder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)\n    .AddJwtBearer(options =>\n    {\n        options.TokenValidationParameters = new TokenValidationParameters\n        {\n            ValidateIssuer = true,\n            ValidateAudience = true,\n            ValidateLifetime = true,\n            ValidateIssuerSigningKey = true,\n            ValidIssuer = builder.Configuration[\"Jwt:Issuer\"],\n            ValidAudience = builder.Configuration[\"Jwt:Audience\"],\n            IssuerSigningKey = new SymmetricSecurityKey(\n                Encoding.UTF8.GetBytes(builder.Configuration[\"Jwt:Secret\"]!))\n        };\n\n        // SignalR 会自动将 token 添加到 ClaimsPrincipal\n        options.Events = new JwtBearerEvents\n        {\n            OnMessageReceived = context =>\n            {\n                // SignalR 的 access_token 在查询参数中\n                var accessToken = context.Query[\"access_token\"];\n                var path = context.HttpContext.Request.Path;\n\n                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments(\"/chat\"))\n                {\n                    context.Token = accessToken;\n                }\n\n                return Task.CompletedTask;\n            }\n        };\n    });",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "text": "**与 NestJS 对照**： - NestJS：手动提取 token → `jwtService.verify()` → 设置 `client.user` - SignalR：JWT 中间件自动解析 token → `Context.User` 自动填充  **安全提醒**：浏览器 WebSocket / SSE 连接常通过 `access_token` 查询参数传递 JWT。必须使用 HTTPS，并避免在网关、日志、监控系统中记录完整 URL。",
    "type": "quote"
  },
  {
    "level": 3,
    "text": "前端连接",
    "type": "heading"
  },
  {
    "code": "// 前端使用 @microsoft/signalr\nimport * as signalR from \"@microsoft/signalr\";\n\nconst connection = new signalR.HubConnectionBuilder()\n    .withUrl(\"https://api.example.com/chat\", {\n        accessTokenFactory: () => localStorage.getItem(\"accessToken\")!,\n    })\n    .withAutomaticReconnect()\n    .build();\n\n// 监听服务端消息\nconnection.on(\"ReceiveMessage\", (data) => {\n    console.log(`[${data.senderUsername}]: ${data.message}`);\n});\n\nconnection.on(\"UserJoinedRoom\", (data) => {\n    console.log(`${data.username} joined room ${data.room}`);\n});\n\nconnection.on(\"UserLeftRoom\", (data) => {\n    console.log(`${data.userId} left room ${data.room}`);\n});\n\n// 调用服务端方法\nasync function sendMessage(room: string, message: string) {\n    await connection.invoke(\"SendMessage\", room, message);\n}\n\nasync function joinRoom(room: string) {\n    await connection.invoke(\"JoinRoom\", room);\n}\n\n// 启动连接\nconnection.start().catch(err => console.error(err.toString()));",
    "language": "typescript",
    "title": "typescript 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "连接管理",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "连接信息",
    "type": "heading"
  },
  {
    "code": "// Hub 上下文中可访问的连接信息\npublic class ChatHub : Hub\n{\n    public async Task GetConnectionInfo()\n    {\n        var info = new\n        {\n            ConnectionId = Context.ConnectionId,     // 唯一连接 ID\n            UserIdentifier = Context.UserIdentifier, // JWT sub 或自定义\n            User = Context.User,                     // ClaimsPrincipal\n            Items = Context.Items,                   // 任意键值对\n            Aborted = Context.Features.Get<IHttpConnectionFeature>()?.Transport,\n            Protocol = Context.Protocol,\n            LocalIpAddress = Context.Features.Get<IHttpConnectionFeature>()?.LocalIpAddress,\n            RemoteIpAddress = Context.Features.Get<IHttpConnectionFeature>()?.RemoteIpAddress,\n        };\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "连接统计",
    "type": "heading"
  },
  {
    "code": "public static class ConnectionTracker\n{\n    private static int _connectedCount = 0;\n\n    public static void RegisterConnection() => Interlocked.Increment(ref _connectedCount);\n    public static void UnregisterConnection() => Interlocked.Decrement(ref _connectedCount);\n    public static int Count => _connectedCount;\n}\n\npublic class ChatHub : Hub\n{\n    public override async Task OnConnectedAsync()\n    {\n        ConnectionTracker.RegisterConnection();\n        await Clients.All.SendAsync(\"ConnectionCountChanged\", ConnectionTracker.Count);\n        await base.OnConnectedAsync();\n    }\n\n    public override async Task OnDisconnectedAsync(Exception? exception)\n    {\n        ConnectionTracker.UnregisterConnection();\n        await Clients.All.SendAsync(\"ConnectionCountChanged\", ConnectionTracker.Count);\n        await base.OnDisconnectedAsync(exception);\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "与 GroupsService 的对照",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "你的 NestJS 代码 → SignalR 实现",
    "type": "heading"
  },
  {
    "code": "// NestJS: getGroupMemberRole(groupId, userId)\n// → 检查用户是否在组中，以及是否是 Leader\n// → SignalR 用 Group 管理实现类似逻辑\n\n// NestJS: handleJoinRoom → client.join(data.room)\n// → SignalR: await Groups.AddToGroupAsync(Context.ConnectionId, room)\n\n// NestJS: client.to(data.room).emit('room-message', payload)\n// → SignalR: await Clients.Group(room).SendAsync(\"ReceiveMessage\", payload)\n\n// NestJS: client.broadcast.emit('broadcast-message', payload)\n// → SignalR: await Clients.All.SendExcept(Context.ConnectionId).SendAsync(\"BroadcastMessage\", payload)\n\n// NestJS: getUserSockets(targetUserId) → for loop emit\n// → SignalR: await Clients.Users(targetUserId).SendAsync(\"DirectMessage\", payload)",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "断线重连 — 客户端内置重连，业务状态需要恢复",
    "type": "heading"
  },
  {
    "code": "// SignalR 客户端支持自动重连，但房间、当前会话等业务状态需要重连后恢复\nconst connection = new signalR.HubConnectionBuilder()\n    .withAutomaticReconnect()  // 自动重连\n    .build();\n\n// 自定义重连行为\nconst connection = new signalR.HubConnectionBuilder()\n    .withUrl(\"/chat\", {\n        transport: signalR.HttpTransportType.WebSockets,\n    })\n    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // 延迟递增\n    .build();\n\nconnection.onreconnecting((error) => {\n    console.log(`Reconnecting... Error: ${error}`);\n    // UI 显示 \"正在重连...\"\n});\n\nconnection.onreconnected((connectionId) => {\n    console.log(`Reconnected! New ConnectionId: ${connectionId}`);\n    // 重新加入房间\n    connection.invoke(\"JoinRoom\", currentRoom).catch(() => {});\n});",
    "language": "typescript",
    "title": "typescript 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "实战练习清单",
    "type": "heading"
  },
  {
    "id": "checklist-18",
    "items": [
      "搭建最小 SignalR Hub 项目",
      "实现 JWT 认证集成",
      "实现 `JoinRoom` / `LeaveRoom` / `SendMessage`",
      "实现 `SendDirectMessage`（点对点）",
      "实现 `Broadcast`（广播）",
      "实现连接统计（在线人数）",
      "实现断线重连 + 自动加入房间",
      "对比 SignalR 与你的 NestJS Socket.IO 实现"
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
      "SignalR 和 Socket.IO 为什么不能直接互通？",
      "`Clients.Caller`、`Clients.Group`、`Clients.Users` 分别发送给谁？",
      "Groups 和数据库里的群组成员关系有什么区别？",
      "WebSocket 查询参数传 JWT 有什么安全注意事项？",
      "自动重连后为什么要重新 JoinRoom？"
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
    "text": "完成本阶段后，进入 [六、工程化与进阶](06-工程化与进阶.md)。",
    "type": "paragraph"
  }
] satisfies ILessonBlock[];
