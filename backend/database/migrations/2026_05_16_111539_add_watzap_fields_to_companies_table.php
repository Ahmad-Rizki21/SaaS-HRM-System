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
            $table->string('watzap_api_key')->nullable()->after('radius_meters');
            $table->string('watzap_number_key')->nullable()->after('watzap_api_key');
            $table->string('watzap_base_url')->nullable()->default('https://api.watzap.id/v1/')->after('watzap_number_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['watzap_api_key', 'watzap_number_key', 'watzap_base_url']);
        });
    }
};
