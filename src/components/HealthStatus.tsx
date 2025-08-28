// src/components/HealthStatus.tsx
import React, { useMemo } from "react";
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

type Status = "good" | "warning" | "danger";

type Props = {
  suhu_ikan?: number | null;
  nilai_gas?: number | null;
  avg_rgb?: number | null;
  warna_ikan?: string | null;
  status_gas?: string | null;
  fishName?: string;
  animate?: boolean;
};

/* ===== Helpers ===== */
const safeUpper = (s?: string | null) => (s ?? "").trim().toUpperCase();

function statusFromWarnaLabel(s?: string | null): Status {
  const up = safeUpper(s);
  if (!up) return "warning";
  if (up.includes("PUCAT") || up.includes("ABU") || up.includes("LENDIR") || up.includes("HIJAU") || up.includes("HITAM")) return "danger";
  if (up.includes("CERAH") || up.includes("COKLAT") || up.includes("COCOKLAT") || up.includes("MERATA")) return "good";
  if (up.includes("NETRAL") || up.includes("OK")) return "warning";
  return "warning";
}
function statusFromGasLabel(s?: string | null): Status {
  const up = safeUpper(s);
  if (!up) return "warning";
  if (up.includes("ASAM") || up.includes("MENYENGAT") || up.includes("ANYIR KUAT") || up.includes("BUSUK")) return "danger";
  if (up.includes("AMAN") || up.includes("SEGAR") || up.includes("NETRAL") || up.includes("RINGAN")) return "good";
  return "warning";
}
function statusFromSuhu(v?: number | null): Status {
  if (!Number.isFinite(v as number)) return "warning";
  const x = v as number;
  if (x <= 4) return "good";
  if (x <= 10) return "warning";
  return "danger";
}
function statusFromGasValue(v?: number | null): Status {
  if (!Number.isFinite(v as number)) return "warning";
  const x = v as number;
  if (x <= 10) return "good";
  if (x <= 20) return "warning";
  return "danger";
}
function statusFromAvgRGB(v?: number | null): Status {
  if (!Number.isFinite(v as number)) return "warning";
  const x = v as number;
  if (x >= 80 && x <= 170) return "good";
  if (x >= 60 && x <= 190) return "warning";
  return "danger";
}
function scoreOfStatus(st: Status) {
  return st === "good" ? 100 : st === "warning" ? 75 : 40;
}

const W = { warnaLabel: 0.35, gasLabel: 0.25, suhu: 0.2, gasValue: 0.1, avgRgb: 0.1 } as const;

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
  const toneStyles = getToneStyles(tone);
  const text = tone === "ok" ? "Normal" : tone === "warn" ? "Waspada" : "Bahaya";
  return (
    <span className={["inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", toneStyles.badge].join(" ")}>
      <span className={["h-1.5 w-1.5 rounded-full", toneStyles.dot].join(" ")} />
      {text}
    </span>
  );
}
function LegendDot({ tone }: { tone: "ok" | "warn" | "danger" }) {
  const toneStyles = getToneStyles(tone);
  return <span className={["h-2 w-2 rounded-full inline-block", toneStyles.dot].join(" ")} />;
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
  const toneStyles = getToneStyles(tone);
  return (
    <div className={["group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm", "transition-colors duration-300", toneStyles.border].join(" ")}>
      <div aria-hidden className={["absolute inset-x-0 top-0 h-1", toneStyles.accentBar].join(" ")} />
      <div className="flex items-start gap-3">
        <div className={["inline-flex h-10 w-10 items-center justify-center rounded-xl border", "shadow-xs ring-1 ring-inset", toneStyles.iconWrap].join(" ")}>
          <Icon className={["h-5 w-5", toneStyles.icon].join(" ")} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-500">{title}</div>
            {hint && <Info className="h-3.5 w-3.5 text-slate-400" title={hint} />}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <div className="text-lg font-semibold tracking-tight text-slate-800">{label || "—"}</div>
            <StatusBadge tone={tone} />
          </div>
        </div>
      </div>
      <div
        aria-hidden
        className={["pointer-events-none absolute -bottom-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-2xl opacity-0", "transition-opacity duration-300 group-hover:opacity-60", toneStyles.glow].join(" ")}
      />
    </div>
  );
}

const HealthStatus: React.FC<Props> = ({
  suhu_ikan = null,
  nilai_gas = null,
  avg_rgb = null,
  warna_ikan = null,
  status_gas = null,
  fishName = "Ikan Fufu",
  animate = true,
}) => {
  // Status dari LABEL
  const warnaStatus = useMemo(() => statusFromWarnaLabel(warna_ikan), [warna_ikan]);
  const gasStatus   = useMemo(() => statusFromGasLabel(status_gas), [status_gas]);

  // Status dari NILAI (tetap dihitung, tapi tidak ditampilkan angkanya)
  const suhuStatus    = useMemo(() => statusFromSuhu(suhu_ikan), [suhu_ikan]);
  const gasNumStatus  = useMemo(() => statusFromGasValue(nilai_gas), [nilai_gas]);
  const rgbStatus     = useMemo(() => statusFromAvgRGB(avg_rgb), [avg_rgb]);

  // Skor akhir (0–100) untuk kesimpulan
  const healthScore = useMemo(() => {
    const s =
      scoreOfStatus(warnaStatus) * W.warnaLabel +
      scoreOfStatus(gasStatus) * W.gasLabel +
      scoreOfStatus(suhuStatus) * W.suhu +
      scoreOfStatus(gasNumStatus) * W.gasValue +
      scoreOfStatus(rgbStatus) * W.avgRgb;
    return Math.max(0, Math.min(100, Math.round(s)));
  }, [warnaStatus, gasStatus, suhuStatus, gasNumStatus, rgbStatus]);

  // Keputusan konsumsi
  const isSafeToEat   = healthScore >= 85;
  const reheatOnly    = healthScore >= 70 && healthScore < 85;
  const notRecommended= healthScore >= 50 && healthScore < 70;
  const isUnsafe      = healthScore < 50;

  const StatusIcon = isUnsafe ? XCircle : isSafeToEat ? CheckCircle : AlertCircle;

  const consumptionMessage =
    isSafeToEat
      ? `${fishName} AMAN untuk dikonsumsi.`
      : reheatOnly
      ? `${fishName} DAPAT dikonsumsi setelah dipanaskan hingga matang.`
      : notRecommended
      ? `${fishName} TIDAK DIREKOMENDASIKAN untuk dikonsumsi.`
      : `${fishName} TIDAK LAYAK konsumsi.`;

  const actionTips =
    isSafeToEat
      ? "Simpan 0–4°C. Konsumsi 24–48 jam."
      : reheatOnly
      ? "Panaskan hingga inti >70°C. Jika tercium menyengat/asam, jangan konsumsi."
      : notRecommended
      ? "Ada tanda penurunan mutu. Demi keamanan, sebaiknya jangan dikonsumsi."
      : "Tanda kerusakan kuat (bau tajam/lendir/warna ekstrem). Buang produk.";

  const progressColor =
    isSafeToEat ? "from-green-300 to-green-500"
    : (reheatOnly || notRecommended) ? "from-orange-300 to-orange-500"
    : "from-red-600 to-red-800";

  const verdictBadge =
    isUnsafe ? "bg-red-50 text-red-800 border-red-300"
    : (notRecommended || reheatOnly) ? "bg-orange-50 text-orange-800 border-orange-300"
    : "bg-green-50 text-green-800 border-green-300";

  // Label status (tanpa angka)
  const suhuStatusLabel =
    suhuStatus === "good" ? "Dingin ideal"
    : suhuStatus === "warning" ? "Hangat (perlu hati-hati)"
    : "Suhu (tidak aman)";
  const warnaStatusLabel = (warna_ikan ?? "").trim() || "—";
  const gasStatusLabel   = (status_gas ?? "").trim() || "—";

  const cards = [
    { title: "Status Suhu",        label: suhuStatusLabel, tone: toTone(suhuStatus), icon: Thermometer, hint: "Pembacaan suhu terkini dari sensor" },
    { title: "Status Warna Fufu",  label: warnaStatusLabel, tone: toTone(warnaStatus), icon: Palette,     hint: "Deteksi warna bahan (ΔE/visual)" },
    { title: "Status Gas",         label: gasStatusLabel,   tone: toTone(gasStatus),   icon: Flame,       hint: "Konsentrasi gas/volatil" },
  ] as const;

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

      {/* Header skor & legend (tanpa angka sensor) */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelayakan Konsumsi (Fufu)</h2>
          <p className="text-sm text-slate-600">Pantau indikator utama secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
            <LegendDot tone="ok" /> Normal <LegendDot tone="warn" /> Waspada <LegendDot tone="danger" /> Bahaya
          </div>
          <div className="h-8 w-px bg-slate-300/60 hidden md:block" />
          <div className="flex items-center gap-2">
            <StatusIcon
              className={`w-5 h-5 ${isUnsafe ? "text-red-700" : isSafeToEat ? "text-green-600" : "text-orange-600"}`}
              aria-hidden
            />
            {/* Boleh tetap tampilkan persentase kesehatan keseluruhan */}
            <span className="text-xl font-bold text-gray-900">{healthScore}%</span>
          </div>
        </div>
      </div>

      {/* Progress bar (tetap, karena bukan angka sensor mentah) */}
      <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden mb-5 shadow-inner">
        <motion.div
          initial={animate ? { width: 0 } : false}
          animate={animate ? { width: `${healthScore}%` } : undefined}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${progressColor} rounded-full`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={healthScore}
        />
      </div>

      {/* VERDICT */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${verdictBadge} mb-6`}>
        <span className="text-sm font-semibold">{consumptionMessage}</span>
      </div>

      {/* STATUS CARDS (tanpa angka sensor) */}
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
    </motion.div>
  );
};

export default HealthStatus;
