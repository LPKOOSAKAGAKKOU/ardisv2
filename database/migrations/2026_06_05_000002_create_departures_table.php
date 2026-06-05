<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departures', function (Blueprint $table) {
            $table->id();

            $table->foreignId('accepting_organization_id')->constrained()->cascadeOnDelete();
            // Perusahaan penerima Jepang (実習実施者). Nullable agar data historis tanpa record perusahaan tetap bisa disimpan.
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            // Tautan opsional ke wawancara yang menghasilkan keberangkatan ini.
            $table->foreignId('interview_id')->nullable()->constrained()->nullOnDelete();

            $table->string('company_name'); // snapshot nama perusahaan (会社名)
            $table->date('departure_date'); // 出発日
            $table->unsignedInteger('people_count')->default(1); // 人数
            $table->unsignedInteger('travel_cost')->default(0); // 渡航費 (yen, manual)

            // Override tarif (yen). Null = pakai default dari organisasi penerima.
            $table->unsignedInteger('pre_education_fee')->nullable();
            $table->unsignedInteger('management_fee')->nullable();

            $table->text('notes')->nullable(); // 備考 (nama intern, dll)
            $table->enum('status', ['managing', 'completed', 'cancelled'])->default('managing'); // ステータス

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departures');
    }
};
