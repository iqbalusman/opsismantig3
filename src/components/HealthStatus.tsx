import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Fish, AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  suhuIkan: number;     // dari "suhu ikan"
  warnaIkan: string;    // dari "warna ikan" (CERAH | NETRAL | PUCAT | dll)
  nilaiGas: number;     // dari "nilai gas"
  statusGas?: string;   // dari "status gas" (opsional untuk override)
}

// --- Threshold yang bisa kamu sesuaikan ---
const suhuGood: [number, number] = [26, 30];
const suhuWarn: [number, number] = [25, 31];

const gasGoodMax = 1200;   // <= 1200 baik
const gasWarnMax = 1800;   // 1201–1800 perhatian; >1800 bahaya

function statusFromSuhu(t: number) {
  if (t < suhuWarn[0] || t > suhuWarn[1]) return "danger";
  if (t < suhuGood[0] || t > suhuGood[1]) return "warning";
  return "good";
}

function statusFromWarna(w: string) {
  const s = w.trim().toUpperCase();
  if (s.includes("PUCAT")) return "danger";
  if (s.includes("NETRAL")) return "warning"; // atur NETRAL ke warning (bisa kamu ganti ke "good")
  if (s.includes("CERAH")) return "good";
  return "warning";
}

function statusFromGasValue(v: number) {
  if (v > gasWarnMax) return "danger";
  if (v > gasGoodMax) return "warning";
  return "good";
}

function statusFromGas(statusGas?: string, nilaiGas?: number) {
  const s = (statusGas ?? "").toUpperCase();
  if (s.includes("AMAN")) return "good";
  if (s.includes("TIDAK")) return "danger";
  if (typeof nilaiGas === "number") return statusFromGasValue(nilaiGas);
  return "warning";
}

function scoreOfStatus(s: "good" | "warning" | "danger") {
  return s === "good" ? 100 : s === "warning" ? 75 : 40;
}

const WEIGHT_SUHU = 0.4;
const WEIGHT_WARNA = 0.3;
const WEIGHT_GAS = 0.3;

const HealthStatus: React.FC<Props> = ({ suhuIkan, warnaIkan, nilaiGas, statusGas }) => {
  const suhuS = statusFromSuhu(suhuIkan) as "good" | "warning" | "danger";
  const warnaS = statusFromWarna(warnaIkan) as "good" | "warning" | "danger";
  const gasS = statusFromGas(statusGas, nilaiGas) as "good" | "warning" | "danger";

  const healthScore = useMemo(() => {
    const s =
      scoreOfStatus(suhuS) * WEIGHT_SUHU +
      scoreOfStatus(warnaS) * WEIGHT_WARNA +
      scoreOfStatus(gasS) * WEIGHT_GAS;
    return Math.max(0, Math.min(100, Math.round(s)));
  }, [suhuS, warnaS, gasS]);

  const isHealthy = healthScore >= 80;
  const needsAttention = healthScore >= 60 && healthScore < 80;
  const StatusIcon = isHealthy ? CheckCircle : AlertCircle;

  const getHealthMessage = () => {
    if (healthScore >= 90) return "Ikan Fufu dalam kondisi sangat baik dan layak konsumsi.";
    if (healthScore >= 80) return "Ikan Fufu dalam kondisi baik dan layak konsumsi.";
    if (healthScore >= 60) return "Kondisi ikan Fufu memerlukan perhatian, perlu pemantauan lebih ketat.";
    return "Ikan Fufu tidak layak konsumsi, perlu tindakan segera untuk memperbaiki kondisi air.";
  };

  const getProgressColor = () => {
    if (healthScore >= 80) return "from-green-500 to-emerald-500";
    if (healthScore >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-red-600";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
      <div className="flex items-center space-x-4 mb-6">
        <div className={`p-4 rounded-2xl ${isHealthy ? "bg-green-100" : needsAttention ? "bg-yellow-100" : "bg-red-100"}`}>
          <Fish className={`w-8 h-8 ${isHealthy ? "text-green-600" : needsAttention ? "text-yellow-600" : "text-red-600"}`} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Status Kesehatan Ikan Fufu</h2>
          <p className="text-gray-600">Analisis dari suhu, warna, dan gas</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-gray-700">Skor Kesehatan</span>
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-5 h-5 ${isHealthy ? "text-green-600" : needsAttention ? "text-yellow-600" : "text-red-600"}`} />
            <span className="text-2xl font-bold text-gray-800">{healthScore}%</span>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full shadow-lg`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-gray-500">Suhu Ikan</div>
          <div className="text-lg font-semibold">{suhuIkan.toFixed(2)}°C</div>
          <div className={`mt-1 inline-flex text-xs px-2 py-1 rounded-full ${
              suhuS === "good" ? "bg-green-100 text-green-700" : suhuS === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
            }`}>
            {suhuS === "good" ? "Normal (26–30°C)" : suhuS === "warning" ? "Perhatian (±1°C)" : "Berbahaya"}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-gray-500">Warna Ikan</div>
          <div className="text-lg font-semibold">{warnaIkan}</div>
          <div className={`mt-1 inline-flex text-xs px-2 py-1 rounded-full ${
              warnaS === "good" ? "bg-green-100 text-green-700" : warnaS === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
            }`}>
            {warnaS === "good" ? "Cerah" : warnaS === "warning" ? "Netral" : "Pucat"}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-gray-500">Nilai Gas</div>
          <div className="text-lg font-semibold">{nilaiGas}</div>
          <div className={`mt-1 inline-flex text-xs px-2 py-1 rounded-full ${
              gasS === "good" ? "bg-green-100 text-green-700" : gasS === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
            }`}>
            {gasS === "good" ? "Aman" : gasS === "warning" ? "Perhatian" : "Berbahaya"}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className={`p-4 rounded-xl border-l-4 ${
          isHealthy ? "bg-green-50 border-l-green-500 text-green-800" : needsAttention ? "bg-yellow-50 border-l-yellow-500 text-yellow-800" : "bg-red-50 border-l-red-500 text-red-800"
        }`}>
        <p className="font-semibold">{getHealthMessage()}</p>
      </motion.div>
    </motion.div>
  );
};

export default HealthStatus;
