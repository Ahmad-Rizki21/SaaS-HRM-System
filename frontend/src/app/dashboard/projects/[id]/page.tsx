"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import {
  ArrowLeft, HardHat, TrendingUp, DollarSign, FileText, Calendar,
  Wallet, Plus, X, Loader2, Check, XCircle, Edit, Trash2, Eye,
  CheckCircle2, Clock, Pause, BarChart3, MapPin, Users, Building2,
  ArrowUpRight, ArrowDownRight, ChevronRight
} from "lucide-react";
import { Skeleton, TableSkeleton } from "@/components/Skeleton";

const TABS = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "budget", label: "RAB & Anggaran", icon: DollarSign },
  { id: "costs", label: "Aktualisasi Biaya", icon: Wallet },
  { id: "contracts", label: "Kontrak", icon: FileText },
  { id: "schedules", label: "Jadwal & Tender", icon: Calendar },
  { id: "cashflow", label: "Cash Flow", icon: TrendingUp },
];

function fmt(n: number) {
  return `Rp ${Number(n).toLocaleString("id-ID")}`;
}

function fmtShort(n: number) {
  if (n >= 1e9) return `Rp ${(n/1e9).toFixed(1)}M`;
  if (n >= 1e6) return `Rp ${(n/1e6).toFixed(1)}jt`;
  return fmt(n);
}

const STATUS_LABELS: Record<string,string> = {
  planning:"Perencanaan", tender:"Tender", in_progress:"Berjalan",
  on_hold:"Ditunda", completed:"Selesai", cancelled:"Dibatalkan",
  not_started:"Belum Mulai", delayed:"Terlambat",
  draft:"Draft", active:"Aktif", terminated:"Dihentikan",
  pending:"Menunggu", approved:"Disetujui", rejected:"Ditolak",
  main:"Utama", subcontractor:"Subkontraktor", supplier:"Supplier", consultant:"Konsultan",
  preparation:"Persiapan", foundation:"Pondasi", structure:"Struktur",
  finishing:"Finishing", handover:"Serah Terima", other:"Lainnya"
};

function statusBadge(s: string, type: "project"|"cost"|"contract"|"schedule" = "project") {
  const colors: Record<string,string> = {
    planning:"bg-blue-50 text-blue-700 border-blue-200",
    tender:"bg-purple-50 text-purple-700 border-purple-200",
    in_progress:"bg-amber-50 text-amber-700 border-amber-200",
    on_hold:"bg-orange-50 text-orange-700 border-orange-200",
    completed:"bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled:"bg-red-50 text-red-700 border-red-200",
    not_started:"bg-gray-50 text-gray-600 border-gray-200",
    delayed:"bg-red-50 text-red-700 border-red-200",
    draft:"bg-gray-50 text-gray-600 border-gray-200",
    active:"bg-emerald-50 text-emerald-700 border-emerald-200",
    terminated:"bg-red-50 text-red-700 border-red-200",
    pending:"bg-amber-50 text-amber-700 border-amber-200",
    approved:"bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected:"bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold ${colors[s]||"bg-gray-50 text-gray-600 border-gray-200"}`}>
      {STATUS_LABELS[s] || s}
    </span>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Modal states
  const [modal, setModal] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [budgetForm, setBudgetForm] = useState({ category:"", item_name:"", unit:"ls", volume:"", unit_price:"", notes:"" });
  const [costForm, setCostForm] = useState({ budget_item_id:"", category:"", description:"", amount:"", cost_date:"", vendor:"", receipt_number:"", notes:"" });
  const [contractForm, setContractForm] = useState({ contract_number:"", title:"", vendor_name:"", vendor_contact:"", contract_value:"", contract_type:"main", status:"draft", start_date:"", end_date:"", scope_of_work:"", notes:"" });
  const [scheduleForm, setScheduleForm] = useState({ task_name:"", description:"", phase:"other", planned_start:"", planned_end:"", progress:"0", status:"not_started", notes:"" });
  const [cashFlowForm, setCashFlowForm] = useState({ type:"expense", category:"", description:"", amount:"", transaction_date:"", reference_number:"", notes:"" });

  useEffect(() => { fetchData(); }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/projects/${projectId}`);
      setData(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submitForm = async (url: string, payload: any, method = "post") => {
    setSubmitting(true);
    try {
      if (method === "put") await axiosInstance.put(url, payload);
      else await axiosInstance.post(url, payload);
      setModal(null);
      fetchData();
      alert("Data berhasil disimpan!");
    } catch (e: any) { alert(e.response?.data?.message || "Gagal menyimpan."); }
    finally { setSubmitting(false); }
  };

  const deleteItem = async (url: string) => {
    if (!confirm("Hapus data ini?")) return;
    try { await axiosInstance.delete(url); fetchData(); } catch { alert("Gagal menghapus."); }
  };

  const approveCost = async (costId: number) => {
    try { await axiosInstance.post(`/projects/${projectId}/costs/${costId}/approve`); fetchData(); }
    catch { alert("Gagal."); }
  };

  const rejectCost = async (costId: number) => {
    try { await axiosInstance.post(`/projects/${projectId}/costs/${costId}/reject`); fetchData(); }
    catch { alert("Gagal."); }
  };

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 mb-2" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i=><div key={i} className="bg-white border border-gray-100 rounded-xl p-5"><Skeleton className="h-4 w-20 mb-3"/><Skeleton className="h-8 w-24"/></div>)}</div>
      <div className="bg-white border border-gray-100 rounded-xl p-6"><TableSkeleton rows={5} cols={5}/></div>
    </div>
  );

  if (!data) return <div className="text-center py-20 text-gray-500">Proyek tidak ditemukan.</div>;

  const { project, summary, budget_by_category, cost_by_category, monthly_cash_flow } = data;

  const overviewCards = [
    { label:"Total RAB", value: fmtShort(summary.total_budget), icon: DollarSign, color:"text-blue-600", bg:"bg-blue-50" },
    { label:"Realisasi Biaya", value: fmtShort(summary.total_cost_approved), icon: TrendingUp, color:"text-amber-600", bg:"bg-amber-50", sub:`${summary.budget_usage_percent}% terserap` },
    { label:"Sisa Anggaran", value: fmtShort(summary.budget_remaining), icon: Wallet, color: summary.budget_remaining < 0 ? "text-red-600" : "text-emerald-600", bg: summary.budget_remaining < 0 ? "bg-red-50" : "bg-emerald-50" },
    { label:"Arus Kas Bersih", value: fmtShort(summary.net_cash_flow), icon: BarChart3, color: summary.net_cash_flow >= 0 ? "text-emerald-600" : "text-red-600", bg: summary.net_cash_flow >= 0 ? "bg-emerald-50" : "bg-red-50" },
  ];

  return (
    <>
      {/* Back + Header */}
      <div className="mb-6">
        <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-3">
          <ArrowLeft size={16}/> Kembali ke Daftar Proyek
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <HardHat size={26} className="text-amber-600"/> {project.name}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">{project.code}</span>
              {statusBadge(project.status)}
              {project.location && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11}/>{project.location}</span>}
              {project.project_manager && <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11}/>PM: {project.project_manager.name}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Progress circle */}
            <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${project.progress_percentage}, 100`} strokeLinecap="round"/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-gray-900">{Number(project.progress_percentage).toFixed(0)}%</span>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Progres</div>
                <div className="text-sm font-bold text-gray-900">{Number(project.progress_percentage).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {overviewCards.map((c,i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-gray-500">{c.label}</span>
                <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}><Icon size={16} className={c.color}/></div>
              </div>
              <div className="text-xl font-extrabold text-gray-900">{c.value}</div>
              {"sub" in c && c.sub && <div className="text-[11px] text-gray-400 mt-0.5 font-medium">{c.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-100 rounded-xl mb-5 overflow-x-auto">
        <div className="flex">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id ? "border-amber-500 text-amber-700 bg-amber-50/40" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}>
                <Icon size={15}/> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Budget vs Realisasi */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">RAB vs Realisasi per Kategori</h3>
            {budget_by_category.length === 0 ? <p className="text-xs text-gray-400 py-6 text-center">Belum ada data RAB</p> : (
              <div className="space-y-3">
                {budget_by_category.map((b: any, i: number) => {
                  const costCat = cost_by_category.find((c: any) => c.category === b.category);
                  const used = costCat ? costCat.total : 0;
                  const pct = b.total > 0 ? Math.min((used / b.total) * 100, 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-700">{b.category}</span>
                        <span className="text-gray-400">{fmtShort(used)} / {fmtShort(b.total)}</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Monthly Cash Flow */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Arus Kas Bulanan</h3>
            {monthly_cash_flow.length === 0 ? <p className="text-xs text-gray-400 py-6 text-center">Belum ada transaksi</p> : (
              <div className="space-y-2.5">
                {monthly_cash_flow.map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-gray-600">{m.month}</span>
                    <div className="flex gap-4">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><ArrowUpRight size={12}/>{fmtShort(m.income)}</span>
                      <span className="text-xs font-bold text-red-500 flex items-center gap-1"><ArrowDownRight size={12}/>{fmtShort(m.expense)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Info Proyek */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Informasi Proyek</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Klien", project.client_name||"-"],
                ["Lokasi", project.location||"-"],
                ["Mulai (Rencana)", project.start_date ? new Date(project.start_date).toLocaleDateString("id-ID") : "-"],
                ["Selesai (Rencana)", project.end_date ? new Date(project.end_date).toLocaleDateString("id-ID") : "-"],
                ["Kontrak Aktif", `${summary.active_contracts} dari ${summary.contracts_count}`],
                ["Biaya Pending", fmtShort(summary.total_cost_pending)],
              ].map(([l,v],i) => (
                <div key={i}><div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-0.5">{l}</div><div className="font-semibold text-gray-800">{v}</div></div>
              ))}
            </div>
          </div>
          {/* Jadwal */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Timeline Jadwal</h3>
            {project.schedules.length === 0 ? <p className="text-xs text-gray-400 py-6 text-center">Belum ada jadwal</p> : (
              <div className="space-y-2">
                {project.schedules.slice(0,6).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/60">
                    <div className={`w-2 h-2 rounded-full ${s.status==='completed'?'bg-emerald-500':s.status==='in_progress'?'bg-amber-500':s.status==='delayed'?'bg-red-500':'bg-gray-300'}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-800 truncate">{s.task_name}</div>
                      <div className="text-[10px] text-gray-400">{STATUS_LABELS[s.phase]||s.phase}</div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500">{Number(s.progress).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Budget/RAB */}
      {activeTab === "budget" && (
        <div className="bg-white border border-gray-100 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Rencana Anggaran Biaya (RAB)</h3>
            <button onClick={() => { setBudgetForm({category:"",item_name:"",unit:"ls",volume:"",unit_price:"",notes:""}); setModal("budget"); }} className="dash-btn dash-btn-primary text-xs"><Plus size={14}/>Tambah Item</button>
          </div>
          {project.budgets.length === 0 ? <div className="p-10 text-center text-xs text-gray-400">Belum ada item RAB</div> : (
            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead><tr><th>Kategori</th><th>Item</th><th>Volume</th><th>Harga Satuan</th><th>Total</th><th className="text-right">Aksi</th></tr></thead>
                <tbody>
                  {project.budgets.map((b: any) => (
                    <tr key={b.id}>
                      <td><span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{b.category}</span></td>
                      <td className="font-medium text-gray-900 text-sm">{b.item_name}</td>
                      <td className="text-sm">{b.volume} {b.unit}</td>
                      <td className="text-sm">{fmt(b.unit_price)}</td>
                      <td className="text-sm font-bold text-gray-900">{fmt(b.total_price)}</td>
                      <td className="text-right"><button onClick={() => deleteItem(`/projects/${projectId}/budgets/${b.id}`)} className="dash-action-btn delete"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50"><td colSpan={4} className="text-sm font-extrabold text-gray-900 text-right pr-4">TOTAL RAB</td><td className="text-sm font-extrabold text-amber-700">{fmt(summary.total_budget)}</td><td/></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Costs */}
      {activeTab === "costs" && (
        <div className="bg-white border border-gray-100 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Aktualisasi Biaya Proyek</h3>
            <button onClick={() => { setCostForm({budget_item_id:"",category:"",description:"",amount:"",cost_date:"",vendor:"",receipt_number:"",notes:""}); setModal("cost"); }} className="dash-btn dash-btn-primary text-xs"><Plus size={14}/>Catat Biaya</button>
          </div>
          {project.costs.length === 0 ? <div className="p-10 text-center text-xs text-gray-400">Belum ada biaya tercatat</div> : (
            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead><tr><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Jumlah</th><th>Vendor</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
                <tbody>
                  {project.costs.map((c: any) => (
                    <tr key={c.id}>
                      <td className="text-sm">{new Date(c.cost_date).toLocaleDateString("id-ID")}</td>
                      <td><span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{c.category}</span></td>
                      <td className="text-sm text-gray-800">{c.description}</td>
                      <td className="text-sm font-bold text-gray-900">{fmt(c.amount)}</td>
                      <td className="text-sm text-gray-600">{c.vendor||"-"}</td>
                      <td>{statusBadge(c.status, "cost")}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === "pending" && <>
                            <button onClick={() => approveCost(c.id)} className="dash-action-btn edit" title="Setujui"><Check size={14}/></button>
                            <button onClick={() => rejectCost(c.id)} className="dash-action-btn delete" title="Tolak"><XCircle size={14}/></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Contracts */}
      {activeTab === "contracts" && (
        <div className="bg-white border border-gray-100 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Kontrak Proyek</h3>
            <button onClick={() => { setContractForm({contract_number:"",title:"",vendor_name:"",vendor_contact:"",contract_value:"",contract_type:"main",status:"draft",start_date:"",end_date:"",scope_of_work:"",notes:""}); setModal("contract"); }} className="dash-btn dash-btn-primary text-xs"><Plus size={14}/>Tambah Kontrak</button>
          </div>
          {project.contracts.length === 0 ? <div className="p-10 text-center text-xs text-gray-400">Belum ada kontrak</div> : (
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {project.contracts.map((c: any) => (
                <div key={c.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{c.title}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{c.contract_number}</div>
                    </div>
                    <div className="flex gap-1">
                      {statusBadge(c.status, "contract")}
                      <button onClick={() => deleteItem(`/projects/${projectId}/contracts/${c.id}`)} className="dash-action-btn delete ml-1"><Trash2 size={13}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                    <div><span className="text-gray-400">Vendor:</span> <span className="font-semibold text-gray-700">{c.vendor_name}</span></div>
                    <div><span className="text-gray-400">Tipe:</span> <span className="font-semibold text-gray-700">{STATUS_LABELS[c.contract_type]||c.contract_type}</span></div>
                    <div><span className="text-gray-400">Nilai:</span> <span className="font-bold text-amber-700">{fmt(c.contract_value)}</span></div>
                    <div><span className="text-gray-400">Periode:</span> <span className="font-semibold text-gray-700">{c.start_date ? new Date(c.start_date).toLocaleDateString("id-ID") : "-"} s/d {c.end_date ? new Date(c.end_date).toLocaleDateString("id-ID") : "-"}</span></div>
                  </div>
                  {c.scope_of_work && <div className="mt-2 text-[11px] text-gray-500 line-clamp-2">{c.scope_of_work}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Schedules */}
      {activeTab === "schedules" && (
        <div className="bg-white border border-gray-100 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Penjadwalan & Tender</h3>
            <button onClick={() => { setScheduleForm({task_name:"",description:"",phase:"other",planned_start:"",planned_end:"",progress:"0",status:"not_started",notes:""}); setModal("schedule"); }} className="dash-btn dash-btn-primary text-xs"><Plus size={14}/>Tambah Jadwal</button>
          </div>
          {project.schedules.length === 0 ? <div className="p-10 text-center text-xs text-gray-400">Belum ada jadwal</div> : (
            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead><tr><th>Task</th><th>Fase</th><th>Rencana</th><th>Aktual</th><th>Progres</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
                <tbody>
                  {project.schedules.map((s: any) => (
                    <tr key={s.id}>
                      <td className="text-sm font-semibold text-gray-900">{s.task_name}</td>
                      <td><span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{STATUS_LABELS[s.phase]||s.phase}</span></td>
                      <td className="text-xs text-gray-600">{new Date(s.planned_start).toLocaleDateString("id-ID")} - {new Date(s.planned_end).toLocaleDateString("id-ID")}</td>
                      <td className="text-xs text-gray-600">{s.actual_start ? new Date(s.actual_start).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${Number(s.progress)>=80?'bg-emerald-500':Number(s.progress)>=50?'bg-amber-500':'bg-blue-500'}`} style={{width:`${s.progress}%`}}/></div>
                          <span className="text-xs font-bold text-gray-600">{Number(s.progress).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>{statusBadge(s.status, "schedule")}</td>
                      <td className="text-right"><button onClick={() => deleteItem(`/projects/${projectId}/schedules/${s.id}`)} className="dash-action-btn delete"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Cash Flow */}
      {activeTab === "cashflow" && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
              <ArrowUpRight className="mx-auto text-emerald-500 mb-2" size={24}/>
              <div className="text-[11px] font-bold text-gray-400 uppercase">Total Pemasukan</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">{fmtShort(summary.total_income)}</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
              <ArrowDownRight className="mx-auto text-red-500 mb-2" size={24}/>
              <div className="text-[11px] font-bold text-gray-400 uppercase">Total Pengeluaran</div>
              <div className="text-xl font-extrabold text-red-600 mt-1">{fmtShort(summary.total_expense)}</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
              <BarChart3 className={`mx-auto ${summary.net_cash_flow>=0?'text-emerald-500':'text-red-500'} mb-2`} size={24}/>
              <div className="text-[11px] font-bold text-gray-400 uppercase">Arus Kas Bersih</div>
              <div className={`text-xl font-extrabold mt-1 ${summary.net_cash_flow>=0?'text-emerald-600':'text-red-600'}`}>{fmtShort(summary.net_cash_flow)}</div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Riwayat Transaksi</h3>
              <button onClick={() => { setCashFlowForm({type:"expense",category:"",description:"",amount:"",transaction_date:"",reference_number:"",notes:""}); setModal("cashflow"); }} className="dash-btn dash-btn-primary text-xs"><Plus size={14}/>Catat Transaksi</button>
            </div>
            {project.cash_flows.length === 0 ? <div className="p-10 text-center text-xs text-gray-400">Belum ada transaksi</div> : (
              <div className="dash-table-wrapper">
                <table className="dash-table">
                  <thead><tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Deskripsi</th><th>Jumlah</th><th>Referensi</th><th className="text-right">Aksi</th></tr></thead>
                  <tbody>
                    {project.cash_flows.map((cf: any) => (
                      <tr key={cf.id}>
                        <td className="text-sm">{new Date(cf.transaction_date).toLocaleDateString("id-ID")}</td>
                        <td>{cf.type==="income" ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 w-fit"><ArrowUpRight size={11}/>Masuk</span> : <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1 w-fit"><ArrowDownRight size={11}/>Keluar</span>}</td>
                        <td className="text-xs text-gray-600">{cf.category}</td>
                        <td className="text-sm text-gray-800">{cf.description}</td>
                        <td className={`text-sm font-bold ${cf.type==="income"?"text-emerald-600":"text-red-600"}`}>{cf.type==="income"?"+":"-"} {fmt(cf.amount)}</td>
                        <td className="text-xs text-gray-500">{cf.reference_number||"-"}</td>
                        <td className="text-right"><button onClick={() => deleteItem(`/projects/${projectId}/cash-flows/${cf.id}`)} className="dash-action-btn delete"><Trash2 size={14}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MODALS ============ */}

      {/* Budget Modal */}
      {modal === "budget" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && setModal(null)}/>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-blue-50"><h2 className="text-lg font-bold text-gray-900">Tambah Item RAB</h2><button onClick={() => setModal(null)} disabled={submitting}><X size={20} className="text-gray-500"/></button></div>
            <form onSubmit={e => { e.preventDefault(); submitForm(`/projects/${projectId}/budgets`, { ...budgetForm, volume: Number(budgetForm.volume), unit_price: Number(budgetForm.unit_price) }); }} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Kategori *</label><input className="w-full border rounded-lg p-2 text-sm" value={budgetForm.category} onChange={e => setBudgetForm({...budgetForm, category: e.target.value})} placeholder="Material / Upah / Alat" required/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Nama Item *</label><input className="w-full border rounded-lg p-2 text-sm" value={budgetForm.item_name} onChange={e => setBudgetForm({...budgetForm, item_name: e.target.value})} placeholder="Besi Beton D16" required/></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Volume *</label><input type="number" step="0.01" className="w-full border rounded-lg p-2 text-sm" value={budgetForm.volume} onChange={e => setBudgetForm({...budgetForm, volume: e.target.value})} required/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Satuan</label><input className="w-full border rounded-lg p-2 text-sm" value={budgetForm.unit} onChange={e => setBudgetForm({...budgetForm, unit: e.target.value})} placeholder="kg"/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Harga Satuan *</label><input type="number" className="w-full border rounded-lg p-2 text-sm" value={budgetForm.unit_price} onChange={e => setBudgetForm({...budgetForm, unit_price: e.target.value})} required/></div>
              </div>
              <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Catatan</label><textarea className="w-full border rounded-lg p-2 text-sm" value={budgetForm.notes} onChange={e => setBudgetForm({...budgetForm, notes: e.target.value})}/></div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-50 border rounded-xl">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">{submitting?"Menyimpan...":"Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cost Modal */}
      {modal === "cost" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && setModal(null)}/>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-amber-50"><h2 className="text-lg font-bold text-gray-900">Catat Biaya Aktual</h2><button onClick={() => setModal(null)} disabled={submitting}><X size={20} className="text-gray-500"/></button></div>
            <form onSubmit={e => { e.preventDefault(); submitForm(`/projects/${projectId}/costs`, { ...costForm, amount: Number(costForm.amount), budget_item_id: costForm.budget_item_id || null }); }} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Kategori *</label><input className="w-full border rounded-lg p-2 text-sm" value={costForm.category} onChange={e => setCostForm({...costForm, category: e.target.value})} required/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Tanggal *</label><input type="date" className="w-full border rounded-lg p-2 text-sm" value={costForm.cost_date} onChange={e => setCostForm({...costForm, cost_date: e.target.value})} required/></div>
              </div>
              <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Deskripsi *</label><input className="w-full border rounded-lg p-2 text-sm" value={costForm.description} onChange={e => setCostForm({...costForm, description: e.target.value})} required/></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Jumlah (Rp) *</label><input type="number" className="w-full border rounded-lg p-2 text-sm" value={costForm.amount} onChange={e => setCostForm({...costForm, amount: e.target.value})} required/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Vendor</label><input className="w-full border rounded-lg p-2 text-sm" value={costForm.vendor} onChange={e => setCostForm({...costForm, vendor: e.target.value})}/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">No. Kwitansi</label><input className="w-full border rounded-lg p-2 text-sm" value={costForm.receipt_number} onChange={e => setCostForm({...costForm, receipt_number: e.target.value})}/></div>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-50 border rounded-xl">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-50">{submitting?"Menyimpan...":"Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {modal === "contract" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && setModal(null)}/>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-violet-50"><h2 className="text-lg font-bold text-gray-900">Tambah Kontrak</h2><button onClick={() => setModal(null)} disabled={submitting}><X size={20} className="text-gray-500"/></button></div>
            <form onSubmit={e => { e.preventDefault(); submitForm(`/projects/${projectId}/contracts`, { ...contractForm, contract_value: Number(contractForm.contract_value) }); }} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">No. Kontrak *</label><input className="w-full border rounded-lg p-2 text-sm font-mono" value={contractForm.contract_number} onChange={e => setContractForm({...contractForm, contract_number: e.target.value})} required/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Judul *</label><input className="w-full border rounded-lg p-2 text-sm" value={contractForm.title} onChange={e => setContractForm({...contractForm, title: e.target.value})} required/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Nama Vendor *</label><input className="w-full border rounded-lg p-2 text-sm" value={contractForm.vendor_name} onChange={e => setContractForm({...contractForm, vendor_name: e.target.value})} required/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Nilai Kontrak *</label><input type="number" className="w-full border rounded-lg p-2 text-sm" value={contractForm.contract_value} onChange={e => setContractForm({...contractForm, contract_value: e.target.value})} required/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Tipe</label><select className="w-full border rounded-lg p-2 text-sm" value={contractForm.contract_type} onChange={e => setContractForm({...contractForm, contract_type: e.target.value})}><option value="main">Utama</option><option value="subcontractor">Subkontraktor</option><option value="supplier">Supplier</option><option value="consultant">Konsultan</option></select></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Status</label><select className="w-full border rounded-lg p-2 text-sm" value={contractForm.status} onChange={e => setContractForm({...contractForm, status: e.target.value})}><option value="draft">Draft</option><option value="active">Aktif</option><option value="completed">Selesai</option><option value="terminated">Dihentikan</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Mulai</label><input type="date" className="w-full border rounded-lg p-2 text-sm" value={contractForm.start_date} onChange={e => setContractForm({...contractForm, start_date: e.target.value})}/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Selesai</label><input type="date" className="w-full border rounded-lg p-2 text-sm" value={contractForm.end_date} onChange={e => setContractForm({...contractForm, end_date: e.target.value})}/></div>
              </div>
              <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Lingkup Pekerjaan</label><textarea className="w-full border rounded-lg p-2 text-sm min-h-[60px]" value={contractForm.scope_of_work} onChange={e => setContractForm({...contractForm, scope_of_work: e.target.value})}/></div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-50 border rounded-xl">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50">{submitting?"Menyimpan...":"Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {modal === "schedule" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && setModal(null)}/>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-emerald-50"><h2 className="text-lg font-bold text-gray-900">Tambah Jadwal</h2><button onClick={() => setModal(null)} disabled={submitting}><X size={20} className="text-gray-500"/></button></div>
            <form onSubmit={e => { e.preventDefault(); submitForm(`/projects/${projectId}/schedules`, { ...scheduleForm, progress: Number(scheduleForm.progress) }); }} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Nama Task *</label><input className="w-full border rounded-lg p-2 text-sm" value={scheduleForm.task_name} onChange={e => setScheduleForm({...scheduleForm, task_name: e.target.value})} required/></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Fase</label><select className="w-full border rounded-lg p-2 text-sm" value={scheduleForm.phase} onChange={e => setScheduleForm({...scheduleForm, phase: e.target.value})}><option value="tender">Tender</option><option value="preparation">Persiapan</option><option value="foundation">Pondasi</option><option value="structure">Struktur</option><option value="finishing">Finishing</option><option value="handover">Serah Terima</option><option value="other">Lainnya</option></select></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Status</label><select className="w-full border rounded-lg p-2 text-sm" value={scheduleForm.status} onChange={e => setScheduleForm({...scheduleForm, status: e.target.value})}><option value="not_started">Belum Mulai</option><option value="in_progress">Berjalan</option><option value="completed">Selesai</option><option value="delayed">Terlambat</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Mulai *</label><input type="date" className="w-full border rounded-lg p-2 text-sm" value={scheduleForm.planned_start} onChange={e => setScheduleForm({...scheduleForm, planned_start: e.target.value})} required/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Selesai *</label><input type="date" className="w-full border rounded-lg p-2 text-sm" value={scheduleForm.planned_end} onChange={e => setScheduleForm({...scheduleForm, planned_end: e.target.value})} required/></div>
              </div>
              <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Progres (%)</label><input type="number" min="0" max="100" className="w-full border rounded-lg p-2 text-sm" value={scheduleForm.progress} onChange={e => setScheduleForm({...scheduleForm, progress: e.target.value})}/></div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-50 border rounded-xl">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">{submitting?"Menyimpan...":"Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Flow Modal */}
      {modal === "cashflow" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && setModal(null)}/>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-teal-50"><h2 className="text-lg font-bold text-gray-900">Catat Transaksi Kas</h2><button onClick={() => setModal(null)} disabled={submitting}><X size={20} className="text-gray-500"/></button></div>
            <form onSubmit={e => { e.preventDefault(); submitForm(`/projects/${projectId}/cash-flows`, { ...cashFlowForm, amount: Number(cashFlowForm.amount) }); }} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Tipe *</label><select className="w-full border rounded-lg p-2 text-sm" value={cashFlowForm.type} onChange={e => setCashFlowForm({...cashFlowForm, type: e.target.value})}><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Tanggal *</label><input type="date" className="w-full border rounded-lg p-2 text-sm" value={cashFlowForm.transaction_date} onChange={e => setCashFlowForm({...cashFlowForm, transaction_date: e.target.value})} required/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Kategori *</label><input className="w-full border rounded-lg p-2 text-sm" value={cashFlowForm.category} onChange={e => setCashFlowForm({...cashFlowForm, category: e.target.value})} required/></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Jumlah (Rp) *</label><input type="number" className="w-full border rounded-lg p-2 text-sm" value={cashFlowForm.amount} onChange={e => setCashFlowForm({...cashFlowForm, amount: e.target.value})} required/></div>
              </div>
              <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">Deskripsi *</label><input className="w-full border rounded-lg p-2 text-sm" value={cashFlowForm.description} onChange={e => setCashFlowForm({...cashFlowForm, description: e.target.value})} required/></div>
              <div className="space-y-1"><label className="text-sm font-semibold text-gray-700">No. Referensi</label><input className="w-full border rounded-lg p-2 text-sm" value={cashFlowForm.reference_number} onChange={e => setCashFlowForm({...cashFlowForm, reference_number: e.target.value})}/></div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-50 border rounded-xl">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50">{submitting?"Menyimpan...":"Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
