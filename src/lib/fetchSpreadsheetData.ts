import Papa from "papaparse";
import type { SheetRow } from "../types/sheet";

const BASE_URL = (import.meta.env.VITE_SHEET_URL as string | undefined) ?? "";
const TOKEN    = (import.meta.env.VITE_SHEET_TOKEN as string | undefined) ?? "";
const TZ       = (import.meta.env.VITE_SHEET_TIMEZONE as string | undefined) ?? "Asia/Makassar";

if (!BASE_URL) console.warn("[fetchSpreadsheetData] VITE_SHEET_URL kosong di .env");

// ---------- helpers ----------
function toNum(v: unknown) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.trim().replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

function parseTs(x: unknown) {
  if (x == null) return "";
  let s = String(x).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(s)) s = s.replace(" ", "T");
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function norm(row: Record<string, any>): SheetRow | null {
  const timestamp = parseTs(row["timestamp"]);
  const suhuIkan  = toNum(row["suhu ikan"]);
  const warnaIkan = String(row["warna ikan"] ?? "").trim().toUpperCase();
  const statusGas = String(row["status gas"] ?? "").trim().toUpperCase();
  const nilaiGas  = toNum(row["nilai gas"]);
  if (!timestamp || Number.isNaN(suhuIkan) || Number.isNaN(nilaiGas)) return null;
  return { timestamp, suhuIkan, warnaIkan, statusGas, nilaiGas };
}

async function getText(url: string) {
  const u = `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`; // cache-buster
  const res = await fetch(u, { cache: "no-store" });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

// ---------- GET ----------
export async function fetchSpreadsheetData(): Promise<SheetRow[]> {
  if (!BASE_URL) throw new Error("VITE_SHEET_URL belum di-set di .env");

  const r = await getText(BASE_URL);
  if (!r.ok) throw new Error(`GAS GET HTTP ${r.status}`);

  let parsed: any = null;
  try { parsed = JSON.parse(r.body); } catch {}

  let arr: any[] | null = null;
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed)) arr = parsed;
    else {
      if (Array.isArray(parsed.data)) arr = parsed.data;
      if (!arr) for (const k of Object.keys(parsed)) { if (Array.isArray(parsed[k])) { arr = parsed[k]; break; } }
    }
  }

  if (!arr && /timestamp|suhu/i.test(r.body) && /,|\n/.test(r.body)) {
    const { data } = Papa.parse<Record<string, string>>(r.body, { header: true, skipEmptyLines: true });
    arr = data as any[];
  }

  if (!arr) {
    console.warn("[fetchSpreadsheetData] Body tidak dikenali, sample:", r.body.slice(0, 200));
    return [];
  }

  // array-of-arrays → object
  let rowsObj: Record<string, any>[];
  if (arr.length && Array.isArray(arr[0])) {
    const header = (arr[0] as any[]).map((h) => String(h).trim());
    rowsObj = (arr as any[]).slice(1).map((row: any[]) => {
      const o: Record<string, any> = {};
      header.forEach((h, i) => (o[h] = row[i]));
      return o;
    });
  } else {
    rowsObj = arr as Record<string, any>[];
  }

  return rowsObj.map(norm).filter(Boolean) as SheetRow[];
}

// ---------- POST ----------
export async function appendToSpreadsheet(payload: {
  suhu_ikan: number;
  warna_ikan: string;
  status_gas: string;
  nilai_gas: number;
}) {
  if (!BASE_URL) throw new Error("VITE_SHEET_URL belum di-set di .env");
  const body = TOKEN ? { ...payload, token: TOKEN } : payload;

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!json || json.ok !== true) {
    const msg = (json && (json.error || json.message)) || `POST gagal (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return json.written as {
    timestamp: string; suhu_ikan: number; warna_ikan: string; status_gas: string; nilai_gas: number;
  };
}

export function formatLocal(dtIso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: TZ })
      .format(new Date(dtIso));
  } catch { return dtIso; }
}
