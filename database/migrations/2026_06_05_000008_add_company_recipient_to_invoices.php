<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sebuah invoice bisa ditujukan ke organisasi penerima (kumiai) ATAU
     * langsung ke perusahaan (untuk penagihan TG yang masuk perusahaan).
     * Maka accepting_organization_id dibuat nullable dan ditambah company_id + bill_to.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['accepting_organization_id']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('accepting_organization_id')->nullable()->change();

            $table->foreign('accepting_organization_id')
                ->references('id')->on('accepting_organizations')
                ->cascadeOnDelete();

            $table->foreignId('company_id')->nullable()->after('accepting_organization_id')
                ->constrained()->nullOnDelete();

            // organization | company
            $table->string('bill_to')->default('organization')->after('company_id');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn(['company_id', 'bill_to']);
        });
    }
};
