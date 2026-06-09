"use client";

import { useEffect, useState } from "react";
import { 
  Boxes, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Calendar,
  Layers,
  ArrowRight,
  Truck,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export";

export default function MRPPage() {
  const [mpsList, setMpsList] = useState<any[]>([]);
  const [mrpRecords, setMrpRecords] = useState<any[]>([]);
  const [selectedMpsId, setSelectedMpsId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [runningMrp, setRunningMrp] = useState(false);

  async function loadData() {
    try {
      const [mpsRes, mrpRes] = await Promise.all([
        fetch("/api/admin/mps"),
        fetch("/api/admin/mrp")
      ]);

      if (!mpsRes.ok || !mrpRes.ok) throw new Error("Gagal mengambil data pendukung MRP.");

      const mpsData = await mpsRes.json();
      const mrpData = await mrpRes.json();

      setMpsList(mpsData.data);
      setMrpRecords(mrpData.data);

      if (mpsData.data.length > 0 && !selectedMpsId) {
        setSelectedMpsId(mpsData.data[0].mps_id);
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

  const handleRunMRP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMpsId) return;

    setRunningMrp(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/mrp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mps_id: selectedMpsId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menjalankan perhitungan MRP.");

      setSuccess("Perhitungan MRP (BOM Explosion & Netting) sukses dijalankan!");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunningMrp(false);
    }
  };

  const filteredMrpRecords = selectedMpsId 
    ? mrpRecords.filter(m => m.mps_id === selectedMpsId)
    : mrpRecords;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat data MRP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Boxes className="w-8 h-8 text-blue-500" />
          <span>Perencanaan Kebutuhan Bahan (Material Requirements Planning - MRP)</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Lakukan penguraian kebutuhan bahan baku (Bill of Materials - BOM), netting persediaan saat ini, dan penentuan tanggal pemesanan mundur (Lead Time Offsetting).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Trigger MRP Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-6 rounded-2xl shadow-xl h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-400" />
            <span>Jalankan MRP</span>
          </h2>

          {mpsList.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400">Belum ada MPS. Silakan buat MPS terlebih dahulu.</p>
            </div>
          ) : (
            <form onSubmit={handleRunMRP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Pilih Jadwal MPS</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
                  value={selectedMpsId}
                  onChange={(e) => setSelectedMpsId(e.target.value)}
                >
                  {mpsList.map((m) => (
                    <option key={m.mps_id} value={m.mps_id}>
                      [{m.item.item_code}] Qty {m.quantity_demanded} | Due {new Date(m.due_date).toISOString().split('T')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={runningMrp || !selectedMpsId}
                className="w-full py-3 px-4 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {runningMrp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Urai BOM & Hitung Netting</span>
              </button>
            </form>
          )}

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

        {/* MRP Results Table */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/30 rounded-3xl p-6 shadow-md flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Hasil Kalkulasi MRP (BOM & Netting)</span>
            </h2>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                disabled={filteredMrpRecords.length === 0}
                onClick={() => {
                  const headers = ["Kode Item", "Nama Item", "Tipe Item", "Gross Requirement", "Net Requirement", "Satuan", "Tanggal Rilis (Release)", "Tanggal Butuh (Due)"];
                  const rows = filteredMrpRecords.map(mrp => [
                    mrp.item.item_code,
                    mrp.item.item_name,
                    mrp.item.item_type,
                    mrp.gross_requirement,
                    mrp.net_requirement,
                    mrp.item.unit,
                    new Date(mrp.order_release_date).toISOString().split('T')[0],
                    new Date(mrp.due_date).toISOString().split('T')[0]
                  ]);
                  exportToExcel("MRP_Calculations", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                disabled={filteredMrpRecords.length === 0}
                onClick={() => {
                  const headers = ["Kode Item", "Nama Item", "Tipe Item", "Gross Requirement", "Net Requirement", "Satuan", "Tanggal Rilis (Release)", "Tanggal Butuh (Due)"];
                  const rows = filteredMrpRecords.map(mrp => [
                    mrp.item.item_code,
                    mrp.item.item_name,
                    mrp.item.item_type,
                    mrp.gross_requirement,
                    mrp.net_requirement,
                    mrp.item.unit,
                    new Date(mrp.order_release_date).toISOString().split('T')[0],
                    new Date(mrp.due_date).toISOString().split('T')[0]
                  ]);
                  exportToPDF("Laporan Kebutuhan Bahan (MRP)", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {filteredMrpRecords.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-12 bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-800 border-dashed rounded-2xl">
              <div>
                <Boxes className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-700 dark:text-slate-300 font-semibold text-sm">Belum Ada Hasil MRP</p>
                <p className="text-gray-500 dark:text-slate-500 text-xs mt-2 max-w-xs mx-auto">
                  Silakan pilih jadwal induk produksi di sebelah kiri, kemudian klik tombol "Urai BOM & Hitung Netting" untuk meluncurkan perhitungan.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Item Suku Cadang</th>
                    <th className="pb-3">Tipe</th>
                    <th className="pb-3 text-center">Gross</th>
                    <th className="pb-3 text-center">Net (Kebutuhan Bersih)</th>
                    <th className="pb-3 text-center">Tanggal Rilis (Release)</th>
                    <th className="pb-3 text-center">Tanggal Butuh (Due)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-200">
                  {filteredMrpRecords.map((mrp) => (
                    <tr key={mrp.mrp_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-3.5 font-medium">
                        <p>{mrp.item.item_name}</p>
                        <p className="text-2xs text-gray-400 dark:text-slate-500 font-mono mt-0.5">{mrp.item.item_code}</p>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-block text-2xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          mrp.item.item_type === "Finished Good" 
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" 
                            : mrp.item.item_type === "Component" 
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" 
                            : "bg-gray-100 dark:bg-slate-700/20 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700/30"
                        }`}>
                          {mrp.item.item_type}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-medium text-gray-600 dark:text-slate-400">{mrp.gross_requirement}</td>
                      <td className="py-3.5 text-center font-extrabold text-blue-600 dark:text-blue-400">{mrp.net_requirement}</td>
                      <td className="py-3.5 text-center text-xs text-amber-600 dark:text-amber-400 font-mono font-semibold">
                        {new Date(mrp.order_release_date).toISOString().split('T')[0]}
                      </td>
                      <td className="py-3.5 text-center text-xs text-gray-600 dark:text-slate-300 font-mono">
                        {new Date(mrp.due_date).toISOString().split('T')[0]}
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
