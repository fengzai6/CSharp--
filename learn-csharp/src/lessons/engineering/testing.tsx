import { StructuredLesson } from "@/components/lesson-ui";
import { engineeringTestingBlocks } from "@/data/course/content/engineering-testing";
import type { ILessonComponentProps } from "@/data/course";

export const EngineeringTestingLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={engineeringTestingBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="engineering-testing"
    title="测试分层"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
