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

            $table->string('training_center_name')->nullable();
            $table->string('training_center_address')->nullable();
            $table->string('training_center_phone')->nullable();
            $table->string('training_center_area')->nullable(); // luas training center
            $table->string('training_center_capacity')->nullable(); // kapasitas training center
            $table->enum('training_center_type', ['asrama', 'kos', 'lainnya'])->nullable(); // Jenis Training Center
            
            $table->boolean('allowance_in_first_month')->default(true); // Besaran uang di bulan pertama
            $table->string('allowance_amount')->default('60,000'); // Besaran uang di bulan pertama

            $table->boolean('meal_allowance')->default(false);
            $table->string('meal_allowance_amount')->nullable();
            $table->boolean('student_pays_meal')->default(false); //apakak siswa membayar makan sendiri
            $table->string('student_pays_meal_amount')->nullable();

            $table->boolean('accommodation_allowance')->default(false);
            $table->string('accommodation_allowance_amount')->nullable();
            $table->boolean('student_pays_accommodation')->default(false); //apakak siswa membayar akomodasi sendiri
            $table->string('student_pays_accommodation_amount')->nullable();

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
