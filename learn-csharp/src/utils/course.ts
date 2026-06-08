import type { ICourseModule, ICourseSection } from "@/data/course";

interface ICourseProgress {
  completedSections: number;
  percent: number;
  totalSections: number;
}

interface ISectionPosition {
  globalIndex: number;
  moduleCount: number;
  moduleIndex: number;
  sectionCount: number;
  sectionIndex: number;
  totalSections: number;
}

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

export const getCourseProgress = (
  modules: ICourseModule[],
  completedSectionIds: string[],
): ICourseProgress => {
  const validSectionIds = new Set(
    modules.flatMap((module) => module.sections.map((section) => section.id)),
  );
  const totalSections = validSectionIds.size;
  const completedSections = completedSectionIds.filter((sectionId) =>
    validSectionIds.has(sectionId),
  ).length;

  return {
    completedSections,
    percent:
      totalSections === 0
        ? 0
        : Math.round((completedSections / totalSections) * 100),
    totalSections,
  };
};

export const getModuleProgress = (
  module: ICourseModule,
  completedSectionIds: string[],
): ICourseProgress => {
  const completedSections = module.sections.filter((section) =>
    completedSectionIds.includes(section.id),
  ).length;
  const totalSections = module.sections.length;

  return {
    completedSections,
    percent:
      totalSections === 0
        ? 0
        : Math.round((completedSections / totalSections) * 100),
    totalSections,
  };
};

export const getSectionPosition = (
  modules: ICourseModule[],
  currentModuleId: string,
  currentSectionId: string,
): ISectionPosition | undefined => {
  let globalIndex = 0;

  for (const [moduleIndex, module] of modules.entries()) {
    for (const [sectionIndex, section] of module.sections.entries()) {
      globalIndex += 1;

      if (module.id === currentModuleId && section.id === currentSectionId) {
        return {
          globalIndex,
          moduleCount: modules.length,
          moduleIndex: moduleIndex + 1,
          sectionCount: module.sections.length,
          sectionIndex: sectionIndex + 1,
          totalSections: modules.reduce(
            (total, item) => total + item.sections.length,
            0,
          ),
        };
      }
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
