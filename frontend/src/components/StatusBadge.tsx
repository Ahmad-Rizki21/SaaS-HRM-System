"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: Readonly<StatusBadgeProps>) {
  const s = status.toLowerCase();
  
  if (s === 'approved' || s === 'success' || s === 'active') {
    return <span className="dash-badge dash-badge-success">Disetujui</span>;
  }
  
  if (s === 'rejected' || s === 'danger' || s === 'error') {
    return <span className="dash-badge dash-badge-danger">Ditolak</span>;
  }
  
  if (s === 'pending' || s === 'waiting' || s.startsWith('pending_')) {
    let label = 'Menunggu';
    if (s === 'pending_supervisor') {
      label = 'Menunggu Atasan';
    } else if (s === 'pending_hr') {
      label = 'Menunggu HRD';
    }
    return <span className="dash-badge dash-badge-warning">{label}</span>;
  }

  if (s === 'draft') {
    return <span className="dash-badge dash-badge-neutral">Draft</span>;
  }

  return <span className="dash-badge dash-badge-neutral">{status}</span>;
}
