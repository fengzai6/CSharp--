import {
  BookOutlined,
  CheckCircleFilled,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Button, Progress, Tag } from "antd";

import type { ICourseModule, ICourseSection } from "@/data/course";
import { cn } from "@/utils/cn";

interface ICourseSidebarProps {
  activeModuleId: string;
  activeSectionId: string;
  completedSectionIds: string[];
  expandedModuleIds: string[];
  modules: ICourseModule[];
  onContinue: () => void;
  onSelectSection: (moduleId: string, sectionId: string) => void;
  onToggleModule: (moduleId: string) => void;
}

export const CourseSidebar = ({
  activeModuleId,
  activeSectionId,
  completedSectionIds,
  expandedModuleIds,
  modules,
  onContinue,
  onSelectSection,
  onToggleModule,
}: ICourseSidebarProps) => {
  const totalSections = modules.reduce(
    (total, module) => total + module.sections.length,
    0,
  );
  const percent =
    totalSections === 0
      ? 0
      : Math.round((completedSectionIds.length / totalSections) * 100);

  return (
    <div className="p-4">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-700 text-white">
          <BookOutlined />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-950">C# 学习计划</h1>
          <p className="text-sm text-slate-500">老师式逐步学习</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">总进度</span>
          <span className="font-mono text-sm text-slate-500">
            {completedSectionIds.length}/{totalSections}
          </span>
        </div>
        <Progress
          percent={percent}
          railColor="#dbe3dc"
          showInfo={false}
          strokeColor="#047857"
        />
        <Button className="mt-3 w-full" type="primary" onClick={onContinue}>
          继续学习
        </Button>
      </div>

      <nav className="space-y-2">
        {modules.map((module) => {
          const sections: ICourseSection[] = module.sections;
          const expanded = expandedModuleIds.includes(module.id);
          const moduleCompleted = sections.filter((section) =>
            completedSectionIds.includes(section.id),
          ).length;

          return (
            <section
              key={module.id}
              className="rounded-lg border border-slate-200 bg-white"
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-slate-50",
                  activeModuleId === module.id && "bg-emerald-50",
                )}
                onClick={() => onToggleModule(module.id)}
              >
                <span className="mt-0.5 text-slate-400">
                  {expanded ? <DownOutlined /> : <RightOutlined />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex items-center gap-2">
                    <Tag color="green">{module.order}</Tag>
                    <span className="text-xs text-slate-500">
                      {module.duration}
                    </span>
                  </span>
                  <span className="block text-sm font-semibold text-slate-950">
                    {module.title}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-slate-500">
                    {moduleCompleted}/{sections.length}
                  </span>
                </span>
              </button>

              {expanded ? (
                <div className="border-t border-slate-100 px-2 py-2">
                  {sections.map((section) => {
                    const active =
                      activeModuleId === module.id &&
                      activeSectionId === section.id;
                    const done = completedSectionIds.includes(section.id);

                    return (
                      <button
                        key={section.id}
                        type="button"
                        className={cn(
                          "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition hover:bg-slate-50",
                          active && "bg-emerald-50 text-emerald-900",
                        )}
                        onClick={() => onSelectSection(module.id, section.id)}
                      >
                        <span className="mt-0.5 text-emerald-700">
                          {done ? <CheckCircleFilled /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {section.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </nav>
    </div>
  );
};
