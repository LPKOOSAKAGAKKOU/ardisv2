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
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained('chats')->onDelete('cascade');
            
            // ID pesan unik dari WAHA agar tidak ada pesan duplikat saat webhook terpanggil ulang
            $table->string('wa_message_id')->unique()->nullable(); 
            
            // Siapa yang mengirim?
            $table->enum('sender_type', ['student', 'admin']);
            
            $table->text('message_body');
            
            // Tipe pesan (untuk pengembangan fitur kirim gambar/dokumen kedepannya)
            $table->string('message_type')->default('chat'); 
            
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
