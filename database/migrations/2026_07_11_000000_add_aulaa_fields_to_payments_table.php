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
        Schema::table('payments', function (Blueprint $table) {
            $table->date('payment_date')->nullable()->change();
            $table->string('payment_method')->nullable()->change();
            $table->string('status')->default('pending')->after('proof_file');
            $table->string('aulaa_payment_id')->nullable()->after('status');
            $table->string('payment_url')->nullable()->after('aulaa_payment_id');
            $table->integer('discount')->default(0)->after('amount');
            $table->integer('original_amount')->default(15000000)->after('discount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->date('payment_date')->nullable(false)->change();
            $table->string('payment_method')->nullable(false)->change();
            $table->dropColumn([
                'status',
                'aulaa_payment_id',
                'payment_url',
                'discount',
                'original_amount'
            ]);
        });
    }
};
