import { useEffect, useRef, useState } from "react";
import { fetchSpreadsheetData } from "../lib/fetchSpreadsheetData";
import type { SheetRow } from "../types/sheet";

const POLL_MS = Number(import.meta.env.VITE_SHEET_POLL_MS ?? 30000);

export function useGoogleSheet() {
  const [data, setData] = useState<SheetRow[]>([]);
  const [isInitialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const timerRef = useRef<number | null>(null);

  async function load({ initial = false } = {}) {
    try {
      if (initial) setInitialLoading(true);
      else setRefreshing(true);
      const rows = await fetchSpreadsheetData();
      setData(rows);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      if (initial) setInitialLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ initial: true });
    if (POLL_MS > 0) {
      timerRef.current = window.setInterval(() => load(), POLL_MS);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, []);

  return { data, isInitialLoading, isRefreshing, error, refresh: () => load() };
}
