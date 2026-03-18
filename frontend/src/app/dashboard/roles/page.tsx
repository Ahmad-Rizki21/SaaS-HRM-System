"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Plus, Search, Edit2, Trash2, Shield, Info, X } from "lucide-react";

interface Permission {
  id: number;
  name: string;
  slug: string;
  group: string;
}

interface Role {
  id: number;
  name: string;
  users_count?: number;
  permissions?: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/roles");
      setRoles(response.data.data);
    } catch (e) {
      console.error("Gagal ambil role", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axiosInstance.get("/permissions");
      setAllPermissions(response.data.data);
    } catch (e) {
      console.error("Gagal ambil permission", e);
    }
  };

  const handleOpenAdd = () => {
    setSelectedRole(null);
    setFormData({ name: "" });
    setModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({ name: role.name });
    setModalOpen(true);
  };

  const handleOpenPermissions = async (role: Role) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/roles/${role.id}`);
      const detailedRole = res.data.data;
      setSelectedRole(detailedRole);
      setRolePermissions(detailedRole.permissions.map((p: any) => p.id));
      setPermissionModalOpen(true);
    } catch (e) {
      console.error("Gagal ambil detail role", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedRole) {
        await axiosInstance.put(`/roles/${selectedRole.id}`, formData);
      } else {
        await axiosInstance.post("/roles", formData);
      }
      fetchRoles();
      setModalOpen(false);
    } catch (e) {
      alert("Gagal menyimpan role. Pastikan nama unik.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncPermissions = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/roles/${selectedRole.id}/permissions`, {
        permissions: rolePermissions
      });
      alert("Hak akses berhasil diperbarui!");
      setPermissionModalOpen(false);
    } catch (e) {
      alert("Gagal sinkron hak akses");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (id: number) => {
    setRolePermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus role ini?")) return;
    try {
      await axiosInstance.delete(`/roles/${id}`);
      fetchRoles();
    } catch (e: any) {
      alert(e.response?.data?.message || "Gagal hapus role");
    }
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Jabatan & Role</h1>
          <p className="text-sm text-gray-500 mt-1">Atur jabatan dan tentukan apa saja yang boleh diakses oleh karyawan.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-[#8B0000] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#660000] transition-all shadow-lg shadow-red-900/20"
        >
          <Plus size={18} /> Tambah Jabatan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#fef2f2] text-[#8B0000] flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenEdit(role)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(role.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-1">{role.name}</h3>
            <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {role.users_count} Karyawan Terdaftar
            </p>
            
            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
              <button 
                onClick={() => handleOpenPermissions(role)}
                className="text-sm font-bold text-[#8B0000] hover:underline flex items-center gap-1.5"
              >
                Atur Hak Akses &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Role Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{selectedRole ? "Edit Jabatan" : "Tambah Jabatan"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitRole}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Jabatan</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                  placeholder="Contoh: Manager Operasional"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-[#8B0000] text-white font-bold rounded-xl shadow-lg shadow-red-900/20 hover:bg-[#660000] transition disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {permissionModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Hak Akses: {selectedRole.name}</h3>
                <p className="text-sm text-gray-500">Tandai apa saja yang boleh dijalankan oleh {selectedRole.name}</p>
              </div>
              <button onClick={() => setPermissionModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 min-h-0 custom-scrollbar">
              {Object.entries(allPermissions).map(([group, perms]) => (
                <div key={group}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-gray-200"></span> {group}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {perms.map(p => (
                      <label 
                        key={p.id} 
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          rolePermissions.includes(p.id) 
                            ? 'bg-[#fef2f2] border-[#8B0000] text-[#8B0000]' 
                            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 accent-[#8B0000] focus:ring-[#8B0000]" 
                          checked={rolePermissions.includes(p.id)}
                          onChange={() => togglePermission(p.id)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{p.name}</span>
                          <span className="text-[10px] opacity-60 uppercase">{p.slug}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8 flex-shrink-0 pt-6 border-t border-gray-50">
              <button type="button" onClick={() => setPermissionModalOpen(false)} className="flex-1 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition border border-transparent">Tutup</button>
              <button 
                onClick={handleSyncPermissions}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#8B0000] text-white font-bold rounded-xl shadow-lg shadow-red-900/20 hover:bg-[#660000] transition disabled:opacity-50"
              >
                {isSubmitting ? "Menyinkronkan..." : "Update Hak Akses"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9f9f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #eee;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ddd;
        }
      `}</style>
    </div>
  );
}
