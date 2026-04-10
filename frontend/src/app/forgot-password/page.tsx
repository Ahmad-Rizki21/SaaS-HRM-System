"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import "../login/login.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.post("/forgot-password", { email });
      setSuccess(response.data.message || "Tautan reset password telah dikirim ke email Anda.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan. Pastikan email terdaftar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '500px' }}>
        <div className="login-right-panel" style={{ width: '100%' }}>
          <div className="login-form-container">
            <button onClick={() => router.push('/login')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6 font-semibold">
              <ArrowLeft size={16} />
              Kembali ke Login
            </button>

            <div className="login-header">
              <div className="login-logo-wrapper outline-none">
                <Image
                  src="/logo.png"
                  alt="On Time HRMS Logo"
                  width={60}
                  height={45}
                  className="login-logo"
                  priority
                />
              </div>
              <div className="login-brand pt-2">
                <h1 className="login-title" style={{ fontSize: '1.5rem' }}>Lupa Password?</h1>
                <p className="login-subtitle">Masukkan email Anda untuk reset</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
              {error && (
                <div className="login-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="login-error !bg-green-50 !text-green-700 !border-green-200">
                  <span>✅</span>
                  <span>{success}</span>
                </div>
              )}

              <div className="login-field">
                <label htmlFor="email" className="login-label">Email Terdaftar</label>
                <input
                  id="email"
                  type="email"
                  placeholder="contoh@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-input"
                  suppressHydrationWarning
                />
              </div>

              <button
                type="submit"
                className="login-submit-btn mt-4"
                disabled={loading || success !== ""}
                suppressHydrationWarning
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="login-spinner" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <span>Kirim Link Reset</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
