<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->foreignId('recruitments_id')
                  ->nullable()
                  ->after('user_id') 
                  ->constrained('recruitments')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            // Menghapus foreign key dan kolom saat rollback
            $table->dropForeign(['recruitments_id']);
            $table->dropColumn('recruitments_id');
        });
    }
};