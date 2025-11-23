import { describe, expect, it } from "vitest";
import { useAppStore } from "./useAppStore";

describe("useAppStore", () => {
  it("sets selected project and task", () => {
    const store = useAppStore.getState();
    expect(store.selectedProjectId).toBeNull();
    store.setSelectedProject("p1");
    expect(useAppStore.getState().selectedProjectId).toBe("p1");
    expect(useAppStore.getState().selectedTaskId).toBeNull();
    store.setSelectedTask("t1");
    expect(useAppStore.getState().selectedTaskId).toBe("t1");
  });

  it("sets sync state", () => {
    const store = useAppStore.getState();
    store.setSyncState({ isSyncing: true });
    expect(useAppStore.getState().syncState.isSyncing).toBe(true);
    store.setSyncState({ lastError: "oops", lastRun: 123 });
    const s = useAppStore.getState().syncState;
    expect(s.lastError).toBe("oops");
    expect(s.lastRun).toBe(123);
  });
});
