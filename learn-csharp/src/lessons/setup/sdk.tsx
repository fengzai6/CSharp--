import {
  LessonCode,
  LessonChecklist,
  LessonQuote,
  LessonShell,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const SetupSdkLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
  return (
    <LessonShell>
      <h3>为什么先学这一章</h3>
      <p>
        如果直接从 C# 语法开始，很容易知道语法但不知道项目怎么跑。先把 SDK、项目文件、命令行和目录结构搞清楚，后面的 ASP.NET Core、EF Core、SignalR 才能顺着学。
      </p>
      <p>本阶段只解决 4 个问题：</p>
      <ol>
        <li>机器上装了哪个 .NET SDK</li>
        <li>
          <code>.sln</code> 和 <code>.csproj</code> 是什么
        </li>
        <li>如何创建、运行、调试项目</li>
        <li>如何安装 NuGet 包</li>
      </ol>

      <TeacherTask title="老师提示">
        <p>
          这一章不要追求理解所有模板代码。你的目标是把 .NET
          项目跑起来、看懂项目文件、知道依赖怎么装。后面遇到编译失败、API
          文档打不开、包还原失败时，先回到本章排查 SDK、TargetFramework、环境变量和
          NuGet。
        </p>
      </TeacherTask>

      <h3>版本选择</h3>
      <p>
        学习时优先使用当前机器上的 <strong>LTS SDK</strong>。不要一开始追
        preview 版本。
      </p>

      <LessonCode
        code={`dotnet --info
dotnet --list-sdks
dotnet --list-runtimes`}
        language="bash"
        title="查看本机 SDK 与 Runtime"
      />

      <p>
        如果机器上有多个 SDK，可以在项目根目录添加{" "}
        <code>global.json</code> 固定版本：
      </p>

      <LessonCode
        code="dotnet new globaljson"
        language="bash"
        title="生成 global.json"
      />

      <p>生成后检查：</p>

      <LessonCode
        code={`{
  "sdk": {
    "version": "10.0.100"
  }
}`}
        language="json"
        title="global.json"
      />

      <LessonQuote>
        版本号以你本机 <code>dotnet --list-sdks</code>{" "}
        输出为准。学习文档中的语法和 API 以稳定版 SDK 为主。
      </LessonQuote>

      <h3>第一个控制台项目</h3>

      <LessonCode
        code={`mkdir csharp-lab
cd csharp-lab
dotnet new console -n HelloCSharp
cd HelloCSharp
dotnet run`}
        language="bash"
        title="创建并运行控制台项目"
      />

      <p>看到类似输出即可：</p>

      <LessonCode
        code="Hello, World!"
        language="text"
        title="预期输出"
      />

      <h4>项目文件</h4>
      <p>
        <code>HelloCSharp.csproj</code> 类似前端项目里的{" "}
        <code>package.json</code>，记录目标框架、包引用、编译配置。
      </p>

      <LessonCode
        code={`<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`}
        language="xml"
        title="HelloCSharp.csproj"
      />

      <p>关键配置：</p>

      <LessonTable
        headers={["配置", "作用"]}
        rows={[
          ["TargetFramework", "目标 .NET 版本"],
          ["ImplicitUsings", "自动引入常用命名空间"],
          ["Nullable", "启用可空引用类型检查"],
          ["OutputType", "Exe 表示可执行程序"],
        ]}
      />

      <h3>常用命令</h3>

      <LessonTable
        headers={["命令", "用途"]}
        rows={[
          ["dotnet new console -n Demo", "创建控制台项目"],
          ["dotnet new webapi -n MyApp.Api", "创建 Web API 项目"],
          ["dotnet restore", "还原 NuGet 包"],
          ["dotnet build", "编译"],
          ["dotnet run --project MyApp.Api", "运行指定项目"],
          ["dotnet watch --project MyApp.Api", "文件变化后自动重启"],
          ["dotnet test", "运行测试"],
          ["dotnet add package <PackageName>", "安装 NuGet 包"],
          ["dotnet remove package <PackageName>", "移除 NuGet 包"],
        ]}
      />

      <h3>常见问题</h3>

      <h4>
        <code>dotnet</code> 命令不存在
      </h4>
      <p>
        说明 SDK 没安装或环境变量没生效。先重新打开终端，再执行：
      </p>
      <LessonCode
        code="dotnet --info"
        language="bash"
        title="验证 SDK"
      />

      <h4>
        <code>TargetFramework</code> 和 SDK 不匹配
      </h4>
      <p>
        例如项目写 <code>net10.0</code>，但本机只有 .NET 8 SDK，会编译失败。解决方式：
      </p>
      <ol>
        <li>安装对应 SDK</li>
        <li>
          或把 <code>.csproj</code> 的 <code>TargetFramework</code>{" "}
          改成本机已有版本
        </li>
      </ol>

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="setup-sdk-checklist"
        items={[
          "执行 `dotnet --info`，确认本机 SDK 版本",
          "创建并运行一个 console 项目",
          "查看 `.csproj` 文件，理解 TargetFramework、ImplicitUsings、Nullable 配置",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
