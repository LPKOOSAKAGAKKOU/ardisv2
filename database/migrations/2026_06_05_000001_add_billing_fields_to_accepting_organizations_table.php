<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accepting_organizations', function (Blueprint $table) {
            // Biaya penagihan default untuk organisasi penerima ini (yen).
            // Bisa di-override per keberangkatan.
            $table->unsignedInteger('pre_education_fee')->default(15000)->after('pic_name'); // 事前教育料 / orang (sekali)
            $table->unsignedInteger('management_fee')->default(5000)->after('pre_education_fee'); // 管理費 / orang / bulan
        });
    }

    public function down(): void
    {
        Schema::table('accepting_organizations', function (Blueprint $table) {
            $table->dropColumn(['pre_education_fee', 'management_fee']);
        });
    }
};
