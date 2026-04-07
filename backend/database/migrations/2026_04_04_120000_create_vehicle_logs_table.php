<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Modul Fleet Logging — Pencatatan penggunaan kendaraan operasional perusahaan
     * Berdasarkan SOP Mobil Operational & Form Penggunaan Mobil (092)
     */
    public function up(): void
    {
        Schema::create('vehicle_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Informasi Kendaraan
            $table->string('vehicle_name'); // Nama / Jenis Kendaraan (e.g., "Toyota Avanza")
            $table->string('plate_number'); // Nomor Polisi (e.g., "B 1234 CD")

            // Detail Perjalanan
            $table->string('purpose'); // Tujuan / Keperluan Perjalanan
            $table->string('destination'); // Tempat Tujuan
            $table->date('departure_date'); // Tanggal Berangkat
            $table->date('return_date')->nullable(); // Tanggal Kembali

            // Odometer / KM Logging
            $table->unsignedInteger('odometer_start'); // KM Awal (saat berangkat)
            $table->unsignedInteger('odometer_end')->nullable(); // KM Akhir (saat kembali)
            $table->unsignedInteger('distance')->nullable(); // Jarak Tempuh (otomatis dihitung)

            // Foto Dashboard Odometer
            $table->string('odometer_start_photo')->nullable(); // Foto KM Awal
            $table->string('odometer_end_photo')->nullable(); // Foto KM Akhir

            // Biaya Perjalanan (Travel Expense)
            $table->decimal('fuel_cost', 15, 2)->default(0); // Biaya BBM
            $table->decimal('toll_cost', 15, 2)->default(0); // Biaya Tol
            $table->decimal('parking_cost', 15, 2)->default(0); // Biaya Parkir
            $table->decimal('other_cost', 15, 2)->default(0); // Biaya Lain-lain
            $table->decimal('total_cost', 15, 2)->default(0); // Total Biaya

            // Bukti Biaya (Multiple Attachments)
            $table->text('expense_attachments')->nullable(); // JSON array of file paths

            // Notes & Approval
            $table->text('notes')->nullable(); // Catatan Karyawan
            $table->string('status')->default('departure'); // departure, completed, approved, rejected
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->text('remark')->nullable(); // Catatan Admin/Approver

            $table->timestamps();

            // Indexes for frequent queries
            $table->index(['company_id', 'status']);
            $table->index(['user_id', 'departure_date']);
            $table->index('plate_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_logs');
    }
};
