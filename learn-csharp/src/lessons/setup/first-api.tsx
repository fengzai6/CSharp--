import {
  LessonCode,
  LessonQuote,
  LessonShell,
  LessonStep,
  TeacherTask,
} from "@/components/lesson-ui";

export const SetupFirstApiLesson = () => {
  return (
    <LessonShell>
      <h3>本节你要掌握什么</h3>
      <p>
        学完本节后，你应该能创建并运行一个最小的 Web API 项目，访问 Swagger API 文档，安装 NuGet 包，并理解 <code>.csproj</code> 文件的包引用机制。
      </p>

      <h3>最小 Web API 验收</h3>
      <p>创建并运行一个 Web API 项目：</p>

      <LessonCode
        code={`dotnet new webapi -n Todo.Api
cd Todo.Api
dotnet run`}
        language="bash"
        title="创建并运行 Web API"
      />

      <p>看到类似输出即可：</p>

      <LessonCode
        code="Now listening on: http://localhost:5000"
        language="text"
        title="预期输出"
      />

      <p>访问 Swagger：</p>

      <LessonCode
        code="http://localhost:5000/swagger"
        language="text"
        title="API 文档地址"
      />

      <LessonQuote>
        如果端口不同，以终端输出为准。不要把端口写死成 5000。
      </LessonQuote>

      <h3>NuGet 包</h3>
      <p>NuGet 对应 Node.js 生态里的 npm。安装包：</p>

      <LessonCode
        code="dotnet add package FluentValidation"
        language="bash"
        title="安装 NuGet 包"
      />

      <p>
        安装后 <code>.csproj</code> 会出现：
      </p>

      <LessonCode
        code={`<ItemGroup>
  <PackageReference Include="FluentValidation" Version="..." />
</ItemGroup>`}
        language="xml"
        title="csproj 中的 PackageReference"
      />

      <p>还原依赖：</p>

      <LessonCode code="dotnet restore" language="bash" title="还原 NuGet 包" />

      <TeacherTask title="对照 NestJS 理解">
        <p>
          NuGet 安装的包记录在 <code>.csproj</code> 的{" "}
          <code>PackageReference</code> 里，等价于 <code>package.json</code> 的{" "}
          <code>dependencies</code>。区别是 .NET 没有 <code>node_modules</code>，包被还原到全局缓存（<code>~/.nuget/packages</code>），不同项目共享，省磁盘也省还原时间。
        </p>
      </TeacherTask>

      <h3>常见问题：Swagger 打不开</h3>
      <p>
        先检查终端输出的 URL，再确认是否是 Development 环境。很多模板只在开发环境启用
        Swagger。
      </p>

      <h3>阶段验收问题</h3>
      <ul>
        <li>NuGet 包安装后会写入哪个文件？</li>
        <li>API 文档页面打不开时，你会按什么顺序排查？</li>
      </ul>

      <LessonStep
        title="实战：创建并运行你的第一个 Web API"
        steps={[
          {
            title: "创建 Web API 项目",
            content: (
              <p>
                在终端进入你的学习目录（例如 <code>csharp-lab</code>），执行以下命令创建一个名为 <code>Todo.Api</code> 的 Web API 项目。
              </p>
            ),
            code: "dotnet new webapi -n Todo.Api",
            codeLanguage: "bash",
            codeTitle: "创建项目",
            checkpoints: [
              "看到 'The template \"ASP.NET Core Web API\" was created successfully' 提示",
              "当前目录下出现 Todo.Api 文件夹",
            ],
            reference:
              "如果提示找不到 dotnet 命令，回到上一节检查 SDK 安装。如果提示模板不存在，可能是 SDK 版本过旧，执行 dotnet --version 确认版本。",
          },
          {
            title: "进入项目目录",
            content: (
              <p>
                进入刚创建的项目目录，准备运行项目。
              </p>
            ),
            code: "cd Todo.Api",
            codeLanguage: "bash",
            codeTitle: "进入项目",
            checkpoints: ["终端路径显示当前在 Todo.Api 目录"],
          },
          {
            title: "运行项目",
            content: (
              <p>
                执行 <code>dotnet run</code> 命令。第一次运行会自动还原 NuGet 包、编译项目，然后启动 Web 服务器。
              </p>
            ),
            code: "dotnet run",
            codeLanguage: "bash",
            codeTitle: "运行项目",
            checkpoints: [
              "看到 'Building...' 编译过程",
              "看到 'Now listening on: http://localhost:xxxx' 输出",
              "记下端口号（通常是 5000、5001 或其他随机端口）",
            ],
            reference:
              "如果编译失败，检查 .csproj 中的 TargetFramework 是否与你的 SDK 版本匹配。如果端口被占用，dotnet 会自动换一个端口，以终端输出为准。",
          },
          {
            title: "访问 Swagger API 文档",
            content: (
              <p>
                打开浏览器，访问 <code>http://localhost:端口号/swagger</code>（端口号替换成上一步终端输出的实际端口）。
              </p>
            ),
            checkpoints: [
              "看到 Swagger UI 界面（标题通常是项目名称）",
              "能看到默认的 WeatherForecast 接口",
              "点击接口可以展开，看到请求和响应的数据结构",
            ],
            reference:
              "如果 Swagger 打不开：1) 确认端口号正确；2) 确认项目正在运行（终端没有报错退出）；3) 检查浏览器是否写成了 https（应该是 http）；4) 某些模板只在 Development 环境启用 Swagger，检查终端输出的环境变量。",
          },
          {
            title: "安装一个 NuGet 包",
            content: (
              <p>
                按 <code>Ctrl+C</code> 停止项目，然后安装一个常用的验证库 FluentValidation，体验 NuGet 包管理。
              </p>
            ),
            code: "dotnet add package FluentValidation",
            codeLanguage: "bash",
            codeTitle: "安装 NuGet 包",
            checkpoints: [
              "看到 'PackageReference for FluentValidation added' 提示",
              "打开 Todo.Api.csproj 文件，能看到新增的 <PackageReference> 节点",
            ],
            reference:
              "安装后的包会记录在 .csproj 文件的 <ItemGroup> 里。NuGet 包会被下载到全局缓存（~/.nuget/packages），不像 npm 那样每个项目都有自己的 node_modules。",
          },
        ]}
        conclusion={
          <div className="space-y-2">
            <p className="font-semibold text-teal-900">
              ✅ 恭喜！你已经完成了第一个 Web API 的创建和运行。
            </p>
            <p>
              <strong>💡 要点回顾：</strong>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                <code>dotnet run</code> 会自动还原依赖、编译、运行，是最常用的开发命令
              </li>
              <li>
                端口号不要写死，以终端输出为准（可能是 5000、5001 或随机端口）
              </li>
              <li>
                Swagger 是 API 文档工具，只在开发环境启用，生产环境通常关闭
              </li>
              <li>
                NuGet 包安装后会写入 <code>.csproj</code> 文件，类似 npm 写入 <code>package.json</code>
              </li>
            </ul>
            <p className="text-sm">
              <strong>🎯 验收标准：</strong>能独立创建项目、运行、访问 Swagger、安装包，并理解每一步的作用。
            </p>
          </div>
        }
      />
    </LessonShell>
  );
};
