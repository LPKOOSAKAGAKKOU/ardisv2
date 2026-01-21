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
        // 1. Tabel Provinsi
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->string('name_id'); // Nama Bahasa Indonesia
            $table->string('name_jp'); // Nama Bahasa Jepang
            $table->timestamps();
        });

        // 2. Tabel Sektor Pekerjaan (Kaigo, Konstruksi, dll)
        Schema::create('job_sectors', function (Blueprint $table) {
            $table->id();
            $table->string('name_id'); // Nama Bahasa Indonesia
            $table->string('name_jp'); // Nama Bahasa Jepang
            $table->string('code')->nullable(); 
            $table->timestamps();
        });

        // 3. Tabel Jurusan (SMA/SMK/Universitas)
        Schema::create('majors', function (Blueprint $table) {
            $table->id();
            $table->string('name_id'); // Nama Bahasa Indonesia
            $table->string('name_jp'); // Nama Bahasa Jepang
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('majors');
        Schema::dropIfExists('job_sectors');
        Schema::dropIfExists('provinces');
    }
};