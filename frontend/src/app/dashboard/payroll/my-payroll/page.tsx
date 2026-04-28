"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Download, CreditCard, Receipt, Eye, X, Printer, Loader2 } from "lucide-react";
import { PayrollCardSkeleton } from "@/components/Skeleton";

export default function MyPayrollPage() {
  const [loading, setLoading] = useState(true);
  const [salaries, setSalaries] = useState<any[]>([]);

  // Slip preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSalary, setPreviewSalary] = useState<any>(null);

  useEffect(() => {
    fetchMyPayroll();
  }, []);

  const fetchMyPayroll = async () => {
    try {
      const res = await axiosInstance.get('/payroll/my-history');
      setSalaries(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (id: number, month: string, year: number) => {
    try {
      const response = await axiosInstance.get(`/payroll/download-slip/${id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Slip_Gaji_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Gagal mengunduh slip gaji");
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

  if (loading) return <PayrollCardSkeleton />;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 md:pb-20 p-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-gray-900 leading-tight">Riwayat <span className="text-[#8B0000]">Gaji Saya</span></h1>
        <p className="text-gray-500 text-sm font-bold flex items-center gap-2">
           <CreditCard size={14} className="text-[#8B0000]" />
           Akses slip gaji digital Anda dengan aman.
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Periode</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Nominal Netto</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salaries.map((salary) => (
                <tr key={salary.id} className="group hover:bg-red-50/10 transition-all">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 text-[#8B0000] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Receipt size={18} />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-base">{salary.month} {salary.year}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">E-SLIP #{salary.id.toString().padStart(6, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-lg font-black text-[#8B0000] tracking-tight">
                      Rp {parseInt(salary.net_salary).toLocaleString('id-ID')}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                        Paid
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handlePreviewSlip(salary)}
                        className="h-10 px-4 bg-blue-50 text-blue-600 rounded-xl flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all font-bold text-xs border border-blue-100"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(salary.id, salary.month, salary.year)}
                        className="w-10 h-10 bg-gray-50 text-[#8B0000] rounded-xl flex items-center justify-center hover:bg-[#8B0000] hover:text-white transition-all border border-red-100"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {salaries.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-20 bg-white italic">
                    <div className="flex flex-col items-center gap-3">
                      <Receipt size={40} className="text-gray-100" />
                      <p className="text-gray-400 font-bold">Belum ada riwayat slip gaji untuk Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                  {previewSalary?.month} {previewSalary?.year}
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
                  onClick={() => handleDownloadPDF(previewSalary?.id, previewSalary?.month, previewSalary?.year)}
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

            {/* Modal Body */}
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
