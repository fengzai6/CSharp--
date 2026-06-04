import { StructuredLesson } from "@/components/lesson-ui";
import { aspnetProgramBlocks } from "@/data/course/content/aspnet-program";
import type { ILessonComponentProps } from "@/data/course";

export const AspnetProgramLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={aspnetProgramBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="aspnet-program"
    title="Program.cs 与请求管道"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
