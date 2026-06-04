import { CheckCircleFilled, CheckCircleOutlined } from "@ant-design/icons";
import { Button, Tag } from "antd";

import { NextLesson } from "@/components/lesson-ui";
import type { ICourseModule, ICourseSection } from "@/data/course";
import { getNextSection } from "@/utils/course";

interface ICourseContentProps {
  completedChecklistIds: string[];
  completedSectionIds: string[];
  module: ICourseModule;
  modules: ICourseModule[];
  section: ICourseSection;
  onSelectSection: (moduleId: string, sectionId: string) => void;
  onToggleChecklistItem: (checklistItemId: string) => void;
  onToggleSection: (sectionId: string) => void;
}

export const CourseContent = ({
  completedChecklistIds,
  completedSectionIds,
  module,
  modules,
  onSelectSection,
  onToggleChecklistItem,
  onToggleSection,
  section,
}: ICourseContentProps) => {
  const sectionCompleted = completedSectionIds.includes(section.id);
  const LessonComponent = section.component;
  const nextSection = getNextSection(modules, module.id, section.id);
  const nextModuleTitle =
    nextSection && nextSection.moduleId !== module.id
      ? modules.find((item) => item.id === nextSection.moduleId)?.title
      : undefined;

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
            <p className="text-sm font-medium text-emerald-700">
              {module.title}
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
              {section.title}
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
          onToggleChecklistItem={onToggleChecklistItem}
        />

        <div className="mt-8">
          {nextSection ? (
            <NextLesson
              nextLabel={
                nextModuleTitle
                  ? `进入下一章：${nextModuleTitle}`
                  : `继续：${nextSection.section.title}`
              }
              sectionCompleted={sectionCompleted}
              text={
                nextModuleTitle
                  ? `本章学习完成，接下来进入「${nextModuleTitle}」，从「${nextSection.section.title}」开始。`
                  : `读完本节后，继续学习「${nextSection.section.title}」。`
              }
              onCompleteAndNext={() => {
                if (!sectionCompleted) {
                  onToggleSection(section.id);
                }
                onSelectSection(nextSection.moduleId, nextSection.section.id);
              }}
              onNext={() =>
                onSelectSection(nextSection.moduleId, nextSection.section.id)
              }
            />
          ) : (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <h4 className="mb-2 text-lg font-semibold text-amber-950">
                🎉 全部章节已学完
              </h4>
              <p className="mb-4 text-sm leading-6 text-amber-950">
                你已经走完整个 C# 学习路径。建议回到第一章复习薄弱环节，并把每章练习落到同一个复刻项目中。
              </p>
              <div className="flex flex-wrap gap-3">
                {!sectionCompleted ? (
                  <Button
                    icon={<CheckCircleOutlined />}
                    type="primary"
                    onClick={() => onToggleSection(section.id)}
                  >
                    标记本节完成
                  </Button>
                ) : null}
                <Button
                  onClick={() =>
                    onSelectSection(modules[0].id, modules[0].sections[0].id)
                  }
                >
                  回到开头复习
                </Button>
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
};
