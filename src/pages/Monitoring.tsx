import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/SensorChart";
import HealthStatus from "../components/HealthStatus";
import { useGoogleSheet } from "../hooks/useGoogleSheet";
import type { ChartPoint, SheetRow } from "../types/sheet";

const WARNA_TO_INDEX: Record<string, number> = { PUCAT: 0, NETRAL: 1, CERAH: 2 };
const INDEX_TO_WARNA = ["PUCAT", "NETRAL", "CERAH"];

function warnaToIndex(w?: string) {
  const key = (w ?? "NETRAL").toUpperCase();
  return WARNA_TO_INDEX[key] ?? 1;
}

function toChartPoints(rows: SheetRow[]): ChartPoint[] {
  return rows
    .map((r) => {
      const ts = new Date(r.timestamp).getTime();
      return {
        time: new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        timestamp: ts,
        suhuIkan: r.suhuIkan,
        nilaiGas: r.nilaiGas,
        warnaIndex: warnaToIndex(r.warnaIkan),
      };
    })
    .filter((p) => Number.isFinite(p.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-200);
}

function getSuhuStatus(t: number) {
  if (t < 25 || t > 31) return { status: "danger", message: "Berbahaya" } as const;
  if (t < 26 || t > 30) return { status: "warning", message: "Perhatian" } as const;
  return { status: "good", message: "Normal" } as const;
}

function getWarnaStatus(w: string) {
  const s = (w || "").toUpperCase();
  if (s.includes("PUCAT")) return { status: "danger", message: "Pucat" } as const;
  if (s.includes("NETRAL")) return { status: "warning", message: "Netral" } as const;
  if (s.includes("CERAH")) return { status: "good", message: "Cerah" } as const;
  return { status: "warning", message: "Tidak Dikenal" } as const;
}

function getGasStatus(nilaiGas: number, statusGas?: string) {
  const s = (statusGas ?? "").toUpperCase();
  if (s.includes("AMAN")) return { status: "good", message: "Aman" } as const;
  if (s.includes("TIDAK")) return { status: "danger", message: "Tidak Aman" } as const;
  if (nilaiGas > 1800) return { status: "danger", message: "Berbahaya" } as const;
  if (nilaiGas > 1200) return { status: "warning", message: "Perhatian" } as const;
  return { status: "good", message: "Aman" } as const;
}

const Monitoring: React.FC = () => {
  const { data: rows, isInitialLoading, isRefreshing, error, refresh } = useGoogleSheet();

  // ✅ Scroll ke atas saat halaman Monitoring dimuat
  useEffect(() => {
    // smooth biar enak, kalau mau instant: window.scrollTo(0, 0)
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Always compute, but fall back to empty data
  const historicalData = useMemo(() => (rows?.length ? toChartPoints(rows) : []), [rows]);

  // Latest or safe fallback (so UI stays mounted)
  const latest = useMemo(() => {
    if (!rows?.length) return undefined;
    const last = rows[rows.length - 1];
    return rows.reduce(
      (a, b) => (new Date(a.timestamp).getTime() >= new Date(b.timestamp).getTime() ? a : b),
      last
    );
  }, [rows]);

  const loading = isInitialLoading && !latest;
  const lastUpdated = latest ? new Date(latest.timestamp).toLocaleString("id-ID") : null;

  // Safe values while loading
  const safeSuhu = latest?.suhuIkan ?? NaN;
  const safeWarna = latest?.warnaIkan ?? "";
  const safeGas = latest?.nilaiGas ?? NaN;
  const safeStatusGas = latest?.statusGas ?? "";

  const suhuDisplay = Number.isFinite(safeSuhu) ? `${safeSuhu.toFixed(2)}°C` : "—";
  const warnaDisplay = safeWarna || "—";
  const gasDisplay = Number.isFinite(safeGas) ? `${safeGas}` : "—";

  const suhuStatus = Number.isFinite(safeSuhu)
    ? getSuhuStatus(safeSuhu)
    : ({ status: "warning", message: "Menunggu data" } as const);

  const warnaStatus = safeWarna
    ? getWarnaStatus(safeWarna)
    : ({ status: "warning", message: "Menunggu data" } as const);

  const gasStatus =
    Number.isFinite(safeGas) || safeStatusGas
      ? getGasStatus(safeGas, safeStatusGas)
      : ({ status: "warning", message: "Menunggu data" } as const);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Dashboard Monitoring
          </h1>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            {lastUpdated && <span>Terakhir diperbarui: {lastUpdated}</span>}
            {(isRefreshing || loading) && <span className="animate-pulse">menyegarkan…</span>}
            <button
              onClick={refresh}
              className="ml-2 px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
              aria-label="Muat ulang data"
              disabled={isRefreshing}
            >
              Refresh
            </button>
          </div>
         
        </motion.div>

        {/* Cards — always mounted */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className={loading ? "relative" : ""}>
            {loading && <div className="absolute inset-0 rounded-xl bg-gray-100/70 animate-pulse pointer-events-none" />}
            <SensorCard
              title="Suhu Ikan"
              value={suhuDisplay}
              status={suhuStatus}
              icon="temperature"
              subtitle="Normal: 26–30°C"
            />
          </div>

          <div className={loading ? "relative" : ""}>
            {loading && <div className="absolute inset-0 rounded-xl bg-gray-100/70 animate-pulse pointer-events-none" />}
            <SensorCard
              title="Warna Ikan"
              value={warnaDisplay}
              status={warnaStatus}
              icon="fish"            // kalau mau GiFishSmoking, mapping di dalam SensorCard
              subtitle="CERAH / NETRAL / PUCAT"
            />
          </div>

          <div className={loading ? "relative" : ""}>
            {loading && <div className="absolute inset-0 rounded-xl bg-gray-100/70 animate-pulse pointer-events-none" />}
            <SensorCard
              title="Nilai Gas"
              value={gasDisplay}
              status={gasStatus}
              icon="gas"
              subtitle={`Status Gas: ${safeStatusGas || "—"}`}
            />
          </div>
        </div>

        {/* HealthStatus — always mounted */}
        <div className={`relative ${loading ? "opacity-90" : ""}`}>
          {loading && <div className="absolute inset-0 rounded-xl bg-gray-100/60 animate-pulse pointer-events-none" />}
          <HealthStatus
            suhuIkan={Number.isFinite(safeSuhu) ? safeSuhu : 0}
            warnaIkan={safeWarna || "NETRAL"}
            nilaiGas={Number.isFinite(safeGas) ? safeGas : 0}
            statusGas={safeStatusGas || "—"}
          />
        </div>

        {/* Charts — always mounted with overlay while loading */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Grafik Historis</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative">
              {loading && <div className="absolute inset-0 rounded-xl bg-gray-100/70 animate-pulse z-10 pointer-events-none" />}
              <SensorChart
                data={historicalData}
                dataKey="suhuIkan"
                title="Suhu Ikan (°C)"
                color="#3B82F6"
                yAxisDomain={[24, 32]}
                xKey="timestamp"
                xIsTimestamp
                valueFormatter={(v) => `${v.toFixed?.(2) ?? v}°C`}
              />
            </div>

            <div className="relative">
              {loading && <div className="absolute inset-0 rounded-xl bg-gray-100/70 animate-pulse z-10 pointer-events-none" />}
              <SensorChart
                data={historicalData}
                dataKey="warnaIndex"
                title="Indeks Warna Ikan (0=PUCAT,1=NETRAL,2=CERAH)"
                color="#06B6D4"
                yAxisDomain={[0, 2]}
                xKey="timestamp"
                xIsTimestamp
                valueFormatter={(v) =>
                  INDEX_TO_WARNA[Math.round(Math.max(0, Math.min(2, Number(v))))]
                }
                yTickFormatter={(v) =>
                  INDEX_TO_WARNA[Math.round(Math.max(0, Math.min(2, Number(v))))]
                }
                showDots={false}
              />
            </div>
          </div>

          <div className="mt-8 relative">
            {loading && <div className="absolute inset-0 rounded-xl bg-gray-100/70 animate-pulse z-10 pointer-events-none" />}
            <SensorChart
              data={historicalData}
              dataKey="nilaiGas"
              title="Nilai Gas"
              color="#F97316"
              yAxisDomain={["auto", "auto"]}
              xKey="timestamp"
              xIsTimestamp
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Monitoring;
