"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Plus, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ListFilter,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export";

export default function AggregatePlanningPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [periodDate, setPeriodDate] = useState("2026-06-01");
  const [totalDemand, setTotalDemand] = useState("");
  const [productionTarget, setProductionTarget] = useState("");
  const [strategyUsed, setStrategyUsed] = useState("LEVEL");
  const [allocations, setAllocations] = useState<{ [itemId: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [forecasts, setForecasts] = useState<any[]>([]);

  async function loadData() {
    try {
      const [plansRes, itemsRes] = await Promise.all([
        fetch("/api/admin/aggregate"),
        fetch("/api/admin/items"),
      ]);
      if (!plansRes.ok || !itemsRes.ok) throw new Error("Gagal mengambil data aggregate plans.");
      const plansData = await plansRes.json();
      const itemsData = await itemsRes.json();
      setPlans(plansData.data);
      const finishedGoods = itemsData.items.filter((i: any) => i.item_type === "Finished Good");
      setItems(finishedGoods);
      const initialAlloc: any = {};
      finishedGoods.forEach((item: any) => { initialAlloc[item.item_id] = ""; });
      setAllocations(initialAlloc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadForecasts(dateStr: string) {
    try {
      const res = await fetch(`/api/admin/aggregate/forecasts?period_date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setForecasts(data.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data peramalan untuk periode:", err);
    }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    loadForecasts(periodDate);
  }, [periodDate]);

  const handleApplyForecasts = () => {
    const updatedAlloc: any = {};
    let sum = 0;
    items.forEach((item) => {
      const match = forecasts.find(f => f.item_id === item.item_id);
      if (match) {
        updatedAlloc[item.item_id] = String(match.quantity_forecast);
        sum += match.quantity_forecast;
      } else {
        updatedAlloc[item.item_id] = "";
      }
    });
    setAllocations(updatedAlloc);
    setTotalDemand(String(sum));
    setProductionTarget(String(sum));
  };

  const handleAllocationChange = (itemId: string, val: string) => {
    setAllocations({ ...allocations, [itemId]: val });
    const sum = Object.values({ ...allocations, [itemId]: val })
      .map(v => parseFloat(v) || 0)
      .reduce((a, b) => a + b, 0);
    setTotalDemand(String(sum));
    setProductionTarget(String(sum));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const formattedAllocations = Object.entries(allocations)
        .filter(([_, qty]) => qty !== "")
        .map(([itemId, qty]) => ({ item_id: itemId, allocated_quantity: parseFloat(qty) }));
      if (formattedAllocations.length === 0) throw new Error("Mohon tentukan kuantitas alokasi perakitan minimal untuk satu produk.");
      const res = await fetch("/api/admin/aggregate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_date: periodDate,
          total_demand: parseFloat(totalDemand),
          production_target: parseFloat(productionTarget),
          strategy_used: strategyUsed,
          allocations: formattedAllocations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat Aggregate Plan.");
      setSuccess("Aggregate Plan baru berhasil dirilis!");
      setTotalDemand("");
      setProductionTarget("");
      const resetAlloc: any = {};
      items.forEach((item: any) => { resetAlloc[item.item_id] = ""; });
      setAllocations(resetAlloc);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-400 dark:text-slate-400 text-sm font-medium">Memuat data aggregate plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          <span>Perencanaan Agregat (Aggregate Planning)</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Rancang rencana alokasi kapasitas produksi bulanan untuk menyeimbangkan penawaran dan permintaan pabrik.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 p-6 rounded-2xl shadow-sm dark:shadow-xl h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <span>Buat Rencana Bulanan</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-300 mb-1.5 uppercase">Periode Bulan</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 dark:text-slate-200 text-sm transition-all"
                value={periodDate}
                onChange={(e) => setPeriodDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-300 mb-1.5 uppercase">Strategi PPC</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 dark:text-slate-200 text-sm transition-all"
                value={strategyUsed}
                onChange={(e) => setStrategyUsed(e.target.value)}
              >
                <option value="LEVEL">LEVEL (Kapasitas Konstan)</option>
                <option value="CHASE">CHASE (Kapasitas Sesuai Permintaan)</option>
                <option value="HYBRID">HYBRID (Kombinasi Level & Chase)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Detail Alokasi Finished Good</label>
                {forecasts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyForecasts}
                    className="px-2.5 py-1 text-3xs font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 rounded-md transition-all cursor-pointer shadow-sm uppercase tracking-wider"
                  >
                    Terapkan Peramalan
                  </button>
                )}
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500">Tidak ada Finished Goods di database. Silakan jalankan seed.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.item_id} className="flex items-center justify-between gap-4">
                      <div className="truncate max-w-[150px]">
                        <p className="text-xs text-gray-600 dark:text-slate-350 truncate" title={item.item_name}>
                          {item.item_name}
                        </p>
                        {(() => {
                          const f = forecasts.find(x => x.item_id === item.item_id);
                          return f ? (
                            <span className="text-3xs text-blue-600 dark:text-blue-400 font-bold block mt-0.5">
                              Peramalan: {f.quantity_forecast} {item.unit}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          className="w-20 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white font-bold text-xs text-center outline-none"
                          placeholder="0"
                          value={allocations[item.item_id] || ""}
                          onChange={(e) => handleAllocationChange(item.item_id, e.target.value)}
                        />
                        <span className="text-3xs text-gray-400 dark:text-slate-500 uppercase">{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-semibold text-gray-400 dark:text-slate-400 mb-1.5 uppercase">Total Demand</label>
                <input
                  type="number"
                  readOnly
                  className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-400 text-xs font-bold text-center outline-none cursor-not-allowed"
                  value={totalDemand}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-gray-400 dark:text-slate-400 mb-1.5 uppercase">Target Produksi</label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-xs font-bold text-center outline-none"
                  value={productionTarget}
                  onChange={(e) => setProductionTarget(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {submitting ? "Memproses..." : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Rilis Rencana</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800/20 border border-gray-100 dark:border-slate-700/30 rounded-3xl p-6 shadow-sm dark:shadow-md flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <span>Rencana Agregat Aktif</span>
            </h2>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  const headers = ["ID Rencana", "Periode", "Strategi", "Target Produksi (Total)", "Alokasi Detail"];
                  const rows = plans.map(p => [
                    `AG-${p.aggregate_id.slice(0, 8).toUpperCase()}`,
                    new Date(p.period_date).toISOString().split('T')[0].slice(0, 7),
                    p.strategy_used,
                    p.production_target,
                    p.details.map((det: any) => `${det.item.item_name}: ${det.allocated_quantity} ${det.item.unit}`).join("; ")
                  ]);
                  exportToExcel("Aggregate_Production_Plans", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => {
                  const headers = ["ID Rencana", "Periode", "Strategi", "Target Produksi (Total)", "Alokasi Detail"];
                  const rows = plans.map(p => [
                    `AG-${p.aggregate_id.slice(0, 8).toUpperCase()}`,
                    new Date(p.period_date).toISOString().split('T')[0].slice(0, 7),
                    p.strategy_used,
                    p.production_target,
                    p.details.map((det: any) => `${det.item.item_name}: ${det.allocated_quantity} ${det.item.unit}`).join("; ")
                  ]);
                  exportToPDF("Laporan Perencanaan Agregat Bulanan (Aggregate Plan)", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {plans.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-8 bg-gray-50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-800 rounded-2xl">
              <p className="text-gray-400 dark:text-slate-400 text-sm">Belum ada Aggregate Plan yang dirilis. Silakan buat satu di sebelah kiri.</p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-[500px] pr-1">
              {plans.map((p) => (
                <div key={p.aggregate_id} className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-700/50 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-700/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        Periode: {new Date(p.period_date).toISOString().split('T')[0].slice(0, 7)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-slate-300">
                      <span>Strategi: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{p.strategy_used}</span></span>
                      <span>Target: <span className="text-green-600 dark:text-green-400 font-bold">{p.production_target} UNIT</span></span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-3xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Detail Alokasi Produk:</p>
                    <div className="flex flex-wrap gap-2">
                      {p.details.map((det: any) => (
                        <div key={det.aggregate_detail_id} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 text-xs flex items-center gap-2">
                          <span className="text-gray-500 dark:text-slate-400">{det.item.item_name}:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{det.allocated_quantity} {det.item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
