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
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['status', 'subscription_plan', 'subscription_end']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('status')->default('active')->after('name');
            $table->string('subscription_plan')->default('starter')->after('status');
            $table->timestamp('subscription_end')->nullable()->after('subscription_plan');
        });
    }
};
