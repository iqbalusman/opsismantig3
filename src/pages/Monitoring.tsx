// src/pages/Monitoring.tsx
import React from "react";
import { useGoogleSheet } from "../hooks/useGoogleSheet";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/SensorChart";
import HealthStatus from "../components/HealthStatus";
import { formatLocal } from "../lib/fetchSpreadsheetData";
import { Download, RefreshCcw } from "lucide-react";

const Monitoring: React.FC = () => {
  const { data, isInitialLoading, isRefreshing, error, refresh } = useGoogleSheet();

  // row terbaru
  const latest = React.useMemo(() => (data.length ? data[data.length - 1] : undefined), [data]);

  // info waktu update terakhir (lokal)
  const lastUpdated = React.useMemo(
    () => (latest ? formatLocal(latest.timestamp) : null),
    [latest]
  );

  // ===== Download CSV (semua data yang ada di memori) =====
  const handleDownloadCSV = React.useCallback(() => {
    if (!data || data.length === 0) return;

    const headers = ["timestamp", "suhu ikan", "warna ikan", "status gas", "nilai gas", "avg rgb"];
    const escapeCsv = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = data.map((r) => [
      formatLocal(r.timestamp),
      r.suhu_ikan,
      r.warna_ikan ?? "",
      r.status_gas ?? "",
      r.nilai_gas,
      r.avg_rgb ?? "",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `monitoring-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [data]);

  // state bantuan
  const firstLoading = isInitialLoading && !latest; // load pertama
  const overlay = firstLoading || isRefreshing;     // tampilkan overlay tipis di section

  return (
    <div className="pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Monitoring
            </h1>
            <div className="mt-1 text-sm text-gray-500">
              {lastUpdated ? `Terakhir diperbarui: ${lastUpdated}` : "Memuat data…"}
              {isRefreshing && <span className="ml-2 animate-pulse">menyegarkan…</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              title="Refresh data"
              disabled={isRefreshing}
            >
              <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Menyegarkan…" : "Refresh"}
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={!data || data.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Error banner */}
        {!isInitialLoading && error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
            Terjadi kesalahan saat memuat data.
          </div>
        )}

        {/* Section: Status Kesehatan (pakai STATUS dari sheet) */}
        <section className="space-y-4 relative">
          {overlay && (
            <div className="absolute inset-0 rounded-2xl bg-gray-100/50 animate-pulse pointer-events-none" />
          )}
          <h2 className="text-lg font-semibold text-gray-800">Status Kesehatan</h2>
          {latest ? (
            <HealthStatus
              suhu_ikan={latest.suhu_ikan}      // info (tidak menentukan status)
              nilai_gas={latest.nilai_gas}      // info (tidak menentukan status)
              warna_ikan={latest.warna_ikan}    // status dari sheet
              status_gas={latest.status_gas}    // status dari sheet
            />
          ) : (
            <div className="p-4 rounded-lg border bg-white text-gray-600">Belum ada data.</div>
          )}
        </section>

        {/* Section: Ringkasan Nilai (cards) */}
        <section className="space-y-4 relative">
          {overlay && (
            <div className="absolute inset-0 rounded-2xl bg-gray-100/50 animate-pulse pointer-events-none" />
          )}
          <h2 className="text-lg font-semibold text-gray-800">Ringkasan Nilai Saat Ini</h2>
          {latest ? (
            <SensorCard row={latest} />
          ) : (
            <div className="p-4 rounded-lg border bg-white text-gray-600">Belum ada data.</div>
          )}
        </section>

        {/* Section: Grafik */}
        <section className="space-y-4 relative">
          {overlay && (
            <div className="absolute inset-0 rounded-2xl bg-gray-100/50 animate-pulse pointer-events-none" />
          )}
          <h2 className="text-lg font-semibold text-gray-800">Grafik</h2>
          <SensorChart data={data} />
        </section>
      </div>
    </div>
  );
};

export default Monitoring;
