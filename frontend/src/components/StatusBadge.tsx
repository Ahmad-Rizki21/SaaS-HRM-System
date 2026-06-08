"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = status.toLowerCase();
  
  if (s === 'approved' || s === 'success' || s === 'active') {
    return <span className="dash-badge dash-badge-success">Disetujui</span>;
  }
  
  if (s === 'rejected' || s === 'danger' || s === 'error') {
    return <span className="dash-badge dash-badge-danger">Ditolak</span>;
  }
  
  if (s === 'pending' || s === 'waiting' || s.startsWith('pending_')) {
    const label = s === 'pending_supervisor' ? 'Menunggu Atasan' : (s === 'pending_hr' ? 'Menunggu HRD' : 'Menunggu');
    return <span className="dash-badge dash-badge-warning">{label}</span>;
  }

  if (s === 'draft') {
    return <span className="dash-badge dash-badge-neutral">Draft</span>;
  }

  return <span className="dash-badge dash-badge-neutral">{status}</span>;
}
