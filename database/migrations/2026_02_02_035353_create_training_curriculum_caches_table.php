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
        Schema::create('training_curriculum_caches', function (Blueprint $table) {
            $table->id();
            $table->string('label_hash')->index(); // Hash dari teks label (agar pencarian cepat)
            $table->integer('days');
            $table->float('hours');
            $table->json('content'); // Menyimpan array materi harian
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_curriculum_caches');
    }
};
