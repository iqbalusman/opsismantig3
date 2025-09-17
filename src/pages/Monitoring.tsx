// src/pages/Monitoring.tsx
import React from "react";
import { useGoogleSheet } from "../hooks/useGoogleSheet";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/SensorChart";
import HealthStatus from "../components/HealthStatus";
import { formatLocal } from "../lib/fetchSpreadsheetData";
import { Download, HeartPulse, Activity, BarChart2, Info } from "lucide-react";

/* ===== Helpers ===== */
const toNum = (v: any): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(",", ".")); 
  return Number.isFinite(n) ? n : null;
};
const pickField = (row: Record<string, any> | undefined, candidates: string[]) => {
  if (!row) return null;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const keys = Object.keys(row);
  for (const c of candidates) {
    const hit = keys.find((k) => norm(k) === norm(c));
    if (hit && row[hit] !== undefined && row[hit] !== null && row[hit] !== "") return row[hit];
  }
  return null;
};

const Monitoring: React.FC = () => {
  const { data, isInitialLoading, error, lastUpdatedStr } = useGoogleSheet({ intervalMs: 2000 });
  const latest = React.useMemo(() => (data.length ? data[data.length - 1] : undefined), [data]);

  // ===== Download CSV =====
  const handleDownloadCSV = React.useCallback(() => {
    try {
      if (!data || data.length === 0) return;
      const headers = ["timestamp", "suhu ikan", "nilai gas", "avg rgb", "status gas", "status (H)"];
      const escapeCsv = (v: unknown) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const rows = data.map((r) => [
        formatLocal((r as any).timestamp as any),
        (r as any).suhu_ikan ?? "",
        (r as any).nilai_gas ?? "",
        (r as any).avg_rgb ?? "",
        (r as any).status_gas ?? "",
        (r as any).status_h ?? "",
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
    } catch {/* no-op */}
  }, [data]);

  const overlay = isInitialLoading;

  // ==== Nilai untuk HealthStatus ====
  const avgVal = toNum(pickField(latest as any, ["avg_rgb", "avg rgb", "F (AVG RGB)", "f"]));
  const gasVal = toNum(pickField(latest as any, ["nilai_gas", "nilai gas", "E (Nilai Gas)", "e"]));
  const tempVal = toNum(pickField(latest as any, ["suhu_ikan", "suhu ikan", "temperature"]));

  return (
    <div className="relative min-h-[100dvh]">
      {/* Background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, #E0F2FE 0%, #CFEAFE 22%, #B6E2FD 48%, #93CDFB 74%, #67B6F6 100%)",
        }}
      />

      {/* Header */}
      <header className="pt-10 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-sky-100 bg-white shadow-sm p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
                  <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent">
                    Monitoring
                  </span>
                </h1>
                <p className="mt-1 text-sm text-slate-600 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-600" />
                  {lastUpdatedStr ? (
                    <>Terakhir diperbarui: <span className="font-semibold text-slate-900">{lastUpdatedStr}</span></>
                  ) : ("Memuat data…")}
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
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

            <div className="mt-5 h-1.5 w-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {!isInitialLoading && error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
              Terjadi kesalahan saat memuat data.
            </div>
          )}

          {/* Status Kesehatan */}
          <section className="space-y-3 relative">
            {overlay && (
              <div className="absolute inset-0 rounded-2xl bg-white/55 ring-1 ring-sky-100 animate-pulse pointer-events-none" />
            )}
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-sky-100 shadow-sm">
                <HeartPulse className="w-4 h-4 text-sky-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Status Kesehatan</h2>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white shadow-sm p-4">
              {latest ? (
                <HealthStatus
                  avg_rgb={avgVal}
                  nilai_gas={gasVal}
                  suhu_ikan={tempVal}
                  fishName="Ikan Fufu"
                  animate
                />
              ) : (
                <div className="p-4 rounded-2xl border bg-white text-gray-600">Belum ada data.</div>
              )}
            </div>
          </section>

          {/* Ringkasan Nilai */}
          <section className="space-y-3 relative">
            {overlay && (
              <div className="absolute inset-0 rounded-2xl bg-white/55 ring-1 ring-sky-100 animate-pulse pointer-events-none" />
            )}
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-sky-100 shadow-sm">
                <Activity className="w-4 h-4 text-blue-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Ringkasan Nilai Saat Ini</h2>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white shadow-sm p-4">
              {latest ? <SensorCard row={latest as any} /> : <div className="p-4 rounded-2xl border bg-white text-gray-600">Belum ada data.</div>}
            </div>
          </section>

          {/* Grafik */}
          <section className="space-y-3 relative">
            {overlay && (
              <div className="absolute inset-0 rounded-2xl bg-white/55 ring-1 ring-sky-100 animate-pulse pointer-events-none" />
            )}
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-sky-100 shadow-sm">
                <BarChart2 className="w-4 h-4 text-sky-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Grafik</h2>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white shadow-sm p-4">
              <SensorChart data={data as any} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Monitoring;
