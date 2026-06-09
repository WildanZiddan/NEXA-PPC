"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Shield, HelpCircle, AlertCircle, CheckCircle2, Loader2, Building } from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Helper untuk menentukan role terpilih
  const selectedRole = roles.find((r) => r.role_id === selectedRoleId);
  const isSupplierRole = selectedRole?.role_name === "SUPPLIER";

  async function loadData() {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Gagal mengambil data user.");
      const data = await res.json();
      setUsers(data.users);
      setRoles(data.roles);
      setSuppliers(data.suppliers);
      
      // Auto select first role
      if (data.roles.length > 0) {
        setSelectedRoleId(data.roles[0].role_id);
      }
      if (data.suppliers.length > 0) {
        setSelectedSupplierId(data.suppliers[0].supplier_id);
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
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          role_id: selectedRoleId,
          supplier_id: isSupplierRole ? selectedSupplierId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat user baru.");
      }

      setSuccess("User baru berhasil didaftarkan!");
      // Reset form
      setUsername("");
      setPassword("");
      setFullName("");
      // Reload user list
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
          <p className="text-slate-400 text-sm font-medium">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          <span>Pengelolaan Pengguna (User Management)</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Daftarkan akun admin pabrik internal dan akun portal supplier eksternal. Hak akses diatur melalui RBAC secara ketat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Registrasi User Baru (Hanya oleh Admin) */}
        <div className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-6 rounded-2xl shadow-xl h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <span>Daftarkan User Baru</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Nama Lengkap</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
                placeholder="Nama Lengkap User"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Username</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
                placeholder="Username untuk login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
                placeholder="Password minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 uppercase">Role Hak Akses</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional Dropdown: Hanya jika role adalah SUPPLIER */}
            {isSupplierRole && (
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 space-y-2">
                <label className="block text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase">Hubungkan ke Supplier</label>
                <select
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-slate-200 text-sm transition-all"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                >
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.supplier_name}
                    </option>
                  ))}
                </select>
                <p className="text-3xs text-blue-600 dark:text-blue-400 mt-1">Akun ini hanya dapat melihat PO untuk supplier terpilih.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {submitting ? "Memproses..." : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Akun</span>
                </>
              )}
            </button>
          </form>

          {/* Form Feedback */}
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

        {/* Tabel Daftar User Aktif */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/30 rounded-3xl p-6 shadow-md flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Akun Pengguna Aktif</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700/50 text-gray-400 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="pb-3">Username / Nama</th>
                  <th className="pb-3">Role Hak Akses</th>
                  <th className="pb-3">Koneksi Supplier</th>
                  <th className="pb-3 text-right">Tanggal Dibuat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-gray-800 dark:text-slate-200">
                {users.map((usr) => (
                  <tr key={usr.user_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="py-3.5 font-medium">
                      <p>{usr.full_name}</p>
                      <p className="text-2xs text-gray-450 dark:text-slate-500 mt-0.5">@{usr.username}</p>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-block text-2xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        usr.role.role_name === "ADMIN" 
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" 
                          : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                      }`}>
                        {usr.role.role_name}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-500 dark:text-slate-400 text-xs">
                      {usr.supplier ? (
                        <div className="flex items-center gap-1.5">
                           <Building className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                          <span>{usr.supplier.supplier_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500">- (Internal Pabrik)</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right text-gray-400 dark:text-slate-500 text-xs font-mono">
                      {new Date(usr.createdAt).toISOString().split('T')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
