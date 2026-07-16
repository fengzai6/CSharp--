import { useEffect, useRef, useState } from "react";

interface ISectionHeading {
  element: HTMLElement;
  level: number;
  text: string;
}

interface ISectionCheckpoint {
  completed: boolean;
  element: HTMLElement;
  title: string;
}

export interface ISectionDomMeta {
  checkpoints: ISectionCheckpoint[];
  headings: ISectionHeading[];
}

export const useSectionDomMeta = (sectionId: string): ISectionDomMeta => {
  const [meta, setMeta] = useState<ISectionDomMeta>({
    checkpoints: [],
    headings: [],
  });
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    const container = document.querySelector(".lesson-content");
    if (!container) {
      setMeta({ checkpoints: [], headings: [] });
      return;
    }

    const extract = (): ISectionDomMeta => {
      const headings = Array.from(container.querySelectorAll("h3, h4"))
        .filter((el) => el.parentElement === container)
        .map((el) => ({
          element: el as HTMLElement,
          level: Number(el.tagName[1]),
          text: el.textContent?.trim() ?? "",
        }));

      const checkpoints = Array.from(container.querySelectorAll("section"))
        .filter((section) => {
          const label = section.querySelector("p");
          return label?.textContent?.includes("正文任务确认") ?? false;
        })
        .map((section) => {
          const title =
            section.querySelector("h4")?.textContent?.trim() ?? "未命名任务";
          const buttonText = section.querySelector("button")?.textContent?.trim() ?? "";
          // 未完成文案是「我已完成」，不能用 includes("已完成")
          const completed = buttonText === "已完成";

          return {
            completed,
            element: section as HTMLElement,
            title,
          };
        });

      return { checkpoints, headings };
    };

    setMeta(extract());

    observerRef.current = new MutationObserver(() => {
      setMeta(extract());
    });
    observerRef.current.observe(container, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sectionId]);

  return meta;
};
