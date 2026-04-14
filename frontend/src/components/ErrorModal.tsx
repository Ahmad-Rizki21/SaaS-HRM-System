import React from "react";
import { AlertCircle, X, CheckCircle2 } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  title?: string;
  type?: "error" | "success";
}

export function ErrorModal({ isOpen, message, onClose, title, type = "error" }: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'success' ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'}`}>
            {type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          </div>
          
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            {title || (type === 'success' ? "Berhasil!" : "Terjadi Kesalahan")}
          </h3>
          
          <div className="text-sm font-medium text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 text-left whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
            {message}
          </div>
          
          <div className="pt-4">
            <button
              onClick={onClose}
              className={`w-full font-bold py-3 px-4 rounded-xl transition-all shadow-md focus:outline-none focus:ring-4 ${
                type === 'success' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-200 shadow-emerald-500/20' 
                  : 'bg-gray-900 hover:bg-gray-800 text-white focus:ring-gray-200'
              }`}
            >
              Mengerti, Tutup
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
