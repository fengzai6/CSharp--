import { StructuredLesson } from "@/components/lesson-ui";
import { efRelationshipsBlocks } from "@/data/course/content/ef-relationships";
import type { ILessonComponentProps } from "@/data/course";

export const EfRelationshipsLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={efRelationshipsBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="ef-relationships"
    title="关系建模与查询策略"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
