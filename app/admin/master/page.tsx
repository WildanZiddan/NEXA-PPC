"use client";

import { useEffect, useState } from "react";
import { 
  Database, 
  Boxes, 
  Settings, 
  Loader2, 
  ArrowRight, 
  Activity,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export";

export default function MasterDataPage() {
  const [items, setItems] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"items" | "boms" | "workCenters">("items");

  useEffect(() => {
    async function loadMasterData() {
      try {
        const res = await fetch("/api/admin/master");
        if (!res.ok) throw new Error("Gagal mengambil data master.");
        const data = await res.json();
        setItems(data.items);
        setBoms(data.boms);
        setWorkCenters(data.workCenters);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadMasterData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat data master ERP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-500" />
          <span>Basis Data Master PPC</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Pantau data master Item Produk, Bill of Materials (BOM) multi-level, dan Lini Perakitan (Work Center) pabrik perakitan MTB.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700/50 gap-2">
        <button
          onClick={() => setActiveTab("items")}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === "items" 
              ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500" 
              : "text-gray-550 border-transparent hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Master Item ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("boms")}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === "boms" 
              ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500" 
              : "text-gray-550 border-transparent hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Bill of Materials ({boms.length})
        </button>
        <button
          onClick={() => setActiveTab("workCenters")}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === "workCenters" 
              ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500" 
              : "text-gray-550 border-transparent hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Work Centers ({workCenters.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/30 rounded-3xl p-6 shadow-md">
        
        {activeTab === "items" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h3 className="text-md font-bold text-gray-900 dark:text-white">Master Item (Suku Cadang & Barang Jadi)</h3>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    const headers = ["Kode Item", "Nama Item", "Tipe Item", "Stok Saat Ini", "Satuan"];
                    const rows = items.map(i => [i.item_code, i.item_name, i.item_type, i.current_stock ?? 0, i.unit]);
                    exportToExcel("Master_Item", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => {
                    const headers = ["Kode Item", "Nama Item", "Tipe Item", "Stok Saat Ini", "Satuan"];
                    const rows = items.map(i => [i.item_code, i.item_name, i.item_type, i.current_stock ?? 0, i.unit]);
                    exportToPDF("Basis Data Master Item", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Kode Item</th>
                    <th className="pb-3">Nama Item</th>
                    <th className="pb-3">Tipe Item</th>
                    <th className="pb-3 text-right">Stok Saat Ini</th>
                    <th className="pb-3 text-right">Satuan (Unit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-250">
                  {items.map((i) => (
                    <tr key={i.item_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-3.5 font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">{i.item_code}</td>
                      <td className="py-3.5 font-medium">{i.item_name}</td>
                      <td className="py-3.5">
                        <span className={`inline-block text-2xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          i.item_type === "Finished Good" 
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" 
                            : i.item_type === "Component" 
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" 
                            : "bg-gray-100 dark:bg-slate-700/20 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700/30"
                        }`}>
                          {i.item_type}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-gray-900 dark:text-white">
                        {i.current_stock ?? 0}
                      </td>
                      <td className="py-3.5 text-right font-medium text-gray-500 dark:text-slate-300">{i.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "boms" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-md font-bold text-gray-900 dark:text-white">Hierarki Bill of Materials (BOM)</h3>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    const headers = ["Item Induk (Parent) Code", "Item Induk Name", "Item Anak (Child) Code", "Item Anak Name", "Qty Kebutuhan", "Satuan"];
                    const rows = boms.map(b => [
                      b.parentItem.item_code,
                      b.parentItem.item_name,
                      b.childItem.item_code,
                      b.childItem.item_name,
                      b.quantity_needed,
                      b.childItem.unit
                    ]);
                    exportToExcel("Bill_of_Materials", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => {
                    const headers = ["Item Induk (Parent) Code", "Item Induk Name", "Item Anak (Child) Code", "Item Anak Name", "Qty Kebutuhan", "Satuan"];
                    const rows = boms.map(b => [
                      b.parentItem.item_code,
                      b.parentItem.item_name,
                      b.childItem.item_code,
                      b.childItem.item_name,
                      b.quantity_needed,
                      b.childItem.unit
                    ]);
                    exportToPDF("Struktur Bill of Materials (BOM)", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Item Induk (Parent)</th>
                    <th className="pb-3"></th>
                    <th className="pb-3">Item Anak (Child Component)</th>
                    <th className="pb-3 text-right">Kuantitas Kebutuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-250">
                  {boms.map((bom) => (
                    <tr key={bom.bom_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-3.5 font-medium">
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">[{bom.parentItem.item_code}]</span> {bom.parentItem.item_name}
                      </td>
                      <td className="py-3.5 text-gray-400 dark:text-slate-500">
                        <ArrowRight className="w-4 h-4" />
                      </td>
                      <td className="py-3.5 font-medium">
                        <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">[{bom.childItem.item_code}]</span> {bom.childItem.item_name}
                      </td>
                      <td className="py-3.5 text-right font-bold text-gray-700 dark:text-slate-300">
                        {bom.quantity_needed} {bom.childItem.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "workCenters" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                <h3 className="text-md font-bold text-gray-900 dark:text-white">Pusat Kerja & Lini Produksi (Work Center)</h3>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    const headers = ["Nama Lini Kerja (Work Center)", "Kapasitas Maksimal per Hari (UNIT/HARI)"];
                    const rows = workCenters.map(w => [w.work_center_name, w.capacity_per_day]);
                    exportToExcel("Work_Centers", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => {
                    const headers = ["Nama Lini Kerja (Work Center)", "Kapasitas Maksimal per Hari (UNIT/HARI)"];
                    const rows = workCenters.map(w => [w.work_center_name, w.capacity_per_day]);
                    exportToPDF("Data Pusat Kerja (Work Center)", headers, rows);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/25 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Nama Lini Kerja (Work Center)</th>
                    <th className="pb-3 text-right">Kapasitas Maksimal per Hari</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-250">
                  {workCenters.map((wc) => (
                    <tr key={wc.work_center_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-3.5 font-medium">{wc.work_center_name}</td>
                      <td className="py-3.5 text-right font-bold text-gray-700 dark:text-slate-300">{wc.capacity_per_day} UNIT/HARI</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

