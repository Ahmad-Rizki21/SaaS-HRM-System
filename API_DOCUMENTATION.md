# Dokumentasi API Endpoints 🛠️

Seluruh request API harus menyertakan header `Accept: application/json`. Untuk endpoint yang membutuhkan autentikasi, sertakan header `Authorization: Bearer {token}`.

## 🔑 Autentikasi
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/login` | Login user & mendapatkan token |
| `POST` | `/api/logout` | Logout user & menghapus token |
| `GET` | `/api/user` | Mendapatkan data profil user saat ini |

## 👥 Manajemen Pegawai
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/employees` | List semua pegawai (Tenant-specific) |
| `POST` | `/api/employees` | Registrasi pegawai baru |
| `GET` | `/api/employees/{id}` | Detail data pegawai |
| `PUT` | `/api/employees/{id}` | Update data pegawai |
| `DELETE` | `/api/employees/{id}` | Hapus data pegawai |

## ⏰ Kehadiran & Shift
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/attendance/check-in` | Absensi masuk |
| `POST` | `/api/attendance/check-out` | Absensi pulang |
| `GET` | `/api/attendance/history` | Riwayat absensi user |
| `GET` | `/api/attendance/export` | Export laporan absensi ke Excel |
| `GET` | `/api/shifts` | List semua jam kerja/shift |
| `POST` | `/api/shifts` | Buat master shift baru |

## 📅 Cuti & Reimbursement
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/leave` | List pengajuan cuti |
| `POST` | `/api/leave` | Ajukan cuti baru |
| `POST` | `/api/leave/{id}/approve` | Persetujuan cuti oleh atasan |
| `GET` | `/api/reimbursements` | List klaim biaya |
| `POST` | `/api/reimbursements` | Ajukan klaim baru |
| `POST` | `/api/reimbursements/{id}/approve` | Persetujuan klaim biaya |

## 📢 Pengumuman & Hari Libur
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/announcements` | List semua pengumuman |
| `POST` | `/api/announcements` | Buat pengumuman baru (Broadcast Email & Kotak Pesan) |
| `GET` | `/api/holidays` | List kalender hari libur |
| `POST` | `/api/holidays` | Tambah hari libur internal kantor |

## 🛠️ Sistem & Settings
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/roles` | List semua jabatan |
| `GET` | `/api/permissions` | List semua hak akses yang tersedia |
| `GET` | `/api/activity-logs` | Lihat riwayat aktivitas sistem |
| `GET` | `/api/notifications` | List notifikasi & pesan (Kotak Pesan) |
| `PUT` | `/api/notifications/{id}/read` | Tandai notifikasi sudah dibaca |

---
*Gunakan file `postman/collection.json` untuk dokumentasi lebih detail (contoh body request & response).*
