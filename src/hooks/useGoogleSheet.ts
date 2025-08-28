import * as React from "react";
import type { SheetRow } from "../types/sheet";
import { fetchSpreadsheetData, formatLocal } from "../lib/fetchSpreadsheetData";

/**
 * Opsi hook.
 * - intervalMs: jarak polling (ms). Default 5000.
 */
type Options = {
  intervalMs?: number;
};

type State = {
  data: SheetRow[];
  error: string | null;
  isInitialLoading: boolean;
  lastUpdatedAt: Date | null;
};

/**
 * Helper: bandingkan apakah data benar-benar berubah.
 * Dipakai agar setState tidak menyebabkan re-render kalau tidak ada baris baru.
 */
function isDataChanged(prev: SheetRow[], next: SheetRow[]) {
  if (prev === next) return false;
  if (prev.length !== next.length) return true;
  if (prev.length === 0) return false;
  const pLast = prev[prev.length - 1];
  const nLast = next[next.length - 1];

  // bandingkan timestamp terakhir (cukup untuk kasus streaming data time-series)
  const pTs = (pLast as any)?.timestamp ?? null;
  const nTs = (nLast as any)?.timestamp ?? null;
  return pTs !== nTs;
}

export function useGoogleSheet(opts: Options = {}) {
  const { intervalMs = 2000 } = opts;

  const [{ data, error, isInitialLoading, lastUpdatedAt }, setState] = React.useState<State>({
    data: [],
    error: null,
    isInitialLoading: true,
    lastUpdatedAt: null,
  });

  const fetchOnce = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const rows = (await fetchSpreadsheetData({ signal })) as SheetRow[] | undefined;
      if (Array.isArray(rows)) {
        setState((prev) => {
          const changed = isDataChanged(prev.data, rows);
          if (!changed && prev.error === null) {
            // tidak ada perubahan, jangan ubah referensi (hindari re-render)
            return prev;
          }
          return {
            data: changed ? rows : prev.data,
            error: null,
            isInitialLoading: false,
            lastUpdatedAt: new Date(),
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          error: "Format data tidak valid",
          isInitialLoading: false,
        }));
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        error: e?.message || "Gagal mengambil data",
        isInitialLoading: false,
      }));
    }
  }, []);

  // initial load
  React.useEffect(() => {
    const ac = new AbortController();
    fetchOnce(ac.signal);
    return () => ac.abort();
  }, [fetchOnce]);

  // polling dengan smart pause (visibility & online)
  React.useEffect(() => {
    let timer: number | undefined;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      if (!isHidden && !offline) {
        const ac = new AbortController();
        await fetchOnce(ac.signal).finally(() => ac.abort());
      }
      if (!stopped) {
        timer = window.setTimeout(tick, intervalMs);
      }
    };

    timer = window.setTimeout(tick, intervalMs);

    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    const onOnline = () => tick();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, [fetchOnce, intervalMs]);

  const lastUpdatedStr = React.useMemo(
    () => (lastUpdatedAt ? formatLocal(lastUpdatedAt) : null),
    [lastUpdatedAt]
  );

  return {
    data,
    error,
    isInitialLoading,
    lastUpdatedStr,
  };
}
