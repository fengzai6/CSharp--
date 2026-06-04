import { StructuredLesson } from "@/components/lesson-ui";
import { engineeringDeployBlocks } from "@/data/course/content/engineering-deploy";
import type { ILessonComponentProps } from "@/data/course";

export const EngineeringDeployLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={engineeringDeployBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="engineering-deploy"
    title="Docker、限流与 AOT"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
