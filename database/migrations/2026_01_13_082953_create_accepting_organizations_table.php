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
        Schema::create('accepting_organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nama Kumiai / TSK
            $table->string('name_in_japanese')->nullable(); // Nama Kumiai / TSK
            $table->enum('type', ['kanri_dantai', 'tsk', 'both'])->comment('Kanri Dantai untuk Magang, TSK untuk SSW');
            $table->string('address')->nullable();
            $table->string('address_in_japanese')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('pic_name')->nullable(); // Nama penanggung jawab di Jepang
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accepting_organizations');
    }
};
