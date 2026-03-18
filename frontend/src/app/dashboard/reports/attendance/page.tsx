"use client";

import { Download, Search } from "lucide-react";

export default function ReportsAttendancePage() {
  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Rekap Laporan Absensi</h1>
          <p className="dash-page-desc">Halaman khusus untuk generate rekap absensi karyawan bulanan.</p>
        </div>
        <div className="dash-page-actions">
          <button className="dash-btn dash-btn-primary">
            <Download size={15} />
            Download PDF
          </button>
        </div>
      </div>

      <div className="dash-table-container">
          <div className="p-8 text-center text-gray-500 text-sm">
            Halaman sedang dalam tahap pengembangan (WIP). Data rekap laporan belum tersedia.
          </div>
      </div>
    </div>
  );
}
