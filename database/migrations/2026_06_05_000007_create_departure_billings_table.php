<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cicilan/tagihan manual untuk keberangkatan tipe Tokutei Ginou (TG).
     * Berbeda dengan ginou jisshuu yang penagihannya berbasis rumus (siklus 3 bulan),
     * TG hanya menagih 渡航費 (travel, opsional) + 紹介料 (shoukairyou) dengan
     * skema bebas (kontan saat berangkat, 50% + 50% setengah tahun, dll).
     */
    public function up(): void
    {
        Schema::create('departure_billings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('departure_id')->constrained()->cascadeOnDelete();

            // travel (渡航費) | shoukairyou (紹介料) | other
            $table->string('kind')->default('shoukairyou');
            $table->string('description')->nullable();

            $table->date('due_date'); // tanggal jatuh tempo penagihan

            $table->unsignedInteger('people')->default(1);     // jumlah orang yang ditagih
            $table->unsignedInteger('unit_price')->default(0); // tarif per orang (yen)
            $table->unsignedBigInteger('amount')->default(0);  // total (people × unit_price)

            // Ditujukan ke siapa: organization (kumiai) atau company (perusahaan langsung)
            $table->string('bill_to')->default('organization');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departure_billings');
    }
};
