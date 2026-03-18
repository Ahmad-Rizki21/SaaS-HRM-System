"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Save, Building2, MapPin, Mail, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CompanySettingsPage() {
  const { hasPermission } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompany();
  }, []);

  const canEdit = hasPermission('manage-company');

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/company");
      setCompany(response.data.data || {});
    } catch (e) {
      console.error("Gagal mendapatkan informasi perusahaan", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-loading"><div className="dash-spinner" /></div>
    );
  }

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Profil Perusahaan</h1>
          <p className="dash-page-desc">Konfigurasi pengaturan utama dari perusahaan Anda.</p>
        </div>
        <div className="dash-page-actions">
          {canEdit && (
            <button className="dash-btn dash-btn-primary">
              <Save size={15} />
              Simpan Perubahan
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Detail Perusahaan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="dash-table-container p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5 border-b border-[#ebedf0] pb-3">
              Informasi Umum
            </h2>
            <form className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Nama Perusahaan</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    disabled={!canEdit}
                    defaultValue={company?.name || "Narwasthu Group"}
                    className={`w-full h-10 pl-9 pr-4 text-sm ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors`}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Email Utama Perusahaan</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    disabled={!canEdit}
                    defaultValue={company?.email || "admin@narwasthu.com"}
                    className={`w-full h-10 pl-9 pr-4 text-sm ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors`}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="tel"
                    disabled={!canEdit}
                    defaultValue={company?.phone || "+62 "}
                    className={`w-full h-10 pl-9 pr-4 text-sm ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors`}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Alamat Kantor</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                  <textarea
                    rows={4}
                    disabled={!canEdit}
                    defaultValue={company?.address || ""}
                    className={`w-full pt-2.5 pb-2 pl-9 pr-4 text-sm ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors resize-none`}
                  ></textarea>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Logo / Metadata */}
        <div className="space-y-4">
          <div className="dash-table-container p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5 border-b border-[#ebedf0] pb-3">
              Logo Perusahaan
            </h2>
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <img src="/logo.png" alt="Company Logo" className="h-16 w-auto mb-4" />
              {canEdit && (
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-white border border-gray-200 px-4 py-1.5 rounded-md shadow-sm transition-colors">
                  Ganti Logo
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Format yang didukung: JPG, PNG. Ukuran max. 2MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
