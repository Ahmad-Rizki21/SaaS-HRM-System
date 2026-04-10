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
        Schema::create('payroll_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->integer('cutoff_day')->default(25);
            $table->decimal('bpjs_kesehatan_coy_pct', 5, 2)->default(4.00);
            $table->decimal('bpjs_kesehatan_emp_pct', 5, 2)->default(1.00);
            $table->decimal('bpjs_jht_coy_pct', 5, 2)->default(3.70);
            $table->decimal('bpjs_jht_emp_pct', 5, 2)->default(2.00);
            $table->decimal('bpjs_jp_coy_pct', 5, 2)->default(2.00);
            $table->decimal('bpjs_jp_emp_pct', 5, 2)->default(1.00);
            $table->decimal('bpjs_jkm_pct', 5, 2)->default(0.30);
            $table->decimal('bpjs_jkk_pct', 5, 2)->default(0.24); // Standard minimum risk
            $table->string('tax_method')->default('TER');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_settings');
    }
};
