// src/pages/Monitoring.tsx (no blur + enhanced header)
import React from "react";
import { useGoogleSheet } from "../hooks/useGoogleSheet";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/SensorChart";
import HealthStatus from "../components/HealthStatus";
import { formatLocal } from "../lib/fetchSpreadsheetData";
import { Download, RefreshCcw, HeartPulse, Activity, BarChart2, Info } from "lucide-react";

const Monitoring: React.FC = () => {
  const { data, isInitialLoading, isRefreshing, error, refresh } = useGoogleSheet();

  // row terbaru
  const latest = React.useMemo(() => (data.length ? data[data.length - 1] : undefined), [data]);

  // info waktu update terakhir (lokal)
  const lastUpdated = React.useMemo(() => (latest ? formatLocal(latest.timestamp) : null), [latest]);

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
  const overlay = firstLoading || isRefreshing; // overlay tipis di section

  return (
    <div className="relative min-h-[100dvh]">
      {/* ===== Page background: crisp blue → sky (NO blur) ===== */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, #E0F2FE 0%, #CFEAFE 22%, #B6E2FD 48%, #93CDFB 74%, #67B6F6 100%)",
        }}
      />

      {/* ===== Header ===== */}
      <header className="pt-10 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-sky-100 bg-white shadow-sm p-6">
            {/* top meta */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
                  <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent">Monitoring</span>
                </h1>
                <p className="mt-1 text-sm text-slate-600 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-600" />
                  {lastUpdated ? (
                    <>
                      Terakhir diperbarui: <span className="font-semibold text-slate-900">{lastUpdated}</span>
                      {isRefreshing && <span className="ml-2 animate-pulse">• menyegarkan…</span>}
                    </>
                  ) : (
                    "Memuat data…"
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refresh}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow hover:shadow-md active:scale-[0.99] transition disabled:opacity-60"
                  title="Refresh data"
                  disabled={isRefreshing}
                >
                  <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Menyegarkan…" : "Refresh"}
                </button>
                <button
                  onClick={handleDownloadCSV}
                  disabled={!data || data.length === 0}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-sky-200 bg-white text-sky-800 hover:bg-sky-50 shadow-sm disabled:opacity-50"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>
            </div>

            {/* decorative bottom gradient bar */}
            <div className="mt-5 h-1.5 w-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Error banner */}
          {!isInitialLoading && error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">Terjadi kesalahan saat memuat data.</div>
          )}

          {/* Section: Status Kesehatan */}
          <section className="space-y-3 relative">
            {overlay && <div className="absolute inset-0 rounded-2xl bg-white/55 ring-1 ring-sky-100 animate-pulse pointer-events-none" />}
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-sky-100 shadow-sm">
                <HeartPulse className="w-4 h-4 text-sky-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Status Kesehatan</h2>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white shadow-sm p-4">
              {latest ? (
                <HealthStatus
                  suhu_ikan={latest.suhu_ikan}
                  nilai_gas={latest.nilai_gas}
                  warna_ikan={latest.warna_ikan}
                  status_gas={latest.status_gas}
                />
              ) : (
                <div className="p-4 rounded-2xl border bg-white text-gray-600">Belum ada data.</div>
              )}
            </div>
          </section>

          {/* Section: Ringkasan Nilai (cards) */}
          <section className="space-y-3 relative">
            {overlay && <div className="absolute inset-0 rounded-2xl bg-white/55 ring-1 ring-sky-100 animate-pulse pointer-events-none" />}
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-sky-100 shadow-sm">
                <Activity className="w-4 h-4 text-blue-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Ringkasan Nilai Saat Ini</h2>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white shadow-sm p-4">
              {latest ? (
                <SensorCard row={latest} />
              ) : (
                <div className="p-4 rounded-2xl border bg-white text-gray-600">Belum ada data.</div>
              )}
            </div>
          </section>

          {/* Section: Grafik */}
          <section className="space-y-3 relative">
            {overlay && <div className="absolute inset-0 rounded-2xl bg-white/55 ring-1 ring-sky-100 animate-pulse pointer-events-none" />}
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-sky-100 shadow-sm">
                <BarChart2 className="w-4 h-4 text-sky-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Grafik</h2>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white shadow-sm p-4">
              <SensorChart data={data} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Monitoring;
