import { StructuredLesson } from "@/components/lesson-ui";
import { aspnetOpenApiValidationBlocks } from "@/data/course/content/aspnet-open-api-validation";
import type { ILessonComponentProps } from "@/data/course";

export const AspnetOpenApiValidationLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={aspnetOpenApiValidationBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="aspnet-open-api-validation"
    title="验证、OpenAPI 与结构"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
      nextLesson={{"label":"进入 EF Core 数据库","targetModuleId":"ef-core","text":"Web API 框架主线完成后，进入 EF Core。下一章把实体、关系、事务和迁移补起来。"}}
  />
);
