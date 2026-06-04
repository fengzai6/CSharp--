import { StructuredLesson } from "@/components/lesson-ui";
import { engineeringObservabilityBlocks } from "@/data/course/content/engineering-observability";
import type { ILessonComponentProps } from "@/data/course";

export const EngineeringObservabilityLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={engineeringObservabilityBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="engineering-observability"
    title="日志、缓存、健康检查"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
