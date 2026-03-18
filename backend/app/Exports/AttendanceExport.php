<?php

namespace App\Exports;

use App\Models\Attendance;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AttendanceExport implements FromQuery, WithMapping, WithHeadings
{
    protected $userId;
    protected $companyId;
    protected $startDate;
    protected $endDate;

    public function __construct($companyId, $userId = null, $startDate = null, $endDate = null)
    {
        $this->companyId = $companyId;
        $this->userId = $userId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function query()
    {
        $query = Attendance::where('company_id', $this->companyId);

        if ($this->userId) {
            $query->where('user_id', $this->userId);
        }

        if ($this->startDate && $this->endDate) {
            $query->whereBetween('check_in', [$this->startDate, $this->endDate]);
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'ID',
            'User',
            'Company',
            'Check In',
            'Check Out',
            'Status',
        ];
    }

    public function map($attendance): array
    {
        return [
            $attendance->id,
            $attendance->user->name ?? 'N/A',
            $attendance->company->name ?? 'N/A',
            $attendance->check_in,
            $attendance->check_out,
            $attendance->status,
        ];
    }
}
