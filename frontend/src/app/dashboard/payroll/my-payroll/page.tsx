"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Download, CreditCard, Loader2, Receipt, CheckCircle2 } from "lucide-react";

export default function MyPayrollPage() {
  const [loading, setLoading] = useState(true);
  const [salaries, setSalaries] = useState<any[]>([]);

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-[#8B0000]" size={32} />
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 md:pb-20 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-gray-900 leading-tight">Riwayat <span className="text-[#8B0000]">Gaji Saya</span></h1>
        <p className="text-gray-500 text-sm font-bold flex items-center gap-2">
           <CreditCard size={14} className="text-[#8B0000]" />
           Akses slip gaji digital Anda dengan aman.
        </p>
      </div>

      <div className="grid gap-4">
        {salaries.map((salary) => (
          <div key={salary.id} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all border-l-8 border-l-[#8B0000]">
            <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-50 text-[#8B0000] rounded-2xl flex items-center justify-center">
                     <Receipt size={28} />
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-gray-900 italic">{salary.month} {salary.year}</h4>
                     <p className="text-2xl font-black text-[#8B0000] tracking-tight">Rp {parseInt(salary.net_salary).toLocaleString('id-ID')}</p>
                  </div>
               </div>
               <button 
                onClick={() => handleDownloadPDF(salary.id, salary.month, salary.year)}
                className="w-14 h-14 bg-gray-50 text-[#8B0000] rounded-2xl flex items-center justify-center hover:bg-[#8B0000] hover:text-white transition-all shadow-sm border border-red-100"
               >
                 <Download size={24} />
               </button>
            </div>
          </div>
        ))}
        {salaries.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 italic">
             <p className="text-gray-400 font-bold">Belum ada riwayat slip gaji untuk Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
