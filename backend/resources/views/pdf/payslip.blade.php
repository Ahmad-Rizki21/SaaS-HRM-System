<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #8B0000; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #8B0000; }
        .slip-title { font-size: 18px; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px; }
        
        .info-table { width: 100%; margin-bottom: 30px; }
        .info-table td { padding: 5px 0; font-size: 14px; }
        .label { font-weight: bold; color: #666; width: 150px; }
        
        .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .salary-table th { background: #f8f9fa; text-align: left; padding: 12px; border-bottom: 1px solid #ddd; font-size: 14px; }
        .salary-table td { padding: 12px; border-bottom: 1px dashed #eee; font-size: 14px; }
        
        .section-title { font-weight: bold; padding: 10px 0; border-bottom: 1px solid #eee; margin-bottom: 15px; background: #fff5f5; padding-left: 10px; border-left: 4px solid #8B0000; }
        
        .total-row { background: #fdf2f2; font-weight: bold; }
        .total-row td { border-top: 2px solid #8B0000; font-size: 16px; }
        
        .footer { margin-top: 50px; }
        .signature-box { float: right; width: 200px; text-align: center; }
        .signature-space { height: 80px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $salary->user->company->name ?? 'On Time HRMS' }}</div>
        <div class="slip-title">SLIP GAJI KARYAWAN</div>
        <div style="font-size: 12px; color: #666;">Periode: {{ $salary->month }} {{ $salary->year }}</div>
    </div>

    <table class="info-table">
        <tr>
            <td class="label">Nama Karyawan</td>
            <td>: {{ $salary->user->name }}</td>
            <td class="label">NIK</td>
            <td>: {{ $salary->user->nik ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Jabatan</td>
            <td>: {{ $salary->user->role->name ?? '-' }}</td>
            <td class="label">Status PTKP</td>
            <td>: {{ $salary->user->ptkp_status }}</td>
        </tr>
    </table>

    <div class="section-title">PENDAPATAN (EARNINGS)</div>
    <table class="salary-table">
        <tr>
            <td>Gaji Pokok</td>
            <td style="text-align: right;">Rp {{ number_format($salary->basic_salary, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Tunjangan Tetap</td>
            <td style="text-align: right;">Rp {{ number_format($salary->allowance, 0, ',', '.') }}</td>
        </tr>
        @php $details = json_decode($salary->details, true); @endphp
        @if(isset($details['bpjs']['total_premium_coy']))
        <tr>
            <td>Tunjangan BPJS (Dibayar Prsh)</td>
            <td style="text-align: right;">Rp {{ number_format($details['bpjs']['total_premium_coy'], 0, ',', '.') }}</td>
        </tr>
        @endif
    </table>

    <div class="section-title">POTONGAN (DEDUCTIONS)</div>
    <table class="salary-table">
        @if(isset($details['tax']))
        <tr>
            <td>Pajak PPh 21 (TER)</td>
            <td style="text-align: right;">Rp {{ number_format($details['tax'], 0, ',', '.') }}</td>
        </tr>
        @endif
        @if(isset($details['bpjs']['total_deduction_emp']))
        <tr>
            <td>Iuran BPJS (Potongan Karyawan)</td>
            <td style="text-align: right;">Rp {{ number_format($details['bpjs']['total_deduction_emp'], 0, ',', '.') }}</td>
        </tr>
        @endif
        <tr>
            <td>BPJS Dibayar Prsh (Offset)</td>
            <td style="text-align: right;">Rp {{ number_format($details['bpjs']['total_premium_coy'] ?? 0, 0, ',', '.') }}</td>
        </tr>
    </table>

    <table class="salary-table">
        <tr class="total-row">
            <td>TOTAL GAJI BERSIH (TAKE HOME PAY)</td>
            <td style="text-align: right;">Rp {{ number_format($salary->net_salary, 0, ',', '.') }}</td>
        </tr>
    </table>

    <div class="footer">
        <div style="font-size: 11px; color: #888; font-style: italic;">
            * Slip gaji ini dihasilkan secara otomatis oleh sistem On Time HRMS dan sah tanpa tanda tangan basah.
        </div>
        
        <div class="signature-box">
            <div>Jakarta, {{ date('d F Y') }}</div>
            <div style="font-weight: bold; margin-top: 5px;">Manajemen HR</div>
            <div class="signature-space"></div>
            <div style="text-decoration: underline; font-weight: bold;">( {{ $salary->user->company->name ?? 'HR Department' }} )</div>
        </div>
    </div>
</body>
</html>
