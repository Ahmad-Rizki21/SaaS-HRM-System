# HRM SaaS System (Development Phase)

Sistem Informasi Manajemen Sumber Daya Manusia (HRM) berbasis SaaS dengan arsitektur multi-tenant. Aplikasi ini dirancang untuk mengelola kehadiran, jadwal kerja, pengajuan cuti, dan klaim biaya (reimbursement) secara efisien untuk berbagai perusahaan dalam satu platform.

STATUS: MASIH DALAM TAHAP PENGEMBANGAN (DEVELOPMENT)

---

---

## Fitur Utama

Aplikasi ini mencakup modul-modul inti HRM yang sudah terintegrasi:

*   **Authentication & Security**: Multi-tenant login, Role-based Access Control (RBAC), hash password, dan session management.
*   **Manajemen SDM**: Data karyawan lengkap, request perubahan profil, upload foto, dan manajemen jabatan (Role).
*   **Kehadiran & Shift**: Check-in/out dengan validasi lokasi (dummy), manajemen shift kerja, jadwal mingguan, dan laporan absensi (Export Excel).
*   **Pengajuan Cuti**: Workflow pengajuan cuti, approval/rejection oleh atasan, dan history cuti.
*   **Reimbursement**: Pengajuan klaim biaya, sistem approval bertingkat, dan management saldo klaim.
*   **Komunikasi & Pengumuman**: Broadcast pengumuman ke seluruh karyawan melalui Dashboard (Kotak Pesan) dan Email Premium (HTML).
*   **Hari Libur**: Manajemen kalender libur nasional dan kebijakan libur internal perusahaan.
*   **Log Aktivitas**: Audit trail otomatis yang mencatat setiap aksi penting pengguna.

---

## Struktur Folder

```text
SaaS/
├── backend/                # Aplikasi Laravel 11 API (RESTful)
│   ├── app/
│   │   ├── Http/Controllers/ # Logika Bisnis (Auth, Attendance, Leave, Announcements, dsb)
│   │   ├── Models/           # Struktur Database & Relasi Eloquent
│   │   ├── Traits/           # Multi-tenancy logic (BelongsToCompany)
│   │   └── Mail/             # Sistem Mailing (Official Notifications)
│   ├── database/
│   │   ├── migrations/       # Skema database
│   │   └── seeders/          # Default data (Permissions, Admin)
│   ├── resources/views/      # Template Email Premium (Blade)
│   └── routes/api.php        # Definisi API Endpoints
├── frontend/               # Aplikasi Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/dashboard/    # Halaman Dashboard & Modul-modul HRMS
│   │   ├── components/       # UI Components
│   │   ├── contexts/         # Auth & Global State
│   │   └── lib/              # Axios instance & Utility functions
│   └── public/               # Logo & Aset Statis
└── postman/                # Alat bantu testing & dokumentasi
```

---

## Cara Setup (Lokal)

### Persiapan Backend
1. Masuk ke folder backend: `cd backend`
2. Install dependensi: `composer install`
3. Salin file environment: `cp .env.example .env` (Lakukan konfigurasi database di .env)
4. Generate app key: `php artisan key:generate`
5. Jalankan migrasi dan seeder: `php artisan migrate --seed`
6. Jalankan server: `php artisan serve`

### Persiapan Frontend
1. Masuk ke folder frontend: `cd frontend`
2. Install dependensi: `npm install`
3. Jalankan server development: `npm run dev`

---

## Dokumentasi API

Daftar lengkap endpoint API dapat dilihat pada file berikut:

👉 **[DOKUMENTASI API LENGKAP](./API_DOCUMENTATION.md)**

---
*Dikembangkan oleh Ahmad Rizki - PT. Artacomindo Jejaring Nusa - 2026*
