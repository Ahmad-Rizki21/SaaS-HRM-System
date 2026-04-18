"use client";

import { useEffect, useState, Suspense } from "react";
import axiosInstance from "@/lib/axios";
import { Search, Calendar, ShieldCheck, ShieldAlert, X, Info, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PermissionGuard } from "@/components/PermissionGuard";
import { useDebounce } from "@/hooks/useDebounce";
import { TableSkeleton } from "@/components/Skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Pagination from "@/components/Pagination";

interface Role {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role?: Role;
  role_id: number;
  profile_photo_url?: string;
  is_wfh: boolean;
  wfh_start_date?: string;
  wfh_end_date?: string;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function WFHContent() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<"single" | "bulk">("single");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [wfhData, setWfhData] = useState({
    is_wfh: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchEmployees(page);
  }, [debouncedSearch, page]);

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/employees?page=${page}&search=${debouncedSearch}`);
      const { data, ...paginator } = response.data.data;
      setEmployees(data || []);
      setPagination(paginator);
    } catch (e) {
      console.error("Gagal mendapatkan data karyawan", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(employees.map(emp => emp.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleOpenSingleModal = (emp: Employee) => {
    setModalMode("single");
    setSelectedEmployee(emp);
    setWfhData({
      is_wfh: !emp.is_wfh,
      start_date: emp.wfh_start_date || new Date().toISOString().split('T')[0],
      end_date: emp.wfh_end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenBulkModal = () => {
    if (selectedIds.length === 0) {
      alert("Pilih minimal satu karyawan untuk pengaturan massal.");
      return;
    }
    setModalMode("bulk");
    setSelectedEmployee(null);
    setWfhData({
      is_wfh: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      if (modalMode === "single" && selectedEmployee) {
        await axiosInstance.post(`/employees/${selectedEmployee.id}/toggle-wfh`, wfhData);
        alert(`Berhasil memperbarui status WFH untuk ${selectedEmployee.name}`);
      } else if (modalMode === "bulk") {
        await axiosInstance.post(`/employees/bulk-wfh`, {
          ...wfhData,
          ids: selectedIds
        });
        alert(`Berhasil memperbarui status WFH untuk ${selectedIds.length} karyawan`);
        setSelectedIds([]);
      }
      handleCloseModal();
      fetchEmployees(page);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Gagal memperbarui status WFH.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Delegasi & Manajemen WFH</h1>
          <p className="dash-page-desc">Berikan izin Work From Home (WFH) agar karyawan dapat absen dari mana saja.</p>
        </div>
        <div className="dash-page-actions">
           {selectedIds.length > 0 && (
             <button 
                onClick={handleOpenBulkModal}
                className="dash-btn dash-btn-primary flex items-center gap-2"
             >
                <Settings2 size={16} />
                Atur Massal ({selectedIds.length})
             </button>
           )}
        </div>
      </div>

      {/* Info Card */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-700">
        <Info className="shrink-0" size={20} />
        <div className="text-sm">
          <p className="font-bold mb-1">Cara Kerja Fitur WFH:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Karyawan dengan status WFH <b>Aktif</b> dan dalam <b>Rentang Tanggal</b> dapat absen dari mana saja.</li>
            <li>Sistem akan otomatis membuat <b>Pengumuman Kebijakan WFH</b> saat status diaktifkan.</li>
            <li>Satu pengumuman akan dibuat untuk setiap pengaturan (baik perorangan maupun massal).</li>
          </ul>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 border border-[#ebedf0] rounded-xl shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-container bg-white rounded-xl shadow-sm border border-[#ebedf0] overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={5} cols={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dash-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === employees.length && employees.length > 0}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </th>
                  <th>Info Karyawan</th>
                  <th>Posisi</th>
                  <th className="text-center">Status WFH</th>
                  <th>Periode WFH</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isDateActive = emp.is_wfh && emp.wfh_start_date && emp.wfh_end_date && 
                                      today >= emp.wfh_start_date && today <= emp.wfh_end_date;
                  
                  return (
                    <tr key={emp.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(emp.id) ? 'bg-blue-50/30' : ''}`}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(emp.id)}
                          onChange={() => handleSelectRow(emp.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 border border-gray-100 shadow-sm">
                            <AvatarImage src={emp.profile_photo_url} alt={emp.name} />
                            <AvatarFallback className="bg-gray-100 text-gray-500 font-bold uppercase text-xs">
                              {emp.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 leading-tight">{emp.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-600">
                          {emp.role?.name || "Employee"}
                        </span>
                      </td>
                      <td className="text-center">
                        {emp.is_wfh ? (
                          <div className="flex flex-col items-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${isDateActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {isDateActive ? (
                                <><ShieldCheck size={10} /> Aktif Sekarang</>
                              ) : (
                                <><Calendar size={10} /> Terjadwal</>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase inline-flex items-center gap-1">
                            <ShieldAlert size={10} /> Kantor (Default)
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col">
                          {emp.is_wfh && emp.wfh_start_date ? (
                            <span className="text-xs font-semibold text-gray-700">
                              {formatDate(emp.wfh_start_date)} - {formatDate(emp.wfh_end_date)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium italic">Tidak diatur</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <PermissionGuard slug="manage-wfh">
                          <button 
                            onClick={() => handleOpenSingleModal(emp)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${emp.is_wfh ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                          >
                            {emp.is_wfh ? "Nonaktifkan" : "Atur WFH"}
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {pagination && pagination.total > 0 && (
          <div className="p-4 border-t border-gray-50 bg-gray-50/30">
            <Pagination 
              currentPage={pagination.current_page} 
              lastPage={pagination.last_page} 
              total={pagination.total} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl text-gray-900 tracking-tight">
                  {modalMode === "bulk" ? "Pengaturan WFH Massal" : "Konfigurasi WFH"}
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {modalMode === "bulk" ? `Mengatur ${selectedIds.length} karyawan sekaligus` : selectedEmployee?.name}
                </p>
              </div>
              <button onClick={handleCloseModal} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                {/* WFH Switch / Radio */}
                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
                   <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${wfhData.is_wfh ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                       <ShieldCheck size={20} />
                     </div>
                     <div>
                       <span className="text-sm font-bold block">Status Izin WFH</span>
                       <span className={`text-[10px] font-black uppercase ${wfhData.is_wfh ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {wfhData.is_wfh ? 'AKTIF (WFH)' : 'NONAKTIF (KANTOR)'}
                       </span>
                     </div>
                   </div>
                   <button 
                    type="button"
                    onClick={() => setWfhData({...wfhData, is_wfh: !wfhData.is_wfh})}
                    className={`w-12 h-6 rounded-full transition-all relative ${wfhData.is_wfh ? 'bg-emerald-500' : 'bg-gray-300'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${wfhData.is_wfh ? 'right-1' : 'left-1'}`} />
                   </button>
                </div>

                {wfhData.is_wfh && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Mulai Tanggal</label>
                        <input 
                          type="date"
                          required={wfhData.is_wfh}
                          className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          value={wfhData.start_date}
                          onChange={(e) => setWfhData({...wfhData, start_date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Sampai Tanggal</label>
                        <input 
                          type="date"
                          required={wfhData.is_wfh}
                          min={wfhData.start_date}
                          className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          value={wfhData.end_date}
                          onChange={(e) => setWfhData({...wfhData, end_date: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                       <Calendar className="text-amber-500 shrink-0" size={16} />
                       <p className="text-[10px] text-amber-700 leading-normal">
                          Penyetelan ini akan memicu pembuatan <b>Pengumuman WFH</b> secara otomatis.
                       </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 h-12 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl text-sm font-bold text-white bg-[#1a1a2e] hover:bg-[#2d2d44] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Terapkan Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WFHPage() {
  return (
    <PermissionGuard slug="manage-wfh">
      <Suspense fallback={<div className="p-10 text-center text-gray-400">Memuat modul WFH...</div>}>
        <WFHContent />
      </Suspense>
    </PermissionGuard>
  );
}
