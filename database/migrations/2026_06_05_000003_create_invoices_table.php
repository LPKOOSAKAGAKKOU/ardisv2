<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('accepting_organization_id')->constrained()->cascadeOnDelete();

            $table->string('invoice_number')->unique(); // 請求番号 (mis. 2026-5-20/01)
            $table->date('issue_date'); // 請求日
            $table->date('period_from'); // periode tagih (From)
            $table->date('period_to'); // periode tagih (To)

            $table->unsignedBigInteger('total_amount')->default(0); // 合計 (yen)

            $table->enum('status', ['draft', 'issued', 'paid'])->default('draft');
            $table->date('paid_at')->nullable(); // tanggal pembayaran masuk

            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
