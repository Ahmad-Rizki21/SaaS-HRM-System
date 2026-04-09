<x-mail::message>
<div style="text-align: center; margin-bottom: 20px;">
    <img src="{{ env('FRONTEND_URL', 'http://localhost:3000') }}/logo.png" alt="{{ config('app.name') }} Logo" style="max-height: 60px; object-fit: contain;">
</div>

# Halo, {{ $user->name }}!

Selamat! Kamu telah didaftarkan sebagai bagian dari tim **{{ $user->company->name ?? 'Perusahaan kami' }}** dalam sistem HRMS Narwastu.

Silakan gunakan kredensial di bawah ini untuk mengakses dashboard karyawan kamu:

**URL Dashboard:** [{{ env('FRONTEND_URL', 'http://localhost:3000') }}]({{ env('FRONTEND_URL', 'http://localhost:3000') }})
**Email:** {{ $user->email }}
**Password Sementara:** `{{ $password }}`

<x-mail::button :url="env('FRONTEND_URL', 'http://localhost:3000') . '/verify-email?token=' . base64_encode($user->email)">
Verifikasi Akun & Login
</x-mail::button>

*Catatan: Demi keamanan, segera ubah password kamu setelah berhasil melakukan login pertama kali.*

Terima kasih,<br>
Tim HR {{ config('app.name') }}
</x-mail::message>
