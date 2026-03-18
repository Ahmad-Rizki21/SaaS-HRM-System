# HRM SaaS MVP (Attendance, Leave, Approval)

## Overview

Project ini adalah MVP (Minimum Viable Product) untuk aplikasi SaaS HRM yang mencakup:

- Absensi berbasis GPS (radius kantor)
- Manajemen cuti (leave)
- Sistem approval (persetujuan)
- Multi-tenant (multi perusahaan)

Tujuan utama:

> Membuat sistem yang bisa langsung dipakai perusahaan dan menjadi fondasi untuk SaaS yang scalable.

---

## Tech Stack

### Backend

- Laravel 12 (API Only)
- Laravel Sanctum (Authentication)
- Redis (Queue & caching)

### Frontend Web

- Next.js

### Mobile App

- Flutter

### Database

- MySql

---

## Architecture

[ Mobile App (Flutter) ]
|
[ Web App (Next.js) ]
|
[ API ]
(Laravel Backend)
|
[ MySql ]
|
[ Redis ]

---

## Core Features (MVP Scope)

### 1. Authentication

- Login / Logout
- Token-based auth (Sanctum)

### 2. Multi-Tenant

- 1 company = 1 tenant
- Semua data terisolasi dengan `company_id`

### 3. Attendance (Absensi GPS)

- Check-in berdasarkan lokasi
- Validasi radius kantor
- Mencegah double check-in

### 4. Leave (Cuti)

- Submit cuti
- Status: pending, approved, rejected

### 5. Approval System

- Manager dapat approve/reject request

### 6. Dashboard (Basic)

- Ringkasan absensi
- Status cuti

---

## Business Flow

### Company Registration

1. Company dibuat
2. Admin dibuat
3. Admin menambahkan karyawan

---

### Attendance Flow

1. User membuka aplikasi mobile
2. Sistem mengambil GPS (latitude, longitude)
3. Data dikirim ke backend
4. Backend:
   - Hitung jarak ke kantor
   - Validasi radius
   - Cek apakah sudah check-in
5. Simpan data attendance

---

### Leave Flow

1. User submit cuti
2. Status = pending
3. Manager menerima request
4. Manager approve/reject
5. Status diperbarui

---

## Database Schema (MVP)

### companies

id
name
email
created_at

### users

id
company_id
name
email
password
role (admin, manager, employee)

### offices

id
company_id
name
latitude
longitude
radius_meter

### attendances

id
user_id
date
check_in
check_out
latitude
longitude
status (valid/invalid)

### leaves

id
user_id
start_date
end_date
reason
status (pending/approved/rejected)
approved_by

---

## Core Logic

### Attendance Validation

- Hitung jarak menggunakan Haversine formula
- Bandingkan dengan radius kantor
  if distance <= radius:
  status = VALID
  else:
  status = INVALID

---

### Prevent Double Check-in

if attendance exists today:
reject request

---

### Role Access

- Admin → full access
- Manager → approve/reject
- Employee → submit data

---

## API Endpoints

### Auth

POST /login
POST /logout

### Attendance

POST /attendance/check-in
POST /attendance/check-out
GET /attendance/history

### Leave

POST /leave
GET /leave
POST /leave/{id}/approve
POST /leave/{id}/reject

---

## Project Structure (Backend)

## Project Structure (Backend)

app/
├── Modules/
│ ├── Auth/
│ ├── Attendance/
│ ├── Leave/
│ ├── Approval/
│ └── Company/
├── Services/
├── Repositories/

---

## Development Roadmap

### Week 1

- Setup Laravel
- Authentication
- Multi-tenant basic

### Week 2

- Attendance (GPS + radius)
- API testing

### Week 3

- Leave + approval system

### Week 4

- Integrasi Next.js
- Dashboard basic

### Week 5

- Integrasi Flutter (mobile)

---

## Future Development

- Payroll system
- Reimbursement
- Notification system
- Reporting & analytics
- Subscription & billing (SaaS monetization)

---

## Notes

- Fokus pada MVP, hindari over-engineering
- Gunakan API-first approach
- Pastikan struktur code modular dan scalable
- Multi-tenant harus dirancang dari awal

---

## Goal

MVP ini harus:

- Bisa digunakan oleh perusahaan
- Stabil untuk operasional dasar HR
- Siap dikembangkan menjadi SaaS berbayar
