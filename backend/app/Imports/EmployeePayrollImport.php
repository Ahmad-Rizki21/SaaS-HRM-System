<?php

namespace App\Imports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class EmployeePayrollImport implements ToCollection, WithHeadingRow
{
    protected $companyId;
    public $updatedCount = 0;
    public $skippedCount = 0;
    public $errors = [];

    public function __construct($companyId)
    {
        $this->companyId = $companyId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $email = $this->getValue($row, 'email');
            $nik = $this->getValue($row, 'nik');

            if (empty($email) && empty($nik)) {
                $this->skippedCount++;
                continue;
            }

            // Find user by email or NIK
            $user = null;
            if (!empty($email)) {
                $user = User::where('company_id', $this->companyId)->where('email', trim($email))->first();
            }
            
            if (!$user && !empty($nik)) {
                $user = User::where('company_id', $this->companyId)->where('nik', trim($nik))->first();
            }

            if (!$user) {
                $this->skippedCount++;
                $this->errors[] = "Employee with email/NIK [" . ($email ?: $nik) . "] not found.";
                continue;
            }

            // Update payroll related fields
            $updateData = [];
            
            $bankName = $this->getValue($row, 'bank');
            if ($bankName !== null) $updateData['bank_name'] = trim($bankName);

            $accNo = $this->getValue($row, 'nomor_rekening');
            if ($accNo !== null) $updateData['bank_account_no'] = (string)$accNo;

            $accName = $this->getValue($row, 'nama_rekening');
            if ($accName !== null) $updateData['bank_account_name'] = trim($accName);

            $costCenter = $this->getValue($row, 'cost_center');
            if ($costCenter !== null) $updateData['cost_center'] = trim($costCenter);

            $basicSalary = $this->getValue($row, 'gaji_pokok');
            if ($basicSalary !== null) $updateData['basic_salary'] = (float)$basicSalary;

            $fixedAllowance = $this->getValue($row, 'tunjangan_tetap');
            if ($fixedAllowance !== null) $updateData['fixed_allowance'] = (float)$fixedAllowance;

            if (!empty($updateData)) {
                $user->update($updateData);
                $this->updatedCount++;
            }
        }
    }

    private function getValue(array $row, $keyPrefix)
    {
        foreach ($row as $key => $value) {
            // Slugified keys usually convert "Nomor Rekening" to "nomor_rekening"
            if (str_starts_with($key, $keyPrefix)) {
                return $value;
            }
        }
        return null;
    }
}
