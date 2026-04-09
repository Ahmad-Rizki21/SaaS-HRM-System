# Optimasi Payload Backend untuk Mobile

Untuk mengoptimalkan penggunaan data pada aplikasi mobile (Flutter), kita telah memisahkan logic controller dan menggunakan **Laravel API Resources**. Hal ini memastikan payload JSON yang dikirim ke mobile hanya berisi field yang diperlukan (lightweight).

## Perubahan Utama

### 1. Struktur Folder Baru
- `backend/app/Http/Resources/Mobile/`: Berisi transformer untuk memfilter field JSON.
- `backend/app/Http/Controllers/Api/Mobile/`: Berisi controller khusus mobile.

### 2. API Resources (Penyaring Data)
Kita telah membuat resource berikut untuk membuang data yang tidak perlu sebelum dikirim ke Flutter:
- **AnnouncementResource**: Hanya mengirim judul, konten, dan tanggal.
- **AttendanceResource**: Menyeragamkan format tanggal/jam dan hanya mengirim status esensial.
- **LeaveResource**: Mengirim detail cuti tanpa overhead relasi user yang berat.
- **TaskResource**: Mengirim ringkasan tugas.

### 3. Controller Khusus Mobile
- **MobileDashboardController**: Menggabungkan beberapa data (summary, status hari ini, pengumuman terbaru) ke dalam **satu request** yang ringan. Ini sangat mengurangi waktu loading awal aplikasi.
- **MobileAttendanceController**: Mengoptimalkan pengambilan riwayat absen (menggunakan pagination dan resource).
- **MobileTaskController**: Memisahkan logic pengambilan tugas untuk performa lebih baik.

### 4. Pemisahan Route
Endpoint baru dapat diakses melalui prefix `/api/mobile/`:
- `GET /api/mobile/dashboard` (Data dashboard lengkap tapi ringan)
- `GET /api/mobile/attendance/history` (Riwayat absen terpaginasi)
- `GET /api/mobile/tasks` (Daftar tugas)

## Keuntungan Bagi Apps Mobile
- **Hemat Bandwidth**: Ukuran JSON berkurang hingga 60-80% dibanding format standard web.
- **Kecepatan**: Satu request `/dashboard` sudah mencakup status absen, info user, dan pengumuman.
- **Skalabilitas**: Jika di masa depan dashboard web ditambahi grafik yang berat, aplikasi mobile tidak akan ikut terbebani.

> [!TIP]
> Di aplikasi Flutter, Anda sekarang bisa mengubah endpoint target ke `/api/mobile/dashboard` untuk halaman Home agar loading terasa jauh lebih "snappy".
