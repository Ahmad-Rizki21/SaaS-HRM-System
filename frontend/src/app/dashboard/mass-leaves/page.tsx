"use client";

import { useEffect, useState, Suspense } from "react";
import axiosInstance from "@/lib/axios";
import { Search, Plus, Trash2, Calendar, FileText, CheckCircle2, AlertCircle, X, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/PermissionGuard";
import Pagination from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";
import { useSearchParams } from "next/navigation";

interface MassLeave {
  id: number;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  is_deduction: boolean;
  all_employees: boolean;
  employee_ids?: number[];
  created_at: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
}

function MassLeaveContent() {
  const { hasPermission } = useAuth();
  const [massLeaves, setMassLeaves] = useState<MassLeave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Cuti Bersama",
    start_date: "",
    end_date: "",
    is_deduction: true,
    all_employees: true,
    employee_ids: [] as number[],
  });

  useEffect(() => {
    fetchMassLeaves(page);
    if (isModalOpen) fetchEmployees();
  }, [page, isModalOpen]);

  const fetchMassLeaves = async (p = 1) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/mass-leave?page=${p}`);
      setMassLeaves(res.data.data.data || []);
      setPagination(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get('/employees?per_page=100');
      setEmployees(res.data.data.data || []);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/mass-leave', formData);
      alert("Cuti bersama berhasil ditambahkan!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        type: "Cuti Bersama",
        start_date: "",
        end_date: "",
        is_deduction: true,
        all_employees: true,
        employee_ids: [],
      });
      fetchMassLeaves(1);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyimpan cuti bersama.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus cuti bersama ini? Saldo cuti karyawan yang terpotong akan dikembalikan.")) return;
    try {
      await axiosInstance.delete(`/mass-leave/${id}`);
      fetchMassLeaves(page);
    } catch (e) { alert("Gagal menghapus."); }
  };

  return (
    <div className="space-y-6">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title tracking-tight">Manajemen Cuti Bersama</h1>
          <p className="dash-page-desc">Atur libur massal perusahaan yang otomatis memotong (atau tidak) jatah cuti tahunan Karyawan.</p>
        </div>
        <div className="dash-page-actions">
           <PermissionGuard slug="approve-leaves">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="dash-btn dash-btn-primary"
              >
                <Plus size={16} />
                Tambah Cuti Bersama
              </button>
           </PermissionGuard>
        </div>
      </div>

      <div className="dash-table-container">
        {loading ? <TableSkeleton rows={5} cols={5} /> : (
          <div className="dash-table-wrapper">
             <table className="dash-table">
                <thead>
                   <tr>
                      <th>Nama Kegiatan</th>
                      <th>Periode</th>
                      <th>Tipe</th>
                      <th className="text-center">Potong Saldo?</th>
                      <th className="text-right">Aksi</th>
                   </tr>
                </thead>
                <tbody>
                   {massLeaves.map(item => (
                     <tr key={item.id}>
                        <td>
                           <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{item.name}</span>
                              <span className="text-[10px] text-gray-400 font-medium">DIBUAT: {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                           </div>
                        </td>
                        <td>
                           <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar size={14} className="text-gray-400" />
                              {item.start_date === item.end_date ? (
                                <span>{new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              ) : (
                                <span>{new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(item.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              )}
                           </div>
                        </td>
                        <td>
                           <span className="dash-badge dash-badge-neutral">{item.type}</span>
                        </td>
                        <td className="text-center">
                           {item.is_deduction ? (
                             <span className="inline-flex items-center gap-1.5 text-amber-600 font-black text-[10px] uppercase bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                               <CheckCircle2 size={12} /> YA
                             </span>
                           ) : (
                             <span className="inline-flex items-center gap-1.5 text-gray-400 font-black text-[10px] uppercase bg-gray-50 px-2 py-1 rounded-full">
                               <X size={12} /> TIDAK
                             </span>
                           )}
                        </td>
                        <td className="text-right">
                           <button 
                             onClick={() => handleDelete(item.id)}
                             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                           >
                              <Trash2 size={16} />
                           </button>
                        </td>
                     </tr>
                   ))}
                   {massLeaves.length === 0 && (
                     <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400 text-sm italic">Belum ada data cuti bersama.</td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
        )}
        {!loading && pagination && (
          <Pagination 
            currentPage={pagination.current_page} 
            lastPage={pagination.last_page} 
            total={pagination.total} 
            onPageChange={setPage} 
          />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-50">
               <div>
                <h3 className="font-black text-xl text-gray-900 tracking-tight">Tambah Cuti Bersama</h3>
                <p className="text-xs text-gray-400 font-medium">Buat pengumuman libur massal untuk tim.</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
                  <X size={20} />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-500 tracking-widest">Nama Kegiatan / Libur</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: Idul Fitri 1447H"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 caret-blue-600 transition-all font-medium"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-500 tracking-widest">Tanggal Mulai</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                      value={formData.start_date}
                      onChange={e => setFormData({...formData, start_date: e.target.value, end_date: formData.end_date || e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-500 tracking-widest">Tanggal Berakhir</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                      value={formData.end_date}
                      onChange={e => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
               </div>

               <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                        <AlertCircle size={20} />
                     </div>
                     <div>
                        <p className="text-sm font-black text-gray-900">Potong Quota Tahunan?</p>
                        <p className="text-[10px] text-gray-400 font-medium">Jika Aktif, jatah cuti karyawan akan otomatis berkurang.</p>
                     </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.is_deduction} onChange={e => setFormData({...formData, is_deduction: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <label className="text-xs font-black uppercase text-gray-500 tracking-widest">Target Karyawan</label>
                     <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                           <input type="radio" name="target" checked={formData.all_employees} onChange={() => setFormData({...formData, all_employees: true})} className="accent-blue-600 w-4 h-4" />
                           <span className="text-xs font-black text-gray-600 group-hover:text-gray-900">SEMUA</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                           <input type="radio" name="target" checked={!formData.all_employees} onChange={() => setFormData({...formData, all_employees: false})} className="accent-blue-600 w-4 h-4" />
                           <span className="text-xs font-black text-gray-600 group-hover:text-gray-900">TERPILIH</span>
                        </label>
                     </div>
                  </div>
                  
                  {!formData.all_employees && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 animate-in slide-in-from-top-2">
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Daftar Karyawan Terpilih ({formData.employee_ids.length})</p>
                       <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {employees.map(emp => (
                            <label key={emp.id} className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group ${formData.employee_ids.includes(emp.id) ? 'bg-white shadow-sm border-gray-100 border' : 'hover:bg-gray-100 border border-transparent'}`}>
                               <input 
                                 type="checkbox" 
                                 className="accent-blue-600"
                                 checked={formData.employee_ids.includes(emp.id)}
                                 onChange={() => {
                                   const ids = [...formData.employee_ids];
                                   if(ids.includes(emp.id)) setFormData({...formData, employee_ids: ids.filter(i => i !== emp.id)});
                                   else setFormData({...formData, employee_ids: [...ids, emp.id]});
                                 }}
                               />
                               <span className="text-xs font-medium text-gray-700 truncate group-hover:text-gray-900">{emp.name}</span>
                            </label>
                          ))}
                       </div>
                    </div>
                  )}
               </div>

               <div className="flex gap-4 pt-4 border-t border-gray-50">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-white text-gray-600 font-black text-xs uppercase tracking-widest rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-2 py-4 bg-[#1a1a2e] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#2d2d44] transition-all shadow-xl shadow-blue-900/10 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? "Memproses..." : "Ajukan Cuti Bersama"}
                    {!isSubmitting && <CheckCircle2 size={16} />}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MassLeavePage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} cols={5} />}>
       <MassLeaveContent />
    </Suspense>
  );
}
