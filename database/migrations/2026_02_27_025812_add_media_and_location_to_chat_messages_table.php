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
        Schema::table('chat_messages', function (Blueprint $table) {
            // Kolom untuk lampiran file / gambar
            $table->string('media_url')->nullable()->after('message_body');
            $table->string('file_name')->nullable()->after('media_url');
            $table->string('mime_type')->nullable()->after('file_name'); // Contoh: image/jpeg, application/pdf
            
            // Kolom untuk lokasi
            $table->string('latitude')->nullable()->after('mime_type');
            $table->string('longitude')->nullable()->after('latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            // Jika di-rollback, kolom ini akan dihapus tanpa menghapus tabelnya
            $table->dropColumn([
                'media_url', 
                'file_name', 
                'mime_type', 
                'latitude', 
                'longitude'
            ]);
        });
    }
};