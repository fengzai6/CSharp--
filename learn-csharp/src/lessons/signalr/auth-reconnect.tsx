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
        学完本节后，你应该能用 JWT 认证保护 TaskHub 的项目通知 Hub，确认 <code>Context.User</code> 可用，并在前端实现自动重连，以及重连后恢复已加入的项目通知通道。
      </p>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          上一节已经完成 <code>ProjectNotificationHub</code> 和项目 Group 推送。本节把 Auth 章节的 JWT 复用到 SignalR，并让前端在断线重连后重新加入当前用户正在看的项目。
        </p>
      </TeacherTask>

      <TeacherTask title="老师提示">
        <p>
          自动重连只会重建连接，不会自动恢复业务状态。SignalR Groups 是连接级分组，新的 <code>ConnectionId</code> 需要重新 <code>JoinProject</code>。
        </p>
      </TeacherTask>

      <h3>JWT 认证</h3>
      <p>
        SignalR 复用 Auth 章节配置的 JWT Bearer 认证。浏览器 WebSocket / SSE 常通过 <code>access_token</code> 查询参数传 token，需要在 <code>OnMessageReceived</code> 中只对 Hub 路径取出它（见 Auth 章节示例）。
      </p>
      <p>
        为何要 query？普通 REST 用 <code>Authorization: Bearer ...</code> 头；
        浏览器原生 WebSocket API <strong>不能自定义请求头</strong>，SignalR 浏览器客户端会在协商时把 token 放到{" "}
        <code>?access_token=</code>。服务端在 <code>OnMessageReceived</code> 里把该参数写回{" "}
        <code>context.Token</code>，后面的 JWT 中间件才能验签。非浏览器（.NET 客户端等）仍可走 Header。
      </p>
      <p>
        只需确认 <code>Program.cs</code> 中有以下注册：
      </p>
      <LessonCode
        code={`// 复用 Auth 章节的 JWT 配置，这里只列 SignalR 相关部分
// 顺序仍是：先认证再授权，再映射 Hub
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<ProjectNotificationHub>("/hubs/projects");`}
        language="csharp"
        title="SignalR 注册"
      />
      <LessonQuote>
        查询参数传 token 必须使用 HTTPS/WSS，并避免在应用日志、网关日志和 APM 中记录完整 URL。否则 <code>access_token</code> 可能被日志系统长期保存。
      </LessonQuote>

      <h3>前端连接</h3>
      <p>
        前端使用 <code>@microsoft/signalr</code> 客户端库，通过 <code>accessTokenFactory</code> 提供当前登录用户的 Access Token。
        不是 <code>socket.io-client</code>；API 也不同：
        <code>invoke</code> 调服务端方法，<code>on</code> 收服务端 <code>SendAsync</code> 的事件名。
      </p>

      <LessonCode
        code={`import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    // withUrl：必须与 MapHub 路径一致
    .withUrl("https://api.example.com/hubs/projects", {
        // 每次协商/重连都会调用，返回当前 Access Token
        accessTokenFactory: () => localStorage.getItem("accessToken") ?? "",
        // 优先 WebSockets；失败时可降级（本例强制 WS 便于调试）
        transport: signalR.HttpTransportType.WebSockets,
    })
    // 断线后按毫秒间隔重试：立刻、2s、5s、10s、30s
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

// on：订阅服务端 SendAsync 的事件名（大小写按服务端字符串）
connection.on("ProjectJoined", (data) => {
    console.log("Project joined", data.projectId);
});

connection.on("WorkItemUpdated", (item) => {
    console.log("Work item updated", item.title, item.status);
});

connection.on("WorkItemCommentAdded", (comment) => {
    console.log("Work item comment added", comment.content);
});

// start：真正建立连接；失败会抛错
await connection.start();`}
        language="typescript"
        title="前端建立项目通知连接"
      />

      <h3>加入项目通知通道</h3>
      <p>
        前端不直接决定自己能不能加入项目。它调用 <code>JoinProject</code>，后端 Hub 根据 <code>Context.User</code> 和 <code>ProjectMember</code> 校验成员关系。
        <code>invoke</code> ≈「RPC 调 Hub 上的公开方法」，不是 Socket.IO 的任意 <code>emit</code> 事件名。
      </p>

      <LessonCode
        code={`// 本地记「业务上我在听哪些项目」——重连后要靠它恢复
const currentProjectIds = new Set<string>();

async function joinProject(projectId: string) {
    // invoke 方法名必须与 Hub 公开方法一致（JoinProject）
    await connection.invoke("JoinProject", projectId);
    currentProjectIds.add(projectId);
}

async function leaveProject(projectId: string) {
    await connection.invoke("LeaveProject", projectId);
    currentProjectIds.delete(projectId);
}

await joinProject("project-001");`}
        language="typescript"
        title="调用 JoinProject / LeaveProject"
      />

      <h3>断线重连与项目恢复</h3>
      <p>
        重连会产生新的 <code>ConnectionId</code>，旧连接加入的 SignalR Groups 不会迁移到新连接。前端要记录当前业务上下文，并在重连成功后重新加入项目通道。
        类比 Socket.IO：<code>reconnect</code> 后也要重新 <code>join</code> room——框架不会替你记住业务房间。
      </p>

      <LessonCode
        code={`connection.onreconnecting((error) => {
    // 正在重试：UI 可显示「实时连接恢复中」
    console.warn("Project notification connection is reconnecting", error);
});

connection.onreconnected(async (connectionId) => {
    // 新 ConnectionId，旧 Group 成员资格已失效
    console.log("Project notification reconnected", connectionId);

    for (const projectId of currentProjectIds) {
        try {
            await connection.invoke("JoinProject", projectId);
            console.log("Project notification restored", projectId);
        } catch (error) {
            // 成员被移除等业务失败：从本地集合删掉，避免死循环重试
            console.error("Failed to restore project notification", projectId, error);
        }
    }
});

connection.onclose((error) => {
    // 自动重连耗尽或手动 stop 后进入
    console.error("Project notification connection closed", error);
});`}
        language="typescript"
        title="重连后恢复项目通知"
      />

      <h3>日志脱敏</h3>
      <p>
        生产环境要降低 SignalR 连接日志噪音，并确保日志系统不会保存完整查询参数。
      </p>

      <LessonCode
        code={`// 在 Program.cs 的中间件管道中，过滤掉包含 access_token 的请求日志
builder.Logging.AddFilter("Microsoft.AspNetCore.SignalR", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.AspNetCore.Http.Connections", LogLevel.Warning);`}
        language="csharp"
        title="降低日志泄漏风险"
      />
      <p>
        生产环境还要确保反向代理、APM 和日志平台不会记录包含 <code>access_token</code> 的完整 URL。查询参数传 JWT 只是浏览器 WebSocket 的无奈之举，服务器端日志要始终脱敏。
      </p>

      <h3>常见误区</h3>
      <ul>
        <li>认为自动重连会自动恢复所有项目 Group。</li>
        <li>在日志中记录包含 <code>access_token</code> 的完整 URL。</li>
        <li>前端直接信任本地项目列表，不让 Hub 校验 <code>ProjectMember</code>。</li>
      </ul>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能让项目通知 Hub 使用 JWT 身份，前端通过 <code>accessTokenFactory</code> 连接，并在重连后重新加入当前项目通知通道。
          </p>
        }
        id="signalr-auth-reconnect-main"
        title="完成 SignalR 认证与项目重连主线"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li>WebSocket 查询参数传 JWT 有什么安全注意事项？</li>
        <li>自动重连后为什么要重新 <code>JoinProject</code>？</li>
        <li>为什么 Hub 仍要查询数据库校验项目成员关系？</li>
      </ul>

      <LessonStep
        title="实战：认证项目通知与重连恢复"
        steps={[
          {
            title: "配置 Hub JWT 取 token 路径",
            content: <p>只在 <code>/hubs/projects</code> 路径读取查询参数里的 <code>access_token</code>。</p>,
            code: `if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/projects"))
{
    context.Token = accessToken;
}`,
            codeLanguage: "csharp",
            codeTitle: "OnMessageReceived",
            checkpoints: ["只匹配项目通知 Hub 路径", "无 token 时连接失败", "日志不输出完整 URL"],
          },
          {
            title: "重连后恢复项目通知",
            content: <p>前端记录当前项目 ID 集合，重连后逐个调用 <code>JoinProject</code>。</p>,
            code: `connection.onreconnected(async () => {
    for (const projectId of currentProjectIds) {
        await connection.invoke("JoinProject", projectId);
    }
});`,
            codeLanguage: "typescript",
            codeTitle: "恢复项目 Group",
            checkpoints: ["记录当前项目集合", "onreconnected 中恢复", "后端重新校验成员关系"],
          },
        ]}
      />
    </LessonShell>
  );
};
