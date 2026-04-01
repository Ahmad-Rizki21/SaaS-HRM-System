"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Plus, Calendar, Trash2, Edit2, Loader2, Info, X, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import iCalendarPlugin from '@fullcalendar/icalendar';

interface Holiday {
  id: number;
  name: string;
  date: string;
  company_id: number | null;
}

export default function HolidaysPage() {
  const { hasPermission } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: ""
  });

  // Modal delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/holidays");
      const resData = response.data.data;
      setHolidays(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (e) {
      console.error("Gagal mengambil data hari libur", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setFormData({ name: "", date: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Holiday) => {
    if (!h.company_id) {
        alert("Hari libur nasional tidak dapat diubah.");
        return;
    }
    setModalMode("edit");
    setSelectedId(h.id);
    setFormData({ name: h.name, date: h.date });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await axiosInstance.post("/holidays", formData);
      } else {
        await axiosInstance.put(`/holidays/${selectedId}`, formData);
      }
      setIsModalOpen(false);
      fetchHolidays();
    } catch (e) {
      alert("Gagal menyimpan hari libur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: number) => {
    setIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!idToDelete) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.delete(`/holidays/${idToDelete}`);
      setIsDeleteModalOpen(false);
      setIdToDelete(null);
      fetchHolidays();
    } catch (e) {
      alert("Gagal menghapus hari libur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calendarEvents = holidays.map((h: Holiday) => ({
    id: String(h.id),
    title: h.name,
    start: h.date,
    allDay: true,
    backgroundColor: h.company_id ? '#8B0000' : '#b91c1c', 
    borderColor: 'transparent',
    textColor: '#ffffff',
    extendedProps: {
       company_id: h.company_id,
       originalData: h
    }
  }));

  const handleDateClick = (arg: any) => {
    if (!hasPermission('manage-holidays')) return;
    setModalMode("add");
    setFormData({ name: "", date: arg.dateStr });
    setIsModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    if (!hasPermission('manage-holidays')) return;
    
    const h = arg.event.extendedProps?.originalData;
    if (!h) {
        // External ICS events don't have originalData
        alert("Hari libur nasional dari Google Calendar tidak dapat diubah.");
        return;
    }

    if (!h.company_id) {
        alert("Hari libur nasional dari sistem tidak dapat diubah (Otomatis).");
        return;
    }
    
    handleOpenEdit(h);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="dash-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#8B0000]/5 text-[#8B0000] rounded-xl border border-[#8B0000]/10">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="dash-page-title">Kalender Hari Libur</h1>
            <p className="dash-page-desc flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#b91c1c]"></span> Nasional</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8B0000]"></span> Kebijakan Internal</span>
            </p>
          </div>
        </div>
        {hasPermission('manage-holidays') && (
          <button 
            onClick={handleOpenAdd}
            className="dash-btn dash-btn-primary shrink-0"
          >
            <Plus size={16} />
            Tambah Hari Libur
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
         <style dangerouslySetInnerHTML={{__html: `
            .fc .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 900 !important; color: #111827 !important; text-transform: uppercase; letter-spacing: 0.05em; }
            .fc .fc-button-primary { background-color: white !important; color: #374151 !important; border: 1px solid #e5e7eb !important; text-transform: capitalize !important; font-weight: 700 !important; font-size: 0.8rem; border-radius: 0.75rem !important; padding: 0.5rem 1rem !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; transition: all 0.2s !important; }
            .fc .fc-button-primary:hover { background-color: #f9fafb !important; border-color: #d1d5db !important; }
            .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: #8B0000 !important; color: white !important; border-color: #8B0000 !important; }
            .fc .fc-daygrid-day-number { font-weight: 700; color: #4b5563; padding: 0.5rem !important; }
            .fc .fc-col-header-cell-cushion { padding: 0.75rem 0 !important; color: #9ca3af !important; text-transform: uppercase !important; font-size: 0.75rem !important; font-weight: 900 !important; letter-spacing: 0.05em; }
            .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: #f3f4f6 !important; }
            .fc-day-today { background-color: #fef2f2 !important; }
            .fc-event { cursor: pointer; border-radius: 0.5rem !important; padding: 2px 4px !important; font-size: 0.7rem !important; font-weight: 700 !important; margin: 2px !important; border: none !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
            .fc-event:hover { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .fc .fc-multimonth-month { margin-bottom: 2rem; }
            .fc .fc-multimonth-title { font-size: 1.1rem !important; font-weight: 900 !important; color: #8B0000 !important; padding-bottom: 0.5rem; }
            .fc .fc-multimonth-header { border-bottom: 2px solid #f3f4f6 !important; }
            .fc-theme-standard .fc-multimonth-daygrid { border: none !important; }
            .fc-media-screen { min-height: 600px; }
            .fc-button-group { gap: 0.5rem; }
            .fc-button-group > .fc-button { border-radius: 0.75rem !important; margin: 0 !important; }
         `}} />
         
         {loading ? (
             <div className="flex items-center justify-center h-[500px]">
                 <Loader2 className="animate-spin text-gray-300" size={40} />
             </div>
         ) : (
             <FullCalendar
                 plugins={[dayGridPlugin, multiMonthPlugin, interactionPlugin, iCalendarPlugin]}
                 initialView="multiMonthYear"
                 headerToolbar={{
                     left: 'prev,next today',
                     center: 'title',
                     right: 'dayGridMonth,multiMonthYear' // Allow toggle between month and full year
                 }}
                 buttonText={{
                     today: 'Bulan / Tahun Ini',
                     month: 'Bulan',
                     year: 'Tahun'
                 }}
                 eventSources={[
                     {
                         events: calendarEvents
                     },
                     {
                         url: '/api/google-holidays',
                         format: 'ics',
                         backgroundColor: '#059669', // Emerald Green for public holidays
                         borderColor: 'transparent',
                         textColor: '#ffffff',
                     }
                 ]}
                 dateClick={handleDateClick}
                 eventClick={handleEventClick}
                 height="auto"
                 contentHeight="auto"
                 locale="id"
                 firstDay={1}
                 dayMaxEvents={3}
             />
         )}
      </div>

      {/* CRUD Modal Add/Edit */}
      {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">
                            {modalMode === "add" ? "Tambah Hari Libur" : "Edit Hari Libur"}
                        </h3>
                        {modalMode === "edit" && hasPermission('manage-holidays') && (
                            <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); confirmDelete(selectedId!); }}
                                className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors ml-auto mr-2"
                                title="Hapus Hari Libur"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-colors"
                        >
                           <X size={20} />
                        </button>
                    </div>
                    <div className="p-8 space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Nama Hari Libur</label>
                            <input 
                              required
                              type="text" 
                              value={formData.name} 
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              placeholder="Contoh: Libur Bersama Idul Fitri..."
                              className="w-full h-11 px-4 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#8B0000] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Tanggal Libur</label>
                            <input 
                              required
                              type="date" 
                              value={formData.date} 
                              onChange={(e) => setFormData({...formData, date: e.target.value})}
                              className="w-full h-11 px-4 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#8B0000] transition-colors"
                            />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                        <button 
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 h-11 text-sm font-bold border border-gray-200 rounded-xl hover:bg-white transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 h-11 bg-[#8B0000] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#8B0000]/10 hover:shadow-[#8B0000]/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Simpan Hari Libur"}
                        </button>
                    </div>
                  </form>
              </div>
          </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-8 text-center">
                  <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                      <Trash2 size={40} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Hari Libur?</h3>
                  <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed px-4">
                      Tindakan ini akan menghapus hari libur dari kalender perusahaan. Karyawan akan kembali dianggap masuk pada tanggal ini.
                  </p>
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="w-full h-12 bg-rose-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                      >
                         {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Ya, Hapus Sekarang"}
                      </button>
                      <button 
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="w-full h-12 bg-white text-gray-400 hover:text-gray-600 rounded-2xl text-sm font-bold transition-all"
                      >
                          Batal
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
