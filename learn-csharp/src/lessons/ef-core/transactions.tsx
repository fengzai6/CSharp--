import { StructuredLesson } from "@/components/lesson-ui";
import { efTransactionsBlocks } from "@/data/course/content/ef-transactions";
import type { ILessonComponentProps } from "@/data/course";

export const EfTransactionsLesson = ({
  completedChecklistIds,
  onGoToModule,
  onToggleChecklistItem,
}: ILessonComponentProps) => (
  <StructuredLesson
    blocks={efTransactionsBlocks}
    completedChecklistIds={completedChecklistIds}
    lessonId="ef-transactions"
    title="事务、批量操作与迁移"
    onGoToModule={onGoToModule}
    onToggleChecklistItem={onToggleChecklistItem}
      nextLesson={{"label":"进入认证授权","targetModuleId":"auth","text":"完成数据库建模和事务后，进入认证授权。下一章会把用户、角色、权限和令牌体系接上。"}}
  />
);
