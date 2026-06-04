import {
  LessonChecklist,
  LessonCode,
  LessonQuote,
  LessonShell,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const SignalrAuthReconnectLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
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

      <h3>阶段验收问题</h3>
      <ul>
        <li>WebSocket 查询参数传 JWT 有什么安全注意事项？</li>
        <li>自动重连后为什么要重新 JoinRoom？</li>
      </ul>

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="signalr-auth-reconnect-checklist"
        items={[
          "实现 JWT 认证集成，确认 Context.User 可用",
          "前端用 @microsoft/signalr 连接并通过 accessTokenFactory 传 JWT",
          "实现断线重连 + 自动加入房间",
          "确认连接走 HTTPS，且日志不记录包含 access_token 的完整 URL",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
