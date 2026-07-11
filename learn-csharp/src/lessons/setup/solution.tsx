import {
  LessonCheckpoint,
  LessonCode,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const SetupSolutionLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: {
  completedChecklistIds: string[];
  onToggleChecklistItem: (checklistItemId: string) => void;
}) => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能创建一个包含多个项目的 Solution，理解 Api/Core/Infrastructure 三层架构的依赖方向，并能用 <code>dotnet sln</code> 管理项目引用。
      </p>

      <h3>解决方案与多项目结构</h3>
      <p>
        真实项目通常不是单个 <code>.csproj</code>，而是一个{" "}
        <code>.sln/.slnx</code> 管理多个项目。
      </p>

      <LessonCode
        code={`mkdir TaskHub
cd TaskHub
dotnet new sln -n TaskHub

dotnet new webapi -n TaskHub.Api
dotnet new classlib -n TaskHub.Core
dotnet new classlib -n TaskHub.Infrastructure

dotnet sln add TaskHub.Api/TaskHub.Api.csproj
dotnet sln add TaskHub.Core/TaskHub.Core.csproj
dotnet sln add TaskHub.Infrastructure/TaskHub.Infrastructure.csproj`}
        language="bash"
        title="创建解决方案与多项目"
      />

      <p>
        这段命令分三组看：先创建一个解决方案目录，再生成三个独立项目，最后把三个
        <code>.csproj</code> 加入 <code>.sln/.slnx</code> 管理。<code>.sln/.slnx</code>{" "}
        不包含业务代码，它只是让 IDE、<code>dotnet build</code> 和团队成员知道“这些项目属于同一个工作区”。
      </p>

      <LessonTable
        headers={["命令", "作用"]}
        rows={[
          ["mkdir / cd", "创建并进入解决方案根目录"],
          ["dotnet new sln -n TaskHub", "生成 TaskHub.sln/.slnx，用来管理多个项目"],
          ["dotnet new webapi", "生成 HTTP 入口项目，放 Program.cs 和 API 端点"],
          ["dotnet new classlib", "生成类库项目，放业务层或基础设施层代码"],
          ["dotnet sln add", "把 .csproj 注册到 .sln/.slnx，方便统一构建和 IDE 展示"],
        ]}
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已创建 Solution、Api/Core/Infrastructure 三个项目，并把项目加入
            <code>.sln/.slnx</code> 管理。
          </p>
        }
        id="setup-solution-projects"
        title="创建三层项目骨架"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h4>推荐初学结构</h4>

      <LessonCode
        code={`TaskHub/
├── TaskHub.slnx
├── TaskHub.Api/              # HTTP API、Program.cs、Controller/Endpoint
├── TaskHub.Core/             # 业务模型、接口、纯业务逻辑
└── TaskHub.Infrastructure/   # EF Core、Redis、外部服务实现`}
        language="text"
        title="项目结构"
      />

      <h4>项目引用</h4>

      <LessonCode
        code={`dotnet add TaskHub.Api/TaskHub.Api.csproj reference TaskHub.Core/TaskHub.Core.csproj
dotnet add TaskHub.Api/TaskHub.Api.csproj reference TaskHub.Infrastructure/TaskHub.Infrastructure.csproj
dotnet add TaskHub.Infrastructure/TaskHub.Infrastructure.csproj reference TaskHub.Core/TaskHub.Core.csproj`}
        language="bash"
        title="建立项目引用关系"
      />

      <p>
        <code>dotnet add ... reference ...</code> 是在“调用方项目”的 <code>.csproj</code>{" "}
        中写入 <code>ProjectReference</code>。引用建立后，调用方才能使用被引用项目里的类型；同时编译器会强制依赖方向，避免
        Core 反过来依赖 Infrastructure。
      </p>

      <LessonTable
        headers={["引用", "为什么需要"]}
        rows={[
          ["Api -> Core", "API 层要使用业务模型、接口和纯业务逻辑"],
          ["Api -> Infrastructure", "API 层负责组装数据库、缓存等具体实现"],
          ["Infrastructure -> Core", "基础设施层实现 Core 定义的接口"],
          ["Core 不引用外层", "业务层保持干净，不被数据库、框架或 HTTP 细节绑住"],
        ]}
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已建立 <code>Api -&gt; Core</code>、<code>Api -&gt; Infrastructure</code>、
            <code>Infrastructure -&gt; Core</code> 的引用关系，并确认 Core 不依赖外层。
          </p>
        }
        id="setup-solution-references"
        title="建立正确依赖方向"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h4>依赖方向</h4>

      <LessonCode
        code={`Api -> Core
Api -> Infrastructure
Infrastructure -> Core
Core 不依赖其他项目`}
        language="text"
        title="依赖方向"
      />

      <TeacherTask title="为什么这样设计？">
        <ul>
          <li>
            <strong>Core</strong>：纯业务逻辑，不依赖外部实现，方便测试和复用
          </li>
          <li>
            <strong>Infrastructure</strong>：实现 Core 定义的接口，把数据库、缓存、外部
            API 封装在这里
          </li>
          <li>
            <strong>Api</strong>：HTTP 入口，组装 Core 和 Infrastructure，暴露 API 端点
          </li>
        </ul>
        <p>
          这种分层让业务逻辑和技术细节解耦，换数据库、换缓存时只改
          Infrastructure，Core 不受影响。这正是你在 NestJS 里用 Module
          划分边界时追求的目标，C# 用项目级引用把这个边界变成了编译期约束。
        </p>
      </TeacherTask>

      <h3>常见误区</h3>

      <ul>
        <li>
          看到 <code>.sln/.slnx</code> 就以为它等同于项目代码；实际 <code>.sln/.slnx</code>{" "}
          只是管理多个 <code>.csproj</code> 的容器。
        </li>
        <li>
          还没理解 Api/Core/Infrastructure 依赖方向，就开始堆业务代码。
        </li>
      </ul>

      <h3>阶段验收问题</h3>

      <ul>
        <li>
          <code>.sln/.slnx</code> 和 <code>.csproj</code> 分别解决什么问题？
        </li>
        <li>
          为什么 <code>Core</code> 项目不应该依赖 <code>Infrastructure</code>？
        </li>
      </ul>

      <TeacherTask title="Phase 0 主线任务">
        <p>
          在 TaskHub 主线项目中完成 Phase 0：使用 <code>dotnet new sln</code> 和{" "}
          <code>dotnet new webapi</code> / <code>classlib</code> 创建
          Api/Core/Infrastructure 三层项目结构，建立正确的项目引用关系。
        </p>
      </TeacherTask>
    </LessonShell>
  );
};
