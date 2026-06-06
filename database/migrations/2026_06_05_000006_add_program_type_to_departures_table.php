<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departures', function (Blueprint $table) {
            // ginou_jisshuu (magang, penagihan berbasis rumus) | tokutei_ginou (TG, penagihan manual/cicilan)
            $table->string('program_type')->default('ginou_jisshuu')->after('interview_id');
            // 紹介料 (biaya pengenalan tenaga kerja) per orang — dasar preset cicilan TG.
            $table->unsignedInteger('shoukairyou_fee')->nullable()->after('pre_education_fee');
        });
    }

    public function down(): void
    {
        Schema::table('departures', function (Blueprint $table) {
            $table->dropColumn(['program_type', 'shoukairyou_fee']);
        });
    }
};
