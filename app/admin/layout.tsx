"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Calendar,
  Boxes,
  Warehouse,
  Users,
  LogOut,
  Settings,
  ClipboardList,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        router.push("/login");
      }
    }
    loadUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const menuGroups = [
    {
      title: "Menu Utama",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Data Master",
      items: [
        { name: "Master Data", href: "/admin/master", icon: Settings },
        { name: "Master User", href: "/admin/users", icon: Users },
      ],
    },
    {
      title: "Transaksi & Perencanaan",
      items: [
        { name: "Forecasting", href: "/admin/forecasting", icon: TrendingUp },
        { name: "Aggregate Planning", href: "/admin/aggregate", icon: BarChart3 },
        { name: "MPS", href: "/admin/mps", icon: Calendar },
        { name: "MRP (BoM)", href: "/admin/mrp", icon: Boxes },
        { name: "PO & Work Orders", href: "/admin/orders", icon: ClipboardList },
        { name: "Inventory Ledger", href: "/admin/inventory", icon: Warehouse },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700/50 flex flex-col justify-between shrink-0 shadow-sm dark:shadow-none transition-colors duration-200 h-full">
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700/50">
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
              NEXA PPC
            </h1>
            <p className="text-2xs text-gray-400 dark:text-slate-400 uppercase tracking-widest mt-1">
              Internal Admin Portal
            </p>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-4">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1.5">
                <h3 className="px-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.title}
                </h3>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                          : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-slate-100"
                          }`}
                      >
                        <Icon className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-500 dark:text-slate-400" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700/50 space-y-3 shrink-0">
          {user && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-slate-700/20">
              <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{user.full_name}</p>
              <p className="text-2xs text-gray-400 dark:text-slate-400 mt-0.5 uppercase tracking-wider">{user.role_name}</p>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-slate-100 transition-all focus:outline-none"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all focus:outline-none"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
