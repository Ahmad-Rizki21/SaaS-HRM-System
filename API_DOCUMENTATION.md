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
| `POST` | `/api/attendance/check-in` | Absensi masuk (Geo/Selfie) |
| `POST` | `/api/attendance/check-out` | Absensi pulang |
| `GET` | `/api/attendance/today` | Status absensi hari ini |
| `GET` | `/api/attendance/history` | Riwayat absensi user |
| `GET` | `/api/attendance/export` | Export laporan absensi ke Excel |
| `GET` | `/api/shifts` | List semua jam kerja/shift |
| `POST` | `/api/shifts` | Buat master shift baru |
| `GET` | `/api/shift-swap` | List riwayat tukar shift user |
| `POST` | `/api/shift-swap` | Ajukan pertukaran shift baru |
| `POST` | `/api/shift-swap/{id}/respond` | Respon rekan (Terima/Tolak) |
| `POST` | `/api/shift-swap/{id}/approve` | Approval akhir Manager/Atasan |
| `GET` | `/api/shift-swap/report` | Laporan audit semua tukar shift |
| `GET` | `/api/shift-swap/export` | Export laporan tukar shift ke Excel |

## 📅 Cuti, Lembur & Reimbursement
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/leave` | List pengajuan cuti |
| `POST` | `/api/leave` | Ajukan cuti baru |
| `POST` | `/api/leave/{id}/approve` | Persetujuan cuti |
| `POST` | `/api/leave/{id}/reject` | Penolakan cuti |
| `GET` | `/api/overtimes` | List pengajuan lembur |
| `POST` | `/api/overtimes` | Ajukan lembur baru |
| `POST` | `/api/overtimes/{id}/approve` | Persetujuan lembur |
| `POST` | `/api/overtimes/{id}/reject` | Penolakan lembur |
| `GET` | `/api/reimbursements` | List klaim biaya |
| `POST` | `/api/reimbursements` | Ajukan klaim baru (Support multiple `attachments[]` as files) |
| `POST` | `/api/reimbursements/{id}/approve` | Persetujuan klaim biaya |

## 💰 Gaji & Tugas
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/salary` | List slip gaji karyawan |
| `GET` | `/api/tasks` | List tugas/pekerjaan |
| `POST` | `/api/tasks/{id}/status` | Update status tugas (Todo/Done) |

## 📢 Pengumuman & Hari Libur
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/announcements` | List semua pengumuman |
| `POST` | `/api/announcements` | Buat pengumuman baru |
| `GET` | `/api/holidays` | List kalender hari libur |
| `POST` | `/api/holidays` | Tambah hari libur internal |

## 🏗️ Manajemen Proyek (Konstruksi)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/projects/dashboard` | Dashboard KPI ringkasan proyek |
| `GET` | `/api/projects` | List semua proyek (filter: status, search) |
| `POST` | `/api/projects` | Buat proyek baru |
| `GET` | `/api/projects/{id}` | Detail proyek + summary RAB vs aktual |
| `PUT` | `/api/projects/{id}` | Update data proyek |
| `DELETE` | `/api/projects/{id}` | Hapus proyek |
| `POST` | `/api/projects/{id}/budgets` | Tambah item RAB (Rencana Anggaran Biaya) |
| `PUT` | `/api/projects/{id}/budgets/{bid}` | Update item RAB |
| `DELETE` | `/api/projects/{id}/budgets/{bid}` | Hapus item RAB |
| `POST` | `/api/projects/{id}/costs` | Catat biaya aktual proyek |
| `POST` | `/api/projects/{id}/costs/{cid}/approve` | Setujui biaya proyek |
| `POST` | `/api/projects/{id}/costs/{cid}/reject` | Tolak biaya proyek |
| `POST` | `/api/projects/{id}/contracts` | Tambah kontrak proyek |
| `PUT` | `/api/projects/{id}/contracts/{cid}` | Update kontrak |
| `DELETE` | `/api/projects/{id}/contracts/{cid}` | Hapus kontrak |
| `POST` | `/api/projects/{id}/schedules` | Tambah jadwal/milestone proyek |
| `PUT` | `/api/projects/{id}/schedules/{sid}` | Update jadwal |
| `DELETE` | `/api/projects/{id}/schedules/{sid}` | Hapus jadwal |
| `POST` | `/api/projects/{id}/cash-flows` | Catat transaksi arus kas |
| `DELETE` | `/api/projects/{id}/cash-flows/{cfid}` | Hapus transaksi arus kas |

## 🛠️ Sistem & Settings
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/roles` | List semua jabatan |
| `GET` | `/api/permissions` | List semua hak akses |
| `GET` | `/api/activity-logs` | Lihat riwayat aktivitas sistem |
| `GET` | `/api/notifications` | List notifikasi & pesan |
| `PUT` | `/api/notifications/{id}/read` | Tandai notifikasi sudah dibaca |
| `POST` | `/api/notifications/read-all` | Tandai semua sudah dibaca |
| `POST` | `/api/notifications-clear` | Hapus seluruh riwayat notifikasi |
| `POST` | `/api/profile/update` | Update data profil user |
| `POST` | `/api/profile/upload-photo` | Upload foto profil |
| `POST` | `/api/user/change-password` | Ganti password user |

---
*Gunakan file `postman/collection.json` untuk dokumentasi lebih detail (contoh body request & response).*

