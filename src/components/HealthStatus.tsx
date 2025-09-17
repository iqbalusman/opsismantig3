// src/components/HealthStatus.tsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, XCircle, Thermometer, Palette, Flame, Info } from "lucide-react";

type Tone = "ok" | "danger" | "neutral";
type LabelSimple = "Segar" | "Tidak Segar";

type Props = {
  avg_rgb?: number | null;
  nilai_gas?: number | null;
  suhu_ikan?: number | null; // monitoring only
  fishName?: string;
  animate?: boolean;
};

/* --- Ambang baru --- */
const GAS_THRESHOLD = 1500;
const AVG_THRESHOLD = 250;
const TEMP_COLD_MAX = 4;
const TEMP_HOT_MIN  = 30;

/* --- Klasifikasi sederhana --- */
function classifyAvg(avg?: number | null): { label: LabelSimple; tone: Tone; score: number; desc: string } {
  if (!Number.isFinite(avg as number)) return { label: "Tidak Segar", tone: "danger", score: 0, desc: "Data AVG tidak tersedia" };
  const x = avg as number;
  if (x > AVG_THRESHOLD) {
    return { label: "Segar", tone: "ok", score: 100, desc: "AVG di atas 250 → Segar" };
  }
  return { label: "Tidak Segar", tone: "danger", score: 0, desc: "AVG ≤250 → Tidak Segar" };
}

function classifyGas(gas?: number | null): { label: LabelSimple; tone: Tone; score: number; desc: string } {
  if (!Number.isFinite(gas as number)) return { label: "Tidak Segar", tone: "danger", score: 0, desc: "Data GAS tidak tersedia" };
  const x = gas as number;
  if (x <= GAS_THRESHOLD) {
    return { label: "Segar", tone: "ok", score: 100, desc: "GAS ≤1500 → Segar" };
  }
  return { label: "Tidak Segar", tone: "danger", score: 0, desc: "GAS >1500 → Tidak Segar" };
}

/* --- Suhu (netral) --- */
function temperatureDisplay(v?: number | null): { tone: Tone; label: string } {
  if (!Number.isFinite(v as number)) return { tone: "neutral", label: "Netral" };
  const x = v as number;
  if (x <= TEMP_COLD_MAX) return { tone: "ok", label: "Dingin (ideal)" };
  if (x >= TEMP_HOT_MIN)  return { tone: "danger", label: "Panas (tinggi)" };
  return { tone: "neutral", label: "Netral" };
}

/* --- UI helpers --- */
function getToneStyles(tone: Tone) {
  switch (tone) {
    case "ok": return { border:"border-green-200/60", iconWrap:"bg-green-50/80 border-green-200 ring-green-200/40",
      icon:"text-green-600", accentBar:"bg-gradient-to-r from-green-300 to-green-400",
      badge:"bg-green-50 border-green-200 text-green-700", dot:"bg-green-500", glow:"bg-green-300/30" } as const;
    case "danger": return { border:"border-red-300/60", iconWrap:"bg-red-50/80 border-red-200 ring-red-200/40",
      icon:"text-red-700", accentBar:"bg-gradient-to-r from-red-400 to-red-500",
      badge:"bg-red-50 border-red-200 text-red-700", dot:"bg-red-600", glow:"bg-red-300/30" } as const;
    default: return { border:"border-slate-200/70", iconWrap:"bg-slate-50/80 border-slate-200 ring-slate-200/50",
      icon:"text-slate-600", accentBar:"bg-gradient-to-r from-slate-200 to-slate-300",
      badge:"bg-slate-50 border-slate-200 text-slate-700", dot:"bg-slate-400", glow:"bg-slate-200/40" } as const;
  }
}

function StatusBadge({ tone, labelOverride }: { tone: Tone; labelOverride?: string }) {
  const t = getToneStyles(tone);
  const text = labelOverride ?? (tone==="ok"?"Segar":"Tidak Segar");
  return (
    <span className={["inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", t.badge].join(" ")}>
      <span className={["h-1.5 w-1.5 rounded-full", t.dot].join(" ")} />{text}
    </span>
  );
}

function Card({ tone, title, label, Icon, hint }:{
  tone: Tone; title: string; label: string; Icon: React.ComponentType<{className?:string}>; hint?: string;
}) {
  const t = getToneStyles(tone);
  return (
    <div className={["group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm","transition-colors duration-300",t.border].join(" ")}>
      <div aria-hidden className={["absolute inset-x-0 top-0 h-1", t.accentBar].join(" ")} />
      <div className="flex items-start gap-3">
        <div className={["inline-flex h-10 w-10 items-center justify-center rounded-xl border","shadow-sm ring-1 ring-inset",t.iconWrap].join(" ")}>
          <Icon className={["h-5 w-5", t.icon].join(" ")} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-500">{title}</div>
            {hint && <Info className="h-3.5 w-3.5 text-slate-400" aria-label={hint} />}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <div className="text-lg font-semibold tracking-tight text-slate-800">{label}</div>
            <StatusBadge tone={tone} labelOverride={label} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Component --- */
const HealthStatus: React.FC<Props> = ({ avg_rgb=null, nilai_gas=null, suhu_ikan=null, fishName="Ikan Fufu", animate=true }) => {
  const avgClass = useMemo(() => classifyAvg(avg_rgb), [avg_rgb]);
  const gasClass = useMemo(() => classifyGas(nilai_gas), [nilai_gas]);
  const suhuDisp = useMemo(() => temperatureDisplay(suhu_ikan), [suhu_ikan]);

  // Tentukan yang terburuk sebagai indikator keselamatan
  const worst = avgClass.label === "Tidak Segar" || gasClass.label === "Tidak Segar" ? "Tidak Segar" : "Segar";
  const isSafe = worst === "Segar";
  const isUnsafe = worst === "Tidak Segar";
  const StatusIcon = isUnsafe ? XCircle : CheckCircle;
  const consumptionMessage = isUnsafe ? `${fishName} TIDAK DIREKOMENDASIKAN untuk dikonsumsi.` : `${fishName} AMAN untuk dikonsumsi.`;

  const score = isSafe ? 100 : 0;

  const cards = [
    { title:"Status AVG", label: avgClass.label, tone: avgClass.tone as Tone, icon: Palette, hint:"AVG >250 Segar, ≤250 Tidak Segar" },
    { title:"Status GAS", label: gasClass.label, tone: gasClass.tone as Tone, icon: Flame, hint:"GAS ≤1500 Segar, >1500 Tidak Segar" },
    { title:"Suhu (monitoring)", label: suhuDisp.label, tone: suhuDisp.tone, icon: Thermometer, hint:"Suhu hanya monitoring" },
  ] as const;

  return (
    <motion.div initial={animate?{opacity:0,y:20}:false} animate={animate?{opacity:1,y:0}:undefined}
      className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50 overflow-hidden">
      
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelayakan Konsumsi ({fishName})</h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${isUnsafe?"text-red-700":"text-green-600"}`} />
          <span className="text-xl font-bold text-gray-900">{score}%</span>
        </div>
      </div>

      <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden mb-5 shadow-inner">
        <motion.div initial={animate?{width:0}:false} animate={animate?{width:`${score}%`}:undefined}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${isSafe?"bg-green-400":"bg-red-500"} rounded-full`} />
      </div>

      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${isUnsafe?"bg-red-50 text-red-700 border-red-300":"bg-green-50 text-green-700 border-green-300"} mb-6`}>
        <span className="text-sm font-semibold">{consumptionMessage}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.title} tone={c.tone} title={c.title} label={c.label} Icon={c.icon} hint={c.hint} />
        ))}
      </div>
    </motion.div>
  );
};

export default HealthStatus;
