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
        Schema::create('student_educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->onDelete('cascade');
            $table->enum('level', ['SD', 'SMP', 'SMA/SMK', 'Perguruan Tinggi']);
            $table->string('school_name');
            $table->string('school_type'); // Negeri/Swasta
            $table->string('major')->nullable(); // Jurusan
            $table->date('entry_date');
            $table->date('graduation_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_education');
    }
};
