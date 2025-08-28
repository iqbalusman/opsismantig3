import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import type { SheetRow } from "../types/sheet";
import { motion } from "framer-motion";
import { Thermometer, Palette, Wind, Activity } from "lucide-react";

export interface SensorChartProps {
  data?: SheetRow[];
  height?: number;
  timeZone?: string;
  className?: string;
}

// ===== Helpers =====
function tickTimeFormatter(timeZone?: string) {
  return (v: any) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v ?? "");
    try {
      return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        ...(timeZone ? { timeZone } : {}),
      }).format(d);
    } catch {
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
  };
}

const fmtNum = (n?: number, suffix = "") =>
  typeof n === "number" && isFinite(n)
    ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n) + suffix
    : "-";

// ===== Card Shell =====
const CardShell: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = React.memo(
  ({ title, children, className }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`relative rounded-3xl p-6 md:p-7 border border-white/50 shadow-2xl overflow-hidden ${className ?? ""}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 30%, #7DD3FC 65%, #38BDF8 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[60rem] rounded-full blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(191,219,254,.55), rgba(125,211,252,.35), rgba(59,130,246,.25))",
        }}
      />
      {title && (
        <div className="mb-4 flex items-center gap-2 text-slate-900">
          <Activity className="w-4 h-4 text-sky-700" />
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="ml-auto text-[10px] px-2 py-1 rounded-full uppercase tracking-wide bg-white/70 text-slate-600 border border-white/60">
            Live
          </span>
        </div>
      )}
      {children}
    </motion.div>
  )
);

// ===== Panel =====
const Panel: React.FC<{
  title: string;
  height: number;
  icon?: React.ReactNode;
  gradient?: string;
  children: React.ReactNode;
}> = React.memo(({ title, height, icon, gradient = "from-blue-500 to-cyan-500", children }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 260, damping: 22 }}
    className="relative rounded-3xl p-5 sm:p-6 border border-white/60 bg-white/80 backdrop-blur-md shadow-xl overflow-hidden"
    style={{ height }}
  >
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-white bg-gradient-to-br ${gradient} ring-1 ring-white/40`}>
          {icon}
        </div>
        <h4 className="text-sm sm:text-base font-semibold text-slate-900">
          <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{title}</span>
        </h4>
      </div>
      <span className="text-[10px] px-2 py-1 rounded-full uppercase tracking-wide bg-white/70 text-slate-600 border border-white/60">Live</span>
    </div>
    <div className="w-full" style={{ height: `calc(${height}px - 56px)` }}>{children}</div>
    <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
  </motion.div>
));

// ===== Tooltip =====
const CustomTooltip: React.FC<{
  active?: boolean;
  label?: any;
  payload?: any[];
  timeFormatter: (v: any) => string;
}> = ({ active, label, payload, timeFormatter }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-slate-700 mb-1">Waktu: {timeFormatter(label)}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-semibold">{fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ===== Memo compare: re-render hanya jika ada baris baru =====
const areEqual = (prev: SensorChartProps, next: SensorChartProps) => {
  const p = prev.data ?? [];
  const n = next.data ?? [];
  const pLen = p.length;
  const nLen = n.length;
  const pLast = pLen ? (p[pLen - 1] as any)?.timestamp : null;
  const nLast = nLen ? (n[nLen - 1] as any)?.timestamp : null;

  return (
    pLen === nLen &&
    pLast === nLast &&
    prev.height === next.height &&
    prev.timeZone === next.timeZone &&
    prev.className === next.className
  );
};

const SensorChartBase: React.FC<SensorChartProps> = ({
  data,
  height = 320,
  timeZone,
  className,
}) => {
  const safe = Array.isArray(data) ? data : [];

  // versi data: length + timestamp terakhir (hindari proses ulang tanpa data baru)
  const dataVersion = useMemo(() => {
    const len = safe.length;
    const lastTs = len ? (safe[len - 1] as any)?.timestamp ?? "" : "";
    return `${len}|${lastTs}`;
  }, [safe]);

  const formatX = useMemo(() => tickTimeFormatter(timeZone), [timeZone]);

  const latest = useMemo(
    () => (safe.length ? (safe[safe.length - 1] as any) : undefined),
    [dataVersion, safe]
  );

  return (
    <CardShell title="Grafik Sensor" className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suhu */}
        <Panel
          title="Grafik Suhu Ikan (°C)"
          height={height}
          icon={<Thermometer className="w-4 h-4" />}
          gradient="from-blue-500 to-cyan-500"
        >
          {safe.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-slate-600">Belum ada data.</div>
          ) : (
            <ResponsiveContainer>
              <LineChart data={safe} margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
                <defs>
                  <linearGradient id="gradSuhu" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="timestamp" tickFormatter={formatX} minTickGap={24} stroke="#64748b" fontSize={12} />
                <YAxis domain={["auto", "auto"]} stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip timeFormatter={formatX} />} />
                <Line
                  type="monotone"
                  dataKey="suhu_ikan"
                  name="Suhu"
                  stroke="url(#gradSuhu)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
                {latest?.suhu_ikan != null && latest?.timestamp != null && (
                  <ReferenceDot
                    x={latest.timestamp as any}
                    y={latest.suhu_ikan as any}
                    r={4}
                    fill="#06b6d4"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* AVG RGB */}
        <Panel
          title="Grafik Analisis Warna (AVG RGB)"
          height={height}
          icon={<Palette className="w-4 h-4" />}
          gradient="from-indigo-500 to-sky-500"
        >
          {safe.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-slate-600">Belum ada data.</div>
          ) : (
            <ResponsiveContainer>
              <LineChart data={safe} margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
                <defs>
                  <linearGradient id="gradRgb" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="timestamp" tickFormatter={formatX} minTickGap={24} stroke="#64748b" fontSize={12} />
                <YAxis domain={["auto", "auto"]} stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip timeFormatter={formatX} />} />
                <Line
                  type="monotone"
                  dataKey="avg_rgb"
                  name="AVG RGB"
                  stroke="url(#gradRgb)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
                {latest?.avg_rgb != null && latest?.timestamp != null && (
                  <ReferenceDot
                    x={latest.timestamp as any}
                    y={latest.avg_rgb as any}
                    r={4}
                    fill="#0ea5e9"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Nilai Gas */}
        <Panel
          title="Grafik Nilai Gas"
          height={height}
          icon={<Wind className="w-4 h-4" />}
          gradient="from-cyan-500 to-blue-700"
        >
          {safe.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-slate-600">Belum ada data.</div>
          ) : (
            <ResponsiveContainer>
              <LineChart data={safe} margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
                <defs>
                  <linearGradient id="gradGas" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="timestamp" tickFormatter={formatX} minTickGap={24} stroke="#64748b" fontSize={12} />
                <YAxis domain={["auto", "auto"]} stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip timeFormatter={formatX} />} />
                <Line
                  type="monotone"
                  dataKey="nilai_gas"
                  name="Nilai Gas"
                  stroke="url(#gradGas)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
                {latest?.nilai_gas != null && latest?.timestamp != null && (
                  <ReferenceDot
                    x={latest.timestamp as any}
                    y={latest.nilai_gas as any}
                    r={4}
                    fill="#1d4ed8"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </CardShell>
  );
};

const SensorChart = React.memo(SensorChartBase, areEqual);
export default SensorChart;
