import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { motion } from "framer-motion";

export interface SensorChartProps<T = any> {
  data: T[];
  dataKey: string;                 // contoh: "suhuIkan" | "nilaiGas" | "warnaIndex"
  title: string;
  color?: string;
  yAxisDomain?: [number | "auto", number | "auto"];
  height?: number;
  xKey?: string;                   // default "time"
  xIsTimestamp?: boolean;          // true jika xKey epoch/ISO
  timeFormatter?: (v: any) => string;
  valueFormatter?: (v: number) => string;
  yTickFormatter?: (v: number) => string;
  showDots?: boolean;
  tickCount?: number;
  className?: string;
}

const SensorChart = <T,>({
  data,
  dataKey,
  title,
  color = "#3B82F6",
  yAxisDomain = ["auto", "auto"],
  height = 300,
  xKey = "time",
  xIsTimestamp = false,
  timeFormatter,
  valueFormatter,
  yTickFormatter,
  showDots = true,
  tickCount,
  className,
}: SensorChartProps<T>) => {
  const defaultValueFormatter = useMemo(() => (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "—"), []);

  const formatX = useMemo(() => {
    if (timeFormatter) return timeFormatter;
    if (xIsTimestamp) {
      return (v: any) => {
        const d = typeof v === "number" ? new Date(v) : new Date(String(v));
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      };
    }
    return (v: any) => String(v);
  }, [timeFormatter, xIsTimestamp]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const p = payload.find((x) => x.dataKey === dataKey) ?? payload[0];
    const val = typeof p.value === "number" ? p.value : Number(p.value);
    const fmtVal = (valueFormatter ?? defaultValueFormatter)(val);
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-800">Waktu: {formatX?.(label)}</p>
        <p className="text-sm" style={{ color }}>
          {title}: {fmtVal}
        </p>
      </div>
    );
  };

  const dots = showDots ? { fill: color, strokeWidth: 2, r: 4 } : false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 ${className ?? ""}`}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} stroke="#6b7280" fontSize={12} minTickGap={24} tickCount={tickCount} tickFormatter={formatX} />
            <YAxis stroke="#6b7280" fontSize={12} domain={yAxisDomain as any} tickFormatter={yTickFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={dots as any}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {(!data || data.length === 0) && <div className="text-sm text-gray-500 mt-3">Tidak ada data untuk ditampilkan.</div>}
    </motion.div>
  );
};

export default SensorChart;
