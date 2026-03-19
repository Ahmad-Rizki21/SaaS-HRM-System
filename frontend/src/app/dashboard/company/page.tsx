"use client";

import { useEffect, useState, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { Save, Building2, MapPin, Mail, Phone, Loader2, Camera, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CompanySkeleton } from "@/components/Skeleton";

export default function CompanySettingsPage() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  const canEdit = hasPermission('manage-company');

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/company");
      const data = response.data.data || {};
      setCompany(data);
      if (data.logo) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://127.0.0.1:8000';
        setPhotoPreview(`${baseUrl}/storage/${data.logo}`);
      }
    } catch (e) {
      console.error("Gagal mendapatkan informasi perusahaan", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("name", company.name);
      formData.append("email", company.email);
      formData.append("phone", company.phone || "");
      formData.append("address", company.address || "");
      formData.append("latitude", company.latitude || "");
      formData.append("longitude", company.longitude || "");
      formData.append("radius_meters", String(company.radius_meters || "50"));
      
      if (photoFile) {
        formData.append("logo", photoFile);
      }

      await axiosInstance.post("/company/update", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      alert(t('success_save'));
      fetchCompany();
    } catch (e) {
      console.error(e);
      alert(t('failed_to_fetch'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <CompanySkeleton />;
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
            <button 
              className="dash-btn dash-btn-primary" 
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {isSubmitting ? t('submitting') : t('save')}
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
                    value={company?.name || ""}
                    onChange={(e) => setCompany({...company, name: e.target.value})}
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
                    value={company?.email || ""}
                    onChange={(e) => setCompany({...company, email: e.target.value})}
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
                    value={company?.phone || ""}
                    onChange={(e) => setCompany({...company, phone: e.target.value})}
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
                    value={company?.address || ""}
                    onChange={(e) => setCompany({...company, address: e.target.value})}
                    className={`w-full pt-2.5 pb-2 pl-9 pr-4 text-sm ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors resize-none`}
                  ></textarea>
                </div>
              </div>
            </form>
          </div>

          {/* Pengaturan Radius & GPS Lokasi Kantor */}
          <div className="dash-table-container p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5 border-b border-[#ebedf0] pb-3">
              Lokasi & Radius Presensi (GPS)
            </h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">Latitude Pusat</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={company?.latitude || ""}
                      placeholder="-6.200000"
                      onChange={(e) => setCompany({...company, latitude: e.target.value})}
                      className={`w-full h-10 pl-9 pr-4 text-sm ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">Longitude Pusat</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={company?.longitude || ""}
                      placeholder="106.816666"
                      onChange={(e) => setCompany({...company, longitude: e.target.value})}
                      className={`w-full h-10 pl-9 pr-4 text-sm ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 mt-4">
                <label className="text-sm font-medium text-gray-700">Jarak Radius Maksimal (Meter)</label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" size={16} />
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={company?.radius_meters || "50"}
                    min="1"
                    onChange={(e) => setCompany({...company, radius_meters: e.target.value})}
                    className={`w-full h-10 pl-9 pr-4 text-sm ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors font-bold text-gray-900 border-l-4 border-l-red-500`}
                  />
                </div>
                <p className="text-xs text-gray-500 font-medium">Batas jangkauan kelonggaran absensi dari titik area. Disarankan minimal 50 meter untuk offset GPS ponsel karyawan.</p>
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
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 relative group">
              {photoPreview ? (
                <img src={photoPreview} alt="Company Logo" className="h-24 w-auto object-contain mb-4 rounded-lg" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4 border border-gray-200">
                   <Building2 className="text-gray-300" size={40} />
                </div>
              )}
              
              {canEdit && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-white border border-gray-200 px-4 py-1.5 rounded-md shadow-sm transition-colors"
                  >
                    <Camera size={14} />
                    {photoPreview ? "Ganti Logo" : "Upload Logo"}
                  </button>
                </>
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
