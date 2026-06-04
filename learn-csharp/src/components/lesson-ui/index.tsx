import { CheckSquareOutlined, RightCircleOutlined } from "@ant-design/icons";
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
  label: string;
  onGoToModule: (moduleId: string) => void;
  targetModuleId: string;
  text: string;
}

interface ILessonTableProps {
  headers: string[];
  rows: string[][];
}

interface ILessonParagraphBlock {
  text: string;
  type: "paragraph";
}

interface ILessonQuoteBlock {
  text: string;
  type: "quote";
}

interface ILessonHeadingBlock {
  level: 2 | 3 | 4;
  text: string;
  type: "heading";
}

interface ILessonListBlock {
  items: string[];
  ordered: boolean;
  title?: string;
  type: "list";
}

interface ILessonChecklistBlock {
  id: string;
  items: string[];
  title: string;
  type: "checklist";
}

interface ILessonCodeBlock {
  code: string;
  language: string;
  title: string;
  type: "code";
}

interface ILessonTableBlock {
  headers: string[];
  rows: string[][];
  type: "table";
}

interface IStructuredLessonProps {
  blocks: ILessonBlock[];
  completedChecklistIds: string[];
  lessonId: string;
  nextLesson?: Omit<INextLessonProps, "onGoToModule">;
  onGoToModule: (moduleId: string) => void;
  onToggleChecklistItem: (checklistItemId: string) => void;
  title: string;
}

export type ILessonBlock =
  | ILessonChecklistBlock
  | ILessonCodeBlock
  | ILessonHeadingBlock
  | ILessonListBlock
  | ILessonParagraphBlock
  | ILessonQuoteBlock
  | ILessonTableBlock;

const renderInlineText = (text: string) => {
  const nodes: ReactNode[] = [];
  const inlinePattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("`")) {
      nodes.push(
        <code key={`${token}-${match.index}`}>{token.slice(1, -1)}</code>,
      );
    } else {
      nodes.push(
        <strong key={`${token}-${match.index}`}>{token.slice(2, -2)}</strong>,
      );
    }

    lastIndex = inlinePattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

export const LessonShell = ({ children }: ILessonShellProps) => (
  <article className="space-y-5 text-base leading-8 text-slate-700">
    {children}
  </article>
);

export const LessonTitle = ({ children }: ILessonShellProps) => (
  <h2 className="text-3xl font-semibold tracking-normal text-slate-950">
    {children}
  </h2>
);

export const LessonHeading = ({ children }: ILessonShellProps) => (
  <h3 className="pt-4 text-2xl font-semibold text-slate-950">{children}</h3>
);

export const LessonSubheading = ({ children }: ILessonShellProps) => (
  <h4 className="pt-3 text-xl font-semibold text-slate-950">{children}</h4>
);

export const LessonQuote = ({ children }: ILessonShellProps) => (
  <blockquote className="rounded-lg border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-950">
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
  label,
  onGoToModule,
  targetModuleId,
  text,
}: INextLessonProps) => (
  <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
    <h4 className="mb-2 flex items-center gap-2 text-lg font-semibold text-emerald-950">
      <RightCircleOutlined />
      下一步
    </h4>
    <p className="mb-4 text-sm leading-6 text-emerald-950">{text}</p>
    <Button
      icon={<RightCircleOutlined />}
      iconPlacement="end"
      type="primary"
      onClick={() => onGoToModule(targetModuleId)}
    >
      {label}
    </Button>
  </section>
);

export const StructuredLesson = ({
  blocks,
  completedChecklistIds,
  lessonId,
  nextLesson,
  onGoToModule,
  onToggleChecklistItem,
  title,
}: IStructuredLessonProps) => (
  <LessonShell>
    <LessonTitle>{title}</LessonTitle>
    {blocks.map((block, index) => {
      const blockKey = `${lessonId}-${block.type}-${index}`;

      if (block.type === "paragraph") {
        return <p key={blockKey}>{renderInlineText(block.text)}</p>;
      }

      if (block.type === "quote") {
        return (
          <LessonQuote key={blockKey}>{renderInlineText(block.text)}</LessonQuote>
        );
      }

      if (block.type === "heading") {
        if (block.level === 2) {
          return (
            <LessonHeading key={blockKey}>
              {renderInlineText(block.text)}
            </LessonHeading>
          );
        }

        return (
          <LessonSubheading key={blockKey}>
            {renderInlineText(block.text)}
          </LessonSubheading>
        );
      }

      if (block.type === "code") {
        return (
          <LessonCode
            key={blockKey}
            code={block.code}
            language={block.language}
            title={block.title}
          />
        );
      }

      if (block.type === "table") {
        return (
          <LessonTable key={blockKey} headers={block.headers} rows={block.rows} />
        );
      }

      if (block.type === "checklist") {
        return (
          <LessonChecklist
            key={blockKey}
            completedChecklistIds={completedChecklistIds}
            id={`${lessonId}-${block.id}`}
            items={block.items}
            title={block.title}
            onToggleChecklistItem={onToggleChecklistItem}
          />
        );
      }

      return (
        <section key={blockKey} className="space-y-3">
          {block.title ? (
            <h4 className="text-base font-semibold text-slate-950">
              {renderInlineText(block.title)}
            </h4>
          ) : null}
          {block.ordered ? (
            <ol className="list-decimal space-y-2 pl-6">
              {block.items.map((item) => (
                <li key={item}>{renderInlineText(item)}</li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc space-y-2 pl-6">
              {block.items.map((item) => (
                <li key={item}>{renderInlineText(item)}</li>
              ))}
            </ul>
          )}
        </section>
      );
    })}
    {nextLesson ? (
      <NextLesson
        label={nextLesson.label}
        targetModuleId={nextLesson.targetModuleId}
        text={nextLesson.text}
        onGoToModule={onGoToModule}
      />
    ) : null}
  </LessonShell>
);
