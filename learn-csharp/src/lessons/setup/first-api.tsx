import { StructuredLesson } from "@/components/lesson-ui";
import { setupFirstApiBlocks } from "@/data/course/content/setup-first-api";
import type { ILessonComponentProps } from "@/data/course";

export const SetupFirstApiLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={setupFirstApiBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="setup-first-api"
    title="运行最小 Web API"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
      nextLesson={{"label":"进入 C# 语言核心","targetModuleId":"csharp-core","text":"完成环境和骨架后，进入 C# 语言核心。下一章开始把 TypeScript 经验迁移到 C# 类型系统、LINQ 和 async/await。"}}
  />
);
