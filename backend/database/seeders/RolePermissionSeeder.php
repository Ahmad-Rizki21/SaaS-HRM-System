<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Pegawai
            ['name' => 'Lihat Pegawai', 'slug' => 'view-employees', 'group' => 'Pegawai'],
            ['name' => 'Tambah Pegawai', 'slug' => 'create-employees', 'group' => 'Pegawai'],
            ['name' => 'Ubah Pegawai', 'slug' => 'edit-employees', 'group' => 'Pegawai'],
            ['name' => 'Hapus Pegawai', 'slug' => 'delete-employees', 'group' => 'Pegawai'],
            
            // Cuti
            ['name' => 'Lihat Cuti', 'slug' => 'view-leaves', 'group' => 'Cuti'],
            ['name' => 'Ajukan Cuti', 'slug' => 'apply-leaves', 'group' => 'Cuti'],
            ['name' => 'Setujui Cuti', 'slug' => 'approve-leaves', 'group' => 'Cuti'],
            
            // Reimbursement
            ['name' => 'Lihat Klaim', 'slug' => 'view-reimbursements', 'group' => 'Reimbursement'],
            ['name' => 'Ajukan Klaim', 'slug' => 'apply-reimbursements', 'group' => 'Reimbursement'],
            ['name' => 'Setujui Klaim', 'slug' => 'approve-reimbursements', 'group' => 'Reimbursement'],
            
            // Pengaturan
            ['name' => 'Pengaturan Perusahaan', 'slug' => 'manage-company', 'group' => 'Pengaturan'],
            ['name' => 'Manajemen Role', 'slug' => 'manage-roles', 'group' => 'Pengaturan'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['slug' => $p['slug']], $p);
        }

        // Roles
        $admin = Role::updateOrCreate(['name' => 'Super Admin']);
        $hrd = Role::updateOrCreate(['name' => 'HRD Manager']);
        $staff = Role::updateOrCreate(['name' => 'Staff Karyawan']);

        // Sync all to admin
        $admin->permissions()->sync(Permission::all()->pluck('id'));
        
        // HRD (some)
        $hrd->permissions()->sync(Permission::whereIn('group', ['Pegawai', 'Cuti', 'Reimbursement'])->pluck('id'));

        // Staff (view mostly)
        $staff->permissions()->sync(Permission::whereIn('slug', ['view-employees', 'apply-leaves', 'apply-reimbursements'])->pluck('id'));
    }
}
