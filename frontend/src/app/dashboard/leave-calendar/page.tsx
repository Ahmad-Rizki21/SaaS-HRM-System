"use client";

import { useEffect, useState, Suspense } from "react";
import axiosInstance from "@/lib/axios";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Clock, CheckCircle2, MoreVertical, X, Filter } from "lucide-react";
import { TableSkeleton } from "@/components/Skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Leave {
  id: number;
  user: { name: string; profile_photo_url?: string };
  type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
}

function LeaveCalendarContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/leave/calendar?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`);
      setLeaves(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const days = [];
  const totalDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  // Padding for first week
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number | null) => {
    if (!day) return false;
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return d === selectedDate;
  };

  const hasLeave = (day: number | null) => {
    if (!day) return false;
    const dateStr = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day)).toISOString().split('T')[0];
    return leaves.some(l => dateStr >= l.start_date && dateStr <= l.end_date);
  };

  const filteredLeaves = leaves.filter(l => {
    if (!selectedDate) return true;
    return selectedDate >= l.start_date && selectedDate <= l.end_date;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Sidebar: Mini Calendar */}
      <div className="w-full lg:w-[350px] space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-6">
                <h2 className="font-black text-lg text-gray-900 tracking-tight">
                    {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                      className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-gray-50"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button 
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-gray-50"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 w-full text-center gap-1">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                    <div key={i} className="text-[10px] font-black text-gray-300 uppercase py-2 tracking-widest">{d}</div>
                ))}
                {days.map((day, i) => (
                    <button
                        key={i}
                        disabled={!day}
                        onClick={() => {
                            if(day) setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]);
                        }}
                        className={`relative h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all
                            ${!day ? 'opacity-0 pointer-events-none' : 'hover:bg-blue-50'}
                            ${isSelected(day) ? 'bg-[#1a1a2e] text-white shadow-lg shadow-blue-900/20 scale-110 z-10' : 'text-gray-600'}
                            ${isToday(day) && !isSelected(day) ? 'text-blue-600 border-2 border-blue-50' : ''}
                        `}
                    >
                        {day}
                        {day && hasLeave(day) && (
                            <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected(day) ? 'bg-white/50' : 'bg-red-400 animation-pulse'}`}></span>
                        )}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:scale-150 transition-transform duration-700">
                <CalendarIcon size={120} />
            </div>
            <div className="relative z-10">
                <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Status Hari Ini</p>
                <h3 className="text-2xl font-black mb-4">
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Cuti</p>
                            <p className="text-lg font-black">{leaves.filter(l => {
                                const today = new Date().toISOString().split('T')[0];
                                return today >= l.start_date && today <= l.end_date;
                            }).length} <span className="text-xs font-medium text-white/40">Karyawan</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content: Leave List */}
      <div className="flex-1 min-w-0 bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                      <User size={20} />
                  </div>
                  <div>
                      <h3 className="font-black text-xl text-gray-900 tracking-tight">Karyawan Cuti</h3>
                      <p className="text-xs text-gray-400 font-medium">
                        {selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Daftar Seluruh Cuti'}
                      </p>
                  </div>
              </div>
              <button className="dash-btn dash-btn-outline h-10 px-4 rounded-xl inline-flex items-center gap-2 group">
                  <Filter size={14} className="text-gray-400 group-hover:text-gray-900" />
                  Semua Divisi
              </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {loading ? <TableSkeleton rows={4} cols={1} /> : filteredLeaves.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200 mb-4 shadow-sm border border-gray-50">
                          <X size={32} />
                      </div>
                      <h4 className="font-black text-gray-400 text-sm uppercase tracking-widest">Tidak ada data</h4>
                      <p className="text-xs text-gray-400 font-medium mt-1">Tidak ada karyawan yang cuti pada tanggal ini.</p>
                  </div>
              ) : filteredLeaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] transition-all group">
                      <div className="flex items-center gap-4 flex-1">
                          <Avatar className="size-12 border-2 border-white shadow-sm ring-1 ring-gray-100">
                              <AvatarImage src={leave.user.profile_photo_url} />
                              <AvatarFallback className="bg-white text-gray-400 font-black text-xs uppercase">
                                  {leave.user.name.charAt(0)}
                              </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                              <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">{leave.user.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{leave.type}</span>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span className="text-[10px] font-medium text-gray-400 italic truncate max-w-[150px]">"{leave.reason || 'Tanpa alasan'}"</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest mb-1">Durasi</p>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                    <Clock size={12} className="text-gray-400" />
                                    {new Date(leave.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(leave.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </div>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-300 group-hover:text-gray-900 transition-colors cursor-pointer">
                                <MoreVertical size={16} />
                            </div>
                      </div>
                  </div>
              ))}
          </div>

          <div className="mt-8 p-6 bg-red-50/30 rounded-3xl border border-red-50 flex items-center gap-6 justify-between">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-400 shadow-sm">
                      <CalendarIcon size={20} />
                  </div>
                  <div>
                      <h5 className="font-black text-red-600 text-sm tracking-tight">Catatan Penting</h5>
                      <p className="text-[10px] text-red-400 font-medium leading-relaxed">
                          Hanya cuti yang sudah **DISETUJUI** yang akan muncul pada kalender tim ini.
                      </p>
                  </div>
              </div>
              <CheckCircle2 size={32} className="text-red-100" />
          </div>
      </div>
    </div>
  );
}

export default function LeaveCalendarPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={4} cols={1} />}>
      <LeaveCalendarContent />
    </Suspense>
  );
}
