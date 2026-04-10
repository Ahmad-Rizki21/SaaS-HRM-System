"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { 
  Save, ShieldCheck, Percent, Calendar, 
  Info, Loader2, AlertTriangle, CheckCircle2,
  Settings as SettingIcon, Coins, Landmark,
  Wallet, TrendingUp, HelpCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PayrollSettingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    cutoff_day: 25,
    bpjs_kesehatan_coy_pct: 4,
    bpjs_kesehatan_emp_pct: 1,
    bpjs_jht_coy_pct: 3.7,
    bpjs_jht_emp_pct: 2,
    bpjs_jp_coy_pct: 2,
    bpjs_jp_emp_pct: 1,
    bpjs_jkm_pct: 0.3,
    bpjs_jkk_pct: 0.24,
    tax_method: 'TER (PP 58/2023)'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axiosInstance.get('/payroll/settings');
      if (res.data.data) {
        setSettings(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.post('/payroll/settings', settings);
      alert("Settings updated successfully!");
    } catch (e) {
      alert("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Loader2 className="animate-spin text-[#8B0000]" size={48} />
    </div>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-4 py-1.5 bg-[#8B0000]/10 text-[#8B0000] text-[10px] font-black uppercase tracking-widest rounded-full">Finance Module</span>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">System v2.4</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Configuration <span className="text-[#8B0000]">Payroll</span></h1>
          <p className="text-gray-500 font-medium max-w-lg">Kelola kebijakan pengupahan, potongan BPJS, dan sistem perpajakan TER terbaru dengan presisi tinggi.</p>
        </div>
        
        <div className="relative z-10 flex gap-3">
          <button 
                type="submit"
                form="settings-form"
                disabled={saving}
                className="px-10 h-16 bg-[#8B0000] text-white rounded-3xl font-black flex items-center gap-4 hover:bg-[#7b0000] transition-all shadow-2xl shadow-red-200 active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Simpan Konfigurasi
          </button>
        </div>

        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B0000]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      </div>

      <form id="settings-form" onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Policy & General */}
        <div className="xl:col-span-5 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-8 relative overflow-hidden">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
                  <SettingIcon size={28} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-gray-900">Kebijakan Umum</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Global Pay Policy</p>
               </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  Tanggal Cut-off Operasional
                  <HelpCircle size={12} className="text-blue-300 group-hover:text-blue-500 transition-colors" />
                </label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#8B0000] transition-colors" size={20} />
                  <input 
                    type="number"
                    min="1" max="31"
                    className="w-full h-16 bg-gray-50 border-2 border-transparent rounded-[1.25rem] pl-14 pr-6 font-black text-lg text-gray-700 focus:bg-white focus:border-[#8B0000]/10 focus:ring-4 focus:ring-[#8B0000]/5 transition-all outline-none"
                    value={settings.cutoff_day}
                    onChange={(e) => setSettings({...settings, cutoff_day: e.target.value})}
                  />
                </div>
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                   <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                      Sistem akan menghitung data kehadiran dan lembur hingga tanggal {settings.cutoff_day} setiap bulannya. Data setelah tanggal ini akan masuk ke penggajian bulan berikutnya.
                   </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Metode Pajak Penghasilan</label>
                <div className="relative group">
                  <Landmark className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#8B0000] transition-colors" size={20} />
                  <select 
                    className="w-full h-16 bg-gray-50 border-2 border-transparent rounded-[1.25rem] pl-14 pr-6 font-black text-gray-700 focus:bg-white focus:border-[#8B0000]/10 focus:ring-4 focus:ring-[#8B0000]/5 transition-all outline-none appearance-none"
                    value={settings.tax_method}
                    onChange={(e) => setSettings({...settings, tax_method: e.target.value})}
                  >
                    <option value="TER (PP 58/2023)">Tarif Efektif Rata-rata (PP 58/2023)</option>
                    <option value="PPh 21 Pasal 17">Manual Pasal 17 (Legacy)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#8B0000] to-[#5a0000] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-red-200 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />
             <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                     <TrendingUp size={32} />
                  </div>
                  <h3 className="text-2xl font-black leading-tight italic">Optimasi Cashflow & Efisiensi Pajak</h3>
                  <p className="text-white/70 text-sm font-medium leading-relaxed">
                    Sistem "On Time HRMS" memastikan setiap rupiah yang dikeluarkan perusahaan terhitung secara regulatif.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[#8B0000] bg-gray-200 shadow-lg shrink-0" />
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-[#8B0000] bg-white/20 flex items-center justify-center text-[10px] font-black backdrop-blur-md">+12</div>
                   </div>
                   <span className="text-xs font-bold text-white/50">Trusted by Finance Teams</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: BPJS Matrix */}
        <div className="xl:col-span-7 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm space-y-10 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-50 pb-8">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Health & Pension Matrix</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Global BPJS Config</p>
                  </div>
               </div>
               <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-black text-gray-300 uppercase italic">Safe Protocol</span>
                  <div className="flex gap-1 mt-1">
                     {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />)}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               
               {/* Health Matrix */}
               <div className="space-y-6">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                        <Coins size={16} />
                     </div>
                     <span className="text-[11px] font-black text-gray-900 uppercase italic">BPJS Kesehatan</span>
                  </div>
                  <div className="grid gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pikulan Coy (%)</label>
                        <input 
                           type="number" step="0.1"
                           className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 font-black text-gray-700 focus:bg-white focus:border-blue-500/10 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                           value={settings.bpjs_kesehatan_coy_pct}
                           onChange={(e) => setSettings({...settings, bpjs_kesehatan_coy_pct: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Potong Emp (%)</label>
                        <input 
                           type="number" step="0.1"
                           className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 font-black text-gray-700 focus:bg-white focus:border-[#8B0000]/10 focus:ring-4 focus:ring-[#8B0000]/5 transition-all outline-none"
                           value={settings.bpjs_kesehatan_emp_pct}
                           onChange={(e) => setSettings({...settings, bpjs_kesehatan_emp_pct: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

               {/* Pension Matrix (JHT) */}
               <div className="space-y-6">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                        <Landmark size={16} />
                     </div>
                     <span className="text-[11px] font-black text-gray-900 uppercase italic">BPJS Ketenagakerjaan (JHT)</span>
                  </div>
                  <div className="grid gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pikulan Coy (%)</label>
                        <input 
                           type="number" step="0.1"
                           className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 font-black text-gray-700 focus:bg-white focus:border-orange-500/10 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none"
                           value={settings.bpjs_jht_coy_pct}
                           onChange={(e) => setSettings({...settings, bpjs_jht_coy_pct: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Potong Emp (%)</label>
                        <input 
                           type="number" step="0.1"
                           className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 font-black text-gray-700 focus:bg-white focus:border-[#8B0000]/10 focus:ring-4 focus:ring-[#8B0000]/5 transition-all outline-none"
                           value={settings.bpjs_jht_emp_pct}
                           onChange={(e) => setSettings({...settings, bpjs_jht_emp_pct: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

               {/* JP Matrix */}
               <div className="space-y-6">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center">
                        <Wallet size={16} />
                     </div>
                     <span className="text-[11px] font-black text-gray-900 uppercase italic">Jaminan Pensiun (JP)</span>
                  </div>
                  <div className="grid gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pikulan Coy (%)</label>
                        <input 
                           type="number" step="0.1"
                           className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 font-black text-gray-700 focus:bg-white focus:border-purple-500/10 focus:ring-4 focus:ring-purple-500/5 transition-all outline-none"
                           value={settings.bpjs_jp_coy_pct}
                           onChange={(e) => setSettings({...settings, bpjs_jp_coy_pct: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Potong Emp (%)</label>
                        <input 
                           type="number" step="0.1"
                           className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 font-black text-gray-700 focus:bg-white focus:border-[#8B0000]/10 focus:ring-4 focus:ring-[#8B0000]/5 transition-all outline-none"
                           value={settings.bpjs_jp_emp_pct}
                           onChange={(e) => setSettings({...settings, bpjs_jp_emp_pct: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

               {/* JKM JKK Matrix */}
               <div className="space-y-6">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={16} />
                     </div>
                     <span className="text-[11px] font-black text-gray-900 uppercase italic">KM & KK (Company Only)</span>
                  </div>
                  <div className="grid gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">JKM (%)</label>
                        <input 
                           type="number" step="0.01"
                           className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 font-black text-gray-700 focus:bg-white focus:border-red-500/10 focus:ring-4 focus:ring-red-500/5 transition-all outline-none"
                           value={settings.bpjs_jkm_pct}
                           onChange={(e) => setSettings({...settings, bpjs_jkm_pct: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">JKK (%)</label>
                        <input 
                           type="number" step="0.01"
                           className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 font-black text-gray-700 focus:bg-white focus:border-red-500/10 focus:ring-4 focus:ring-red-500/5 transition-all outline-none"
                           value={settings.bpjs_jkk_pct}
                           onChange={(e) => setSettings({...settings, bpjs_jkk_pct: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
