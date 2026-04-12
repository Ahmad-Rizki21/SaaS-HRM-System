"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { CheckCircle, XCircle, Clock, Calendar, DollarSign, User, ExternalLink } from "lucide-react";
import { ListPageSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface ApprovalItem {
  id: number;
  type: "leave" | "reimbursement" | "profile" | "overtime" | "permit";
  user_name: string;
  category: string; // "Cuti Tahunan", "Bensin", etc.
  description: string;
  amount?: string;
  start_date?: string;
  end_date?: string;
  status: "pending" | "approved" | "rejected";
  attachment?: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "leave" | "reimbursement" | "profile" | "overtime" | "permit">("all");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [actionModal, setActionModal] = useState<{isOpen: boolean, action: "approve" | "reject" | null, item: ApprovalItem | null}>({isOpen: false, action: null, item: null});
  const [remarkInput, setRemarkInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStorageUrl = (path: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000";
    return `${backendUrl}/storage/${path}`;
  };

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const [leaveRes, reimRes, profileRes, overtimeRes, permitRes] = await Promise.all([
        axiosInstance.get("/leave?status=pending"),
        axiosInstance.get("/reimbursements?status=pending"),
        axiosInstance.get("/profile-requests?status=pending"),
        axiosInstance.get("/overtimes?status=pending"),
        axiosInstance.get("/permits?status=pending")
      ]);

      const lData = leaveRes.data.data;
      const leaves = (Array.isArray(lData) ? lData : (lData?.data || [])).map((l: any) => ({
        id: l.id,
        type: "leave",
        user_name: l.user?.name || "Karyawan",
        description: l.reason,
        category: l.type,
        start_date: l.start_date,
        end_date: l.end_date,
        status: l.status,
        attachment: null,
        created_at: l.created_at,
        target_supervisor_id: l.user?.supervisor_id
      }));

      const rData = reimRes.data.data;
      const reimbursements = (Array.isArray(rData) ? rData : (rData?.data || [])).map((r: any) => ({
        id: r.id,
        type: "reimbursement",
        user_name: r.user?.name || "Karyawan",
        description: r.description,
        category: "Reimbursement",
        amount: r.amount,
        status: r.status,
        attachment: r.attachment,
        created_at: r.created_at
      }));

      const oData = overtimeRes.data.data;
      const overtimes = (Array.isArray(oData) ? oData : (oData?.data || [])).map((o: any) => ({
        id: o.id,
        type: "overtime",
        user_name: o.user?.name || "Karyawan",
        description: o.reason,
        category: "Lembur",
        start_date: o.start_time,
        end_date: o.end_time,
        status: o.status,
        attachment: null,
        created_at: o.created_at
      }));

      const pData = profileRes.data.data;
      const profiles = (Array.isArray(pData) ? pData : (pData?.data || [])).map((p: any) => ({
        id: p.id,
        type: "profile",
        user_name: p.user?.name || "Karyawan",
        description: `Update data: ${Object.keys(p.new_data).join(", ")}`,
        category: "Perubahan Profil",
        status: p.status,
        attachment: null,
        created_at: p.created_at
      }));

      const peData = permitRes.data.data;
      const permits = (Array.isArray(peData) ? peData : (peData?.data || [])).map((pe: any) => ({
        id: pe.id,
        type: "permit",
        user_name: pe.user?.name || "Karyawan",
        description: pe.reason,
        category: pe.type,
        start_date: pe.start_date,
        end_date: pe.end_date,
        status: pe.status,
        attachment: null,
        created_at: pe.created_at
      }));

      const isHR = currentUser?.role_id === 1 || currentUser?.permissions?.includes('approve-leaves');

      const merged = [...leaves, ...reimbursements, ...profiles, ...overtimes, ...permits]
        .filter(item => {
           if (item.type === 'leave') {
              if (item.status === 'pending_supervisor') {
                 // Hanya supervisor dari ybs ATAU HRD (kalau bypass diizinkan, tp lbh baik cm supervisor) yang liat
                 // Sesuai request: HRD gausah liat dulu sblm diacc supervisor biar ga nyampah di dahsboard HRD
                 return item.target_supervisor_id === currentUser?.id;
              }
              if (item.status === 'pending_hr') {
                 // Hanya HRD yang lihat
                 return isHR;
              }
              if (item.status === 'pending') {
                 // Fallback untuk legacy single-stage
                 return isHR || item.target_supervisor_id === currentUser?.id;
              }
              return false;
           }
           // Untuk modul lain spt lembur, klaim dll (masih single stage)
           return item.status === "pending" || item.status === "waiting_approval";
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(merged);
    } catch (e) {
      console.error("Gagal ambil data pengajuan", e);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (item: ApprovalItem, action: "approve" | "reject") => {
    setActionModal({ isOpen: true, action, item });
    setRemarkInput("");
  };

  const executeAction = async () => {
    const { action, item } = actionModal;
    if (!action || !item || isSubmitting) return;

    if (action === 'reject' && !remarkInput.trim() && (item.type === 'reimbursement' || item.type === 'overtime')) {
        alert("Alasan penolakan WAJIB diisi!");
        return;
    }
    
    setIsSubmitting(true);
    setProcessingId(`${item.type}-${item.id}`);
    
    try {
      let endpoint = "";
      if (item.type === 'leave') endpoint = '/leave';
      else if (item.type === 'reimbursement') endpoint = '/reimbursements';
      else if (item.type === 'profile') endpoint = '/profile-requests';
      else if (item.type === 'overtime') endpoint = '/overtimes';
      else if (item.type === 'permit') endpoint = '/permits';

      console.log(`Processing ${action} for ${item.type} ID: ${item.id}`);
      await axiosInstance.post(`${endpoint}/${item.id}/${action}`, { remark: remarkInput });
      
      // Play a satisfying 'success' sound on the Admin side
      try {
          const audio = new window.Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.8;
          audio.play().catch(e => console.log(e));
      } catch (e) {}

      alert(`Berhasil ${action === 'approve' ? 'menyetujui' : 'menolak'} pengajuan.`);
      setActionModal({ isOpen: false, action: null, item: null });
      await fetchApprovals();
    } catch (e: any) {
      console.error("Error processing approval:", e);
      alert("Gagal memproses pengajuan: " + (e.response?.data?.message || "Terjadi kesalahan server"));
    } finally {
      setIsSubmitting(false);
      setProcessingId(null);
    }
  };

  const handleViewDetail = (item: any) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  if (loading && items.length === 0) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Persetujuan Pending</h1>
          <p className="text-sm text-gray-500 mt-1">Review dan proses pengajuan karyawan yang memerlukan persetujuan Anda.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'all' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Semua</button>
          <button onClick={() => setFilter("leave")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'leave' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Cuti</button>
          <button onClick={() => setFilter("reimbursement")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'reimbursement' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Klaim</button>
          <button onClick={() => setFilter("overtime")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'overtime' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Lembur</button>
          <button onClick={() => setFilter("permit")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'permit' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Izin</button>
          <button onClick={() => setFilter("profile")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'profile' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Profil</button>
        </div>
      </div>

      <div className="space-y-4">
        {items.filter(item => filter === 'all' || item.type === filter).length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Semua Beres!</h3>
            <p className="text-sm text-gray-500">Tidak ada pengajuan yang memerlukan tindakan saat ini.</p>
          </div>
        ) : (
          items.filter(item => filter === 'all' || item.type === filter).map(item => (
            <div key={`${item.type}-${item.id}`} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start gap-6">
              <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${
                item.type === 'leave' ? 'bg-blue-50 text-blue-600' : 
                item.type === 'reimbursement' ? 'bg-emerald-50 text-emerald-600' :
                'bg-orange-50 text-orange-600'
              }`}>
                {item.type === 'leave' ? <Calendar size={28} /> : 
                 item.type === 'permit' ? <CheckCircle size={28} /> : 
                 item.type === 'reimbursement' ? <DollarSign size={28} /> : 
                 item.type === 'overtime' ? <Clock size={28} /> : 
                 <User size={28} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">{item.user_name}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">{item.type}</span>
                </div>
                <h4 className="text-base font-bold text-gray-800 mb-1">{item.category}</h4>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 italic">"{item.description || 'Tanpa keterangan'}"</p>
                
                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  {item.start_date && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock size={14} /> {item.start_date} s/d {item.end_date}
                    </div>
                  )}
                  {item.amount && (
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      IDR {parseInt(item.amount).toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">{new Date(item.created_at).toLocaleDateString()}</div>
                  {item.attachment && (
                    <button 
                      onClick={() => handleViewDetail(item)}
                      className="flex items-center gap-1 text-[#8B0000] font-bold hover:underline"
                    >
                      <ExternalLink size={14} /> Lihat Bukti
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                <button 
                  onClick={() => handleActionClick(item, 'reject')}
                  disabled={processingId === `${item.type}-${item.id}`}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                >
                  <XCircle size={18} /> {processingId === `${item.type}-${item.id}` ? "..." : "Tolak"}
                </button>
                <button 
                  onClick={() => handleActionClick(item, 'approve')}
                  disabled={processingId === `${item.type}-${item.id}`}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <CheckCircle size={18} /> {processingId === `${item.type}-${item.id}` ? "..." : "Setujui"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">Detail Pengajuan</h3>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#8B0000] font-bold text-xl shadow-sm italic">
                    {selectedItem.user_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{selectedItem.user_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider font-bold">{selectedItem.type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-2xl">
                    <p className="text-[10px] uppercase font-black text-gray-400 mb-1">KATEGORI</p>
                    <p className="text-sm font-bold text-gray-800">{selectedItem.category}</p>
                  </div>
                  {selectedItem.amount && (
                    <div className="p-4 border border-emerald-100 bg-emerald-50/30 rounded-2xl">
                        <p className="text-[10px] uppercase font-black text-emerald-600/70 mb-1">NOMINAL</p>
                        <p className="text-sm font-bold text-emerald-700 italic">IDR {parseInt(selectedItem.amount).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-2 px-1">DESKRIPSI / ALASAN</p>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-sm text-gray-600 italic">"{selectedItem.description || 'Tidak ada keterangan tambahan'}"</p>
                  </div>
                </div>

                {selectedItem.attachment && (
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400 mb-2 px-1">BUKTI PENDUKUNG (ATTACHMENT)</p>
                    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-100 group relative">
                        <img 
                            src={getStorageUrl(selectedItem.attachment)} 
                            alt="Evidence" 
                            className="w-full h-auto max-h-[300px] object-contain mx-auto"
                            onError={(e) => {
                                (e.target as any).src = 'https://placehold.co/600x400?text=Bukti+Gagal+Dimuat';
                            }}
                        />
                        <a 
                            href={getStorageUrl(selectedItem.attachment)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-sm"
                        >
                            <ExternalLink size={20} className="mr-2" /> Buka Ukuran Penuh
                        </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleActionClick(selectedItem, 'reject');
                  }}
                  className="flex-1 py-3 text-sm font-bold text-red-600 border border-red-100 bg-white rounded-xl hover:bg-red-50 transition shadow-sm"
                >
                  Tolak
                </button>
                <button 
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleActionClick(selectedItem, 'approve');
                  }}
                  className="flex-2 py-3 text-sm font-bold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition"
                >
                  Setujui Sekarang
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && actionModal.item && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className={`font-bold text-lg ${actionModal.action === 'approve' ? 'text-emerald-700' : 'text-red-700'}`}>
                {actionModal.action === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
              </h3>
              <button 
                onClick={() => setActionModal({ isOpen: false, action: null, item: null })}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6">
              {actionModal.item.attachment && (
                <div className="mb-4 rounded-xl border overflow-hidden bg-gray-50">
                  <p className="text-[10px] font-black text-gray-400 bg-gray-100/50 px-3 py-1 border-b">BUKTI LAMPIRAN</p>
                  <img 
                    src={getStorageUrl(actionModal.item.attachment)} 
                    alt="Receipt" 
                    className="w-full h-auto max-h-[250px] object-contain mx-auto"
                    onError={(e) => {
                        (e.target as any).src = 'https://placehold.co/600x400?text=Bukti+Gagal+Dimuat';
                    }}
                  />
                </div>
              )}
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
                  onClick={() => setActionModal({ isOpen: false, action: null, item: null })}
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  onClick={executeAction}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 ${actionModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10' : 'bg-red-600 hover:bg-red-700 shadow-red-900/10'}`}
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi"}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
