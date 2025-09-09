// src/components/HealthStatus.tsx
// FINAL — 4 level + persentase halus & sensitif (AVG & GAS saja; suhu netral)
//
// Ambang status:
//  AVG: 0–250 Segar, 250–400 Kurang, 400–450 Tidak Segar, >450 Tidak Layak
//  GAS: 0–2500 Segar, 2500–3500 Kurang, 3500–4000 Tidak Segar, >4000 Tidak Layak
//
// Persentase:
//  - Skor kontinu per metrik (piecewise-linear) 0..100
//  - Digabung pakai soft-min (condong ke yang terburuk) dengan α=0.40
//  - Ditampilkan 1 desimal
// Suhu: NETRAL by default; hanya Dingin (≤4°C) / Panas (≥30°C)

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, XCircle, Thermometer, Palette, Flame, Info } from "lucide-react";

type Tone = "ok" | "warn" | "danger" | "neutral";
type Label4 = "Segar" | "Kurang Segar" | "Tidak Segar" | "Tidak Layak";

type Props = {
  avg_rgb?: number | null;
  nilai_gas?: number | null;
  suhu_ikan?: number | null; // monitoring only
  fishName?: string;
  animate?: boolean;
};

/* --- Ambang --- */
const AVG_GOOD_MAX = 250;
const AVG_WARN_MAX = 400;
const AVG_BAD_MAX  = 450;

const GAS_GOOD_MAX = 2500;
const GAS_WARN_MAX = 3500;
const GAS_BAD_MAX  = 4000;

const AVG_CAP_DANGER = 700;   // >700 → skor ~0
const GAS_CAP_DANGER = 6000;  // >6000 → skor ~0

const SOFT_MIN_ALPHA = 0.40;  // sensitif & tetap konservatif
const SCORE_DECIMALS = 1;     // tampil 1 desimal

const TEMP_COLD_MAX = 4;      // suhu monitoring
const TEMP_HOT_MIN  = 30;

const DEBUG = false;           // nyalakan agar terlihat di Console

/* --- Util skor kontinu --- */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function scoreFromAvg(avg?: number | null): number {
  if (!Number.isFinite(avg as number)) return 60;
  const x = avg as number;
  if (x <= AVG_GOOD_MAX) { const t = clamp01(x / AVG_GOOD_MAX); return lerp(100, 88, t); }
  if (x <= AVG_WARN_MAX) { const t = clamp01((x-AVG_GOOD_MAX)/(AVG_WARN_MAX-AVG_GOOD_MAX)); return lerp(88, 65, t); }
  if (x <= AVG_BAD_MAX)  { const t = clamp01((x-AVG_WARN_MAX)/(AVG_BAD_MAX-AVG_WARN_MAX));   return lerp(65, 35, t); }
  const t = clamp01((x-AVG_BAD_MAX)/(AVG_CAP_DANGER-AVG_BAD_MAX)); return lerp(35, 0, t);
}
function scoreFromGas(gas?: number | null): number {
  if (!Number.isFinite(gas as number)) return 60;
  const x = gas as number;
  if (x <= GAS_GOOD_MAX) { const t = clamp01(x / GAS_GOOD_MAX); return lerp(100, 88, t); }
  if (x <= GAS_WARN_MAX) { const t = clamp01((x-GAS_GOOD_MAX)/(GAS_WARN_MAX-GAS_GOOD_MAX)); return lerp(88, 65, t); }
  if (x <= GAS_BAD_MAX)  { const t = clamp01((x-GAS_WARN_MAX)/(GAS_BAD_MAX-GAS_WARN_MAX));   return lerp(65, 35, t); }
  const t = clamp01((x-GAS_BAD_MAX)/(GAS_CAP_DANGER-GAS_BAD_MAX)); return lerp(35, 0, t);
}
function softMin(a: number, b: number, alpha = SOFT_MIN_ALPHA): number {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  return lo + alpha * (hi - lo);
}

/* --- Klasifikasi 4 level --- */
function classifyAvg(avg?: number | null): { label: Label4; tone: Tone; score: number } {
  const score = scoreFromAvg(avg);
  if (!Number.isFinite(avg as number)) return { label: "Kurang Segar", tone: "warn", score };
  const x = avg as number;
  if (x <= AVG_GOOD_MAX) return { label: "Segar",        tone: "ok",     score };
  if (x <= AVG_WARN_MAX) return { label: "Kurang Segar", tone: "warn",   score };
  if (x <= AVG_BAD_MAX)  return { label: "Tidak Segar",  tone: "danger", score };
  return { label: "Tidak Layak", tone: "danger", score };
}
function classifyGas(gas?: number | null): { label: Label4; tone: Tone; score: number } {
  const score = scoreFromGas(gas);
  if (!Number.isFinite(gas as number)) return { label: "Kurang Segar", tone: "warn", score };
  const x = gas as number;
  if (x <= GAS_GOOD_MAX) return { label: "Segar",        tone: "ok",     score };
  if (x <= GAS_WARN_MAX) return { label: "Kurang Segar", tone: "warn",   score };
  if (x <= GAS_BAD_MAX)  return { label: "Tidak Segar",  tone: "danger", score };
  return { label: "Tidak Layak", tone: "danger", score };
}

/* --- Suhu (netral) --- */
function temperatureDisplay(v?: number | null): { tone: Tone; label: string } {
  if (!Number.isFinite(v as number)) return { tone: "neutral", label: "Netral" };
  const x = v as number;
  if (x <= TEMP_COLD_MAX) return { tone: "ok",     label: "Dingin (ideal)" };
  if (x >= TEMP_HOT_MIN)  return { tone: "danger", label: "Panas (tinggi)" };
  return { tone: "neutral", label: "Netral" };
}

/* --- UI helpers --- */
function getToneStyles(tone: Tone) {
  switch (tone) {
    case "ok":
      return { border:"border-green-200/60", iconWrap:"bg-green-50/80 border-green-200 ring-green-200/40",
        icon:"text-green-600", accentBar:"bg-gradient-to-r from-green-300 to-green-400",
        badge:"bg-green-50 border-green-200 text-green-700", dot:"bg-green-500", glow:"bg-green-300/30" } as const;
    case "warn":
      return { border:"border-orange-200/60", iconWrap:"bg-orange-50/80 border-orange-200 ring-orange-200/40",
        icon:"text-orange-600", accentBar:"bg-gradient-to-r from-orange-300 to-orange-400",
        badge:"bg-orange-50 border-orange-200 text-orange-700", dot:"bg-orange-500", glow:"bg-orange-300/30" } as const;
    case "danger":
      return { border:"border-red-300/60", iconWrap:"bg-red-50/80 border-red-200 ring-red-200/40",
        icon:"text-red-700", accentBar:"bg-gradient-to-r from-red-400 to-red-500",
        badge:"bg-red-50 border-red-200 text-red-700", dot:"bg-red-600", glow:"bg-red-300/30" } as const;
    default:
      return { border:"border-slate-200/70", iconWrap:"bg-slate-50/80 border-slate-200 ring-slate-200/50",
        icon:"text-slate-600", accentBar:"bg-gradient-to-r from-slate-200 to-slate-300",
        badge:"bg-slate-50 border-slate-200 text-slate-700", dot:"bg-slate-400", glow:"bg-slate-200/40" } as const;
  }
}
function StatusBadge({ tone, labelOverride }: { tone: Tone; labelOverride?: string }) {
  const t = getToneStyles(tone);
  const text = labelOverride ?? (tone==="ok"?"Segar":tone==="warn"?"Kurang Segar":tone==="danger"?"Tidak Segar":"Netral");
  return (
    <span className={["inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", t.badge].join(" ")}>
      <span className={["h-1.5 w-1.5 rounded-full", t.dot].join(" ")} />{text}
    </span>
  );
}
function LegendDot({ tone }: { tone: Tone }) {
  const t = getToneStyles(tone);
  return <span className={["h-2 w-2 rounded-full inline-block", t.dot].join(" ")} />;
}
function Card({ tone, title, label, Icon, hint, badgeText }:{
  tone: Tone; title: string; label: string; Icon: React.ComponentType<{className?:string}>; hint?: string; badgeText?: string;
}) {
  const t = getToneStyles(tone);
  return (
    <div className={["group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm","transition-colors duration-300",t.border].join(" ")}>
      <div aria-hidden className={["absolute inset-x-0 top-0 h-1", t.accentBar].join(" ")} />
      <div className="flex items-start gap-3">
        <div className={["inline-flex h-10 w-10 items-center justify-center rounded-xl border","shadow-sm ring-1 ring-inset",t.iconWrap].join(" ")}><Icon className={["h-5 w-5", t.icon].join(" ")} /></div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-500">{title}</div>
            {hint && <Info className="h-3.5 w-3.5 text-slate-400" aria-label={hint} />}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <div className="text-lg font-semibold tracking-tight text-slate-800">{label}</div>
            <StatusBadge tone={tone} labelOverride={badgeText} />
          </div>
        </div>
      </div>
      <div aria-hidden className={["pointer-events-none absolute -bottom-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-2xl opacity-0","transition-opacity duration-300 group-hover:opacity-60",t.glow].join(" ")} />
    </div>
  );
}

/* --- Component --- */
const HealthStatus: React.FC<Props> = ({ avg_rgb=null, nilai_gas=null, suhu_ikan=null, fishName="Ikan Fufu", animate=true }) => {
  const avgClass = useMemo(() => classifyAvg(avg_rgb), [avg_rgb]);
  const gasClass = useMemo(() => classifyGas(nilai_gas), [nilai_gas]);
  const suhuDisp = useMemo(() => temperatureDisplay(suhu_ikan), [suhu_ikan]);

  const scorePrecise = useMemo(() => softMin(avgClass.score, gasClass.score), [avgClass.score, gasClass.score]);
  const scoreDisplay = useMemo(() => scorePrecise.toFixed(SCORE_DECIMALS), [scorePrecise]);

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[HealthStatus]", { avg_rgb, nilai_gas, scoreAvg: avgClass.score, scoreGas: gasClass.score, final: scorePrecise });
  }

  const sev: Record<Label4, number> = { "Segar":0, "Kurang Segar":1, "Tidak Segar":2, "Tidak Layak":3 };
  const worst = sev[avgClass.label] >= sev[gasClass.label] ? avgClass.label : gasClass.label;

  const isUnsafe = worst === "Tidak Layak";
  const notRecommended = worst === "Tidak Segar";
  const reheatOnly = worst === "Kurang Segar";
  const isSafe = worst === "Segar";

  const StatusIcon = isUnsafe ? XCircle : isSafe ? CheckCircle : AlertCircle;
  const consumptionMessage =
    isUnsafe ? `${fishName} TIDAK LAYAK dikonsumsi.` :
    notRecommended ? `${fishName} TIDAK DIREKOMENDASIKAN untuk dikonsumsi.` :
    reheatOnly ? `${fishName} PERLU DIPANASKAN hingga matang.` :
    `${fishName} AMAN untuk dikonsumsi.`;

  const progressColor =
    isUnsafe ? "from-red-700 to-red-900" :
    notRecommended ? "from-red-500 to-red-700" :
    reheatOnly ? "from-orange-300 to-orange-500" :
    "from-green-300 to-green-500";

  const verdictBadge =
    isUnsafe ? "bg-red-50 text-red-800 border-red-300" :
    notRecommended ? "bg-red-50 text-red-700 border-red-300" :
    reheatOnly ? "bg-orange-50 text-orange-800 border-orange-300" :
    "bg-green-50 text-green-800 border-green-300";

  const cards = [
    { title:"Status AVG", label: avgClass.label, tone: avgClass.tone as Tone, icon: Palette,
      hint:"0–250 Segar · 250–400 Kurang · 400–450 Tidak Segar · >450 Tidak Layak", badgeText: avgClass.label },
    { title:"Status GAS", label: gasClass.label, tone: gasClass.tone as Tone, icon: Flame,
      hint:"0–2500 Segar · 2500–3500 Kurang · 3500–4000 Tidak Segar · >4000 Tidak Layak", badgeText: gasClass.label },
    { title:"Suhu (monitoring)", label: suhuDisp.label, tone: suhuDisp.tone, icon: Thermometer,
      hint:"Tidak mempengaruhi persentase", badgeText: suhuDisp.label },
  ] as const;

  return (
    <motion.div initial={animate?{opacity:0,y:20}:false} animate={animate?{opacity:1,y:0}:undefined}
      className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 35%, #7DD3FC 70%, #38BDF8 100%)" }} />
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelayakan Konsumsi ({fishName})</h2>
          <p className="text-sm text-slate-600">Persentase halus dari AVG & GAS (soft-min). Suhu hanya monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
            <LegendDot tone="ok" /> Segar <LegendDot tone="warn" /> Kurang <LegendDot tone="danger" /> Tidak
          </div>
          <div className="h-8 w-px bg-slate-300/60 hidden md:block" />
          <div className="flex items-center gap-2">
            <StatusIcon role="img" aria-label={isUnsafe?"Tidak Layak":notRecommended?"Tidak Segar":reheatOnly?"Kurang Segar":"Segar"}
              className={`w-5 h-5 ${isUnsafe?"text-red-800":notRecommended?"text-red-700":reheatOnly?"text-orange-600":"text-green-600"}`} />
            <span className="text-xl font-bold text-gray-900">{scoreDisplay}%</span>
          </div>
        </div>
      </div>

      <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden mb-5 shadow-inner">
        <motion.div initial={animate?{width:0}:false} animate={animate?{width:`${scorePrecise}%`}:undefined}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${progressColor} rounded-full`}
          role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(scoreDisplay)} />
      </div>

      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${verdictBadge} mb-6`}>
        <span className="text-sm font-semibold">{consumptionMessage}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.title} initial={animate?{y:8,opacity:0}:false}
            animate={animate?{y:0,opacity:1}:undefined} transition={{ duration: 0.35, delay: i*0.05 }}>
            <Card tone={c.tone} title={c.title} label={c.label} Icon={c.icon} hint={c.hint} badgeText={c.badgeText} />
          </motion.div>
        ))}
      </div>

      <motion.div initial={animate?{opacity:0}:false} animate={animate?{opacity:1}:undefined} transition={{ delay: 0.2 }}
        className={`mt-6 p-4 rounded-xl border-l-4 ${
          worst==="Tidak Layak" ? "bg-red-50/90 border-l-red-700 text-red-800"
          : worst==="Tidak Segar" ? "bg-red-50/90 border-l-red-600 text-red-700"
          : worst==="Kurang Segar" ? "bg-orange-50/90 border-l-orange-600 text-orange-800"
          : "bg-green-50/90 border-l-green-600 text-green-800"
        }`} aria-live="polite">
        <p className="font-semibold mb-1">{consumptionMessage}</p>
        <p className="text-sm opacity-90">
          {worst==="Tidak Layak" ? "Indikator sangat buruk. Buang produk sesuai prosedur."
          : worst==="Tidak Segar" ? "Kualitas turun. Demi keamanan, sebaiknya tidak dikonsumsi."
          : worst==="Kurang Segar" ? "Panaskan hingga inti >70°C. Jika beraroma menyengat/asam, jangan dikonsumsi."
          : "Simpan pada 0–4°C. Konsumsi 24–48 jam."}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default HealthStatus;
