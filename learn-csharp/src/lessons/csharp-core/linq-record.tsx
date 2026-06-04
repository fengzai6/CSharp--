import { StructuredLesson } from "@/components/lesson-ui";
import { csharpLinqRecordBlocks } from "@/data/course/content/csharp-linq-record";
import type { ILessonComponentProps } from "@/data/course";

export const CsharpLinqRecordLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={csharpLinqRecordBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="csharp-linq-record"
    title="LINQ、模式匹配与 record"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
