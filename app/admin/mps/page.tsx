"use client";

import { useEffect, useState } from "react";
import { 
  Calendar, 
  Plus, 
  ListFilter, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export";

export default function MPSPage() {
  const [mpsList, setMpsList] = useState<any[]>([]);
  const [aggregatePlans, setAggregatePlans] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [selectedAggId, setSelectedAggId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [dueDate, setDueDate] = useState("2026-06-15");
  const [quantityDemanded, setQuantityDemanded] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      const [mpsRes, aggRes, itemsRes] = await Promise.all([
        fetch("/api/admin/mps"),
        fetch("/api/admin/aggregate"),
        fetch("/api/admin/items"),
      ]);

      if (!mpsRes.ok || !aggRes.ok || !itemsRes.ok) throw new Error("Gagal mengambil data pendukung MPS.");

      const mpsData = await mpsRes.json();
      const aggData = await aggRes.json();
      const itemsData = await itemsRes.json();

      setMpsList(mpsData.data);
      setAggregatePlans(aggData.data);
      
      const finishedGoods = itemsData.items.filter((i: any) => i.item_type === "Finished Good" || i.item_type === "Component");
      setItems(finishedGoods);

      if (aggData.data.length > 0) {
        setSelectedAggId(aggData.data[0].aggregate_id);
      }
      if (finishedGoods.length > 0) {
        setSelectedItemId(finishedGoods[0].item_id);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/mps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aggregate_id: selectedAggId,
          item_id: selectedItemId,
          due_date: dueDate,
          quantity_demanded: parseFloat(quantityDemanded),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat MPS.");

      setSuccess("Jadwal Induk Mingguan (MPS) berhasil disimpan!");
      setQuantityDemanded("");
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
          <p className="text-slate-400 text-sm font-medium">Memuat data MPS...</p>
        </div>
      </div>
    );
  }

  // Find current selected aggregate plan details
  const currentAggPlan = aggregatePlans.find(p => p.aggregate_id === selectedAggId);
  const currentAllocation = currentAggPlan?.details?.find((d: any) => d.item_id === selectedItemId);
  const allocatedQty = currentAllocation ? currentAllocation.allocated_quantity : 0;

  // Calculate already scheduled quantity for this item under this aggregate plan
  const alreadyScheduled = mpsList
    .filter(m => m.aggregate_id === selectedAggId && m.item_id === selectedItemId)
    .reduce((sum, m) => sum + m.quantity_demanded, 0);

  const remainingAllocation = allocatedQty - alreadyScheduled;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-500" />
          <span>Jadwal Induk Mingguan (Master Production Schedule - MPS)</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Rinci rencana agregat bulanan menjadi jadwal produksi mingguan per-item barang jadi atau sub-assembly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Create MPS */}
        <div className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-6 rounded-2xl shadow-xl h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            <span>Jadwakan Produksi</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Rencana Agregat Acuan</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
                value={selectedAggId}
                onChange={(e) => setSelectedAggId(e.target.value)}
              >
                {aggregatePlans.map((agg) => (
                  <option key={agg.aggregate_id} value={agg.aggregate_id}>
                    Periode {new Date(agg.period_date).toISOString().split('T')[0].slice(0, 7)} ({agg.strategy_used})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Produk / Sub-Assembly</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                {items.map((i) => (
                  <option key={i.item_id} value={i.item_id}>
                    [{i.item_code}] {i.item_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedAggId && selectedItemId && currentAggPlan && (
              <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs space-y-2.5">
                <p className="font-bold text-2xs uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b border-blue-100/50 dark:border-blue-900/20 pb-1.5">
                  Status Kontrol Agregat ({new Date(currentAggPlan.period_date).toISOString().split('T')[0].slice(0, 7)})
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-slate-400">Target Alokasi Agregat:</span>
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    {allocatedQty} {currentAllocation?.item.unit || "UNIT"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-slate-400">Total Terjadwal (MPS):</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {alreadyScheduled} {currentAllocation?.item.unit || "UNIT"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 dark:border-slate-700/60 font-semibold text-2xs uppercase tracking-wide">
                  <span className="text-gray-750 dark:text-slate-350">Sisa Kuota Belum Terjadwal:</span>
                  <span className={`font-black text-sm ${remainingAllocation > 0 ? "text-green-600 dark:text-green-400" : remainingAllocation === 0 ? "text-gray-500 dark:text-slate-400" : "text-rose-600 dark:text-rose-450"}`}>
                    {remainingAllocation} {currentAllocation?.item.unit || "UNIT"}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Tanggal Jatuh Tempo (Due Date)</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all font-mono"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Jumlah Permintaan Produksi</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all font-bold"
                  placeholder="Kuantitas"
                  value={quantityDemanded}
                  onChange={(e) => setQuantityDemanded(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || aggregatePlans.length === 0}
              className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {submitting ? "Memproses..." : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan Jadwal</span>
                </>
              )}
            </button>
          </form>

          {/* Form Feedbacks */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* List of Existing MPS schedules */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/30 rounded-3xl p-6 shadow-md flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-indigo-400" />
              <span>Jadwal Induk Produksi Aktif (MPS)</span>
            </h2>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  const headers = ["Kode Item", "Nama Item", "Acuan Agregat", "Jatuh Tempo (Due)", "Target Kuantitas", "Satuan"];
                  const rows = mpsList.map(m => [
                    m.item.item_code,
                    m.item.item_name,
                    m.aggregatePlan ? `AG-${m.aggregatePlan.aggregate_id.slice(0, 8).toUpperCase()}` : "-",
                    new Date(m.due_date).toISOString().split('T')[0],
                    m.quantity_demanded,
                    m.item.unit
                  ]);
                  exportToExcel("Master_Production_Schedule", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => {
                  const headers = ["Kode Item", "Nama Item", "Acuan Agregat", "Jatuh Tempo (Due)", "Target Kuantitas", "Satuan"];
                  const rows = mpsList.map(m => [
                    m.item.item_code,
                    m.item.item_name,
                    m.aggregatePlan ? `AG-${m.aggregatePlan.aggregate_id.slice(0, 8).toUpperCase()}` : "-",
                    new Date(m.due_date).toISOString().split('T')[0],
                    m.quantity_demanded,
                    m.item.unit
                  ]);
                  exportToPDF("Laporan Jadwal Induk Produksi Mingguan (MPS)", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {mpsList.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-8 bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-800 rounded-2xl">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Belum ada jadwal induk perakitan (MPS) yang didefinisikan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Jadwal Item</th>
                    <th className="pb-3 text-center">Acuan Agregat</th>
                    <th className="pb-3 text-center">Jatuh Tempo (Due)</th>
                    <th className="pb-3 text-right">Target Kuantitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-200">
                  {mpsList.map((m) => (
                    <tr key={m.mps_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-3.5 font-medium">
                        <p>{m.item.item_name}</p>
                        <p className="text-2xs text-gray-400 dark:text-slate-500 mt-0.5">{m.item.item_code}</p>
                      </td>
                      <td className="py-3.5 text-center text-xs text-indigo-500 dark:text-indigo-400 font-bold">
                        {`AG-${m.aggregatePlan.aggregate_id.slice(0, 4).toUpperCase()}`}
                      </td>
                      <td className="py-3.5 text-center text-xs text-gray-500 dark:text-slate-300 font-mono">
                        {new Date(m.due_date).toISOString().split('T')[0]}
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-blue-500 dark:text-blue-400 text-sm">
                        {m.quantity_demanded} {m.item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
