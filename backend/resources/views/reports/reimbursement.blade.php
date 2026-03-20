<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Formulir Klaim Reimbursement - {{ $reimbursement->user->name }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #8B0000; padding: 15px 0; margin-bottom: 25px; }
        .header img { width: 70px; position: absolute; left: 0; top: 10px; }
        .header h1 { color: #8B0000; margin: 0; font-size: 18px; text-transform: uppercase; }
        .header p { color: #666; margin: 3px 0 0; font-size: 11px; }
        .section-title { font-weight: bold; text-transform: uppercase; margin: 20px 0 10px; border-bottom: 1px solid #8B0000; padding-bottom: 3px; color: #8B0000; }
        .content { line-height: 1.5; margin-bottom: 35px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th, td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; }
        th { background: #f9f9f9; width: 150px; color: #666; }
        .total-row { background: #fff5f5; font-size: 13px; font-weight: bold; }
        .total-row td { border-top: 2px solid #8B0000; color: #8B0000; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 9px; }
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
        <h1>Formulir Klaim Reimbursement</h1>
        <p>No. Transaksi: REIM/{{ date('Ymd', strtotime($reimbursement->created_at)) }}/{{ str_pad($reimbursement->id, 5, '0', STR_PAD_LEFT) }}</p>
    </div>

    <div class="content">
        <div class="section-title">Informasi Karyawan</div>
        <table>
            <tr>
                <th>Nama Lengkap</th>
                <td>: {{ $reimbursement->user->name }}</td>
            </tr>
            <tr>
                <th>NIK</th>
                <td>: {{ $reimbursement->user->nik }}</td>
            </tr>
            <tr>
                <th>Jabatan</th>
                <td>: {{ $reimbursement->user->role?->name ?? 'Karyawan' }}</td>
            </tr>
        </table>

        <div class="section-title">Rincian Klaim</div>
        <table>
            <tr>
                <th>Tanggal Pengajuan</th>
                <td>: {{ date('d F Y', strtotime($reimbursement->created_at)) }}</td>
            </tr>
            <tr>
                <th>Kategori Klaim</th>
                <td>: {{ ucfirst($reimbursement->type) }}</td>
            </tr>
            <tr>
                <th>Deskripsi Keperluan</th>
                <td>: {{ $reimbursement->reason }}</td>
            </tr>
            <tr>
                <th>Status Saat Ini</th>
                <td>: 
                    <span class="badge badge-{{ $reimbursement->status }}">
                        {{ strtoupper($reimbursement->status) }}
                    </span>
                </td>
            </tr>
            <tr class="total-row">
                <td>TOTAL KLAIM</td>
                <td>: Rp. {{ number_format($reimbursement->amount, 0, ',', '.') }}</td>
            </tr>
        </table>

        @if($reimbursement->attachment_url)
        <div style="margin-top: 40px; page-break-inside: avoid;">
            <div class="section-title">Lampiran Bukti (Preview)</div>
            <p style="font-size: 9px; color: #666; margin-bottom: 10px;">Bukti pembayaran terlampir secara elektronik di sistem.</p>
            <div style="text-align: center; border: 1px dashed #ccc; padding: 20px; color: #999;">
                [ BUKTI LAMPIRAN DITERBITKAN TERPISAH ]
            </div>
        </div>
        @endif
    </div>

    <table class="footer-table">
        <tr>
            <td>
                <p>Diajukan oleh,</p>
                <div class="signature"></div>
                <p><strong>({{ $reimbursement->user->name }})</strong></p>
            </td>
            <td>
                <p>Diperiksa oleh,</p>
                <div class="signature"></div>
                <p><strong>(Manager)</strong></p>
            </td>
            <td>
                <p>Disetujui oleh,</p>
                <div class="signature"></div>
                <p><strong>(Finance / HRD)</strong></p>
            </td>
        </tr>
    </table>

    <div style="position: fixed; bottom: 0; left: 0; right: 0; text-align: center; color: #ccc; font-size: 7px; padding: 10px 0;">
        Dokumen ini merupakan ringkasan transaksi elektronik yang sah di Sistem HRM - Tgl Cetak: {{ date('d/m/Y H:i') }}
    </div>
</body>
</html>
