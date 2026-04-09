<?php

namespace App\Imports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\Hash;
use App\Models\Role;

class EmployeeImport implements ToModel, WithHeadingRow
{
    protected $companyId;
    
    public function __construct($companyId)
    {
        $this->companyId = $companyId;
    }

    public function model(array $row)
    {
        if (empty($row['nama']) || empty($row['email'])) {
            return null; // Skip invalid row (termasuk row panduan yang kosongan)
        }
        
        // Bersihkan data
        $email = trim($row['email']);
        $nama = trim($row['nama']);

        // Cek kalau email sudah terdaftar
        if (User::where('email', $email)->exists()) {
            return null;
        }

        // Handle Role
        $roleId = !empty($row['role_id']) ? $row['role_id'] : 3;

        // Handle Password
        $password = !empty($row['password']) ? $row['password'] : 'password123';

        // Handle Tanggal Gabung (bisa berupa teks atau digit Excel Serial Date)
        $joinDateRaw = $row['tanggal_gabung'] ?? null;
        $joinDate = now()->format('Y-m-d');

        if (!empty($joinDateRaw)) {
            if (is_numeric($joinDateRaw)) {
                try {
                    $joinDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($joinDateRaw)->format('Y-m-d');
                } catch (\Exception $e) {
                    // Fallback
                }
            } else {
                $joinDate = date('Y-m-d', strtotime($joinDateRaw));
            }
        }

        return new User([
            'company_id' => $this->companyId,
            'name'       => $nama,
            'email'      => $email,
            'nik'        => !empty($row['nik']) ? $row['nik'] : null,
            'password'   => Hash::make($password),
            'role_id'    => $roleId,
            'join_date'  => $joinDate,
            'employment_status' => !empty($row['status_karyawan']) ? $row['status_karyawan'] : null,
            'work_location'     => !empty($row['lokasi_kerja']) ? $row['lokasi_kerja'] : null,
        ]);
    }
}
