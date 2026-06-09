"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Loader2,
  Truck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  MapPin,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export";

export default function SupplierPortalPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function loadPurchaseOrders() {
    try {
      const res = await fetch("/api/supplier/purchase-orders");
      if (!res.ok) throw new Error("Gagal mengambil data Purchase Order.");
      const data = await res.json();
      setPurchaseOrders(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const handleShipOrder = async (poId: string) => {
    setError("");
    setSuccess("");
    setActionLoadingId(poId);

    try {
      const res = await fetch(`/api/supplier/purchase-orders/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SHIPPED" })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui status PO.");

      setSuccess("Pesanan berhasil dikirim (Status: SHIPPED)!");
      if (selectedPo && selectedPo.po_id === poId) {
        setSelectedPo({ ...selectedPo, status: "SHIPPED" });
      }
      loadPurchaseOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-blue-500" />
          <span>Kelola Purchase Order (PO)</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Pantau pesanan bahan baku masuk dari pabrik perakitan Sepeda Gunung (NEXA-PPC). Lakukan pengiriman pesanan tepat waktu.
        </p>
      </div>

      {/* Form Feedbacks */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm flex items-start gap-2.5 max-w-xl">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-start gap-2.5 max-w-xl">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* PO List Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/30 rounded-3xl p-6 shadow-md flex flex-col min-h-[300px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Daftar Pesanan Masuk</span>
            </h2>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                disabled={purchaseOrders.length === 0}
                onClick={() => {
                  const headers = ["Nomor PO", "Tanggal PO", "Jumlah Item", "Status"];
                  const rows = purchaseOrders.map(po => [
                    `PO-${po.po_id.slice(0, 8).toUpperCase()}`,
                    new Date(po.po_date).toISOString().split('T')[0],
                    `${po.purchaseOrderDetails.length} Item`,
                    po.status
                  ]);
                  exportToExcel("Incoming_Purchase_Orders", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                disabled={purchaseOrders.length === 0}
                onClick={() => {
                  const headers = ["Nomor PO", "Tanggal PO", "Jumlah Item", "Status"];
                  const rows = purchaseOrders.map(po => [
                    `PO-${po.po_id.slice(0, 8).toUpperCase()}`,
                    new Date(po.po_date).toISOString().split('T')[0],
                    `${po.purchaseOrderDetails.length} Item`,
                    po.status
                  ]);
                  exportToPDF("Laporan Purchase Order Pemasok (Supplier)", headers, rows);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-8 bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-800 rounded-2xl">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Belum ada Purchase Order (PO) yang dirilis untuk Anda saat ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Nomor PO / Tanggal</th>
                    <th className="pb-3">Jumlah Item</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-200">
                  {purchaseOrders.map((po) => (
                    <tr key={po.po_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-3.5 font-medium">
                        <p className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">PO-{po.po_id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-2xs text-gray-450 dark:text-slate-500 mt-0.5">{new Date(po.po_date).toISOString().split('T')[0]}</p>
                      </td>
                      <td className="py-3.5 text-gray-700 dark:text-slate-300">
                        {po.purchaseOrderDetails.length} Item
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-block text-2xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${po.status === "RECEIVED"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                          : po.status === "SHIPPED"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedPo(po)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-all text-xs"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {po.status === "PENDING" && (
                          <button
                            onClick={() => handleShipOrder(po.po_id)}
                            disabled={actionLoadingId !== null}
                            className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {actionLoadingId === po.po_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Truck className="w-3.5 h-3.5" />
                            )}
                            <span>Kirim</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PO Detail View Panel */}
        <div className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-6 rounded-2xl shadow-xl h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <span>Detail Purchase Order</span>
          </h2>

          {selectedPo ? (
            <div className="space-y-6">

              {/* PO Summary */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-slate-400">Nomor PO:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">PO-{selectedPo.po_id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-slate-400">Tanggal Rilis:</span>
                  <span className="text-gray-800 dark:text-slate-200 font-medium">{new Date(selectedPo.po_date).toISOString().split('T')[0]}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-slate-400">Perusahaan Supplier:</span>
                  <span className="text-gray-800 dark:text-slate-200 font-medium">{selectedPo.supplier.supplier_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-slate-400">Status PO:</span>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${selectedPo.status === "RECEIVED"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                    : selectedPo.status === "SHIPPED"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}>{selectedPo.status}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Item Yang Dipesan</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedPo.purchaseOrderDetails.map((det: any) => (
                    <div key={det.po_detail_id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/40 border border-gray-150 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{det.item.item_name}</p>
                        <p className="text-3xs text-gray-500 dark:text-slate-400 mt-0.5">Kode: {det.item.item_code}</p>
                      </div>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{det.quantity_ordered} {det.item.unit}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              {selectedPo.status === "PENDING" && (
                <button
                  onClick={() => handleShipOrder(selectedPo.po_id)}
                  disabled={actionLoadingId !== null}
                  className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoadingId === selectedPo.po_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Truck className="w-4 h-4" />
                  )}
                  <span>Kirim Pesanan Ini (SHIPPED)</span>
                </button>
              )}

              {selectedPo.status === "SHIPPED" && (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 text-center space-y-1.5">
                  <Truck className="w-6 h-6 text-blue-550 dark:text-blue-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-800 dark:text-white">Pesanan Sedang Dikirim</p>
                  <p className="text-2xs text-gray-500 dark:text-slate-405">Menunggu penerimaan barang dan pemutasi persediaan oleh staff internal pabrik PPC.</p>
                </div>
              )}

              {selectedPo.status === "RECEIVED" && (
                <div className="p-4 rounded-xl bg-green-50/50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/10 text-center space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-800 dark:text-white">Pesanan Telah Diterima</p>
                  <p className="text-2xs text-gray-500 dark:text-slate-405">Barang telah masuk ke gudang internal pabrik dan persediaan stok terupdate.</p>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/10 border border-gray-200 dark:border-slate-800 border-dashed rounded-2xl">
              <ShoppingBag className="w-10 h-10 text-gray-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-slate-400 text-xs font-medium">Klik tombol ikon mata (lihat detail) pada baris pesanan untuk melihat detail item.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
