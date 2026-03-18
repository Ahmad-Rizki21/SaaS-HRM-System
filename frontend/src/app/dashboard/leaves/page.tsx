"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Plus, Search, Check, X, Eye, Plane } from "lucide-react";

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/leave");
      setLeaves(response.data.data?.data || response.data.data || []);
    } catch (e) {
      console.error("Gagal mendapatkan data cuti", e);
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

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Cuti Karyawan</h1>
          <p className="dash-page-desc">Kelola persetujuan dan riwayat pengajuan cuti secara terpusat.</p>
        </div>
        <div className="dash-page-actions">
          <button className="dash-btn dash-btn-primary">
            <Plus size={15} />
            Ajukan Cuti Baru
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white p-3 border border-[#ebedf0] rounded-lg">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari pengajuan cuti..."
              className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors"
            />
        </div>
      </div>

      <div className="dash-table-container">
        {loading ? (
          <div className="dash-loading"><div className="dash-spinner" /></div>
        ) : leaves.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Tidak ada data pengajuan cuti.
          </div>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tipe Cuti</th>
                  <th>Tanggal Mulai</th>
                  <th>Tanggal Selesai</th>
                  <th>Alasan</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td><span className="font-semibold text-gray-900">{leave.user?.name || "Karyawan"}</span></td>
                    <td>
                      <span className="text-sm font-medium text-gray-700 capitalize flex items-center gap-1.5">
                        <Plane size={14} className="text-gray-400" />
                        {leave.leave_type || "Cuti Tahunan"}
                      </span>
                    </td>
                    <td><span className="text-sm text-gray-600">{leave.start_date}</span></td>
                    <td><span className="text-sm text-gray-600">{leave.end_date}</span></td>
                    <td>
                      <span className="text-xs text-gray-500 block truncate max-w-[150px]">
                        {leave.reason}
                      </span>
                    </td>
                    <td>{getStatusBadge(leave.status)}</td>
                    <td className="text-right">
                      {leave.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button className="dash-action-btn edit" title="Setujui"><Check size={16} /></button>
                          <button className="dash-action-btn delete" title="Tolak"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end">
                          <button className="dash-action-btn" title="Lihat Detail"><Eye size={16} /></button>
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
