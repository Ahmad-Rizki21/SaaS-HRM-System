"use client";

import { useEffect, useState } from "react";
import { Download, Search, FileSpreadsheet, AlertCircle } from "lucide-react";
import { ReportSkeleton } from "@/components/Skeleton";
import * as XLSX from 'xlsx';

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

  const exportAttendanceToExcel = () => {
    const dummyData = [
      { "Tanggal": "2023-11-01", "Nama Karyawan": "Budi Santoso", "Jam Masuk": "08:00:00", "Jam Keluar": "17:05:00", "Status Kehadiran": "Hadir", "Lokasi Absen": "Kantor Pusat (-6.200000, 106.816666)", "Keterangan": "-" },
      { "Tanggal": "2023-11-01", "Nama Karyawan": "Siti Aminah", "Jam Masuk": "08:15:00", "Jam Keluar": "17:00:00", "Status Kehadiran": "Terlambat", "Lokasi Absen": "Kantor Pusat (-6.200000, 106.816666)", "Keterangan": "Macet di jalan" },
      { "Tanggal": "2023-11-01", "Nama Karyawan": "Agus Pratama", "Jam Masuk": "-", "Jam Keluar": "-", "Status Kehadiran": "Sakit", "Lokasi Absen": "-", "Keterangan": "Surat dokter diserahkan via HR" },
      { "Tanggal": "2023-11-01", "Nama Karyawan": "Rina Gunawan", "Jam Masuk": "08:00:00", "Jam Keluar": "17:45:00", "Status Kehadiran": "Hadir (Lembur)", "Lokasi Absen": "WFH (Rumah)", "Keterangan": "Penugasan Remote" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(dummyData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, 
      { wch: 20 }, { wch: 35 }, { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan_Absensi");
    XLSX.writeFile(workbook, `Dummy_Template_Absensi_${new Date().getTime()}.xlsx`);
    
    alert("Karena modul Laporan Kehadiran sedang difinalisasi, file yang terunduh adalah DUMMY TEMPLATE sebagai pratinjau format excel yang akan didapat.");
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
          <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center">
            <AlertCircle size={48} className="text-gray-300 mb-4" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Tabel Rekap Kehadiran Sedang Dibuat</h3>
            <p className="max-w-md mx-auto mb-6">Basis data absensi sedang dalam proses integrasi di backend. Namun Bosqu tetap dapat menekan tombol <strong>Export Excel</strong> untuk mendownload dan melihat *template preview* laporan kehadiran.</p>
          </div>
      </div>
    </div>
  );
}
