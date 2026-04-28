<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salaries', function (Blueprint $table) {
            // Link to batch for approval workflow
            $table->foreignId('batch_id')->nullable()->after('id')->constrained('payroll_batches')->nullOnDelete();

            // Employee context
            $table->string('department')->nullable()->after('details');
            $table->integer('working_days')->default(0)->after('department'); // HH - Hari Hadir
            $table->integer('total_working_days')->default(0)->after('working_days'); // HK bulan ini

            // === EARNINGS (Pendapatan) ===
            $table->decimal('earning_bpjs_kes_premium', 15, 2)->default(0)->after('total_working_days'); // Premi BPJS-Kes
            $table->decimal('earning_position_allowance', 15, 2)->default(0)->after('earning_bpjs_kes_premium'); // Tunjangan Jabatan
            $table->decimal('earning_attendance_allowance', 15, 2)->default(0)->after('earning_position_allowance'); // Tunjangan Kehadiran
            $table->decimal('earning_communication_allowance', 15, 2)->default(0)->after('earning_attendance_allowance'); // Tunjangan Pulsa
            $table->decimal('earning_shift_premium', 15, 2)->default(0)->after('earning_communication_allowance'); // Premi Shift (24jam)
            $table->decimal('earning_shift_meal', 15, 2)->default(0)->after('earning_shift_premium'); // UM Shift Malam
            $table->decimal('earning_overtime', 15, 2)->default(0)->after('earning_shift_meal'); // OT-Lembur
            $table->decimal('earning_operational', 15, 2)->default(0)->after('earning_overtime'); // Operasional
            $table->decimal('earning_diligence_bonus', 15, 2)->default(0)->after('earning_operational'); // Kerajinan
            $table->decimal('earning_backpay', 15, 2)->default(0)->after('earning_diligence_bonus'); // Rapel
            $table->decimal('earning_others', 15, 2)->default(0)->after('earning_backpay'); // Others/Tambahan
            $table->text('earning_others_note')->nullable()->after('earning_others');

            // === DEDUCTIONS (Potongan) ===
            $table->decimal('deduction_bpjs_jht', 15, 2)->default(0)->after('earning_others_note'); // JHT-TK (2%)
            $table->decimal('deduction_bpjs_jp', 15, 2)->default(0)->after('deduction_bpjs_jht'); // JP-TK (1%)
            $table->decimal('deduction_absence', 15, 2)->default(0)->after('deduction_bpjs_jp'); // Potongan Absensi
            $table->decimal('deduction_tax', 15, 2)->default(0)->after('deduction_absence'); // PPh21

            // === TOTALS ===
            $table->decimal('total_earnings', 15, 2)->default(0)->after('deduction_tax');
            $table->decimal('total_deductions', 15, 2)->default(0)->after('total_earnings');

            // === PAYMENT INFO ===
            $table->string('bank_name')->nullable()->after('total_deductions');
            $table->string('bank_account_no')->nullable()->after('bank_name');
            $table->string('cost_center')->nullable()->after('bank_account_no'); // Artacomindo / Narwastu / AJNusa

            // === STATUS ===
            // Existing 'status' column will be updated to support: draft, pending_approval, approved, paid
        });
    }

    public function down(): void
    {
        Schema::table('salaries', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
            $table->dropColumn([
                'batch_id', 'department', 'working_days', 'total_working_days',
                'earning_bpjs_kes_premium', 'earning_position_allowance',
                'earning_attendance_allowance', 'earning_communication_allowance',
                'earning_shift_premium', 'earning_shift_meal', 'earning_overtime',
                'earning_operational', 'earning_diligence_bonus', 'earning_backpay',
                'earning_others', 'earning_others_note',
                'deduction_bpjs_jht', 'deduction_bpjs_jp', 'deduction_absence', 'deduction_tax',
                'total_earnings', 'total_deductions',
                'bank_name', 'bank_account_no', 'cost_center',
            ]);
        });
    }
};
