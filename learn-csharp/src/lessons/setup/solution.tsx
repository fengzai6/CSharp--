import {
  LessonCheckpoint,
  LessonCode,
  LessonShell,
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
        <code>.sln</code> 管理多个项目。
      </p>

      <LessonCode
        code={`mkdir MyApp
cd MyApp
dotnet new sln -n MyApp

dotnet new webapi -n MyApp.Api
dotnet new classlib -n MyApp.Core
dotnet new classlib -n MyApp.Infrastructure

dotnet sln add MyApp.Api/MyApp.Api.csproj
dotnet sln add MyApp.Core/MyApp.Core.csproj
dotnet sln add MyApp.Infrastructure/MyApp.Infrastructure.csproj`}
        language="bash"
        title="创建解决方案与多项目"
      />

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已创建 Solution、Api/Core/Infrastructure 三个项目，并把项目加入
            <code>.sln</code> 管理。
          </p>
        }
        id="setup-solution-projects"
        title="创建三层项目骨架"
        onToggleChecklistItem={onToggleChecklistItem}
      />

      <h4>推荐初学结构</h4>

      <LessonCode
        code={`MyApp/
├── MyApp.sln
├── MyApp.Api/              # HTTP API、Program.cs、Controller/Endpoint
├── MyApp.Core/             # 业务模型、接口、纯业务逻辑
└── MyApp.Infrastructure/   # EF Core、Redis、外部服务实现`}
        language="text"
        title="项目结构"
      />

      <h4>项目引用</h4>

      <LessonCode
        code={`dotnet add MyApp.Api/MyApp.Api.csproj reference MyApp.Core/MyApp.Core.csproj
dotnet add MyApp.Api/MyApp.Api.csproj reference MyApp.Infrastructure/MyApp.Infrastructure.csproj
dotnet add MyApp.Infrastructure/MyApp.Infrastructure.csproj reference MyApp.Core/MyApp.Core.csproj`}
        language="bash"
        title="建立项目引用关系"
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
          看到 <code>.sln</code> 就以为它等同于项目代码；实际 <code>.sln</code>{" "}
          只是管理多个 <code>.csproj</code> 的容器。
        </li>
        <li>
          还没理解 Api/Core/Infrastructure 依赖方向，就开始堆业务代码。
        </li>
      </ul>

      <h3>阶段验收问题</h3>

      <ul>
        <li>
          <code>.sln</code> 和 <code>.csproj</code> 分别解决什么问题？
        </li>
        <li>
          为什么 <code>Core</code> 项目不应该依赖 <code>Infrastructure</code>？
        </li>
      </ul>

      <TeacherTask title="Phase 0 主线任务">
        <p>
          在复刻项目中完成 Phase 0：使用 <code>dotnet new sln</code> 和{" "}
          <code>dotnet new webapi</code> / <code>classlib</code> 创建
          Api/Core/Infrastructure 三层项目结构，建立正确的项目引用关系。
        </p>
      </TeacherTask>
    </LessonShell>
  );
};
