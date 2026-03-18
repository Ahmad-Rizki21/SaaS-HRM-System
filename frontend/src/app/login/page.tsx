"use client";

import "./login.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

import axiosInstance from "@/lib/axios";
import Cookies from "js-cookie";
import axios from "axios";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/login", { email, password });
      if (response.data.data && response.data.data.access_token) {
        Cookies.set("token", response.data.data.access_token, { expires: 7 });
        router.push("/dashboard");
      } else {
        setError("Gagal mendapatkan token auth.");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Kredensial tidak valid atau terjadi kesalahan server."
        );
      } else {
        setError("Terjadi kesalahan yang tidak terduga.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Panel - Illustration */}
      <div className="login-left-panel">
        <div className="login-left-content">
          <div className="login-illustration-wrapper">
            <Image
              src="/hr-illustration.jpg"
              alt="HR Management Illustration"
              width={480}
              height={350}
              className="login-illustration"
              priority
            />
          </div>
          <div className="login-left-text">
            <h2>Kelola SDM Lebih Efisien dengan Digital HRMS</h2>
            <p>
              Platform manajemen SDM terintegrasi untuk pengelolaan data
              karyawan, absensi, penggajian, dan masih banyak lagi.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-right-panel">
        <div className="login-form-container">
          {/* Logo & Title */}
          <div className="login-header">
            <div className="login-logo-wrapper">
              <Image
                src="/logo.png"
                alt="Narwasthu Group Logo"
                width={48}
                height={36}
                className="login-logo"
                priority
              />
            </div>
            <div className="login-brand">
              <h1 className="login-title">Welcome Back !</h1>
              <p className="login-subtitle">HRMS NARWASTHU GROUP</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="login-form" autoComplete="off" suppressHydrationWarning>
            {error && (
              <div className="login-error">
                <span>{error}</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="email" className="login-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="contoh@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="login-input"
                suppressHydrationWarning
              />
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="password" className="login-label">
                  Password
                </label>
                <a href="#" className="login-forgot">
                  Forgot Password?
                </a>
              </div>
              <div className="login-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="login-input login-input-password"
                  suppressHydrationWarning
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

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="login-spinner" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>© 2026 Narwasthu Group. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
