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
            
            // Lembur
            ['name' => 'Lihat Lembur', 'slug' => 'view-overtimes', 'group' => 'Lembur'],
            ['name' => 'Ajukan Lembur', 'slug' => 'apply-overtimes', 'group' => 'Lembur'],
            ['name' => 'Setujui Lembur', 'slug' => 'approve-overtimes', 'group' => 'Lembur'],
            ['name' => 'Hapus Lembur', 'slug' => 'delete-overtimes', 'group' => 'Lembur'],
            
            // Operational
            ['name' => 'Kelola Shift', 'slug' => 'manage-shifts', 'group' => 'Operasional'],
            ['name' => 'Kelola Jadwal', 'slug' => 'manage-schedules', 'group' => 'Operasional'],
            ['name' => 'Kelola Hari Libur', 'slug' => 'manage-holidays', 'group' => 'Operasional'],
            ['name' => 'Kelola Pengumuman', 'slug' => 'manage-announcements', 'group' => 'Operasional'],

            // KPI & Performa
            ['name' => 'Lihat KPI', 'slug' => 'view-kpis', 'group' => 'Performa'],
            ['name' => 'Kelola KPI', 'slug' => 'manage-kpis', 'group' => 'Performa'],
            
            // Peta Kehadiran & Laporan
            ['name' => 'Lihat Map Absensi', 'slug' => 'view-attendance-map', 'group' => 'Kehadiran'],
            ['name' => 'Lihat Laporan Absensi', 'slug' => 'view-attendance-reports', 'group' => 'Kehadiran'],
            ['name' => 'Export Laporan Absensi', 'slug' => 'export-attendance', 'group' => 'Kehadiran'],

            // Tukar Shift
            ['name' => 'Lihat Tukar Shift', 'slug' => 'view-shift-swaps', 'group' => 'Tukar Shift'],
            ['name' => 'Ajukan Tukar Shift', 'slug' => 'apply-shift-swaps', 'group' => 'Tukar Shift'],
            ['name' => 'Setujui Tukar Shift', 'slug' => 'approve-shift-swaps', 'group' => 'Tukar Shift'],
            ['name' => 'Lihat Laporan Tukar Shift', 'slug' => 'view-shift-swap-reports', 'group' => 'Tukar Shift'],
            ['name' => 'Export Laporan Tukar Shift', 'slug' => 'export-shift-swaps', 'group' => 'Tukar Shift'],

            // Pengaturan
            ['name' => 'Pengaturan Perusahaan', 'slug' => 'manage-company', 'group' => 'Pengaturan'],
            ['name' => 'Manajemen Role', 'slug' => 'manage-roles', 'group' => 'Pengaturan'],
            ['name' => 'Lihat Log Aktivitas', 'slug' => 'view-activity-logs', 'group' => 'Pengaturan'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['slug' => $p['slug']], $p);
        }

        $admin = Role::updateOrCreate(['name' => 'Super Admin']);
        $hrd = Role::updateOrCreate(['name' => 'HRD Manager']);
        $staff = Role::updateOrCreate(['name' => 'Staff Karyawan']);
        $direktur = Role::updateOrCreate(['name' => 'Direktur']);
        $manager = Role::updateOrCreate(['name' => 'Manager']);
        $supervisor = Role::updateOrCreate(['name' => 'Supervisor']);
        
        $allPermissions = Permission::all()->pluck('id');
        $admin->permissions()->sync($allPermissions);
        $direktur->permissions()->sync($allPermissions);
        
        // Manager: View Employees, Approvals, KPI, Map, Schedules, Overtimes, Reports, Shift Swaps
        $managerPermissions = Permission::whereIn('group', [
            'Pegawai', 'Cuti', 'Reimbursement', 'Lembur', 'Operasional', 'Performa', 'Kehadiran', 'Tukar Shift'
        ])->whereNotIn('slug', ['delete-employees', 'manage-roles', 'manage-company'])->pluck('id');
        $manager->permissions()->sync($managerPermissions);

        // Supervisor: Approvals and Viewing
        $supervisorPermissions = Permission::whereIn('slug', [
            'view-employees', 
            'view-leaves', 'approve-leaves', 
            'view-reimbursements', 'approve-reimbursements', 
            'view-overtimes', 'approve-overtimes',
            'view-kpis', 'view-attendance-map', 'view-attendance-reports',
            'manage-shifts', 'manage-schedules',
            'view-shift-swaps', 'approve-shift-swaps', 'view-shift-swap-reports', 'export-shift-swaps'
        ])->pluck('id');
        $supervisor->permissions()->sync($supervisorPermissions);

        // HRD Manager: Manage Employees, Leaves, Reimbursements, Overtime, Operations, KPI, & Map, Shift Swaps
        $hrdPermissions = Permission::whereIn('group', [
            'Pegawai', 'Cuti', 'Reimbursement', 'Lembur', 'Operasional', 'Performa', 'Kehadiran', 'Tukar Shift'
        ])->pluck('id');
        $hrd->permissions()->sync($hrdPermissions);

        // Staff Karyawan: Apply Leaves/Reimbursement/Overtime & View basic records
        $staffPermissions = Permission::whereIn('slug', [
            'view-employees', 
            'view-leaves', 'apply-leaves', 
            'view-reimbursements', 'apply-reimbursements',
            'view-overtimes', 'apply-overtimes',
            'view-shift-swaps', 'apply-shift-swaps'
        ])->pluck('id');
        $staff->permissions()->sync($staffPermissions);
    }
}
