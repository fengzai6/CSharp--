import { StructuredLesson } from "@/components/lesson-ui";
import { signalrHubBlocks } from "@/data/course/content/signalr-hub";
import type { ILessonComponentProps } from "@/data/course";

export const SignalrHubLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={signalrHubBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="signalr-hub"
    title="Hub、Groups 与消息发送"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
