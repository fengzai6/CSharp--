import type { ILessonBlock } from "@/components/lesson-ui";

export const setupFirstApiBlocks = [
  {
    "level": 2,
    "text": "NuGet 包",
    "type": "heading"
  },
  {
    "text": "NuGet 对应 Node.js 生态里的 npm。",
    "type": "paragraph"
  },
  {
    "text": "安装包：",
    "type": "paragraph"
  },
  {
    "code": "dotnet add package FluentValidation",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "text": "安装后 `.csproj` 会出现：",
    "type": "paragraph"
  },
  {
    "code": "<ItemGroup>\n  <PackageReference Include=\"FluentValidation\" Version=\"...\" />\n</ItemGroup>",
    "language": "xml",
    "title": "xml 示例",
    "type": "code"
  },
  {
    "text": "还原依赖：",
    "type": "paragraph"
  },
  {
    "code": "dotnet restore",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "最小 Web API 验收",
    "type": "heading"
  },
  {
    "text": "创建 API：",
    "type": "paragraph"
  },
  {
    "code": "dotnet new webapi -n Todo.Api\ncd Todo.Api\ndotnet run",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "text": "看到类似输出即可：",
    "type": "paragraph"
  },
  {
    "code": "Now listening on: http://localhost:5000",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "text": "访问 Swagger：",
    "type": "paragraph"
  },
  {
    "code": "http://localhost:5000/swagger",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "text": "如果端口不同，以终端输出为准。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "常见问题",
    "type": "heading"
  },
  {
    "level": 3,
    "text": "`dotnet` 命令不存在",
    "type": "heading"
  },
  {
    "text": "说明 SDK 没安装或环境变量没生效。先重新打开终端，再执行：",
    "type": "paragraph"
  },
  {
    "code": "dotnet --info",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "`TargetFramework` 和 SDK 不匹配",
    "type": "heading"
  },
  {
    "text": "例如项目写 `net10.0`，但本机只有 .NET 8 SDK，会编译失败。解决方式：",
    "type": "paragraph"
  },
  {
    "items": [
      "安装对应 SDK",
      "或把 `.csproj` 的 `TargetFramework` 改成本机已有版本"
    ],
    "ordered": true,
    "type": "list"
  },
  {
    "level": 3,
    "text": "Swagger 打不开",
    "type": "heading"
  },
  {
    "text": "先检查终端输出的 URL，再确认是否是 Development 环境。很多模板只在开发环境启用 Swagger。",
    "type": "paragraph"
  },
  {
    "level": 2,
    "text": "实战练习清单",
    "type": "heading"
  },
  {
    "id": "checklist-27",
    "items": [
      "执行 `dotnet --info`，确认本机 SDK 版本",
      "创建并运行一个 console 项目",
      "创建一个 `.sln`，加入 Api/Core/Infrastructure 三个项目",
      "给 Api 项目引用 Core 和 Infrastructure",
      "创建并运行一个 Web API 项目",
      "安装一个 NuGet 包并查看 `.csproj` 变化"
    ],
    "title": "练习清单",
    "type": "checklist"
  },
  {
    "level": 2,
    "text": "阶段验收问题",
    "type": "heading"
  },
  {
    "items": [
      "`.sln` 和 `.csproj` 分别解决什么问题？",
      "为什么 `Core` 项目不应该依赖 `Infrastructure`？",
      "NuGet 包安装后会写入哪个文件？",
      "API 文档页面打不开时，你会按什么顺序排查？"
    ],
    "ordered": false,
    "type": "list"
  },
  {
    "level": 2,
    "text": "下一步",
    "type": "heading"
  },
  {
    "text": "完成本阶段后，进入 [一、C# 语言核心](01-CSharp语言核心.md)。",
    "type": "paragraph"
  }
] satisfies ILessonBlock[];
