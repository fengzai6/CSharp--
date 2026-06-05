import { CodeCopy } from "@/components/code-copy";

interface ILessonCodeCompareProps {
  leftTitle: string;
  leftCode: string;
  leftLanguage: string;
  rightTitle: string;
  rightCode: string;
  rightLanguage: string;
}

export const LessonCodeCompare = ({
  leftTitle,
  leftCode,
  leftLanguage,
  rightTitle,
  rightCode,
  rightLanguage,
}: ILessonCodeCompareProps) => (
  <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <CodeCopy code={leftCode} language={leftLanguage} title={leftTitle} />
    <CodeCopy code={rightCode} language={rightLanguage} title={rightTitle} />
  </section>
);