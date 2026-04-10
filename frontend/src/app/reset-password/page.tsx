"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import "../login/login.css";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation
      });
      setSuccess(response.data.message || "Password berhasil direset!");
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mereset password. Token mungkin sudah kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-500 font-bold">Link Tidak Valid</p>
        <p className="text-sm text-gray-500">Tautan reset password ini tidak valid atau telah dimodifikasi.</p>
        <button onClick={() => router.push('/login')} className="login-submit-btn mt-4">Ke Halaman Login</button>
      </div>
    );
  }

  return (
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
          <span>{success} Sedang mengalihkan...</span>
        </div>
      )}

      <div className="login-field">
        <label className="login-label">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="login-input opacity-60 cursor-not-allowed"
        />
      </div>

      <div className="login-field">
        <label className="login-label">Password Baru</label>
        <div className="login-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input login-input-password"
          />
          <button
            type="button"
            className="login-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="login-field">
        <label className="login-label">Konfirmasi Password Baru</label>
        <div className="login-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Ketik ulang password baru"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            className="login-input login-input-password"
          />
        </div>
      </div>

      <button
        type="submit"
        className="login-submit-btn mt-4"
        disabled={loading || success !== ""}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="login-spinner" />
            <span>Memproses...</span>
          </>
        ) : (
          <span>Reset Password</span>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '500px' }}>
        <div className="login-right-panel" style={{ width: '100%' }}>
          <div className="login-form-container">
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
                <h1 className="login-title" style={{ fontSize: '1.5rem' }}>Buat Password Baru</h1>
                <p className="login-subtitle">Amankan akun Anda dengan password baru</p>
              </div>
            </div>

            <Suspense fallback={<div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-[#8B0000]" /></div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
