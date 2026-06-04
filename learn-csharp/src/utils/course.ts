import type { ICourseModule, ICourseSection } from "@/data/course";

export const getSectionById = (
  modules: ICourseModule[],
  sectionId: string,
): ICourseSection | undefined => {
  for (const module of modules) {
    const section = module.sections.find((item) => item.id === sectionId);

    if (section) {
      return section;
    }
  }

  return undefined;
};

export const getNextSection = (
  modules: ICourseModule[],
  currentModuleId: string,
  currentSectionId: string,
): { moduleId: string; section: ICourseSection } | undefined => {
  const currentModuleIndex = modules.findIndex((m) => m.id === currentModuleId);
  if (currentModuleIndex === -1) return undefined;

  const currentModule = modules[currentModuleIndex];
  const currentSectionIndex = currentModule.sections.findIndex(
    (s) => s.id === currentSectionId,
  );
  if (currentSectionIndex === -1) return undefined;

  // 当前章节内有下一节
  if (currentSectionIndex < currentModule.sections.length - 1) {
    return {
      moduleId: currentModuleId,
      section: currentModule.sections[currentSectionIndex + 1],
    };
  }

  // 跨章：进入下一章第一节
  if (currentModuleIndex < modules.length - 1) {
    const nextModule = modules[currentModuleIndex + 1];
    if (nextModule.sections.length > 0) {
      return {
        moduleId: nextModule.id,
        section: nextModule.sections[0],
      };
    }
  }

  // 已是最后一节
  return undefined;
};

