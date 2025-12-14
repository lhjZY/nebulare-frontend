import React, { useMemo, useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import { useLiveQuery } from "dexie-react-hooks";
import { Panel, PanelGroup, ImperativePanelHandle } from "react-resizable-panels";
import { db, createLocalTask } from "@/db";
import { useSync } from "@/hooks/useSync";
import { useAppStore } from "@/store/useAppStore";
import { groupTasks } from "./home/utils";
import Sidebar from "./home/Sidebar";
import TaskColumn from "./home/TaskColumn";
import TaskDetail from "./home/TaskDetail";
import ResizeHandle from "./home/ResizeHandle";

export default function HomePage() {
  const {
    setSyncState,
    syncState,
    selectedProjectId,
    selectedTaskId,
    setSelectedProject,
    setSelectedTask,
  } = useAppStore();
  const { syncNow, isSyncing, lastError, lastRun } = useSync();
  const [newTitle, setNewTitle] = useState("");
  const [newStartDate, setNewStartDate] = useState<number | undefined>(undefined);
  const [newDueDate, setNewDueDate] = useState<number | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);

  const handleToggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;

    if (sidebarCollapsed) {
      panel.expand();
    } else {
      panel.collapse();
    }
    setSidebarCollapsed(!sidebarCollapsed);
  };

  React.useEffect(() => {
    setSyncState({ isSyncing, lastError: lastError ?? null, lastRun });
  }, [isSyncing, lastError, lastRun, setSyncState]);

  const projects = useLiveQuery(
    async () => {
      const rows = await db.projects.toArray();
      return rows.filter((p) => !p.isDeleted).sort((a, b) => a.sortOrder - b.sortOrder);
    },
    [],
    [],
  );

  // SmartList 分类（只关注时间，显示所有任务）
  const timeBasedSmartLists = ["all", "today", "tomorrow", "week"];
  const isTimeBasedSmartList = selectedProjectId
    ? timeBasedSmartLists.includes(selectedProjectId)
    : true;

  // 用于 Sidebar 统计的所有任务
  const allTasks = useLiveQuery(
    async () => {
      return (await db.tasks.toArray()).filter((t) => !t.isDeleted);
    },
    [],
    [],
  );

  // 用于 TaskColumn 显示的过滤后任务
  const tasks = useMemo(() => {
    if (!allTasks) return [];

    // 基于时间的 SmartList（all, today, tomorrow, week）：显示所有任务
    if (isTimeBasedSmartList) {
      return allTasks;
    }

    // 收集箱：只显示未分配项目的任务
    if (selectedProjectId === "inbox") {
      return allTasks.filter((t) => t.projectId === "inbox");
    }

    // 具体项目：只显示该项目的任务
    return allTasks.filter((t) => t.projectId === selectedProjectId);
  }, [allTasks, selectedProjectId, isTimeBasedSmartList]);

  const projectLookup = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const p of projects ?? []) {
      const id = (p as any).ID ?? (p as any).id ?? p.id;
      const name = (p as any).Name ?? p.name;
      const color = (p as any).Color ?? p.color ?? "#c2e7ff";
      map.set(id, { name, color });
    }
    return map;
  }, [projects]);

  const groupedTasks = useMemo(() => groupTasks(tasks ?? []), [tasks]);
  const detailTask = (tasks ?? []).find((t) => t.id === selectedTaskId) || null;

  // SmartList 映射
  const smartListLabels: Record<string, string> = {
    inbox: "收集箱",
    all: "所有",
    today: "今天",
    tomorrow: "明天",
    week: "最近7天",
  };

  // 判断是否选中了 SmartList
  const isSmartList = selectedProjectId ? selectedProjectId in smartListLabels : false;

  // 计算标题和 placeholder
  const columnTitle = useMemo(() => {
    if (!selectedProjectId || isSmartList) {
      return smartListLabels[selectedProjectId ?? "all"] ?? "所有";
    }
    return projectLookup.get(selectedProjectId)?.name ?? "未命名项目";
  }, [selectedProjectId, projectLookup, isSmartList]);

  const inputPlaceholder = useMemo(() => {
    if (!selectedProjectId || isSmartList) {
      return "+ 添加任务到收集箱";
    }
    const projectName = projectLookup.get(selectedProjectId)?.name ?? "项目";
    return `+ 添加任务到「${projectName}」中`;
  }, [selectedProjectId, projectLookup, isSmartList]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    // 如果选中了 SmartList，则任务归入 inbox；否则归入具体项目
    const projectId = isSmartList ? "inbox" : (selectedProjectId ?? "inbox");
    const task = createLocalTask({
      id: uuid(),
      projectId,
      title,
      startDate: newStartDate,
      dueDate: newDueDate,
    });
    await db.tasks.put(task);
    setNewTitle("");
    setNewStartDate(undefined);
    setNewDueDate(undefined);
    syncNow();
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    const newStatus = completed ? 2 : 0; // 2 = completed, 0 = pending
    await db.tasks.update(taskId, {
      status: newStatus,
      progress: completed ? 100 : 0,
      syncStatus: "updated",
      modifiedTime: Date.now(),
    });
    syncNow();
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<import("@/db/schema").Task>) => {
    await db.tasks.update(taskId, {
      ...updates,
      syncStatus: "updated",
      modifiedTime: Date.now(),
    });
    syncNow();
  };

  const handleUpdatePriority = async (taskId: string, priority: number) => {
    await db.tasks.update(taskId, {
      priority,
      syncStatus: "updated",
      modifiedTime: Date.now(),
    });
    syncNow();
  };

  // 项目创建后的处理函数
  const handleProjectCreated = () => {
    // 触发同步，从服务器获取最新的项目列表
    syncNow();
  };

  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel
        id="sidebar"
        order={1}
        ref={sidebarPanelRef}
        defaultSize={20}
        minSize={12}
        maxSize={60}
        collapsible
        collapsedSize={0}
        onCollapse={() => setSidebarCollapsed(true)}
        onExpand={() => setSidebarCollapsed(false)}
      >
        <Sidebar
          projects={projects ?? []}
          tasks={allTasks ?? []}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProject}
          onProjectCreated={handleProjectCreated}
        />
      </Panel>
      <ResizeHandle />
      <Panel id="main" order={2} defaultSize={60} minSize={40}>
        <TaskColumn
          groups={groupedTasks}
          projectLookup={projectLookup}
          onSelectTask={setSelectedTask}
          selectedTaskId={selectedTaskId}
          selectedProjectId={selectedProjectId}
          newTitle={newTitle}
          onChangeTitle={setNewTitle}
          newStartDate={newStartDate}
          onChangeStartDate={setNewStartDate}
          newDueDate={newDueDate}
          onChangeDueDate={setNewDueDate}
          onSubmit={handleAdd}
          isSyncing={syncState.isSyncing}
          lastError={syncState.lastError}
          onDeleteTask={async (id) => {
            await db.tasks.update(id, {
              isDeleted: true,
              syncStatus: "deleted",
              modifiedTime: Date.now(),
            });
            if (selectedTaskId === id) {
              setSelectedTask(null);
            }
            syncNow();
          }}
          onToggleComplete={handleToggleComplete}
          onUpdatePriority={handleUpdatePriority}
          onUpdateTask={handleUpdateTask}
          columnTitle={columnTitle}
          inputPlaceholder={inputPlaceholder}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />
      </Panel>
      <ResizeHandle />
      <Panel id="detail" order={3} defaultSize={20} minSize={18} maxSize={35}>
        {detailTask ? (
          <TaskDetail
            task={detailTask}
            projectLookup={projectLookup}
            onToggleComplete={handleToggleComplete}
            onUpdateTask={handleUpdateTask}
          />
        ) : (
          <div className="h-full bg-background" />
        )}
      </Panel>
    </PanelGroup>
  );
}
