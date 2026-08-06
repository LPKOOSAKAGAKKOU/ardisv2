<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kemnaker_report_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month'); // 1-12
            $table->unsignedInteger('departure_count')->default(0);
            $table->unsignedInteger('return_count')->default(0);
            $table->string('responsible_wa')->default('+62 857 4594 5292');
            $table->string('departure_file_path')->nullable();
            $table->string('return_file_path')->nullable();
            $table->enum('status', ['success', 'failed'])->default('success');
            $table->text('response_message')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kemnaker_report_logs');
    }
};
