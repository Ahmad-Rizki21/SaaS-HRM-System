"use client";

import { Download, Search } from "lucide-react";

export default function ReportsPayrollPage() {
  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Rekap Laporan Gaji (Payroll)</h1>
          <p className="dash-page-desc">Modul untuk kalkulasi slip gaji, potongan, dan benefit karyawan bulanan.</p>
        </div>
        <div className="dash-page-actions">
          <button className="dash-btn dash-btn-primary">
            <Download size={15} />
            Export Data Payroll
          </button>
        </div>
      </div>

      <div className="dash-table-container">
          <div className="p-8 text-center text-gray-500 text-sm">
            Modul sistem Payroll masih dalam tahap penambahan fitur (WIP).
          </div>
      </div>
    </div>
  );
}
