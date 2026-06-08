import {
  LessonCode,
  LessonShell,
  LessonStep,
  TeacherTask,
} from "@/components/lesson-ui";

export const SetupSolutionLesson = () => {
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

      <TeacherTask title="Phase 0 练习">
        <p>
          在复刻项目中完成 Phase 0：使用 <code>dotnet new sln</code> 和{" "}
          <code>dotnet new webapi</code> / <code>classlib</code> 创建
          Api/Core/Infrastructure 三层项目结构，建立正确的项目引用关系。
        </p>
      </TeacherTask>

      <LessonStep
        title="实战：搭建三层架构 Solution"
        steps={[
          {
            title: "创建 Solution 和项目目录",
            content: (
              <p>
                创建一个名为 <code>MyApp</code> 的解决方案，并在其中创建三个项目：Api（Web API）、Core（业务逻辑）、Infrastructure（基础设施）。
              </p>
            ),
            code: `mkdir MyApp
cd MyApp
dotnet new sln -n MyApp

dotnet new webapi -n MyApp.Api
dotnet new classlib -n MyApp.Core
dotnet new classlib -n MyApp.Infrastructure`,
            codeLanguage: "bash",
            codeTitle: "创建 Solution 和项目",
            checkpoints: [
              "当前目录下出现 MyApp.sln 文件",
              "出现三个项目文件夹：MyApp.Api、MyApp.Core、MyApp.Infrastructure",
              "每个项目文件夹下都有对应的 .csproj 文件",
            ],
            reference:
              "webapi 模板创建 Web API 项目（包含 Program.cs、Controllers 等）；classlib 模板创建类库项目（纯代码库，没有启动入口）。Solution 文件（.sln）本身只是一个管理器，不包含代码。",
          },
          {
            title: "将项目添加到 Solution",
            content: (
              <p>
                用 <code>dotnet sln add</code> 命令将三个项目注册到 Solution 中，这样 IDE 和命令行工具能识别它们的关系。
              </p>
            ),
            code: `dotnet sln add MyApp.Api/MyApp.Api.csproj
dotnet sln add MyApp.Core/MyApp.Core.csproj
dotnet sln add MyApp.Infrastructure/MyApp.Infrastructure.csproj`,
            codeLanguage: "bash",
            codeTitle: "添加项目到 Solution",
            checkpoints: [
              "每次 add 后看到 'Project added to the solution' 提示",
              "打开 MyApp.sln 文件，能看到三个 Project 条目",
            ],
            reference:
              "这一步是为了让 IDE（如 Visual Studio、Rider）能识别整个解决方案结构。如果不加到 sln，项目依然能独立编译，但 IDE 无法统一管理。",
          },
          {
            title: "建立项目引用关系",
            content: (
              <p>
                用 <code>dotnet add reference</code> 命令建立项目之间的依赖关系。依赖方向是：Api 依赖 Core 和 Infrastructure，Infrastructure 依赖 Core，Core 不依赖任何项目。
              </p>
            ),
            code: `dotnet add MyApp.Api/MyApp.Api.csproj reference MyApp.Core/MyApp.Core.csproj
dotnet add MyApp.Api/MyApp.Api.csproj reference MyApp.Infrastructure/MyApp.Infrastructure.csproj
dotnet add MyApp.Infrastructure/MyApp.Infrastructure.csproj reference MyApp.Core/MyApp.Core.csproj`,
            codeLanguage: "bash",
            codeTitle: "建立项目引用",
            checkpoints: [
              "每次 add reference 后看到 'Reference added' 提示",
              "打开 MyApp.Api.csproj，能看到 <ProjectReference> 节点",
              "依赖方向正确：Api → Core + Infrastructure，Infrastructure → Core",
            ],
            reference:
              "为什么这样设计：Core 定义业务规则和接口，不依赖技术细节；Infrastructure 实现 Core 的接口（如数据库、缓存）；Api 是入口层，组装两者并暴露 HTTP 端点。这样换数据库时只改 Infrastructure，Core 不受影响。",
          },
          {
            title: "验证 Solution 能正常构建",
            content: (
              <p>
                用 <code>dotnet build</code> 验证整个解决方案能编译通过，确认项目引用关系正确。
              </p>
            ),
            code: `dotnet build`,
            codeLanguage: "bash",
            codeTitle: "构建 Solution",
            checkpoints: [
              "看到 'Build succeeded' 提示",
              "三个项目都成功编译（输出中显示 3 个项目的 Build SUCCEEDED）",
              "没有 warning 或 error",
            ],
            reference:
              "如果构建失败，常见原因：1) 项目引用路径错误（检查 .csproj 里的 ProjectReference）；2) TargetFramework 不一致（三个项目应该用同一个版本）；3) 循环引用（如 Core 引用了 Infrastructure）。",
          },
          {
            title: "理解项目结构和依赖方向",
            content: (
              <p>
                查看当前目录结构，理解三层架构的职责和依赖方向。
              </p>
            ),
            code: `MyApp/
├── MyApp.sln                   # Solution 文件（管理器）
├── MyApp.Api/                  # HTTP API 层
│   ├── Controllers/            # Controller（处理 HTTP 请求）
│   ├── Program.cs              # 启动入口
│   └── MyApp.Api.csproj
├── MyApp.Core/                 # 业务逻辑层
│   ├── Entities/               # 业务模型（Entity）
│   ├── Services/               # 业务服务接口（IUserService 等）
│   ├── DTOs/                   # 数据传输对象
│   └── MyApp.Core.csproj
└── MyApp.Infrastructure/       # 基础设施层
    ├── Services/               # 业务服务实现（UserService 等）
    ├── Data/                   # EF Core DbContext
    └── MyApp.Infrastructure.csproj

依赖方向：
Api → Core + Infrastructure
Infrastructure → Core
Core → (无依赖)`,
            codeLanguage: "text",
            codeTitle: "项目结构与依赖方向",
            checkpoints: [
              "理解 Core 是业务核心，不依赖技术细节",
              "理解 Infrastructure 实现 Core 定义的接口",
              "理解 Api 是入口层，负责 HTTP 处理和依赖组装",
            ],
            reference:
              "这种分层让业务逻辑和技术细节解耦。在 NestJS 里你用 Module 划分边界，C# 用项目级引用把边界变成编译期约束——如果 Core 尝试引用 Infrastructure，编译器会直接报错。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经搭建了一个标准的三层架构 Solution。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                .sln 是管理器，.csproj 才是项目本体
              </li>
              <li>
                webapi 模板创建 Web API 项目，classlib 模板创建类库项目
              </li>
              <li>
                依赖方向：Api → Infrastructure → Core，Core 不依赖任何项目
              </li>
              <li>
                这种分层让业务逻辑（Core）和技术细节（Infrastructure）解耦
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能独立创建三层 Solution，理解依赖方向，构建通过。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
