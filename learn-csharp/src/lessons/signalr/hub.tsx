import {
  LessonCheckpoint,

  LessonCode,
  LessonCodeCompare,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const SignalrHubLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: {
  completedChecklistIds: string[];
  onToggleChecklistItem: (checklistItemId: string) => void;
}) => {
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

      <h3>配置 Hub</h3>
      <LessonCode
        code={`# ASP.NET Core Web 项目已包含服务端 SignalR
# 前端客户端另装：npm install @microsoft/signalr`}
        language="bash"
        title="SignalR 依赖"
      />

      <p>
        服务端 SignalR 已经随 ASP.NET Core Web 运行时提供，所以后端通常不需要额外安装服务端包。前端必须安装
        <code>@microsoft/signalr</code>，因为 SignalR 协议和 Socket.IO 不兼容，不能直接复用
        <code>socket.io-client</code>。
      </p>

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

      <p>
        <code>AddSignalR()</code> 把 Hub、连接管理和消息发送服务注册进 DI；
        <code>MapHub&lt;ChatHub&gt;("/chat")</code> 把一个 Hub 暴露成连接地址。前端连接的 URL
        必须和这里的路由一致，例如 <code>/chat</code>。
      </p>

      <h3>Hub 核心概念</h3>
      <h4>Hub 对应 Gateway</h4>
      <LessonCodeCompare
        leftTitle="NestJS Socket.IO"
        leftCode={`@WebSocketGateway({ namespace: '/socket' })
export class SocketGateway implements OnGatewayConnection {
  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, room: string) { ... }
}`}
        leftLanguage="typescript"
        rightTitle="ASP.NET Core SignalR"
        rightCode={`public class ChatHub : Hub
{
    // Hub 是 SignalR 的核心类，类似 Gateway
    // - 继承 Hub 获得连接管理、组管理、消息发送能力
    // - 方法名默认对所有客户端暴露

    [HubMethodName("JoinRoom")]
    public async Task JoinRoom(string room) { ... }
}`}
        rightLanguage="csharp"
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
await Clients.User(userId).SendAsync("Msg", data);        // 指定用户（多设备）
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
        await Clients.User(targetUserId).SendAsync("DirectMessage", new
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
            ConnectionAborted = Context.ConnectionAborted.IsCancellationRequested,
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
// → SignalR: await Clients.User(targetUserId).SendAsync("DirectMessage", payload)`}
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

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能搭建 Hub、加入/离开 Groups，并用 <code>Clients.Caller</code>、
            <code>Clients.Group</code>、<code>Clients.User</code> 发送不同范围的消息。
          </p>
        }
        id="signalr-hub-main"
        title="完成 SignalR Hub 主线"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>SignalR 和 Socket.IO 为什么不能直接互通？</li>
        <li>
          <code>Clients.Caller</code>、<code>Clients.Group</code>、<code>Clients.User</code>{" "}
          分别发送给谁？
        </li>
        <li>Groups 和数据库里的群组成员关系有什么区别？</li>
      </ul>

      <TeacherTask title="Phase 5 主线任务">
        <p>
          在复刻项目中完成 Phase 5：实现实时通信 — SignalR Hub、房间系统、点对点消息、广播，对比你的
          NestJS Socket.IO 实现。
        </p>
      </TeacherTask>

      <h3>实战步骤</h3>

      <LessonStep title="步骤 1：搭建最小 SignalR Hub 项目" defaultCollapsed>
        <h4>任务说明</h4>
        <p>创建一个 ASP.NET Core Web 项目，注册 SignalR 服务并映射 Hub 端点。</p>

        <h4>实现步骤</h4>
        <ol>
          <li>创建项目</li>
          <li>创建 ChatHub 类并继承 Hub</li>
          <li>在 Program.cs 中注册 SignalR 服务</li>
          <li>映射 Hub 端点路由</li>
          <li>配置 CORS（如果前端跨域访问）</li>
        </ol>

        <h4>代码示例</h4>
        <LessonCode
          code={`// 1. 创建项目
dotnet new webapi -n SignalRChat
cd SignalRChat`}
          language="bash"
          title="创建项目"
        />

        <p>
          这里用 <code>webapi</code> 模板是为了得到完整的 ASP.NET Core Web 项目骨架：它已经有
          <code>Program.cs</code>、配置文件和 HTTP 管道，后面只需要在这个基础上注册 SignalR 并添加
          Hub 类。
        </p>

        <LessonCode
          code={`// Hubs/ChatHub.cs
using Microsoft.AspNetCore.SignalR;

public class ChatHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"Client connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"Client disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }
}`}
          language="csharp"
          title="最小 Hub"
        />

        <LessonCode
          code={`// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();

// 配置 CORS（如果需要）
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

app.MapHub<ChatHub>("/chat");

app.Run();`}
          language="csharp"
          title="配置 SignalR"
        />

        <h4>检查点</h4>
        <ul>
          <li>✅ 项目能够成功启动</li>
          <li>✅ 访问 <code>http://localhost:5000/chat</code> 返回 404（这是正常的，因为是 WebSocket 端点）</li>
          <li>✅ 控制台没有报错</li>
        </ul>

        <h4>参考答案</h4>
        <p>完整项目结构：</p>
        <LessonCode
          code={`SignalRChat/
├── Hubs/
│   └── ChatHub.cs
├── Program.cs
└── SignalRChat.csproj`}
          language="plaintext"
          title="项目结构"
        />
      </LessonStep>

      <LessonStep title="步骤 2：实现 JoinRoom / LeaveRoom / SendMessage">
        <h4>任务说明</h4>
        <p>实现房间的加入、离开和消息发送功能，使用 SignalR Groups 管理房间成员。</p>

        <h4>实现步骤</h4>
        <ol>
          <li>添加 JoinRoom 方法，使用 Groups.AddToGroupAsync</li>
          <li>添加 LeaveRoom 方法，使用 Groups.RemoveFromGroupAsync</li>
          <li>添加 SendMessage 方法，使用 Clients.Group 发送消息</li>
          <li>在加入/离开时通知房间内其他成员</li>
        </ol>

        <h4>代码示例</h4>
        <LessonCode
          code={`public class ChatHub : Hub
{
    public async Task JoinRoom(string room)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, room);

        await Clients.Group(room).SendAsync("UserJoinedRoom", new
        {
            ConnectionId = Context.ConnectionId,
            Room = room,
            Timestamp = DateTime.UtcNow
        });

        // 给当前用户发送确认
        await Clients.Caller.SendAsync("JoinedRoom", new
        {
            Room = room,
            Message = $"你已加入房间 {room}"
        });
    }

    public async Task LeaveRoom(string room)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);

        await Clients.Group(room).SendAsync("UserLeftRoom", new
        {
            ConnectionId = Context.ConnectionId,
            Room = room,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task SendMessage(string room, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new ArgumentException("消息不能为空");
        }

        var payload = new
        {
            SenderId = Context.ConnectionId,
            Room = room,
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        // 发送给房间内所有成员（包括自己）
        await Clients.Group(room).SendAsync("ReceiveMessage", payload);
    }
}`}
          language="csharp"
          title="房间操作"
        />

        <h4>检查点</h4>
        <ul>
          <li>✅ 调用 JoinRoom 后能收到 "JoinedRoom" 事件</li>
          <li>✅ 房间内其他成员能收到 "UserJoinedRoom" 通知</li>
          <li>✅ 发送消息后房间内所有成员都能收到</li>
          <li>✅ 离开房间后不再收到该房间的消息</li>
        </ul>

        <h4>参考答案</h4>
        <LessonCode
          code={`// 前端测试代码（使用 @microsoft/signalr）
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5000/chat")
  .build();

connection.on("ReceiveMessage", (data) => {
  console.log("收到消息:", data);
});

connection.on("UserJoinedRoom", (data) => {
  console.log("用户加入:", data);
});

await connection.start();
await connection.invoke("JoinRoom", "room1");
await connection.invoke("SendMessage", "room1", "Hello!");`}
          language="typescript"
          title="前端测试"
        />
      </LessonStep>

      <LessonStep title="步骤 3：实现 SendDirectMessage（点对点）">
        <h4>任务说明</h4>
        <p>实现点对点私聊功能，使用 Context.ConnectionId 或 Context.UserIdentifier 定位目标用户。</p>

        <h4>实现步骤</h4>
        <ol>
          <li>添加 SendDirectMessage 方法</li>
          <li>使用 Clients.Client(connectionId) 发送给指定连接</li>
          <li>或使用 Clients.User(userId) 发送给指定用户的所有连接</li>
          <li>给发送者发送确认消息</li>
        </ol>

        <h4>代码示例</h4>
        <LessonCode
          code={`public class ChatHub : Hub
{
    // 方式 1：通过 ConnectionId 发送（临时连接）
    public async Task SendDirectMessage(string targetConnectionId, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new ArgumentException("消息不能为空");
        }

        var payload = new
        {
            SenderId = Context.ConnectionId,
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        // 发送给目标连接
        await Clients.Client(targetConnectionId).SendAsync("DirectMessage", payload);

        // 给发送者确认
        await Clients.Caller.SendAsync("MessageSent", new
        {
            TargetConnectionId = targetConnectionId,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }

    // 方式 2：通过 UserId 发送（需要认证，跨设备）
    public async Task SendDirectMessageToUser(string targetUserId, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new ArgumentException("消息不能为空");
        }

        var senderId = Context.UserIdentifier;

        var payload = new
        {
            SenderId = senderId,
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        // 发送给目标用户的所有连接（多设备）
        await Clients.User(targetUserId).SendAsync("DirectMessage", payload);

        // 给发送者确认
        await Clients.Caller.SendAsync("MessageSent", new
        {
            TargetUserId = targetUserId,
            Message = message
        });
    }
}`}
          language="csharp"
          title="点对点消息"
        />

        <h4>检查点</h4>
        <ul>
          <li>✅ 使用 ConnectionId 能成功发送私聊消息</li>
          <li>✅ 只有目标用户收到消息，其他用户不受影响</li>
          <li>✅ 发送者能收到 "MessageSent" 确认</li>
          <li>✅ 如果使用 UserId，同一用户的多个设备都能收到</li>
        </ul>

        <h4>参考答案</h4>
        <LessonCode
          code={`// 前端测试
connection.on("DirectMessage", (data) => {
  console.log("收到私聊:", data);
});

connection.on("MessageSent", (data) => {
  console.log("消息已发送:", data);
});

// 获取当前 ConnectionId
const connectionId = connection.connectionId;
console.log("我的 ConnectionId:", connectionId);

// 发送私聊给另一个连接
await connection.invoke("SendDirectMessage", "目标ConnectionId", "嗨，私聊消息");`}
          language="typescript"
          title="前端测试私聊"
        />
      </LessonStep>

      <LessonStep title="步骤 4：实现 Broadcast（广播）">
        <h4>任务说明</h4>
        <p>实现全局广播功能，向所有连接的客户端发送消息（可选择是否排除发送者）。</p>

        <h4>实现步骤</h4>
        <ol>
          <li>添加 Broadcast 方法</li>
          <li>使用 Clients.All 发送给所有连接</li>
          <li>或使用 Clients.AllExcept 排除发送者</li>
          <li>添加权限检查（可选）</li>
        </ol>

        <h4>代码示例</h4>
        <LessonCode
          code={`public class ChatHub : Hub
{
    public async Task Broadcast(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new ArgumentException("消息不能为空");
        }

        var payload = new
        {
            SenderId = Context.ConnectionId,
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        // 方式 1：发送给所有人（包括自己）
        await Clients.All.SendAsync("BroadcastMessage", payload);

        // 方式 2：发送给所有人（排除自己）
        // await Clients.AllExcept(Context.ConnectionId).SendAsync("BroadcastMessage", payload);
    }

    // 带权限检查的广播（仅管理员）
    public async Task AdminBroadcast(string message)
    {
        // 检查权限（需要先配置 JWT 认证）
        var isAdmin = Context.User?.IsInRole("Admin") ?? false;
        if (!isAdmin)
        {
            throw new HubException("只有管理员可以发送广播");
        }

        var payload = new
        {
            Type = "AdminBroadcast",
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        await Clients.All.SendAsync("BroadcastMessage", payload);
    }
}`}
          language="csharp"
          title="广播功能"
        />

        <h4>检查点</h4>
        <ul>
          <li>✅ 调用 Broadcast 后所有连接的客户端都能收到</li>
          <li>✅ 使用 AllExcept 时发送者不会收到自己的消息</li>
          <li>✅ AdminBroadcast 对非管理员抛出异常</li>
          <li>✅ 断开连接的客户端不会收到后续广播</li>
        </ul>

        <h4>参考答案</h4>
        <LessonCode
          code={`// 前端测试
connection.on("BroadcastMessage", (data) => {
  console.log("收到广播:", data);
  alert(\`广播消息: \${data.Message}\`);
});

await connection.invoke("Broadcast", "这是一条全局广播消息！");`}
          language="typescript"
          title="前端测试广播"
        />
      </LessonStep>

      <LessonStep title="步骤 5：实现连接统计（在线人数）">
        <h4>任务说明</h4>
        <p>实现在线人数统计功能，在连接和断开时更新并广播当前在线人数。</p>

        <h4>实现步骤</h4>
        <ol>
          <li>创建静态类或服务追踪连接数</li>
          <li>在 OnConnectedAsync 时增加计数</li>
          <li>在 OnDisconnectedAsync 时减少计数</li>
          <li>广播最新在线人数给所有客户端</li>
        </ol>

        <h4>代码示例</h4>
        <LessonCode
          code={`// Services/ConnectionTracker.cs
public static class ConnectionTracker
{
    private static int _connectedCount = 0;
    private static readonly ConcurrentDictionary<string, string> _connections = new();

    public static void AddConnection(string connectionId, string userId)
    {
        _connections[connectionId] = userId;
        Interlocked.Increment(ref _connectedCount);
    }

    public static void RemoveConnection(string connectionId)
    {
        if (_connections.TryRemove(connectionId, out _))
        {
            Interlocked.Decrement(ref _connectedCount);
        }
    }

    public static int TotalConnections => _connectedCount;

    public static int UniqueUsers => _connections.Values.Distinct().Count();
}`}
          language="csharp"
          title="连接追踪器"
        />

        <LessonCode
          code={`public class ChatHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier ?? Context.ConnectionId;
        ConnectionTracker.AddConnection(Context.ConnectionId, userId);

        // 广播最新在线统计
        await Clients.All.SendAsync("OnlineStatsChanged", new
        {
            TotalConnections = ConnectionTracker.TotalConnections,
            UniqueUsers = ConnectionTracker.UniqueUsers,
            Timestamp = DateTime.UtcNow
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        ConnectionTracker.RemoveConnection(Context.ConnectionId);

        // 广播最新在线统计
        await Clients.All.SendAsync("OnlineStatsChanged", new
        {
            TotalConnections = ConnectionTracker.TotalConnections,
            UniqueUsers = ConnectionTracker.UniqueUsers,
            Timestamp = DateTime.UtcNow
        });

        await base.OnDisconnectedAsync(exception);
    }

    // 手动获取在线统计
    public async Task GetOnlineStats()
    {
        await Clients.Caller.SendAsync("OnlineStatsChanged", new
        {
            TotalConnections = ConnectionTracker.TotalConnections,
            UniqueUsers = ConnectionTracker.UniqueUsers,
            Timestamp = DateTime.UtcNow
        });
    }
}`}
          language="csharp"
          title="集成连接统计"
        />

        <h4>检查点</h4>
        <ul>
          <li>✅ 新连接建立时所有客户端收到更新后的在线人数</li>
          <li>✅ 连接断开时在线人数正确减少</li>
          <li>✅ TotalConnections 和 UniqueUsers 统计准确</li>
          <li>✅ 多个浏览器标签同时连接时统计正确</li>
        </ul>

        <h4>参考答案</h4>
        <LessonCode
          code={`// 前端显示在线人数
connection.on("OnlineStatsChanged", (data) => {
  console.log("在线统计更新:", data);
  document.getElementById("online-count").textContent =
    \`在线: \${data.TotalConnections} 连接 / \${data.UniqueUsers} 用户\`;
});

// 主动获取在线统计
await connection.invoke("GetOnlineStats");`}
          language="typescript"
          title="前端显示在线人数"
        />

        <TeacherTask title="多实例部署注意">
          <p>
            静态字典只在单实例中有效。多实例部署时需要使用 <strong>Redis Backplane</strong> 或持久化存储来共享连接状态：
          </p>
          <LessonCode
            code={`dotnet add package Microsoft.AspNetCore.SignalR.StackExchangeRedis`}
            language="bash"
            title="安装 Redis Backplane 包"
          />
          <p>
            安装包只是让 SignalR 具备用 Redis 同步消息的能力；真正让多实例共享分组和广播消息的是下面的
            <code>AddStackExchangeRedis</code> 配置。没有它时，单个实例内能发消息，多实例之间不会互相知道连接状态。
          </p>
          <LessonCode
            code={`// Program.cs
builder.Services.AddSignalR()
    .AddStackExchangeRedis("localhost:6379", options =>
    {
        options.Configuration.ChannelPrefix = "SignalRChat";
    });`}
            language="csharp"
            title="Redis Backplane"
          />
        </TeacherTask>
      </LessonStep>

      <LessonStep title="步骤 6：对比 SignalR 与 NestJS Socket.IO 实现">
        <h4>任务说明</h4>
        <p>对比你的 NestJS Socket.IO 实现和 SignalR 实现，理解两者的差异和各自的优势。</p>

        <h4>对比维度</h4>

        <LessonTable
          headers={["功能", "NestJS Socket.IO", "ASP.NET SignalR"]}
          rows={[
            ["协议", "Socket.IO 协议（自定义）", "SignalR 协议（WebSocket/SSE/Long Polling）"],
            ["客户端库", "socket.io-client", "@microsoft/signalr"],
            ["互通性", "✅ JS/Python/Java 客户端", "✅ .NET/JS/Java 客户端"],
            ["房间管理", "socket.join(room)", "Groups.AddToGroupAsync()"],
            ["广播", "socket.broadcast.emit()", "Clients.AllExcept()"],
            ["点对点", "手动维护 userId → socketId", "Clients.User(userId)（需认证）"],
            ["自动重连", "✅ 内置", "✅ 内置"],
            ["类型安全", "需要手动定义事件类型", "强类型 Hub（可选）"],
            ["性能", "Node.js 单线程", ".NET 多线程"],
          ]}
        />

        <h4>代码对比</h4>
        <LessonCodeCompare
          leftTitle="NestJS Socket.IO"
          leftCode={`@WebSocketGateway({ namespace: '/socket' })
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string }
  ) {
    client.join(data.room);
    this.server.to(data.room).emit('user-joined', {
      userId: client.data.userId,
      room: data.room
    });
  }

  @SubscribeMessage('send-message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; message: string }
  ) {
    this.server.to(data.room).emit('room-message', {
      userId: client.data.userId,
      message: data.message,
      timestamp: new Date()
    });
  }
}`}
          leftLanguage="typescript"
          rightTitle="ASP.NET SignalR"
          rightCode={`[Authorize]
public class ChatHub : Hub
{
    public async Task JoinRoom(string room)
    {
        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            room
        );

        await Clients.Group(room).SendAsync(
            "UserJoined",
            new
            {
                UserId = Context.UserIdentifier,
                Room = room
            }
        );
    }

    public async Task SendMessage(string room, string message)
    {
        await Clients.Group(room).SendAsync(
            "ReceiveMessage",
            new
            {
                UserId = Context.UserIdentifier,
                Message = message,
                Timestamp = DateTime.UtcNow
            }
        );
    }
}`}
          rightLanguage="csharp"
        />

        <h4>检查点</h4>
        <ul>
          <li>✅ 理解 SignalR 和 Socket.IO 协议不兼容</li>
          <li>✅ 理解 Groups 是连接级分组，不是持久化的群组关系</li>
          <li>✅ 理解 Clients.User() 需要 JWT 认证才能使用</li>
          <li>✅ 能够根据业务需求选择合适的技术栈</li>
        </ul>

        <h4>参考答案</h4>

        <h5>核心差异总结</h5>
        <ol>
          <li>
            <strong>协议层面</strong>：SignalR 和 Socket.IO 使用不同的协议，无法互通。
          </li>
          <li>
            <strong>房间管理</strong>：Socket.IO 的 <code>join/leave</code> 是同步的，SignalR 的 Groups 是异步的。
          </li>
          <li>
            <strong>用户识别</strong>：Socket.IO 需要手动维护 userId → socketId 映射，SignalR 可以通过 <code>Context.UserIdentifier</code> 自动识别（需 JWT）。
          </li>
          <li>
            <strong>类型安全</strong>：SignalR 可以使用强类型 Hub（<code>Hub&lt;IClient&gt;</code>），编译时检查方法名和参数。
          </li>
          <li>
            <strong>多实例部署</strong>：两者都需要 backplane（Socket.IO 用 Redis Adapter，SignalR 用 Redis Backplane）。
          </li>
        </ol>

        <LessonQuote>
          选择建议：如果前端是 React/Vue，后端是 .NET，推荐 SignalR。如果团队全栈 JS/TS，推荐 Socket.IO。
        </LessonQuote>
      </LessonStep>

      <h3>总结与要点回顾</h3>

      <h4>核心要点</h4>
      <ul>
        <li>
          <strong>SignalR Hub</strong> 是实时通信的核心，类似于 Socket.IO 的 Gateway。
        </li>
        <li>
          <strong>Groups</strong> 用于连接级分组（房间），断开后自动移除，不要当作持久化的群组关系。
        </li>
        <li>
          <strong>Clients</strong> 提供多种发送目标：Caller（当前）、All（所有）、Group（房间）、Users（用户）。
        </li>
        <li>
          <strong>Context</strong> 包含连接信息（ConnectionId、UserIdentifier、User），认证后可用。
        </li>
        <li>
          <strong>协议不兼容</strong>：SignalR 和 Socket.IO 无法互通，前端需要使用对应的客户端库。
        </li>
      </ul>

      <h4>常见陷阱</h4>
      <ul>
        <li>❌ 使用 Socket.IO 客户端连接 SignalR Hub</li>
        <li>❌ 用静态字典做多实例部署的全局状态（需要 Redis）</li>
        <li>❌ 把 Groups 当作持久化的群组成员关系（需要落库）</li>
        <li>❌ 忘记 await 异步方法（会导致消息丢失）</li>
        <li>❌ 在 Hub 构造函数中访问 Context（此时还未初始化）</li>
      </ul>

      <h4>最佳实践</h4>
      <ul>
        <li>✅ 使用 <code>[Authorize]</code> 保护 Hub，避免未认证连接</li>
        <li>✅ 在 OnConnectedAsync 中验证用户身份和权限</li>
        <li>✅ 使用 <code>[HubMethodName]</code> 自定义方法名（前端友好）</li>
        <li>✅ 在发送消息前验证输入（长度、格式、权限）</li>
        <li>✅ 使用 ILogger 记录连接、断开和异常</li>
        <li>✅ 多实例部署时使用 Redis Backplane</li>
        <li>✅ 业务数据（群组成员、消息记录）持久化到数据库</li>
      </ul>

      <h4>下一步</h4>
      <p>
        完成本章后，你应该能够独立搭建 SignalR Hub，实现房间、私聊、广播等功能。下一章将学习如何接入 JWT
        认证，实现基于角色的权限控制，以及如何处理自动重连和状态恢复。
      </p>
    </LessonShell>
  );
};
