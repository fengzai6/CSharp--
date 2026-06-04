import { StructuredLesson } from "@/components/lesson-ui";
import { aspnetControllerDiBlocks } from "@/data/course/content/aspnet-controller-di";
import type { ILessonComponentProps } from "@/data/course";

export const AspnetControllerDiLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={aspnetControllerDiBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="aspnet-controller-di"
    title="Controller、Service 与 DI"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
