"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Calculator,
  LineChart as ChartIcon
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/lib/theme-context";

export default function ForecastingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [targetDate, setTargetDate] = useState("2026-06-01");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedForecastQty, setSelectedForecastQty] = useState("");
  const [isEsSelected, setIsEsSelected] = useState(true);
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadItems() {
      try {
        const res = await fetch("/api/admin/items");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items);
          if (data.items.length > 0) {
            setSelectedItemId(data.items[0].item_id);
          }
        }
      } catch (err) {
        console.error("Failed to load items", err);
      }
    }
    loadItems();
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !targetDate) return;
    setLoading(true);
    setError("");
    setSuccess("");
    setResults(null);
    try {
      const res = await fetch(`/api/admin/forecasting?item_id=${selectedItemId}&target_date=${targetDate}`);
      const data = await res.json();
      setResults(data);
      setSelectedForecastQty(String(Math.round(data.forecasts.exponential_smoothing)));
      setIsEsSelected(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !targetDate || !selectedForecastQty) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/forecasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: selectedItemId,
          period_date: targetDate,
          quantity_forecast: parseFloat(selectedForecastQty)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan peramalan.");
      setSuccess("Peramalan berhasil disimpan ke TRX_FOR!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const chartData = results?.historical_demands.map((h: any) => ({
    name: h.period,
    Demand: h.demand
  })) || [];

  if (results && results.forecasts) {
    chartData.push({
      name: results.target_period + " (Forecast)",
      Demand: null,
      "Forecast MA-3": results.forecasts.moving_average_3,
      "Forecast ES": results.forecasts.exponential_smoothing
    });
  }

  const isDark = theme === "dark";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-500" />
          <span>Peramalan Permintaan (Forecasting)</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Hitung estimasi permintaan barang jadi masa depan menggunakan metode 3-Month Moving Average & Exponential Smoothing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 p-6 rounded-2xl shadow-sm dark:shadow-xl h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <span>Parameter Peramalan</span>
          </h2>
          
          <form onSubmit={handleCalculate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">Item Produk</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 dark:text-slate-200 text-sm"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                {items.map((i) => (
                  <option key={i.item_id} value={i.item_id}>
                    [{i.item_code}] {i.item_name} ({i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">Bulan Target Peramalan</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 dark:text-slate-200 text-sm"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
              <p className="text-3xs text-gray-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider">Note: Diatur ke tanggal 1 bulan target</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Menghitung..." : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Hitung Peramalan</span>
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

        <div className="lg:col-span-2 space-y-8">
          {results ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className={`border p-6 rounded-2xl shadow-md cursor-pointer transition-all ${
                    !isEsSelected 
                      ? "bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-500/50 shadow-blue-100 dark:shadow-blue-500/5" 
                      : "bg-gray-50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-700/50 hover:border-gray-200 dark:hover:border-slate-700"
                  }`}
                  onClick={() => {
                    setIsEsSelected(false);
                    setSelectedForecastQty(String(Math.round(results.forecasts.moving_average_3)));
                  }}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-2xs uppercase tracking-wider text-gray-400 dark:text-slate-400 font-bold">3-Month Moving Average (MA-3)</p>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!isEsSelected ? "border-blue-500" : "border-gray-300 dark:border-slate-600"}`}>
                      {!isEsSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-4">{results.forecasts.moving_average_3}</p>
                  <p className="text-2xs text-gray-400 dark:text-slate-500 mt-2 font-medium">Estimasi rata-rata 3 bulan terakhir</p>
                </div>

                <div 
                  className={`border p-6 rounded-2xl shadow-md cursor-pointer transition-all ${
                    isEsSelected 
                      ? "bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-500/50 shadow-indigo-100 dark:shadow-indigo-500/5" 
                      : "bg-gray-50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-700/50 hover:border-gray-200 dark:hover:border-slate-700"
                  }`}
                  onClick={() => {
                    setIsEsSelected(true);
                    setSelectedForecastQty(String(Math.round(results.forecasts.exponential_smoothing)));
                  }}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-2xs uppercase tracking-wider text-gray-400 dark:text-slate-400 font-bold">Exponential Smoothing (alpha=0.3)</p>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isEsSelected ? "border-indigo-500" : "border-gray-300 dark:border-slate-600"}`}>
                      {isEsSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                  </div>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-4">{results.forecasts.exponential_smoothing}</p>
                  <p className="text-2xs text-gray-400 dark:text-slate-500 mt-2 font-medium">Pemberatan bobot eksponensial historis</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/20 border border-gray-100 dark:border-slate-700/30 rounded-3xl p-6 shadow-sm dark:shadow-md">
                <div className="flex items-center gap-2.5 mb-6">
                  <ChartIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <h3 className="text-md font-bold text-gray-900 dark:text-white">Visualisasi Tren & Proyeksi</h3>
                </div>
                 <div className="h-72 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                        <XAxis dataKey="name" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} />
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
                        <Line type="monotone" dataKey="Demand" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} connectNulls={false} />
                        <Line type="monotone" dataKey="Forecast MA-3" stroke="#2563eb" strokeDasharray="5 5" strokeWidth={3} />
                        <Line type="monotone" dataKey="Forecast ES" stroke="#6366f1" strokeDasharray="5 5" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/30 border border-gray-100 dark:border-slate-700/50 p-6 rounded-2xl shadow-sm dark:shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Simpan Peramalan Permintaan</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Simpan nilai estimasi sebesar <span className="font-bold text-blue-600 dark:text-blue-400">{selectedForecastQty} UNIT</span> untuk periode <span className="font-bold text-gray-900 dark:text-white">{results.target_period}</span> ke data produksi.
                  </p>
                </div>
                <form onSubmit={handleSaveForecast} className="flex gap-3 w-full md:w-auto">
                  <input
                    type="number"
                    step="0.01"
                    className="w-24 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white font-bold text-sm text-center outline-none"
                    value={selectedForecastQty}
                    onChange={(e) => setSelectedForecastQty(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 md:flex-none py-2 px-5 font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan ke Database</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 dark:bg-slate-800/10 border border-gray-200 dark:border-slate-800 border-dashed rounded-3xl p-16 text-center max-w-md mx-auto">
              <TrendingUp className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-300 font-semibold text-sm">Belum Ada Perhitungan</p>
              <p className="text-gray-400 dark:text-slate-500 text-xs mt-2">
                Silakan pilih item produk dan bulan target di sebelah kiri, kemudian klik tombol "Hitung Peramalan".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
