import {
  LessonCheckpoint,

  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  TeacherTask,
} from "@/components/lesson-ui";

export const SignalrAuthReconnectLesson = ({
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
        学完本节后，你应该能用 JWT 认证保护 SignalR Hub，确认 <code>Context.User</code>{" "}
        可用，并在前端实现自动重连，以及重连后恢复业务房间状态。
      </p>

      <TeacherTask title="老师提示">
        <p>
          不要认为自动重连会自动恢复所有业务房间。SignalR 客户端能自动重建连接，但
          <strong>房间、当前会话等业务状态需要在重连后由你重新恢复</strong>。
        </p>
      </TeacherTask>

      <h3>JWT 认证 — 对应你的 WsJwtGuard</h3>
      <p>
        在 <code>Program.cs</code> 配置 JWT Bearer 认证。注意 SignalR 的{" "}
        <code>access_token</code> 是放在查询参数里的，需要在{" "}
        <code>OnMessageReceived</code> 事件里把它取出来。
      </p>
      <LessonCode
        code={`// Program.cs
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
    });`}
        language="csharp"
        title="配置 JWT Bearer 认证"
      />

      <TeacherTask title="与 NestJS 对照">
        <ul>
          <li>
            NestJS：手动提取 token → <code>jwtService.verify()</code> → 设置{" "}
            <code>client.user</code>
          </li>
          <li>
            SignalR：JWT 中间件自动解析 token → <code>Context.User</code> 自动填充
          </li>
        </ul>
      </TeacherTask>

      <LessonQuote>
        <strong>安全提醒</strong>：浏览器 WebSocket / SSE 连接常通过{" "}
        <code>access_token</code> 查询参数传递 JWT。必须使用 HTTPS，并避免在网关、日志、监控系统中记录完整
        URL。
      </LessonQuote>

      <h3>前端连接</h3>
      <p>
        前端使用 <code>@microsoft/signalr</code> 客户端库建立连接，通过{" "}
        <code>accessTokenFactory</code> 提供 JWT。
      </p>
      <LessonCode
        code={`// 前端使用 @microsoft/signalr
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://api.example.com/chat", {
        accessTokenFactory: () => localStorage.getItem("accessToken")!,
    })
    .withAutomaticReconnect()
    .build();

// 监听服务端消息
connection.on("ReceiveMessage", (data) => {
    console.log(\`[\${data.senderUsername}]: \${data.message}\`);
});

connection.on("UserJoinedRoom", (data) => {
    console.log(\`\${data.username} joined room \${data.room}\`);
});

connection.on("UserLeftRoom", (data) => {
    console.log(\`\${data.userId} left room \${data.room}\`);
});

// 调用服务端方法
async function sendMessage(room: string, message: string) {
    await connection.invoke("SendMessage", room, message);
}

async function joinRoom(room: string) {
    await connection.invoke("JoinRoom", room);
}

// 启动连接
connection.start().catch(err => console.error(err.toString()));`}
        language="typescript"
        title="前端建立连接"
      />

      <h3>断线重连 — 客户端内置重连，业务状态需要恢复</h3>
      <p>
        SignalR 客户端支持自动重连，但房间、当前会话等业务状态需要在重连后恢复。
      </p>
      <LessonCode
        code={`// SignalR 客户端支持自动重连，但房间、当前会话等业务状态需要重连后恢复
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
    console.log(\`Reconnecting... Error: \${error}\`);
    // UI 显示 "正在重连..."
});

connection.onreconnected((connectionId) => {
    console.log(\`Reconnected! New ConnectionId: \${connectionId}\`);
    // 重新加入房间
    connection.invoke("JoinRoom", currentRoom).catch(() => {});
});`}
        language="typescript"
        title="自动重连与房间恢复"
      />

      <TeacherTask title="为什么重连后要重新 JoinRoom">
        <p>
          重连会产生一个<strong>新的 ConnectionId</strong>。SignalR 的 Groups 是连接级分组，旧连接加入的房间不会自动迁移到新连接，因此必须在{" "}
          <code>onreconnected</code> 回调里重新 <code>JoinRoom</code>。
        </p>
      </TeacherTask>

      <h3>常见误区</h3>
      <ul>
        <li>认为自动重连会自动恢复所有业务房间。</li>
        <li>
          在日志中记录包含 <code>access_token</code> 的完整 URL。
        </li>
      </ul>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能让 Hub 使用 JWT 身份，前端通过 <code>accessTokenFactory</code> 连接，并在重连后重新加入房间。
          </p>
        }
        id="signalr-auth-reconnect-main"
        title="完成 SignalR 认证与重连主线"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>WebSocket 查询参数传 JWT 有什么安全注意事项？</li>
        <li>自动重连后为什么要重新 JoinRoom？</li>
      </ul>

      <h3>实战练习</h3>

      <LessonStep title="步骤 1：实现 JWT 认证集成，确认 Context.User 可用">
        <p>
          <strong>目标</strong>：配置 ASP.NET Core JWT 认证中间件，让 SignalR Hub
          能够通过 <code>Context.User</code> 获取当前用户身份信息。
        </p>

        <h4>详细步骤</h4>
        <ol>
          <li>
            在 <code>appsettings.json</code> 中配置 JWT 参数：
            <LessonCode
              code={`{
  "Jwt": {
    "Secret": "your-secret-key-at-least-32-characters-long",
    "Issuer": "your-app-name",
    "Audience": "your-app-name",
    "ExpiresInMinutes": 60
  }
}`}
              language="json"
              title="appsettings.json"
            />
          </li>
          <li>
            在 <code>Program.cs</code> 中注册 JWT 认证服务，并在{" "}
            <code>OnMessageReceived</code> 事件中提取查询参数中的 token：
            <LessonCode
              code={`using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

// 添加 JWT 认证
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

        // SignalR 专用：从查询参数中提取 access_token
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                // 只对 SignalR Hub 路径处理
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chat"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// 启用认证和授权中间件（必须在 MapHub 之前）
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<ChatHub>("/chat");`}
              language="csharp"
              title="Program.cs - 配置 JWT 认证"
            />
          </li>
          <li>
            在 Hub 中添加 <code>[Authorize]</code> 特性，并使用{" "}
            <code>Context.User</code> 获取用户信息：
            <LessonCode
              code={`using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

[Authorize] // 要求用户已认证
public class ChatHub : Hub
{
    public async Task SendMessage(string room, string message)
    {
        // 从 JWT Claims 中获取用户信息
        var userId = Context.User?.FindFirst("sub")?.Value
                  ?? Context.User?.FindFirst("userId")?.Value;
        var username = Context.User?.FindFirst("name")?.Value
                    ?? Context.User?.Identity?.Name;

        if (string.IsNullOrEmpty(userId))
        {
            throw new HubException("未授权：无法获取用户身份");
        }

        await Clients.Group(room).SendAsync("ReceiveMessage", new
        {
            senderId = userId,
            senderUsername = username,
            message = message,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task JoinRoom(string room)
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        var username = Context.User?.FindFirst("name")?.Value;

        await Groups.AddToGroupAsync(Context.ConnectionId, room);

        await Clients.Group(room).SendAsync("UserJoinedRoom", new
        {
            userId,
            username,
            room
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // 处理断线逻辑
        await base.OnDisconnectedAsync(exception);
    }
}`}
              language="csharp"
              title="ChatHub.cs - 使用认证"
            />
          </li>
        </ol>

        <h4>检查点</h4>
        <ul>
          <li>
            ✅ <code>OnMessageReceived</code> 能正确提取{" "}
            <code>access_token</code> 查询参数
          </li>
          <li>
            ✅ Hub 方法中 <code>Context.User</code> 不为 null，且包含正确的
            Claims
          </li>
          <li>
            ✅ 未提供或提供无效 token 时，连接被拒绝（401 或连接失败）
          </li>
          <li>
            ✅ 日志或网络监控中不应记录包含 <code>access_token</code> 的完整 URL
          </li>
        </ul>

        <h4>参考答案</h4>
        <p>
          完成上述配置后，运行项目并尝试用前端连接。如果没有提供 token 或 token
          无效，连接应该被拒绝。在 Hub 方法中打印{" "}
          <code>Context.User.Identity?.Name</code>，应该能看到正确的用户名。
        </p>
      </LessonStep>

      <LessonStep title="步骤 2：前端用 @microsoft/signalr 连接并通过 accessTokenFactory 传 JWT">
        <p>
          <strong>目标</strong>：在前端使用 <code>@microsoft/signalr</code>{" "}
          客户端库建立连接，通过 <code>accessTokenFactory</code> 提供 JWT token。
        </p>

        <h4>详细步骤</h4>
        <ol>
          <li>
            安装 SignalR 客户端库：<code>npm install @microsoft/signalr</code>
          </li>
          <li>
            创建连接并配置 <code>accessTokenFactory</code>：
            <LessonCode
              code={`import * as signalR from "@microsoft/signalr";

// 创建连接
const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://api.example.com/chat", {
        accessTokenFactory: () => {
            // 从 localStorage、cookie 或状态管理中获取 token
            const token = localStorage.getItem("accessToken");
            if (!token) {
                console.error("未找到 access token");
                return "";
            }
            return token;
        },
        transport: signalR.HttpTransportType.WebSockets, // 优先使用 WebSocket
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

// 监听服务端消息
connection.on("ReceiveMessage", (data) => {
    console.log(\`[\${data.senderUsername}]: \${data.message}\`);
    // 更新 UI
});

connection.on("UserJoinedRoom", (data) => {
    console.log(\`\${data.username} 加入了房间 \${data.room}\`);
});

connection.on("UserLeftRoom", (data) => {
    console.log(\`\${data.userId} 离开了房间 \${data.room}\`);
});

// 启动连接
async function startConnection() {
    try {
        await connection.start();
        console.log("SignalR 连接成功");
    } catch (err) {
        console.error("SignalR 连接失败：", err);
        // 5 秒后重试
        setTimeout(startConnection, 5000);
    }
}

startConnection();`}
              language="typescript"
              title="signalr-client.ts - 建立连接"
            />
          </li>
          <li>
            调用服务端方法：
            <LessonCode
              code={`// 发送消息
async function sendMessage(room: string, message: string) {
    try {
        await connection.invoke("SendMessage", room, message);
    } catch (err) {
        console.error("发送消息失败：", err);
    }
}

// 加入房间
async function joinRoom(room: string) {
    try {
        await connection.invoke("JoinRoom", room);
        console.log(\`已加入房间：\${room}\`);
    } catch (err) {
        console.error("加入房间失败：", err);
    }
}

// 使用示例
await joinRoom("room-001");
await sendMessage("room-001", "Hello, world!");`}
              language="typescript"
              title="调用服务端方法"
            />
          </li>
        </ol>

        <h4>检查点</h4>
        <ul>
          <li>
            ✅ <code>accessTokenFactory</code> 能正确返回有效的 JWT token
          </li>
          <li>✅ 连接建立成功，控制台输出 "SignalR 连接成功"</li>
          <li>
            ✅ 能够成功调用服务端方法（<code>JoinRoom</code>、
            <code>SendMessage</code>）
          </li>
          <li>✅ 能够接收服务端推送的消息</li>
          <li>
            ✅ token 无效或过期时，连接被拒绝并在控制台显示错误信息
          </li>
        </ul>

        <h4>参考答案</h4>
        <p>
          完成配置后，打开浏览器开发者工具的网络面板，筛选 WS（WebSocket）连接，应该能看到连接成功建立，且查询参数中包含{" "}
          <code>access_token=xxx</code>。尝试发送消息，应该能在控制台看到服务端返回的消息。
        </p>
      </LessonStep>

      <LessonStep title="步骤 3：实现断线重连 + 自动加入房间">
        <p>
          <strong>目标</strong>：配置 SignalR 客户端自动重连，并在重连成功后恢复业务状态（重新加入之前的房间）。
        </p>

        <h4>详细步骤</h4>
        <ol>
          <li>
            在连接构建时添加 <code>withAutomaticReconnect()</code>：
            <LessonCode
              code={`const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://api.example.com/chat", {
        accessTokenFactory: () => localStorage.getItem("accessToken") || "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // 延迟递增重连
    .configureLogging(signalR.LogLevel.Information)
    .build();`}
              language="typescript"
              title="启用自动重连"
            />
            <p>
              <code>withAutomaticReconnect()</code> 接受一个延迟数组，表示每次重连的等待时间（毫秒）。如果不传参数，默认使用{" "}
              <code>[0, 2000, 10000, 30000]</code>。
            </p>
          </li>
          <li>
            监听重连事件并恢复业务状态：
            <LessonCode
              code={`// 记录当前加入的房间
let currentRooms: Set<string> = new Set();

// 监听重连中事件
connection.onreconnecting((error) => {
    console.warn("连接断开，正在重连...", error);
    // 更新 UI：显示 "正在重连..."
});

// 监听重连成功事件
connection.onreconnected(async (connectionId) => {
    console.log(\`重连成功！新的 ConnectionId: \${connectionId}\`);

    // 重新加入之前的所有房间
    for (const room of currentRooms) {
        try {
            await connection.invoke("JoinRoom", room);
            console.log(\`重新加入房间：\${room}\`);
        } catch (err) {
            console.error(\`重新加入房间失败：\${room}\`, err);
        }
    }

    // 更新 UI：显示 "已重连"
});

// 监听连接关闭事件
connection.onclose((error) => {
    console.error("连接已关闭", error);
    // 更新 UI：显示 "连接已断开"
});

// 修改 joinRoom 函数，记录当前房间
async function joinRoom(room: string) {
    try {
        await connection.invoke("JoinRoom", room);
        currentRooms.add(room); // 记录房间
        console.log(\`已加入房间：\${room}\`);
    } catch (err) {
        console.error("加入房间失败：", err);
    }
}

// 离开房间时也要从记录中移除
async function leaveRoom(room: string) {
    try {
        await connection.invoke("LeaveRoom", room);
        currentRooms.delete(room); // 移除记录
        console.log(\`已离开房间：\${room}\`);
    } catch (err) {
        console.error("离开房间失败：", err);
    }
}`}
              language="typescript"
              title="监听重连事件并恢复房间状态"
            />
          </li>
          <li>
            测试断线重连：
            <ul>
              <li>启动应用并加入一个房间</li>
              <li>
                在开发者工具的网络面板中，找到 WebSocket 连接并手动断开（或暂停服务端）
              </li>
              <li>观察控制台输出，应该看到 "正在重连..." 和 "重连成功"</li>
              <li>确认重连后自动重新加入了之前的房间</li>
            </ul>
          </li>
        </ol>

        <h4>检查点</h4>
        <ul>
          <li>
            ✅ 连接断开时，<code>onreconnecting</code> 被触发
          </li>
          <li>
            ✅ 自动重连成功后，<code>onreconnected</code> 被触发
          </li>
          <li>✅ 重连成功后，自动重新加入之前的所有房间</li>
          <li>
            ✅ 重连期间，UI 有明确的状态提示（"正在重连..."、"已重连"）
          </li>
          <li>
            ✅ 重连后的 <code>ConnectionId</code> 与之前不同
          </li>
        </ul>

        <h4>参考答案</h4>
        <p>
          完成上述实现后，手动断开网络或暂停服务端，客户端会自动尝试重连。重连成功后，应该能看到控制台输出新的{" "}
          <code>ConnectionId</code>，且之前加入的房间被自动恢复。发送消息时，其他用户应该能正常接收。
        </p>
      </LessonStep>

      <LessonStep title="步骤 4：确认连接走 HTTPS，且日志不记录包含 access_token 的完整 URL">
        <p>
          <strong>目标</strong>：确保生产环境使用 HTTPS 连接，并避免在日志、监控系统中记录包含{" "}
          <code>access_token</code> 的完整 URL。
        </p>

        <h4>详细步骤</h4>
        <ol>
          <li>
            确认前端连接使用 HTTPS：
            <LessonCode
              code={`// 根据环境自动选择协议
const protocol = window.location.protocol === "https:" ? "https:" : "http:";
const wsProtocol = protocol === "https:" ? "wss:" : "ws:";

const connection = new signalR.HubConnectionBuilder()
    .withUrl(\`\${protocol}//\${window.location.host}/chat\`, {
        accessTokenFactory: () => localStorage.getItem("accessToken") || "",
    })
    .withAutomaticReconnect()
    .build();`}
              language="typescript"
              title="根据环境自动选择协议"
            />
            <p>
              生产环境必须使用 HTTPS，以防止 token 在传输过程中被中间人攻击截获。
            </p>
          </li>
          <li>
            配置 ASP.NET Core 日志过滤，避免记录 <code>access_token</code>：
            <LessonCode
              code={`// Program.cs
builder.Logging.AddFilter("Microsoft.AspNetCore.SignalR", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.AspNetCore.Http.Connections", LogLevel.Warning);

// 自定义中间件：在日志中隐藏 access_token
app.Use(async (context, next) =>
{
    var originalPath = context.Request.Path.Value;
    var originalQueryString = context.Request.QueryString.Value;

    // 如果请求包含 access_token，替换为 [REDACTED]
    if (!string.IsNullOrEmpty(originalQueryString) && originalQueryString.Contains("access_token"))
    {
        context.Request.QueryString = new QueryString(
            System.Text.RegularExpressions.Regex.Replace(
                originalQueryString,
                @"access_token=[^&]*",
                "access_token=[REDACTED]"));
    }

    await next();

    // 恢复原始 QueryString（如果需要）
    context.Request.QueryString = new QueryString(originalQueryString);
});`}
              language="csharp"
              title="避免日志记录 access_token"
            />
          </li>
          <li>
            配置 Nginx 或反向代理，避免记录查询参数：
            <LessonCode
              code={`# nginx.conf
location /chat {
    proxy_pass http://backend;

    # 不记录查询参数
    access_log /var/log/nginx/signalr.log main_without_query;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# 定义日志格式（不包含查询参数）
log_format main_without_query '$remote_addr - $remote_user [$time_local] '
                              '"$request_method $uri HTTP/$server_protocol" '
                              '$status $body_bytes_sent "$http_referer" '
                              '"$http_user_agent"';`}
              language="nginx"
              title="Nginx 配置：不记录查询参数"
            />
          </li>
          <li>
            在应用性能监控（APM）工具中配置敏感数据过滤，例如在 Application
            Insights、Sentry 等工具中配置忽略 <code>access_token</code>{" "}
            参数。
          </li>
        </ol>

        <h4>检查点</h4>
        <ul>
          <li>✅ 生产环境使用 HTTPS/WSS 协议</li>
          <li>
            ✅ 应用日志中不包含完整的 <code>access_token</code> 值
          </li>
          <li>
            ✅ Nginx 或反向代理日志中不包含 <code>access_token</code>
          </li>
          <li>
            ✅ APM 工具中不记录 <code>access_token</code> 参数
          </li>
          <li>
            ✅ 开发环境可以使用 HTTP/WS，但生产环境必须强制 HTTPS/WSS
          </li>
        </ul>

        <h4>参考答案</h4>
        <p>
          完成配置后，检查应用日志和 Nginx
          日志，确认不包含完整的 token 值。在浏览器开发者工具的网络面板中，应该看到连接使用{" "}
          <code>wss://</code> 协议。
        </p>
      </LessonStep>

      <h3>总结与要点回顾</h3>
      <ul>
        <li>
          <strong>JWT 认证集成</strong>：SignalR 通过查询参数{" "}
          <code>access_token</code> 传递 JWT，需要在{" "}
          <code>OnMessageReceived</code> 事件中提取并验证。
        </li>
        <li>
          <strong>Context.User</strong>：验证成功后，<code>Context.User</code>{" "}
          自动填充，可直接获取用户 Claims 信息。
        </li>
        <li>
          <strong>自动重连</strong>：SignalR 客户端支持自动重连，通过{" "}
          <code>withAutomaticReconnect()</code> 启用。
        </li>
        <li>
          <strong>业务状态恢复</strong>：重连会生成新的{" "}
          <code>ConnectionId</code>，业务状态（如房间）需要在{" "}
          <code>onreconnected</code> 回调中手动恢复。
        </li>
        <li>
          <strong>安全注意事项</strong>：生产环境必须使用 HTTPS/WSS，避免在日志中记录包含{" "}
          <code>access_token</code> 的完整 URL。
        </li>
        <li>
          <strong>与 NestJS 对比</strong>：ASP.NET Core 的 JWT 中间件自动处理 token
          验证和 Claims 填充，而 NestJS 需要手动实现 Guard 逻辑。
        </li>
      </ul>
    </LessonShell>
  );
};
