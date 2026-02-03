<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke tabel users (untuk login)
            // nullable() dipasang untuk jaga-jaga jika admin input data guru dulu baru buat akun usernya belakangan (opsional)
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); 
            
            $table->string('name');
            $table->string('nip')->nullable()->unique(); // Nomor Induk Pengajar
            
            // Enum tipe sensei
            $table->enum('type', [
                'bahasa_jepang', 
                'kaigo', 
                'kensetsu', 
                'budaya'
            ]);
            
            $table->string('phone_number')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->softDeletes(); // Menambahkan kolom deleted_at (PENTING untuk history)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};