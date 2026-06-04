import type { ILessonBlock } from "@/components/lesson-ui";

export const setupSdkBlocks = [
  {
    "text": "预估时间：1-2 天 | 目标：能创建、运行、调试一个最小 .NET 项目",
    "type": "quote"
  },
  {
    "level": 2,
    "text": "为什么先学这一章",
    "type": "heading"
  },
  {
    "text": "如果直接从 C# 语法开始，很容易知道语法但不知道项目怎么跑。先把 SDK、项目文件、命令行和目录结构搞清楚，后面的 ASP.NET Core、EF Core、SignalR 才能顺着学。",
    "type": "paragraph"
  },
  {
    "text": "本阶段只解决 4 个问题：",
    "type": "paragraph"
  },
  {
    "items": [
      "机器上装了哪个 .NET SDK",
      "`.sln` 和 `.csproj` 是什么",
      "如何创建、运行、调试项目",
      "如何安装 NuGet 包"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "老师提示",
    "type": "heading"
  },
  {
    "text": "这一章不要追求理解所有模板代码。你的目标是把 .NET 项目跑起来、看懂项目文件、知道依赖怎么装。后面遇到编译失败、API 文档打不开、包还原失败时，先回到本章排查 SDK、TargetFramework、环境变量和 NuGet。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "学习顺序建议",
    "type": "heading"
  },
  {
    "items": [
      "先执行 `dotnet --info`，确认本机 SDK。",
      "再创建 console 项目，确认命令行能编译运行。",
      "然后创建 `.sln` + 多项目结构，理解依赖方向。",
      "最后运行 Web API，并打开开发环境的 API 文档页面。"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 2,
    "text": "常见误区",
    "type": "heading"
  },
  {
    "items": [
      "看到 `.sln` 就以为它等同于项目代码；实际 `.sln` 只是管理多个 `.csproj` 的容器。",
      "`TargetFramework` 写了 `net10.0`，但本机只有 .NET 8 SDK，导致编译失败。",
      "端口写死为 5000；实际端口要以 `dotnet run` 输出为准。",
      "还没理解 Api/Core/Infrastructure 依赖方向，就开始堆业务代码。"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "版本选择",
    "type": "heading"
  },
  {
    "text": "学习时优先使用当前机器上的 **LTS SDK**。不要一开始追 preview 版本。",
    "type": "paragraph"
  },
  {
    "code": "dotnet --info\ndotnet --list-sdks\ndotnet --list-runtimes",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "text": "如果机器上有多个 SDK，可以在项目根目录添加 `global.json` 固定版本：",
    "type": "paragraph"
  },
  {
    "code": "dotnet new globaljson",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "text": "生成后检查：",
    "type": "paragraph"
  },
  {
    "code": "{\n  \"sdk\": {\n    \"version\": \"10.0.100\"\n  }\n}",
    "language": "json",
    "title": "json 示例",
    "type": "code"
  },
  {
    "text": "版本号以你本机 `dotnet --list-sdks` 输出为准。学习文档中的语法和 API 以稳定版 SDK 为主。",
    "type": "quote"
  }
] satisfies ILessonBlock[];
