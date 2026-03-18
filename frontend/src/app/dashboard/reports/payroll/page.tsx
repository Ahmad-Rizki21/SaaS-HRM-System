"use client";

import { useEffect, useState } from "react";
import { Download, Search, FileSpreadsheet, AlertCircle } from "lucide-react";
import { ReportSkeleton } from "@/components/Skeleton";
import * as XLSX from 'xlsx';

export default function ReportsPayrollPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data load — replace with real fetch later
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <ReportSkeleton />;
  }

  const exportPayrollToExcel = () => {
    const dummyData = [
      { "ID Karyawan": "EMP-001", "Nama Karyawan": "Budi Santoso", "Jabatan": "Manager", "Kehadiran (Hari)": 22, "Gaji Pokok": 8500000, "Tunjangan": 1500000, "Uang Lembur": 600000, "Bonus": 0, "Potongan BPJS": 150000, "Potongan Absen": 0, "Total Take Home Pay": 10450000 },
      { "ID Karyawan": "EMP-002", "Nama Karyawan": "Siti Aminah", "Jabatan": "Staff HR", "Kehadiran (Hari)": 20, "Gaji Pokok": 5000000, "Tunjangan": 500000, "Uang Lembur": 0, "Bonus": 250000, "Potongan BPJS": 100000, "Potongan Absen": 200000, "Total Take Home Pay": 5450000 },
      { "ID Karyawan": "EMP-003", "Nama Karyawan": "Agus Pratama", "Jabatan": "IT Support", "Kehadiran (Hari)": 22, "Gaji Pokok": 6000000, "Tunjangan": 800000, "Uang Lembur": 950000, "Bonus": 0, "Potongan BPJS": 120000, "Potongan Absen": 0, "Total Take Home Pay": 7630000 },
      { "ID Karyawan": "EMP-004", "Nama Karyawan": "Rina Gunawan", "Jabatan": "Sales", "Kehadiran (Hari)": 23, "Gaji Pokok": 4500000, "Tunjangan": 500000, "Uang Lembur": 150000, "Bonus": 1200000, "Potongan BPJS": 80000, "Potongan Absen": 0, "Total Take Home Pay": 6270000 }
    ];

    const worksheet = XLSX.utils.json_to_sheet(dummyData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 18 }, 
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 25 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll_Preview");
    XLSX.writeFile(workbook, `Dummy_Template_Payroll_${new Date().getTime()}.xlsx`);
    
    alert("Karena modul Payroll masih dikembangkan, file yang terunduh adalah DUMMY TEMPLATE sebagai pratinjau format laporan penggajian.");
  };

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Rekap Laporan Gaji (Payroll)</h1>
          <p className="dash-page-desc">Modul untuk kalkulasi slip gaji, potongan, dan benefit karyawan bulanan.</p>
        </div>
        <div className="dash-page-actions">
          <button className="dash-btn dash-btn-primary bg-[#107c41] hover:bg-[#0c6130] text-white!" onClick={exportPayrollToExcel}>
            <FileSpreadsheet size={15} />
            Export Data Payroll
          </button>
        </div>
      </div>

      <div className="dash-table-container">
          <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center">
            <AlertCircle size={48} className="text-gray-300 mb-4" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Modul Payroll Sedang Dibangun</h3>
            <p className="max-w-md mx-auto mb-6">Modul sistem penggajian (Payroll) masih dalam antrean pengembangan. Anda tetap dapat menekan tombol <strong>Export Data Payroll</strong> di atas untuk melihat contoh format laporan Excel yang menawan sebagai referensi Pimpinan.</p>
          </div>
      </div>
    </div>
  );
}
