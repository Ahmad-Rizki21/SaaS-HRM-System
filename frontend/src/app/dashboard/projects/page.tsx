"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import {
  Plus, Search, Eye, Edit, Trash2, X, HardHat, Building2, MapPin,
  Calendar, TrendingUp, DollarSign, AlertCircle, CheckCircle2,
  Clock, Pause, XCircle, Loader2, ChevronRight, BarChart3, Users
} from "lucide-react";
import Pagination from "@/components/Pagination";
import { Skeleton, TableSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  planning: { label: "Perencanaan", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Clock },
  tender: { label: "Tender", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: BarChart3 },
  in_progress: { label: "Berjalan", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: TrendingUp },
  on_hold: { label: "Ditunda", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: Pause },
  completed: { label: "Selesai", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
};

function formatCurrency(num: number) {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

export default function ProjectsPage() {
  const { hasPermission, user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "", code: "", description: "", client_name: "", location: "",
    status: "planning", total_budget: "", start_date: "", end_date: "",
    project_manager_id: ""
  });

  useEffect(() => { fetchDashboard(); fetchEmployees(); }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => { fetchProjects(page); }, [page, statusFilter, debouncedSearch]);

  const fetchDashboard = async () => {
    try {
      const res = await axiosInstance.get("/projects/dashboard");
      setDashboard(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get("/employees?per_page=100");
      setEmployees(res.data.data?.data || res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchProjects = async (pageNumber: number) => {
    try {
      setLoading(true);
      let url = `/projects?page=${pageNumber}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (debouncedSearch) url += `&search=${debouncedSearch}`;
      const response = await axiosInstance.get(url);
      const data = response.data.data;
      setProjects(data?.data || []);
      if (data?.current_page) {
        setPagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); fetchProjects(1); };

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: "", code: "", description: "", client_name: "", location: "",
      status: "planning", total_budget: "", start_date: "", end_date: "",
      project_manager_id: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name || "",
      code: project.code || "",
      description: project.description || "",
      client_name: project.client_name || "",
      location: project.location || "",
      status: project.status || "planning",
      total_budget: project.total_budget || "",
      start_date: project.start_date?.split("T")[0] || "",
      end_date: project.end_date?.split("T")[0] || "",
      project_manager_id: project.project_manager_id || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        total_budget: formData.total_budget ? Number(formData.total_budget) : 0,
        project_manager_id: formData.project_manager_id || null
      };

      if (editingProject) {
        await axiosInstance.put(`/projects/${editingProject.id}`, payload);
        alert("Proyek berhasil diperbarui!");
      } else {
        await axiosInstance.post("/projects", payload);
        alert("Proyek berhasil dibuat!");
      }
      setIsModalOpen(false);
      fetchProjects(page);
      fetchDashboard();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan proyek.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus proyek ini?")) return;
    try {
      await axiosInstance.delete(`/projects/${id}`);
      alert("Proyek berhasil dihapus.");
      fetchProjects(page);
      fetchDashboard();
    } catch (e) { alert("Gagal menghapus proyek."); }
  };

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.planning;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
        <Icon size={12} />
        {cfg.label}
      </span>
    );
  };

  const getProgressBar = (percent: number) => {
    const color = percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : percent >= 20 ? "bg-blue-500" : "bg-gray-300";
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs font-bold text-gray-600 w-10 text-right">{percent}%</span>
      </div>
    );
  };

  const statCards = [
    { label: "Total Proyek", value: dashboard?.total_projects || 0, icon: HardHat, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Proyek Aktif", value: dashboard?.active_projects || 0, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Selesai", value: dashboard?.completed_projects || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Anggaran", value: formatCurrency(dashboard?.total_budget_all || 0), icon: DollarSign, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  return (
    <>
      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title flex items-center gap-2">
            <HardHat size={28} className="text-amber-600" />
            Kontrol Eksekusi Proyek
          </h1>
          <p className="dash-page-desc">Kelola proyek konstruksi, anggaran, kontrak, dan penjadwalan secara terpusat.</p>
        </div>
        <div className="dash-page-actions">
          <button onClick={openCreateModal} className="dash-btn dash-btn-primary">
            <Plus size={15} />
            Proyek Baru
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold text-gray-500">{card.label}</span>
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon size={18} className={card.color} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-gray-900">{card.value}</div>
              {dashboard && i === 1 && (
                <div className="text-[11px] text-gray-400 mt-1 font-medium">
                  {dashboard.planning_projects} perencanaan · {dashboard.on_hold_projects} ditunda
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 bg-white p-3 border border-gray-100 rounded-xl">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari proyek..."
              className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="dash-btn dash-btn-outline text-xs h-9">Cari</button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {[{ value: "all", label: "Semua" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))].map((s) => (
            <button
              key={s.value}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === s.value
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => { setStatusFilter(s.value); setPage(1); }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <div className="dash-table-container">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={5} cols={7} /></div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center">
            <HardHat className="mx-auto mb-3 text-gray-200" size={48} />
            <p className="text-sm text-gray-500 font-medium">Belum ada proyek.</p>
            <p className="text-xs text-gray-400 mt-1">Klik "Proyek Baru" untuk memulai.</p>
          </div>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Proyek</th>
                  <th>Klien</th>
                  <th>Status</th>
                  <th>Progres</th>
                  <th>Anggaran</th>
                  <th>Realisasi</th>
                  <th>PM</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="group">
                    <td>
                      <div className="min-w-[180px]">
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="text-sm font-bold text-gray-900 hover:text-amber-700 transition-colors"
                        >
                          {project.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{project.code}</span>
                          {project.location && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                              <MapPin size={10} />
                              {project.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-700">{project.client_name || "-"}</span>
                    </td>
                    <td>{getStatusBadge(project.status)}</td>
                    <td className="min-w-[140px]">{getProgressBar(Number(project.progress_percentage))}</td>
                    <td>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(project.total_budget))}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(project.total_cost))}
                        </span>
                        {Number(project.total_budget) > 0 && (
                          <div className="text-[10px] mt-0.5 font-bold" style={{ color: Number(project.total_cost) > Number(project.total_budget) ? '#dc2626' : '#059669' }}>
                            {((Number(project.total_cost) / Number(project.total_budget)) * 100).toFixed(1)}% dari RAB
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-700">{project.project_manager?.name || "-"}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="dash-action-btn view"
                          title="Detail Proyek"
                        >
                          <Eye size={16} />
                        </Link>
                        <button className="dash-action-btn edit" title="Edit" onClick={() => openEditModal(project)}>
                          <Edit size={15} />
                        </button>
                        <button className="dash-action-btn delete" title="Hapus" onClick={() => handleDelete(project.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.last_page > 1 && (
          <Pagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            total={pagination.total}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* CREATE/EDIT PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <HardHat size={20} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingProject ? "Edit Proyek" : "Buat Proyek Baru"}
                  </h2>
                  <p className="text-xs text-gray-500">Isi detail proyek konstruksi</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Nama Proyek *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Pembangunan Gedung A"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Kode Proyek *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono uppercase"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PRJ-001"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Deskripsi</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[70px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat mengenai proyek..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Nama Klien</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="PT. ABC"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Lokasi</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Jakarta Selatan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Total Anggaran (Rp)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                    placeholder="1000000000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Project Manager</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={formData.project_manager_id}
                    onChange={(e) => setFormData({ ...formData, project_manager_id: e.target.value })}
                  >
                    <option value="">-- Pilih PM --</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Tanggal Mulai</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Tanggal Selesai</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-all"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Menyimpan...</span>
                  ) : editingProject ? "Simpan Perubahan" : "Buat Proyek"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Maintenance/Under Development Overlay */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-md" />
        <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <HardHat size={48} className="text-amber-600 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            Under Development
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-500 font-medium leading-relaxed">
              Project Management Under <span className="text-amber-600 font-bold">Devlop and Optimize</span> by <span className="text-gray-900 font-bold">Ahmad Rizki</span>
            </p>
            
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
              <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">Status Update</p>
              <p className="text-xs text-amber-600 mt-1">Sistem sedang dioptimalkan untuk performa terbaik dan fitur kontrol eksekusi konstruksi sedang disiapkan.</p>
            </div>
          </div>

          <button
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/dashboard'}
            className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-[0_10px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] active:scale-[0.98]"
          >
            Kembali ke Dashboard
          </button>
          
          <p className="mt-6 text-[10px] text-gray-400 font-medium">
            © 2026 Ahmad Rizki · On Time HRMS
          </p>
        </div>
      </div>
    </>
  );
}
