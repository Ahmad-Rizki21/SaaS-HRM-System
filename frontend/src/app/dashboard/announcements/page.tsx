"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Plus, Megaphone, Calendar, User, Trash2, Edit2, Loader2, Info, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  user?: {
    name: string;
  };
}

export default function AnnouncementsPage() {
  const { hasPermission } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: ""
  });

  // Modal delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/announcements");
      setAnnouncements(response.data.data || []);
    } catch (e) {
      console.error("Gagal mengambil data pengumuman", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setFormData({ title: "", content: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setModalMode("edit");
    setSelectedId(ann.id);
    setFormData({ title: ann.title, content: ann.content });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await axiosInstance.post("/announcements", formData);
      } else {
        await axiosInstance.put(`/announcements/${selectedId}`, formData);
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (e) {
      alert("Gagal menyimpan pengumuman.");
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
      await axiosInstance.delete(`/announcements/${idToDelete}`);
      setIsDeleteModalOpen(false);
      setIdToDelete(null);
      fetchAnnouncements();
    } catch (e) {
      alert("Gagal menghapus pengumuman.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="dash-page-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#8B0000]/5 text-[#8B0000] rounded-xl border border-[#8B0000]/10">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="dash-page-title">Pengumuman Perusahaan</h1>
            <p className="dash-page-desc">Informasi resmi dan berita terbaru untuk seluruh anggota tim.</p>
          </div>
        </div>
        {hasPermission('manage-announcements') && (
          <button 
            onClick={handleOpenAdd}
            className="dash-btn dash-btn-primary"
          >
            <Plus size={16} />
            Buat Pengumuman
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="text-sm font-medium">Memuat data pengumuman...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                <Info size={32} />
            </div>
            <p className="text-gray-500 font-medium">Belum ada pengumuman saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
              {hasPermission('manage-announcements') && (
                <div className="absolute top-4 right-4 flex items-center gap-1 z-10 transition-opacity">
                   <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(ann);
                      }}
                      className="p-2 bg-gray-50 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 border border-gray-100 hover:border-blue-100 transition-all shadow-sm"
                      title="Edit"
                   >
                       <Edit2 size={16} />
                   </button>
                   <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(ann.id);
                      }}
                      className="p-2 bg-gray-50 hover:bg-rose-50 rounded-xl text-gray-400 hover:text-rose-600 border border-gray-100 hover:border-rose-100 transition-all shadow-sm"
                      title="Hapus"
                   >
                       <Trash2 size={16} />
                   </button>
                </div>
              )}
              <h3 className="font-bold text-gray-900 text-lg mb-3 leading-tight pr-10">{ann.title}</h3>
              <div className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-4 whitespace-pre-wrap">
                  {ann.content}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <User size={14} />
                      {ann.user?.name || "Admin"}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Calendar size={14} />
                      {formatDate(ann.created_at)}
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal Add/Edit */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">
                            {modalMode === "add" ? "Buat Pengumuman Baru" : "Edit Pengumuman"}
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
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Judul Pengumuman</label>
                            <input 
                              required
                              type="text" 
                              value={formData.title} 
                              onChange={(e) => setFormData({...formData, title: e.target.value})}
                              placeholder="Ketik judul di sini..."
                              className="w-full h-11 px-4 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#8B0000] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Isi Pengumuman</label>
                            <textarea 
                              required
                              value={formData.content} 
                              onChange={(e) => setFormData({...formData, content: e.target.value})}
                              rows={6}
                              placeholder="Ketik detail pengumuman di sini..."
                              className="w-full p-4 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#8B0000] transition-colors resize-none"
                            ></textarea>
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
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Publikasikan"}
                        </button>
                    </div>
                  </form>
              </div>
          </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-8 text-center">
                  <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                      <Trash2 size={40} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Pengumuman?</h3>
                  <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed px-4">
                      Tindakan ini tidak dapat dibatalkan. Pengumuman ini akan dihapus permanen dari sistem.
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
