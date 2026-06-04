import type { ILessonBlock } from "@/components/lesson-ui";

export const setupSolutionBlocks = [
  {
    "level": 2,
    "text": "第一个控制台项目",
    "type": "heading"
  },
  {
    "code": "mkdir csharp-lab\ncd csharp-lab\ndotnet new console -n HelloCSharp\ncd HelloCSharp\ndotnet run",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "text": "看到类似输出即可：",
    "type": "paragraph"
  },
  {
    "code": "Hello, World!",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "level": 3,
    "text": "项目文件",
    "type": "heading"
  },
  {
    "text": "`HelloCSharp.csproj` 类似前端项目里的 `package.json`，记录目标框架、包引用、编译配置。",
    "type": "paragraph"
  },
  {
    "code": "<Project Sdk=\"Microsoft.NET.Sdk\">\n  <PropertyGroup>\n    <OutputType>Exe</OutputType>\n    <TargetFramework>net10.0</TargetFramework>\n    <ImplicitUsings>enable</ImplicitUsings>\n    <Nullable>enable</Nullable>\n  </PropertyGroup>\n</Project>",
    "language": "xml",
    "title": "xml 示例",
    "type": "code"
  },
  {
    "text": "关键点：",
    "type": "paragraph"
  },
  {
    "headers": [
      "配置",
      "作用"
    ],
    "rows": [
      [
        "`TargetFramework`",
        "目标 .NET 版本"
      ],
      [
        "`ImplicitUsings`",
        "自动引入常用命名空间"
      ],
      [
        "`Nullable`",
        "启用可空引用类型检查"
      ],
      [
        "`OutputType`",
        "`Exe` 表示可执行程序"
      ]
    ],
    "type": "table"
  },
  {
    "level": 2,
    "text": "解决方案与多项目结构",
    "type": "heading"
  },
  {
    "text": "真实项目通常不是单个 `.csproj`，而是一个 `.sln` 管理多个项目。",
    "type": "paragraph"
  },
  {
    "code": "mkdir MyApp\ncd MyApp\ndotnet new sln -n MyApp\n\ndotnet new webapi -n MyApp.Api\ndotnet new classlib -n MyApp.Core\ndotnet new classlib -n MyApp.Infrastructure\n\ndotnet sln add MyApp.Api/MyApp.Api.csproj\ndotnet sln add MyApp.Core/MyApp.Core.csproj\ndotnet sln add MyApp.Infrastructure/MyApp.Infrastructure.csproj",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "text": "推荐初学结构：",
    "type": "paragraph"
  },
  {
    "code": "MyApp/\n├── MyApp.sln\n├── MyApp.Api/              # HTTP API、Program.cs、Controller/Endpoint\n├── MyApp.Core/             # 业务模型、接口、纯业务逻辑\n└── MyApp.Infrastructure/   # EF Core、Redis、外部服务实现",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "text": "项目引用：",
    "type": "paragraph"
  },
  {
    "code": "dotnet add MyApp.Api/MyApp.Api.csproj reference MyApp.Core/MyApp.Core.csproj\ndotnet add MyApp.Api/MyApp.Api.csproj reference MyApp.Infrastructure/MyApp.Infrastructure.csproj\ndotnet add MyApp.Infrastructure/MyApp.Infrastructure.csproj reference MyApp.Core/MyApp.Core.csproj",
    "language": "bash",
    "title": "bash 示例",
    "type": "code"
  },
  {
    "text": "依赖方向：",
    "type": "paragraph"
  },
  {
    "code": "Api -> Core\nApi -> Infrastructure\nInfrastructure -> Core\nCore 不依赖其他项目",
    "language": "text",
    "title": "示例",
    "type": "code"
  },
  {
    "level": 2,
    "text": "常用命令",
    "type": "heading"
  },
  {
    "headers": [
      "命令",
      "用途"
    ],
    "rows": [
      [
        "`dotnet new console -n Demo`",
        "创建控制台项目"
      ],
      [
        "`dotnet new webapi -n MyApp.Api`",
        "创建 Web API 项目"
      ],
      [
        "`dotnet restore`",
        "还原 NuGet 包"
      ],
      [
        "`dotnet build`",
        "编译"
      ],
      [
        "`dotnet run --project MyApp.Api`",
        "运行指定项目"
      ],
      [
        "`dotnet watch --project MyApp.Api`",
        "文件变化后自动重启"
      ],
      [
        "`dotnet test`",
        "运行测试"
      ],
      [
        "`dotnet add package <PackageName>`",
        "安装 NuGet 包"
      ],
      [
        "`dotnet remove package <PackageName>`",
        "移除 NuGet 包"
      ]
    ],
    "type": "table"
  }
] satisfies ILessonBlock[];
