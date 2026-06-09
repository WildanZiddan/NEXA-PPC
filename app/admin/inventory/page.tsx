"use client";

import { useEffect, useState } from "react";
import { 
  Warehouse, 
  Plus, 
  ListFilter, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Building,
  RefreshCw,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export";

export default function InventoryLedgerPage() {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [selectedItemId, setSelectedItemId] = useState("");
  const [transactionType, setTransactionType] = useState("ADJUSTMENT");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      const [ledgersRes, itemsRes] = await Promise.all([
        fetch("/api/admin/inventory"),
        fetch("/api/admin/items"),
      ]);

      if (!ledgersRes.ok || !itemsRes.ok) throw new Error("Gagal mengambil data kartu stok.");

      const ledgersData = await ledgersRes.json();
      const itemsData = await itemsRes.json();

      setLedgers(ledgersData.data);
      setItems(itemsData.items);

      if (itemsData.items.length > 0 && !selectedItemId) {
        setSelectedItemId(itemsData.items[0].item_id);
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
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: selectedItemId,
          transaction_type: transactionType,
          quantity: parseFloat(quantity),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses penyesuaian stok.");

      setSuccess("Penyesuaian stok berhasil disimpan!");
      setQuantity("");
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
          <p className="text-slate-400 text-sm font-medium">Memuat data kartu stok...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Warehouse className="w-8 h-8 text-blue-500" />
          <span>Kartu Stok & Ledger Inventory</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Pantau histori keluar masuknya bahan baku (IN_PO), komponen terpakai (OUT_WO), barang jadi, serta penyesuaian (ADJUSTMENT).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Form Inventory Adjustment */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-6 rounded-2xl shadow-xl h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            <span>Penyesuaian Stok</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Pilih Item</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Tipe Transaksi</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
              >
                <option value="ADJUSTMENT">ADJUSTMENT (Opname Stok/Manual)</option>
                <option value="IN_PO">IN_PO (Pemasukan Manual)</option>
                <option value="OUT_WO">OUT_WO (Pengurangan Manual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Kuantitas</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all font-bold"
                  placeholder="Contoh: -15 atau +50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <p className="text-3xs text-gray-400 dark:text-slate-500 mt-1">Gunakan tanda minus (-) untuk mengurangi stok persediaan.</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {submitting ? "Memproses..." : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Update Persediaan</span>
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

        {/* Inventory Ledger History Table */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/30 rounded-3xl p-6 shadow-md flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-indigo-400" />
              <span>Riwayat Ledger Mutasi Kartu Stok</span>
            </h2>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  const headers = ["Waktu Transaksi", "Kode Item", "Nama Item", "Tipe Mutasi", "Perubahan (Qty)", "Satuan", "Saldo Stok Berjalan"];
                  const rows = ledgers.map(l => [
                    new Date(l.created_at).toLocaleString("id-ID"),
                    l.item.item_code,
                    l.item.item_name,
                    l.transaction_type,
                    l.quantity,
                    l.item.unit,
                    l.current_stock
                  ]);
                  exportToExcel("Ledger_Inventory", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => {
                  const headers = ["Waktu Transaksi", "Kode Item", "Nama Item", "Tipe Mutasi", "Perubahan (Qty)", "Satuan", "Saldo Stok Berjalan"];
                  const rows = ledgers.map(l => [
                    new Date(l.created_at).toLocaleString("id-ID"),
                    l.item.item_code,
                    l.item.item_name,
                    l.transaction_type,
                    l.quantity,
                    l.item.unit,
                    l.current_stock
                  ]);
                  exportToPDF("Laporan Riwayat Ledger Mutasi Kartu Stok", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {ledgers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-8 bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-800 rounded-2xl">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Belum ada histori kartu stok di dalam ledger.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Waktu Transaksi</th>
                    <th className="pb-3">Item Suku Cadang</th>
                    <th className="pb-3">Tipe Mutasi</th>
                    <th className="pb-3 text-center">Perubahan (Qty)</th>
                    <th className="pb-3 text-right">Saldo Stok Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-200">
                  {ledgers.map((l) => (
                    <tr key={l.ledger_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-3 text-xs text-gray-400 dark:text-slate-500 font-mono">
                        {new Date(l.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 font-medium">
                        <p>{l.item.item_name}</p>
                        <p className="text-2xs text-gray-400 dark:text-slate-500 mt-0.5">{l.item.item_code}</p>
                      </td>
                      <td className="py-3">
                        <span className={`inline-block text-2xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          l.transaction_type === "IN_PO" 
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" 
                            : l.transaction_type === "OUT_WO" 
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" 
                            : "bg-gray-100 dark:bg-slate-700/20 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700/30"
                        }`}>
                          {l.transaction_type}
                        </span>
                      </td>
                      <td className={`py-3 text-center font-bold ${l.quantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
                      </td>
                      <td className="py-3 text-right font-extrabold text-gray-800 dark:text-slate-300">
                        {l.current_stock} {l.item.unit}
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
