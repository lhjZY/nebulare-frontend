import React, { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { useLiveQuery } from "dexie-react-hooks";
import { Panel, PanelGroup } from "react-resizable-panels";
import { db, createLocalTask } from "@/db";
import { useSync } from "@/hooks/useSync";
import { useAppStore } from "@/store/useAppStore";
import { groupTasks } from "./home/utils";
import Sidebar from "./home/Sidebar";
import TaskColumn from "./home/TaskColumn";
import TaskDetail from "./home/TaskDetail";
import ResizeHandle from "./home/ResizeHandle";

export default function HomePage() {
  const { setSyncState, syncState, selectedProjectId, selectedTaskId, setSelectedProject, setSelectedTask } =
    useAppStore();
  const { syncNow, isSyncing, lastError, lastRun } = useSync();
  const [newTitle, setNewTitle] = useState("");

  React.useEffect(() => {
    setSyncState({ isSyncing, lastError: lastError ?? null, lastRun });
  }, [isSyncing, lastError, lastRun, setSyncState]);

  const projects = useLiveQuery(
    async () => {
      const rows = await db.projects.toArray();
      return rows.filter((p) => !p.isDeleted).sort((a, b) => a.sortOrder - b.sortOrder);
    },
    [],
    []
  );

  const tasks = useLiveQuery(
    async () => {
      const rows = (await db.tasks.toArray()).filter((t) => !t.isDeleted);
      if (selectedProjectId) {
        return rows.filter((t) => t.projectId === selectedProjectId);
      }
      return rows;
    },
    [selectedProjectId],
    []
  );

  const projectLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects ?? []) {
      map.set((p as any).ID ?? (p as any).id ?? p.id, (p as any).Name ?? p.name);
    }
    return map;
  }, [projects]);

  const groupedTasks = useMemo(() => groupTasks(tasks ?? []), [tasks]);
  const detailTask = (tasks ?? []).find((t) => t.id === selectedTaskId) || null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const projectId = selectedProjectId ?? "inbox";
    const task = createLocalTask({ id: uuid(), projectId, title });
    await db.tasks.put(task);
    setNewTitle("");
    syncNow();
  };

  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={20} minSize={12} maxSize={60}>
        <Sidebar
          projects={projects ?? []}
          tasks={tasks ?? []}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProject}
        />
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={60} minSize={40}>
        <TaskColumn
          groups={groupedTasks}
          projectLookup={projectLookup}
          onSelectTask={setSelectedTask}
          selectedTaskId={selectedTaskId}
          newTitle={newTitle}
          onChangeTitle={setNewTitle}
          onSubmit={handleAdd}
          isSyncing={syncState.isSyncing}
          lastError={syncState.lastError}
          onDeleteTask={async (id) => {
            await db.tasks.update(id, { isDeleted: true, syncStatus: "deleted", modifiedTime: Date.now() });
            if (selectedTaskId === id) {
              setSelectedTask(null);
            }
            syncNow();
          }}
        />
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={20} minSize={18} maxSize={35}>
        <TaskDetail task={detailTask} projectLookup={projectLookup} />
      </Panel>
    </PanelGroup>
  );
}
