"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { 
  Search, Download, Eye, FileSpreadsheet, 
  Calendar, CheckCircle2, DollarSign, Loader2
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PayrollHistoryPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [monthFilter, setMonthFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/payroll/history');
      setData(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const response = await axiosInstance.get('/payroll/export', {
        params: { month: monthFilter },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Payroll.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Gagal ekspor Excel");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPDF = async (id: number, name: string) => {
    try {
      const response = await axiosInstance.get(`/payroll/download-slip/${id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Slip_Gaji_${name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Gagal unduh PDF");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="dash-page-header flex justify-between items-center">
        <div>
          <h1 className="dash-page-title">{t('payroll_history')}</h1>
          <p className="text-gray-400 font-medium">Laporan penggajian bulanan perusahaan.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-6 h-12 bg-emerald-50 text-emerald-600 rounded-2xl font-bold border border-emerald-100"
          >
            {exporting ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
            Export Excel
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard/payroll/process'}
            className="flex items-center gap-2 px-6 h-12 bg-[#8B0000] text-white rounded-2xl font-bold shadow-lg"
          >
            <DollarSign size={16} />
            Proses Baru
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-10">Karyawan</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Periode</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Payable</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10 opacity-50">Memuat...</td></tr>
            ) : data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-6 pl-10 font-bold text-gray-900">{item.user?.name}</td>
                <td className="px-6 py-6 text-xs text-gray-500">{item.month} {item.year}</td>
                <td className="px-6 py-6 text-sm font-black text-[#8B0000]">Rp {parseInt(item.net_salary).toLocaleString('id-ID')}</td>
                <td className="px-6 py-6 text-center">
                  <button 
                    onClick={() => handleDownloadPDF(item.id, item.user?.name)}
                    className="p-3 text-gray-400 hover:text-[#8B0000] transition-all"
                  >
                    <Download size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
