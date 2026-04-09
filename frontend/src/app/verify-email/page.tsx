"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Image from "next/image";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Sedang memverifikasi akun Anda...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Tautan verifikasi tidak valid atau sudah kadaluarsa.");
      return;
    }

    const verify = async () => {
      try {
        await axiosInstance.get(`/verify-email/${token}`);
        setStatus("success");
        setMessage("Akun Anda berhasil diverifikasi! Silakan login menggunakan email dan password sementara Anda.");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3500);
      } catch (error: any) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Gagal memverifikasi akun. Silakan hubungi admin.");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-gray-200 border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo Section */}
        <div className="mb-10">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={180} 
            height={60} 
            className="object-contain"
          />
        </div>

        {/* Dynamic Icon Section */}
        <div className="mb-8">
          {status === "loading" && (
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 animate-spin-slow">
              <Loader2 size={40} className="animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-100">
              <CheckCircle2 size={40} />
            </div>
          )}
          {status === "error" && (
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
              <XCircle size={40} />
            </div>
          )}
        </div>

        {/* Content Section */}
        <h1 className={`text-2xl font-black mb-4 tracking-tight ${
          status === "success" ? "text-emerald-900" : status === "error" ? "text-rose-900" : "text-gray-900"
        }`}>
          {status === "success" ? "Verifikasi Berhasil!" : status === "error" ? "Verifikasi Gagal" : "Memproses..."}
        </h1>
        
        <p className="text-gray-500 font-medium leading-relaxed mb-10">
          {message}
        </p>

        {status !== "loading" && (
          <button 
            onClick={() => router.push("/login")}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
              status === "success" 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200" 
                : "bg-gray-900 hover:bg-black text-white shadow-gray-300"
            }`}
          >
            Lanjut ke Login
          </button>
        )}

        {status === "success" && (
          <p className="mt-6 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            Otomatis mengalihkan dalam beberapa detik...
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
