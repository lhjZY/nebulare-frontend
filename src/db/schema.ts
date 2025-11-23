import { Table } from "dexie";

export type SyncStatus = "synced" | "created" | "updated" | "deleted";

// 与后端 models.Task 对齐（字段名使用后端 JSON tag）
export interface Task {
  id: string; // UUID v4
  projectId: string;
  title: string;
  content: string;
  status: number;
  priority: number;
  progress: number;
  isAllDay: boolean;
  timeZone: string;
  startDate?: number; // timestamp (ms)
  dueDate?: number; // timestamp (ms)
  tags: string[]; // 来自后端 JSONB 数组
  items: unknown[]; // 后端 JSONB 子任务列表，前端可定义具体类型
  isDeleted: boolean;
  modifiedTime: number; // 对应后端 SyncMeta.server_update_time (json:"modifiedTime")
  syncStatus: SyncStatus; // 前端专用同步标记
}

// 与后端 models.Project 对齐
export interface Project {
  id: string;
  name: string;
  sortOrder: number;
  color: string;
  kind: string;
  parentId: string;
  isDeleted: boolean;
  modifiedTime: number;
  syncStatus: SyncStatus;
}

// 前端元数据存储
export interface Meta {
  key: string; // e.g., "checkPoint", "currentUser"
  value: unknown;
}

// Dexie 表类型声明
export interface TickDBSchema {
  tasks: Table<Task>;
  projects: Table<Project>;
  meta: Table<Meta>;
}
