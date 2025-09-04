// src/components/HealthStatus.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Thermometer,
  Palette,
  Flame,
  Info,
} from "lucide-react";

/* ======================== Types ======================== */
type Status = "good" | "warning" | "danger";
type Verdict = "AMAN" | "PERLU DIPANASKAN" | "TIDAK DIREKOMENDASIKAN" | "TIDAK LAYAK";
type BorderlineMode = "strict" | "lenient";

type RowPayload = {
  timestamp?: string | Date | null;
  suhu_ikan?: number | null;
  status_ikan?: string | null;
  status_gas?: string | null;
  nilai_gas?: number | null;
  avg_rgb?: number | null;
  fishName?: string | null;
};

type DatasetSummary = {
  total: number;
  counts: Record<Verdict, number>;
  percents: Record<Verdict, number>;
  layak_langsung_pct: number;          // AMAN saja
  layak_plus_panas_pct: number;        // AMAN + PERLU DIPANASKAN
  tidak_layak_ketat_pct: number;       // 100 - AMAN
  tidak_layak_konservatif_pct: number; // 100 - (AMAN + PERLU DIPANASKAN)
};

type Props = {
  // nilai realtime / terakhir untuk panel utama
  suhu_ikan?: number | null;
  nilai_gas?: number | null;
  avg_rgb?: number | null;
  warna_ikan?: string | null;  // label visual (boleh hasil mapping dari status_ikan)
  status_gas?: string | null;  // "segar" | "kurang segar" | "tidak segar" / sinonim
  fishName?: string;
  animate?: boolean;

  // opsional: sumber data spreadsheet untuk PERSENTASE & paparan suhu
  webAppUrl?: string;           // endpoint GAS yang support ?mode=recent&limit=N
  sampleSize?: number;          // berapa baris terbaru (default 500)
  refreshMs?: number;           // interval refresh (ms), default 10s
  showDatasetSummary?: boolean; // tampilkan panel persentase (default true)

  // kontrol safety & kebijakan label
  applyExposureOverrideFromSheet?: boolean; // default true
  hardCapDangerToTen?: boolean;             // default true
  borderlineMode?: BorderlineMode;          // "strict" | "lenient" (default "strict")
};

/* ===== Ambang dari Arduino & heuristik UI ===== */
// GAS (ADC)
const GAS_GOOD_MAX = 2500; // segar
const GAS_OK_MAX   = 3000; // kurang segar

// AVG RGB (durasi pulsa µs)
const AVG_GOOD_MIN   = 180; // segar
const AVG_GOOD_MAX   = 250;
const AVG_KURANG_MIN = 300; // kurang segar
const AVG_KURANG_MAX = 450;
const AVG_BAD_LOW_MARGIN  = 500; // praktis tak tercapai (low outlier)
const AVG_BAD_HIGH_MARGIN = 700; // >1150 = danger

/* ===== Helpers ===== */
const normalize = (s?: string | null) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const includesAny = (hay: string, needles: string[]) =>
  needles.some((n) => hay.includes(n));

function statusFromWarnaLabel(s?: string | null, mode: BorderlineMode = "strict"): Status {
  const up = normalize(s);
  if (!up) return "warning";
  const danger = ["PUCAT", "ABU", "LENDIR", "HIJAU", "HITAM", "TIDAK SEGAR"];
  const good   = ["CERAH", "COKELAT", "COKLAT", "MERATA", "SEGAR"];
  const warn   = ["NETRAL", "OK", "KURANG", "KURANG SEGAR"];

  if (includesAny(up, good))   return "good";
  if (includesAny(up, warn))   return "warning";
  if (includesAny(up, danger)) return (mode === "lenient" ? "warning" : "danger");
  return "warning";
}

function statusFromGasLabel(s?: string | null, mode: BorderlineMode = "strict"): Status {
  const up = normalize(s);
  if (!up) return "warning";
  const good   = ["AMAN", "SEGAR", "NETRAL", "RINGAN"];
  const warn   = ["KURANG", "KURANG SEGAR"];
  const danger = ["ASAM", "MENYENGAT", "ANYIR KUAT", "BUSUK", "AMONIA KUAT", "TIDAK SEGAR"];

  if (includesAny(up, good))   return "good";
  if (includesAny(up, warn))   return "warning";
  if (includesAny(up, danger)) return (mode === "lenient" ? "warning" : "danger");
  return "warning";
}

function statusFromSuhu(v?: number | null): Status {
  if (!Number.isFinite(v as number)) return "warning";
  const x = v as number;
  if (x <= 4)  return "good";
  if (x <= 10) return "warning";
  return "danger";
}

function statusFromGasValue(v?: number | null): Status {
  if (!Number.isFinite(v as number)) return "warning";
  const x = v as number;
  if (x <= GAS_GOOD_MAX) return "good";
  if (x <= GAS_OK_MAX)   return "warning";
  return "danger";
}
function statusFromAvgRGB(v?: number | null): Status {
  if (!Number.isFinite(v as number)) return "warning";
  const x = v as number;
  if (x < (AVG_KURANG_MIN - AVG_BAD_LOW_MARGIN))  return "danger";
  if (x > (AVG_KURANG_MAX + AVG_BAD_HIGH_MARGIN)) return "danger"; // >1150
  if (x >= AVG_GOOD_MIN   && x <= AVG_GOOD_MAX)   return "good";
  if (x >= AVG_KURANG_MIN && x <= AVG_KURANG_MAX) return "warning";
  return "warning";
}

/* ===== Skoring berbobot ===== */
function scoreOfStatus(st: Status) {
  // 100 / 75 / 40 agar kompatibel; tampilan bisa di-hardcap ke 10% saat UNSAFE.
  return st === "good" ? 100 : st === "warning" ? 75 : 40;
}
const W = { warnaLabel: 0.35, gasLabel: 0.25, suhu: 0.2, gasValue: 0.1, avgRgb: 0.1 } as const;

// Verdikt dari skor
function verdictFromScore(s: number): Verdict {
  if (s >= 85) return "AMAN";
  if (s >= 70) return "PERLU DIPANASKAN";
  if (s >= 50) return "TIDAK DIREKOMENDASIKAN";
  return "TIDAK LAYAK";
}

// gabungkan beberapa status → ambil yang TERPARAH
const rank: Record<Status, number> = { good: 0, warning: 1, danger: 2 };
function worst(...sts: Status[]): Status {
  return sts.reduce<Status>((a,b) => (rank[b] > rank[a] ? b : a), "good");
}

// status_ikan → label warna_ikan yang dikenali heuristik (opsional, untuk dataset)
function mapStatusIkanToWarna(s?: string | null) {
  const up = normalize(s);
  if (!up) return "NETRAL";
  if (up.includes("TIDAK SEGAR")) return "PUCAT/LENDIR";
  if (up.includes("KURANG"))      return "NETRAL";
  if (up.includes("SEGAR"))       return "CERAH MERATA";
  return s || "NETRAL";
}

/* ===== Fetch & ringkas dataset ===== */
async function fetchRecentRows(webAppUrl: string, limit: number): Promise<RowPayload[]> {
  const url = webAppUrl.includes("?")
    ? `${webAppUrl}&mode=recent&limit=${limit}`
    : `${webAppUrl}?mode=recent&limit=${limit}`;
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  if (json && json.ok && Array.isArray(json.rows)) return json.rows as RowPayload[];
  if (Array.isArray(json)) return json as RowPayload[];
  return [];
}

function verdictForRow(row: RowPayload, mode: BorderlineMode): { score: number; verdict: Verdict } {
  const warnaStatus = statusFromWarnaLabel(mapStatusIkanToWarna(row.status_ikan), mode);
  const gasStatus   = statusFromGasLabel(row.status_gas, mode);
  const suhuStatus  = statusFromSuhu(row.suhu_ikan);
  const gasNumStat  = statusFromGasValue(row.nilai_gas);
  const rgbStatus   = statusFromAvgRGB(row.avg_rgb);

  const score =
    scoreOfStatus(warnaStatus) * W.warnaLabel +
    scoreOfStatus(gasStatus)   * W.gasLabel   +
    scoreOfStatus(suhuStatus)  * W.suhu       +
    scoreOfStatus(gasNumStat)  * W.gasValue   +
    scoreOfStatus(rgbStatus)   * W.avgRgb;

  const healthScore = Math.max(0, Math.min(100, Math.round(score)));
  return { score: healthScore, verdict: verdictFromScore(healthScore) };
}

function summarizeDataset(rows: RowPayload[], mode: BorderlineMode): DatasetSummary {
  const verdicts: Verdict[] = ["AMAN","PERLU DIPANASKAN","TIDAK DIREKOMENDASIKAN","TIDAK LAYAK"];
  const counts: Record<Verdict, number> = { AMAN:0, "PERLU DIPANASKAN":0, "TIDAK DIREKOMENDASIKAN":0, "TIDAK LAYAK":0 };

  let total = 0;
  for (const r of rows) {
    const { verdict } = verdictForRow(r, mode);
    counts[verdict] += 1;
    total += 1;
  }
  const percents = verdicts.reduce((acc, v) => {
    acc[v] = total ? +(counts[v] / total * 100).toFixed(2) : 0;
    return acc;
  }, {} as Record<Verdict, number>);

  const layak_langsung_pct     = percents["AMAN"];
  const layak_plus_panas_pct   = percents["AMAN"] + percents["PERLU DIPANASKAN"];
  const tidak_layak_ketat_pct  = +(100 - layak_langsung_pct).toFixed(2);
  const tidak_layak_konservatif_pct = +(100 - layak_plus_panas_pct).toFixed(2);

  return { total, counts, percents, layak_langsung_pct, layak_plus_panas_pct, tidak_layak_ketat_pct, tidak_layak_konservatif_pct };
}

/* ===== Paparan suhu dari deret spreadsheet (override) ===== */
/** Kebijakan praktis:
 *  - >10°C kumulatif ≥ 2 jam   → force unsafe
 *  - >20°C kumulatif ≥ 1 jam   → force unsafe
 *  - >30°C kumulatif ≥ 30 menit→ force unsafe
 */
function computeExposureFlags(rows: RowPayload[]) {
  const sorted = [...rows].sort((a, b) => {
    const ta = new Date(a.timestamp ?? 0).getTime();
    const tb = new Date(b.timestamp ?? 0).getTime();
    return ta - tb;
  });

  let t10 = 0, t20 = 0, t30 = 0; // detik
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i-1], b = sorted[i];
    const ta = new Date(a.timestamp ?? 0).getTime();
    const tb = new Date(b.timestamp ?? 0).getTime();
    if (!isFinite(ta) || !isFinite(tb) || tb <= ta) continue;
    const dur = (tb - ta) / 1000; // detik
    const s = Number(a.suhu_ikan);
    if (!Number.isFinite(s)) continue;
    if (s > 30) t30 += dur;
    if (s > 20) t20 += dur;
    if (s > 10) t10 += dur;
  }
  const over10h = t10 / 3600;
  const over20h = t20 / 3600;
  const over30m = t30 / 60;
  const forceUnsafe = over10h >= 2 || over20h >= 1 || over30m >= 30;
  return { over10h, over20h, over30m, forceUnsafe };
}

/* ===== Tone/UI helpers ===== */
function toTone(st: Status): "ok" | "warn" | "danger" {
  if (st === "good") return "ok";
  if (st === "warning") return "warn";
  return "danger";
}
function getToneStyles(tone: "ok" | "warn" | "danger") {
  switch (tone) {
    case "ok":
      return {
        border: "border-green-200/60",
        iconWrap: "bg-green-50/80 border-green-200 ring-green-200/40",
        icon: "text-green-600",
        accentBar: "bg-gradient-to-r from-green-300 to-green-400",
        badge: "bg-green-50 border-green-200 text-green-700",
        dot: "bg-green-500",
        glow: "bg-green-300/30",
      };
    case "warn":
      return {
        border: "border-orange-200/60",
        iconWrap: "bg-orange-50/80 border-orange-200 ring-orange-200/40",
        icon: "text-orange-600",
        accentBar: "bg-gradient-to-r from-orange-300 to-orange-400",
        badge: "bg-orange-50 border-orange-200 text-orange-700",
        dot: "bg-orange-500",
        glow: "bg-orange-300/30",
      };
    default:
      return {
        border: "border-red-300/60",
        iconWrap: "bg-red-50/80 border-red-200 ring-red-200/40",
        icon: "text-red-700",
        accentBar: "bg-gradient-to-r from-red-400 to-red-500",
        badge: "bg-red-50 border-red-200 text-red-700",
        dot: "bg-red-600",
        glow: "bg-red-300/30",
      };
  }
}
function StatusBadge({ tone }: { tone: "ok" | "warn" | "danger" }) {
  const t = getToneStyles(tone);
  const text = tone === "ok" ? "Normal" : tone === "warn" ? "Waspada" : "Bahaya";
  return (
    <span className={["inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", t.badge].join(" ")}>
      <span className={["h-1.5 w-1.5 rounded-full", t.dot].join(" ")} />
      {text}
    </span>
  );
}
function LegendDot({ tone }: { tone: "ok" | "warn" | "danger" }) {
  const t = getToneStyles(tone);
  return <span className={["h-2 w-2 rounded-full inline-block", t.dot].join(" ")} />;
}
function Card({
  tone, title, label, Icon, hint,
}: {
  tone: "ok" | "warn" | "danger";
  title: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  const t = getToneStyles(tone);
  return (
    <div className={["group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm", "transition-colors duration-300", t.border].join(" ")}>
      <div aria-hidden className={["absolute inset-x-0 top-0 h-1", t.accentBar].join(" ")} />
      <div className="flex items-start gap-3">
        <div className={["inline-flex h-10 w-10 items-center justify-center rounded-xl border", "shadow-sm ring-1 ring-inset", t.iconWrap].join(" ")}>
          <Icon className={["h-5 w-5", t.icon].join(" ")} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-500">{title}</div>
            {hint && <Info className="h-3.5 w-3.5 text-slate-400" aria-label={hint} />}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <div className="text-lg font-semibold tracking-tight text-slate-800">{label || "—"}</div>
            <StatusBadge tone={tone} />
          </div>
        </div>
      </div>
      <div
        aria-hidden
        className={["pointer-events-none absolute -bottom-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-2xl opacity-0", "transition-opacity duration-300 group-hover:opacity-60", t.glow].join(" ")}
      />
    </div>
  );
}

/* ======================== Component ======================== */
const HealthStatus: React.FC<Props> = ({
  suhu_ikan = null,
  nilai_gas = null,
  avg_rgb = null,
  warna_ikan = null,
  status_gas = null,
  fishName = "Ikan Fufu",
  animate = true,

  webAppUrl,
  sampleSize = 500,
  refreshMs = 10000,
  showDatasetSummary = true,

  applyExposureOverrideFromSheet = true,
  hardCapDangerToTen = true,
  borderlineMode = "strict",
}) => {
  /* ===== 1) Muat ringkasan dataset & paparan suhu (opsional) ===== */
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [exposure, setExposure] = useState<{over10h:number; over20h:number; over30m:number; forceUnsafe:boolean} | null>(null);
  const [sumErr, setSumErr] = useState<string | null>(null);

  useEffect(() => {
    if (!webAppUrl) return;
    let mounted = true;
    const run = async () => {
      try {
        const rows = await fetchRecentRows(webAppUrl, Math.max(1, sampleSize));
        const s = summarizeDataset(rows, borderlineMode);
        const ex = computeExposureFlags(rows);
        if (mounted) { setSummary(s); setExposure(ex); setSumErr(null); }
      } catch (e: any) {
        if (mounted) { setSummary(null); setExposure(null); setSumErr(String(e?.message || e)); }
      }
    };
    run();
    const id = setInterval(run, Math.max(2000, refreshMs));
    return () => { mounted = false; clearInterval(id); };
  }, [webAppUrl, sampleSize, refreshMs, borderlineMode]);

  /* ===== 2) Status dari props (realtime) ===== */
  // status dari label (ikut mode borderline)
  const warnaStatus_label = useMemo(() => statusFromWarnaLabel(warna_ikan, borderlineMode), [warna_ikan, borderlineMode]);
  const gasStatus_label   = useMemo(() => statusFromGasLabel(status_gas, borderlineMode), [status_gas, borderlineMode]);
  // status dari nilai ambang Arduino
  const suhuStatus_val    = useMemo(() => statusFromSuhu(suhu_ikan), [suhu_ikan]);
  const gasStatus_val     = useMemo(() => statusFromGasValue(nilai_gas), [nilai_gas]);
  const rgbStatus_val     = useMemo(() => statusFromAvgRGB(avg_rgb), [avg_rgb]);

  // gabungan untuk tone kartu (ambil yang terburuk dari label vs nilai)
  const gasToneStatus   = useMemo(() => worst(gasStatus_label, gasStatus_val), [gasStatus_label, gasStatus_val]);
  const warnaToneStatus = useMemo(() => worst(warnaStatus_label, rgbStatus_val), [warnaStatus_label, rgbStatus_val]);

  /* ===== 3) Skor & safety override ===== */
  const healthScore = useMemo(() => {
    const s =
      scoreOfStatus(warnaStatus_label) * W.warnaLabel +
      scoreOfStatus(gasStatus_label)   * W.gasLabel   +
      scoreOfStatus(suhuStatus_val)    * W.suhu       +
      scoreOfStatus(gasStatus_val)     * W.gasValue   +
      scoreOfStatus(rgbStatus_val)     * W.avgRgb;
    return Math.max(0, Math.min(100, Math.round(s)));
  }, [warnaStatus_label, gasStatus_label, suhuStatus_val, gasStatus_val, rgbStatus_val]);

  // paksa unsafe jika ada indikator danger atau paparan suhu parah dari deret
  const forcedUnsafe = useMemo(() => {
    const dangerFromValues = [suhuStatus_val, gasStatus_val, rgbStatus_val].some(s => s === "danger");
    const dangerFromLabels = (borderlineMode === "strict") && [gasStatus_label, warnaStatus_label].some(s => s === "danger");
    const expUnsafe = applyExposureOverrideFromSheet && (exposure?.forceUnsafe ?? false);
    return dangerFromValues || dangerFromLabels || expUnsafe;
  }, [suhuStatus_val, gasStatus_val, rgbStatus_val, gasStatus_label, warnaStatus_label, applyExposureOverrideFromSheet, exposure, borderlineMode]);

  // tampilkan skor: bisa di-hardcap ke 10% saat unsafe
  const displayScore = forcedUnsafe
    ? (hardCapDangerToTen ? 10 : Math.min(healthScore, 49))
    : healthScore;

  // verdict akhir
  const isSafeToEat    = !forcedUnsafe && displayScore >= 85;
  const reheatOnly     = !forcedUnsafe && displayScore >= 70 && displayScore < 85;
  const notRecommended = !forcedUnsafe && displayScore >= 50 && displayScore < 70;
  const isUnsafe       = forcedUnsafe || displayScore < 50;

  const StatusIcon = isUnsafe ? XCircle : isSafeToEat ? CheckCircle : AlertCircle;

  const consumptionMessage =
    isUnsafe
      ? `${fishName} TIDAK LAYAK konsumsi.`
      : reheatOnly
      ? `${fishName} DAPAT dikonsumsi setelah dipanaskan hingga matang.`
      : notRecommended
      ? `${fishName} TIDAK DIREKOMENDASIKAN untuk dikonsumsi.`
      : `${fishName} AMAN untuk dikonsumsi.`;

  const actionTips =
    isUnsafe
      ? "Tanda kerusakan kuat (bau tajam/lendir/warna ekstrem/suhu tinggi lama). Buang produk."
      : reheatOnly
      ? "Panaskan hingga inti >70°C. Jika tercium menyengat/asam, jangan konsumsi."
      : notRecommended
      ? "Ada tanda penurunan mutu. Demi keamanan, sebaiknya jangan dikonsumsi."
      : "Simpan 0–4°C. Konsumsi 24–48 jam.";

  const progressColor =
    isUnsafe ? "from-red-600 to-red-800"
    : (reheatOnly || notRecommended) ? "from-orange-300 to-orange-500"
    : "from-green-300 to-green-500";

  const verdictBadge =
    isUnsafe ? "bg-red-50 text-red-800 border-red-300"
    : (notRecommended || reheatOnly) ? "bg-orange-50 text-orange-800 border-orange-300"
    : "bg-green-50 text-green-800 border-green-300";

  // Label status untuk kartu
  const suhuStatusLabel =
    suhuStatus_val === "good" ? "Dingin ideal"
    : suhuStatus_val === "warning" ? "Hangat (perlu hati-hati)"
    : "Suhu (tidak aman)";
  const warnaStatusLabel = (warna_ikan ?? "").trim() || "—";
  const gasStatusLabel   = (status_gas ?? "").trim() || "—";

  const cards = [
    { title: "Status Suhu",              label: suhuStatusLabel, tone: toTone(suhuStatus_val),   icon: Thermometer, hint: "Pembacaan suhu terkini dari sensor" },
    { title: `Status Warna ${fishName}`, label: warnaStatusLabel, tone: toTone(warnaToneStatus), icon: Palette,     hint: "Gabungan label & AvgRGB" },
    { title: "Status Gas",               label: gasStatusLabel,   tone: toTone(gasToneStatus),   icon: Flame,       hint: "Gabungan label & nilai gas" },
  ] as const;

  /* ===== 4) Panel Ringkasan dari Spreadsheet ===== */
  const DatasetSummaryPanel = () => {
    if (!showDatasetSummary || !webAppUrl) return null;
    return (
      <div className="mt-6 rounded-xl border bg-white/70 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-slate-700">Ringkasan dataset dari spreadsheet</div>
          <div className="text-xs text-slate-500">
            {summary ? `n=${summary.total}` : sumErr ? "gagal memuat" : "memuat..."}
          </div>
        </div>
        {summary ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <BadgeStat label="AMAN" value={`${summary.percents.AMAN}%`} tone="ok" />
              <BadgeStat label="Perlu Dipanaskan" value={`${summary.percents["PERLU DIPANASKAN"]}%`} tone="warn" />
              <BadgeStat label="Tidak Direkomendasikan" value={`${summary.percents["TIDAK DIREKOMENDASIKAN"]}%`} tone="warn" />
              <BadgeStat label="Tidak Layak" value={`${summary.percents["TIDAK LAYAK"]}%`} tone="danger" />
            </div>
            <div className="mt-2 text-xs text-slate-600">
              <span className="mr-3"><strong>LAYAK (langsung):</strong> {summary.layak_langsung_pct.toFixed(2)}%</span>
              <span className="mr-3"><strong>LAYAK (+panas):</strong> {summary.layak_plus_panas_pct.toFixed(2)}%</span>
              <span className="mr-3"><strong>TIDAK LAYAK (ketat):</strong> {summary.tidak_layak_ketat_pct.toFixed(2)}%</span>
              <span><strong>TIDAK LAYAK (konservatif):</strong> {summary.tidak_layak_konservatif_pct.toFixed(2)}%</span>
            </div>
            {applyExposureOverrideFromSheet && exposure && (
              <div className="mt-3 text-xs text-slate-600">
                <strong>Paparan suhu kumulatif</strong> — {exposure.over10h.toFixed(2)} jam &gt;10°C, {exposure.over20h.toFixed(2)} jam &gt;20°C, {Math.round(exposure.over30m)} menit &gt;30°C.{" "}
                {exposure.forceUnsafe ? <span className="text-red-700 font-semibold">Override: TIDAK LAYAK.</span> : <span>OK.</span>}
              </div>
            )}
          </>
        ) : sumErr ? (
          <div className="text-xs text-red-700">{sumErr}</div>
        ) : (
          <div className="h-6 bg-slate-100 animate-pulse rounded" />
        )}
      </div>
    );
  };

  /* ===== 5) Render ===== */
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50 overflow-hidden"
    >
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 35%, #7DD3FC 70%, #38BDF8 100%)" }}
      />

      {/* Header skor & legend */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelayakan Konsumsi ({fishName})</h2>
          <p className="text-sm text-slate-600">Pantau indikator utama secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
            <LegendDot tone="ok" /> Normal <LegendDot tone="warn" /> Waspada <LegendDot tone="danger" /> Bahaya
          </div>
          <div className="h-8 w-px bg-slate-300/60 hidden md:block" />
          <div className="flex items-center gap-2">
            <StatusIcon
              role="img"
              aria-label={isUnsafe ? "Bahaya" : isSafeToEat ? "Aman" : "Waspada"}
              className={`w-5 h-5 ${isUnsafe ? "text-red-700" : isSafeToEat ? "text-green-600" : "text-orange-600"}`}
            />
            <span className="text-xl font-bold text-gray-900">{displayScore}%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden mb-5 shadow-inner">
        <motion.div
          initial={animate ? { width: 0 } : false}
          animate={animate ? { width: `${displayScore}%` } : undefined}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${progressColor} rounded-full`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayScore}
        />
      </div>

      {/* VERDICT */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${verdictBadge} mb-6`}>
        <span className="text-sm font-semibold">{consumptionMessage}</span>
      </div>

      {/* STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={animate ? { y: 8, opacity: 0 } : false}
            animate={animate ? { y: 0, opacity: 1 } : undefined}
            transition={{ duration: 0.35, delay: i * 0.05 }}
          >
            <Card tone={c.tone} title={c.title} label={c.label} Icon={c.icon} hint={c.hint} />
          </motion.div>
        ))}
      </div>

      {/* Peringatan & saran */}
      <motion.div
        initial={animate ? { opacity: 0 } : false}
        animate={animate ? { opacity: 1 } : undefined}
        transition={{ delay: 0.2 }}
        className={`mt-6 p-4 rounded-xl border-l-4 ${
          isUnsafe
            ? "bg-red-50/90 border-l-red-700 text-red-800"
            : (notRecommended || reheatOnly)
            ? "bg-orange-50/90 border-l-orange-600 text-orange-800"
            : "bg-green-50/90 border-l-green-600 text-green-800"
        }`}
        aria-live="polite"
      >
        <p className="font-semibold mb-1">{consumptionMessage}</p>
        <p className="text-sm opacity-90">{actionTips}</p>
      </motion.div>

      {/* Ringkasan dataset dari spreadsheet */}
      <DatasetSummaryPanel />
    </motion.div>
  );
};

export default HealthStatus;

/* ===== Small stat badge (hoisted) ===== */
function BadgeStat({ label, value, tone }: { label: string; value: string | number; tone: "ok" | "warn" | "danger" }) {
  const t = getToneStyles(tone);
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1 ${t.border}`}>
      <span className="text-xs text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${tone==="ok"?"text-green-700":tone==="warn"?"text-orange-700":"text-red-700"}`}>{value}</span>
    </div>
  );
}
