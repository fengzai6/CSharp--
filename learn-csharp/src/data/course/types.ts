import type { ComponentType } from "react";

export interface ILessonComponentProps {
  completedChecklistIds: string[];
  onGoToModule: (moduleId: string) => void;
  onToggleChecklistItem: (checklistItemId: string) => void;
}

export interface ICourseSection {
  component: ComponentType<ILessonComponentProps>;
  id: string;
  objective: string;
  title: string;
}

export interface ITeacherGuide {
  acceptanceQuestions: string[];
  commonPitfalls: string[];
  teacherNotes: string[];
}

export interface ICourseModule {
  duration: string;
  goal: string;
  id: string;
  order: string;
  sections: ICourseSection[];
  sourcePath: string;
  teacherGuide: ITeacherGuide;
  title: string;
}
