"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { User, Calendar, Filter, ChevronRight, ChevronLeft, FileSpreadsheet, AlertCircle } from "lucide-react";
import Pagination from "@/components/Pagination";
import { ReportSkeleton } from "@/components/Skeleton";

export default function ReportsAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  
  // Utils to get local date string YYYY-MM-DD
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filters
  const [startDate, setStartDate] = useState(getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(getLocalDateString(new Date()));
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [page, startDate, endDate, selectedUser]);

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get("/employees?per_page=100");
      setEmployees(res.data.data.data || []);
    } catch (e) {
      console.error("Gagal mengambil data karyawan", e);
    }
  };

  const fetchHistory = async (pageNumber = 1) => {
    try {
      setFetchingPreview(true);
      const res = await axiosInstance.get(`/attendance/history?page=${pageNumber}&start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`);
      setHistory(res.data.data.data || []);
      setPagination(res.data.data);
      setLoading(false);
    } catch (e) {
      console.error("Gagal mengambil preview report", e);
    } finally {
      setFetchingPreview(false);
    }
  };

  if (loading) {
    return <ReportSkeleton />;
  }

  const exportAttendanceToExcel = async () => {
    try {
      const response = await axiosInstance.get(`/attendance/export?start_date=${startDate}&end_date=${endDate}${selectedUser ? `&user_id=${selectedUser}` : ""}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rekap_Absensi_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Gagal mendownload laporan Excel", e);
      alert("Gagal mengunduh Laporan Excel.");
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'present': return <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Hadir</span>;
      case 'late': return <span className="text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">Terlambat</span>;
      case 'no_schedule': return <span className="text-gray-400 font-bold text-[10px] bg-gray-50 px-2 py-0.5 rounded uppercase tracking-wider">Luar Jadwal</span>;
      default: return <span className="text-gray-600 font-bold text-[10px] bg-gray-50 px-2 py-0.5 rounded uppercase tracking-wider">{status}</span>;
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} /> Dari Tanggal
          </label>
          <input 
            type="date" 
            className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107c41]/20 transition-all bg-gray-50/50"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} /> Sampai Tanggal
          </label>
          <input 
            type="date" 
            className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107c41]/20 transition-all bg-gray-50/50"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <User size={12} /> Pilih Karyawan
          </label>
          <select 
            className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107c41]/20 transition-all bg-gray-50/50"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Semua Karyawan</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
           <button 
            type="button" 
            onClick={() => fetchHistory(1)}
            className="w-full h-10 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-gray-200"
           >
             <Filter size={15} />
             Terapkan Filter
           </button>
        </div>
      </div>

      <div className="dash-table-container min-h-[400px]">
        {fetchingPreview ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-[#107c41] rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-xs font-medium tracking-wider uppercase">Memuat Preview Data...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center opacity-60">
            <AlertCircle size={48} className="text-gray-200 mb-4" />
            <h3 className="font-bold text-gray-400 text-sm tracking-widest uppercase">Data Tidak Ditemukan</h3>
            <p className="text-gray-400 text-xs mt-1">Sesuaikan filter tanggal atau pilih karyawan lain.</p>
          </div>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Karyawan</th>
                  <th>Jam Masuk</th>
                  <th>Jam Keluar</th>
                  <th>Status</th>
                  <th>Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium whitespace-nowrap text-xs">
                       {row.check_in ? new Date(row.check_in).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs">{row.user?.name}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">ID: {row.user?.id}</span>
                      </div>
                    </td>
                    <td className="text-xs font-bold text-blue-600">
                      {row.check_in ? new Date(row.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="text-xs font-bold text-amber-600">
                      {row.check_out ? new Date(row.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td>
                      {getStatusLabel(row.status)}
                    </td>
                    <td className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]" title={`${row.latitude_in}, ${row.longitude_in}`}>
                      {row.latitude_in ? `${Number(row.latitude_in).toFixed(4)}, ${Number(row.longitude_in).toFixed(4)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.total > 0 && (
           <div className="border-t border-gray-50 flex items-center justify-between p-4 bg-gray-50/20">
              <span className="text-xs text-gray-400 font-medium tracking-tight">Menampilkan {history.length} dari {pagination.total} rekaman absensi</span>
              <Pagination 
                currentPage={pagination.current_page} 
                lastPage={pagination.last_page} 
                total={pagination.total} 
                onPageChange={setPage} 
              />
           </div>
        )}
      </div>
    </div>
  );
}
