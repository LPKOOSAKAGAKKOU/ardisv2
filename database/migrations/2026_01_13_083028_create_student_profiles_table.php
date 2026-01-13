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
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Identitas Dasar
            $table->string('nik')->unique();
            $table->string('full_name');
            $table->string('full_name_katakana')->nullable();
            $table->string('pob'); // Tempat Lahir
            $table->string('pob_province'); // Provinsi Lahir
            $table->date('dob'); // Tanggal Lahir
            $table->enum('gender', ['Laki-laki', 'Perempuan']);
            $table->text('address_ktp');
            $table->string('phone_student');
            $table->string('phone_parent');
            
            // Fisik & Kebiasaan
            $table->enum('tattoo', ['ada', 'tidak']);
            $table->enum('smoking', ['merokok', 'tidak merokok']);
            $table->enum('alcohol', ['minum', 'tidak minum']);
            $table->enum('family_in_japan', ['ada', 'tidak']);
            $table->integer('height');
            $table->integer('weight');
            $table->enum('blood_type', ['A', 'B', 'O', 'AB']);
            $table->enum('religion', ['Islam', 'Kristen', 'Katholik', 'Hindu', 'Budha', 'Kong Hu Chu']);
            $table->enum('marital_status', ['Belum Menikah', 'Menikah', 'Cerai', 'Cerai Mati']);
            
            // Medis
            $table->enum('tbc_history', ['ada', 'tidak']);
            $table->enum('color_blind', ['normal', 'parsial', 'biru-kuning', 'merah-hijau', 'total']);
            $table->text('other_illness')->nullable(); // Riwayat penyakit/operasi
            
            // Passport & Dokumen
            $table->enum('has_passport', ['ada', 'tidak']);
            $table->string('passport_number')->nullable();
            $table->date('passport_issue_date')->nullable();
            $table->date('passport_expiry_date')->nullable();
            $table->string('photo_path')->nullable(); // Path foto studio
            $table->string('id_card_path')->nullable(); // Path KTP
            $table->string('family_card_path')->nullable(); // Path KK
            $table->string('birth_certificate_path')->nullable(); // Path akta kelahiran
            $table->string('diploma_path')->nullable(); // Path ijazah terakhir
            $table->string('transcript_path')->nullable(); // Path transkrip nilai
            $table->string('1st_medical_checkup_path')->nullable(); // Path MCU
            $table->string('2nd_medical_checkup_path')->nullable(); // Path MCU Setelah diterima wawancara
            $table->string('3rd_medical_checkup_path')->nullable(); // Path MCU Pra Keberangkatan
            $table->string('passport_photo_page_path')->nullable(); // Path halaman foto passport
            $table->string('parents_consent_letter_path')->nullable(); // Path surat persetujuan orang tua
            $table->string('work_contract_path')->nullable(); // Path kontrak kerja
            
            // Data LPK Internal
            $table->string('class_level'); // SISWA BARU, BAB 1-10, dll
            $table->string('program_expert'); // BAHASA JEPANG, KAIGO, dll
            $table->date('entry_date_lpk');
            $table->string('strength'); // Kelebihan
            $table->string('weakness'); // Kekurangan
            $table->string('skill_technical', 15); // Maks 15 huruf
            $table->string('hobby', 15);
            $table->string('savings_target'); // Target Tabungan
            $table->string('savings_reason', 15); // Alasan menabung
            $table->enum('student_status', ['pelatihan', 'matching', 'lolos_job', 'berangkat']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_profiles');
    }
};
