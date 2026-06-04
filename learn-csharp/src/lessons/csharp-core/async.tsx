import { StructuredLesson } from "@/components/lesson-ui";
import { csharpAsyncBlocks } from "@/data/course/content/csharp-async";
import type { ILessonComponentProps } from "@/data/course";

export const CsharpAsyncLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={csharpAsyncBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="csharp-async"
    title="async/await 与 Task"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
      nextLesson={{"label":"进入 ASP.NET Core 框架","targetModuleId":"aspnet-core","text":"掌握 C# 语言核心后，进入 ASP.NET Core。下一章开始把这些类型、DTO、async 方法放进真正的 Web API。"}}
  />
);
