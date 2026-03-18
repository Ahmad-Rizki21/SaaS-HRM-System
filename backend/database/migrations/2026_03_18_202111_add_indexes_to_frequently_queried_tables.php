<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->index(['user_id', 'check_in']);
            $table->index('status');
        });

        Schema::table('leaves', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('status');
        });

        Schema::table('reimbursements', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('role_id');
            $table->index('company_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'check_in']);
            $table->dropIndex(['status']);
        });

        Schema::table('leaves', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('reimbursements', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role_id']);
            $table->dropIndex(['company_id']);
        });
    }
};
