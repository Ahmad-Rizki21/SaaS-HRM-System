<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Formulir Lembur - {{ $overtime->user->name }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #8B0000; padding: 15px 0; margin-bottom: 25px; }
        .header img { width: 70px; position: absolute; left: 0; top: 10px; }
        .header h1 { color: #8B0000; margin: 0; font-size: 18px; text-transform: uppercase; }
        .header p { color: #666; margin: 3px 0 0; font-size: 11px; }
        .section-title { font-weight: bold; text-transform: uppercase; margin: 20px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 3px; color: #8B0000; }
        .content { line-height: 1.5; margin-bottom: 35px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th, td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; }
        th { background: #f9f9f9; width: 150px; color: #666; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 9px; }
        .badge-approved { background: #c6f6d5; color: #22543d; }
        .badge-pending { background: #feebc8; color: #744210; }
        .badge-rejected { background: #fed7d7; color: #822727; }
        .footer-table { width: 100%; margin-top: 50px; border: none; }
        .footer-table td { text-align: center; width: 33.33%; border: none; padding-top: 30px; }
        .signature { height: 60px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('logo.png') }}" alt="Logo">
        <h1>Formulir Pengajuan Lembur</h1>
        <p>No. Transaksi: OVT/{{ date('Ymd', strtotime($overtime->created_at)) }}/{{ str_pad($overtime->id, 5, '0', STR_PAD_LEFT) }}</p>
    </div>

    <div class="content">
        <div class="section-title">Informasi Karyawan</div>
        <table>
            <tr>
                <th>Nama Lengkap</th>
                <td>: {{ $overtime->user->name }}</td>
            </tr>
            <tr>
                <th>NIK</th>
                <td>: {{ $overtime->user->nik }}</td>
            </tr>
            <tr>
                <th>Jabatan</th>
                <td>: {{ $overtime->user->role?->name ?? 'Karyawan' }}</td>
            </tr>
        </table>

        <div class="section-title">Rincian Lembur</div>
        <table>
            <tr>
                <th>Tanggal Lembur</th>
                <td>: {{ date('d F Y', strtotime($overtime->date)) }}</td>
            </tr>
            <tr>
                <th>Waktu Mulai</th>
                <td>: {{ $overtime->start_time }}</td>
            </tr>
            <tr>
                <th>Waktu Selesai</th>
                <td>: {{ $overtime->end_time }}</td>
            </tr>
            <tr>
                <th>Total Durasi</th>
                <td>: {{ $overtime->duration }} Jam</td>
            </tr>
            <tr>
                <th>Tugas / Pekerjaan</th>
                <td>: {{ $overtime->reason }}</td>
            </tr>
            <tr>
                <th>Status Persetujuan</th>
                <td>: 
                    <span class="status-badge badge-{{ $overtime->status }}">
                        {{ strtoupper($overtime->status) }}
                    </span>
                </td>
            </tr>
        </table>
    </div>

    <table class="footer-table">
        <tr>
            <td>
                <p>Diajukan oleh,</p>
                <div class="signature"></div>
                <p><strong>({{ $overtime->user->name }})</strong></p>
            </td>
            <td>
                <p>Mengetahui,</p>
                <div class="signature"></div>
                <p><strong>(Manager)</strong></p>
            </td>
            <td>
                <p>Disetujui oleh,</p>
                <div class="signature"></div>
                <p><strong>(HRD Department)</strong></p>
            </td>
        </tr>
    </table>

    <div style="position: fixed; bottom: 0; left: 0; right: 0; text-align: center; color: #ccc; font-size: 8px;">
        Dokumen ini diterbitkan secara elektronik melalui Sistem HRM - {{ date('d/m/Y H:i:s') }}
    </div>
</body>
</html>
