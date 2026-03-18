"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Plus, Calendar, Trash2, Edit2, Loader2, Info, X, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
      setHolidays(response.data.data || []);
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

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return {
        day: d.toLocaleDateString("id-ID", { day: "numeric" }),
        month: d.toLocaleDateString("id-ID", { month: "short" }),
        full: d.toLocaleDateString("id-ID", { 
            day: "numeric", 
            month: "long", 
            year: "numeric",
            weekday: "long"
        })
    };
  };

  // Group by year/month or just sorted list. Let's do a grouped list by Month for better UX.
  const groupedHolidays = holidays.reduce((acc: any, h) => {
    const month = new Date(h.date).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    if (!acc[month]) acc[month] = [];
    acc[month].push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="dash-page-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#8B0000]/5 text-[#8B0000] rounded-xl border border-[#8B0000]/10">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="dash-page-title">Kalender Hari Libur</h1>
            <p className="dash-page-desc">Daftar hari libur nasional dan kebijakan internal perusahaan.</p>
          </div>
        </div>
        {hasPermission('manage-holidays') && (
          <button 
            onClick={handleOpenAdd}
            className="dash-btn dash-btn-primary"
          >
            <Plus size={16} />
            Tambah Hari Libur
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 rounded h-4 w-32 ml-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="animate-pulse bg-gray-200 rounded-xl w-14 h-14 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-3/4" />
                    <div className="animate-pulse bg-gray-200 rounded h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : holidays.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                <Calendar size={32} />
            </div>
            <p className="text-gray-500 font-medium">Belum ada hari libur yang terdaftar.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedHolidays).map((month) => (
            <div key={month} className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-[#8B0000] flex items-center gap-2 px-2">
                    <span className="w-8 h-px bg-[#8B0000]/20"></span>
                    {month}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedHolidays[month].map((h: Holiday) => {
                        const dateInfo = formatDate(h.date);
                        return (
                            <div key={h.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group relative">
                                <div className="shrink-0 w-14 h-14 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100 group-hover:bg-[#8B0000]/5 group-hover:border-[#8B0000]/10 transition-colors">
                                    <span className="text-lg font-black text-gray-900 group-hover:text-[#8B0000]">{dateInfo.day}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-[#8B0000]/70">{dateInfo.month}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate leading-tight mb-1">{h.name}</h3>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                                        <MapPin size={12} className={h.company_id ? "text-amber-500" : "text-blue-500"} />
                                        {h.company_id ? "Kebijakan Kantor" : "Libur Nasional"}
                                    </div>
                                </div>

                                {hasPermission('manage-holidays') && h.company_id && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleOpenEdit(h)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => confirmDelete(h.id)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal Add/Edit */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">
                            {modalMode === "add" ? "Tambah Hari Libur" : "Edit Hari Libur"}
                        </h3>
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
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
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
