"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Download, CreditCard, Receipt, Eye, X, Printer, Loader2 } from "lucide-react";
import { PayrollCardSkeleton } from "@/components/Skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Riwayat Gaji Saya</h1>
          <p className="dash-page-desc flex items-center gap-1.5">
            <CreditCard size={14} className="text-[#8B0000]" />
            Akses slip gaji digital Anda dengan aman.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-container">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <p className="text-xs text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-gray-900">{salaries.length}</span> slip gaji Anda
          </p>
        </div>
        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th className="pl-6">Periode</th>
                <th>Nominal Netto</th>
                <th className="text-center">Status</th>
                <th className="text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
                        <Receipt size={24} />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Belum Ada Slip Gaji</h3>
                      <p className="text-sm text-gray-500">Belum ada riwayat slip gaji untuk Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => (
                  <tr key={salary.id} className="group">
                    {/* Periode */}
                    <td className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 text-[#8B0000] flex items-center justify-center text-sm font-bold shrink-0">
                          <Receipt size={14} />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">{salary.month} {salary.year}</span>
                          <p className="text-[10px] text-gray-400">E-SLIP #{salary.id.toString().padStart(6, '0')}</p>
                        </div>
                      </div>
                    </td>

                    {/* Nominal Netto */}
                    <td>
                      <span className="font-semibold text-gray-900">
                        Rp {parseInt(salary.net_salary).toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="text-center">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                        PAID
                      </Badge>
                    </td>

                    {/* Aksi */}
                    <td className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewSlip(salary)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 h-8 px-3 text-xs font-bold"
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(salary.id, salary.month, salary.year)}
                          className="text-[#8B0000] border-red-200 hover:bg-red-50 hover:text-[#8B0000] h-8 w-8 p-0 flex items-center justify-center"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
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
