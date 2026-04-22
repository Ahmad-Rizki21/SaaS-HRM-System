"use client";

import { useEffect, useState, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { Camera, MapPin, ScanFace, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LiveAttendancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [streamActive, setStreamActive] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState("Menyiapkan Sistem...");
  const [loading, setLoading] = useState(false);
  const [officeConfig, setOfficeConfig] = useState<{lat: number, lng: number, radius: number, name: string} | null>(null);

  useEffect(() => {
    // 1. Ambil Pengaturan Lokasi Absen (HQ + Branches)
    axiosInstance.get('/company').then(res => {
      const company = res.data?.data;
      
      // Jika user sudah punya kantor assigned, pakai itu dulu
      if (user?.office) {
        setOfficeConfig({
          lat: parseFloat(user.office.latitude),
          lng: parseFloat(user.office.longitude),
          radius: Number(user.office.radius_meters) || 50,
          name: user.office.name
        });
      } else if (company) {
        // Jika tidak, kita simpan list kantor untuk pencarian "terdekat" nanti saat lokasi didapat
        // Tapi untuk default, pakai HQ
        setOfficeConfig({
          lat: parseFloat(company.latitude),
          lng: parseFloat(company.longitude),
          radius: Number(company.radius_meters) || 50,
          name: "Kantor Pusat (HQ)"
        });
      }
    }).catch(err => {
      console.error("Failed to load company config", err);
    });

    // 2. Initialize Webcam
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setStreamActive(true);
            setStatusMsg("Kamera aktif. Silakan posisikan wajah Anda.");
          }
        })
        .catch((err) => {
          setStatusMsg("Akses kamera ditolak atau tidak ditemukan.");
          console.error("Camera error:", err);
        });
    }

    // 3. Get Geolocation & Match Nearest Office
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          
          let targetOffice = officeConfig;

          // Jika user TIDAK punya assigned office, kita cari yang terdekat dari list company.offices
          if (!user?.office) {
            try {
              const res = await axiosInstance.get('/company');
              const company = res.data?.data;
              if (company?.offices?.length > 0) {
                let minDistance = Infinity;
                let nearest = null;

                // Cek HQ dulu
                const hqDist = getDistanceFromLatLonInM(lat, lng, parseFloat(company.latitude), parseFloat(company.longitude));
                minDistance = hqDist;
                nearest = { 
                  lat: parseFloat(company.latitude), 
                  lng: parseFloat(company.longitude), 
                  radius: Number(company.radius_meters) || 50, 
                  name: "Kantor Pusat (HQ)" 
                };

                // Cek semua cabang
                company.offices.forEach((office: any) => {
                  if (office.is_active) {
                    const d = getDistanceFromLatLonInM(lat, lng, parseFloat(office.latitude), parseFloat(office.longitude));
                    if (d < minDistance) {
                      minDistance = d;
                      nearest = { 
                        lat: parseFloat(office.latitude), 
                        lng: parseFloat(office.longitude), 
                        radius: Number(office.radius_meters) || 50, 
                        name: office.name 
                      };
                    }
                  }
                });

                if (nearest) {
                  setOfficeConfig(nearest);
                  targetOffice = nearest;
                }
              }
            } catch (e) {
              console.error("Error finding nearest office", e);
            }
          }

          if (targetOffice) {
            const dist = getDistanceFromLatLonInM(lat, lng, targetOffice.lat, targetOffice.lng);
            setDistance(Math.round(dist));
          }
        },
        (err) => {
          setStatusMsg("Akses lokasi ditolak. Aktifkan GPS Anda.");
          console.error("Geo error:", err);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setStatusMsg("Browser tidak support Geolocation.");
    }
  }, [user?.office]);

  const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; 
    return d * 1000; // Return in meters
  };

  const handleAttendance = async (type: 'check-in' | 'check-out') => {
    if (!location) {
      alert("Menunggu titik koordinat lokasi GPS...");
      return;
    }

    if (!videoRef.current || !canvasRef.current) {
      alert("Kamera tidak siap!");
      return;
    }
    
    setLoading(true);
    setStatusMsg("Menganalisis Wajah (Face Recognition)...");

    // Capture Frame After a short delay for dramatic effect/scanning
    setTimeout(async () => {
      try {
        const video = videoRef.current!;
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d');

        // Set dimensions match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current frame to canvas
        if (context) {
          // Mirror image handling
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        const selfieBase64 = canvas.toDataURL('image/png');

        const payload = {
          latitude: location.lat,
          longitude: location.lng,
          image: selfieBase64
        };

        const res = await axiosInstance.post(`/attendance/${type}`, payload);
        
        setStatusMsg(`Berhasil ${type === 'check-in' ? 'Absen Masuk' : 'Absen Keluar'}!`);
        alert(`Sukses: ${res.data.message}`);
        router.push('/dashboard');
        
      } catch (error: any) {
        setStatusMsg("Gagal melakukan absensi.");
        alert(error.response?.data?.message || "Terjadi kesalahan sistem.");
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="w-full pb-8 px-4 md:px-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push('/dashboard')} className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 flex-shrink-0">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Live Attendance & Face Recognition</h1>
          <p className="text-gray-500 font-medium">Validasi lokasi GPS & Wajah Anda pada mesin virtual ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Kiri: Video & Face Scanner Overlay */}
        <div className="bg-black/95 rounded-3xl overflow-hidden shadow-2xl relative border-4 border-gray-900 group aspect-[4/3] flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scanner Overlay UI */}
          {streamActive && (
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
              {/* Corner Box Brackets */}
              <div className="w-48 h-64 border-2 border-transparent relative">
                 <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#8B0000] rounded-tl-xl transition-all duration-1000 group-hover:scale-110"></div>
                 <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#8B0000] rounded-tr-xl transition-all duration-1000 group-hover:scale-110"></div>
                 <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#8B0000] rounded-bl-xl transition-all duration-1000 group-hover:scale-110"></div>
                 <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#8B0000] rounded-br-xl transition-all duration-1000 group-hover:scale-110"></div>
                 {/* Scanner bar animation */}
                 {loading && <div className="absolute top-0 left-0 w-full h-1 bg-[#8B0000] shadow-[0_0_15px_#8B0000] animate-scan"></div>}
              </div>
              
              {loading && (
                <div className="mt-4 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full absolute bottom-8">
                  <ScanFace className="text-[#8B0000] animate-pulse" size={20} />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">{statusMsg}</span>
                </div>
              )}
            </div>
          )}
          
          {!streamActive && (
            <div className="text-white flex flex-col items-center z-20">
              <Camera size={48} className="mb-4 text-gray-500 animate-pulse" />
              <p className="text-gray-400 font-medium">Memuat Kamera...</p>
            </div>
          )}
        </div>

        {/* Kanan: Data Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6">
            
            {/* User Info */}
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl bg-[#fef2f2] text-[#8B0000] flex items-center justify-center text-xl font-bold border border-[#fee2e2]">
                 {user?.name?.charAt(0) || "U"}
               </div>
               <div>
                 <h2 className="font-bold text-gray-900 text-lg">{user?.name || "Karyawan"}</h2>
                 <p className="text-sm font-medium text-gray-500">{user?.role?.name || "Staff"}</p>
               </div>
            </div>

            <hr className="border-gray-100" />

            {/* GPS Radius Setting */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Verifikasi Lokasi (GPS)</h3>
              
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-start gap-4">
                <div className="mt-1">
                  {distance !== null && officeConfig ? (
                    distance <= officeConfig.radius ? (
                      <CheckCircle className="text-[#107c41]" size={24} />
                    ) : (
                      <AlertCircle className="text-[#8B0000]" size={24} />
                    )
                  ) : (
                    <MapPin className="text-gray-400 animate-bounce" size={24} />
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-gray-900 text-sm">Status Radius Kantor</p>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded border border-gray-200">Maks: {officeConfig?.radius || '-'}m</span>
                  </div>
                  
                  {distance !== null && officeConfig ? (
                    <>
                      <p className={`text-sm font-bold ${distance <= officeConfig.radius ? 'text-[#107c41]' : 'text-[#8B0000]'}`}>
                        Jarak Anda: {distance} meter
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-bold flex items-center gap-1 uppercase tracking-tighter">
                        Terdeteksi Area: <span className="text-gray-600">{officeConfig.name}</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Menghitung jarak koordinat...</p>
                  )}
                  
                  {location && (
                    <p className="text-[10px] text-gray-400 font-medium mt-2 uppercase tracking-wide">
                      Lat: {location.lat.toFixed(5)} | Lng: {location.lng.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
              
              {distance !== null && officeConfig && distance > officeConfig.radius && (
                 <p className="text-xs text-[#8B0000] font-medium mt-3 bg-[#fef2f2] p-2 rounded-lg border border-[#fee2e2]">
                   <strong>Peringatan:</strong> Anda terdeteksi berada {distance - officeConfig.radius} meter di luar area Radius Kantor! Anda masih dapat absensi untuk bypass pengujian ini selama development.
                 </p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
               <button 
                 onClick={() => handleAttendance('check-in')}
                 disabled={loading || !streamActive || !location}
                 className="bg-[#107c41] hover:bg-[#0c6130] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2 group"
               >
                 <ScanFace size={24} className="group-hover:scale-110 transition-transform" />
                 <span>CLOCK IN</span>
               </button>
               
               <button 
                 onClick={() => handleAttendance('check-out')}
                 disabled={loading || !streamActive || !location}
                 className="bg-[#8B0000] hover:bg-[#660000] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2 group"
               >
                 <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                 <span>CLOCK OUT</span>
               </button>
            </div>
            
          </div>
        </div>
        
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
