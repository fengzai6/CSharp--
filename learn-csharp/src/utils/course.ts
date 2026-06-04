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
