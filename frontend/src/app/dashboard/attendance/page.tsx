"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Search, Download, CheckCircle, Clock, FileWarning } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/attendance/history");
      setAttendance(response.data.data?.data || response.data.data || []);
    } catch (e) {
      console.error("Gagal mengambil data absensi", e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'present') return <span className="dash-badge dash-badge-success"><CheckCircle size={13} className="mr-1"/> Tepat Waktu</span>;
    if (status === 'late') return <span className="dash-badge dash-badge-danger"><Clock size={13} className="mr-1"/> Terlambat</span>;
    return <span className="dash-badge dash-badge-neutral">{status}</span>;
  };

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Riwayat Absensi</h1>
          <p className="dash-page-desc">Pantau catatan kehadiran harian karyawan secara real-time.</p>
        </div>
        <div className="dash-page-actions">
          {hasPermission('view-employees') && (
            <button className="dash-btn dash-btn-outline">
              <Download size={15} />
              Export Laporan
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white p-3 border border-[#ebedf0] rounded-lg">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama atau filter tanggal..."
              className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
      </div>

      <div className="dash-table-container">
        {loading ? (
          <div className="dash-loading"><div className="dash-spinner" /></div>
        ) : attendance.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Belum ada rekaman absensi.
          </div>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tanggal</th>
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Status Kehadiran</th>
                  <th>Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <span className="font-semibold text-gray-900">{record.user?.name || "Karyawan"}</span>
                    </td>
                    <td><span className="text-sm text-gray-600">{record.date}</span></td>
                    <td><span className="text-sm font-medium text-gray-900">{record.check_in_time || "-"}</span></td>
                    <td><span className="text-sm font-medium text-gray-900">{record.check_out_time || "-"}</span></td>
                    <td>{getStatusBadge(record.status)}</td>
                    <td>
                      <span className="text-xs text-gray-500 block truncate max-w-[150px]">
                        {record.check_in_location || "Sistem web"}
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
}
