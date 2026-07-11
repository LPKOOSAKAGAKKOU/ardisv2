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
            $table->foreignId('interview_detail_id')
                ->nullable()
                ->after('user_id')
                ->constrained('interview_details')
                ->nullOnDelete();
            
            $table->json('additional_items')
                ->nullable()
                ->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['interview_detail_id']);
            $table->dropColumn('interview_detail_id');
            $table->dropColumn('additional_items');
        });
    }
};
