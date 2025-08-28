import React from "react";
import { motion } from "framer-motion";
import { Thermometer, Palette, Wind, TrendingUp, ShieldCheck } from "lucide-react";
import type { SheetRow } from "../types/sheet";

export interface SensorCardProps {
  row: SheetRow; // baris terbaru
  className?: string;
}

// ===== Helpers =====
const formatNum = (n: number | undefined | null, unit = "") =>
  Number.isFinite(Number(n)) ? `${Number(n).toFixed(2)}${unit}` : "—";

const badgeColor = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (["baik", "segar", "aman", "normal"].some((k) => s.includes(k)))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["waspada", "cukup"].some((k) => s.includes(k)))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (["buruk", "bahaya", "tidak segar"].some((k) => s.includes(k)))
    return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

const IconWrap: React.FC<{ gradientFrom?: string; gradientTo?: string; children: React.ReactNode }>=({
  gradientFrom = "from-blue-500",
  gradientTo = "to-cyan-500",
  children,
}) => (
  <div className={`p-3 rounded-2xl shadow-lg bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white ring-1 ring-white/30`}>
    {children}
  </div>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  footerRight?: React.ReactNode;
}> = ({ icon, title, value, subtitle, footerRight }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
    className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border bg-white/80 dark:bg-slate-900/70 border-white/60 dark:border-slate-800 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md shadow-xl"
  >
    {/* soft light */}
    <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />

    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">Live</span>
    </div>

    <div className="mt-4 text-3xl font-extrabold leading-none text-slate-900 dark:text-white">
      {value}
    </div>

    {footerRight && (
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="inline-flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> Tren terbaru
        </div>
        {footerRight}
      </div>
    )}
  </motion.div>
);

const Pill: React.FC<{ label: string; intent?: "good" | "warn" | "bad" | "neutral" }>=({ label, intent = "neutral" }) => {
  const map = {
    good: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warn: "bg-amber-100 text-amber-800 border-amber-200",
    bad: "bg-rose-100 text-rose-700 border-rose-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${map[intent]}`}>
      <ShieldCheck className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

const SensorCard: React.FC<SensorCardProps> = ({ row, className }) => {
  const suhu = formatNum(row.suhu_ikan, "°C");
  const rgb = Number.isFinite(row.avg_rgb ?? NaN) ? String(row.avg_rgb) : "—";
  const gas = Number.isFinite(row.nilai_gas) ? String(row.nilai_gas) : "—";

  return (
    <div className={`relative rounded-3xl p-6 md:p-7 border border-white/50 shadow-2xl overflow-hidden ${className ?? ""}`}>
      {/* Background gradient selaras HealthStatus (full coverage) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 30%, #7DD3FC 65%, #38BDF8 100%)",
        }}
      />
      {/* Soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[60rem] rounded-full blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(191,219,254,.55), rgba(125,211,252,.35), rgba(59,130,246,.25))",
        }}
      />

      {/* Grid isi cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Suhu Ikan */}
        <StatCard
          icon={
            <IconWrap>
              <Thermometer className="w-6 h-6" aria-hidden />
            </IconWrap>
          }
          title="Suhu Ikan"
          value={suhu}
          subtitle="Pemantauan suhu tubuh ikan untuk menjaga kesegaran"
          footerRight={<Pill label="suhu ikan" intent="good" />}
        />

        {/* AVG RGB */}
        <StatCard
          icon={
            <IconWrap gradientFrom="from-sky-500" gradientTo="to-indigo-500">
              <Palette className="w-6 h-6" aria-hidden />
            </IconWrap>
          }
          title="Analisis Warna (AVG RGB)"
          value={rgb}
          subtitle="Deteksi kualitas warna ikan"
          footerRight={
            <span className={`px-2.5 py-1 rounded-full text-[11px] border ${badgeColor(row.warna_ikan)}`}>
              {row.warna_ikan || "—"}
            </span>
          }
        />

        {/* Nilai Gas */}
        <StatCard
          icon={
            <IconWrap gradientFrom="from-cyan-500" gradientTo="to-emerald-500">
              <Wind className="w-6 h-6" aria-hidden />
            </IconWrap>
          }
          title="Sensor Gas Ikan"
          value={gas}
          subtitle="Pengukuran kadar gas untuk deteksi kesegaran"
          footerRight={
            <span className={`px-2.5 py-1 rounded-full text-[11px] border ${badgeColor(row.status_gas)}`}>
              {row.status_gas || "—"}
            </span>
          }
        />
      </div>
    </div>
  );
};

export default SensorCard;
