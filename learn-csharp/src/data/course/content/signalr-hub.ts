import type { ILessonBlock } from "@/components/lesson-ui";

export const signalrHubBlocks = [
  {
    "text": "预估时间：1 周 | 目标：能用 SignalR 实现房间、点对点消息、广播",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "本章你要掌握什么",
    "type": "heading"
  },
  {
    "text": "学完本章后，你应该能创建 SignalR Hub，实现房间、点对点消息、广播、JWT 认证接入和断线重连后的业务状态恢复。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "老师提示",
    "type": "heading"
  },
  {
    "text": "SignalR 和 Socket.IO 不兼容。学习时不要试图复用 Socket.IO 客户端，也不要把 SignalR 的 Groups 当成数据库里的群组成员关系。Groups 是连接级分组，业务成员关系仍然要落库。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "学习顺序建议",
    "type": "heading"
  },
  {
    "items": [
      "先搭建最小 Hub，并用前端客户端连接。",
      "实现 JoinRoom、LeaveRoom、SendMessage。",
      "接入 JWT 认证，确认 `Context.User` 可用。",
      "实现点对点消息和广播。",
      "最后处理自动重连和重连后的房间恢复。"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "常见误区",
    "type": "heading"
  },
  {
    "items": [
      "使用 Socket.IO 客户端连接 SignalR Hub。",
      "用静态字典当作多实例部署下的全局在线用户表。",
      "认为自动重连会自动恢复所有业务房间。",
      "在日志中记录包含 `access_token` 的完整 URL。"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "与 NestJS WebSocket 的对照",
    "type": "heading"
  },
  {
    "code": "NestJS Socket.IO                    ASP.NET Core SignalR\n─────────────────                   ───────────────────\n@WebSocketGateway                   [Authorize] + Hub<T>\n@SubscribeMessage('join-room')      [HubMethodName(\"JoinRoom\")]\nclient.join(room)                   await Groups.AddToGroupAsync()\nclient.to(room).emit()              await Clients.Group(room).SendAsync()\nclient.emit('msg', data)            await Clients.Caller.SendAsync()",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "text": "**重要差异**：SignalR 有自己的协议（基于 WebSocket / SSE / Long Polling），与 Socket.IO **不兼容**。前端需要使用 SignalR 客户端库（`@microsoft/signalr`）。",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "安装与配置",
    "type": "heading"
  },
  {
    "code": "dotnet add package Microsoft.AspNetCore.SignalR",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "code": "// Program.cs\nbuilder.Services.AddSignalR();\n\nvar app = builder.Build();\n\napp.MapHub<ChatHub>(\"/chat\");\napp.MapHub<NotificationHub>(\"/notifications\");\n\napp.Run();",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "Hub 核心概念",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "Hub 对应 Gateway",
    "type": "heading"
  },
  {
    "code": "// NestJS\n@WebSocketGateway({ namespace: '/socket' })\nexport class SocketGateway implements OnGatewayConnection { ... }\n\n// SignalR\npublic class ChatHub : Hub\n{\n    // Hub 是 SignalR 的核心类，类似 Gateway\n    // - 继承 Hub 获得连接管理、组管理、消息发送能力\n    // - 方法名默认对所有客户端暴露（除非加 [NotAuthorized] 属性）\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "客户端调用服务端方法",
    "type": "heading"
  },
  {
    "code": "// 客户端调用 SendMessage 方法。\n// 如果需要自定义暴露名称，可以写 [HubMethodName(\"send-message\")]。\npublic async Task SendMessage(string room, string message)\n{\n    var userId = Context.UserIdentifier;\n    var userName = Context.Items[\"Username\"]?.ToString() ?? \"Unknown\";\n\n    // 发送给房间内所有人（包括自己）\n    await Clients.Group(room).SendAsync(\"ReceiveMessage\", new\n    {\n        UserId = userId,\n        Username = userName,\n        Message = message,\n        Room = room,\n        Timestamp = DateTime.UtcNow\n    });\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "服务端调用客户端方法",
    "type": "heading"
  },
  {
    "code": "// 发送消息给特定连接\nawait Clients.Caller.SendAsync(\"NewMessage\", data);       // 当前连接\nawait Clients.All.SendAsync(\"Broadcast\", data);           // 所有连接\nawait Clients.Clients(connectionIds).SendAsync(\"Msg\", data); // 指定连接\nawait Clients.Users(userId).SendAsync(\"Msg\", data);       // 指定用户（多设备）\nawait Clients.Group(roomId).SendAsync(\"Msg\", data);       // 指定房间\nawait Clients.Groups(groupIds).SendAsync(\"Msg\", data);    // 多个房间",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "实现聊天系统",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "完整 Hub 示例",
    "type": "heading"
  },
  {
    "code": "using Microsoft.AspNetCore.Authorization;\nusing Microsoft.AspNetCore.SignalR;\n\n[Authorize]  // 需要 JWT 认证\npublic class ChatHub : Hub\n{\n    // 教学示例：只记录连接与用户映射。\n    // 真实项目的房间成员关系应持久化到数据库，重连后重新查询。\n    private static readonly ConcurrentDictionary<string, string> _userConnections = new();\n    private readonly ILogger<ChatHub> _logger;\n\n    public ChatHub(ILogger<ChatHub> logger)\n    {\n        _logger = logger;\n    }\n\n    // ---- 连接生命周期 ----\n\n    public override async Task OnConnectedAsync()\n    {\n        var userId = Context.UserIdentifier;\n        var username = Context.User?.FindFirst(\"name\")?.Value ?? \"Unknown\";\n\n        if (string.IsNullOrEmpty(userId))\n            throw new HubException(\"Unauthorized connection\");\n\n        // 记录连接。多实例部署时不要依赖静态字段，应改用 Redis backplane 或持久化存储。\n        _userConnections[Context.ConnectionId] = userId;\n\n        // 通知房间内其他用户\n        var usernameList = _userConnections.Count;\n        await Clients.Group(\"system\").SendAsync(\"UserConnected\", new\n        {\n            UserId = userId,\n            Username = username,\n            TotalOnline = usernameList\n        });\n\n        _logger.LogInformation(\"Connection {ConnectionId} connected. User: {UserId}\",\n            Context.ConnectionId, userId);\n\n        await base.OnConnectedAsync();\n    }\n\n    public override async Task OnDisconnectedAsync(Exception? exception)\n    {\n        _userConnections.TryRemove(Context.ConnectionId, out var removedUserId);\n\n        // 通知房间内用户离开\n        if (!string.IsNullOrEmpty(removedUserId))\n        {\n            await Clients.All.SendAsync(\"UserLeft\", new\n            {\n                UserId = removedUserId,\n                Username = Context.User?.FindFirst(\"name\")?.Value ?? \"Unknown\"\n            });\n        }\n\n        _logger.LogInformation(\"Connection {ConnectionId} disconnected.\", Context.ConnectionId);\n\n        await base.OnDisconnectedAsync(exception);\n    }\n\n    // ---- 房间操作 ----\n\n    public async Task JoinRoom(string room)\n    {\n        var userId = Context.UserIdentifier;\n\n        await Groups.AddToGroupAsync(Context.ConnectionId, room);\n\n        // 通知房间内其他用户\n        await Clients.Group(room).SendAsync(\"UserJoinedRoom\", new\n        {\n            UserId = userId,\n            Username = Context.User?.FindFirst(\"name\")?.Value ?? \"Unknown\",\n            Room = room\n        });\n    }\n\n    public async Task LeaveRoom(string room)\n    {\n        await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);\n\n        var userId = Context.UserIdentifier;\n        await Clients.Group(room).SendAsync(\"UserLeftRoom\", new\n        {\n            UserId = userId,\n            Room = room\n        });\n    }\n\n    // ---- 消息 ----\n\n    public async Task SendMessage(string room, string message)\n    {\n        var userId = Context.UserIdentifier;\n        var username = Context.User?.FindFirst(\"name\")?.Value ?? \"Unknown\";\n\n        // 验证消息\n        if (string.IsNullOrWhiteSpace(message) || message.Length > 2000)\n        {\n            throw new ArgumentException(\"消息不能为空且不超过 2000 字符\");\n        }\n\n        var messageData = new\n        {\n            SenderId = userId,\n            SenderUsername = username,\n            Room = room,\n            Message = message,\n            Timestamp = DateTime.UtcNow.ToString(\"o\")\n        };\n\n        // 发送给房间内所有人\n        await Clients.Group(room).SendAsync(\"ReceiveMessage\", messageData);\n\n        _logger.LogDebug(\"Message sent to room {Room} by {User}\", room, username);\n    }\n\n    public async Task SendDirectMessage(string targetUserId, string message)\n    {\n        var userId = Context.UserIdentifier;\n        var username = Context.User?.FindFirst(\"name\")?.Value ?? \"Unknown\";\n\n        // 发送给目标用户（可能有多设备连接）\n        await Clients.Users(targetUserId).SendAsync(\"DirectMessage\", new\n        {\n            SenderId = userId,\n            SenderUsername = username,\n            Message = message,\n            Timestamp = DateTime.UtcNow.ToString(\"o\")\n        });\n\n        // 也发送确认给发送者\n        await Clients.Caller.SendAsync(\"MessageSent\", new\n        {\n            TargetUserId = targetUserId,\n            Message = message,\n            Timestamp = DateTime.UtcNow.ToString(\"o\")\n        });\n    }\n\n    public async Task Broadcast(string message)\n    {\n        var userId = Context.UserIdentifier;\n        var username = Context.User?.FindFirst(\"name\")?.Value ?? \"Unknown\";\n\n        await Clients.All.SendExcept(Context.ConnectionId).SendAsync(\"BroadcastMessage\", new\n        {\n            SenderId = userId,\n            SenderUsername = username,\n            Message = message,\n            Timestamp = DateTime.UtcNow.ToString(\"o\")\n        });\n    }\n\n    // ---- 心跳/健康检查 ----\n\n    public async Task Ping()\n    {\n        await Clients.Caller.SendAsync(\"Pong\", DateTime.UtcNow);\n    }\n}",
    "language": "csharp",
    "title": "csharp 示例",
    "type": "code"
  }
] satisfies ILessonBlock[];
