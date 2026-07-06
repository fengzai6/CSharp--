import {
  CheckCircleFilled,
  CheckCircleOutlined,
  CheckSquareOutlined,
  RightCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Button, Checkbox, Collapse } from "antd";
import type { ReactNode } from "react";

import { CodeCopy } from "@/components/code-copy";

interface ILessonShellProps {
  children: ReactNode;
}

interface ITeacherTaskProps {
  children: ReactNode;
  title: string;
}

interface ILessonChecklistProps {
  completedChecklistIds: string[];
  id: string;
  items: string[];
  onToggleChecklistItem: (checklistItemId: string) => void;
  title: string;
}

interface ILessonCheckpointProps {
  completedChecklistIds: string[];
  description: ReactNode;
  id: string;
  onToggleChecklistItem: (checklistItemId: string) => void;
  title: string;
}

interface ILessonStepItem {
  title: string;
  content: ReactNode;
  code?: string;
  codeLanguage?: string;
  codeTitle?: string;
  checkpoints?: string[];
  reference?: string;
}

interface ILessonStepProps {
  title: string;
  steps?: ILessonStepItem[];
  conclusion?: ReactNode;
  defaultCollapsed?: boolean;
  children?: ReactNode;  // 支持 children API
}

interface INextLessonProps {
  nextLabel: string;
  sectionCompleted: boolean;
  text: string;
  onCompleteAndNext: () => void;
  onNext: () => void;
}

interface ILessonTableProps {
  headers: string[];
  rows: string[][];
}

export const LessonShell = ({ children }: ILessonShellProps) => (
  <article className="lesson-content space-y-5 text-base leading-8 text-slate-700">
    {children}
  </article>
);

export const LessonQuote = ({ children }: ILessonShellProps) => (
  <blockquote className="rounded-lg border-l-4 border-teal-700 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
    {children}
  </blockquote>
);

export const TeacherTask = ({ children, title }: ITeacherTaskProps) => (
  <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
    <h4 className="mb-2 flex items-center gap-2 text-base font-semibold text-amber-950">
      <CheckSquareOutlined />
      {title}
    </h4>
    <div className="space-y-2 text-sm leading-6 text-amber-950">{children}</div>
  </section>
);

export const LessonChecklist = ({
  completedChecklistIds,
  id,
  items,
  onToggleChecklistItem,
  title,
}: ILessonChecklistProps) => (
  <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <h4 className="mb-3 text-base font-semibold text-slate-950">{title}</h4>
    <div className="space-y-2">
      {items.map((item) => {
        const itemId = `${id}-${item}`;

        return (
          <label
            key={itemId}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md bg-white px-3 py-2"
          >
            <Checkbox
              checked={completedChecklistIds.includes(itemId)}
              onChange={() => onToggleChecklistItem(itemId)}
            />
            <span className="text-sm leading-6 text-slate-700">{item}</span>
          </label>
        );
      })}
    </div>
  </section>
);

export const LessonCheckpoint = ({
  completedChecklistIds,
  description,
  id,
  onToggleChecklistItem,
  title,
}: ILessonCheckpointProps) => {
  const checkpointId = `lesson-checkpoint-${id}`;
  const completed = completedChecklistIds.includes(checkpointId);

  return (
    <section className="rounded-lg border border-teal-200 bg-teal-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-normal text-teal-700">
            正文任务确认
          </p>
          <h4 className="text-base font-semibold text-teal-950">{title}</h4>
          <div className="mt-2 text-sm leading-6 text-teal-950">{description}</div>
        </div>
        <Button
          className="min-h-11 shrink-0"
          icon={completed ? <CheckCircleFilled /> : <CheckCircleOutlined />}
          type={completed ? "primary" : "default"}
          onClick={() => onToggleChecklistItem(checkpointId)}
        >
          {completed ? "已完成" : "我已完成"}
        </Button>
      </div>
    </section>
  );
};

export const LessonCode = CodeCopy;

export { LessonCodeCompare } from "@/components/lesson-code-compare";

export const LessonStep = ({ title, steps, conclusion, defaultCollapsed = true, children }: ILessonStepProps) => (
  <section className="rounded-lg border border-teal-200 bg-teal-50 p-5">
    <Collapse
      bordered={false}
      defaultActiveKey={defaultCollapsed ? [] : ["lesson-step-content"]}
      ghost
      items={[
        {
          key: "lesson-step-content",
          label: (
            <h4 className="flex items-center gap-2 text-lg font-semibold text-teal-950">
              <RightCircleOutlined />
              {title}
            </h4>
          ),
          children: (
            <div className="space-y-4">
              <p className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-teal-900">
                这部分是独立实战练习，只在需要完成额外项目交付时保留；正文里的主线任务不在这里重复。
              </p>
              {children || steps?.map((step, index) => (
                <div
                  key={`${step.title}-${index}`}
                  className="rounded-lg border border-teal-300 bg-white p-4"
                >
                  <h5 className="mb-2 flex items-center gap-2 text-base font-semibold text-teal-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    {step.title}
                  </h5>
                  <div className="mb-3 text-sm leading-6 text-slate-700">{step.content}</div>
                  {step.code && (
                    <div className="mb-3">
                      <CodeCopy
                        code={step.code}
                        language={step.codeLanguage || "bash"}
                        title={step.codeTitle || ""}
                      />
                    </div>
                  )}
                  {step.checkpoints && step.checkpoints.length > 0 && (
                    <div className="mb-3 rounded-md bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        ✓ 检查点
                      </p>
                      <ul className="space-y-1">
                        {step.checkpoints.map((checkpoint, cpIndex) => (
                          <li
                            key={`${checkpoint}-${cpIndex}`}
                            className="flex items-start gap-2 text-sm text-slate-700"
                          >
                            <RightOutlined className="mt-1 text-xs text-teal-600" />
                            <span>{checkpoint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.reference && (
                    <Collapse
                      bordered={false}
                      ghost
                      items={[
                        {
                          key: "reference",
                          label: (
                            <span className="text-sm font-medium text-teal-700">
                              💡 参考答案/提示
                            </span>
                          ),
                          children: (
                            <div className="rounded-md bg-teal-50 p-3 text-sm leading-6 text-slate-700">
                              {step.reference}
                            </div>
                          ),
                        },
                      ]}
                    />
                  )}
                </div>
              ))}
              {conclusion && (
                <div className="rounded-lg border border-teal-300 bg-white p-4">
                  <div className="text-sm leading-6 text-slate-700">{conclusion}</div>
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  </section>
);

export const LessonTable = ({ headers, rows }: ILessonTableProps) => (
  <div className="overflow-x-auto rounded-lg border border-slate-200">
    <table className="min-w-full border-collapse bg-white text-sm">
      <thead className="bg-slate-50">
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`${row.join("-")}-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <td
                key={`${cell}-${cellIndex}`}
                className="border-b border-slate-100 px-3 py-2 text-slate-700"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const NextLesson = ({
  nextLabel,
  onCompleteAndNext,
  onNext,
  sectionCompleted,
  text,
}: INextLessonProps) => (
  <section className="rounded-lg border border-teal-200 bg-teal-50 p-5">
    <h4 className="mb-2 flex items-center gap-2 text-lg font-semibold text-teal-950">
      <RightCircleOutlined />
      下一步
    </h4>
    <p className="mb-4 text-sm leading-6 text-teal-950">{text}</p>
    <div className="flex flex-wrap gap-3">
      {sectionCompleted ? (
        <Button
          icon={<RightCircleOutlined />}
          iconPlacement="end"
          type="primary"
          onClick={onNext}
        >
          {nextLabel}
        </Button>
      ) : (
        <>
          <Button
            icon={<CheckCircleOutlined />}
            type="primary"
            onClick={onCompleteAndNext}
          >
            标记完成并继续
          </Button>
          <Button
            icon={<RightCircleOutlined />}
            iconPlacement="end"
            onClick={onNext}
          >
            {nextLabel}
          </Button>
        </>
      )}
    </div>
  </section>
);
