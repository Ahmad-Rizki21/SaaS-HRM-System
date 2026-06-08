"use client";

import React from "react";

interface ApprovalSignaturesProps {
  status: string;
  signature?: string | null;
  userName?: string;
  managerName?: string;
}

export default function ApprovalSignatures({
  status,
  signature,
  userName,
  managerName = "Manager"
}: ApprovalSignaturesProps) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-8 text-center">
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase">Menyetujui ({managerName})</p>
        <div className="h-20 flex items-center justify-center border-b border-dashed border-gray-200">
          {status === 'approved' ? (
            <div className="text-green-600 font-bold border-2 border-green-600 px-2 py-1 rounded rotate-[-12deg] opacity-60">APPROVED</div>
          ) : (
            <span className="text-gray-300 text-xs italic">Menunggu...</span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase">Pemohon</p>
        <div className="h-20 flex items-center justify-center border-b border-dashed border-gray-200">
          {signature ? (
            <img src={signature} alt="TTD" className="h-16 object-contain" />
          ) : (
            <span className="text-gray-300 text-xs italic">Tanpa TTD</span>
          )}
        </div>
        <p className="text-xs font-bold text-gray-700">{userName || '-'}</p>
      </div>
    </div>
  );
}
