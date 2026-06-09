"use client";
import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  ClipboardList, 
  Plus, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Truck, 
  CheckCircle, 
  Play, 
  Calendar, 
  Layers, 
  Warehouse,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export";

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<"po" | "wo">("po");
  
  // Data list states
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  
  // Loader states
  const [loading, setLoading] = useState(true);
  const [submittingPo, setSubmittingPo] = useState(false);
  const [submittingWo, setSubmittingWo] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Message states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states - PO
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poItemId, setPoItemId] = useState("");
  const [poQuantity, setPoQuantity] = useState("");

  // Form states - WO
  const [woItemId, setWoItemId] = useState("");
  const [woWorkCenterId, setWoWorkCenterId] = useState("");
  const [woQuantity, setWoQuantity] = useState("");
  const [woStartDate, setWoStartDate] = useState("");
  const [woEndDate, setWoEndDate] = useState("");

  async function loadAllData() {
    setError("");
    try {
      const [poRes, woRes, masterRes, usersRes] = await Promise.all([
        fetch("/api/admin/purchase-orders"),
        fetch("/api/admin/work-orders"),
        fetch("/api/admin/master"),
        fetch("/api/admin/users")
      ]);

      if (!poRes.ok || !woRes.ok || !masterRes.ok || !usersRes.ok) {
        throw new Error("Gagal mengambil data dari server.");
      }

      const poData = await poRes.json();
      const woData = await woRes.json();
      const masterData = await masterRes.json();
      const usersData = await usersRes.json();

      setPurchaseOrders(poData.data || []);
      setWorkOrders(woData.data || []);
      setItems(masterData.items || []);
      setWorkCenters(masterData.workCenters || []);
      setSuppliers(usersData.suppliers || []);

      // Defaults
      if (usersData.suppliers.length > 0 && !poSupplierId) {
        setPoSupplierId(usersData.suppliers[0].supplier_id);
      }
      
      const rawMaterials = masterData.items.filter((i: any) => i.item_type === "Raw Material");
      if (rawMaterials.length > 0 && !poItemId) {
        setPoItemId(rawMaterials[0].item_id);
      }

      const buildableItems = masterData.items.filter((i: any) => i.item_type !== "Raw Material");
      if (buildableItems.length > 0 && !woItemId) {
        setWoItemId(buildableItems[0].item_id);
      }

      if (masterData.workCenters.length > 0 && !woWorkCenterId) {
        setWoWorkCenterId(masterData.workCenters[0].work_center_id);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmittingPo(true);

    try {
      const res = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: poSupplierId,
          items: [{ item_id: poItemId, quantity: poQuantity }]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal merilis PO.");

      setSuccess("Purchase Order berhasil dirilis ke supplier!");
      setPoQuantity("");
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingPo(false);
    }
  };

  const handleCreateWO = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmittingWo(true);

    try {
      const res = await fetch("/api/admin/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: woItemId,
          work_center_id: woWorkCenterId,
          quantity_to_produce: woQuantity,
          start_date: woStartDate,
          end_date: woEndDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal merilis WO.");

      setSuccess("Work Order perakitan berhasil dirilis!");
      setWoQuantity("");
      setWoStartDate("");
      setWoEndDate("");
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingWo(false);
    }
  };

  const handleReceivePO = async (poId: string) => {
    setError("");
    setSuccess("");
    setActionLoadingId(poId);

    try {
      const res = await fetch(`/api/admin/purchase-orders/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RECEIVED" })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menerima PO.");

      setSuccess("Barang PO sukses diterima! Saldo kartu stok otomatis terupdate.");
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateWOStatus = async (woId: string, status: "IN_PROGRESS" | "COMPLETED") => {
    setError("");
    setSuccess("");
    setActionLoadingId(woId);

    try {
      const res = await fetch(`/api/admin/work-orders/${woId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui WO.");

      if (status === "COMPLETED") {
        setSuccess("Work Order selesai rakit! Komponen telah dikonsumsi dan barang jadi bertambah di ledger.");
      } else {
        setSuccess("Work Order berhasil diubah status menjadi IN PROGRESS.");
      }
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat data pesanan & perakitan...</p>
        </div>
      </div>
    );
  }

  const rawMaterials = items.filter((i: any) => i.item_type === "Raw Material");
  const buildableItems = items.filter((i: any) => i.item_type !== "Raw Material");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-blue-500" />
          <span>Manajemen Pembelian (PO) & Perakitan (WO)</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Rilis Purchase Order bahan baku ke supplier, pantau status pengiriman, rilis Work Order perakitan internal, dan selesaikan rakitan sepeda.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab("po"); setError(""); setSuccess(""); }}
          className={`py-3 px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "po" 
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/5" 
              : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Purchase Orders (Pemesanan Supplier)</span>
        </button>
        <button
          onClick={() => { setActiveTab("wo"); setError(""); setSuccess(""); }}
          className={`py-3 px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "wo" 
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/5" 
              : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Work Orders (Perakitan Pabrik)</span>
        </button>
      </div>

      {/* Alert Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm flex items-start gap-2.5 max-w-xl">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="whitespace-pre-line">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-start gap-2.5 max-w-xl">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* TAB CONTENT: PURCHASE ORDER */}
      {activeTab === "po" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* PO Form */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-6 rounded-2xl shadow-xl h-fit space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              <span>Rilis PO Baru</span>
            </h2>

            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Pilih Supplier</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-850 dark:text-slate-200 text-sm transition-all"
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.supplier_name} (Lead Time: {s.lead_time_days} Hari)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Pilih Item Bahan Baku</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-850 dark:text-slate-200 text-sm transition-all"
                  value={poItemId}
                  onChange={(e) => setPoItemId(e.target.value)}
                  required
                >
                  {rawMaterials.map((i) => (
                    <option key={i.item_id} value={i.item_id}>
                      [{i.item_code}] {i.item_name} ({i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Kuantitas Pesanan</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  placeholder="Kuantitas bahan baku"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-850 dark:text-slate-200 text-sm font-semibold transition-all"
                  value={poQuantity}
                  onChange={(e) => setPoQuantity(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submittingPo}
                className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {submittingPo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Rilis PO ke Supplier</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* PO List */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/30 rounded-3xl p-6 shadow-md flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Daftar Purchase Order</span>
              </h2>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    const headers = ["Nomor PO", "Tanggal PO", "Supplier Mitra", "Detail Item Dipesan", "Status"];
                    const rows = purchaseOrders.map(po => [
                      `PO-${po.po_id.slice(0, 8).toUpperCase()}`,
                      new Date(po.po_date).toISOString().split('T')[0],
                      po.supplier.supplier_name,
                      po.purchaseOrderDetails.map((d: any) => `${d.item.item_name} (${d.quantity_ordered} ${d.item.unit})`).join("; "),
                      po.status
                    ]);
                    exportToExcel("Purchase_Orders", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => {
                    const headers = ["Nomor PO", "Tanggal PO", "Supplier Mitra", "Detail Item Dipesan", "Status"];
                    const rows = purchaseOrders.map(po => [
                      `PO-${po.po_id.slice(0, 8).toUpperCase()}`,
                      new Date(po.po_date).toISOString().split('T')[0],
                      po.supplier.supplier_name,
                      po.purchaseOrderDetails.map((d: any) => `${d.item.item_name} (${d.quantity_ordered} ${d.item.unit})`).join("; "),
                      po.status
                    ]);
                    exportToPDF("Laporan Daftar Purchase Order", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {purchaseOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center p-8 bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-800 rounded-2xl">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Belum ada Purchase Order (PO) yang dirilis.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="pb-3">Nomor PO / Tanggal</th>
                      <th className="pb-3">Supplier Mitra</th>
                      <th className="pb-3">Item Dipesan</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Aksi Penerimaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-200">
                    {purchaseOrders.map((po) => (
                      <tr key={po.po_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="py-4">
                          <p className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">PO-{po.po_id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-2xs text-gray-400 dark:text-slate-500 mt-0.5">{new Date(po.po_date).toISOString().split('T')[0]}</p>
                        </td>
                        <td className="py-4 font-medium text-gray-750 dark:text-slate-300">
                          {po.supplier.supplier_name}
                        </td>
                        <td className="py-4 text-gray-500 dark:text-slate-400 text-xs">
                          {po.purchaseOrderDetails.map((d: any) => (
                            <div key={d.po_detail_id} className="font-medium text-gray-700 dark:text-slate-300">
                              {d.item.item_name} <span className="text-blue-600 dark:text-blue-400 font-bold">({d.quantity_ordered} {d.item.unit})</span>
                            </div>
                          ))}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-block text-2xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            po.status === "RECEIVED" 
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" 
                              : po.status === "SHIPPED" 
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" 
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {po.status === "SHIPPED" && (
                            <button
                              onClick={() => handleReceivePO(po.po_id)}
                              disabled={actionLoadingId !== null}
                              className="py-1.5 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {actionLoadingId === po.po_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Warehouse className="w-3.5 h-3.5" />
                              )}
                              <span>Terima Barang</span>
                            </button>
                          )}
                          {po.status === "PENDING" && (
                            <span className="text-xs text-amber-600 dark:text-amber-500 font-medium italic">Menunggu Pengiriman Supplier</span>
                          )}
                          {po.status === "RECEIVED" && (
                            <span className="text-xs text-green-600 dark:text-green-500 font-bold flex items-center gap-1 justify-end">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Selesai Diterima</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: WORK ORDER */}
      {activeTab === "wo" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* WO Form */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-6 rounded-2xl shadow-xl h-fit space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              <span>Rilis WO Baru</span>
            </h2>

            <form onSubmit={handleCreateWO} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Pilih Item Perakitan</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-850 dark:text-slate-200 text-sm transition-all"
                  value={woItemId}
                  onChange={(e) => setWoItemId(e.target.value)}
                  required
                >
                  {buildableItems.map((i) => (
                    <option key={i.item_id} value={i.item_id}>
                      [{i.item_code}] {i.item_name} ({i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Work Center (Lini Perakitan)</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-850 dark:text-slate-200 text-sm transition-all"
                  value={woWorkCenterId}
                  onChange={(e) => setWoWorkCenterId(e.target.value)}
                  required
                >
                  {workCenters.map((wc) => (
                    <option key={wc.work_center_id} value={wc.work_center_id}>
                      {wc.work_center_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Target Produksi</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="Kuantitas produksi"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-850 dark:text-slate-200 text-sm font-semibold transition-all"
                  value={woQuantity}
                  onChange={(e) => setWoQuantity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Tanggal Mulai</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-850 dark:text-slate-200 text-sm transition-all font-mono"
                  value={woStartDate}
                  onChange={(e) => setWoStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Tanggal Selesai</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-850 dark:text-slate-200 text-sm transition-all font-mono"
                  value={woEndDate}
                  onChange={(e) => setWoEndDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submittingWo}
                className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {submittingWo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Rilis Work Order</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* WO List */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/30 rounded-3xl p-6 shadow-md flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Daftar Work Order Perakitan</span>
              </h2>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    const headers = ["Nomor WO", "Item Produk", "Target Kuantitas", "Satuan", "Lini Kerja (WC)", "Tanggal Mulai", "Tanggal Selesai", "Status"];
                    const rows = workOrders.map(wo => [
                      `WO-${wo.wo_id.slice(0, 8).toUpperCase()}`,
                      wo.item.item_name,
                      wo.quantity_to_produce,
                      wo.item.unit,
                      wo.workCenter.work_center_name,
                      wo.start_date.split('T')[0],
                      wo.end_date.split('T')[0],
                      wo.status
                    ]);
                    exportToExcel("Work_Orders", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => {
                    const headers = ["Nomor WO", "Item Produk", "Target Kuantitas", "Satuan", "Lini Kerja (WC)", "Tanggal Mulai", "Tanggal Selesai", "Status"];
                    const rows = workOrders.map(wo => [
                      `WO-${wo.wo_id.slice(0, 8).toUpperCase()}`,
                      wo.item.item_name,
                      wo.quantity_to_produce,
                      wo.item.unit,
                      wo.workCenter.work_center_name,
                      wo.start_date.split('T')[0],
                      wo.end_date.split('T')[0],
                      wo.status
                    ]);
                    exportToPDF("Laporan Daftar Work Order Perakitan", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {workOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center p-8 bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-800 rounded-2xl">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Belum ada Work Order (WO) yang dirilis.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="pb-3">Nomor WO</th>
                      <th className="pb-3">Item Produk</th>
                      <th className="pb-3">Kapasitas Produksi</th>
                      <th className="pb-3">Tempat Kerja (WC)</th>
                      <th className="pb-3">Masa Rencana</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Aksi Kontrol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-200">
                    {workOrders.map((wo) => (
                      <tr key={wo.wo_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="py-4 font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                          WO-{wo.wo_id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-4 font-medium text-gray-750 dark:text-slate-300">
                          {wo.item.item_name}
                        </td>
                        <td className="py-4 text-blue-600 dark:text-blue-400 font-bold">
                          {wo.quantity_to_produce} {wo.item.unit}
                        </td>
                        <td className="py-4 text-xs text-gray-500 dark:text-slate-400 max-w-[150px] truncate">
                          {wo.workCenter.work_center_name}
                        </td>
                        <td className="py-4 text-gray-400 dark:text-slate-500 font-mono text-2xs">
                          {wo.start_date.split('T')[0]} s/d {wo.end_date.split('T')[0]}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-block text-2xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            wo.status === "COMPLETED" 
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" 
                              : wo.status === "IN_PROGRESS" 
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" 
                              : "bg-gray-100 dark:bg-slate-700/20 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700/30"
                          }`}>
                            {wo.status}
                          </span>
                        </td>
                        <td className="py-4 text-right space-x-2">
                          {wo.status === "PLANNED" && (
                            <button
                              onClick={() => handleUpdateWOStatus(wo.wo_id, "IN_PROGRESS")}
                              disabled={actionLoadingId !== null}
                              className="py-1 px-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all text-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {actionLoadingId === wo.wo_id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              <span>Mulai</span>
                            </button>
                          )}
                          {wo.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => handleUpdateWOStatus(wo.wo_id, "COMPLETED")}
                              disabled={actionLoadingId !== null}
                              className="py-1 px-2.5 rounded bg-green-600 hover:bg-green-700 text-white font-bold transition-all text-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {actionLoadingId === wo.wo_id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              <span>Selesai</span>
                            </button>
                          )}
                          {wo.status === "COMPLETED" && (
                            <span className="text-xs text-green-600 dark:text-green-500 font-bold flex items-center gap-1 justify-end">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Selesai</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
