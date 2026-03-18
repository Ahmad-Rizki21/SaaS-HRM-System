"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Plus, Search, Check, X, Eye, ReceiptCent } from "lucide-react";

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReimbursements();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="dash-badge dash-badge-warning">Menunggu</span>;
      case 'approved': return <span className="dash-badge dash-badge-success">Disetujui</span>;
      case 'rejected': return <span className="dash-badge dash-badge-danger">Ditolak</span>;
      default: return <span className="dash-badge dash-badge-neutral">{status}</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Klaim & Reimbursement</h1>
          <p className="dash-page-desc">Tinjau dan proses klaim dana operasional yang diajukan oleh karyawan.</p>
        </div>
        <div className="dash-page-actions">
          <button className="dash-btn dash-btn-primary">
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
                  <th>Kategori Pengeluaran</th>
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
                    <td><span className="text-sm text-gray-600">{item.date || "-"}</span></td>
                    <td>
                      <span className="text-sm font-medium text-gray-700 capitalize flex items-center gap-1.5">
                        <ReceiptCent size={14} className="text-gray-400" />
                        {item.category || "Operasional"}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.amount || 0)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-500 block truncate max-w-[150px]">
                        {item.description}
                      </span>
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td className="text-right">
                      {item.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button className="dash-action-btn edit" title="Setujui Klaim"><Check size={16} /></button>
                          <button className="dash-action-btn delete" title="Tolak Klaim"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end">
                          <button className="dash-action-btn" title="Lihat Detail/Bukti"><Eye size={16} /></button>
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
    </div>
  );
}
