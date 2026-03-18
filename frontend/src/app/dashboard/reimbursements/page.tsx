"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Plus, Search, Check, X, Eye, ReceiptCent, Upload, AlertCircle, XCircle } from "lucide-react";

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    amount: "",
    description: "",
    attachment: null,
  });

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const getStorageUrl = (path: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000";
    return `${backendUrl}/storage/${path}`;
  };

  useEffect(() => {
    fetchReimbursements();
    const interval = setInterval(fetchReimbursements, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/reimbursements");
      setReimbursements(response.data.data?.data || response.data.data || []);
    } catch (e) {
      console.error("Gagal mendapatkan data klaim", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    const remark = prompt("Ketik catatan persetujuan (opsional):");
    if (remark === null) return; // Cancelled
    
    try {
      await axiosInstance.post(`/reimbursements/${id}/approve`, { remark });
      alert("Klaim disetujui!");
      fetchReimbursements();
    } catch (e) {
      alert("Gagal memproses klaim.");
    }
  };

  const handleReject = async (id: number) => {
    const remark = prompt("Ketik alasan penolakan (WAJIB):");
    if (!remark) {
      if (remark === "") alert("Alasan penolakan harus diisi!");
      return; // Cancelled or empty
    }
    
    try {
      await axiosInstance.post(`/reimbursements/${id}/reject`, { remark });
      alert("Klaim ditolak.");
      fetchReimbursements();
    } catch (e) {
      alert("Gagal memproses klaim.");
    }
  };

  const handleViewDetail = (item: any) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("amount", formData.amount);
    data.append("description", formData.description);
    if (formData.attachment) {
      data.append("attachment", formData.attachment);
    }

    try {
      await axiosInstance.post("/reimbursements", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Klaim berhasil diajukan! Menunggu persetujuan admin.");
      setIsModalOpen(false);
      setFormData({ title: "", amount: "", description: "", attachment: null });
      fetchReimbursements();
    } catch (e: any) {
      if (e.response?.status === 422 && e.response?.data?.errors) {
        const errorDetails = Object.values(e.response.data.errors)
          .map((err: any) => err[0])
          .join("\n");
        alert(`Gagal: ${e.response.data.message}\n\n${errorDetails}`);
      } else {
        alert(e.response?.data?.message || "Gagal mengajukan klaim.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="dash-badge dash-badge-warning">Menunggu</span>;
      case 'approved': return <span className="dash-badge dash-badge-success">Disetujui</span>;
      case 'rejected': return <span className="dash-badge dash-badge-danger">Ditolak</span>;
      default: return <span className="dash-badge dash-badge-neutral">{status}</span>;
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Klaim & Reimbursement</h1>
          <p className="dash-page-desc">Tinjau dan proses klaim dana operasional yang diajukan oleh karyawan.</p>
        </div>
        <div className="dash-page-actions">
          <button 
            className="dash-btn dash-btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            Buat Reimbursement Baru
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white p-3 border border-[#ebedf0] rounded-lg">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari klaim dari nama karyawan..."
              className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors"
            />
        </div>
      </div>

      <div className="dash-table-container">
        {loading ? (
          <div className="dash-loading"><div className="dash-spinner" /></div>
        ) : reimbursements.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Tidak ada pengajuan klaim/reimbursement.
          </div>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Judul Pengeluaran</th>
                  <th>Total Nominal</th>
                  <th>Deskripsi</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reimbursements.map((item) => (
                  <tr key={item.id}>
                    <td><span className="font-semibold text-gray-900">{item.user?.name || "Karyawan"}</span></td>
                    <td><span className="text-sm text-gray-600">
                      {new Date(item.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span></td>
                    <td>
                      <span className="text-sm font-medium text-gray-700 capitalize flex items-center gap-1.5">
                        <ReceiptCent size={14} className="text-gray-400" />
                        {item.title || "Operasional"}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-500 block truncate max-w-[150px]" title={item.description}>
                        {item.description}
                      </span>
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td className="text-right">
                      {item.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            className="dash-action-btn view" 
                            title="Lihat Detail"
                            onClick={() => handleViewDetail(item)}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="dash-action-btn edit" 
                            title="Setujui Klaim"
                            onClick={() => handleApprove(item.id)}
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            className="dash-action-btn delete" 
                            title="Tolak Klaim"
                            onClick={() => handleReject(item.id)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end">
                          <button 
                            className="dash-action-btn view" 
                            title="Lihat Detail/Bukti"
                            onClick={() => handleViewDetail(item)}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Buat Reimbursement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Buat Klaim Baru</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Judul / Keperluan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Parkir & Bensin Kunjungan Klien"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 text-sm">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Lengkap</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan alasan pengajuan..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Upload Bukti (Nota/Resi)</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="attachment-upload"
                    onChange={(e) => setFormData({ ...formData, attachment: e.target.files?.[0] || null })}
                  />
                  <label 
                    htmlFor="attachment-upload"
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      formData.attachment ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-400'
                    }`}
                  >
                    {formData.attachment ? (
                      <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                        <Check size={18} />
                        {formData.attachment.name}
                      </div>
                    ) : (
                      <>
                        <Upload size={20} className="text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Klik untuk upload foto bukti</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] h-10 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Ajukan Klaim"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Detail Modal */}
      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">Detail Klaim & Bukti</h3>
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
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md italic">
                    {selectedItem.user?.name?.charAt(0) || "K"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{selectedItem.user?.name || "Karyawan"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedItem.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-2xl">
                    <p className="text-[10px] uppercase font-black text-gray-400 mb-1">TOTAL NOMINAL</p>
                    <p className="text-base font-black text-gray-900 italic">Rp {parseInt(selectedItem.amount).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="p-4 border rounded-2xl">
                    <p className="text-[10px] uppercase font-black text-gray-400 mb-1">STATUS</p>
                    {getStatusBadge(selectedItem.status)}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-2 px-1">DESKRIPSI</p>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">"{selectedItem.description || 'Tidak ada keterangan'}"</p>
                  </div>
                </div>

                {selectedItem.remark && (
                  <div>
                    <p className={`text-[10px] uppercase font-black mb-2 px-1 ${selectedItem.status === 'rejected' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {selectedItem.status === 'rejected' ? 'ALASAN PENOLAKAN' : 'CATATAN ADMIN'}
                    </p>
                    <div className={`p-4 rounded-2xl border ${selectedItem.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                      <p className="text-sm font-bold italic">"{selectedItem.remark}"</p>
                    </div>
                  </div>
                )}

                {selectedItem.attachment && (
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400 mb-2 px-1">BUKTI STRUK / NOTA</p>
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 group relative">
                        <img 
                            src={getStorageUrl(selectedItem.attachment)} 
                            alt="Bukti Struk" 
                            className="w-full h-auto max-h-[400px] object-contain mx-auto transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                                (e.target as any).src = 'https://placehold.co/600x400?text=Gambar+Gagal+Dimuat';
                            }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <a 
                             href={getStorageUrl(selectedItem.attachment)} 
                             target="_blank" 
                             className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-xs"
                             rel="noopener noreferrer"
                           >
                             Buka Ukuran Penuh
                           </a>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
               <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-sm"
                >
                  Tutup Detail
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
