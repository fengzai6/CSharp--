import { StructuredLesson } from "@/components/lesson-ui";
import { setupSolutionBlocks } from "@/data/course/content/setup-solution";
import type { ILessonComponentProps } from "@/data/course";

export const SetupSolutionLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={setupSolutionBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="setup-solution"
    title="搭建 Solution 与多项目结构"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
