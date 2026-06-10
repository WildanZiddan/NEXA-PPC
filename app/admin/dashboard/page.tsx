"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Boxes,
  ClipboardList,
  TrendingUp,
  ArrowUpRight,
  Clock,
  AlertCircle,
  Activity,
  LineChart as ChartIcon
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useTheme } from "@/lib/theme-context";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    usersCount: 0,
    itemsCount: 0,
    forecastsCount: 0,
    workOrdersCount: 0,
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState<any[]>([]);
  const [recentInventory, setRecentInventory] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) {
          throw new Error("Gagal mengambil data dashboard.");
        }
        const data = await res.json();
        setStats(data.stats);
        setRecentWorkOrders(data.recentWorkOrders);
        setRecentInventory(data.recentInventory);
        setChartData(data.chartData || []);
        setOutOfStockItems(data.outOfStockItems || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 dark:text-slate-400 text-sm font-medium">Memuat data panel kontrol...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 flex items-center gap-3 max-w-lg mx-auto mt-12">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-blue-500" />
            <span>Dashboard PPC</span>
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Pantau status perencanaan, inventaris, dan aktivitas perakitan manufaktur secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl px-3 py-1.5 self-start md:self-auto font-medium text-gray-500 dark:text-slate-300 shadow-sm dark:shadow-none">
          <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span>Terakhir diperbarui: Baru saja</span>
        </div>
      </div>

      {/* Out of Stock Warning Widget */}
      {outOfStockItems.length > 0 && (
        <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-500/20 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-md font-bold text-gray-900 dark:text-white">Peringatan: Persediaan Habis (Stok = 0)</h2>
              <p className="text-xs text-gray-550 dark:text-slate-400">Terdapat {outOfStockItems.length} item dengan saldo stok nol. Silakan rilis pesanan atau perakitan baru.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outOfStockItems.map((item) => (
              <div key={item.item_id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-2xl shadow-sm transition-all hover:border-gray-200 dark:hover:border-slate-600">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-red-600 dark:text-red-400 font-bold">{item.item_code}</span>
                    <span className={`inline-block text-3xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      item.item_type === "Finished Good" 
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" 
                        : item.item_type === "Component" 
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" 
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}>
                      {item.item_type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{item.item_name}</p>
                </div>
                <div>
                  {item.item_type === "Raw Material" ? (
                    <a
                      href={`/admin/orders?tab=po&itemId=${item.item_id}`}
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-blue-100 dark:border-blue-500/20 rounded-xl transition-all shadow-2xs"
                    >
                      Beli (PO)
                    </a>
                  ) : (
                    <a
                      href={`/admin/orders?tab=wo&itemId=${item.item_id}`}
                      className="px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-amber-100 dark:border-amber-500/20 rounded-xl transition-all shadow-2xs"
                    >
                      Rakit (WO)
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Pengguna Aktif", value: stats.usersCount, icon: Users, color: "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Master Item", value: stats.itemsCount, icon: Boxes, color: "text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Data Peramalan", value: stats.forecastsCount, icon: TrendingUp, color: "text-teal-500 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10" },
          { label: "Work Order Perakitan", value: stats.workOrdersCount, icon: ClipboardList, color: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 p-6 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-xl relative overflow-hidden group hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className={`p-3.5 rounded-xl group-hover:scale-110 transition-transform ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xs uppercase tracking-widest text-gray-400 dark:text-slate-400 font-semibold">{card.label}</p>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{card.value}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-slate-500 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>

      {/* Visual Chart Section */}
      <div className="bg-white dark:bg-slate-800/20 border border-gray-100 dark:border-slate-700/30 rounded-3xl p-6 shadow-sm dark:shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <ChartIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aliran Mutasi Persediaan (Ledger)</h3>
          </div>
          <span className="text-2xs text-gray-400 dark:text-slate-500 uppercase font-semibold tracking-wider">6 Bulan Terakhir</span>
        </div>
        <div className="h-72 w-full">
          {mounted && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="month" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} />
                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    borderColor: isDark ? "#475569" : "#e2e8f0",
                    borderRadius: "12px",
                    color: isDark ? "#f1f5f9" : "#1e293b"
                  }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Legend />
                <Area type="monotone" dataKey="incoming" name="Masuk (IN_PO/ADJ)" stroke="#10b981" fillOpacity={1} fill="url(#colorIncoming)" strokeWidth={2} />
                <Area type="monotone" dataKey="outgoing" name="Keluar (OUT_WO/ADJ)" stroke="#ef4444" fillOpacity={1} fill="url(#colorOutgoing)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Work Orders */}
        <div className="bg-white dark:bg-slate-800/20 border border-gray-100 dark:border-slate-700/30 rounded-3xl p-6 shadow-sm dark:shadow-md flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Work Order Perakitan Terbaru</h2>
          </div>

          {recentWorkOrders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-800 rounded-2xl">
              <p className="text-gray-400 dark:text-slate-400 text-sm">Belum ada aktivitas Work Order perakitan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Produk</th>
                    <th className="pb-3">Kuantitas</th>
                    <th className="pb-3">Work Center</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/30 text-gray-700 dark:text-slate-200">
                  {recentWorkOrders.map((wo) => (
                    <tr key={wo.wo_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-3 font-medium">
                        <p className="text-gray-900 dark:text-slate-200">{wo.item.item_name}</p>
                        <p className="text-2xs text-gray-400 dark:text-slate-500 mt-0.5">{wo.item.item_code}</p>
                      </td>
                      <td className="py-3">{wo.quantity_to_produce} {wo.item.unit}</td>
                      <td className="py-3 text-gray-400 dark:text-slate-400 text-xs truncate max-w-[150px]">{wo.workCenter.work_center_name}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block text-2xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${wo.status === "COMPLETED"
                          ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20"
                          : wo.status === "IN_PROGRESS"
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"
                            : "bg-gray-50 dark:bg-slate-700/20 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700/30"
                          }`}>
                          {wo.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Stock Mutations */}
        <div className="bg-white dark:bg-slate-800/20 border border-gray-100 dark:border-slate-700/30 rounded-3xl p-6 shadow-sm dark:shadow-md flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Boxes className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mutasi Persediaan Terbaru (Ledger)</h2>
          </div>

          {recentInventory.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-800 rounded-2xl">
              <p className="text-gray-400 dark:text-slate-400 text-sm">Belum ada riwayat mutasi stok di ledger.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Item</th>
                    <th className="pb-3">Tipe Mutasi</th>
                    <th className="pb-3">Jumlah</th>
                    <th className="pb-3 text-right">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/30 text-gray-700 dark:text-slate-200">
                  {recentInventory.map((tx) => (
                    <tr key={tx.ledger_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-3 font-medium">
                        <p className="text-gray-900 dark:text-slate-200">{tx.item.item_name}</p>
                        <p className="text-2xs text-gray-400 dark:text-slate-500 mt-0.5">{tx.item.item_code}</p>
                      </td>
                      <td className="py-3">
                        <span className={`inline-block text-2xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${tx.transaction_type === "IN_PO"
                          ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20"
                          : tx.transaction_type === "OUT_WO"
                            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                            : "bg-gray-50 dark:bg-slate-700/20 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700/30"
                          }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className={`py-3 font-bold ${tx.quantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-600 dark:text-slate-300">{tx.current_stock} {tx.item.unit}</td>
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

