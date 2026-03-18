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
            ['name' => 'Hapus Cuti', 'slug' => 'delete-leaves', 'group' => 'Cuti'],
            
            // Reimbursement
            ['name' => 'Lihat Klaim', 'slug' => 'view-reimbursements', 'group' => 'Reimbursement'],
            ['name' => 'Ajukan Klaim', 'slug' => 'apply-reimbursements', 'group' => 'Reimbursement'],
            ['name' => 'Setujui Klaim', 'slug' => 'approve-reimbursements', 'group' => 'Reimbursement'],
            ['name' => 'Hapus Klaim', 'slug' => 'delete-reimbursements', 'group' => 'Reimbursement'],
            
            // Operational
            ['name' => 'Kelola Shift', 'slug' => 'manage-shifts', 'group' => 'Operasional'],
            ['name' => 'Kelola Jadwal', 'slug' => 'manage-schedules', 'group' => 'Operasional'],
            ['name' => 'Kelola Hari Libur', 'slug' => 'manage-holidays', 'group' => 'Operasional'],
            ['name' => 'Kelola Pengumuman', 'slug' => 'manage-announcements', 'group' => 'Operasional'],

            // Pengaturan
            ['name' => 'Pengaturan Perusahaan', 'slug' => 'manage-company', 'group' => 'Pengaturan'],
            ['name' => 'Manajemen Role', 'slug' => 'manage-roles', 'group' => 'Pengaturan'],
            ['name' => 'Lihat Log Aktivitas', 'slug' => 'view-activity-logs', 'group' => 'Pengaturan'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['slug' => $p['slug']], $p);
        }

        // Roles
        $admin = Role::updateOrCreate(['name' => 'Super Admin']);
        $hrd = Role::updateOrCreate(['name' => 'HRD Manager']);
        $staff = Role::updateOrCreate(['name' => 'Staff Karyawan']);

        // Sync all to Super Admin
        $admin->permissions()->sync(Permission::all()->pluck('id'));
        
        // HRD Manager: Manage Employees, Leaves, Reimbursements, and Operations
        $hrdPermissions = Permission::whereIn('group', [
            'Pegawai', 'Cuti', 'Reimbursement', 'Operasional'
        ])->pluck('id');
        $hrd->permissions()->sync($hrdPermissions);

        // Staff Karyawan: Apply Leaves/Reimbursement & View basic records
        $staffPermissions = Permission::whereIn('slug', [
            'view-employees', 
            'view-leaves', 'apply-leaves', 
            'view-reimbursements', 'apply-reimbursements',
            'view-announcements' // If added later
        ])->pluck('id');
        $staff->permissions()->sync($staffPermissions);
    }
}
