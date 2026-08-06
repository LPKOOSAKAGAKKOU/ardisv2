<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('skill_technical', 255)->change();
            $table->string('hobby', 255)->change();
            $table->string('savings_reason', 255)->change();
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('skill_technical', 15)->change();
            $table->string('hobby', 15)->change();
            $table->string('savings_reason', 15)->change();
        });
    }
};
