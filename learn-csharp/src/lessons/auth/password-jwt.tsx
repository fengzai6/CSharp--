import { StructuredLesson } from "@/components/lesson-ui";
import { authPasswordJwtBlocks } from "@/data/course/content/auth-password-jwt";
import type { ILessonComponentProps } from "@/data/course";

export const AuthPasswordJwtLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={authPasswordJwtBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="auth-password-jwt"
    title="密码哈希与 JWT"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
  />
);
