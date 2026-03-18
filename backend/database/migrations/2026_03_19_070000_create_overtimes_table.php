<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('overtimes', function (Blueprint $col) {
            $col->id();
            $col->foreignId('user_id')->constrained()->onDelete('cascade');
            $col->foreignId('company_id')->constrained()->onDelete('cascade');
            $col->date('date');
            $col->time('start_time');
            $col->time('end_time');
            $col->text('reason')->nullable();
            $col->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $col->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $col->text('remark')->nullable();
            $col->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtimes');
    }
};
