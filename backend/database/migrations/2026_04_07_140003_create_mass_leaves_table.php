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
        Schema::create('mass_leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('type'); // e.g., 'Cuti Tahunan', 'Cuti Bersama'
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_deduction')->default(true); // Whether it reduces annual leave quota
            $table->boolean('all_employees')->default(true);
            $table->json('employee_ids')->nullable(); // If not all employees
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mass_leaves');
    }
};
