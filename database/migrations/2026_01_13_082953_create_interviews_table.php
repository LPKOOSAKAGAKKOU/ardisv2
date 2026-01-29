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
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->string('interviewer_title'); // Nama Perusahaan
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('accepting_organization_id')->constrained('accepting_organizations')->onDelete('cascade');
            $table->enum('type', ['tokuteiginou', 'ginoujisshuu'])->nullable(); // Jenis wawancara
            $table->text('description');
            $table->string('group_chat_link')->nullable(); // Link grup chat
            $table->string('kyuujinhyou_yunerva_uuid')->nullable(); // Upload Kyuujinhyou
            $table->date('interview_announcement_date')->nullable(); // Tanggal pengumuman wawancara
            $table->date('interview_registration_deadline')->nullable(); // Batas pendaftaran wawancara
            $table->date('interview_date');
            $table->date('date_fly_to_japan')->nullable(); // Tanggal keberangkatan ke Jepang

            //detail pelatihan ginou jisshuu
            $table->date('1_34_training_start_date')->nullable();
            $table->date('1_34_training_end_date')->nullable();
            $table->string('1_34_training_duration_hours')->nullable();
            $table->string('1_34_training_item')->nullable();

            $table->string('1_23_req_letter_number')->nullable();

            $table->date('1_29_first_training_start_date')->nullable();
            $table->date('1_29_first_training_end_date')->nullable();
            $table->string('1_29_first_training_duration_hours')->nullable();
            $table->string('1_29_first_training_item')->nullable();

            $table->date('1_29_second_training_start_date')->nullable();
            $table->date('1_29_second_training_end_date')->nullable();
            $table->string('1_29_second_training_duration_hours')->nullable();
            $table->string('1_29_second_training_item')->nullable();
            
            $table->date('1_29_third_training_start_date')->nullable();
            $table->date('1_29_third_training_end_date')->nullable();
            $table->string('1_29_third_training_duration_hours')->nullable();
            $table->string('1_29_third_training_item')->nullable();

            // dokumen ginou jisshuu
            $table->string('ginou_1_34_uuid')->nullable();
            $table->string('ginou_1_10_uuid')->nullable();
            $table->string('ginou_1_23_uuid')->nullable();
            $table->string('ginou_1_23_req_uuid')->nullable();
            $table->string('ginou_1_13_uuid')->nullable();
            $table->string('ginou_4_8_uuid')->nullable();
            $table->string('ginou_1_29_uuid')->nullable();
            $table->string('stmt_jp_teacher_uuid')->nullable();
            $table->string('stmt_kg_teacher_uuid')->nullable();
            $table->string('cv_jp_teacher_uuid')->nullable();
            $table->string('cv_kg_teacher_uuid')->nullable();
            $table->string('schedule_detail_uuid')->nullable();

            //dokumen tokutei ginou
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
