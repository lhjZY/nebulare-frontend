import Dexie from "dexie";
import { db, mapApiProjectToLocal, mapApiTaskToLocal, mapLocalProjectToApi, mapLocalTaskToApi } from "@/db";
import { request } from "@/utils/http";

type SyncChanges<T> = {
  add: T[];
  update: T[];
  delete: string[];
};

type SyncPayload = {
  checkPoint: number;
  changes: {
    tasks: SyncChanges<any>;
    projects: SyncChanges<any>;
  };
};

type SyncResponse = {
  checkPoint: number;
  updates: {
    tasks?: any[];
    projects?: any[];
  };
};

const CHECKPOINT_KEY = "checkPoint";

export async function syncOnce(): Promise<{
  uploaded: number;
  downloaded: number;
  checkPoint: number;
}> {
  const checkPoint = ((await db.meta.get(CHECKPOINT_KEY))?.value as number) ?? 0;

  const [dirtyTasks, dirtyProjects] = await Promise.all([db.tasks.toArray(), db.projects.toArray()]);

  const pendingTasks = dirtyTasks.filter((t) => t.syncStatus !== "synced");
  const pendingProjects = dirtyProjects.filter((p) => p.syncStatus !== "synced");

  const hasChanges =
    pendingTasks.length > 0 ||
    pendingProjects.length > 0 ||
    (checkPoint == 0 && (await db.meta.get(CHECKPOINT_KEY)) == nil);

  // 没有脏数据且已有 checkpoint 时，直接跳过请求
  if (!hasChanges) {
    return {
      uploaded: 0,
      downloaded: 0,
      checkPoint
    };
  }

  const changes: SyncPayload["changes"] = {
    tasks: splitChanges(pendingTasks, mapLocalTaskToApi),
    projects: splitChanges(pendingProjects, mapLocalProjectToApi)
  };

  const payload: SyncPayload = {
    checkPoint,
    changes
  };

  const res = await request<SyncResponse>({
    method: "post",
    url: "/sync",
    data: payload
  });

  const updates = res?.updates ?? {};
  const newCheckPoint = res?.checkPoint ?? checkPoint;

  await db.transaction("rw", db.tasks, db.projects, db.meta, async () => {
    await applyUpdates(updates.tasks, db.tasks, mapApiTaskToLocal);
    await applyUpdates(updates.projects, db.projects, mapApiProjectToLocal);

    // 清除已上传的脏标记（如果用户在同步期间再次修改，会有新的 syncStatus，where 查询时会再次带上）
    const dirtyTaskIds = dirtyTasks.map((t) => t.id);
    if (dirtyTaskIds.length) {
      await db.tasks.where("id").anyOf(dirtyTaskIds).modify({ syncStatus: "synced" });
    }
    const dirtyProjectIds = dirtyProjects.map((p) => p.id);
    if (dirtyProjectIds.length) {
      await db.projects.where("id").anyOf(dirtyProjectIds).modify({ syncStatus: "synced" });
    }

    await db.meta.put({ key: CHECKPOINT_KEY, value: newCheckPoint });
  });

  const downloaded = (updates.tasks?.length ?? 0) + (updates.projects?.length ?? 0);

  return {
    uploaded: pendingTasks.length + pendingProjects.length,
    downloaded,
    checkPoint: newCheckPoint
  };
}

function splitChanges<T>(
  rows: (T & { syncStatus: string })[],
  mapToApi: (row: T) => any
): SyncChanges<any> {
  const add: any[] = [];
  const update: any[] = [];
  const del: string[] = [];

  for (const row of rows) {
    const mapped = mapToApi(row as any);
    if (row.syncStatus === "created") {
      add.push(mapped);
    } else if (row.syncStatus === "deleted") {
      del.push((row as any).id);
    } else {
      update.push(mapped);
    }
  }

  return { add, update, delete: del };
}

async function applyUpdates<T extends { id: string; modifiedTime?: number }>(
  items: any[] | undefined,
  table: Dexie.Table<T, string>,
  mapToLocal: (api: any) => T
) {
  if (!items || items.length === 0) return;

  for (const apiItem of items) {
    const local = await table.get(apiItem.id);
    const incoming = mapToLocal(apiItem);
    if (local && local.modifiedTime && incoming.modifiedTime && local.modifiedTime > incoming.modifiedTime) {
      // 本地版本更新，跳过覆盖
      continue;
    }
    await table.put(incoming);
  }
}
