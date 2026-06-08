import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  LessonTable,
  TeacherTask,
} from "@/components/lesson-ui";

export const SetupSdkLesson = () => {
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

      <LessonStep
        title="实战：确认并配置 SDK 版本"
        steps={[
          {
            title: "查看本机 SDK 版本",
            content: (
              <p>
                在终端执行 <code>dotnet --info</code> 命令，查看当前机器上安装的 .NET SDK 和 Runtime 版本。
              </p>
            ),
            code: `dotnet --info
dotnet --list-sdks
dotnet --list-runtimes`,
            codeLanguage: "bash",
            codeTitle: "查看 SDK 信息",
            checkpoints: [
              "能看到 SDK Version 和版本号（如 10.0.100）",
              "list-sdks 显示所有已安装的 SDK",
              "list-runtimes 显示所有 Runtime（包括 ASP.NET Core Runtime）",
            ],
            reference:
              "如果提示 'dotnet: command not found'，说明 SDK 没安装或环境变量未生效。重新安装 SDK 后，重启终端再试。Windows 用户检查 PATH 环境变量是否包含 dotnet 路径。",
          },
          {
            title: "创建第一个控制台项目",
            content: (
              <p>
                创建一个最简单的控制台项目，验证 SDK 能正常工作。
              </p>
            ),
            code: `mkdir csharp-lab
cd csharp-lab
dotnet new console -n HelloCSharp
cd HelloCSharp
dotnet run`,
            codeLanguage: "bash",
            codeTitle: "创建并运行控制台项目",
            checkpoints: [
              "看到 'The template \"Console App\" was created successfully' 提示",
              "项目目录下有 Program.cs 和 HelloCSharp.csproj 文件",
              "dotnet run 后输出 'Hello, World!'",
            ],
            reference:
              "如果编译失败，检查 .csproj 中的 TargetFramework 是否与你的 SDK 版本匹配。例如 SDK 是 8.0，TargetFramework 应该是 net8.0。",
          },
          {
            title: "查看并理解 .csproj 文件",
            content: (
              <p>
                打开 <code>HelloCSharp.csproj</code> 文件，理解项目配置的关键字段。
              </p>
            ),
            code: `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`,
            codeLanguage: "xml",
            codeTitle: "HelloCSharp.csproj",
            checkpoints: [
              "TargetFramework 指定目标 .NET 版本（如 net10.0、net8.0）",
              "ImplicitUsings 启用后自动引入常用命名空间（如 System、System.Linq）",
              "Nullable 启用可空引用类型检查（推荐开启）",
              "OutputType=Exe 表示可执行程序（控制台应用）",
            ],
            reference:
              "TargetFramework 必须与本机 SDK 匹配或更低。如果项目是 net10.0 但你只有 .NET 8 SDK，要么安装 .NET 10 SDK，要么把 TargetFramework 改成 net8.0。",
          },
          {
            title: "（可选）固定项目 SDK 版本",
            content: (
              <p>
                如果机器上有多个 SDK 版本，可以用 <code>global.json</code> 固定项目使用的 SDK 版本，避免版本漂移。
              </p>
            ),
            code: `dotnet new globaljson
# 会生成 global.json 文件`,
            codeLanguage: "bash",
            codeTitle: "生成 global.json",
            checkpoints: [
              "项目根目录出现 global.json 文件",
              "文件内容包含 sdk.version 字段",
              "版本号与 dotnet --list-sdks 输出的某个版本匹配",
            ],
            reference:
              "global.json 的作用是锁定 SDK 版本。团队协作时，提交这个文件可以确保所有人用同一个 SDK 版本，避免\"我这能跑，你那不行\"的问题。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经确认了 SDK 版本并创建了第一个项目。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                <code>dotnet --info</code> 查看 SDK 版本，<code>dotnet --list-sdks</code> 查看所有 SDK
              </li>
              <li>
                .csproj 类似 package.json，记录项目配置和依赖
              </li>
              <li>
                TargetFramework 必须与 SDK 版本匹配，否则编译失败
              </li>
              <li>
                global.json 可以固定 SDK 版本，适合团队协作
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能独立查看 SDK 版本、创建项目、理解 .csproj 配置。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
