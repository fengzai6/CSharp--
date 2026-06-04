import {
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Button, Divider, Popconfirm } from "antd";

import type { ICourseModule, ICourseSection } from "@/data/course";
import { cn } from "@/utils/cn";

interface ICourseAssistantProps {
  activeSectionId: string;
  module: ICourseModule;
  sections: ICourseSection[];
  onResetProgress: () => void;
  onSelectSection: (sectionId: string) => void;
}

export const CourseAssistant = ({
  activeSectionId,
  module,
  onResetProgress,
  onSelectSection,
  sections,
}: ICourseAssistantProps) => {
  return (
    <div className="space-y-5 p-5">
      <section>
        <h3 className="mb-3 text-base font-semibold text-slate-950">
          本章目录
        </h3>
        <div className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={cn(
                "block w-full truncate rounded-md px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50",
                activeSectionId === section.id &&
                  "bg-emerald-50 font-medium text-emerald-900",
              )}
              onClick={() => onSelectSection(section.id)}
            >
              {section.title}
            </button>
          ))}
        </div>
      </section>

      <Divider />

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-950">
          <ReadOutlined />
          老师提示
        </h3>
        <div className="space-y-2">
          {module.teacherGuide.teacherNotes.map((note) => (
            <p
              key={note}
              className="rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-950"
            >
              {note}
            </p>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-950">
          <ExclamationCircleOutlined />
          常见误区
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
          阶段验收
        </h3>
        <ol className="list-decimal space-y-2 pl-5">
          {module.teacherGuide.acceptanceQuestions.map((question) => (
            <li key={question} className="text-sm leading-6 text-slate-700">
              {question}
            </li>
          ))}
        </ol>
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
