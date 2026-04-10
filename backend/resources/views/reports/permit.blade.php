<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Permohonan Izin - {{ $permit->user->name }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #8B0000; padding: 20px 0; margin-bottom: 30px; }
        .header img { width: 80px; position: absolute; left: 0; top: 15px; }
        .header h1 { color: #8B0000; margin: 0; font-size: 20px; text-transform: uppercase; }
        .header p { color: #666; margin: 5px 0 0; font-size: 12px; }
        .section-title { font-weight: bold; text-transform: uppercase; margin: 25px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #8B0000; }
        .content { line-height: 1.6; margin-bottom: 40px; }
        .info-table { width: 100%; margin-bottom: 30px; }
        .info-table td { padding: 6px 0; vertical-align: top; }
        .label { width: 150px; color: #666; font-weight: bold; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 10px; }
        .status-approved { background: #e6fffa; color: #319795; }
        .status-pending { background: #fffaf0; color: #dd6b20; }
        .status-rejected { background: #fff5f5; color: #e53e3e; }
        .footer-table { width: 100%; margin-top: 60px; }
        .footer-table td { text-align: center; width: 33.33%; }
        .signature-box { height: 70px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('logo.png') }}" alt="Logo">
        <h1>Surat Permohonan Izin</h1>
        <p>Nomor: PR/{{ date('Y/m', strtotime($permit->created_at)) }}/{{ str_pad($permit->id, 4, '0', STR_PAD_LEFT) }}</p>
    </div>

    <div class="content">
        <p>Yang bertanda tangan di bawah ini:</p>
        <table class="info-table">
            <tr>
                <td class="label">Nama Lengkap</td>
                <td style="width: 20px;">:</td>
                <td><strong>{{ $permit->user->name }}</strong></td>
            </tr>
            <tr>
                <td class="label">NIK</td>
                <td>:</td>
                <td>{{ $permit->user->nik }}</td>
            </tr>
            <tr>
                <td class="label">Jabatan</td>
                <td>:</td>
                <td>{{ $permit->user->role?->name ?? 'Karyawan' }}</td>
            </tr>
        </table>

        <p>Mengajukan permohonan izin dengan rincian sebagai berikut:</p>
        <table class="info-table">
            <tr>
                <td class="label">Jenis Izin</td>
                <td style="width: 20px;">:</td>
                <td>{{ $permit->type }}</td>
            </tr>
            <tr>
                <td class="label">Tanggal Mulai</td>
                <td>:</td>
                <td>{{ date('d F Y', strtotime($permit->start_date)) }}</td>
            </tr>
            <tr>
                <td class="label">Tanggal Selesai</td>
                <td>:</td>
                <td>{{ date('d F Y', strtotime($permit->end_date)) }}</td>
            </tr>
            <tr>
                <td class="label">Alasan Izin</td>
                <td>:</td>
                <td>{{ $permit->reason }}</td>
            </tr>
            <tr>
                <td class="label">Status Pengajuan</td>
                <td>:</td>
                <td>
                    <span class="status-badge status-{{ $permit->status }}">
                        {{ strtoupper($permit->status) }}
                    </span>
                </td>
            </tr>
        </table>
    </div>

    <p style="margin-top: 20px;">Demikian surat permohonan ini saya sampaikan, mohon kiranya Bapak/Ibu pimpinan dapat menyetujui permohonan ini. Atas perhatiannya saya ucapkan terima kasih.</p>

    <table class="footer-table">
        <tr>
            <td>
                <p>Diajukan oleh,</p>
                <div class="signature-box">
                    @if($permit->signature)
                        <img src="{{ $permit->signature }}" style="max-height: 100%; max-width: 100%;">
                    @endif
                </div>
                <p><strong>({{ $permit->user->name }})</strong></p>
                <p style="font-size: 9px; margin-top: -10px;">{{ date('d-M-Y', strtotime($permit->created_at)) }}</p>
            </td>
            <td>
                <p>Mengetahui,</p>
                <div class="signature-box"></div>
                <p><strong>(Manager)</strong></p>
            </td>
            <td>
                <p>Menyetujui,</p>
                <div class="signature-box"></div>
                <p><strong>(HRD Department)</strong></p>
            </td>
        </tr>
    </table>

    <div style="position: fixed; bottom: 0; left: 0; right: 0; text-align: center; color: #ccc; font-size: 8px;">
        Dokumen ini diterbitkan secara elektronik melalui Aplikasi HRM - {{ date('d/m/Y H:i:s') }}
    </div>
</body>
</html>
