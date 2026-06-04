import { CheckCircleFilled, CheckCircleOutlined } from "@ant-design/icons";
import { Button, Tag } from "antd";

import type { ICourseModule, ICourseSection } from "@/data/course";

interface ICourseContentProps {
  completedChecklistIds: string[];
  completedSectionIds: string[];
  module: ICourseModule;
  section: ICourseSection;
  onGoToModule: (moduleId: string) => void;
  onToggleChecklistItem: (checklistItemId: string) => void;
  onToggleSection: (sectionId: string) => void;
}

export const CourseContent = ({
  completedChecklistIds,
  completedSectionIds,
  module,
  onGoToModule,
  onToggleChecklistItem,
  onToggleSection,
  section,
}: ICourseContentProps) => {
  const sectionCompleted = completedSectionIds.includes(section.id);
  const LessonComponent = section.component;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Tag color="green">{module.order}</Tag>
        <Tag>{module.duration}</Tag>
        <Tag>{module.sourcePath}</Tag>
      </div>

      <header className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-3xl font-semibold tracking-normal text-slate-950">
              {module.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              {section.objective}
            </p>
          </div>
          <Button
            icon={
              sectionCompleted ? <CheckCircleFilled /> : <CheckCircleOutlined />
            }
            type={sectionCompleted ? "primary" : "default"}
            onClick={() => onToggleSection(section.id)}
          >
            {sectionCompleted ? "本节已完成" : "标记本节完成"}
          </Button>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-7">
        <LessonComponent
          completedChecklistIds={completedChecklistIds}
          onGoToModule={onGoToModule}
          onToggleChecklistItem={onToggleChecklistItem}
        />
      </section>
    </div>
  );
};
