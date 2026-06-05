<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            // Jenis baris tagihan: management | travel | pre_education
            $table->string('kind')->default('management')->after('departure_id');
            // Daftar nama siswa terkait (ditampilkan di bawah periode pada seikyuusho).
            $table->json('students')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn(['kind', 'students']);
        });
    }
};
