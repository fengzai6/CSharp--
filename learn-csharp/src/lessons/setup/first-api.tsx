import {
  LessonCheckpoint,
  LessonCode,
  LessonQuote,
  LessonShell,
  TeacherTask,
} from "@/components/lesson-ui";

export const SetupFirstApiLesson = ({
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

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已创建并运行 <code>Todo.Api</code>，记录终端输出的实际监听地址。
          </p>
        }
        id="setup-first-api-run"
        title="运行最小 Web API"
        onToggleChecklistItem={onToggleChecklistItem}
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

      <LessonCheckpoint
        completedChecklistIds={completedChecklistIds}
        description={
          <p>
            已安装一个 NuGet 包，并在 <code>.csproj</code> 中看到对应的
            <code>PackageReference</code>。
          </p>
        }
        id="setup-first-api-nuget"
        title="确认 NuGet 包引用"
        onToggleChecklistItem={onToggleChecklistItem}
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
    </LessonShell>
  );
};
