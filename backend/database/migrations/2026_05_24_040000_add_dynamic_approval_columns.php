<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add current_approval_step column to all approvable tables
     * and approver_user_id to workflow_steps for 'user' type approver.
     */
    public function up(): void
    {
        // Add approver_user_id to workflow_steps for 'user' type approver
        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->foreignId('approver_user_id')
                ->nullable()
                ->after('approver_role_id')
                ->constrained('users')
                ->onDelete('set null');
        });

        // Add current_approval_step to all 6 approvable tables
        $tables = ['leaves', 'permits', 'overtimes', 'reimbursements', 'fund_requests', 'attendance_corrections'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->unsignedInteger('current_approval_step')->nullable()->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['leaves', 'permits', 'overtimes', 'reimbursements', 'fund_requests', 'attendance_corrections'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('current_approval_step');
            });
        }

        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approver_user_id');
        });
    }
};
