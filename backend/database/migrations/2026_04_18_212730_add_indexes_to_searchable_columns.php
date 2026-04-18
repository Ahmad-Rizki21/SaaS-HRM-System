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
        Schema::table('users', function (Blueprint $table) {
            $table->index('name');
            $table->index('nik');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->index('name');
            // 'code' already has unique() index in its creation migration
        });

        if (Schema::hasTable('permissions')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->index('name');
                $table->index('slug');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['nik']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex(['name']);
        });

        if (Schema::hasTable('permissions')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->dropIndex(['name']);
                $table->dropIndex(['slug']);
            });
        }
    }
};
