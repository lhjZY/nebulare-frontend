import { defHttp } from "@/utils/http/axios";

export type SyncChanges<T> = {
  add: T[];
  update: T[];
  delete: string[];
};

export type SyncPayload = {
  checkPoint: number;
  changes: {
    tasks: SyncChanges<any>;
    projects: SyncChanges<any>;
  };
};

export type SyncResponse = {
  checkPoint: number;
  updates: {
    tasks?: any[];
    projects?: any[];
  };
};

export function postSync(payload: SyncPayload): Promise<SyncResponse> {
  return defHttp.post<SyncResponse>({
    url: "/sync",
    data: payload,
  });
}
