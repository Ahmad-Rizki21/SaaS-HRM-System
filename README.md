# HRM SaaS System (Development Phase)

Sistem Informasi Manajemen Sumber Daya Manusia (HRM) berbasis SaaS dengan arsitektur multi-tenant. Aplikasi ini dirancang untuk mengelola kehadiran, jadwal kerja, pengajuan cuti, dan klaim biaya (reimbursement) secara efisien untuk berbagai perusahaan dalam satu platform.

STATUS: MASIH DALAM TAHAP PENGEMBANGAN (DEVELOPMENT)

---

## Teknologi yang Digunakan

### Backend
* Framework: Laravel 11
* Authentication: Laravel Sanctum (Token based)
* Database: MySQL
* Library Pendukung: Maatwebsite Excel (untuk laporan)

### Frontend
* Framework: Next.js (React)
* Styling: Vanilla CSS

---

## Struktur Folder

```text
SaaS/
├── backend/                # Aplikasi Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/# Logika API (Auth, Attendance, Leave, dsb)
│   │   │   └── Middleware/ # TenantMiddleware untuk isolasi data
│   │   ├── Models/         # Definisi Struktur Data & Relasi
│   │   └── Traits/         # BelongsToCompany untuk Multi-tenancy
│   ├── database/
│   │   ├── migrations/     # Skema database
│   │   └── seeders/        # Data awal (Roles, SuperAdmin)
│   └── routes/             # Definisi API Endpoints (api.php)
├── frontend/               # Aplikasi Next.js
│   ├── app/                # App Router (Pages & Layouts)
│   ├── components/         # Komponen UI Reusable
│   └── public/             # Aset statis
└── postman/                # Dokumentasi API
    ├── collection.json     # Postman Collection Terbaru
    └── environment.json    # Postman Environment
```

---

## Cara Setup (Lokal)

### Persiapan Backend
1. Masuk ke folder backend: cd backend
2. Install dependensi: composer install
3. Salin file environment: cp .env.example .env (Konfigurasi database di .env)
4. Generate app key: php artisan key:generate
5. Jalankan migrasi dan seeder: php artisan migrate --seed
6. Jalankan server: php artisan serve

### Persiapan Frontend
1. Masuk ke folder frontend: cd frontend
2. Install dependensi: npm install
3. Jalankan server development: npm run dev

---

## Dokumentasi API
Gunakan file di dalam folder postman/ dan import ke aplikasi Postman Anda untuk melihat daftar endpoint secara lengkap beserta panduan penggunaannya di bagian Overview Collection.

---
*Dikembangkan oleh Ahmad Rizki - PT. Artacomindo Jejaring Nusa - 2026*
