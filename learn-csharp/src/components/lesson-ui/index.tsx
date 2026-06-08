import {
  CheckCircleOutlined,
  CheckSquareOutlined,
  RightCircleOutlined,
} from "@ant-design/icons";
import { Button, Checkbox } from "antd";
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

export const LessonCode = CodeCopy;

export { LessonCodeCompare } from "@/components/lesson-code-compare";

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
