import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { courseModules } from "@/data/course";
import { useLearningProgressStore } from "@/stores/use-learning-progress-store";

export const useCoursePage = () => {
  const progress = useLearningProgressStore(
    useShallow((state) => ({
      completedChecklistIds: state.completedChecklistIds,
      completedSectionIds: state.completedSectionIds,
      expandedModuleIds: state.expandedModuleIds,
      lastModuleId: state.lastModuleId,
      lastSectionId: state.lastSectionId,
      resetProgress: state.resetProgress,
      setActiveSection: state.setActiveSection,
      toggleChecklistItem: state.toggleChecklistItem,
      toggleModuleExpanded: state.toggleModuleExpanded,
      toggleSection: state.toggleSection,
    })),
  );
  const [activeModuleId, setActiveModuleId] = useState(progress.lastModuleId);
  const [activeSectionId, setActiveSectionId] = useState(
    progress.lastSectionId,
  );

  const activeModule =
    courseModules.find((module) => module.id === activeModuleId) ??
    courseModules[0];
  const currentSection =
    activeModule.sections.find((section) => section.id === activeSectionId) ??
    activeModule.sections[0];

  const selectSection = (moduleId: string, sectionId: string) => {
    setActiveModuleId(moduleId);
    setActiveSectionId(sectionId);
    progress.setActiveSection(moduleId, sectionId);
    window.scrollTo({ top: 0 });
  };

  const continueLearning = () => {
    const module = courseModules.find(
      (item) => item.id === progress.lastModuleId,
    );
    const sections = module?.sections ?? [];
    const section = sections.find((item) => item.id === progress.lastSectionId);

    if (module && section) {
      selectSection(module.id, section.id);
      return;
    }

    selectSection(courseModules[0].id, courseModules[0].sections[0].id);
  };

  return {
    activeModule,
    continueLearning,
    courseModules,
    currentSection,
    progress,
    selectSection,
  };
};
