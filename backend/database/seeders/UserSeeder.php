<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create a default company for these users (Use ID 1 for consistency)
        $company = Company::firstOrCreate(
            ['id' => 1],
            ['name' => 'Narwasthu Artha Tama', 'email' => 'admin@maincompany.com']
        );

        $superAdminRole = Role::where('name', 'Super Admin')->first();
        $direkturRole = Role::where('name', 'Direktur')->first();
        $managerRole = Role::where('name', 'Manager')->first();
        $supervisorRole = Role::where('name', 'Supervisor')->first();
        $staffRole = Role::where('name', 'Staff Karyawan')->first();

        // 1. Super Admin
        User::updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'role_id' => $superAdminRole->id,
            ]
        );

        // 2. Direktur
        $direktur = User::updateOrCreate(
            ['email' => 'direktur@example.com'],
            [
                'name' => 'Direktur Utama',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'role_id' => $direkturRole->id,
            ]
        );

        // 3. Manager
        $manager = User::updateOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Manager HR',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'role_id' => $managerRole->id,
                'supervisor_id' => $direktur->id,
            ]
        );

        // 4. Supervisor
        $supervisor = User::updateOrCreate(
            ['email' => 'supervisor@example.com'],
            [
                'name' => 'Supervisor Area',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'role_id' => $supervisorRole->id,
                'supervisor_id' => $manager->id,
            ]
        );

        // 5. Staff (Bawahan Supervisor)
        User::updateOrCreate(
            ['email' => 'staff@example.com'],
            [
                'name' => 'Ahmad Karyawan',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'role_id' => $staffRole->id,
                'supervisor_id' => $supervisor->id,
                'nik' => '12345678',
            ]
        );
    }
}
