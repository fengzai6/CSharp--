import { StructuredLesson } from "@/components/lesson-ui";
import { efDbContextBlocks } from "@/data/course/content/ef-db-context";
import type { ILessonComponentProps } from "@/data/course";

export const EfDbContextLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={efDbContextBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="ef-db-context"
    title="DbContext 与实体配置"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
