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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('invoice_number')->unique();
            $table->integer('amount'); // Nominal pembayaran
            $table->string('payment_category'); // Contoh: Pendaftaran, Kursus, Pesawat, MCU
            $table->date('payment_date');
            $table->string('payment_method'); // Cash, Transfer Bank
            $table->string('proof_file')->nullable(); // Upload bukti transfer
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
