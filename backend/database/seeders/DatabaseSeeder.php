<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Always run RolePermissionSeeder to sync new features/permissions
        $this->call(RolePermissionSeeder::class);

        // ONLY run these in local/development environments
        if (!app()->isProduction()) {
            $this->call([
                UserSeeder::class,
                DemoDataSeeder::class,
            ]);
        }
    }
}
