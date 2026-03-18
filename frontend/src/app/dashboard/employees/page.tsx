"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/PermissionGuard";
import Pagination from "@/components/Pagination";
import { useSearchParams } from "next/navigation";

interface Role {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  nik?: string;
  phone?: string;
  address?: string;
  join_date?: string;
  role?: Role;
  role_id: number;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search");
  const urlId = searchParams.get("id");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearch || "");
  const [page, setPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee> & { password?: string }>({
    role_id: 3 // Default Employee
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  useEffect(() => {
    fetchEmployees(page);
    fetchRoles();
  }, [searchQuery, page, urlSearch, urlId]);

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/roles");
      setAvailableRoles(response.data.data);
    } catch (e) {
      console.error("Gagal ambil data role", e);
    }
  };

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const s = urlSearch || searchQuery;
      // If we have urlId, we might want to fetch just that ID, or pass it to backend
      const response = await axiosInstance.get(`/employees?page=${page}&search=${s}${urlId ? `&id=${urlId}` : ""}`);
      const { data, ...paginator } = response.data.data;
      setEmployees(data || []);
      setPagination(paginator);
    } catch (e) {
      console.error("Gagal mendapatkan data karyawan", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormData({ role_id: 3 }); // Reset
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setModalMode("edit");
    setFormData({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role_id: emp.role_id,
      nik: emp.nik || "",
      phone: emp.phone || "",
      address: emp.address || "",
      join_date: emp.join_date || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await axiosInstance.post("/employees", formData);
        alert("Berhasil menambah karyawan baru!");
      } else {
        await axiosInstance.put(`/employees/${formData.id}`, formData);
        alert("Berhasil memperbarui data karyawan!");
      }
      handleCloseModal();
      fetchEmployees(pagination?.current_page || 1);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.delete(`/employees/${deleteId}`);
      alert("Karyawan berhasil dihapus.");
      setDeleteModalOpen(false);
      fetchEmployees(pagination?.current_page || 1);
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus data karyawan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeColor = (roleName?: string) => {
    if (!roleName) return "dash-badge-neutral";
    const name = roleName.toLowerCase();
    if (name.includes("hr") || name.includes("admin") || name.includes("superdmin")) return "dash-badge-warning";
    if (name.includes("manager")) return "dash-badge-success";
    return "dash-badge-neutral";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Filter local jika backend blm support filter search query dari front end
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Data Pegawai HRMS</h1>
          <p className="dash-page-desc">Kelola seluruh data anggota tim dari panel admin master.</p>
        </div>
        <div className="dash-page-actions">
          <PermissionGuard slug="create-employees">
            <button 
              onClick={handleOpenAddModal}
              className="dash-btn dash-btn-primary"
            >
              <Plus size={16} />
              Tambah Karyawan
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 border border-[#ebedf0] rounded-lg">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-container">
        {loading ? (
          <div className="dash-loading">
            <div className="dash-spinner" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Tidak ada data karyawan ditemukan.
          </div>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Info Pekerja</th>
                  {hasPermission('edit-employees') && <th>NIK</th>}
                  <th>Posisi/Peran</th>
                  <th>Tanggal Gabung</th>
                  {(hasPermission('edit-employees') || hasPermission('delete-employees')) && <th className="text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{emp.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium">EMP-{emp.id.toString().padStart(4, '0')}</span>
                      </div>
                    </td>
                    {hasPermission('edit-employees') && (
                      <td>
                        <span className="text-sm font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          {emp.nik || "Belum diisi"}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className={`dash-badge ${getRoleBadgeColor(emp.role?.name)}`}>
                        {emp.role?.name || (emp.role_id === 1 ? "Super Admin" : emp.role_id === 2 ? "HR" : "Karyawan")}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">
                        {formatDate(emp.join_date)}
                      </span>
                    </td>
                    {(hasPermission('edit-employees') || hasPermission('delete-employees')) && (
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission('edit-employees') && (
                            <button 
                              className="dash-action-btn edit" 
                              title="Edit"
                              onClick={() => handleOpenEditModal(emp)}
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          {hasPermission('delete-employees') && (
                            <button 
                              className="dash-action-btn delete" 
                              title="Hapus"
                              onClick={() => {
                                setDeleteId(emp.id);
                                setDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Info */}
        {!loading && pagination && pagination.total > 0 && (
          <Pagination 
            currentPage={pagination.current_page} 
            lastPage={pagination.last_page} 
            total={pagination.total} 
            onPageChange={setPage} 
          />
        )}
      </div>

      {/* CRUD Modal for Add & Edit */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-5 border-b border-gray-100">
                <h3 className="font-semibold text-lg text-gray-900">
                  {modalMode === "add" ? "Tambah Data Karyawan" : "Edit Data Karyawan"}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  
                  {/* Grid fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Nama Lengkap*</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Email Utama*</label>
                      <input 
                        type="email" 
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Nomor Induk Karyawan (NIK)</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                        value={formData.nik || ""}
                        onChange={(e) => setFormData({...formData, nik: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Peran Akun*</label>
                      <select 
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                        value={formData.role_id || ""}
                        onChange={(e) => setFormData({...formData, role_id: parseInt(e.target.value)})}
                      >
                        <option value="" disabled>Pilih Peran Akun</option>
                        {availableRoles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Tanggal Gabung</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                        value={formData.join_date || ""}
                        onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Alamat Tempat Tinggal</label>
                    <textarea 
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e] min-h-[80px]"
                      value={formData.address || ""}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  {modalMode === "add" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Password Sementara*</label>
                      <input 
                        type="password" 
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                        value={formData.password || ""}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Minimal 6 karakter"
                      />
                      <p className="text-xs text-gray-500">Tentu saja password ini bisa mereka ubah di pengaturan profil nanti.</p>
                    </div>
                  )}

                  {modalMode === "edit" && (
                     <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Ubah Password <span className="text-gray-400 font-normal">(Opsional)</span></label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                        value={formData.password || ""}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Kosongkan jika tidak ingin merubah"
                      />
                    </div>
                  )}

                </div>
                
                <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                  <button 
                    type="button" 
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#1a1a2e] rounded-md hover:bg-[#2d2d44] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Karyawan?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Peringatan: Semua data yang terhubung dengan pekerja ini (absensi, cuti, dll) akan kehilangan akses loginnya. Tindakan tidak bisa dibatalkan secara manual.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Proses..." : "Ya, Hapus!"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
