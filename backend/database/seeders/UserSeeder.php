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
        // Create a default company for these users
        $company = Company::updateOrCreate(
            ['name' => 'Main Company'],
            ['email' => 'admin@maincompany.com']
        );

        $superAdminRole = Role::where('name', 'Super Admin')->first();
        $direkturRole = Role::where('name', 'Direktur')->first();

        User::updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'role_id' => $superAdminRole->id,
            ]
        );

        User::updateOrCreate(
            ['email' => 'direktur@example.com'],
            [
                'name' => 'Direktur Utama',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'role_id' => $direkturRole->id,
            ]
        );
    }
}
