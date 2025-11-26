import { useCallback, useEffect, useRef, useState } from "react";
import { syncOnce } from "@/services/sync";

type UseSyncOptions = {
  intervalMs?: number
  debounceMs?: number;
};

export function useSync(options: UseSyncOptions = {}) {
  const { intervalMs = 0, debounceMs = 2000 } = options;
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<number | null>(null);
  const debounceTimer = useRef<number | null>(null);
  const initialized = useRef(false);

  const runSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setLastError(null);
    try {
      await syncOnce();
      setLastRun(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : "同步失败";
      setLastError(message);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const syncNow = useCallback(() => {
    // 防抖，避免瞬时高频触发
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = window.setTimeout(() => {
      runSync();
    }, debounceMs);
  }, [debounceMs, runSync]);

  useEffect(() => {
    // 初次加载尝试同步，React 严格模式可能双调用，这里做一次性保护
    if (!initialized.current) {
      initialized.current = true;
      runSync();
    }
    // 监听 online 事件
    const handleOnline = () => runSync();
    window.addEventListener("online", handleOnline);

    let intervalId: number | undefined;
    if (intervalMs > 0) {
      intervalId = window.setInterval(() => {
        runSync();
      }, intervalMs);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, [intervalMs, runSync]);

  return {
    isSyncing,
    lastError,
    lastRun,
    syncNow,
  };
}
