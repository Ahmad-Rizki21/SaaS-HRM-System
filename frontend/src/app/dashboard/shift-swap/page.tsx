"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { 
  ArrowLeftRight, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  ChevronRight,
  AlertCircle,
  Search,
  Check,
  X,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ListPageSkeleton } from "@/components/Skeleton";

interface ShiftSwap {
  id: number;
  requester_id: number;
  receiver_id: number;
  requester_schedule_id: number;
  receiver_schedule_id: number;
  status: 'pending_receiver' | 'pending_manager' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  remark?: string;
  created_at: string;
  requester: { name: string };
  receiver: { name: string };
  requester_schedule: { date: string; shift: { name: string; start_time: string; end_time: string } };
  receiver_schedule: { date: string; shift: { name: string; start_time: string; end_time: string } };
}

interface WebUser {
  id: number;
  name: string;
}

interface Schedule {
  id: number;
  date: string;
  shift: { name: string; start_time: string; end_time: string };
}

export default function ShiftSwapPage() {
  const { user, hasPermission } = useAuth();
  const [swaps, setSwaps] = useState<ShiftSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Form State
  const [users, setUsers] = useState<WebUser[]>([]);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [receiverSchedules, setReceiverSchedules] = useState<Schedule[]>([]);
  
  const [formData, setFormData] = useState({
    receiver_id: "",
    requester_schedule_id: "",
    receiver_schedule_id: "",
    reason: ""
  });

  const [activeTab, setActiveTab] = useState<'my_requests' | 'to_review'>('my_requests');

  useEffect(() => {
    fetchSwaps();
    fetchInitialData();
  }, []);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/shift-swap");
      setSwaps(res.data.data || []);
    } catch (e) {
      console.error("Gagal ambil data tukar shift", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      // Ambil daftar karyawan (untuk tujuan tukar)
      const usersRes = await axiosInstance.get("/employees");
      setUsers(usersRes.data.data.data || []);

      // Ambil jadwal saya
      const mySchedRes = await axiosInstance.get("/schedules");
      // Filter schedules to be future-ish or simple list
      setMySchedules(mySchedRes.data.data || []);
    } catch (e) {
      console.error("Gagal ambil data pendukung", e);
    }
  };

  const fetchReceiverSchedules = async (receiverId: string) => {
    if (!receiverId) return;
    try {
      const res = await axiosInstance.get(`/schedules?user_id=${receiverId}`);
      setReceiverSchedules(res.data.data || []);
    } catch (e) {
      console.error("Gagal ambil jadwal penerima", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receiver_id || !formData.requester_schedule_id || !formData.receiver_schedule_id) {
      alert("Mohon lengkapi semua pilihan jadwal.");
      return;
    }

    setIsSubmitLoading(true);
    try {
      await axiosInstance.post("/shift-swap", formData);
      alert("Permintaan tukar shift berhasil dikirim!");
      setIsModalOpen(false);
      setFormData({ receiver_id: "", requester_schedule_id: "", receiver_schedule_id: "", reason: "" });
      fetchSwaps();
    } catch (e: any) {
      alert(e.response?.data?.message || "Gagal mengirim permintaan.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleRespond = async (id: number, status: 'approved_by_receiver' | 'rejected') => {
    const remark = prompt("Masukkan catatan (opsional):");
    try {
      await axiosInstance.post(`/shift-swap/${id}/respond`, { status, remark });
      alert("Respon berhasil dikirim.");
      fetchSwaps();
    } catch (e: any) {
      alert(e.response?.data?.message || "Gagal memproses respon.");
    }
  };

  const handleApprove = async (id: number, status: 'approved' | 'rejected') => {
    if (!confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} tukar shift ini secara permanen?`)) return;
    try {
      await axiosInstance.post(`/shift-swap/${id}/approve`, { status });
      alert(`Berhasil ${status === 'approved' ? 'menyetujui' : 'menolak'} pengajuan.`);
      fetchSwaps();
    } catch (e: any) {
      alert(e.response?.data?.message || "Gagal memproses approval.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_receiver': return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100 italic">Menunggu Penerima</span>;
      case 'pending_manager': return <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-100 italic">Menunggu Atasan</span>;
      case 'approved': return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100 italic">Berhasil Ditukar</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-100 italic">Ditolak</span>;
      default: return <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-100 italic text-italic">{status}</span>;
    }
  };

  if (loading && swaps.length === 0) return <ListPageSkeleton />;

  const myRequests = swaps.filter(s => s.requester_id === user?.id || (s.receiver_id === user?.id && s.status === 'pending_receiver'));
  const managerReview = swaps.filter(s => s.status === 'pending_manager');

  return (
    <div className="max-w-[1100px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-[#8B0000] rounded-2xl text-white shadow-xl shadow-red-900/20">
              <ArrowLeftRight size={28} />
            </div>
            Tukar Shift
          </h1>
          <p className="text-sm text-gray-500 font-medium">Ajukan pertukaran jadwal kerja dengan rekan tim Anda secara resmi.</p>
        </div>
        {hasPermission('apply-shift-swaps') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#8B0000] text-white font-bold rounded-2xl shadow-2xl shadow-red-900/30 hover:bg-[#A52A2A] transition-all active:scale-95 group"
          >
            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            Ajukan Tukar Baru
          </button>
        )}
      </div>

      {/* Stats/Quick Glance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Me</p>
            <p className="text-xl font-black text-gray-900">{swaps.filter(s => s.receiver_id === user?.id && s.status === 'pending_receiver').length}</p>
          </div>
        </div>
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Wait Manager</p>
            <p className="text-xl font-black text-gray-900">{swaps.filter(s => s.requester_id === user?.id && s.status === 'pending_manager').length}</p>
          </div>
        </div>
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Approved</p>
            <p className="text-xl font-black text-gray-900">{swaps.filter(s => s.status === 'approved').length}</p>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-gray-100 gap-8">
           <button 
            onClick={() => setActiveTab('my_requests')}
            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'my_requests' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
           >
             Permintaan Saya
             {activeTab === 'my_requests' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8B0000] rounded-t-full" />}
           </button>
           {hasPermission('approve-shift-swaps') && (
             <button 
              onClick={() => setActiveTab('to_review')}
              className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'to_review' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Approval Manager
               {managerReview.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-red-600 text-[9px] text-white rounded-full align-top">{managerReview.length}</span>}
               {activeTab === 'to_review' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8B0000] rounded-t-full" />}
             </button>
           )}
        </div>

        <div className="space-y-4">
          {(activeTab === 'my_requests' ? myRequests : managerReview).length === 0 ? (
            <div className="py-20 text-center bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
               <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 italic text-gray-300 shadow-sm">
                  <ArrowLeftRight size={40} />
               </div>
               <h3 className="font-black text-gray-900 text-xl italic">No Swap Requests</h3>
               <p className="text-sm text-gray-400 mt-2">Semua jadwal terasa aman dan stabil saat ini.</p>
            </div>
          ) : (
            (activeTab === 'my_requests' ? myRequests : managerReview).map((swap) => (
              <div key={swap.id} className="group bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  {getStatusBadge(swap.status)}
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-stretch">
                   {/* Col 1: Requester */}
                   <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 text-[#8B0000] flex items-center justify-center font-black italic shadow-sm">
                          {swap.requester.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">DARI</p>
                          <p className="text-sm font-bold text-gray-900">{swap.requester.name} {swap.requester_id === user?.id && "(Anda)"}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                         <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                            <Calendar size={14} className="text-[#8B0000]" /> {new Date(swap.requester_schedule.date).toLocaleDateString()}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                            <Clock size={14} /> {swap.requester_schedule.shift.name} ({swap.requester_schedule.shift.start_time} - {swap.requester_schedule.shift.end_time})
                         </div>
                      </div>
                   </div>

                   {/* Center Arrow */}
                   <div className="flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg rotate-90 md:rotate-0">
                         <ChevronRight size={20} />
                      </div>
                   </div>

                   {/* Col 2: Receiver */}
                   <div className="flex-1 space-y-4 text-right md:text-left">
                      <div className="flex items-center gap-3 justify-end md:justify-start">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black italic shadow-sm order-last md:order-first">
                          {swap.receiver.name.charAt(0)}
                        </div>
                        <div className="text-right md:text-left">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">KEPADA / TUJUAN</p>
                          <p className="text-sm font-bold text-gray-900">{swap.receiver.name} {swap.receiver_id === user?.id && "(Anda)"}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-800 justify-end md:justify-start">
                            <Calendar size={14} className="text-blue-600" /> {new Date(swap.receiver_schedule.date).toLocaleDateString()}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 justify-end md:justify-start">
                            <Clock size={14} /> {swap.receiver_schedule.shift.name} ({swap.receiver_schedule.shift.start_time} - {swap.receiver_schedule.shift.end_time})
                         </div>
                      </div>
                   </div>

                   {/* Col 3: Details & Actions */}
                   <div className="flex-[0.8] flex flex-col justify-between pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ALASAN</p>
                        <p className="text-xs text-gray-600 italic">"{swap.reason}"</p>
                      </div>

                      <div className="pt-4 flex gap-2">
                        {/* Action for Receiver */}
                        {swap.status === 'pending_receiver' && swap.receiver_id === user?.id && (
                          <>
                            <button onClick={() => handleRespond(swap.id, 'rejected')} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition">Tolak</button>
                            <button onClick={() => handleRespond(swap.id, 'approved_by_receiver')} className="flex-2 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition">Terima</button>
                          </>
                        )}

                        {/* Action for Manager */}
                        {swap.status === 'pending_manager' && hasPermission('approve-shift-swaps') && (
                           <>
                            <button onClick={() => handleApprove(swap.id, 'rejected')} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-xl transition">Reject</button>
                            <button onClick={() => handleApprove(swap.id, 'approved')} className="flex-2 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-900/20 transition">Approve Final</button>
                          </>
                        )}

                        {swap.status === 'approved' && (
                          <div className="w-full flex items-center justify-center gap-2 py-2 text-emerald-600 font-bold text-xs uppercase italic drop-shadow-sm">
                             <Check size={18} /> Pertukaran Sukses
                          </div>
                        )}
                        
                        {(swap.status === 'pending_receiver' && swap.requester_id === user?.id) && (
                           <p className="text-[10px] text-gray-400 font-bold italic w-full text-center">Menunggu respon dari {swap.receiver.name}...</p>
                        )}
                        {(swap.status === 'pending_manager' && swap.requester_id === user?.id) && (
                           <p className="text-[10px] text-orange-400 font-bold italic w-full text-center">Menunggu approval akhir manager...</p>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-red-50 text-[#8B0000] rounded-2xl shadow-sm">
                      <ArrowLeftRight size={24} />
                   </div>
                   <div>
                    <h3 className="font-black text-gray-900 text-xl tracking-tight">Form Tukar Shift</h3>
                    <p className="text-xs text-gray-500 font-medium italic">Pilih jadwal rekan yang ingin Anda tukar.</p>
                   </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors font-black">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Selection */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">1. PILIH REKAN KERJA</label>
                       <div className="relative">
                          <select 
                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-red-100 focus:border-[#8B0000] appearance-none transition-all"
                            value={formData.receiver_id}
                            onChange={(e) => {
                              setFormData({...formData, receiver_id: e.target.value, receiver_schedule_id: ""});
                              fetchReceiverSchedules(e.target.value);
                            }}
                            required
                          >
                             <option value="">Pilih Teman Kerja...</option>
                             {users.filter(u => u.id !== user?.id).map(u => (
                               <option key={u.id} value={u.id}>{u.name}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    {/* My Schedule */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">2. JADWAL ANDA (YANG AKAN DILEPAS)</label>
                       <select 
                          className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-red-100 focus:border-[#8B0000] transition-all"
                          value={formData.requester_schedule_id}
                          onChange={(e) => setFormData({...formData, requester_schedule_id: e.target.value})}
                          required
                       >
                          <option value="">Pilih Jadwal Anda...</option>
                          {mySchedules.map(s => (
                            <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString()} - {s.shift.name} ({s.shift.start_time})</option>
                          ))}
                       </select>
                    </div>

                    {/* Receiver Schedule */}
                    <div className={`space-y-2 transition-opacity ${!formData.receiver_id ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">3. JADWAL REKAN (YANG DIINGINKAN)</label>
                       <select 
                          className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-red-100 focus:border-[#8B0000] transition-all"
                          value={formData.receiver_schedule_id}
                          onChange={(e) => setFormData({...formData, receiver_schedule_id: e.target.value})}
                          required
                          disabled={!formData.receiver_id}
                       >
                          <option value="">Pilih Jadwal Teman...</option>
                          {receiverSchedules.map(s => (
                            <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString()} - {s.shift.name} ({s.shift.start_time})</option>
                          ))}
                       </select>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">4. ALASAN TUKAR</label>
                        <textarea 
                          className="w-full min-h-[56px] bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium text-gray-800 outline-none focus:ring-4 focus:ring-red-100 focus:border-[#8B0000] transition-all italic"
                          placeholder="Contoh: Ada keperluan dinas luar / urusan keluarga..."
                          value={formData.reason}
                          onChange={(e) => setFormData({...formData, reason: e.target.value})}
                          required
                        />
                    </div>
                 </div>

                 <div className="p-6 bg-[#FAF9F6] border-2 border-dashed border-red-50 rounded-[32px] flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center text-red-600 shrink-0">
                       <AlertCircle size={20} />
                    </div>
                    <div className="space-y-1">
                       <p className="text-xs font-black text-gray-900 uppercase">Perhatian PENTING</p>
                       <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic">Permintaan ini akan valid SEGERA setelah rekan Anda menyetujui DAN Manager memberikan konfirmasi akhir. Pastikan sudah berdiskusi secara internal sebelum mengajukan.</p>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="flex-1 py-4 text-sm font-black text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200 transition active:scale-95"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitLoading}
                      className="flex-2 py-4 text-sm font-black text-white bg-[#8B0000] rounded-2xl shadow-xl shadow-red-900/30 hover:bg-[#A52A2A] transition disabled:opacity-50 active:scale-95"
                    >
                      {isSubmitLoading ? "Memproses..." : "Kirim Pengajuan"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
