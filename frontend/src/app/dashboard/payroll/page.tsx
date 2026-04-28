"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { 
  Search, Download, Eye, FileSpreadsheet, 
  DollarSign, Loader2, X, Printer
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PayrollSkeleton } from "@/components/Skeleton";

export default function PayrollHistoryPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [monthFilter, setMonthFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  // Slip preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSalary, setPreviewSalary] = useState<any>(null);

  useEffect(() => {
    fetchHistory();
  }, [monthFilter, yearFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/payroll/history', {
        params: { month: monthFilter, year: yearFilter }
      });
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
        params: { month: monthFilter, year: yearFilter },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Payroll_${monthFilter}_${yearFilter}.xlsx`);
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

  const handlePreviewSlip = async (salary: any) => {
    try {
      setPreviewSalary(salary);
      setPreviewLoading(true);
      setPreviewOpen(true);
      const res = await axiosInstance.get(`/payroll/preview-slip/${salary.id}`);
      setPreviewHtml(res.data.html);
    } catch (e) {
      alert("Gagal memuat preview slip gaji");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrintSlip = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (loading) return <PayrollSkeleton />;

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
            className="flex items-center gap-2 px-6 h-12 bg-emerald-50 text-emerald-600 rounded-2xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
          >
            {exporting ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
            Export Excel
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard/payroll/process'}
            className="flex items-center gap-2 px-6 h-12 bg-[#8B0000] text-white rounded-2xl font-bold shadow-lg hover:bg-[#6d0000] transition-colors"
          >
            <DollarSign size={16} />
            Proses Baru
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 font-bold px-2">
          <Search size={18} /> Filter:
        </div>
        <select 
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="h-10 bg-gray-50 border-none rounded-xl px-4 font-bold text-gray-700 focus:ring-2 focus:ring-[#8B0000]/20 outline-none"
        >
          <option value="all">Semua Bulan</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <select 
          value={yearFilter}
          onChange={(e) => setYearFilter(parseInt(e.target.value))}
          className="h-10 bg-gray-50 border-none rounded-xl px-4 font-bold text-gray-700 focus:ring-2 focus:ring-[#8B0000]/20 outline-none"
        >
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
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
            {data.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400 italic">Tidak ada data untuk filter ini.</td></tr>
            ) : data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5 pl-10 font-bold text-gray-900">{item.user?.name}</td>
                <td className="px-6 py-5 text-xs text-gray-500">{item.month} {item.year}</td>
                <td className="px-6 py-5 text-sm font-black text-[#8B0000]">Rp {parseInt(item.net_salary).toLocaleString('id-ID')}</td>
                <td className="px-6 py-5 text-center">
                  <div className="flex justify-center gap-1">
                    <button 
                      onClick={() => handlePreviewSlip(item)}
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Lihat Slip"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleDownloadPDF(item.id, item.user?.name)}
                      className="p-2.5 text-gray-400 hover:text-[#8B0000] hover:bg-red-50 rounded-xl transition-all"
                      title="Download PDF"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ SLIP PREVIEW MODAL ═══ */}
      {previewOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[900px] max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white flex-shrink-0">
              <div>
                <h3 className="text-lg font-black text-gray-900">Slip Gaji</h3>
                <p className="text-sm text-gray-400 font-medium">
                  {previewSalary?.user?.name} — {previewSalary?.month} {previewSalary?.year}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  disabled={previewLoading}
                  className="flex items-center gap-2 px-5 h-10 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm border border-blue-100 hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <Printer size={15} />
                  Print
                </button>
                <button
                  onClick={() => handleDownloadPDF(previewSalary?.id, previewSalary?.user?.name)}
                  disabled={previewLoading}
                  className="flex items-center gap-2 px-5 h-10 bg-[#8B0000] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#6d0000] transition-colors disabled:opacity-50"
                >
                  <Download size={15} />
                  Download PDF
                </button>
                <button
                  onClick={() => { setPreviewOpen(false); setPreviewHtml(""); setPreviewSalary(null); }}
                  className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors ml-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body — scrollable content area */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin text-[#8B0000]" size={40} />
                  <p className="text-gray-400 font-medium">Memuat slip gaji...</p>
                </div>
              ) : (
                <div 
                  className="bg-white rounded-xl shadow-lg mx-auto border border-gray-200"
                  style={{ maxWidth: '750px' }}
                >
                  <iframe
                    srcDoc={previewHtml}
                    title="Payslip Preview"
                    className="w-full border-0 rounded-xl"
                    style={{ height: '1000px', minHeight: '600px' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
