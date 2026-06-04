import { StructuredLesson } from "@/components/lesson-ui";
import { setupSdkBlocks } from "@/data/course/content/setup-sdk";
import type { ILessonComponentProps } from "@/data/course";

export const SetupSdkLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={setupSdkBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="setup-sdk"
    title="确认 SDK 与版本基线"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
