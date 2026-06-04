import type { ReactNode } from "react";

interface ICourseLayoutProps {
  assistant: ReactNode;
  content: ReactNode;
  sidebar: ReactNode;
}

export const CourseLayout = ({
  assistant,
  content,
  sidebar,
}: ICourseLayoutProps) => {
  return (
    <main className="min-h-dvh bg-[#f7f8f3] text-slate-900">
      <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-r lg:border-b-0">
          {sidebar}
        </aside>
        <section className="min-w-0 px-5 py-6 md:px-8 lg:px-10">
          {content}
        </section>
        <aside className="border-t border-slate-200 bg-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-t-0 lg:border-l">
          {assistant}
        </aside>
      </div>
    </main>
  );
};
