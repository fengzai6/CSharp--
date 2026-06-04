import { StructuredLesson } from "@/components/lesson-ui";
import { signalrAuthReconnectBlocks } from "@/data/course/content/signalr-auth-reconnect";
import type { ILessonComponentProps } from "@/data/course";

export const SignalrAuthReconnectLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={signalrAuthReconnectBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="signalr-auth-reconnect"
    title="认证与断线重连"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
      nextLesson={{"label":"进入工程化与进阶","targetModuleId":"engineering","text":"实时通信完成后，进入工程化。下一章补齐测试、日志、缓存、健康检查、限流和部署。"}}
  />
);
