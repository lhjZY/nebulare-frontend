import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { api, request, tokenStorage } from "@/utils/http";
import { login, refresh, register, verify } from "./auth";

const localStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => (key in localStore ? localStore[key] : null),
  setItem: (key: string, value: string) => {
    localStore[key] = value;
  },
  removeItem: (key: string) => {
    delete localStore[key];
  },
  clear: () => {
    Object.keys(localStore).forEach((k) => delete localStore[k]);
  }
};

// Ensure localStorage exists in test env
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).localStorage = localStorageMock;

const tokens = { accessToken: "access-1", refreshToken: "refresh-1" };

describe("auth services", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    localStorage.clear();
    tokenStorage.clear();
  });

  afterEach(() => {
    mock.reset();
  });

  it("register returns status", async () => {
    mock.onPost("/auth/register").reply(200, { status: "pending_verification" });
    const res = await register({ email: "a@b.com", password: "Password1" });
    expect(res.status).toBe("pending_verification");
  });

  it("verify stores tokens", async () => {
    mock.onPost("/auth/verify").reply(200, tokens);
    await verify({ email: "a@b.com", code: "123456" });
    expect(tokenStorage.get()).toEqual(tokens);
  });

  it("login stores tokens and attaches Authorization on subsequent requests", async () => {
    mock.onPost("/auth/login").reply(200, tokens);
    await login({ email: "a@b.com", password: "Password1" });
    expect(tokenStorage.get()).toEqual(tokens);

    mock.onGet("/protected").reply((config) => {
      expect(config.headers?.Authorization).toBe(`Bearer ${tokens.accessToken}`);
      return [200, { ok: true }];
    });
    const res = await request<{ ok: boolean }>({ method: "get", url: "/protected" });
    expect(res.ok).toBe(true);
  });

  it("refresh flow replaces access token on 401", async () => {
    tokenStorage.set(tokens);

    mock.onGet("/protected").replyOnce(401).onGet("/protected").reply(200, { ok: true });
    mock.onPost("/auth/refresh").reply(200, { accessToken: "access-2", refreshToken: "refresh-1" });

    const res = await request<{ ok: boolean }>({ method: "get", url: "/protected" });
    expect(res.ok).toBe(true);
    expect(tokenStorage.get()?.accessToken).toBe("access-2");
  });

  it("refresh() skips recursive refresh and stores tokens", async () => {
    mock.onPost("/auth/refresh").reply(200, { accessToken: "access-3", refreshToken: "refresh-3" });
    const res = await refresh();
    expect(res.accessToken).toBe("access-3");
    expect(tokenStorage.get()?.accessToken).toBe("access-3");
  });
});
