import Dexie from "dexie";
import { Project, Task, TickDBSchema } from "./schema";

class TickDB extends Dexie implements TickDBSchema {
  tasks!: TickDBSchema["tasks"];
  projects!: TickDBSchema["projects"];
  meta!: TickDBSchema["meta"];

  constructor() {
    super("TickCloneDB");
    this.version(1).stores({
      // 索引：id 主键；projectId/ status / syncStatus / isDeleted / modifiedTime / dueDate 便于过滤与同步
      tasks: "id, projectId, status, syncStatus, isDeleted, modifiedTime, dueDate",
      projects: "id, syncStatus, isDeleted, modifiedTime",
      meta: "key",
    });
  }
}

export const db = new TickDB();

// 默认值助手：创建本地新任务时统一补齐字段
export function createLocalTask(
  partial: Partial<Task> & Pick<Task, "id" | "projectId" | "title">,
): Task {
  const now = Date.now();
  return {
    content: "",
    status: 0,
    priority: 0,
    progress: 0,
    isAllDay: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    tags: [],
    items: [],
    isDeleted: false,
    modifiedTime: now,
    syncStatus: "created",
    ...partial,
  };
}

export function createLocalProject(
  partial: Partial<Project> & Pick<Project, "id" | "name">,
): Project {
  const now = Date.now();
  return {
    sortOrder: now,
    color: "#c2e7ff",
    kind: "list",
    parentId: "",
    isDeleted: false,
    modifiedTime: now,
    syncStatus: "created",
    ...partial,
  };
}

// API DTO 与 Dexie 实体互转（后端 JSON 字段名保持一致）
export function mapApiTaskToLocal(api: any): Task {
  return {
    id: api.id,
    projectId: api.projectId,
    title: api.title ?? "",
    content: api.content ?? "",
    status: api.status ?? 0,
    priority: api.priority ?? 0,
    progress: api.progress ?? 0,
    isAllDay: api.isAllDay ?? false,
    timeZone: api.timeZone ?? "UTC",
    startDate: api.startDate ?? undefined,
    dueDate: api.dueDate ?? undefined,
    tags: Array.isArray(api.tags) ? api.tags : [],
    items: Array.isArray(api.items) ? api.items : [],
    isDeleted: !!api.isDeleted,
    modifiedTime: api.modifiedTime ?? Date.now(),
    syncStatus: "synced",
  };
}

export function mapLocalTaskToApi(task: Task): any {
  const { syncStatus: _syncStatus, ...rest } = task;
  return rest;
}

export function mapApiProjectToLocal(api: any): Project {
  return {
    id: api.id,
    name: api.name ?? "",
    sortOrder: api.sortOrder ?? Date.now(),
    color: api.color ?? "#c2e7ff",
    kind: api.kind ?? "list",
    parentId: api.parentId ?? "",
    isDeleted: !!api.isDeleted,
    modifiedTime: api.modifiedTime ?? Date.now(),
    syncStatus: "synced",
  };
}

export function mapLocalProjectToApi(project: Project): any {
  const { syncStatus: _syncStatus, ...rest } = project;
  return rest;
}
