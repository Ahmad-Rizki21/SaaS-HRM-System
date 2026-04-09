# HRM SaaS System (Development Phase)

Sistem Informasi Manajemen Sumber Daya Manusia (HRM) berbasis SaaS dengan arsitektur multi-tenant. Aplikasi ini dirancang untuk mengelola kehadiran, jadwal kerja, pengajuan cuti, dan klaim biaya (reimbursement) secara efisien untuk berbagai perusahaan dalam satu platform.

STATUS: MASIH DALAM TAHAP PENGEMBANGAN (DEVELOPMENT)

---

---

## Fitur Utama

Aplikasi ini mencakup modul-modul inti HRM yang sudah terintegrasi:

- **Authentication & Security**: Multi-tenant login, Role-based Access Control (RBAC), hash password, dan session management.
- **Manajemen SDM**: Data karyawan lengkap, request perubahan profil, upload foto, dan manajemen jabatan (Role).
- **Sistem Kehadiran Geofencing & Liveness**: Validasi ketat menggunakan GPS anti-mock dan deteksi wajah.
- **Koreksi Absen Mandiri**: Fitur pengajuan koreksi dengan workflow persetujuan (Approval) jika karyawan lupa absen pulang.
- **Delegasi & Manajemen WFH**: Memberikan izin kepada karyawan tertentu untuk absensi jarak jauh tanpa terpaku radius kantor, lengkap dengan pengumuman otomatis.
- **Manajemen Cuti & Reimbursement**: Approval berjenjang (Supervisor -> HR) otomatis.
- **Tukar Shift (Shift Swap)**: Workflow pertukaran jadwal antar rekan kerja dengan notifikasi real-time (FCM) & sistem approval atasan.
- **Hierarki Atasan (Supervisor)**: Fitur penunjukan atasan langsung untuk alur persetujuan (approval flow) yang lebih tertata dan otomatis.
- **Enterprise Audit & Reporting**: Laporan audit lengkap untuk aktivitas pertukaran shift dengan filter periode dan fitur Export Excel.
- **Pengajuan Cuti & Lembur**: Workflow pengajuan cuti & lembur, approval/rejection oleh atasan, dan history lengkap.
- **Reimbursement**: Pengajuan klaim biaya dengan sistem multiple attachments / lampiran foto sekaligus dan approval bertingkat.
- **Manajemen Kendaraan (Fleet Logging)**: Pencatatan operasional kendaraan efisien dengan alur 2-step (Keberangkatan & Kepulangan), validasi foto odometer, integrasi modal SOP & SK interaktif, serta notifikasi real-time ke Admin/HR saat kendaraan keluar/masuk.
- **Portofolio Manager (Mobile)**: Dashboard persetujuan terpadu bagi Manager untuk menyetujui Cuti, Lembur, Reimbursement, dan Log Kendaraan secara mobile.
- **Performance & Pagination**: Penanganan data skala besar dengan pagination di seluruh API dan proteksi error frontend (Array.isArray).
- **Manajemen Tugas (Tasks) & Evidence**: Pembagian tugas ke karyawan melalui dashboard admin/mobile, lengkap dengan fitur pelaporan aktivitas (foto Sebelum & Sesudah) serta verifikasi bukti kerja secara real-time.
- **Slip Gaji (Salary)**: Akses slip gaji digital bulanan secara aman.
- **Komunikasi & Pengumuman**: Broadcast pengumuman melalui Dashboard (Kotak Pesan) dan Email Premium (HTML).
- **Notifikasi Real-time & WebSocket**: Menggunakan native Laravel Reverb dengan notifikasi audio pintar di Web Dashboard.
- **Interactive Calendar Dashboard**: Dashboard kalender multifungsi dengan grafik pengajuan tertunda & integrasi API Pihak ketiga.
- **Sinkronisasi Hari Libur Nasional**: Sinkronisasi otomatis Hari Libur Nasional menggunakan proxy Google Calendar ICS Feed.
- **High-Availability Database (Enterprise)**: Arsitektur **Master-Slave Replication** (MySQL 8.4) dengan GTID Enabled untuk keamanan dan redundansi data.
- **Read-Write Splitting**: Optimasi performa Laravel dengan pemisahan trafik `Write` (Master) dan `Read` (Slave/Replica).

---

## Struktur Folder

```text
SaaS/
├── backend/                # Aplikasi Laravel 11 API (RESTful)
│   ├── app/                # Logika Bisnis (Auth, Attendance, Leave, Overtimes, dsb)
│   ├── database/           # Skema database & Migrations
│   └── routes/api.php      # Definisi API Endpoints
├── frontend/               # Dashboard Admin (Next.js 14)
│   ├── src/app/dashboard/  # Modul-modul Managerial HRMS
│   └── src/components/     # UI Components (Modern Design)
├── mobile/                 # Aplikasi Karyawan (Flutter & Dart)
│   ├── lib/api/            # Integrasi Mobile-to-Backend
│   └── lib/screens/        # UI/UX Mobile Modern (Inter Font, Natural Theme)
└── postman/                # Alat bantu testing (collection.json)
```

---

## Cara Setup (Docker) - REKOMENDASI CEPAT

Gunakan Docker untuk menjalankan seluruh stack (Backend, Frontend, MySQL, Redis, Nginx) secara otomatis:

1.  **Persiapan Environment**:
    Salin file `.env.docker` menjadi `.env` di direktori root.
    _(Pastikan file `.env` di folder `backend/` juga dikonfigurasi jika diperlukan secara lokal)._

2.  **Jalankan dengan Makefile (Disarankan)**:

    ```bash
    make start
    ```

    _Perintah ini akan melakukan build images dan menjalankan container secara otomatis._

3.  **Jalankan manual (Docker Compose)**:

    ```bash
    docker compose up -d
    ```

4.  **Akses Aplikasi**:
    - **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
    - **Backend API**: [http://localhost:8000/api](http://localhost:8000/api)
    - **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Cara Setup (Lokal manual)

### Persiapan Backend

1. Masuk ke folder backend: `cd backend`
2. Install dependensi: `composer install`
3. Salin file environment: `cp .env.example .env` (Lakukan konfigurasi database)
4. Jalankan migrasi dan seeder: `php artisan migrate --seed`
5. Jalankan server: `php artisan serve`

### Persiapan Mobile

1. Masuk ke folder mobile: `cd mobile`
2. Install dependensi: `flutter pub get`
3. Jalankan aplikasi: `flutter run` (Gunakan Emulator atau Device fisik)

---

## Dokumentasi API

Daftar lengkap endpoint API dapat dilihat pada file berikut:

👉 **[DOKUMENTASI API LENGKAP](./API_DOCUMENTATION.md)**

---

---

## Arsitektur Sinkronisasi (Master-Slave)

Sistem ini dikonfigurasi untuk menangani skala besar dengan memisahkan beban database:
1.  **Master (hrms-mysql-master)**: Menangani seluruh query `INSERT`, `UPDATE`, `DELETE`.
2.  **Slave (hrms-mysql-slave)**: Menangani seluruh query `SELECT` (Read).
3.  **GTID Mode**: Sinkronisasi data dijamin konsisten menggunakan Global Transaction Identifier.
4.  **Sticky Sessions**: Laravel memastikan jika dalam satu request ada operasi tulis, maka operasi baca selanjutnya dalam request yang sama akan diarahkan ke Master untuk menjaga konsistensi data instan.

---

_Dikembangkan oleh Ahmad Rizki - PT. Artacomindo Jejaring Nusa - 2026_
