import { create } from "zustand";

type SyncState = {
  isSyncing: boolean;
  lastError: string | null;
  lastRun: number | null;
};

type AppState = {
  selectedProjectId: string | null;
  selectedTaskId: string | null;
  syncState: SyncState;
  setSelectedProject: (id: string | null) => void;
  setSelectedTask: (id: string | null) => void;
  setSyncState: (state: Partial<SyncState>) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedProjectId: null,
  selectedTaskId: null,
  syncState: { isSyncing: false, lastError: null, lastRun: null },
  setSelectedProject: (id) => set({ selectedProjectId: id, selectedTaskId: null }),
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setSyncState: (state) =>
    set((s) => ({
      syncState: { ...s.syncState, ...state },
    })),
  reset: () =>
    set({
      selectedProjectId: null,
      selectedTaskId: null,
      syncState: { isSyncing: false, lastError: null, lastRun: null },
    }),
}));
