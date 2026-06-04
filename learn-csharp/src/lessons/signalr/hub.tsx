import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const SignalrHubLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
  return (
    <LessonShell>
      <h3>本章你要掌握什么</h3>
      <p>
        学完本节后，你应该能创建 SignalR Hub，理解 Hub 模型，并实现房间（Groups）、点对点消息和广播。重点是建立
        SignalR 的连接、分组和消息发送思维。
      </p>

      <TeacherTask title="老师提示">
        <p>
          SignalR 和 Socket.IO <strong>不兼容</strong>。学习时不要试图复用 Socket.IO 客户端，也不要把
          SignalR 的 Groups 当成数据库里的群组成员关系。Groups 是<strong>连接级分组</strong>
          ，业务成员关系仍然要落库。
        </p>
      </TeacherTask>

      <h3>学习顺序建议</h3>
      <ol>
        <li>先搭建最小 Hub，并用前端客户端连接。</li>
        <li>
          实现 <code>JoinRoom</code>、<code>LeaveRoom</code>、<code>SendMessage</code>。
        </li>
        <li>
          接入 JWT 认证，确认 <code>Context.User</code> 可用。
        </li>
        <li>实现点对点消息和广播。</li>
        <li>最后处理自动重连和重连后的房间恢复。</li>
      </ol>

      <h3>与 NestJS WebSocket 的对照</h3>
      <LessonTable
        headers={["NestJS Socket.IO", "ASP.NET Core SignalR"]}
        rows={[
          ["@WebSocketGateway", "[Authorize] + Hub<T>"],
          ["@SubscribeMessage('join-room')", `[HubMethodName("JoinRoom")]`],
          ["client.join(room)", "await Groups.AddToGroupAsync()"],
          ["client.to(room).emit()", "await Clients.Group(room).SendAsync()"],
          ["client.emit('msg', data)", "await Clients.Caller.SendAsync()"],
        ]}
      />

      <TeacherTask title="重要差异">
        <p>
          SignalR 有自己的协议（基于 WebSocket / SSE / Long Polling），与 Socket.IO
          <strong>不兼容</strong>。前端需要使用 SignalR 客户端库（
          <code>@microsoft/signalr</code>）。
        </p>
      </TeacherTask>

      <h3>安装与配置</h3>
      <LessonCode
        code={`dotnet add package Microsoft.AspNetCore.SignalR`}
        language="bash"
        title="安装 SignalR"
      />

      <LessonCode
        code={`// Program.cs
builder.Services.AddSignalR();

var app = builder.Build();

app.MapHub<ChatHub>("/chat");
app.MapHub<NotificationHub>("/notifications");

app.Run();`}
        language="csharp"
        title="注册并映射 Hub"
      />

      <h3>Hub 核心概念</h3>
      <h4>Hub 对应 Gateway</h4>
      <LessonCode
        code={`// NestJS
@WebSocketGateway({ namespace: '/socket' })
export class SocketGateway implements OnGatewayConnection { ... }

// SignalR
public class ChatHub : Hub
{
    // Hub 是 SignalR 的核心类，类似 Gateway
    // - 继承 Hub 获得连接管理、组管理、消息发送能力
    // - 方法名默认对所有客户端暴露（除非加 [NotAuthorized] 属性）
}`}
        language="csharp"
        title="Hub 类"
      />

      <h4>客户端调用服务端方法</h4>
      <LessonCode
        code={`// 客户端调用 SendMessage 方法。
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
}`}
        language="csharp"
        title="客户端调用服务端"
      />

      <h4>服务端调用客户端方法</h4>
      <LessonCode
        code={`// 发送消息给特定连接
await Clients.Caller.SendAsync("NewMessage", data);       // 当前连接
await Clients.All.SendAsync("Broadcast", data);           // 所有连接
await Clients.Clients(connectionIds).SendAsync("Msg", data); // 指定连接
await Clients.Users(userId).SendAsync("Msg", data);       // 指定用户（多设备）
await Clients.Group(roomId).SendAsync("Msg", data);       // 指定房间
await Clients.Groups(groupIds).SendAsync("Msg", data);    // 多个房间`}
        language="csharp"
        title="发送目标对照"
      />

      <h3>实现聊天系统</h3>
      <p>
        下面是一个完整的 <code>ChatHub</code>，覆盖连接生命周期、房间操作、消息发送和心跳。
      </p>
      <LessonCode
        code={`using Microsoft.AspNetCore.Authorization;
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
}`}
        language="csharp"
        title="完整 ChatHub 示例"
      />

      <h3>连接管理</h3>
      <h4>连接信息</h4>
      <p>在 Hub 上下文中可以访问当前连接的各种信息。</p>
      <LessonCode
        code={`// Hub 上下文中可访问的连接信息
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
}`}
        language="csharp"
        title="连接信息"
      />

      <h4>连接统计</h4>
      <LessonCode
        code={`public static class ConnectionTracker
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
}`}
        language="csharp"
        title="在线人数统计"
      />

      <h3>与 GroupsService 的对照</h3>
      <p>把你的 NestJS 代码映射到 SignalR 实现：</p>
      <LessonCode
        code={`// NestJS: getGroupMemberRole(groupId, userId)
// → 检查用户是否在组中，以及是否是 Leader
// → SignalR 用 Group 管理实现类似逻辑

// NestJS: handleJoinRoom → client.join(data.room)
// → SignalR: await Groups.AddToGroupAsync(Context.ConnectionId, room)

// NestJS: client.to(data.room).emit('room-message', payload)
// → SignalR: await Clients.Group(room).SendAsync("ReceiveMessage", payload)

// NestJS: client.broadcast.emit('broadcast-message', payload)
// → SignalR: await Clients.All.SendExcept(Context.ConnectionId).SendAsync("BroadcastMessage", payload)

// NestJS: getUserSockets(targetUserId) → for loop emit
// → SignalR: await Clients.Users(targetUserId).SendAsync("DirectMessage", payload)`}
        language="csharp"
        title="NestJS → SignalR 对照"
      />

      <h3>常见误区</h3>
      <ul>
        <li>使用 Socket.IO 客户端连接 SignalR Hub。</li>
        <li>用静态字典当作多实例部署下的全局在线用户表。</li>
      </ul>
      <LessonQuote>
        Groups 是连接级分组，不要把它当成数据库里的群组成员关系。业务成员关系要落库，重连后重新查询。
      </LessonQuote>

      <h3>阶段验收问题</h3>
      <ul>
        <li>SignalR 和 Socket.IO 为什么不能直接互通？</li>
        <li>
          <code>Clients.Caller</code>、<code>Clients.Group</code>、<code>Clients.Users</code>{" "}
          分别发送给谁？
        </li>
        <li>Groups 和数据库里的群组成员关系有什么区别？</li>
      </ul>

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="signalr-hub-checklist"
        items={[
          "搭建最小 SignalR Hub 项目",
          "实现 JoinRoom / LeaveRoom / SendMessage",
          "实现 SendDirectMessage（点对点）",
          "实现 Broadcast（广播）",
          "实现连接统计（在线人数）",
          "对比 SignalR 与你的 NestJS Socket.IO 实现",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
