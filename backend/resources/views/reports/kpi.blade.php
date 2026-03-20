<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>KPI Report - {{ $review->user->name }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #8B0000; padding-bottom: 20px; margin-bottom: 30px; }
        .header img { width: 80px; position: absolute; left: 0; top: 0; }
        .header h1 { color: #8B0000; margin: 0; font-size: 24px; text-transform: uppercase; }
        .header p { color: #666; margin: 5px 0 0; font-size: 13px; }
        .section-title { background: #f8f8f8; padding: 8px 15px; border-left: 5px solid #8B0000; font-weight: bold; text-transform: uppercase; margin: 20px 0 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #8B0000; color: white; font-weight: bold; }
        .score-box { background: #8B0000; color: white; padding: 25px; border-radius: 15px; text-align: center; display: inline-block; min-width: 120px; float: right; }
        .score-val { font-size: 36px; font-weight: bold; line-height: 1; margin: 5px 0; }
        .info-grid { width: 100%; margin-bottom: 30px; }
        .info-grid td { border: none; padding: 4px 0; vertical-align: top; }
        .label { color: #888; width: 120px; font-weight: bold; }
        .footer { margin-top: 60px; }
        .footer-table { width: 100%; border: none; }
        .footer-table td { border: none; text-align: center; }
        .signature-space { height: 80px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('logo.png') }}" alt="Logo">
        <h1>Laporan Penilaian KPI</h1>
        <p>Periode: <strong>{{ $review->period }}</strong></p>
    </div>

    <div style="overflow: hidden;">
        <div class="score-box">
            <div style="font-size: 10px; font-weight: bold; opacity: 0.8;">SKOR AKHIR</div>
            <div class="score-val">{{ number_format($review->score_total, 1) }}</div>
            <div style="font-size: 10px; font-weight: bold; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 10px;">
                {{ $review->score_total >= 80 ? 'EXCELLENT' : 'GOOD' }}
            </div>
        </div>

        <table class="info-grid">
            <tr>
                <td class="label">Nama Karyawan</td>
                <td style="width: 20px;">:</td>
                <td><strong>{{ $review->user->name }}</strong></td>
            </tr>
            <tr>
                <td class="label">NIK</td>
                <td>:</td>
                <td>{{ $review->user->nik }}</td>
            </tr>
            <tr>
                <td class="label">Jabatan</td>
                <td>:</td>
                <td>{{ $review->user->role?->name ?? 'Karyawan' }}</td>
            </tr>
            <tr>
                <td class="label">Penilai</td>
                <td>:</td>
                <td>{{ $review->reviewer->name }}</td>
            </tr>
        </table>
    </div>

    <div class="section-title">Rincian Penilaian</div>
    <table>
        <thead>
            <tr>
                <th>Kategori Penilaian</th>
                <th style="width: 100px; text-align: center;">Skor</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Kedisplinan & Kehadiran</td>
                <td style="text-align: center;">{{ $review->score_discipline }}</td>
                <td style="color: {{ $review->score_discipline >= 80 ? 'green' : 'orange' }}; font-weight: bold;">{{ $review->score_discipline >= 80 ? 'Sesuai Target' : 'Perlu Peningkatan' }}</td>
            </tr>
            <tr>
                <td>Kualitas Kerja (Technical Skill)</td>
                <td style="text-align: center;">{{ $review->score_technical }}</td>
                <td style="color: {{ $review->score_technical >= 80 ? 'green' : 'orange' }}; font-weight: bold;">{{ $review->score_technical >= 80 ? 'Sesuai Target' : 'Perlu Peningkatan' }}</td>
            </tr>
            <tr>
                <td>Kerjasama Tim & Komunikasi</td>
                <td style="text-align: center;">{{ $review->score_cooperation }}</td>
                <td style="color: {{ $review->score_cooperation >= 80 ? 'green' : 'orange' }}; font-weight: bold;">{{ $review->score_cooperation >= 80 ? 'Sesuai Target' : 'Perlu Peningkatan' }}</td>
            </tr>
            <tr>
                <td>Sikap & Etika (Attitude)</td>
                <td style="text-align: center;">{{ $review->score_attitude }}</td>
                <td style="color: {{ $review->score_attitude >= 80 ? 'green' : 'orange' }}; font-weight: bold;">{{ $review->score_attitude >= 80 ? 'Sesuai Target' : 'Perlu Peningkatan' }}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">Catatan & Evaluasi</div>
    <div style="padding: 10px 15px; background: #fff; border: 1px solid #eee; border-radius: 5px; min-height: 100px;">
        <p style="margin: 0 0 10px;"><strong>Pencapaian:</strong></p>
        <p style="margin: 0 0 20px; font-style: italic; color: #555;">"{{ $review->achievements ?? '-' }}"</p>
        
        <p style="margin: 0 0 10px;"><strong>Perbaikan Mendatang:</strong></p>
        <p style="margin: 0; font-style: italic; color: #555;">"{{ $review->improvements ?? '-' }}"</p>
    </div>

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td style="width: 40%;">
                    <p>Reviewer,</p>
                    <div class="signature-space"></div>
                    <p><strong>{{ $review->reviewer->name }}</strong></p>
                </td>
                <td style="width: 20%;"></td>
                <td style="width: 40%;">
                    <p>Management,</p>
                    <div class="signature-space"></div>
                    <p><strong>Direktur HRD</strong></p>
                </td>
            </tr>
        </table>
        <p style="text-align: center; color: #999; margin-top: 50px; font-size: 8px;">
            Dokumen ini digenerate secara otomatis oleh Sistem HRM - {{ date('d M Y H:i') }}
        </p>
    </div>
</body>
</html>
