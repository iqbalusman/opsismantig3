import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SheetRow } from "../types/sheet";
import { motion } from "framer-motion";

export interface SensorChartProps {
  data: SheetRow[];
  height?: number;
  timeZone?: string;
}

function tickTimeFormatter(timeZone?: string) {
  return (v: any) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    try {
      return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", ...(timeZone ? { timeZone } : {}) }).format(d);
    } catch {
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
  };
}

const Panel: React.FC<{ title: string; height: number; children: React.ReactNode }> = ({ title, height, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.35 }}
    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50"
    style={{ height }}
  >
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
    <div style={{ width: "100%", height: `calc(${height}px - 48px)` }}>{children}</div>
  </motion.div>
);

const SensorChart: React.FC<SensorChartProps> = ({ data, height = 320, timeZone }) => {
  const formatX = useMemo(() => tickTimeFormatter(timeZone), [timeZone]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Suhu */}
      <Panel title="Grafik Suhu Ikan (°C)" height={height}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="timestamp" tickFormatter={formatX} minTickGap={24} stroke="#6b7280" fontSize={12}/>
            <YAxis domain={["auto","auto"]} stroke="#6b7280" fontSize={12}/>
            <Tooltip labelFormatter={(l)=>`Waktu: ${formatX(l)}`} />
            <Line type="monotone" dataKey="suhu_ikan" stroke="#3B82F6" strokeWidth={3} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* AVG RGB */}
      <Panel title="Grafik AVG RGB" height={height}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="timestamp" tickFormatter={formatX} minTickGap={24} stroke="#6b7280" fontSize={12}/>
            <YAxis domain={["auto","auto"]} stroke="#6b7280" fontSize={12}/>
            <Tooltip labelFormatter={(l)=>`Waktu: ${formatX(l)}`} />
            <Line type="monotone" dataKey="avg_rgb" stroke="#10b981" strokeWidth={3} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* Nilai Gas */}
      <Panel title="Grafik Nilai Gas" height={height}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="timestamp" tickFormatter={formatX} minTickGap={24} stroke="#6b7280" fontSize={12}/>
            <YAxis domain={["auto","auto"]} stroke="#6b7280" fontSize={12}/>
            <Tooltip labelFormatter={(l)=>`Waktu: ${formatX(l)}`} />
            <Line type="monotone" dataKey="nilai_gas" stroke="#ef4444" strokeWidth={3} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
};

export default SensorChart;
