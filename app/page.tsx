"use client";

import Link from "next/link";
import { 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Boxes, 
  Warehouse, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Layers,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  const modules = [
    { title: "Forecasting", desc: "Estimasi peramalan permintaan (MA-3 & Exponential Smoothing)", icon: TrendingUp, color: "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
    { title: "Aggregate Planning", desc: "Perencanaan alokasi kapasitas produksi bulanan strategis", icon: BarChart3, color: "text-teal-500 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10" },
    { title: "Master Production Schedule", desc: "Jadwal induk perakitan mingguan per-item terintegrasi", icon: Calendar, color: "text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" },
    { title: "BOM Explosion & MRP", desc: "Perhitungan kebutuhan bahan baku otomatis berdasarkan level BOM", icon: Boxes, color: "text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10" },
    { title: "Inventory Management", desc: "Kartu stok real-time otomatis dari transaksi PO & perakitan WO", icon: Warehouse, color: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" },
    { title: "RBAC Security", desc: "Otorisasi peran ketat memisahkan portal Admin & Supplier Portal", icon: ShieldCheck, color: "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Background radial glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Navigation */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-gray-200 dark:border-slate-900 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
              NEXA-PPC
            </span>
            <span className="text-3xs text-gray-400 dark:text-slate-500 block -mt-1 font-semibold uppercase tracking-wider">Mini-ERP Manufaktur</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition-all"
            title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 rounded-xl transition-all text-gray-700 dark:text-slate-200"
          >
            Masuk ke Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl w-full mx-auto px-6 py-12 md:py-20 text-center space-y-8 z-10 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 rounded-full text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2 mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sistem PPC Tugas Kuliah Politeknik Astra</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-gray-900 dark:text-white max-w-4xl mx-auto">
          Sistem Perencanaan & Pengendalian Produksi{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            Perakitan Sepeda Gunung (MTB)
          </span>
        </h1>

        <p className="text-gray-500 dark:text-slate-400 text-sm md:text-md max-w-2xl mx-auto leading-relaxed">
          Platform Mini-ERP Manufaktur end-to-end terintegrasi dengan kalkulasi otomatis untuk peramalan permintaan, master scheduling, perencanaan material (MRP) berbasis Bill of Materials (BOM), hingga penanganan status portal supplier.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 group transition-all"
          >
            <span>Buka Aplikasi Utama</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-850 border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 rounded-2xl transition-all"
          >
            Pelajari Modul
          </a>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="max-w-6xl w-full mx-auto px-6 py-12 md:py-20 z-10 border-t border-gray-200 dark:border-slate-900/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Alur Bisnis Manufaktur Sekuensial</h2>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">NEXA-PPC menggabungkan 6 modul PPC utama dalam satu database tunggal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div 
                key={idx} 
                className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-gray-100 dark:border-slate-900 hover:border-gray-200 dark:hover:border-slate-800 transition-all duration-300 flex flex-col justify-between group shadow-sm dark:shadow-none"
              >
                <div>
                  <div className={`p-3 rounded-xl w-fit ${mod.color} mb-5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-md font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{mod.title}</h3>
                  <p className="text-gray-500 dark:text-slate-400 text-xs mt-2.5 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-6 py-8 border-t border-gray-200 dark:border-slate-900 text-center text-gray-400 dark:text-slate-600 text-2xs font-medium z-10">
        <p>© 2026 NEXA-PPC Mini-ERP. Dikembangkan untuk Tugas Kuliah Manajemen Informatika - Politeknik Astra.</p>
      </footer>
    </main>
  );
}
