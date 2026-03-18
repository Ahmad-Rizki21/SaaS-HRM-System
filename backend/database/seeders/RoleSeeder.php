<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'Karyawan',
            'HRD',
            'Management',
            'Manager',
            'Direktur',
            'Supervisor',
            'Super Admin',
        ];

        foreach ($roles as $role) {
            \App\Models\Role::updateOrCreate(['name' => $role]);
        }
    }
}
