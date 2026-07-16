import { CheckCircleFilled, CompassOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Progress } from "antd";

import type { ICourseModule, ICourseSection } from "@/data/course";
import { cn } from "@/utils/cn";

import { useSectionDomMeta } from "./use-section-dom-meta";

interface ICourseAssistantProps {
  activeSectionId: string;
  module: ICourseModule;
  section: ICourseSection;
  onResetProgress: () => void;
}

export const CourseAssistant = ({
  activeSectionId,
  module,
  onResetProgress,
  section,
}: ICourseAssistantProps) => {
  const { checkpoints, headings } = useSectionDomMeta(activeSectionId);
  const completedCount = checkpoints.filter((cp) => cp.completed).length;
  const sectionCompleted =
    checkpoints.length > 0 && completedCount === checkpoints.length;

  return (
    <div className="space-y-5 p-5">
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-teal-950">
          <CompassOutlined />
          当前小节
        </h3>
        <p className="text-sm font-medium text-slate-800">{section.title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{module.title}</p>
        {checkpoints.length > 0 && (
          <>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                本节任务
              </span>
              <span className="font-mono text-sm text-teal-700">
                {completedCount}/{checkpoints.length}
              </span>
            </div>
            <Progress
              percent={
                checkpoints.length === 0
                  ? 0
                  : Math.round((completedCount / checkpoints.length) * 100)
              }
              railColor="#e2e8f0"
              showInfo={false}
              size="small"
              strokeColor="#0f766e"
            />
          </>
        )}
        {sectionCompleted ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-teal-700">
            <CheckCircleFilled />
            本节任务全部完成
          </p>
        ) : null}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-950">
          <UnorderedListOutlined />
          本节目录
        </h3>
        {headings.length === 0 ? (
          <p className="text-sm text-slate-400">暂无子标题</p>
        ) : (
          <nav className="space-y-0.5">
            {headings.map((heading, index) => (
              <button
                key={`${heading.level}-${index}-${heading.text}`}
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-center rounded-md py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-teal-800",
                  heading.level === 3
                    ? "px-2 font-medium text-slate-800"
                    : "px-2 pl-6 text-slate-500",
                )}
                onClick={() => {
                  heading.element.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                <span className="min-w-0 flex-1 truncate">{heading.text}</span>
              </button>
            ))}
          </nav>
        )}
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
