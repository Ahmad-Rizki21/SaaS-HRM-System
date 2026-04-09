"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { 
  User, 
  Calendar, 
  Filter, 
  ChevronRight, 
  FileSpreadsheet, 
  AlertCircle, 
  Map as MapIcon, 
  BarChart3, 
  History, 
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Smartphone,
  UserX,
  Camera,
  Edit2,
  Save,
  X
} from "lucide-react";
import Pagination from "@/components/Pagination";
import { ReportSkeleton } from "@/components/Skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

// Nested Components for each Tab
const LogView = ({ employees, startDate, endDate, selectedUser, onStartDateChange, onEndDateChange, onUserChange }: any) => {
  const { hasPermission } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Correction Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [editData, setEditData] = useState<any>({ check_out: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/attendance/history?page=${p}&start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`);
      setHistory(res.data.data.data || []);
      setPagination(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(page); }, [page, startDate, endDate, selectedUser]);

  const handleEditClick = (row: any) => {
    setSelectedRow(row);
    // Format date for datetime-local input
    const outDate = row.check_out ? new Date(row.check_out) : new Date(row.check_in);
    const offset = outDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(outDate.getTime() - offset)).toISOString().slice(0, 16);
    
    setEditData({ check_out: localISOTime });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.put(`/attendance/${selectedRow.id}`, {
        check_out: editData.check_out
      });
      alert("Absensi berhasil diperbarui!");
      setIsEditModalOpen(false);
      fetchHistory(page);
    } catch (e: any) {
      alert(e.response?.data?.message || "Gagal memperbarui absensi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'present': return <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-100">Hadir</span>;
      case 'late': return <span className="text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-100">Terlambat</span>;
      case 'no_schedule': return <span className="text-gray-400 font-bold text-[10px] bg-gray-50 px-2 py-0.5 rounded uppercase tracking-wider border border-gray-100">Luar Jadwal</span>;
      case 'office_hour': return <span className="text-blue-600 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider border border-blue-100">Office Hour</span>;
      default: return <span className="text-gray-600 font-bold text-[10px] bg-gray-50 px-2 py-0.5 rounded uppercase tracking-wider border border-gray-100">{status}</span>;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} className="text-emerald-500" /> Dari Tanggal
          </label>
          <input type="date" className="dash-input-modern h-10!" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} className="text-emerald-500" /> Sampai Tanggal
          </label>
          <input type="date" className="dash-input-modern h-10!" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <User size={12} className="text-emerald-500" /> Pilih Karyawan
          </label>
          <select className="dash-input-modern h-10!" value={selectedUser} onChange={(e) => onUserChange(e.target.value)}>
            <option value="">Semua Karyawan</option>
            {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-32 text-center flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Sinkronisasi Data...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-24 text-center flex flex-col items-center opacity-40">
             <AlertCircle size={64} className="mb-4 text-emerald-100" />
             <h3 className="font-black text-emerald-900 tracking-widest uppercase">Data Kosong</h3>
             <p className="text-xs">Tidak ada rekaman absensi pada rentang waktu ini.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Karyawan</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Masuk</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Keluar</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Koordinat</th>
                    {hasPermission('manage-attendance-corrections') && (
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Opsi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-gray-500">
                        {new Date(row.check_in).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 font-black text-[10px] uppercase shadow-sm">
                              {row.user?.name?.charAt(0)}
                           </div>
                           <div className="flex flex-col">
                             <span className="font-black text-gray-900 text-xs group-hover:text-emerald-700 transition-colors">{row.user?.name}</span>
                             <span className="text-[9px] text-gray-400 font-mono">ID: {row.user?.id}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                           {new Date(row.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.check_out ? (
                          <span className="text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                             {new Date(row.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : <span className="text-[10px] font-black text-rose-300 uppercase tracking-tighter">BELUM OUT</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(row.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[10px] group-hover:text-emerald-500 transition-colors">
                           <MapPin size={12} />
                           {row.latitude_in ? `${Number(row.latitude_in).toFixed(4)}, ${Number(row.longitude_in).toFixed(4)}` : '-'}
                        </div>
                      </td>
                      {hasPermission('manage-attendance-corrections') && (
                        <td className="px-6 py-4 text-right">
                           <button 
                             onClick={() => handleEditClick(row)}
                             className="p-2 rounded-lg hover:bg-emerald-100 text-gray-400 hover:text-emerald-600 transition-all"
                             title="Koreksi Absen"
                           >
                              <Edit2 size={16} />
                           </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && (
              <div className="p-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Menampilkan {history.length} Data</span>
                 <Pagination currentPage={pagination.current_page} lastPage={pagination.last_page} total={pagination.total} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Correction Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
             <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-emerald-50/30">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                      <Edit2 size={20} />
                   </div>
                   <div>
                      <h3 className="font-black text-gray-900 tracking-tight">Koreksi Absensi</h3>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{selectedRow?.user?.name}</p>
                   </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                   <X size={20} />
                </button>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                   <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                   <div className="text-[11px] text-amber-900 font-medium leading-relaxed">
                      Lakukan koreksi jam keluar untuk karyawan yang lupa absen. Data yang diubah akan langsung diperbarui di sistem tanpa melalui persetujuan lagi.
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                         <Clock size={12} className="text-emerald-500" /> Jam Masuk (Tercatat)
                      </label>
                      <div className="dash-input-modern h-12 flex items-center px-4 bg-gray-50 text-gray-400 font-bold text-sm">
                         {new Date(selectedRow?.check_in).toLocaleString('id-ID')}
                      </div>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                         <Save size={12} className="text-emerald-500" /> Jam Keluar (Koreksi)
                      </label>
                      <input 
                        type="datetime-local" 
                        className="dash-input-modern h-12 font-black text-sm"
                        value={editData.check_out}
                        onChange={(e) => setEditData({ ...editData, check_out: e.target.value })}
                      />
                   </div>
                </div>
             </div>

             <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-12 rounded-2xl font-black text-xs text-gray-400 hover:text-gray-600 hover:bg-white transition-all border border-transparent hover:border-gray-200"
                >
                   BATAL
                </button>
                <button 
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                   {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                   SIMPAN KOREKSI
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryView = ({ startDate, endDate, selectedUser }: any) => {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/attendance/summary?start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`);
        setSummary(res.data.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchSummary();
  }, [startDate, endDate, selectedUser]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col gap-2">
             <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle2 size={20} />
             </div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Akumulasi Hadir</span>
             <h4 className="text-3xl font-black text-gray-900 leading-none">{summary.reduce((acc, curr) => acc + curr.total_present, 0)} <span className="text-lg text-emerald-500 opacity-50">Hari</span></h4>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col gap-2">
             <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
                <Clock size={20} />
             </div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Terlambat</span>
             <h4 className="text-3xl font-black text-gray-900 leading-none">{summary.reduce((acc, curr) => acc + curr.total_late, 0)} <span className="text-lg text-amber-500 opacity-50">Kali</span></h4>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col gap-2 border-b-4 border-b-rose-500">
             <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-2">
                <ShieldAlert size={20} />
             </div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Terdeteksi Anomali</span>
             <h4 className="text-3xl font-black text-gray-900 leading-none">{summary.reduce((acc, curr) => acc + curr.total_suspicious, 0)} <span className="text-lg text-rose-500 opacity-50">Kasus</span></h4>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col gap-2">
             <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                <History size={20} />
             </div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rata-rata Kehadiran</span>
             <h4 className="text-3xl font-black text-gray-900 leading-none">{(summary.reduce((acc, curr) => acc + curr.total_present, 0) / (summary.length || 1)).toFixed(1)} <span className="text-lg text-blue-500 opacity-50">D/m</span></h4>
          </div>
       </div>

       <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Karyawan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Presentase</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center text-emerald-600">Total Hadir</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center text-blue-600">Tepat Waktu</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center text-amber-600">Terlambat</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center text-rose-600">Suspicious</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.map((row) => (
                  <tr key={row.user_id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-black text-gray-900 text-xs">{row.name}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (row.total_on_time / (row.total_present || 1)) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-gray-400">{Math.round((row.total_on_time / (row.total_present || 1)) * 100)}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-sm text-gray-700">{row.total_present} Hari</td>
                    <td className="px-6 py-4 text-center font-black text-sm text-emerald-600">{row.total_on_time}</td>
                    <td className="px-6 py-4 text-center font-black text-sm text-amber-600">{row.total_late}</td>
                    <td className="px-6 py-4 text-center font-black text-sm text-rose-600 bg-rose-50/30 font-mono">{row.total_suspicious}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};

const SuspiciousView = ({ startDate, endDate, selectedUser }: any) => {
   const [history, setHistory] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
     const fetchData = async () => {
       setLoading(true);
       try {
         const res = await axiosInstance.get(`/attendance/suspicious?start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`);
         setHistory(res.data.data.data || []);
       } catch (e) { console.error(e); }
       finally { setLoading(false); }
     };
     fetchData();
   }, [startDate, endDate, selectedUser]);

   const getSuspiciousBadge = (reason: string) => {
    if (!reason || reason === 'manual') return <span className="text-orange-600 font-bold text-[10px] bg-orange-50 px-2 py-0.5 rounded uppercase tracking-wider border border-orange-100 shadow-sm flex items-center gap-1.5 max-w-fit mx-auto"><ShieldAlert size={10} /> Fraudulent Activity</span>;
    
    if (reason.toLowerCase().includes('fake gps') || reason.toLowerCase().includes('gps spoofing')) {
      return (
        <span className="flex items-center gap-1.5 text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider border border-rose-100 shadow-sm max-w-fit mx-auto">
          <MapPin size={10} /> Lokasi Palsu
        </span>
      );
    }
    
    if (reason.toLowerCase().includes('device')) {
      return (
        <span className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-100 shadow-sm max-w-fit mx-auto">
          <Smartphone size={10} /> Device Mismatch
        </span>
      );
    }

    if (reason.toLowerCase().includes('face')) {
      return (
        <span className="flex items-center gap-1.5 text-violet-600 font-bold text-[10px] bg-violet-50 px-2 py-0.5 rounded uppercase tracking-wider border border-violet-100 shadow-sm max-w-fit mx-auto">
          <UserX size={10} /> Biometric Fail
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 text-orange-600 font-bold text-[10px] bg-orange-50 px-2 py-0.5 rounded uppercase tracking-wider border border-orange-100 shadow-sm max-w-fit mx-auto">
        <ShieldAlert size={10} /> {reason}
      </span>
    );
  };

   return (
     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-3xl mb-8 flex items-center gap-6">
           <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-200 shrink-0">
              <ShieldAlert size={32} />
           </div>
           <div>
              <h3 className="text-rose-900 font-black text-lg tracking-tight uppercase">Audit Fraud Terdeteksi</h3>
              <p className="text-rose-700/60 text-sm font-medium">Rekaman berikut ditandai otomatis oleh sistem sebagai aktivitas mencurigakan yang memerlukan perhatian HR.</p>
           </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden min-h-[300px]">
           {loading ? (
             <div className="p-32 text-center flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin" />
             </div>
           ) : history.length === 0 ? (
             <div className="p-32 text-center flex flex-col items-center opacity-30">
                <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
                <h4 className="font-black tracking-widest text-gray-900 uppercase">Tidak Ada Fraud</h4>
                <p className="text-xs">Semua rekaman absensi terlihat normal pada periode ini.</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-50 text-center">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Tanggal / Jam</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Karyawan</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Alasan Audit</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bukti Foto</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Titik Koordinat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map((row) => (
                      <tr key={row.id} className="hover:bg-rose-50/20 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex flex-col select-none">
                             <span className="font-black text-gray-900 text-xs">{new Date(row.check_in).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                             <span className="text-[10px] font-mono font-black text-rose-500">{new Date(row.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex flex-col">
                             <span className="font-black text-gray-900 text-xs">{row.user?.name}</span>
                             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest font-mono italic">HP: {row.user?.device_id?.slice(-8) || '-'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           {getSuspiciousBadge(row.suspicious_reason)}
                        </td>
                        <td className="px-6 py-4 text-center">
                           {row.image_in ? (
                             <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm inline-block bg-gray-50 grayscale group-hover:grayscale-0 transition-all hover:scale-150 relative z-10">
                                <img src={`/storage/${row.image_in}`} alt="Evidence" className="w-full h-full object-cover" />
                             </div>
                           ) : <Camera size={16} className="text-gray-200 mx-auto" />}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex items-center justify-center gap-2 text-rose-300 font-mono text-[9px] group-hover:text-rose-600 transition-colors">
                              <MapPin size={12} />
                              {Number(row.latitude_in).toFixed(5)}, {Number(row.longitude_in).toFixed(5)}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           )}
        </div>
     </div>
   );
};

const CorrectionView = ({ startDate, endDate, selectedUser }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/attendance-corrections?start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`);
        setData(res.data.data.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [startDate, endDate, selectedUser]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-amber-50/20 flex items-center justify-between">
             <div>
                <h3 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
                   <FileSpreadsheet size={20} className="text-amber-500" /> Audit Koreksi Kehadiran
                </h3>
                <p className="text-xs text-gray-400 font-medium">Rekaman riwayat perubahan data absen yang diajukan oleh karyawan.</p>
             </div>
             <button 
               onClick={async () => {
                  try {
                    const response = await axiosInstance.get(`/attendance-corrections/export?start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a'); link.href = url;
                    link.setAttribute('download', `Rekap_Koreksi_${startDate}_to_${endDate}.xlsx`);
                    document.body.appendChild(link); link.click(); link.remove();
                  } catch(e) { alert("Gagal export koreksi."); }
               }}
               className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-amber-100"
             >
                <FileSpreadsheet size={14} /> Export Laporan Excel
             </button>
          </div>
          {loading ? (
             <div className="p-32 text-center flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin" />
             </div>
          ) : data.length === 0 ? (
             <div className="p-32 text-center flex flex-col items-center opacity-30">
                <FileSpreadsheet size={64} className="mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">Tidak Ada Data Koreksi</p>
             </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-50">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Karyawan</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipe Koreksi</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu Koreksi</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Alasan</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.map((row) => (
                      <tr key={row.id} className="hover:bg-amber-50/10">
                        <td className="px-6 py-4 font-black text-gray-900 text-xs">
                           {row.user?.name}
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-[9px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                              {row.correction_type?.replace('_', ' ')}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col text-[10px] font-mono">
                              <span className="text-emerald-600 font-black">IN: {row.corrected_check_in ? new Date(row.corrected_check_in).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'}</span>
                              <span className="text-amber-600 font-black">OUT: {row.corrected_check_out ? new Date(row.corrected_check_out).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 italic max-w-xs truncate">
                           "{row.reason}"
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg shadow-sm border ${
                              row.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              row.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-gray-50 text-gray-600 border-gray-100'
                           }`}>
                              {row.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}
       </div>
    </div>
  );
};

const ShiftView = ({ employees, startDate, endDate, selectedUser }: any) => {
   const [data, setData] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
     const fetchData = async () => {
       setLoading(true);
       try {
         // This typically comes from schedules endpoint
         const res = await axiosInstance.get(`/schedules?start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`);
         const rawData = res.data.data;
         setData(Array.isArray(rawData) ? rawData : (rawData?.data || []));
       } catch (e) { console.error(e); }
       finally { setLoading(false); }
     };
     fetchData();
   }, [startDate, endDate, selectedUser]);

   return (
     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
           <div className="p-8 border-b border-gray-50 bg-blue-50/20 flex items-center justify-between">
              <div>
                 <h3 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" /> Rekap Jadwal & Penugasan Shift
                 </h3>
                 <p className="text-xs text-gray-400 font-medium">Data perencanaan jam kerja karyawan pada periode terpilih.</p>
              </div>
              <button 
               onClick={async () => {
                  try {
                    const response = await axiosInstance.get(`/schedules/export?start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a'); link.href = url;
                    link.setAttribute('download', `Laporan_Shift_${startDate}_to_${endDate}.xlsx`);
                    document.body.appendChild(link); link.click(); link.remove();
                  } catch(e) { alert("Gagal export jadwal shift."); }
               }}
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-blue-100"
             >
                <FileSpreadsheet size={14} /> Export Laporan Excel
             </button>
           </div>
           {loading ? (
              <div className="p-32 text-center flex items-center justify-center">
                 <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              </div>
           ) : data.length === 0 ? (
              <div className="p-32 text-center flex flex-col items-center opacity-30">
                 <Calendar size={64} className="mb-4" />
                 <p className="text-sm font-black uppercase tracking-widest">Tidak Ada Jadwal</p>
              </div>
           ) : (
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-gray-50/50 border-b border-gray-50">
                       <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Karyawan</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Jam Kerja</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {data.map((row) => (
                       <tr key={row.id}>
                         <td className="px-6 py-4 text-xs font-black text-gray-900">
                            {new Date(row.date).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric'})}
                         </td>
                         <td className="px-6 py-4 text-xs font-bold text-gray-700">{row.user?.name}</td>
                         <td className="px-6 py-4">
                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                               {row.shift?.name}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400">
                            {row.shift?.start_time?.slice(0,5)} - {row.shift?.end_time?.slice(0,5)}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           )}
        </div>
     </div>
   );
};

const LocationView = ({ startDate, endDate, selectedUser }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/attendance/history?start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}&per_page=100`);
        setData(res.data.data.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [startDate, endDate, selectedUser]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden min-h-[500px]">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-emerald-50/20">
             <div>
                <h3 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
                   <MapIcon size={20} className="text-emerald-500" /> Sebaran Lokasi Absensi
                </h3>
                <p className="text-xs text-gray-400 font-medium">Klik pada koordinat untuk melihat lokasi detail di Google Maps.</p>
             </div>
          </div>
          {loading ? (
             <div className="p-32 text-center flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
             </div>
          ) : data.length === 0 ? (
             <div className="p-32 text-center flex flex-col items-center opacity-30">
                <MapIcon size={64} className="mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">Tidak Ada Data Lokasi</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="max-h-[500px] overflow-y-auto border-r border-gray-50 bg-gray-50/30">
                   {data.map((row) => (
                      <div key={row.id} className="p-4 border-b border-white hover:bg-white transition-all group flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-emerald-600 font-black text-xs shadow-sm group-hover:scale-110 transition-transform">
                               {row.user?.name?.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                               <span className="font-black text-gray-900 text-xs">{row.user?.name}</span>
                               <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{new Date(row.check_in).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit'})} WIB</span>
                            </div>
                         </div>
                         <a 
                           href={`https://www.google.com/maps/search/?api=1&query=${row.latitude_in},${row.longitude_in}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl text-[10px] font-black text-gray-400 hover:text-emerald-600 border border-gray-100 hover:border-emerald-200 shadow-sm transition-all"
                         >
                            <MapPin size={12} /> {Number(row.latitude_in).toFixed(5)}, {Number(row.longitude_in).toFixed(5)}
                         </a>
                      </div>
                   ))}
                </div>
                <div className="p-12 flex flex-col items-center justify-center bg-emerald-50/10 relative overflow-hidden group">
                   <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                      <MapIcon size={400} className="ml-[-100px] mt-[-50px]" />
                   </div>
                   <MapPin size={48} className="text-emerald-200 mb-6 drop-shadow-xl animate-bounce" />
                   <h4 className="font-black text-emerald-900 text-lg tracking-tight">Geo-Visualization</h4>
                   <p className="text-center text-xs text-emerald-700/60 mt-2 max-w-xs font-medium">Gunakan link koordinat di sebelah kiri untuk audit lokasi per titik secara presisi pada peta interaktif Google Maps.</p>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default function ReportsAttendancePage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"logs" | "summary" | "suspicious" | "location" | "corrections" | "shifts">("logs");
  
  // Filters Persistence
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get("/employees?per_page=100");
        const rawData = res.data.data;
        setEmployees(Array.isArray(rawData) ? rawData : (rawData?.data || []));
        setLoading(false);
      } catch (e) {
        console.error("Gagal mengambil data karyawan", e);
      }
    };
    fetchEmployees();
  }, []);

  if (loading) return <ReportSkeleton />;

  const exportExcel = async () => {
    try {
      const response = await axiosInstance.get(`/attendance/export?start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rekap_Kehadiran_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Gagal mengunduh Laporan Excel.");
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="dash-page-header">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-100 group transition-transform hover:rotate-3 border-4 border-emerald-50">
              <History size={32} />
           </div>
           <div>
              <h1 className="dash-page-title text-emerald-900 font-black tracking-tight">{t('attendance_report')}</h1>
              <p className="dash-page-desc font-medium">Monitoring pergerakan, ringkasan kinerja, dan audit kepatuhan absensi karyawan.</p>
           </div>
        </div>
        <div className="dash-page-actions">
          <button className="dash-btn dash-btn-primary shadow-lg shadow-emerald-100 bg-[#107c41] hover:bg-[#0c6130] text-white!" onClick={exportExcel}>
            <FileSpreadsheet size={15} />
            {t('export')} Excel
          </button>
        </div>
      </div>

      {/* Segmented Tabs Control */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/80 backdrop-blur-md rounded-2xl mb-8 w-full md:w-fit border border-gray-200 overflow-x-auto no-scrollbar">
         <button 
           onClick={() => setActiveTab("logs")}
           className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] whitespace-nowrap font-black transition-all tracking-wider uppercase ${activeTab === 'logs' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
         >
            <History size={14} /> Rekap Absen
         </button>
         <button 
           onClick={() => setActiveTab("summary")}
           className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] whitespace-nowrap font-black transition-all tracking-wider uppercase ${activeTab === 'summary' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
         >
            <BarChart3 size={14} /> Ringkasan
         </button>
         <button 
           onClick={() => setActiveTab("shifts")}
           className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] whitespace-nowrap font-black transition-all tracking-wider uppercase ${activeTab === 'shifts' ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
         >
            <Calendar size={14} /> Laporan Shift
         </button>
         <button 
           onClick={() => setActiveTab("corrections")}
           className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] whitespace-nowrap font-black transition-all tracking-wider uppercase ${activeTab === 'corrections' ? 'bg-white text-amber-600 shadow-md ring-1 ring-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
         >
            <FileSpreadsheet size={14} /> Koreksi
         </button>
         <button 
           onClick={() => setActiveTab("location")}
           className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] whitespace-nowrap font-black transition-all tracking-wider uppercase ${activeTab === 'location' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
         >
            <MapIcon size={14} /> Lokasi
         </button>
         <button 
           onClick={() => setActiveTab("suspicious")}
           className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] whitespace-nowrap font-black transition-all tracking-wider uppercase ${activeTab === 'suspicious' ? 'bg-white text-rose-600 shadow-md ring-1 ring-rose-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
         >
            <ShieldAlert size={14} /> Audit
         </button>
      </div>

      {/* Tab Content Rendering */}
      {activeTab === 'logs' && (
        <LogView 
          employees={employees} 
          startDate={startDate} 
          endDate={endDate} 
          selectedUser={selectedUser}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onUserChange={setSelectedUser}
        />
      )}

      {activeTab === 'summary' && (
        <SummaryView 
          startDate={startDate} 
          endDate={endDate} 
          selectedUser={selectedUser} 
        />
      )}

      {activeTab === 'shifts' && (
        <ShiftView 
          startDate={startDate} 
          endDate={endDate} 
          selectedUser={selectedUser} 
        />
      )}

      {activeTab === 'corrections' && (
        <CorrectionView 
          startDate={startDate} 
          endDate={endDate} 
          selectedUser={selectedUser} 
        />
      )}

      {activeTab === 'location' && (
        <LocationView 
          startDate={startDate} 
          endDate={endDate} 
          selectedUser={selectedUser} 
        />
      )}

      {activeTab === 'suspicious' && (
        <SuspiciousView 
          startDate={startDate} 
          endDate={endDate} 
          selectedUser={selectedUser} 
        />
      )}
    </div>
  );
}

