<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabel untuk menyimpan refresh tokens terenkripsi.
     * Mendukung token rotation: setiap kali refresh, token lama direvoke.
     */
    public function up(): void
    {
        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('token_hash', 64)->unique(); // SHA-256 hash of refresh token
            $table->string('device_id')->nullable(); // Bind token ke device tertentu
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->boolean('is_revoked')->default(false);
            $table->timestamp('expires_at');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_revoked']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refresh_tokens');
    }
};
