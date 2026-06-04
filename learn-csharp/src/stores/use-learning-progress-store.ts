import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ILearningProgressPersistedState {
  completedChecklistIds: string[];
  completedSectionIds: string[];
  expandedModuleIds: string[];
  lastModuleId: string;
  lastSectionId: string;
  updatedAt: string;
}

interface ILearningProgressState extends ILearningProgressPersistedState {
  resetProgress: () => void;
  setActiveSection: (moduleId: string, sectionId: string) => void;
  toggleChecklistItem: (checklistItemId: string) => void;
  toggleModuleExpanded: (moduleId: string) => void;
  toggleSection: (sectionId: string) => void;
}

const initialState: ILearningProgressPersistedState = {
  completedChecklistIds: [],
  completedSectionIds: [],
  expandedModuleIds: ["setup"],
  lastModuleId: "setup",
  lastSectionId: "setup-sdk",
  updatedAt: "",
};

const now = () => new Date().toISOString();

const toggleArrayValue = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

export const useLearningProgressStore = create<ILearningProgressState>()(
  persist(
    (set) => ({
      ...initialState,
      resetProgress: () => {
        set({ ...initialState, updatedAt: now() });
      },
      setActiveSection: (moduleId, sectionId) => {
        set((state) => ({
          expandedModuleIds: state.expandedModuleIds.includes(moduleId)
            ? state.expandedModuleIds
            : [...state.expandedModuleIds, moduleId],
          lastModuleId: moduleId,
          lastSectionId: sectionId,
          updatedAt: now(),
        }));
      },
      toggleChecklistItem: (checklistItemId) => {
        set((state) => ({
          completedChecklistIds: toggleArrayValue(
            state.completedChecklistIds,
            checklistItemId,
          ),
          updatedAt: now(),
        }));
      },
      toggleModuleExpanded: (moduleId) => {
        set((state) => ({
          expandedModuleIds: toggleArrayValue(
            state.expandedModuleIds,
            moduleId,
          ),
          updatedAt: now(),
        }));
      },
      toggleSection: (sectionId) => {
        set((state) => ({
          completedSectionIds: toggleArrayValue(
            state.completedSectionIds,
            sectionId,
          ),
          updatedAt: now(),
        }));
      },
    }),
    {
      name: "learn-csharp-progress-v1",
      partialize: (state) => ({
        completedChecklistIds: state.completedChecklistIds,
        completedSectionIds: state.completedSectionIds,
        expandedModuleIds: state.expandedModuleIds,
        lastModuleId: state.lastModuleId,
        lastSectionId: state.lastSectionId,
        updatedAt: state.updatedAt,
      }),
      version: 1,
    },
  ),
);
