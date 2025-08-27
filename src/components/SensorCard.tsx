import React from "react";
import { motion } from "framer-motion";
import { Thermometer, Palette, Wind } from "lucide-react";
import type { SheetRow } from "../types/sheet";

export interface SensorCardProps {
  row: SheetRow; // baris terbaru
  className?: string;
}

const CardBox: React.FC<{ icon: React.ReactNode; title: string; value: string; }> = ({ icon, title, value }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 transition-all duration-300"
  >
    <div className="flex items-center space-x-3 mb-3">
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">{icon}</div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    <div className="text-3xl font-bold text-gray-800">{value}</div>
  </motion.div>
);

const SensorCard: React.FC<SensorCardProps> = ({ row, className }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className ?? ""}`}>
      <CardBox
        icon={<Thermometer className="w-6 h-6 text-white" aria-hidden />}
        title="Suhu Ikan"
        value={Number.isFinite(row.suhu_ikan) ? `${row.suhu_ikan.toFixed(2)}°C` : "—"}
      />
      <CardBox
        icon={<Palette className="w-6 h-6 text-white" aria-hidden />}
        title="AVG RGB"
        value={Number.isFinite(row.avg_rgb ?? NaN) ? String(row.avg_rgb) : "—"}
      />
      <CardBox
        icon={<Wind className="w-6 h-6 text-white" aria-hidden />}
        title="Nilai Gas"
        value={Number.isFinite(row.nilai_gas) ? String(row.nilai_gas) : "—"}
      />
    </div>
  );
};

export default SensorCard;
