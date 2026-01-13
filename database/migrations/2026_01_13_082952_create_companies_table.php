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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nama Perusahaan
            $table->string('name_in_japanese')->nullable();
            $table->string('industry')->comment('Sektor: Kaigo, Konstruksi, dll');
            $table->text('address')->nullable();
            $table->text('address_in_japanese')->nullable();
            $table->string('prefecture')->nullable(); // Provinsi/Prefektur di Jepang
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
