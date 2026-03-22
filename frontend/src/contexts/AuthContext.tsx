"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  profile_photo_url?: string;
  is_manager?: boolean;
  role?: {
    id: number;
    name: string;
    permissions: Array<{ slug: string }>;
  };
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission?: string) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get("/user");
      const userData = response.data.data?.user || response.data;
      setUser(userData);
      const slugs = userData.role?.permissions?.map((p: any) => p.slug) || [];
      setPermissions(slugs);
    } catch (e) {
      console.error("Gagal ambil data user", e);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    router.push("/login");
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (user?.role?.name === "Super Admin") return true;
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, permissions, loading, hasPermission, refreshUser: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
