"use client";

import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 bg-orange-100 blur-3xl opacity-50 rounded-full" />
          <div className="relative bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center justify-center w-32 h-32 mx-auto animate-in zoom-in duration-500">
            <SearchX size={64} className="text-orange-500" />
          </div>
        </div>

        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter">404</h1>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Halaman Tidak Ditemukan</h2>
          <p className="text-gray-500 font-medium max-w-md mx-auto">
            Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan. Silakan periksa kembali URL atau kembali ke halaman utama.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm w-full sm:w-auto justify-center"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 w-full sm:w-auto justify-center"
          >
            <Home size={18} />
            Beranda Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
