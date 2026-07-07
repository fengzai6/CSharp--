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
        学完本节后，你应该能在 TaskHub 中创建项目通知 Hub，理解 SignalR Hub、Groups、Clients 的分工，并在任务变更、评论新增、成员加入时向项目成员推送实时消息。
      </p>

      <TeacherTask title="TaskHub 当前状态">
        <p>
          TaskHub 已经有 JWT、项目成员、任务和评论模型。本节开始做实时协作：把每个项目映射成一个 SignalR Group，当任务或评论变化时向该项目的在线成员推送通知。
        </p>
      </TeacherTask>

      <TeacherTask title="老师提示">
        <p>
          SignalR 和 Socket.IO <strong>不兼容</strong>。前端必须使用 SignalR 客户端库。SignalR 的 Groups 是<strong>连接级分组</strong>，只代表当前连接加入了哪个推送通道；项目成员关系仍然以数据库里的 <code>ProjectMember</code> 为准。
        </p>
      </TeacherTask>

      <h3>与 NestJS WebSocket 的对照</h3>
      <LessonTable
        headers={["NestJS Socket.IO", "ASP.NET Core SignalR"]}
        rows={[
          ["@WebSocketGateway", "[Authorize] + Hub"],
          ["@SubscribeMessage('join-project')", "public Task JoinProject(string projectId)"],
          ["client.join(projectId)", "await Groups.AddToGroupAsync()"],
          ["server.to(projectId).emit()", "await Clients.Group(projectId).SendAsync()"],
          ["client.emit('event', data)", "await Clients.Caller.SendAsync()"],
        ]}
      />

      <h3>配置 Hub</h3>
      <LessonCode
        code={`# ASP.NET Core Web 项目已包含服务端 SignalR
# 前端客户端另装：npm install @microsoft/signalr`}
        language="bash"
        title="SignalR 依赖"
      />

      <p>
        服务端 SignalR 已随 ASP.NET Core Web 运行时提供，后端通常不需要额外安装服务端包。前端必须安装 <code>@microsoft/signalr</code>，不能复用 <code>socket.io-client</code>。
      </p>

      <LessonCode
        code={`// Program.cs
builder.Services.AddSignalR();

var app = builder.Build();

app.MapHub<ProjectNotificationHub>("/hubs/projects");

app.Run();`}
        language="csharp"
        title="注册并映射项目通知 Hub"
      />

      <h3>Hub 核心概念</h3>
      <LessonCodeCompare
        leftTitle="NestJS Socket.IO"
        leftCode={`@WebSocketGateway({ namespace: '/projects' })
export class ProjectGateway {
  @SubscribeMessage('join-project')
  handleJoinProject(client: Socket, projectId: string) { ... }
}`}
        leftLanguage="typescript"
        rightTitle="ASP.NET Core SignalR"
        rightCode={`[Authorize]
public class ProjectNotificationHub : Hub
{
    public async Task JoinProject(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GetProjectGroup(projectId));
    }

    private static string GetProjectGroup(string projectId) => $"project:{projectId}";
}`}
        rightLanguage="csharp"
      />

      <h4>服务端发送目标</h4>
      <LessonCode
        code={`await Clients.Caller.SendAsync("Connected", data);          // 当前连接
await Clients.All.SendAsync("SystemNotice", data);        // 所有连接
await Clients.User(userId).SendAsync("DirectNotice", data); // 指定用户（多设备）
await Clients.Group($"project:{projectId}").SendAsync("WorkItemUpdated", data); // 项目组
await Clients.Groups(projectGroupIds).SendAsync("ProjectChanged", data);         // 多个项目组`}
        language="csharp"
        title="Clients 发送目标"
      />

      <h3>实现项目通知 Hub</h3>
      <p>
        Hub 负责连接级行为：连接、加入项目组、离开项目组和给客户端发送确认。是否有资格加入项目，要查询数据库的 <code>ProjectMember</code>。
      </p>

      <LessonCode
        code={`using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

[Authorize]
public class ProjectNotificationHub : Hub
{
    private readonly TaskHubDbContext _context;
    private readonly ILogger<ProjectNotificationHub> _logger;

    public ProjectNotificationHub(TaskHubDbContext context, ILogger<ProjectNotificationHub> logger)
    {
        _context = context;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        _logger.LogInformation("SignalR connection {ConnectionId} connected for user {UserId}",
            Context.ConnectionId, userId);

        await Clients.Caller.SendAsync("Connected", new
        {
            Context.ConnectionId,
            UserId = userId
        });

        await base.OnConnectedAsync();
    }

    public async Task JoinProject(string projectId)
    {
        var userId = GetUserId();
        var isMember = await _context.ProjectMembers.AnyAsync(member =>
            member.ProjectId == projectId &&
            member.UserId == userId &&
            member.IsActive);

        if (!isMember)
            throw new HubException("你不是该项目成员");

        await Groups.AddToGroupAsync(Context.ConnectionId, GetProjectGroup(projectId));

        await Clients.Caller.SendAsync("ProjectJoined", new
        {
            ProjectId = projectId,
            JoinedAt = DateTime.UtcNow
        });
    }

    public async Task LeaveProject(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetProjectGroup(projectId));
        await Clients.Caller.SendAsync("ProjectLeft", new { ProjectId = projectId });
    }

    private string GetUserId()
    {
        return Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? Context.User?.FindFirstValue("sub")
            ?? throw new HubException("未认证连接");
    }

    public static string GetProjectGroup(string projectId) => $"project:{projectId}";
}`}
        language="csharp"
        title="ProjectNotificationHub"
      />

      <LessonQuote>
        不要用静态字典当多实例全局在线表。单机学习可以临时观察连接，但真正多实例部署要使用 Redis backplane、持久化在线状态或只依赖业务数据库恢复项目组。
      </LessonQuote>

      <h3>从业务服务推送通知</h3>
      <p>
        Controller 和 Service 不应该直接操作 Hub 连接对象，而是通过 <code>IHubContext&lt;THub&gt;</code> 向指定 Group 推送。
      </p>

      <LessonCode
        code={`public class WorkItemService
{
    private readonly TaskHubDbContext _context;
    private readonly IHubContext<ProjectNotificationHub> _hubContext;

    public WorkItemService(
        TaskHubDbContext context,
        IHubContext<ProjectNotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    public async Task<WorkItemSummaryDto> MoveAsync(string id, WorkItemStatus status, string operatorId)
    {
        var item = await _context.WorkItems.FirstOrDefaultAsync(item => item.Id == id);
        if (item is null)
            throw new NotFoundException("任务不存在");

        item.Status = status;
        item.Touch();
        await _context.SaveChangesAsync();

        var dto = new WorkItemSummaryDto(item.Id, item.ProjectId, item.Title, item.Status, null, item.DueDate);

        await _hubContext.Clients
            .Group(ProjectNotificationHub.GetProjectGroup(item.ProjectId))
            .SendAsync("WorkItemUpdated", dto);

        return dto;
    }
}`}
        language="csharp"
        title="通过 IHubContext 推送任务变更"
      />

      <h3>通知事件设计</h3>
      <LessonTable
        headers={["业务动作", "SignalR 事件", "发送目标"]}
        rows={[
          ["任务状态变更", "WorkItemUpdated", "project:{projectId}"],
          ["新增评论", "WorkItemCommentAdded", "project:{projectId}"],
          ["新增项目成员", "ProjectMemberAdded", "project:{projectId}"],
          ["用户被指派任务", "WorkItemAssigned", "Clients.User(userId)"],
        ]}
      />

      <h3>常见误区</h3>
      <ul>
        <li>用 Socket.IO 客户端连接 SignalR。</li>
        <li>把 SignalR Groups 当成数据库项目成员关系。</li>
        <li>把业务数据只发给前端不落库，刷新后数据丢失。</li>
        <li>在多实例部署中依赖静态字典保存在线状态。</li>
      </ul>

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已能创建 <code>ProjectNotificationHub</code>，让项目成员加入项目 Group，并通过 <code>IHubContext</code> 推送任务变更通知。
          </p>
        }
        id="signalr-hub-main"
        title="完成 TaskHub 项目通知 Hub"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h3>阶段验收问题</h3>
      <ul>
        <li><code>Clients.Caller</code>、<code>Clients.Group</code>、<code>Clients.User</code> 分别发送给谁？</li>
        <li>SignalR Group 和数据库 <code>ProjectMember</code> 有什么区别？</li>
        <li>为什么业务服务应该用 <code>IHubContext</code> 推送通知？</li>
      </ul>

      <LessonStep
        title="实战：项目通知 Hub"
        steps={[
          {
            title: "映射 ProjectNotificationHub",
            content: <p>在 <code>Program.cs</code> 注册 SignalR 并映射 <code>/hubs/projects</code>。</p>,
            code: `builder.Services.AddSignalR();

var app = builder.Build();
app.MapHub<ProjectNotificationHub>("/hubs/projects");`,
            codeLanguage: "csharp",
            codeTitle: "Program.cs",
            checkpoints: ["已调用 AddSignalR", "已映射 /hubs/projects", "前端连接地址与后端路由一致"],
          },
          {
            title: "推送任务变更",
            content: <p>在任务状态变更后，通过项目 Group 推送 <code>WorkItemUpdated</code>。</p>,
            code: `await _hubContext.Clients
    .Group(ProjectNotificationHub.GetProjectGroup(item.ProjectId))
    .SendAsync("WorkItemUpdated", dto);`,
            codeLanguage: "csharp",
            codeTitle: "推送事件",
            checkpoints: ["使用项目 Group", "发送 DTO 而不是 EF 实体", "业务数据已先保存到数据库"],
          },
        ]}
      />
    </LessonShell>
  );
};
