import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from "axios";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

type AuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean; // 不注入 Authorization
  skipRefresh?: boolean; // 不进行 401 刷新重试
  _retry?: boolean; // 避免重复重试
};

const TOKEN_KEY = "tickclone.tokens";

export const tokenStorage = {
  get(): Tokens | null {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      return raw ? (JSON.parse(raw) as Tokens) : null;
    } catch {
      return null;
    }
  },
  set(tokens: Tokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
  getAccessToken(): string | null {
    return this.get()?.accessToken ?? null;
  },
  getRefreshToken(): string | null {
    return this.get()?.refreshToken ?? null;
  }
};

const apiBase =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: apiBase,
  timeout: 15_000
});

api.interceptors.request.use((config: AuthConfig) => {
  if (!config.skipAuth) {
    const access = tokenStorage.getAccessToken();
    if (access) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${access}`
      };
    }
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = api
      .post(
        "/auth/refresh",
        { refreshToken },
        { skipAuth: true, skipRefresh: true } as AxiosRequestConfig
      )
      .then((res) => {
        const accessToken = (res.data as Tokens)?.accessToken;
        if (!accessToken) {
          tokenStorage.clear();
          return null;
        }
        tokenStorage.set({ accessToken, refreshToken });
        return accessToken;
      })
      .catch(() => {
        tokenStorage.clear();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as AuthConfig;
    if (!config || config.skipRefresh || config._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      config._retry = true;
      const newAccess = await refreshAccessToken();
      if (!newAccess) {
        return Promise.reject(error);
      }
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${newAccess}`
      };
      return api(config);
    }

    return Promise.reject(error);
  }
);

// 统一的请求封装，默认返回 data
export async function request<T = any>(
  config: AxiosRequestConfig & { skipAuth?: boolean; skipRefresh?: boolean }
): Promise<T> {
  const res: AxiosResponse<T> = await api.request(config);
  return res.data;
}

export { api };
