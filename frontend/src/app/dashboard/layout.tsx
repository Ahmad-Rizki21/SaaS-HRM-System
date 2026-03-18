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
  Laptop
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
      { name: "Jadwal & Shift", href: "/dashboard/schedules", permission: 'manage-company' },
    ]
  },
  
  { name: "Administrasi", isHeading: true },
  { 
    name: "Pengajuan", 
    icon: FileText,
    submenus: [
      { name: "Cuti Karyawan", href: "/dashboard/leaves" },
      { name: "Reimbursement", href: "/dashboard/reimbursements" },
      { name: "Persetujuan (Approval)", href: "/dashboard/approvals", permission: 'approve-leaves' },
    ]
  },
  {
    name: "Laporan",
    icon: CreditCard,
    permission: 'view-employees',
    submenus: [
      { name: "Laporan Absensi", href: "/dashboard/reports/attendance", permission: 'view-employees' },
      { name: "Laporan Gaji", href: "/dashboard/reports/payroll", permission: 'view-employees' },
    ]
  },
  { name: "Sistem", isHeading: true, permission: 'manage-roles' },
  {
    name: "Pengaturan",
    icon: Settings,
    permission: 'manage-roles',
    submenus: [
      { name: "Manajemen Jabatan/Role", href: "/dashboard/roles" },
      { name: "Hak Akses", href: "/dashboard/permissions" },
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
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', address: '' });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        address: (user as any).address || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    try {
      await axiosInstance.post("/profile-requests", { new_data: profileData });
      alert("Permintaan update profil berhasil dikirim. Menunggu persetujuan admin.");
      setIsProfileModalOpen(false);
      refreshUser(); // Refresh user data after successful submission
    } catch (e: any) {
      alert("Gagal mengirim permintaan: " + (e.response?.data?.message || e.message));
    } finally {
      setIsSubmittingProfile(false);
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
                <span className="dash-notification-dot"></span>
              </button>

              <button 
                className={`dash-header-icon-btn ${activeHeaderDropdown === 'notif' ? 'text-[#8B0000]' : ''}`} 
                title="Notifikasi"
                onClick={() => toggleHeaderDropdown('notif')}
              >
                <Bell size={18} />
                <span className="dash-notification-dot"></span>
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
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">2 BARU</span>
                  </div>
                  <ul className="dash-dropdown-list">
                    <li className="dash-dropdown-item">
                      <div className="dash-dropdown-icon"><User size={16} /></div>
                      <div className="dash-dropdown-content">
                        <span className="dash-dropdown-label">Siska HRD</span>
                        <span className="dash-dropdown-desc">Mohon review pengajuan cuti Budi secepatnya.</span>
                        <span className="dash-dropdown-time">2 menit yang lalu</span>
                      </div>
                    </li>
                    <li className="dash-dropdown-item">
                      <div className="dash-dropdown-icon"><Mail size={16} /></div>
                      <div className="dash-dropdown-content">
                        <span className="dash-dropdown-label">System Admin</span>
                        <span className="dash-dropdown-desc">Pembaruan server dijadwalkan pukul 24:00 WIB.</span>
                        <span className="dash-dropdown-time">1 jam yang lalu</span>
                      </div>
                    </li>
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
                    <li className="dash-dropdown-item">
                      <div className="dash-dropdown-icon"><Bell size={16} /></div>
                      <div className="dash-dropdown-content">
                        <span className="dash-dropdown-label">Pengingat Masuk</span>
                        <span className="dash-dropdown-desc">Sudah waktunya absen masuk hari ini.</span>
                        <span className="dash-dropdown-time">5 menit yang lalu</span>
                      </div>
                    </li>
                    <li className="dash-dropdown-item">
                      <div className="dash-dropdown-icon"><CalendarIcon size={16} /></div>
                      <div className="dash-dropdown-content">
                        <span className="dash-dropdown-label">Rapat Tim</span>
                        <span className="dash-dropdown-desc">Rapat koordinasi mingguan dimulai 15 menit lagi.</span>
                        <span className="dash-dropdown-time">10 menit yang lalu</span>
                      </div>
                    </li>
                  </ul>
                  <div className="dash-dropdown-footer">
                    <button className="dash-dropdown-all-btn">Tandai Sudah Dibaca</button>
                  </div>
                </div>
              )}

              {activeHeaderDropdown === 'settings' && (
                <div className="dash-header-dropdown w-[220px]!">
                  <div className="dash-dropdown-header">
                    <span className="dash-dropdown-title">Pengaturan</span>
                  </div>
                  <ul className="dash-dropdown-list">
                    <li className="dash-dropdown-item items-center! cursor-pointer" onClick={() => { setIsProfileModalOpen(true); setActiveHeaderDropdown(null); }}>
                      <div className="dash-dropdown-icon w-8! h-8!"><User size={14} /></div>
                      <div className="dash-dropdown-content">
                        <span className="dash-dropdown-label mb-0! text-sm">Profil Saya</span>
                      </div>
                    </li>
                    <li className="dash-dropdown-item items-center!">
                      <div className="dash-dropdown-icon w-8! h-8!"><Shield size={14} /></div>
                      <div className="dash-dropdown-content">
                        <span className="dash-dropdown-label mb-0! text-sm">Keamanan</span>
                      </div>
                    </li>
                    <li className="dash-dropdown-item items-center!">
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
              <div className="dash-header-avatar">{(user?.name || "U").charAt(0)}</div>
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
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Ajukan Perubahan Profil</h3>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
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
    </div>
  );
}
