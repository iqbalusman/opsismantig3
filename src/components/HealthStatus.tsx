// src/components/HealthStatus.tsx
// FINAL — 4 level + persentase halus & sensitif (AVG & GAS saja; suhu netral)
//
// PERUBAHAN (AVG):
//  • 500–730 = SEGAR dengan titik tengah 620.
//    - ≤620  → "Segar — Lebih Cerah" (ideal untuk segera dihidangkan; tekstur lebih lembut)
//    - >620  → "Segar — Lebih Gelap" (cocok untuk ekspor/retensi; tekstur lebih padat)
//  • 400–500 → KURANG SEGAR
//  • ≤400    → TIDAK SEGAR
//  • 730–800 → KURANG SEGAR
//  • ≥800    → TIDAK SEGAR
//
// CATATAN: GAS tetap mengikuti ambang sebelumnya. Skor persentase tetap soft-min antara AVG & GAS.
// Suhu hanya monitoring (Netral kecuali Dingin ≤4°C, Panas ≥30°C).

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
// GAS (tidak berubah)
const GAS_GOOD_MAX = 2500;
const GAS_WARN_MAX = 3500;
const GAS_BAD_MAX  = 4000;

// AVG (baru)
const AVG_FRESH_MIN   = 500;  // segar mulai
const AVG_FRESH_PIVOT = 620;  // titik tengah cerah/gelap
const AVG_FRESH_MAX   = 730;  // segar berakhir
const AVG_LOW_BAD_MAX = 400;  // ≤400 tidak segar
const AVG_LOW_WARN_MAX = 500; // 400–500 kurang segar
const AVG_HIGH_WARN_MIN = 730; // 730–800 kurang segar
const AVG_HIGH_BAD_MIN  = 800; // ≥800 tidak segar

// Batas "lenyap" skor untuk ekor ekstrem (semakin jauh → skor → 0)
const AVG_CAP_DANGER = 1100;
const GAS_CAP_DANGER = 6000;

const SOFT_MIN_ALPHA = 0.40;  // sensitif & tetap konservatif
const SCORE_DECIMALS = 1;     // tampil 1 desimal

const TEMP_COLD_MAX = 4;      // suhu monitoring
const TEMP_HOT_MIN  = 30;

const DEBUG = false;           // nyalakan agar terlihat di Console

/* --- Util skor kontinu --- */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Skor AVG baru — puncak di sekitar 620 (lebih cerah → naik; lebih gelap → sedikit turun namun masih segar)
function scoreFromAvg(avg?: number | null): number {
  if (!Number.isFinite(avg as number)) return 60;
  const x = avg as number;
  if (x <= AVG_LOW_BAD_MAX) {
    // 0..400 → 0..35
    const t = clamp01(x / AVG_LOW_BAD_MAX);
    return lerp(0, 35, t);
  }
  if (x < AVG_LOW_WARN_MAX) {
    // 400..500 → 35..65
    const t = clamp01((x - AVG_LOW_BAD_MAX) / (AVG_LOW_WARN_MAX - AVG_LOW_BAD_MAX));
    return lerp(35, 65, t);
  }
  if (x <= AVG_FRESH_PIVOT) {
    // 500..620 (Segar — Lebih Cerah) → 65..100
    const t = clamp01((x - AVG_FRESH_MIN) / (AVG_FRESH_PIVOT - AVG_FRESH_MIN));
    return lerp(65, 100, t);
  }
  if (x <= AVG_FRESH_MAX) {
    // 620..730 (Segar — Lebih Gelap) → 100..88 (sedikit menurun tetapi tetap segar)
    const t = clamp01((x - AVG_FRESH_PIVOT) / (AVG_FRESH_MAX - AVG_FRESH_PIVOT));
    return lerp(100, 88, t);
  }
  if (x <= AVG_HIGH_BAD_MIN) {
    // 730..800 (Kurang Segar) → 88..55
    const t = clamp01((x - AVG_HIGH_WARN_MIN) / (AVG_HIGH_BAD_MIN - AVG_HIGH_WARN_MIN));
    return lerp(88, 55, t);
  }
  // ≥800..1100 → 55..0
  const capped = Math.min(x, AVG_CAP_DANGER);
  const t = clamp01((capped - AVG_HIGH_BAD_MIN) / (AVG_CAP_DANGER - AVG_HIGH_BAD_MIN));
  return lerp(55, 0, t);
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

/* --- Klasifikasi 4 level (AVG baru) --- */
function classifyAvg(avg?: number | null): { label: Label4; tone: Tone; score: number; variant?: "cerah" | "gelap"; desc: string } {
  const score = scoreFromAvg(avg);
  if (!Number.isFinite(avg as number)) return { label: "Kurang Segar", tone: "warn", score, desc: "Data AVG tidak tersedia. Gunakan indikator lain (GAS/sensori) dan simpan pada 0–4°C." };
  const x = avg as number;

  // Urutan cek dibuat agar 500–730 tetap SEGAR (prioritas terhadap overlap 720–730)
  if (x <= AVG_LOW_BAD_MAX) {
    return {
      label: "Tidak Segar",
      tone: "danger",
      score,
      desc: "Warna terlalu pucat/memudar (≤400). Indikasi degradasi tinggi: bau asam/amonia, lendir berlebih, tekstur rapuh. Sebaiknya tidak dikonsumsi; buang sesuai prosedur higienis.",
    };
  }
  if (x < AVG_LOW_WARN_MAX) {
    return {
      label: "Kurang Segar",
      tone: "warn",
      score,
      desc: "Zona 400–500: kilau menurun dan elastisitas daging mulai berkurang. Wajib dimasak matang (inti ≥70°C). Lebih cocok untuk olahan berbumbu kuat (kari, sambal, abon). Jika bau menyengat/asam → jangan dikonsumsi.",
    };
  }
  if (x >= AVG_FRESH_MIN && x <= AVG_FRESH_MAX) {
    if (x <= AVG_FRESH_PIVOT) {
      return {
        label: "Segar",
        tone: "ok",
        score,
        variant: "cerah",
        desc: "Segar — lebih cerah (500–620). Ideal untuk segera dihidangkan setelah dimasak sederhana (kukus/panggang/saus ringan). Tekstur lebih lembut dan juicy, rasa bersih, oksidasi rendah. Simpan 0–4°C dan konsumsi ≤24–48 jam.",
      };
    }
    return {
      label: "Segar",
      tone: "ok",
      score,
      variant: "gelap",
      desc: "Segar — lebih gelap (>620 hingga 730). Cocok untuk pengiriman jarak jauh/ekspor: pigmen relatif stabil, kadar air cenderung lebih rendah sehingga tekstur lebih padat. Tahan lebih lama di rantai dingin. Cocok untuk marinasi/asap/goreng garing; butuh waktu masak sedikit lebih lama agar empuk.",
    };
  }
  if (x < AVG_HIGH_BAD_MIN) {
    // 730..800 (kurang segar)
    return {
      label: "Kurang Segar",
      tone: "warn",
      score,
      desc: "Zona 730–800: warna mulai terlalu gelap. Potensi oksidasi/aftertaste meningkat. Masih dapat diolah panas hingga matang sempurna; lebih cocok untuk pengasapan/pengeringan dibanding menu segar premium.",
    };
  }
  // ≥800
  return {
    label: "Tidak Segar",
    tone: "danger",
    score,
    desc: "≥800: terlalu gelap, indikasi oksidasi lanjut. Risiko off-flavour (pahit/metallic) dan penurunan kualitas tekstur. Tidak disarankan untuk konsumsi. Buang sesuai prosedur.",
  };
}

function classifyGas(gas?: number | null): { label: Label4; tone: Tone; score: number; desc: string } {
  const score = scoreFromGas(gas);
  if (!Number.isFinite(gas as number)) return { label: "Kurang Segar", tone: "warn", score, desc: "Data GAS tidak tersedia. Gunakan indikator lain (AVG/sensori) dan simpan pada 0–4°C." };
  const x = gas as number;
  if (x <= GAS_GOOD_MAX) return {
    label: "Segar",
    tone: "ok",
    score,
    desc: "Indikator gas volatil rendah (≤2500): aroma bersih/laut segar, oksidasi minimal. Aman untuk konsumsi setelah dimasak wajar; simpan 0–4°C dan gunakan FIFO.",
  };
  if (x <= GAS_WARN_MAX) return {
    label: "Kurang Segar",
    tone: "warn",
    score,
    desc: "2500–3500: gas meningkat. Masak hingga inti ≥70°C. Lebih cocok untuk olahan berbumbu/marinasi. Hindari konsumsi mentah/semimentah.",
  };
  if (x <= GAS_BAD_MAX) return {
    label: "Tidak Segar",
    tone: "danger",
    score,
    desc: "3500–4000: gas tinggi, potensi off-odor (asam/amonia). Tidak disarankan untuk dikonsumsi, terutama pada populasi rentan.",
  };
  return {
    label: "Tidak Layak",
    tone: "danger",
    score,
    desc: ">4000: indikator sangat tinggi. Risiko keamanan/kualitas signifikan. Buang sesuai prosedur higienis.",
  };
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
    console.log("[HealthStatus]", { avg_rgb, nilai_gas, scoreAvg: avgClass.score, scoreGas: gasClass.score, final: scorePrecise, avgClass });
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

  // Label AVG dengan varian
  const avgLabel = avgClass.variant ? `Segar — Lebih ${avgClass.variant === "cerah" ? "Cerah" : "Gelap"}` : avgClass.label;

  const cards = [
    { title:"Status AVG", label: avgLabel, tone: avgClass.tone as Tone, icon: Palette,
      hint:"AVG: ≤400 Tidak Segar · 400–500 Kurang · 500–730 Segar (pivot 620) · 730–800 Kurang · ≥800 Tidak Segar",
      badgeText: avgLabel },
    { title:"Status GAS", label: gasClass.label, tone: gasClass.tone as Tone, icon: Flame,
      hint:"GAS: 0–2500 Segar · 2500–3500 Kurang · 3500–4000 Tidak Segar · >4000 Tidak Layak", badgeText: gasClass.label },
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

      {/* Penjelasan gabungan AVG & GAS */}
      <motion.div initial={animate?{opacity:0}:false} animate={animate?{opacity:1}:undefined} transition={{ delay: 0.15 }}
        className="mt-6 relative overflow-hidden rounded-2xl border bg-gradient-to-br from-sky-50 to-indigo-50 ring-1 ring-sky-100 p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold bg-white/80 border-sky-200 text-sky-700">
            <Palette className="h-3.5 w-3.5" /> AVG: {avgLabel}
          </span>
          <span className={["inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border", getToneStyles(gasClass.tone).badge].join(" ")}>
            <Flame className="h-3.5 w-3.5" /> GAS: {gasClass.label}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AVG Section */}
          <div className="rounded-xl border bg-white/80 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm ring-1 ring-inset bg-sky-50 border-sky-200 ring-sky-200/50">
                <Palette className="h-4.5 w-4.5 text-sky-700" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">AVG — Catatan</p>
                <p className="text-sm mt-1 leading-relaxed text-slate-700">{avgClass.desc}</p>
                {avgClass.label === "Segar" && (
                  <ul className="list-disc pl-5 mt-2 text-sm text-slate-700 space-y-1">
                    {avgClass.variant === "cerah" ? (
                      <>
                        <li>Rekomendasi: olah sederhana (kukus, tumis ringan, panggang) agar rasa asli menonjol.</li>
                        <li>Distribusi: ideal untuk konsumsi lokal/harian; prioritaskan FIFO dan simpan 0–4°C.</li>
                      </>
                    ) : (
                      <>
                        <li>Rekomendasi: cocok untuk marinasi, asap, atau penggorengan karena tekstur lebih padat.</li>
                        <li>Distribusi: sesuai untuk perjalanan jauh/ekspor dengan rantai dingin terjaga.</li>
                      </>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* GAS Section */}
          <div className="rounded-xl border bg-white/80 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm ring-1 ring-inset bg-orange-50 border-orange-200 ring-orange-200/50">
                <Flame className="h-4.5 w-4.5 text-orange-700" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">GAS — Catatan</p>
                <p className="text-sm mt-1 leading-relaxed text-slate-700">{gasClass.desc}</p>
                <ul className="list-disc pl-5 mt-2 text-sm text-slate-700 space-y-1">
                  {gasClass.label === "Segar" && (
                    <>
                      <li>Penyimpanan: 0–4°C, kemasan tertutup; gunakan FIFO.</li>
                      <li>Olah: aman untuk teknik panas wajar (kukus/panggang/tumis).</li>
                    </>
                  )}
                  {gasClass.label === "Kurang Segar" && (
                    <>
                      <li>Wajib panas sempurna: inti ≥70°C; hindari konsumsi mentah/semimentah.</li>
                      <li>Menu disarankan: kari, balado, rendang, asap — menutup aftertaste.</li>
                    </>
                  )}
                  {gasClass.label === "Tidak Segar" && (
                    <>
                      <li>Tidak disarankan untuk dikonsumsi. Periksa bau/warna/lendir; jika menyengat → buang.</li>
                    </>
                  )}
                  {gasClass.label === "Tidak Layak" && (
                    <>
                      <li>Buang sesuai SOP higienis; hindari kontaminasi silang pada permukaan/alat.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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
