<?php

namespace App\Exports;

use App\Models\Salary;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PayrollExport implements FromCollection, WithHeadings, WithMapping
{
    protected $companyId;
    protected $month;
    protected $year;

    public function __construct($companyId, $month = null, $year = null)
    {
        $this->companyId = $companyId;
        $this->month = $month;
        $this->year = $year;
    }

    public function collection()
    {
        $query = Salary::with('user')->where('company_id', $this->companyId);

        if ($this->month && $this->month !== 'all') {
            $query->where('month', $this->month);
        }

        if ($this->year) {
            $query->where('year', $this->year);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nama Karyawan',
            'NIK',
            'Bulan',
            'Tahun',
            'Gaji Pokok',
            'Tunjangan',
            'Potongan (Pajak + BPJS)',
            'Gaji Bersih',
            'Status',
            'Tanggal Diproses'
        ];
    }

    public function map($salary): array
    {
        return [
            $salary->id,
            $salary->user->name ?? '-',
            $salary->user->nik ?? '-',
            $salary->month,
            $salary->year,
            number_format($salary->basic_salary, 0, ',', '.'),
            number_format($salary->allowance, 0, ',', '.'),
            number_format($salary->deduction, 0, ',', '.'),
            number_format($salary->net_salary, 0, ',', '.'),
            strtoupper($salary->status),
            $salary->created_at->format('d/m/Y H:i'),
        ];
    }
}
