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
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->string('nip')->unique()->nullable(); // Nomor Induk Guru
            $table->string('name');
            $table->string('specialization')->comment('Contoh: Bahasa Jepang, Kaigo, dll');
            $table->enum('gender', ['L', 'P']);
            $table->string('phone')->nullable();
            $table->string('email')->unique()->nullable();
            $table->text('address')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
