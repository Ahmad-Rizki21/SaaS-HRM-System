"use client";

import "./dashboard.css";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  CreditCard,
  Settings, 
  LogOut, 
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Search,
  Mail,
  Bell,
  UserCheck,
  UserX,
  MoreVertical,
  Eye,
  Plus,
  Filter,
  User,
  Shield,
  Laptop,
  Camera
} from "lucide-react";
import Cookies from "js-cookie";
import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios";

type SubmenuItem = {
  name: string;
  href: string;
  permission?: string;
};

type SidebarLink = {
  isHeading?: boolean;
  name: string;
  href?: string;
  icon?: any;
  submenus?: SubmenuItem[];
  permission?: string;
};

const sidebarLinks: SidebarLink[] = [
  { name: "Menu Utama", isHeading: true },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  
  { name: "Manajemen SDM", isHeading: true, permission: 'view-employees' },
  { 
    name: "Pegawai", 
    icon: Users,
    permission: 'view-employees',
    submenus: [
      { name: "Data Karyawan", href: "/dashboard/employees", permission: 'view-employees' },
      { name: "Profil Perusahaan", href: "/dashboard/company", permission: 'manage-company' },
    ]
  },
  { 
    name: "Kehadiran", 
    icon: Clock,
    submenus: [
      { name: "Riwayat Absensi", href: "/dashboard/attendance" },
      { name: "Jadwal & Shift", href: "/dashboard/schedules", permission: 'manage-schedules' },
      { name: "Hari Libur", href: "/dashboard/holidays", permission: 'manage-holidays' },
    ]
  },
  
  { name: "Administrasi", isHeading: true },
  { 
    name: "Pengajuan", 
    icon: FileText,
    submenus: [
      { name: "Cuti Karyawan", href: "/dashboard/leaves", permission: 'view-leaves' },
      { name: "Reimbursement", href: "/dashboard/reimbursements", permission: 'view-reimbursements' },
      { name: "Persetujuan (Approval)", href: "/dashboard/approvals", permission: 'approve-leaves' },
    ]
  },
  {
    name: "Komunikasi",
    icon: Mail,
    submenus: [
      { name: "Pengumuman", href: "/dashboard/announcements", permission: 'view-leaves' }, // Everyone can view
    ]
  },
  {
    name: "Laporan",
    icon: CreditCard,
    permission: 'view-employees',
    submenus: [
      { name: "Laporan Absensi", href: "/dashboard/reports/attendance", permission: 'view-employees' },
      { name: "Laporan Reimbursement", href: "/dashboard/reports/reimbursements", permission: 'view-employees' },
      { name: "Laporan Cuti", href: "/dashboard/reports/leaves", permission: 'view-employees' },
      { name: "Laporan Gaji", href: "/dashboard/reports/payroll", permission: 'view-employees' },
    ]
  },
  { name: "Sistem", isHeading: true, permission: 'manage-roles' },
  {
    name: "Pengaturan",
    icon: Settings,
    permission: 'manage-roles',
    submenus: [
      { name: "Manajemen Jabatan/Role", href: "/dashboard/roles", permission: 'manage-roles' },
      { name: "Hak Akses", href: "/dashboard/permissions", permission: 'manage-roles' },
      { name: "Log Aktivitas", href: "/dashboard/activity-logs", permission: 'view-activity-logs' },
    ]
  }
];

import { AuthProvider, useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, permissions, hasPermission, refreshUser, logout } = useAuth();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<string | null>(null);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAppSettingsModalOpen, setIsAppSettingsModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', address: '' });
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get('/notifications');
      const allData = res.data.data || [];
      
      // Split by category
      setNotifications(allData.filter((n: any) => n.category === 'notif' || !n.category));
      setInboxMessages(allData.filter((n: any) => n.category === 'mail'));
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        address: (user as any).address || ''
      });
    }
    fetchNotifications();
    
    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    try {
      // First update profile data (direct update for name/phone)
      await axiosInstance.post('/profile/update', profileData);

      // Then upload photo if exists
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        await axiosInstance.post('/profile/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      alert("Profil berhasil diperbarui!");
      setIsProfileModalOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      refreshUser();
    } catch (e: any) {
      alert("Gagal memperbarui profil: " + (e.response?.data?.message || e.message));
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      alert("Konfirmasi kata sandi tidak cocok!");
      return;
    }
    setIsSubmittingPassword(true);
    try {
      await axiosInstance.post('/user/change-password', passwordData);
      alert("Kata sandi berhasil diubah! Silakan login kembali untuk keamanan.");
      setIsSecurityModalOpen(false);
      setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal mengubah kata sandi.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read");
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveHeaderDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleHeaderDropdown = (name: string) => {
    setActiveHeaderDropdown((prev: string | null) => prev === name ? null : name);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axiosInstance.post("/logout");
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      Cookies.remove("token");
      router.push("/login");
    }
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
    const [openGroup, setOpenGroup] = useState<string | null>(() => {
      // Auto-open group if one of its children is active
      for (const link of sidebarLinks) {
        if (link.submenus) {
           const isActive = link.submenus.some(sub => pathname === sub.href || pathname.startsWith(`${sub.href}/`));
           if (isActive) return link.name;
        }
      }
      return null;
    });

    const toggleGroup = (name: string) => {
      setOpenGroup(prev => prev === name ? null : name);
    };

    const filteredLinks = sidebarLinks.filter(link => hasPermission(link.permission));

    return (
      <ul className="dash-nav-list">
        {filteredLinks.map((link, index) => {
          if (link.isHeading) {
            // Check for visible content
            const idx = sidebarLinks.indexOf(link);
            const hasVisibleContent = sidebarLinks.slice(idx + 1).some(l => {
              if (l.isHeading) return false;
              return hasPermission(l.permission);
            });
            if (!hasVisibleContent) return null;

            return (
              <li key={`heading-${index}`} className="dash-nav-heading">
                {link.name}
              </li>
            );
          }

          const Icon = link.icon;
          
          if (link.submenus) {
            const filteredSubmenus = link.submenus.filter(sub => hasPermission(sub.permission));
            if (filteredSubmenus.length === 0) return null;

            const hasActiveChild = filteredSubmenus.some(sub => pathname === sub.href || pathname.startsWith(`${sub.href}/`));
            const isOpen = openGroup === link.name;
            
            return (
              <li key={link.name}>
                <button
                  className={`dash-nav-link w-full dash-nav-group-btn ${hasActiveChild ? "dash-nav-group-active" : ""}`}
                  onClick={() => toggleGroup(link.name)}
                >
                  <div className="flex items-center gap-[10px]">
                    <Icon className="dash-nav-icon" />
                    {link.name}
                  </div>
                  {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                </button>
                {isOpen && (
                  <ul className="dash-submenu-list">
                    {filteredSubmenus.map((sub) => {
                      const isActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                      return (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            onClick={onNavigate}
                            className={`dash-submenu-link ${isActive ? "dash-submenu-active" : ""}`}
                          >
                            <span className="dash-submenu-dot" />
                            {sub.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          }

          // Regular standalone links
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href!}
                onClick={onNavigate}
                className={`dash-nav-link ${isActive ? "dash-nav-link-active" : ""}`}
              >
                <Icon className="dash-nav-icon" />
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  const SidebarBrand = () => (
    <div className="dash-sidebar-brand">
      <Image
        src="/logo.png"
        alt="Narwasthu Group"
        width={32}
        height={24}
        className="dash-sidebar-logo"
      />
      <span className="dash-sidebar-title">HRMS Narwasthu</span>
    </div>
  );

  return (
    <div className="dash-layout">
      {/* Desktop Sidebar */}
      <aside className="dash-sidebar">
        <SidebarBrand />
        <nav className="dash-sidebar-nav">
          <NavLinks />
        </nav>
        <div className="dash-sidebar-footer">
          <button
            className="dash-logout-btn"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="dash-nav-icon" />
            {isLoggingOut ? "Keluar..." : "Keluar Akun"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dash-main">
        {/* Mobile Header */}
        <header className="dash-mobile-header">
          <button
            className="dash-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="dash-mobile-brand">
            <Image
              src="/logo.png"
              alt="Narwasthu Group"
              width={24}
              height={18}
              className="dash-sidebar-logo"
            />
            <span className="dash-sidebar-title">HRMS Narwasthu</span>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="dash-overlay"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="dash-mobile-sidebar">
              <div className="dash-mobile-sidebar-header">
                <SidebarBrand />
                <button
                  className="dash-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="dash-sidebar-nav">
                <NavLinks onNavigate={() => setMobileMenuOpen(false)} />
              </nav>
              <div className="dash-sidebar-footer">
                <button
                  className="dash-logout-btn"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="dash-nav-icon" />
                  {isLoggingOut ? "Keluar..." : "Keluar Akun"}
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Desktop Header */}
        <header className="dash-desktop-header">
          {/* Kiri: Search Bar */}
          <div className="dash-header-search">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Search..." aria-label="Search" />
          </div>

          {/* Kanan: Icons & Profile */}
          <div className="dash-header-right">
            <div className="dash-header-icons" ref={dropdownRef}>
              <button 
                className={`dash-header-icon-btn ${activeHeaderDropdown === 'mail' ? 'text-[#8B0000]' : ''}`} 
                title="Pesan"
                onClick={() => toggleHeaderDropdown('mail')}
              >
                <Mail size={18} />
                {inboxMessages.some(m => !m.is_read) && <span className="dash-notification-dot"></span>}
              </button>

              <button 
                className={`dash-header-icon-btn ${activeHeaderDropdown === 'notif' ? 'text-[#8B0000]' : ''}`} 
                title="Notifikasi"
                onClick={() => toggleHeaderDropdown('notif')}
              >
                <Bell size={18} />
                {notifications.some(n => !n.is_read) && <span className="dash-notification-dot"></span>}
              </button>

              <button 
                className={`dash-header-icon-btn ${activeHeaderDropdown === 'settings' ? 'text-[#8B0000]' : ''}`} 
                title="Pengaturan Akun"
                onClick={() => toggleHeaderDropdown('settings')}
              >
                <Settings size={18} />
              </button>

              {/* Dropdown Panels */}
              {activeHeaderDropdown === 'mail' && (
                <div className="dash-header-dropdown">
                  <div className="dash-dropdown-header">
                    <span className="dash-dropdown-title">Kotak Pesan</span>
                    {inboxMessages.filter(m => !m.is_read).length > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                        {inboxMessages.filter(m => !m.is_read).length} BARU
                      </span>
                    )}
                  </div>
                  <ul className="dash-dropdown-list">
                    {inboxMessages.length > 0 ? (
                      inboxMessages.map(m => (
                        <li key={m.id} className={`dash-dropdown-item ${!m.is_read ? 'bg-amber-50/50' : ''}`}>
                          <div className="dash-dropdown-icon"><User size={16} /></div>
                          <div className="dash-dropdown-content">
                            <span className="dash-dropdown-label">{m.from_name}</span>
                            <span className="dash-dropdown-desc">{m.message}</span>
                            <span className="dash-dropdown-time">{m.created_at}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-6 py-8 text-center">
                        <Mail className="mx-auto mb-2 text-gray-200" size={32} />
                        <p className="text-xs text-gray-400">Tidak ada pesan baru</p>
                      </li>
                    )}
                  </ul>
                  <div className="dash-dropdown-footer">
                    <button className="dash-dropdown-all-btn">Lihat Semua Pesan</button>
                  </div>
                </div>
              )}

              {activeHeaderDropdown === 'notif' && (
                <div className="dash-header-dropdown">
                  <div className="dash-dropdown-header">
                    <span className="dash-dropdown-title">Notifikasi Terkini</span>
                  </div>
                  <ul className="dash-dropdown-list">
                    {notifications.filter(n => !n.is_read).length > 0 ? (
                      notifications.filter(n => !n.is_read).map(n => (
                        <li 
                          key={n.id} 
                          className="dash-dropdown-item cursor-pointer hover:bg-gray-50 transition-colors bg-blue-50/50 border-l-2 border-[#8B0000]"
                          onClick={() => {
                            handleMarkAsRead(n.id);
                            if (n.link) {
                                router.push(n.link);
                                setActiveHeaderDropdown(null);
                            }
                          }}
                        >
                          <div className="dash-dropdown-icon text-[#8B0000]">
                            {n.type === 'warning' ? <Bell size={16} /> : <Bell size={16} />}
                          </div>
                          <div className="dash-dropdown-content">
                            <span className="dash-dropdown-label uppercase text-[10px] font-black">{n.title}</span>
                            <span className="dash-dropdown-desc text-[11px] leading-tight">{n.message}</span>
                            <span className="dash-dropdown-time">{new Date(n.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-6 py-8 text-center text-sm text-gray-400">
                        Belum ada notifikasi baru
                      </li>
                    )}
                  </ul>
                  <div className="dash-dropdown-footer">
                    <button onClick={handleMarkAllAsRead} className="dash-dropdown-all-btn">Tandai Semua Sudah Dibaca</button>
                  </div>
                </div>
              )}

              {activeHeaderDropdown === 'settings' && (
                <div className="dash-header-dropdown w-[220px]!">
                  <div className="dash-dropdown-header">
                    <span className="dash-dropdown-title">Pengaturan</span>
                  </div>
                  <ul className="dash-dropdown-list">
                    <li className="dash-dropdown-item items-center! cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setIsProfileModalOpen(true); setActiveHeaderDropdown(null); }}>
                      <div className="dash-dropdown-icon w-8! h-8!"><User size={14} /></div>
                      <div className="dash-dropdown-content">
                        <span className="dash-dropdown-label mb-0! text-sm">Profil Saya</span>
                      </div>
                    </li>
                    <li className="dash-dropdown-item items-center! cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setIsSecurityModalOpen(true); setActiveHeaderDropdown(null); }}>
                      <div className="dash-dropdown-icon w-8! h-8! text-[#8B0000]"><Shield size={14} /></div>
                      <div className="dash-dropdown-content">
                        <span className="dash-dropdown-label mb-0! text-sm">Keamanan</span>
                      </div>
                    </li>
                    <li className="dash-dropdown-item items-center! cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setIsAppSettingsModalOpen(true); setActiveHeaderDropdown(null); }}>
                      <div className="dash-dropdown-icon w-8! h-8!"><Laptop size={14} /></div>
                      <div className="dash-dropdown-content">
                        <span className="dash-dropdown-label mb-0! text-sm">Aplikasi</span>
                      </div>
                    </li>
                  </ul>
                  <div className="dash-dropdown-footer">
                    <button onClick={handleLogout} className="text-xs font-bold text-red-600 hover:scale-105 transition-transform">KELUAR SEKARANG</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="dash-header-user">
              <div className="dash-header-info text-right">
                <span className="dash-header-name">{user?.name || "User"}</span>
                <span className="dash-header-role">{user?.role?.name || "Karyawan"}</span>
              </div>
              <div className="dash-header-avatar overflow-hidden">
                {user?.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user?.name || "U").charAt(0)
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dash-content">
          <div className="dash-content-inner">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="dash-footer">
          <p className="dash-footer-text">
            &copy; {new Date().getFullYear()} HRMS Narwasthu Group. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Edit Profil Saya</h3>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('profile-photo-input')?.click()}>
                  <div className="w-24 h-24 rounded-full border-4 border-gray-50 overflow-hidden bg-gray-100 flex items-center justify-center shadow-inner relative">
                    {photoPreview || user?.profile_photo_url ? (
                      <img src={photoPreview || user?.profile_photo_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-gray-300" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    id="profile-photo-input" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-[#8B0000]">
                    <Camera size={14} />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tight">Klik untuk ganti foto</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-all text-sm"
                  placeholder="Masukkan nama lengkap..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                <input 
                  type="email" 
                  value={profileData.email}
                  disabled
                  className="w-full h-11 px-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">*Email utama tidak bisa diubah demi keamanan akun.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Nomor Telepon</label>
                <input 
                  type="text" 
                  value={profileData.phone}
                  onChange={e => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#8B0000] transition-all text-sm"
                  placeholder="Contoh: 0812..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Alamat Gedung/Rumah</label>
                <textarea 
                  value={profileData.address}
                  onChange={e => setProfileData({...profileData, address: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#8B0000] transition-all text-sm min-h-[100px] resize-none"
                  placeholder="Masukkan alamat lengkap..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="flex-1 h-11 bg-[#8B0000] text-white rounded-xl text-sm font-bold hover:bg-[#660000] transition-all shadow-lg shadow-red-900/20 disabled:opacity-50"
                >
                  {isSubmittingProfile ? "Mengirim..." : "Kirim Permintaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Modal - Change Password */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#8B0000]">
              <h3 className="text-lg font-bold text-white">Pengaturan Keamanan</h3>
              <button onClick={() => setIsSecurityModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Kata Sandi Saat Ini</label>
                <input 
                  type="password" 
                  value={passwordData.current_password}
                  onChange={e => setPasswordData({...passwordData, current_password: e.target.value})}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-all text-sm"
                  required
                />
              </div>

              <div className="h-px bg-gray-100 my-2"></div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Kata Sandi Baru</label>
                <input 
                  type="password" 
                  value={passwordData.new_password}
                  onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#8B0000] transition-all text-sm"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Konfirmasi Kata Sandi Baru</label>
                <input 
                  type="password" 
                  value={passwordData.new_password_confirmation}
                  onChange={e => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#8B0000] transition-all text-sm"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsSecurityModalOpen(false)} className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
                <button 
                  type="submit" 
                  disabled={isSubmittingPassword}
                  className="flex-3 h-11 bg-[#8B0000] text-white rounded-xl text-sm font-bold shadow-lg shadow-red-900/20 hover:bg-[#660000] transition-all disabled:opacity-50"
                >
                  {isSubmittingPassword ? "Menyimpan..." : "Perbarui Kata Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* App Settings Modal */}
      {isAppSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Pengaturan Aplikasi</h3>
              <button onClick={() => setIsAppSettingsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Suara Notifikasi</p>
                  <p className="text-[10px] text-gray-400">Mainkan suara saat ada pemberitahuan baru</p>
                </div>
                <div className="w-10 h-6 bg-green-500 rounded-full cursor-pointer relative transition-all">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Email Digest Mingguan</p>
                  <p className="text-[10px] text-gray-400">Kirim ringkasan absensi mingguan ke email</p>
                </div>
                <div className="w-10 h-6 bg-gray-200 rounded-full cursor-pointer relative transition-all">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 text-center italic">Versi Aplikasi: 1.0.5-MVP (Build 2026.03)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
