"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PermissionGuardProps {
  slug?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ slug, children, fallback = null }) => {
  const { hasPermission, loading } = useAuth();

  if (loading) return null;

  if (hasPermission(slug)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
