"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { CheckCircle, XCircle, Clock, Calendar, DollarSign, User, ExternalLink } from "lucide-react";

interface ApprovalItem {
  id: number;
  type: "leave" | "reimbursement";
  user_name: string;
  category: string; // "Cuti Tahunan", "Bensin", etc.
  description: string;
  amount?: string;
  start_date?: string;
  end_date?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "leave" | "reimbursement" | "profile">("all");

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      // Fetch Leave, Reimbursements, and Profile Requests
      const [leaveRes, reimRes, profileRes] = await Promise.all([
        axiosInstance.get("/leave"),
        axiosInstance.get("/reimbursements"),
        axiosInstance.get("/profile-requests")
      ]);

      const leaves = (leaveRes.data.data.data || []).map((l: any) => ({
        id: l.id,
        type: "leave",
        user_name: l.user?.name || "Karyawan",
        description: l.reason,
        category: l.type,
        start_date: l.start_date,
        end_date: l.end_date,
        status: l.status,
        created_at: l.created_at
      }));

      const reimbursements = (reimRes.data.data.data || []).map((r: any) => ({
        id: r.id,
        type: "reimbursement",
        user_name: r.user?.name || "Karyawan",
        description: r.description,
        category: "Reimbursement",
        amount: r.amount,
        status: r.status,
        created_at: r.created_at
      }));

      const profiles = (profileRes.data.data || []).map((p: any) => ({
        id: p.id,
        type: "profile",
        user_name: p.user?.name || "Karyawan",
        description: `Update data: ${Object.keys(p.new_data).join(", ")}`,
        category: "Perubahan Profil",
        status: p.status,
        created_at: p.created_at
      }));

      // Merge and filter for PENDING only in this view
      const merged = [...leaves, ...reimbursements, ...profiles]
        .filter(item => item.status === "pending")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(merged);
    } catch (e) {
      console.error("Gagal ambil data pengajuan", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, type: string, action: "approve" | "reject") => {
    if (!confirm(`Konfirmasi ${action === 'approve' ? 'Setujui' : 'Tolak'} pengajuan ini?`)) return;
    
    try {
      let endpoint = "";
      if (type === 'leave') endpoint = '/leave';
      else if (type === 'reimbursement') endpoint = '/reimbursements';
      else if (type === 'profile') endpoint = '/profile-requests';

      await axiosInstance.post(`${endpoint}/${id}/${action}`);
      alert(`Berhasil ${action === 'approve' ? 'menyetujui' : 'menolak'} pengajuan.`);
      fetchApprovals();
    } catch (e) {
      alert("Gagal memproses pengajuan.");
    }
  };

  if (loading && items.length === 0) {
    return <div className="flex h-[80vh] items-center justify-center"><div className="w-8 h-8 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Persetujuan Pending</h1>
          <p className="text-sm text-gray-500 mt-1">Review dan proses pengajuan karyawan yang memerlukan persetujuan Anda.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'all' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Semua</button>
          <button onClick={() => setFilter("leave")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'leave' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Cuti</button>
          <button onClick={() => setFilter("reimbursement")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'reimbursement' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Klaim</button>
          <button onClick={() => setFilter("profile")} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${filter === 'profile' ? 'bg-[#8B0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Profil</button>
        </div>
      </div>

      <div className="space-y-4">
        {items.filter(item => filter === 'all' || item.type === filter).length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Semua Beres!</h3>
            <p className="text-sm text-gray-500">Tidak ada pengajuan yang memerlukan tindakan saat ini.</p>
          </div>
        ) : (
          items.filter(item => filter === 'all' || item.type === filter).map(item => (
            <div key={`${item.type}-${item.id}`} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start gap-6">
              <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center ${
                item.type === 'leave' ? 'bg-blue-50 text-blue-600' : 
                item.type === 'reimbursement' ? 'bg-emerald-50 text-emerald-600' :
                'bg-orange-50 text-orange-600'
              }`}>
                {item.type === 'leave' ? <Calendar size={28} /> : 
                 item.type === 'reimbursement' ? <DollarSign size={28} /> : 
                 <User size={28} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">{item.user_name}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">{item.type}</span>
                </div>
                <h4 className="text-base font-bold text-gray-800 mb-1">{item.category}</h4>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 italic">"{item.description || 'Tanpa keterangan'}"</p>
                
                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  {item.start_date && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock size={14} /> {item.start_date} s/d {item.end_date}
                    </div>
                  )}
                  {item.amount && (
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      IDR {parseInt(item.amount).toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">{new Date(item.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                <button 
                  onClick={() => handleAction(item.id, item.type, 'reject')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition"
                >
                  <XCircle size={18} /> Tolak
                </button>
                <button 
                  onClick={() => handleAction(item.id, item.type, 'approve')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition"
                >
                  <CheckCircle size={18} /> Setujui
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
