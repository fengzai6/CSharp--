import {
  LessonCode,
  LessonChecklist,
  LessonQuote,
  LessonShell,
  TeacherTask,
} from "@/components/lesson-ui";
import type { ILessonComponentProps } from "@/data/course";

export const SetupFirstApiLesson = ({
  completedChecklistIds,
  onToggleChecklistItem,
}: ILessonComponentProps) => {
  return (
    <LessonShell>
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

      <LessonChecklist
        completedChecklistIds={completedChecklistIds}
        id="setup-first-api-checklist"
        items={[
          "创建并运行一个 Web API 项目",
          "访问 Swagger 页面，确认能看到 API 文档",
          "安装一个 NuGet 包并查看 `.csproj` 变化",
        ]}
        title="实战练习清单"
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </LessonShell>
  );
};
