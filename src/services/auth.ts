import { request, tokenStorage, Tokens } from "@/utils/http";

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

export async function register(data: RegisterParams): Promise<{ status: string }> {
  return request({
    method: "post",
    url: "/auth/register",
    data
  });
}

export async function verify(data: VerifyParams): Promise<Tokens> {
  const tokens = await request<Tokens>({
    method: "post",
    url: "/auth/verify",
    data
  });
  tokenStorage.set(tokens);
  return tokens;
}

export async function login(data: LoginParams): Promise<Tokens> {
  const tokens = await request<Tokens>({
    method: "post",
    url: "/auth/login",
    data
  });
  tokenStorage.set(tokens);
  return tokens;
}

export async function refresh(): Promise<Tokens> {
  const tokens = await request<Tokens>({
    method: "post",
    url: "/auth/refresh",
    data: { refreshToken: tokenStorage.getRefreshToken() },
    skipRefresh: true // 避免递归重试
  });
  tokenStorage.set(tokens);
  return tokens;
}

export function logout() {
  tokenStorage.clear();
  // TODO: 清理本地 IndexedDB 数据（tasks/projects），按需在调用方处理
}
