import { StructuredLesson } from "@/components/lesson-ui";
import { authRefreshPolicyBlocks } from "@/data/course/content/auth-refresh-policy";
import type { ILessonComponentProps } from "@/data/course";

export const AuthRefreshPolicyLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={authRefreshPolicyBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="auth-refresh-policy"
    title="Refresh Token 与 Policy"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
      nextLesson={{"label":"进入 SignalR 实时通信","targetModuleId":"signalr","text":"认证授权完成后，进入 SignalR。下一章会把 JWT 认证带到实时连接里。"}}
  />
);
