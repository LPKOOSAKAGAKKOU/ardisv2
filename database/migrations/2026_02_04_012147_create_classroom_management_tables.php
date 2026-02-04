<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Tabel Kelas
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');
            $table->string('name'); 
            // Level disesuaikan dengan request Anda
            $table->enum('level', ['ATARASHII', 'N5', 'N4', 'Pra-Pemberangakatan', 'Pra-Pemberangkatan Kaigo'])->default('ATARASHII'); 
            $table->enum('status', ['active', 'finished'])->default('active');
            $table->date('start_date')->useCurrent();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });

        // 2. Pivot: Menghubungkan Siswa ke Kelas (Timeline History)
        Schema::create('classroom_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_profile_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['active', 'graduated', 'dropped', 'moved'])->default('active');
            
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('left_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. Tabel Absensi (Harian/Per Sesi)
        Schema::create('classroom_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_profile_id')->constrained()->onDelete('cascade');
            
            $table->date('date'); // Tanggal Absen
            // Status kehadiran
            $table->enum('status', ['hadir', 'sakit', 'izin', 'alpha'])->default('hadir');
            $table->string('note')->nullable(); // Keterangan jika izin/sakit
            
            $table->timestamps();

            // Mencegah duplikasi absen siswa yg sama di kelas yg sama pada tanggal yg sama
            $table->unique(['classroom_id', 'student_profile_id', 'date'], 'attendance_unique');
        });

        // 4. Tabel Nilai (Quiz, Harian, Ujian)
        Schema::create('classroom_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_profile_id')->constrained()->onDelete('cascade');
            
            $table->string('type'); // Contoh: "Bunpo", "Kanji", "Choukai", "Harian"
            $table->string('title'); // Contoh: "Bab 1-5", "Quiz Mingguan 1"
            $table->integer('score'); // Nilai (0-100)
            $table->integer('original_score')->nullable(); // Nilai sebelum remed
            $table->boolean('is_remedial')->default(false); // Apakah ini nilai remedial?
            $table->text('feedback')->nullable(); // Catatan Sensei untuk nilai ini
            
            $table->timestamps();
        });

        // 5. Log Audit
        Schema::create('classroom_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained(); 
            $table->string('action'); 
            $table->text('description'); 
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('classroom_logs');
        Schema::dropIfExists('classroom_grades');
        Schema::dropIfExists('classroom_attendances');
        Schema::dropIfExists('classroom_students');
        Schema::dropIfExists('classrooms');
    }
};