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
        Schema::create('chats', function (Blueprint $table) {
            $table->id();

            // Relasi ke tabel student_profiles
            // Menggunakan 'set null' agar jika data siswa dihapus, history chat tidak hilang
            $table->foreignId('student_profile_id')
                ->nullable()
                ->constrained('student_profiles')
                ->onDelete('set null');

            // Nomor WA pengirim (628xxxx) sebagai identitas unik untuk lookup Webhook
            $table->string('phone_number')->unique(); 
            
            // Nama pengirim cadangan (jika nomor tidak ditemukan di database siswa)
            $table->string('incoming_name')->nullable();

            // Informasi pesan terakhir untuk kebutuhan daftar chat (Inbox)
            $table->text('last_message')->nullable();
            $table->timestamp('last_message_at')->nullable();
            
            // Indikator pesan yang belum dibaca
            $table->integer('unread_count')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
