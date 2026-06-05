<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('departure_id')->nullable()->constrained()->nullOnDelete();

            $table->string('company_name'); // 品名 (mis. 株式会社川端組)
            $table->string('description')->nullable(); // 技能実習生管理費（2026年5月〜2026年7月）
            $table->unsignedInteger('people')->default(1); // 数量 (orang)
            $table->unsignedInteger('months')->default(3); // jumlah bulan dalam siklus ini
            $table->unsignedInteger('unit_price')->default(0); // 単価 (yen / orang / bulan)
            $table->unsignedBigInteger('amount')->default(0); // 金額 (people * months * unit_price)

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
