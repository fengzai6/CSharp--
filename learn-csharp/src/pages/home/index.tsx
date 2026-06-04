import { CourseAssistant } from "@/components/course-assistant";
import { CourseContent } from "@/components/course-content";
import { CourseLayout } from "@/components/course-layout";
import { CourseSidebar } from "@/components/course-sidebar";
import { useCoursePage } from "@/pages/home/use-course-page";

export const Home = () => {
  const {
    activeModule,
    continueLearning,
    courseModules,
    currentSection,
    progress,
    selectSection,
  } = useCoursePage();

  return (
    <CourseLayout
      assistant={
        <CourseAssistant
          activeSectionId={currentSection.id}
          module={activeModule}
          sections={activeModule.sections}
          onResetProgress={progress.resetProgress}
          onSelectSection={(sectionId) =>
            selectSection(activeModule.id, sectionId)
          }
        />
      }
      content={
        <CourseContent
          completedChecklistIds={progress.completedChecklistIds}
          completedSectionIds={progress.completedSectionIds}
          module={activeModule}
          modules={courseModules}
          section={currentSection}
          onSelectSection={selectSection}
          onToggleChecklistItem={progress.toggleChecklistItem}
          onToggleSection={progress.toggleSection}
        />
      }
      sidebar={
        <CourseSidebar
          activeModuleId={activeModule.id}
          activeSectionId={currentSection.id}
          completedSectionIds={progress.completedSectionIds}
          expandedModuleIds={progress.expandedModuleIds}
          modules={courseModules}
          onContinue={continueLearning}
          onSelectSection={selectSection}
          onToggleModule={progress.toggleModuleExpanded}
        />
      }
    />
  );
};
