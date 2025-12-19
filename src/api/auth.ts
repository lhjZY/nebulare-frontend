import { defHttp, tokenStorage, Tokens } from "@/utils/http/axios";
import { db } from "@/db";
import { useAppStore } from "@/store/useAppStore";

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
}

export interface VerifyParams {
  email: string;
  code: string;
}

export function register(data: RegisterParams): Promise<{ status: string }> {
  return defHttp.post({
    url: "/auth/register",
    data,
  });
}

export async function verify(data: VerifyParams): Promise<Tokens> {
  // 先清理旧数据
  await logout();

  const tokens = await defHttp.post<Tokens>({
    url: "/auth/verify",
    data,
  });
  tokenStorage.set(tokens);
  return tokens;
}

export async function login(data: LoginParams): Promise<Tokens> {
  // 先清理旧数据
  await logout();

  const tokens = await defHttp.post<Tokens>({
    url: "/auth/login",
    data,
  });
  tokenStorage.set(tokens);
  return tokens;
}

export async function refresh(): Promise<Tokens> {
  const tokens = await defHttp.post<Tokens>({
    url: "/auth/refresh",
    data: { refreshToken: tokenStorage.getRefreshToken() },
    skipRefresh: true, // 避免递归重试
  });
  tokenStorage.set(tokens);
  return tokens;
}

export async function logout() {
  tokenStorage.clear();
  // 清理本地 IndexedDB 数据
  try {
    await Promise.all([db.tasks.clear(), db.projects.clear(), db.meta.clear()]);
  } catch (err) {
    console.error("Failed to clear IndexedDB:", err);
  }
  // 重置 Store 状态
  useAppStore.getState().reset();
}
