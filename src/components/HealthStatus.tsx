import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Fish, AlertCircle, CheckCircle } from "lucide-react";

type Status = "good" | "warning" | "danger";

interface Props {
  // nilai (untuk info saja)
  suhu_ikan: number;
  nilai_gas: number;

  // STATUS dari spreadsheet (dipakai untuk scoring & ditampilkan)
  warna_ikan: string;    // contoh: "Segar" | "Tidak segar" | "Netral" | "Pucat"
  status_gas: string;    // contoh: "Aman"/"Segar" | "Tidak …"

  fishName?: string;
  animate?: boolean;
}

/* ====== mapping label → level ====== */
function statusFromWarnaLabel(s: string): Status {
  const up = (s ?? "").trim().toUpperCase();
  if (!up) return "warning";
  if (up.includes("TIDAK") || up.includes("PUCAT")) return "danger";
  if (up.includes("CERAH") || up.includes("SEGAR")) return "good";
  if (up.includes("NETRAL")) return "warning";
  return "warning";
}
function statusFromGasLabel(s: string): Status {
  const up = (s ?? "").trim().toUpperCase();
  if (!up) return "warning";
  if (up.includes("TIDAK")) return "danger";
  if (up.includes("AMAN") || up.includes("SEGAR")) return "good";
  return "warning";
}
function scoreOfStatus(st: Status) { return st === "good" ? 100 : st === "warning" ? 75 : 40; }

// bobot: hanya dari STATUS
const WEIGHT_WARNA = 0.5;
const WEIGHT_GAS   = 0.5;

const numberID = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

const HealthStatus: React.FC<Props> = ({
  suhu_ikan, nilai_gas, warna_ikan, status_gas, fishName = "Ikan Fufu", animate = true,
}) => {
  const warnaStatus = useMemo(() => statusFromWarnaLabel(warna_ikan), [warna_ikan]);
  const gasStatus   = useMemo(() => statusFromGasLabel(status_gas), [status_gas]);

  const healthScore = useMemo(() => {
    const s = scoreOfStatus(warnaStatus) * WEIGHT_WARNA + scoreOfStatus(gasStatus) * WEIGHT_GAS;
    return Math.max(0, Math.min(100, Math.round(s)));
  }, [warnaStatus, gasStatus]);

  const isHealthy = healthScore >= 80;
  const needsAttention = healthScore >= 60 && healthScore < 80;
  const StatusIcon = isHealthy ? CheckCircle : AlertCircle;

  const getHealthMessage = () => {
    if (healthScore >= 90) return `${fishName} dalam kondisi sangat baik dan layak konsumsi.`;
    if (healthScore >= 80) return `${fishName} dalam kondisi baik dan layak konsumsi.`;
    if (healthScore >= 60) return `Kondisi ${fishName} memerlukan perhatian, perlu pemantauan lebih ketat.`;
    return `${fishName} tidak layak konsumsi, perlu tindakan segera untuk memperbaiki kondisi air.`;
  };

  const getProgressColor = () => {
    if (healthScore >= 80) return "from-green-500 to-emerald-500";
    if (healthScore >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-red-600";
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : false as any}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50"
    >
      {/* Header skor */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold text-gray-800">Skor Kesehatan</h2>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${isHealthy ? "text-green-600" : needsAttention ? "text-yellow-600" : "text-red-600"}`} aria-hidden />
          <span className="text-xl font-bold text-gray-800">{healthScore}%</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-6">
        <motion.div
          initial={animate ? { width: 0 } : false as any}
          animate={animate ? { width: `${healthScore}%` } : undefined}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full shadow-lg`}
          role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={healthScore}
        />
      </div>

      {/* Nilai & status yang DITAMPILKAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-gray-500">Suhu Ikan</div>
          <div className="text-lg font-semibold">{Number.isFinite(suhu_ikan) ? `${numberID.format(suhu_ikan)}°C` : "—"}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-gray-500">Status Warna Ikan</div>
          <div className="text-lg font-semibold">{warna_ikan || "—"}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-gray-500">Status Gas</div>
          <div className="text-lg font-semibold">{status_gas || "—"}</div>
        </div>
      </div>

      <motion.div
        initial={animate ? { opacity: 0 } : false as any}
        animate={animate ? { opacity: 1 } : undefined}
        transition={{ delay: 0.2 }}
        className={`mt-6 p-4 rounded-xl border-l-4 ${
          isHealthy ? "bg-green-50 border-l-green-500 text-green-800"
          : needsAttention ? "bg-yellow-50 border-l-yellow-500 text-yellow-800"
          : "bg-red-50 border-l-red-500 text-red-800"
        }`}
        aria-live="polite"
      >
        <p className="font-semibold">{getHealthMessage()}</p>
      </motion.div>
    </motion.div>
  );
};

export default HealthStatus;
