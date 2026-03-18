export const translations = {
  id: {
    // General
    dashboard: "Dashboard",
    attendance: "Kehadiran",
    leaves: "Cuti",
    reimbursements: "Klaim Biaya",
    announcements: "Pengumuman",
    holidays: "Hari Libur",
    employees: "Pegawai",
    roles: "Jabatan",
    activity_logs: "Log Aktivitas",
    settings: "Pengaturan",
    logout: "Keluar Akun",
    
    // Header & Quick Actions
    search: "Cari...",
    notifications: "Notifikasi",
    messages: "Pesan",
    profile: "Profil Saya",
    security: "Keamanan",
    app: "Aplikasi",
    
    // Dashboard Stats
    total_employees: "Total Karyawan",
    total_attendance: "Total Kehadiran",
    active_leaves: "Cuti Aktif",
    pending_reimbursements: "Klaim Pending",
    
    // Buttons
    add: "Tambah",
    edit: "Ubah",
    delete: "Hapus",
    save: "Simpan",
    cancel: "Batal",
    approving: "Menyetujui...",
    rejecting: "Menolak...",
    submitting: "Mengirim...",
    
    // Sidebar
    main_menu: "Menu Utama",
    human_resources: "Manajemen SDM",
    administration: "Administrasi",
    reports: "Laporan",
    system: "Sistem",
    attendance_history: "Riwayat Absensi",
    schedules: "Jadwal & Shift",
    approvals: "Persetujuan",
    attendance_report: "Laporan Absensi",
    reimbursement_report: "Laporan Klaim",
    leave_report: "Laporan Cuti",
    overtime_report: "Laporan Lembur",
    payroll_report: "Laporan Gaji",
    role_management: "Manajemen Jabatan",
    permissions: "Hak Akses",
    company_profile: "Profil Perusahaan",
    applications: "Pengajuan",
    overtime: "Lembur",
    communication: "Komunikasi",

    // Common Messages
    failed_to_fetch: "Gagal memuat data",
    success_save: "Data berhasil disimpan",
    confirm_delete: "Apakah Anda yakin ingin menghapus data ini?",
  },
  en: {
    // General
    dashboard: "Dashboard",
    attendance: "Attendance",
    leaves: "Leaves",
    reimbursements: "Reimbursements",
    announcements: "Announcements",
    holidays: "Holidays",
    employees: "Employees",
    roles: "Roles",
    activity_logs: "Activity Logs",
    settings: "Settings",
    logout: "Logout",
    
    // Header & Quick Actions
    search: "Search...",
    notifications: "Notifications",
    messages: "Messages",
    profile: "My Profile",
    security: "Security",
    app: "App Settings",
    
    // Dashboard Stats
    total_employees: "Total Employees",
    total_attendance: "Attendance Total",
    active_leaves: "Active Leaves",
    pending_reimbursements: "Pending Claims",
    
    // Buttons
    add: "Add New",
    edit: "Edit",
    delete: "Delete",
    save: "Save Changes",
    cancel: "Cancel",
    approving: "Approving...",
    rejecting: "Rejecting...",
    submitting: "Submitting...",
    
    // Sidebar
    main_menu: "Main Menu",
    human_resources: "Human Resources",
    administration: "Administration",
    reports: "Reports",
    system: "System",
    attendance_history: "Attendance History",
    schedules: "Schedules & Shifts",
    approvals: "Approvals",
    attendance_report: "Attendance Report",
    reimbursement_report: "Reimbursement Report",
    leave_report: "Leave Report",
    overtime_report: "Overtime Report",
    payroll_report: "Payroll Report",
    role_management: "Role Management",
    permissions: "Permissions",
    company_profile: "Company Profile",
    applications: "Applications",
    overtime: "Overtime",
    communication: "Communication",

    // Common Messages
    failed_to_fetch: "Failed to fetch data",
    success_save: "Changes saved successfully",
    confirm_delete: "Are you sure you want to delete this item?",
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.id;
