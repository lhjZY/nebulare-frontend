import { defHttp } from "@/utils/http/axios";

export type ProjectKind = "TASK" | "NOTE";

export interface ProjectPayload {
  id?: string;
  name: string;
  color: string;
  sortOrder?: number;
  kind: ProjectKind;
  parentId?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  sortOrder: number;
  color: string;
  kind: ProjectKind;
  parentId: string;
  isDeleted: boolean;
  serverUpdateTime: number;
}

export interface ListProjectsParams {
  includeDeleted?: boolean;
  kind?: ProjectKind;
  parentId?: string;
}

export async function listProjects(params: ListProjectsParams = {}): Promise<ProjectResponse[]> {
  const res = await defHttp.get<{ items: ProjectResponse[] }>({
    url: "/projects",
    params,
  });
  return res.items ?? [];
}

export async function createProject(payload: ProjectPayload): Promise<ProjectResponse> {
  return defHttp.post<ProjectResponse>({
    url: "/projects",
    data: payload,
  });
}

export async function updateProject(id: string, payload: ProjectPayload): Promise<ProjectResponse> {
  return defHttp.put<ProjectResponse>({
    url: `/projects/${id}`,
    data: payload,
  });
}

export async function deleteProject(id: string): Promise<void> {
  await defHttp.delete({
    url: `/projects/${id}`,
  });
}

// 兼容旧接口
export async function upsertProject(payload: ProjectPayload): Promise<ProjectResponse> {
  if (payload.id) {
    return updateProject(payload.id, payload);
  }
  return createProject(payload);
}
