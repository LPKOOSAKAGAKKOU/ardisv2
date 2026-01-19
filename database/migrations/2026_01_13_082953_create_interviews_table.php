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
            $table->text('description');
            $table->string('group_chat_link')->nullable(); // Link grup chat
            $table->string('kyuujinhyou_yunerva_uuid')->nullable(); // Upload Kyuujinhyou
            $table->date('interview_announcement_date')->nullable(); // Tanggal pengumuman wawancara
            $table->date('interview_registration_deadline')->nullable(); // Batas pendaftaran wawancara
            $table->date('interview_date');
            $table->date('date_fly_to_japan')->nullable(); // Tanggal keberangkatan ke Jepang
            
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
