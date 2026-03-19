"use client";

import { useEffect, useState } from "react";
import { Download, Search, FileSpreadsheet, AlertCircle } from "lucide-react";
import { ReportSkeleton } from "@/components/Skeleton";
import axiosInstance from "@/lib/axios";

export default function ReportsAttendancePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data load — replace with real fetch later
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <ReportSkeleton />;
  }

  const exportAttendanceToExcel = async () => {
    try {
      const response = await axiosInstance.get('/attendance/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rekap_Absensi_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Gagal mendownload laporan Excel", e);
      alert("Gagal mengunduh Laporan Excel.");
    }
  };

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Rekap Laporan Absensi</h1>
          <p className="dash-page-desc">Halaman khusus untuk generate rekap absensi karyawan bulanan.</p>
        </div>
        <div className="dash-page-actions">
          <button className="dash-btn dash-btn-primary bg-[#107c41] hover:bg-[#0c6130] text-white!" onClick={exportAttendanceToExcel}>
            <FileSpreadsheet size={15} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="dash-table-container">
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle size={48} className="text-[#107c41] mb-4" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Sinkronisasi Data Selesai</h3>
            <p className="max-w-md mx-auto mb-6 text-gray-500 text-sm">Basis data absensi sudah berhasil diintegrasikan dengan backend secara penuh. Bosqu sekarang dapat menekan tombol <strong>Export Excel</strong> untuk mendownload Laporan Kehadiran Karyawan yang sesungguhnya ke format Microsoft Excel (.xlsx).</p>
          </div>
      </div>
    </div>
  );
}
