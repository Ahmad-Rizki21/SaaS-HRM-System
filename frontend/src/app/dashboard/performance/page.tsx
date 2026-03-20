'use client';

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { 
  Users, UserCheck, Search, Filter, Plus, Calendar, Star, MoreVertical,
  Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, X, ArrowUpRight
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import Pagination from "@/components/Pagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PerformanceReview {
  id: number;
  period: string;
  score_total: number;
  status: string;
  achievements?: string;
  improvements?: string;
  created_at: string;
  user: {
    name: string;
    nik: string;
    profile_photo_url: string | null;
  };
  reviewer: {
    name: string;
  };
}

export default function PerformanceReviewsPage() {
  const { user, hasPermission } = useAuth();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  
  // Create Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingReview, setViewingReview] = useState<PerformanceReview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    user_id: '',
    period: new Date().toISOString().slice(0, 7), // 2026-03
    score_discipline: 80,
    score_technical: 80,
    score_cooperation: 80,
    score_attitude: 80,
    achievements: '',
    improvements: '',
    comments: '',
    status: 'published'
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/kpi-reviews?page=${page}&search=${search}`);
      setReviews(res.data.data.data);
      setTotalPages(res.data.data.last_page);
    } catch (e) {
      console.error("Gagal memuat data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get('/employees?per_page=100');
      setEmployees(res.data.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, search]);

  useEffect(() => {
    if (isModalOpen) fetchEmployees();
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await axiosInstance.put(`/kpi-reviews/${editingId}`, formData);
        alert("Review KPI berhasil diperbarui!");
      } else {
        await axiosInstance.post('/kpi-reviews', formData);
        alert("Review KPI berhasil disimpan!");
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchReviews();
    } catch (e: any) {
      alert(e.response?.data?.message || "Gagal menyimpan review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: any) => {
    setEditingId(review.id);
    setFormData({
      user_id: review.user_id,
      period: review.period,
      score_discipline: review.score_discipline,
      score_technical: review.score_technical,
      score_cooperation: review.score_cooperation,
      score_attitude: review.score_attitude,
      achievements: review.achievements || '',
      improvements: review.improvements || '',
      comments: review.comments || '',
      status: review.status
    });
    setIsModalOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      const res = await axiosInstance.get(`/kpi-reviews/${id}`);
      setViewingReview(res.data.data);
    } catch (e) {
      alert("Gagal memuat detail review");
    }
  };

  const generatePDF = (review: any) => {
    const doc = new jsPDF();
    const logoUrl = "/logo.png"; // Public URL
    
    // Create an image element to get base64
    const img = new (window as any).Image();
    img.src = logoUrl;
    img.onload = () => {
      // Header with Logo
      doc.addImage(img, 'PNG', 20, 10, 30, 30);
      
      doc.setFontSize(22);
      doc.setTextColor(139, 0, 0); // #8B0000
      doc.setFont("helvetica", "bold");
      doc.text("LAPORAN PENILAIAN KPI", 105, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`Periode: ${review.period}`, 105, 33, { align: 'center' });
      
      // Employee Info
      doc.setDrawColor(230);
      doc.line(20, 45, 190, 45);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMASI KARYAWAN", 20, 55);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Nama: ${review.user.name}`, 20, 62);
      doc.text(`NIK: ${review.user.nik}`, 20, 67);
      doc.text(`Jabatan: ${review.user.role?.name || "Karyawan"}`, 20, 72);
      doc.text(`Penilai: ${review.reviewer.name}`, 20, 77);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 190, 62, { align: 'right' });

      // Scores Table
      autoTable(doc, {
        startY: 85,
        head: [['Kategori Penilaian', 'Skor']],
        body: [
          ['Kedisplinan', review.score_discipline],
          ['Teknis / Kerja', review.score_technical],
          ['Kerjasama Tim', review.score_cooperation],
          ['Sikap / Attitude', review.score_attitude],
          ['TOTAL SKOR (Rata-rata)', review.score_total],
        ],
        headStyles: { fillColor: [139, 0, 0] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
      });

      // Notes
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("CATATAN & EVALUASI", 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Pencapaian:", 20, finalY + 10);
      doc.setFont("helvetica", "italic");
      doc.text(review.achievements || "Tidak ada catatan pencapaian khusus.", 25, finalY + 16, { maxWidth: 160 });
      
      doc.setFont("helvetica", "bold");
      doc.text("Perlu Peningkatan:", 20, finalY + 30);
      doc.setFont("helvetica", "italic");
      doc.text(review.improvements || "Tetap pertahankan performa yang sudah baik.", 25, finalY + 36, { maxWidth: 160 });

      // Footer
      doc.setFont("helvetica", "normal");
      doc.text("Reviewer,", 40, finalY + 60);
      doc.text(review.reviewer.name, 40, finalY + 85);
      
      doc.text("Management,", 150, finalY + 60);
      doc.text("Direktur HRD", 150, finalY + 85);

      doc.save(`KPI_${review.user.name}_${review.period}.pdf`);
    };
    
    img.onerror = () => {
       // Fallback without logo if error
       alert("Gagal memuat logo, sistem akan mencetak tanpa logo.");
       doc.setFontSize(22);
       doc.setTextColor(139, 0, 0); 
       doc.text("LAPORAN PENILAIAN KPI", 105, 25, { align: 'center' });
       // ... (logic from before or just skip)
       doc.save(`KPI_${review.user.name}_${review.period}.pdf`);
    };
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus review ini?")) return;
    try {
      await axiosInstance.delete(`/kpi-reviews/${id}`);
      fetchReviews();
    } catch (e) { console.error(e); }
  };

  const isAdmin = user?.role?.name === 'Admin' || user?.role?.name === 'Super Admin' || user?.role?.name === 'HR';

  return (
    <div className="w-full pb-8 animate-in fade-in duration-500 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">KPI Management</h1>
          <p className="text-gray-500 font-medium">Pantau dan kelola pencapaian Key Performance Indicators tim.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#8B0000] text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            <Plus size={18} /> Buat Review KPI
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
             <Star size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Score</p>
              <h3 className="text-2xl font-black text-gray-900">84.5 <span className="text-sm font-medium text-gray-400">/ 100</span></h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
             <CheckCircle size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reviews Completed</p>
              <h3 className="text-2xl font-black text-gray-900">{totalPages * reviews.length || 0}</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="bg-[#fef2f2] p-4 rounded-2xl text-[#8B0000]">
             <Clock size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Period</p>
              <h3 className="text-xl font-black text-gray-900">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h3>
           </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-[2rem] p-4 mb-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari karyawan atau NIK..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 bg-gray-100 px-6 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors uppercase tracking-widest">
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-5 px-8 text-xs font-black text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="py-5 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Period</th>
                <th className="py-5 px-6 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Score</th>
                <th className="py-5 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="py-5 px-8 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-5 px-8 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100" />
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-gray-100 rounded" />
                        <div className="w-20 h-3 bg-gray-50 rounded" />
                      </div>
                    </td>
                    <td colSpan={4}><div className="h-4 bg-gray-50 rounded mx-6" /></td>
                  </tr>
                ))
              ) : reviews.length > 0 ? (
                reviews.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-8">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#8B0000]/20 transition-all">
                           {row.user.profile_photo_url ? (
                             <img src={row.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <span className="text-sm font-bold text-[#8B0000]">{row.user.name.charAt(0)}</span>
                           )}
                         </div>
                         <div>
                            <p className="text-sm font-black text-gray-900">{row.user.name}</p>
                            <p className="text-[10px] font-bold text-gray-400">{row.user.nik}</p>
                         </div>
                       </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                         <Calendar size={14} className="text-[#8B0000]" />
                         <span className="text-xs font-bold text-gray-700">{row.period}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-black text-sm border-2 ${
                         row.score_total >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                         row.score_total >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                         'bg-red-50 text-red-700 border-red-100'
                       }`}>
                         {row.score_total}
                       </div>
                    </td>
                    <td className="py-4 px-6">
                       <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                         row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                       }`}>
                         {row.status}
                       </span>
                    </td>
                    <td className="py-4 px-8 text-right space-x-2 whitespace-nowrap">
                       <button onClick={() => handleView(row.id)} className="p-2 text-gray-400 hover:text-[#8B0000] hover:bg-red-50 rounded-xl transition-all"><Eye size={18} /></button>
                       {isAdmin && (
                         <>
                           <button onClick={() => handleEdit(row)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={18} /></button>
                           <button onClick={() => handleDelete(row.id)} className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                         </>
                       )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="text-gray-200 mb-4" size={48} />
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada review performa</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-50">
            <Pagination 
              currentPage={page} 
              lastPage={totalPages} 
              total={reviews.length} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </div>

      {/* Create Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border border-white/20">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{editingId ? "Edit Review KPI" : "Buat Review KPI"}</h3>
                <p className="text-xs font-medium text-gray-500">Berikan penilaian objektif berdasarkan target KPI.</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 leading-none">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Karyawan</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#8B0000]/20"
                    required
                    value={formData.user_id}
                    onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  >
                    <option value="">-- Pilih Karyawan --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.nik})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Periode</label>
                  <input 
                    type="month" 
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#8B0000]/20"
                    required
                    value={formData.period}
                    onChange={(e) => setFormData({...formData, period: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Kedisplinan</label>
                  <input type="number" min="0" max="100" className="w-full bg-gray-50 border-none rounded-xl p-3 text-center font-black text-emerald-700" value={formData.score_discipline} onChange={(e) => setFormData({...formData, score_discipline: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Skill Teknis</label>
                  <input type="number" min="0" max="100" className="w-full bg-gray-50 border-none rounded-xl p-3 text-center font-black text-blue-700" value={formData.score_technical} onChange={(e) => setFormData({...formData, score_technical: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Kerjasama</label>
                  <input type="number" min="0" max="100" className="w-full bg-gray-50 border-none rounded-xl p-3 text-center font-black text-amber-700" value={formData.score_cooperation} onChange={(e) => setFormData({...formData, score_cooperation: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Attitude</label>
                  <input type="number" min="0" max="100" className="w-full bg-gray-50 border-none rounded-xl p-3 text-center font-black text-red-700" value={formData.score_attitude} onChange={(e) => setFormData({...formData, score_attitude: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Achievements (Pencapaian)</label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#8B0000]/20 min-h-[80px]"
                    placeholder="Apa saja prestasi karyawan dalam periode ini?"
                    value={formData.achievements}
                    onChange={(e) => setFormData({...formData, achievements: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Improvements (Hal yang perlu diperbaiki)</label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#8B0000]/20 min-h-[80px]"
                    placeholder="Area mana yang butuh ditingkatkan?"
                    value={formData.improvements}
                    onChange={(e) => setFormData({...formData, improvements: e.target.value})}
                  />
                </div>
              </div>
            </form>
            
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
               <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors text-xs uppercase"
               >
                 Batal
               </button>
               <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="px-10 py-3 bg-[#8B0000] text-white rounded-2xl font-black shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
               >
                 {submitting ? "Menyimpan..." : "Simpan & Publikasikan"} 
                 <ArrowUpRight size={16} />
               </button>
            </div>
          </div>
        </div>
      )}
    {/* Detail Review Modal */}
    {viewingReview && (
      <div className="fixed inset-0 bg-black/50 z-120 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
           <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-linear-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#8B0000] flex items-center justify-center text-white shadow-lg shadow-red-900/20">
                   <Star size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900">KPI Review Summary</h3>
                  <p className="text-xs font-bold text-[#8B0000] uppercase tracking-widest">{viewingReview.period}</p>
                </div>
              </div>
              <button onClick={() => setViewingReview(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400"><X size={24} /></button>
           </div>
           
           <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-8 mb-10 pb-8 border-b border-gray-50">
                 <div className="flex items-center gap-5 flex-1">
                    <div className="w-20 h-20 rounded-[2rem] bg-gray-100 overflow-hidden border-4 border-white shadow-xl">
                      {viewingReview.user.profile_photo_url ? (
                        <img src={viewingReview.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-300">{viewingReview.user.name.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">{viewingReview.user.name}</p>
                      <p className="text-sm font-bold text-gray-400">NIK: {viewingReview.user.nik}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Active Employee</span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="bg-[#8B0000] p-6 rounded-[2rem] text-white flex flex-col items-center justify-center min-w-[140px] shadow-xl shadow-red-900/30">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Final Score</p>
                    <h4 className="text-4xl font-black leading-none">{viewingReview.score_total}</h4>
                    <p className="text-[10px] font-bold mt-2 bg-white/20 px-3 py-1 rounded-full">{viewingReview.score_total >= 80 ? 'EXCELLENT' : 'GOOD'}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'DISCIPLINE', score: (viewingReview as any).score_discipline, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'TECHNICAL', score: (viewingReview as any).score_technical, color: 'bg-blue-50 text-blue-600' },
                  { label: 'TEAMWORK', score: (viewingReview as any).score_cooperation, color: 'bg-amber-50 text-amber-600' },
                  { label: 'ATTITUDE', score: (viewingReview as any).score_attitude, color: 'bg-red-50 text-red-600' },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.color} p-4 rounded-2xl flex flex-col items-center justify-center border border-current/10`}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">{stat.label}</p>
                    <p className="text-xl font-black">{stat.score}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-8">
                 <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <div className="w-1.5 h-3 bg-[#8B0000] rounded-full"></div> Achievements
                    </h4>
                    <div className="bg-gray-50 p-6 rounded-2xl text-sm font-medium text-gray-600 italic leading-relaxed">
                       "{viewingReview.achievements || "Tidak ada catatan pencapaian khusus."}"
                    </div>
                 </div>
                 <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <div className="w-1.5 h-3 bg-blue-600 rounded-full"></div> Improvements
                    </h4>
                    <div className="bg-gray-50 p-6 rounded-2xl text-sm font-medium text-gray-600 italic leading-relaxed">
                       "{viewingReview.improvements || "Tetap pertahankan performa yang sudah baik."}"
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#8B0000]">
                    <UserCheck size={16} />
                 </div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase">
                    Reviewer: <span className="text-gray-900">{viewingReview.reviewer.name}</span>
                 </div>
              </div>
              <button 
                onClick={() => generatePDF(viewingReview)}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                Download PDF <ArrowUpRight size={16} />
              </button>
           </div>
        </div>
      </div>
    )}
    </div>
  );
}
