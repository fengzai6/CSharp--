import {
  CheckCircleFilled,
  CompassOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Button, Divider, Popconfirm, Progress, Tag } from "antd";

import type { ICourseModule, ICourseSection } from "@/data/course";
import { cn } from "@/utils/cn";
import { getModuleProgress } from "@/utils/course";

interface ICourseAssistantProps {
  activeSectionId: string;
  completedSectionIds: string[];
  module: ICourseModule;
  sections: ICourseSection[];
  onResetProgress: () => void;
  onSelectSection: (sectionId: string) => void;
}

export const CourseAssistant = ({
  activeSectionId,
  completedSectionIds,
  module,
  onResetProgress,
  onSelectSection,
  sections,
}: ICourseAssistantProps) => {
  const moduleProgress = getModuleProgress(module, completedSectionIds);

  return (
    <div className="space-y-5 p-5">
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-teal-950">
          <CompassOutlined />
          当前章学习助手
        </h3>
        <p className="text-sm leading-6 text-slate-700">{module.goal}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">本章进度</span>
          <span className="font-mono text-sm text-teal-700">
            {moduleProgress.completedSections}/{moduleProgress.totalSections}
          </span>
        </div>
        <Progress
          percent={moduleProgress.percent}
          railColor="#e2e8f0"
          showInfo={false}
          size="small"
          strokeColor="#0f766e"
        />
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-950">
          <FlagOutlined />
          本章目录
        </h3>
        <div className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={cn(
                "flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50",
                activeSectionId === section.id &&
                  "bg-teal-50 font-medium text-teal-950",
              )}
              onClick={() => onSelectSection(section.id)}
            >
              <span className="text-teal-700">
                {completedSectionIds.includes(section.id) ? (
                  <CheckCircleFilled />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{section.title}</span>
            </button>
          ))}
        </div>
      </section>

      <Divider />

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-950">
          <ReadOutlined />
          学习提示
        </h3>
        <div className="space-y-2">
          {module.teacherGuide.teacherNotes.map((note) => (
            <p
              key={note}
              className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
            >
              {note}
            </p>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-950">
          <ExclamationCircleOutlined />
          容易踩坑
        </h3>
        <ul className="space-y-2">
          {module.teacherGuide.commonPitfalls.map((pitfall) => (
            <li key={pitfall} className="text-sm leading-6 text-slate-700">
              {pitfall}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-950">
          <QuestionCircleOutlined />
          学完自查
        </h3>
        <ol className="list-decimal space-y-2 pl-5">
          {module.teacherGuide.acceptanceQuestions.map((question) => (
            <li key={question} className="text-sm leading-6 text-slate-700">
              {question}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h3 className="mb-2 text-base font-semibold text-amber-950">
          复习策略
        </h3>
        <div className="flex flex-wrap gap-2">
          <Tag color="gold">先跑通</Tag>
          <Tag color="blue">再理解</Tag>
          <Tag color="green">最后复刻</Tag>
        </div>
        <p className="mt-3 text-sm leading-6 text-amber-950">
          如果本章概念卡住，先完成当前代码路径，再回到误区和自查问题补理解。
        </p>
      </section>

      <Popconfirm
        cancelText="取消"
        okText="确认重置"
        title="确认清空本地学习进度？"
        onConfirm={onResetProgress}
      >
        <Button danger className="w-full">
          重置进度
        </Button>
      </Popconfirm>
    </div>
  );
};
