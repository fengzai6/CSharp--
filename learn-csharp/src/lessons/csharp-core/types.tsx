import { StructuredLesson } from "@/components/lesson-ui";
import { csharpTypesBlocks } from "@/data/course/content/csharp-types";
import type { ILessonComponentProps } from "@/data/course";

export const CsharpTypesLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={csharpTypesBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="csharp-types"
    title="类型、空值和值/引用"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
