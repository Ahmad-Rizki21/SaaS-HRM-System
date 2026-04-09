"use client";

import { useEffect, useState, Suspense } from "react";
import axiosInstance from "@/lib/axios";
import { Search, Edit2, X, Trash2, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/PermissionGuard";
import Pagination from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";
import { useSearchParams } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Role {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  nik?: string;
  role?: Role;
  role_id: number;
  profile_photo_url?: string;
  leave_balance?: number;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function LeaveBalancesContent() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearch || "");
  const [page, setPage] = useState(1);

  // Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newBalance, setNewBalance] = useState<number | "">("");

  useEffect(() => {
    fetchEmployees(page);
  }, [searchQuery, page, urlSearch]);

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const s = urlSearch || searchQuery;
      const response = await axiosInstance.get(`/employees?page=${page}&search=${s}`);
      const { data, ...paginator } = response.data.data;
      setEmployees(data || []);
      setPagination(paginator);
    } catch (e) {
      console.error("Gagal mendapatkan data karyawan", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setNewBalance(emp.leave_balance ?? 12);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      // Menggunakan form data untuk menyesuaikan format endpoint update karyawan yang ada
      const data = new FormData();
      data.append('_method', 'PUT');
      data.append('leave_balance', newBalance.toString());
      
      // Data mandatori tambahan jika endpoint employees memerlukan. 
      // Akan lebih baik ke depannya Anda membuat endpoint khusus untuk:
      // PUT /api/employees/{id}/leave-balance untuk lebih aman
      // Namun untuk sementara kita manfaatkan endpoint yang sudah ada.
      data.append('name', selectedEmployee.name);
      data.append('email', selectedEmployee.email);
      data.append('role_id', selectedEmployee.role_id.toString());

      await axiosInstance.post(`/employees/${selectedEmployee.id}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Sisa jatah cuti berhasil diperbarui!");
      handleCloseModal();
      fetchEmployees(pagination?.current_page || 1);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Pengaturan Hak Cuti</h1>
          <p className="dash-page-desc">Kelola dan sesuaikan saldo sisa cuti tahunan milik setiap karyawan secara terpusat.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 border border-gray-100 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari karyawan berdasarkan nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-container">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={6} cols={4} /></div>
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
                  <th>Posisi/Peran</th>
                  <th className="text-center">Sisa Cuti Saat Ini</th>
                  {hasPermission('edit-employees') && <th className="text-right">Pengaturan</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-gray-100">
                          <AvatarImage src={emp.profile_photo_url} alt={emp.name} />
                          <AvatarFallback className="bg-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                            {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 leading-tight">{emp.name}</span>
                          <span className="text-[10px] text-gray-500 font-medium">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-700">
                        {emp.role?.name || (emp.role_id === 1 ? "Super Admin" : emp.role_id === 2 ? "HR" : "Karyawan")}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-black tracking-wide border
                        ${(emp.leave_balance || 0) <= 2 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}">
                        {emp.leave_balance ?? 12} Hari
                      </div>
                    </td>
                    {hasPermission('edit-employees') && (
                      <td className="text-right">
                        <button 
                          className="dash-btn dash-btn-outline h-8 px-3 text-xs inline-flex items-center gap-1.5 hover:bg-gray-100" 
                          title="Sesuaikan Jatah Cuti"
                          onClick={() => handleOpenEditModal(emp)}
                        >
                          <Settings size={14} />
                          Ubah Cuti
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */ }
        {!loading && pagination && pagination.total > 0 && (
          <Pagination 
            currentPage={pagination.current_page} 
            lastPage={pagination.last_page} 
            total={pagination.total} 
            onPageChange={setPage} 
          />
        )}
      </div>

      {/* Editing Modal */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Ubah Jatah Cuti</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-5">
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Nama Karyawan</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedEmployee.name}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Set Sisa Cuti Baru (Hari)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    autoFocus
                    className="w-full px-3 py-2 text-lg font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value ? parseInt(e.target.value) : "")}
                  />
                  <p className="text-[11px] text-gray-500 italic mt-2">
                    Tip: Jika di awal tahun, biasanya di-set ke 12 hari (sesuai kebijakan).
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || newBalance === ""}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1a1a2e] rounded-md hover:bg-[#2d2d44] transition-colors disabled:opacity-50 inline-flex items-center"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Sisa Cuti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeaveBalancesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500"><TableSkeleton rows={5} cols={4} /></div>}>
      <LeaveBalancesContent />
    </Suspense>
  );
}
