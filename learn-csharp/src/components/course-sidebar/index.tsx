import {
  BookOutlined,
  CheckCircleFilled,
  CompassOutlined,
  DownOutlined,
  FireOutlined,
  FlagOutlined,
  PlayCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Button, Progress, Tag } from "antd";

import type { ICourseModule, ICourseSection } from "@/data/course";
import { cn } from "@/utils/cn";
import { getCourseProgress, getModuleProgress } from "@/utils/course";

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
  const courseProgress = getCourseProgress(modules, completedSectionIds);
  const activeModule = modules.find((module) => module.id === activeModuleId);
  const activeSection = activeModule?.sections.find(
    (section) => section.id === activeSectionId,
  );

  return (
    <div className="p-4">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm shadow-slate-200">
          <BookOutlined />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-950">C# 学习计划</h1>
          <p className="text-sm text-teal-700">从 NestJS 思维迁移到 .NET</p>
        </div>
      </div>

      <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-900">
          <CompassOutlined />
          学习驾驶舱
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm shadow-slate-200">
          <p className="text-xs font-medium text-slate-500">当前学习</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-950">
            {activeModule?.title ?? "环境准备"}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {activeSection?.title ?? "确认 SDK 与版本基线"}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">总完成度</span>
          <span className="font-mono text-sm text-teal-700">
            {courseProgress.completedSections}/{courseProgress.totalSections}
          </span>
        </div>
        <Progress
          percent={courseProgress.percent}
          railColor="#e2e8f0"
          showInfo={false}
          strokeColor="#0f766e"
        />
        <Button
          className="mt-3 w-full"
          icon={<PlayCircleOutlined />}
          type="primary"
          onClick={onContinue}
        >
          回到上次学习
        </Button>
      </section>

      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FlagOutlined />
          学习路径
        </h2>
        <span className="text-xs text-slate-500">{modules.length} 个阶段</span>
      </div>

      <nav className="space-y-2">
        {modules.map((module) => {
          const sections: ICourseSection[] = module.sections;
          const expanded = expandedModuleIds.includes(module.id);
          const moduleProgress = getModuleProgress(module, completedSectionIds);
          const moduleDone =
            moduleProgress.completedSections === moduleProgress.totalSections;
          const moduleActive = activeModuleId === module.id;
          const moduleStatus = moduleDone
            ? "已完成"
            : moduleActive
              ? "学习中"
              : "未开始";

          return (
            <section
              key={module.id}
              className={cn(
                "rounded-lg border bg-white transition",
                moduleActive
                  ? "border-teal-200 shadow-sm shadow-slate-200"
                  : "border-slate-200",
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 px-3 py-3 text-left transition hover:bg-slate-50",
                  moduleActive && "bg-teal-50",
                )}
                onClick={() => onToggleModule(module.id)}
              >
                <span className="mt-0.5 text-slate-400">
                  {expanded ? <DownOutlined /> : <RightOutlined />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex items-center gap-2">
                    <Tag color={moduleDone ? "green" : "blue"}>
                      {module.order}
                    </Tag>
                    <span className="text-xs text-slate-500">
                      {module.duration}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        moduleDone && "bg-emerald-100 text-emerald-700",
                        moduleActive && !moduleDone && "bg-teal-100 text-teal-700",
                        !moduleActive && !moduleDone && "bg-slate-100 text-slate-500",
                      )}
                    >
                      {moduleStatus}
                    </span>
                  </span>
                  <span className="block text-sm font-semibold text-slate-950">
                    {module.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {module.goal}
                  </span>
                  <span className="mt-2 flex items-center gap-2 font-mono text-xs text-slate-500">
                    <FireOutlined className="text-amber-500" />
                    {moduleProgress.completedSections}/{sections.length}
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
                          "flex w-full cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition hover:bg-slate-50",
                          active && "bg-teal-50 text-teal-950",
                        )}
                        onClick={() => onSelectSection(module.id, section.id)}
                      >
                        <span className="mt-0.5 text-teal-700">
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
