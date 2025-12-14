import { defHttp, tokenStorage, Tokens } from "@/utils/http/axios";

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
  const tokens = await defHttp.post<Tokens>({
    url: "/auth/verify",
    data,
  });
  tokenStorage.set(tokens);
  return tokens;
}

export async function login(data: LoginParams): Promise<Tokens> {
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

export function logout() {
  tokenStorage.clear();
  // TODO: 清理本地 IndexedDB 数据（tasks/projects），按需在调用方处理
}
