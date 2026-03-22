"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Edit2, 
  Trash2, 
  LayoutGrid, 
  List, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  MoreVertical,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/PermissionGuard";
import { TableSkeleton } from "@/components/Skeleton";

interface Schedule {
  id: number;
  user_id: number;
  shift_id: number;
  date: string;
  user?: { name: string; email: string };
  shift?: { name: string; start_time: string; end_time: string; color?: string };
}

interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
}

interface User {
  id: number;
  name: string;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user, hasPermission } = useAuth();

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [scheduleData, setScheduleData] = useState({ user_id: "", shift_id: "", date: "" });
  const [shiftData, setShiftData] = useState({ name: "", start_time: "", end_time: "" });
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null);

  useEffect(() => {
    fetchSchedules(currentDate);
    // Fetch shifts & employees if user is a manager (Admin/Manager/Supervisor/HR)
    if (user && (hasPermission('manage-schedules') || hasPermission('manage-shifts'))) {
       fetchShifts();
       fetchEmployees();
    }
  }, [currentDate, user]); 

  const fetchSchedules = async (date: Date) => {
    try {
      setLoading(true);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const response = await axiosInstance.get(`/schedules?month=${month}&year=${year}&per_page=100`);
      setSchedules(response.data.data?.data || response.data.data || []);
    } catch (e) {
      console.error("Gagal mengambil data jadwal", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await axiosInstance.get("/shifts");
      setShifts(response.data.data);
    } catch (e) {
      console.error("Gagal ambil data shift", e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get("/employees");
      setEmployees(response.data.data?.data || []);
    } catch (e) {
      console.error("Gagal ambil data karyawan", e);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/schedules", scheduleData);
      setIsScheduleModalOpen(false);
      fetchSchedules(currentDate);
    } catch (e) {
      alert("Gagal membuat jadwal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      await axiosInstance.delete(`/schedules/${id}`);
      fetchSchedules(currentDate);
    } catch (e) {
      alert("Gagal menghapus jadwal");
    }
  };

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingShiftId) {
        await axiosInstance.put(`/shifts/${editingShiftId}`, shiftData);
      } else {
        await axiosInstance.post("/shifts", shiftData);
      }
      setShiftData({ name: "", start_time: "", end_time: "" });
      setEditingShiftId(null);
      fetchShifts();
    } catch (e) {
      alert("Gagal menyimpan shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!confirm("Hapus shift ini? Peringatan: Jadwal yang menggunakan shift ini mungkin terpengaruh.")) return;
    try {
      await axiosInstance.delete(`/shifts/${id}`);
      fetchShifts();
    } catch (e) {
      alert("Gagal menghapus shift");
    }
  };

  const handleOpenAddSchedule = (date?: string) => {
    setScheduleData({ ...scheduleData, date: date || new Date().toISOString().split('T')[0] });
    setIsScheduleModalOpen(true);
  };

  // Calendar Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    // Padding for start day
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border-b border-r border-gray-100 bg-gray-50/20"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const daySchedules = schedules.filter(s => s.date === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div key={d} className={`h-32 border-b border-r border-gray-100 p-2 hover:bg-gray-50 transition-colors group relative ${isToday ? 'bg-red-50/30' : ''}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs font-bold leading-none w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#8B0000] text-white' : 'text-gray-400'}`}>
              {d}
            </span>
            {daySchedules.length > 0 && (
              <span className="text-[9px] font-black text-[#8B0000] bg-[#8B0000]/5 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                {daySchedules.length} Tim
              </span>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[75px] pr-0.5 custom-scrollbar">
            {daySchedules.map((s, idx) => (
              <div 
                key={idx} 
                className="text-[10px] px-2 py-1.5 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center gap-2 group/item hover:border-[#8B0000]/30 transition-all cursor-pointer"
                onClick={() => { if(hasPermission('manage-schedules')) handleDeleteSchedule(s.id); }}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.shift?.name?.toLowerCase().includes('noc') ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate tracking-tight">{s.user?.name}</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{s.shift?.name}</p>
                </div>
              </div>
            ))}
          </div>
          <PermissionGuard slug="manage-schedules">
            <button 
              onClick={() => handleOpenAddSchedule(dateStr)}
              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 bg-[#8B0000] text-white rounded-full flex items-center justify-center shadow-lg transition-all transform scale-75 group-hover:scale-100 active:scale-90"
            >
               <Plus size={14} />
            </button>
          </PermissionGuard>
        </div>
      );
    }

    // End Padding
    const remainingDays = (7 - ((startDay + totalDays) % 7)) % 7;
    for (let i = 0; i < remainingDays; i++) {
       days.push(<div key={`empty-end-${i}`} className="h-32 border-b border-r border-gray-100 bg-gray-50/20"></div>);
    }

    return days;
  };

  return (
    <div className="animate-in fade-in duration-500 min-h-screen pb-20">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Penjadwalan & Shift</h1>
          <p className="dash-page-desc">Atur penugasan shift harian karyawan di unit NOC dan operasional.</p>
        </div>
        <div className="dash-page-actions">
           <div className="flex bg-white rounded-xl p-1 border border-gray-100 shadow-sm mr-2">
              <button 
                onClick={() => setViewMode("calendar")}
                className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List size={18} />
              </button>
           </div>
          <PermissionGuard slug="manage-schedules">
            <button 
              onClick={() => setIsShiftModalOpen(true)}
              className="dash-btn dash-btn-outline group"
            >
              <Settings size={15} className="group-hover:rotate-90 transition-transform" />
              Kelola Shift
            </button>
            <button 
              onClick={() => handleOpenAddSchedule()}
              className="dash-btn dash-btn-primary"
            >
              <Plus size={15} />
              Buat Jadwal
            </button>
          </PermissionGuard>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
          {/* Calendar Header */}
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-linear-to-r from-white to-gray-50/50">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 text-xs font-bold text-gray-500 hover:text-[#8B0000] transition-colors"
                >
                  Hari Ini
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="flex gap-6">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">NOC Shift</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Office Hours</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
              <div key={day} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {renderCalendar()}
          </div>
        </div>
      ) : (
        <div className="dash-table-container">
          {loading ? (
             <div className="p-6"><TableSkeleton rows={6} cols={5} /></div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CalendarIcon size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Belum ada jadwal penugasan hari ini.</p>
            </div>
          ) : (
            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Karyawan</th>
                    <th>Tanggal</th>
                    <th>Shift</th>
                    <th>Waktu</th>
                    <PermissionGuard slug="manage-schedules">
                       <th className="text-right">Aksi</th>
                    </PermissionGuard>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 active:scale-95 transition-transform h-8 rounded-xl bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs border border-gray-200 shadow-sm">
                            {s.user?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-none">{s.user?.name}</p>
                            <p className="text-[9px] text-gray-400 font-medium mt-1 uppercase tracking-tighter">{s.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">
                        {new Date(s.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.shift?.name?.toLowerCase().includes('noc') ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                          {s.shift?.name}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500 font-medium">
                        {s.shift?.start_time} - {s.shift?.end_time}
                      </td>
                      <PermissionGuard slug="manage-schedules">
                        <td className="text-right">
                           <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleDeleteSchedule(s.id)} className="dash-action-btn delete"><Trash2 size={14}/></button>
                           </div>
                        </td>
                      </PermissionGuard>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Assign Schedule */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Assign Penugasan</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <Settings size={18} className="text-gray-400 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Karyawan</label>
                <select 
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/10 focus:border-[#8B0000] text-sm font-bold text-gray-900 transition-all cursor-pointer"
                  value={scheduleData.user_id}
                  onChange={e => setScheduleData({...scheduleData, user_id: e.target.value})}
                  required
                >
                  <option value="">Pilih Karyawan</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift Kerja</label>
                <select 
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/10 focus:border-[#8B0000] text-sm font-bold text-gray-900 transition-all cursor-pointer"
                  value={scheduleData.shift_id}
                  onChange={e => setScheduleData({...scheduleData, shift_id: e.target.value})}
                  required
                >
                  <option value="">Pilih Shift</option>
                  {shifts.map(sh => <option key={sh.id} value={sh.id}>{sh.name} ({sh.start_time} - {sh.end_time})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal Penugasan</label>
                <input 
                  type="date"
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/10 focus:border-[#8B0000] text-sm font-bold text-gray-900 transition-all"
                  value={scheduleData.date}
                  onChange={e => setScheduleData({...scheduleData, date: e.target.value})}
                  required
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Batal</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl bg-[#8B0000] text-white text-sm font-bold hover:bg-[#6c0000] transition-all shadow-lg shadow-red-900/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Manage Shifts */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Manajemen Master Shift</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Konfigurasi jenis jam kerja sistem</p>
              </div>
              <button onClick={() => setIsShiftModalOpen(false)} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                <Settings size={20} className="text-gray-400 rotate-45" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col md:flex-row gap-8 overflow-hidden">
               {/* Shift Form */}
               <div className="w-full md:w-1/3">
                  <form onSubmit={handleShiftSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Shift</label>
                      <input 
                        className="w-full h-10 px-3 rounded-lg border border-gray-100 bg-gray-50 text-sm font-bold"
                        placeholder="Misal: NOC Pagi"
                        value={shiftData.name}
                        onChange={e => setShiftData({...shiftData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Masuk</label>
                        <input className="w-full h-10 px-3 rounded-lg border border-gray-100 bg-gray-50 text-xs font-bold" type="time" value={shiftData.start_time} onChange={e => setShiftData({...shiftData, start_time: e.target.value})} required />
                       </div>
                       <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pulang</label>
                        <input className="w-full h-10 px-3 rounded-lg border border-gray-100 bg-gray-50 text-xs font-bold" type="time" value={shiftData.end_time} onChange={e => setShiftData({...shiftData, end_time: e.target.value})} required />
                       </div>
                    </div>
                    <button className="w-full h-11 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-all shadow-md">
                       {editingShiftId ? "Update Shift" : "Tambah Shift Baru"}
                    </button>
                    {editingShiftId && (
                      <button type="button" onClick={() => { setEditingShiftId(null); setShiftData({name:"", start_time:"", end_time:""}); }} className="w-full text-[10px] font-bold text-red-600 hover:underline">Batal Edit</button>
                    )}
                  </form>
               </div>

               {/* Shift List */}
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div className="space-y-3">
                    {shifts.map(sh => (
                      <div key={sh.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[#8B0000]">
                             <Clock size={18} />
                           </div>
                           <div>
                              <p className="font-bold text-gray-900 leading-none">{sh.name}</p>
                              <p className="text-[10px] text-gray-400 font-black mt-1 uppercase tracking-widest">{sh.start_time} - {sh.end_time}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setEditingShiftId(sh.id); setShiftData({name: sh.name, start_time: sh.start_time, end_time: sh.end_time}); }} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><Edit2 size={13} /></button>
                           <button onClick={() => handleDeleteShift(sh.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                    {shifts.length === 0 && <p className="text-center text-xs text-gray-400 py-8">Belum ada master shift.</p>}
                  </div>
               </div>
            </div>
            
            <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-50 text-center">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">SaaS HRM - NOC & Operational Module</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

