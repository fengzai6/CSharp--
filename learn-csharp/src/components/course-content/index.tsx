import {
  CheckCircleFilled,
  CheckCircleOutlined,
  CompassOutlined,
  FlagOutlined,
  RightCircleOutlined,
} from "@ant-design/icons";
import { Button, Progress, Tag } from "antd";

import { NextLesson } from "@/components/lesson-ui";
import type { ICourseModule, ICourseSection } from "@/data/course";
import {
  getCourseProgress,
  getNextSection,
  getSectionPosition,
} from "@/utils/course";

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
  const courseProgress = getCourseProgress(modules, completedSectionIds);
  const sectionPosition = getSectionPosition(modules, module.id, section.id);
  const nextModuleTitle =
    nextSection && nextSection.moduleId !== module.id
      ? modules.find((item) => item.id === nextSection.moduleId)?.title
      : undefined;
  const nextStepText = nextSection
    ? nextModuleTitle
      ? `下一章：${nextModuleTitle}`
      : `下一节：${nextSection.section.title}`
    : "完成后回到开头复习薄弱环节";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Tag color="blue">{module.order}</Tag>
          <Tag>{module.duration}</Tag>
          <Tag>{module.sourcePath}</Tag>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-teal-50 p-3">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium text-teal-800">
              <CompassOutlined />
              当前位置
            </p>
            <p className="font-mono text-sm text-teal-950">
              {sectionPosition
                ? `阶段 ${sectionPosition.moduleIndex}/${sectionPosition.moduleCount} · 小节 ${sectionPosition.sectionIndex}/${sectionPosition.sectionCount}`
                : "当前小节"}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium text-amber-800">
              <FlagOutlined />
              下一步
            </p>
            <p className="truncate text-sm text-amber-950">{nextStepText}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">总进度</p>
              <p className="font-mono text-xs text-teal-700">
                {courseProgress.completedSections}/{courseProgress.totalSections}
              </p>
            </div>
            <Progress
              percent={courseProgress.percent}
              railColor="#e2e8f0"
              showInfo={false}
              size="small"
              strokeColor="#0f766e"
            />
          </div>
        </div>
      </div>

      <header className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-teal-700">
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
            {sectionCompleted ? "已完成本节" : "学完本节"}
          </Button>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200 md:p-7">
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
            <section className="rounded-lg border border-teal-200 bg-teal-50 p-5">
              <h4 className="mb-2 flex items-center gap-2 text-lg font-semibold text-teal-950">
                <RightCircleOutlined />
                完成整条学习路径
              </h4>
              <p className="mb-4 text-sm leading-6 text-teal-950">
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
