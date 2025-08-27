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
    let s = v.trim().replace(/[^\d,.\-]/g, "");
    if (s === "" || s === "-" || s === "—") return NaN;
    if (s.includes(".") && s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (s.includes(",")) s = s.replace(",", ".");
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
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    const [dmy, hms] = s.split(/\s+/);
    const [dd, mm, yyyy] = dmy.split("/").map(Number);
    s = `${yyyy}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}T${hms}`;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

// normalisasi string status/label
function cleanStr(x: unknown) {
  const s = String(x ?? "").trim();
  if (!s) return "";
  const low = s.toLowerCase();
  if (s === "-" || s === "—" || low === "null" || low === "undefined") return "";
  return s;
}

// mapping header sheet → properti snake_case
const HEADER_ALIASES: Record<string, keyof SheetRow | "ignore"> = {
  "timestamp": "timestamp",
  "suhu ikan": "suhu_ikan",
  "suhu_ikan": "suhu_ikan",

  "warna ikan": "warna_ikan",
  "warna_ikan": "warna_ikan",
  // alias kompatibilitas: sheet lama pakai "status ikan"
  "status ikan": "warna_ikan",
  "status_ikan": "warna_ikan",

  "status gas": "status_gas",
  "status_gas": "status_gas",
  "nilai gas": "nilai_gas",
  "nilai_gas": "nilai_gas",
  "avg rgb": "avg_rgb",
  "avg_rgb": "avg_rgb",
};

function normRowKeys(o: Record<string, any>): Partial<SheetRow> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(o)) {
    const kk = HEADER_ALIASES[k.trim().toLowerCase()];
    if (kk && kk !== "ignore") out[kk] = v;
  }
  return out as Partial<SheetRow>;
}

function norm(rowRaw: Record<string, any>): SheetRow | null {
  const r = normRowKeys(rowRaw);

  const timestamp = parseTs(r.timestamp);
  const suhu_ikan = toNum(r.suhu_ikan);

  // --- ambil warna_ikan ; jika kosong, fallback ke 'status ikan' ---
  let warna_ikan = cleanStr(r.warna_ikan);
  if (!warna_ikan) {
    const fallback =
      rowRaw["status ikan"] ?? rowRaw["status_ikan"] ?? rowRaw["STATUS IKAN"];
    warna_ikan = cleanStr(fallback);
  }

  const status_gas = cleanStr(r.status_gas);
  const nilai_gas  = toNum(r.nilai_gas);
  const avg_rgbRaw = r.avg_rgb == null ? undefined : toNum(r.avg_rgb);
  const avg_rgb    = avg_rgbRaw != null && !Number.isNaN(avg_rgbRaw) ? avg_rgbRaw : undefined;

  if (!timestamp || Number.isNaN(suhu_ikan) || Number.isNaN(nilai_gas)) return null;

  return { timestamp, suhu_ikan, warna_ikan, status_gas, nilai_gas, ...(avg_rgb !== undefined ? { avg_rgb } : {}) };
}

async function getText(url: string) {
  const u = `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;
  const res = await fetch(u, { cache: "no-store" });
  return { ok: res.ok, status: res.status, body: await res.text(), ct: res.headers.get("content-type") || "" };
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

  if (!arr && /timestamp|suhu\s*ikan/i.test(r.body) && /,|\n/.test(r.body)) {
    const { data } = Papa.parse<Record<string, string>>(r.body, {
      header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase(), worker: true,
    });
    arr = data as any[];
  }

  if (!arr) {
    console.warn("[fetchSpreadsheetData] Body tidak dikenali, sample:", r.body.slice(0, 200));
    return [];
  }

  let rowsObj: Record<string, any>[];
  if (arr.length && Array.isArray(arr[0])) {
    const header = (arr[0] as any[]).map((h) => String(h).trim().toLowerCase());
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
  suhu_ikan: number; warna_ikan: string; status_gas: string; nilai_gas: number; avg_rgb?: number;
}) {
  if (!BASE_URL) throw new Error("VITE_SHEET_URL belum di-set di .env");
  const body = TOKEN ? { ...payload, token: TOKEN } : payload;

  const res = await fetch(BASE_URL, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!json || json.ok !== true) {
    const msg = (json && (json.error || json.message)) || `POST gagal (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return json.written as {
    timestamp: string; suhu_ikan: number; warna_ikan: string; status_gas: string; nilai_gas: number; avg_rgb?: number;
  };
}

export function formatLocal(dtIso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: TZ })
      .format(new Date(dtIso));
  } catch { return dtIso; }
}
