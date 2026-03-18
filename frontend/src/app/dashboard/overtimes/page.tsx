"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Plus, Search, Check, X, Eye, Clock, Printer } from "lucide-react";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import { TableSkeleton } from "@/components/Skeleton";

export default function OvertimesPage() {
  const { hasPermission, user } = useAuth();
  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [actionModal, setActionModal] = useState<{isOpen: boolean, action: "approve" | "reject" | null, id: number | null}>({isOpen: false, action: null, id: null});
  const [remarkInput, setRemarkInput] = useState("");

  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    reason: ""
  });

  useEffect(() => {
    fetchOvertimes(page);
  }, [page]);

  const fetchOvertimes = async (pageNumber: number) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/overtimes?page=${pageNumber}`);
      setOvertimes(response.data.data?.data || response.data.data || []);
      if (response.data.data && response.data.data.current_page) {
        setPagination({
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
          total: response.data.data.total
        });
      }
    } catch (e) {
      console.error("Gagal mendapatkan data lembur", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/overtimes", formData);
      alert("Pengajuan lembur berhasil! Menunggu persetujuan.");
      setIsModalOpen(false);
      setFormData({ date: "", start_time: "", end_time: "", reason: "" });
      fetchOvertimes(page);
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal mengajukan lembur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionClick = (id: number, action: "approve" | "reject") => {
    setActionModal({ isOpen: true, action, id });
    setRemarkInput("");
  };

  const executeAction = async () => {
    const { action, id } = actionModal;
    if (!action || !id) return;

    if (action === 'reject' && !remarkInput.trim()) {
        alert("Alasan penolakan WAJIB diisi!");
        return;
    }

    setActionModal({ isOpen: false, action: null, id: null });
    
    try {
      await axiosInstance.post(`/overtimes/${id}/${action}`, { remark: remarkInput });
      alert(`Lembur ${action === 'approve' ? 'disetujui' : 'ditolak'}.`);
      fetchOvertimes(page);
    } catch (e: any) {
      alert("Gagal memproses persetujuan: " + (e.response?.data?.message || "Kesalahan server"));
    }
  };

  const handleViewDetail = (item: any) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="dash-badge dash-badge-warning">Menunggu</span>;
      case 'approved': return <span className="dash-badge dash-badge-success">Disetujui</span>;
      case 'rejected': return <span className="dash-badge dash-badge-danger">Ditolak</span>;
      default: return <span className="dash-badge dash-badge-neutral">{status}</span>;
    }
  };

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Lembur Karyawan</h1>
          <p className="dash-page-desc">Kelola persetujuan dan riwayat pengajuan lembur karyawan.</p>
        </div>
        <div className="dash-page-actions">
           <button 
             onClick={() => setIsModalOpen(true)} 
             className="dash-btn dash-btn-primary"
           >
             <Plus size={15} />
             Ajukan Lembur
           </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white p-3 border border-[#ebedf0] rounded-lg">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari pengajuan lembur..."
            className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      <div className="dash-table-container">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={6} cols={6} /></div>
        ) : overtimes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm font-medium">
            Tidak ada data pengajuan lembur.
          </div>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Info Karyawan</th>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                  <th>Alasan</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {overtimes.map((ot) => (
                  <tr key={ot.id}>
                    <td>
                      <span className="font-bold text-gray-900">{ot.user?.name || "Karyawan"}</span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-700">{ot.date}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <Clock size={14} className="text-gray-400" />
                        {ot.start_time.substring(0,5)} - {ot.end_time.substring(0,5)}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-gray-500 block truncate max-w-[150px]">
                        {ot.reason || "-"}
                      </span>
                    </td>
                    <td>{getStatusBadge(ot.status)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          className="dash-action-btn view" 
                          title="Lihat Detail"
                          onClick={() => handleViewDetail(ot)}
                        >
                          <Eye size={16} />
                        </button>
                        {ot.status === 'pending' && user?.role_id && [2, 3, 4].includes(user.role_id) && (
                          <>
                            <button 
                              className="dash-action-btn edit" 
                              title="Setujui"
                              onClick={() => handleActionClick(ot.id, 'approve')}
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              className="dash-action-btn delete" 
                              title="Tolak"
                              onClick={() => handleActionClick(ot.id, 'reject')}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {pagination.last_page > 1 && (
          <Pagination 
            currentPage={pagination.current_page} 
            lastPage={pagination.last_page} 
            total={pagination.total} 
            onPageChange={setPage} 
          />
        )}
      </div>

      {/* MODAL AJUKAN LEMBUR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Form Pengajuan Lembur</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tanggal Lembur</label>
                <input 
                  type="date" 
                  className="w-full h-11 border border-gray-100 bg-gray-50 rounded-xl px-4 text-sm outline-none focus:border-[#8B0000] focus:ring-4 focus:ring-[#8B0000]/5 transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Jam Mulai</label>
                  <input 
                    type="time" 
                    className="w-full h-11 border border-gray-100 bg-gray-50 rounded-xl px-4 text-sm outline-none focus:border-[#8B0000] transition-all"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Jam Selesai</label>
                  <input 
                    type="time" 
                    className="w-full h-11 border border-gray-100 bg-gray-50 rounded-xl px-4 text-sm outline-none focus:border-[#8B0000] transition-all"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Alasan Lembur</label>
                <textarea 
                  className="w-full border border-gray-100 bg-gray-50 rounded-xl p-4 text-sm outline-none focus:border-[#8B0000] min-h-[100px] transition-all"
                  placeholder="Jelaskan kebutuhan lembur anda..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 text-sm font-bold text-white bg-[#8B0000] rounded-xl shadow-lg shadow-[#8B0000]/10 hover:shadow-[#8B0000]/20 disabled:opacity-50 transition-all active:scale-95"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setIsDetailModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Detail Pengajuan Lembur</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: #{selectedItem.id}</p>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 border border-transparent hover:border-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <div className="w-12 h-12 rounded-xl bg-[#8B0000]/5 text-[#8B0000] flex items-center justify-center font-bold text-xl uppercase italic">
                    {selectedItem.user?.name?.charAt(0) || "K"}
                 </div>
                 <div>
                    <p className="text-sm font-bold text-gray-900">{selectedItem.user?.name || "Karyawan"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                       {getStatusBadge(selectedItem.status)}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-gray-50 rounded-2xl bg-white shadow-sm">
                  <span className="text-[10px] font-black uppercase text-gray-400 mb-1 block">TANGGAL</span>
                  <p className="text-sm font-bold text-gray-900">{selectedItem.date}</p>
                </div>
                <div className="p-4 border border-gray-50 rounded-2xl bg-white shadow-sm">
                   <span className="text-[10px] font-black uppercase text-gray-400 mb-1 block">DURASI</span>
                   <p className="text-sm font-bold text-gray-900">{selectedItem.start_time.substring(0,5)} - {selectedItem.end_time.substring(0,5)}</p>
                </div>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">ALASAN LEMBUR</span>
                <p className="text-sm text-gray-600 leading-relaxed font-medium italic italic">"{selectedItem.reason}"</p>
              </div>

              {selectedItem.remark && (
                <div className={`p-5 rounded-2xl border ${selectedItem.status === 'rejected' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-teal-50 border-teal-100 text-teal-800'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1.5 block">CATATAN HR</span>
                  <p className="text-sm font-bold">{selectedItem.remark}</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
               <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full h-11 text-sm font-bold text-white bg-gray-900 rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  Tutup
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && actionModal.id && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className={`font-bold text-lg ${actionModal.action === 'approve' ? 'text-emerald-700' : 'text-red-700'}`}>
                {actionModal.action === 'approve' ? 'Setujui Lembur' : 'Tolak Lembur'}
              </h3>
              <button 
                onClick={() => setActionModal({ isOpen: false, action: null, id: null })}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Tuliskan {actionModal.action === 'approve' ? 'catatan (opsional)' : 'alasan penolakan (WAJIB)'} untuk pengajuan ini.
              </p>
              <textarea
                className="w-full border border-gray-200 bg-gray-50 rounded-xl p-4 text-sm outline-none focus:border-[#8B0000] focus:ring-4 focus:ring-[#8B0000]/5 min-h-[100px] transition-all"
                placeholder={actionModal.action === 'approve' ? 'Tulis catatan...' : 'Tulis alasan penolakan...'}
                value={remarkInput}
                onChange={(e) => setRemarkInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
               <button 
                  onClick={() => setActionModal({ isOpen: false, action: null, id: null })}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button 
                  onClick={executeAction}
                  className={`flex-1 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition active:scale-95 ${actionModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10' : 'bg-red-600 hover:bg-red-700 shadow-red-900/10'}`}
                >
                  Konfirmasi
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
