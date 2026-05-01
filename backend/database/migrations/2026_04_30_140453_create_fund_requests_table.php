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
        Schema::create('fund_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->text('reason');
            $table->enum('status', ['pending', 'approved_by_supervisor', 'approved', 'rejected'])->default('pending');
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('hrd_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('supervisor_approved_at')->nullable();
            $table->timestamp('hrd_approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('reject_reason')->nullable();
            $table->string('attachment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_requests');
    }
};
