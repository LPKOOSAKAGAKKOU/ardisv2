<?php

namespace App\Services;

use App\Models\AcceptingOrganization;
use App\Models\Departure;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Logika penagihan management fee technical intern (技能実習生).
 *
 * Aturan program (standar Ginou Jisshuu):
 *  - Total program 36 bulan.
 *  - Bulan ke-1 = Training Center (tanpa management fee).
 *  - Sisa 35 bulan kena management fee, ditagih per siklus 3 bulan
 *    (11x 3 bulan + 1x 2 bulan terakhir = 12 invoice).
 *  - Tagihan pertama jatuh di bulan ke-4 setelah keberangkatan,
 *    tagihan terakhir di bulan ke-36.
 *
 * Tarif (management_fee per orang per bulan) di-resolve dari keberangkatan
 * (override) atau default organisasi penerima.
 */
class BillingService
{
    public const BILLING_CYCLE_MONTHS = 3;
    public const PROGRAM_MONTHS = 36;
    public const TRAINING_CENTER_MONTHS = 1;

    public const MANAGEMENT_MONTHS = self::PROGRAM_MONTHS - self::TRAINING_CENTER_MONTHS; // 35

    /**
     * Bangun jadwal penagihan untuk satu keberangkatan.
     *
     * @return array<int, array{
     *   index:int, months:int, people:int, unit_price:int, amount:int,
     *   period_from:Carbon, period_to:Carbon, bill_date:Carbon
     * }>
     */
    public function schedule(Departure $departure): array
    {
        $people = max(1, (int) $departure->people_count);
        $unitPrice = $departure->effectiveManagementFee();

        $start = $departure->departure_date->copy()->addMonthsNoOverflow(self::TRAINING_CENTER_MONTHS);
        $cursor = $start->copy();
        $remaining = self::MANAGEMENT_MONTHS;

        $blocks = [];
        $index = 0;
        while ($remaining > 0) {
            $index++;
            $months = min(self::BILLING_CYCLE_MONTHS, $remaining);

            $periodFrom = $cursor->copy();
            $periodTo = $cursor->copy()->addMonthsNoOverflow($months);
            $amount = $unitPrice * $people * $months;

            $blocks[] = [
                'index'       => $index,
                'months'      => $months,
                'people'      => $people,
                'unit_price'  => $unitPrice,
                'amount'      => $amount,
                'period_from' => $periodFrom,
                'period_to'   => $periodTo,
                'bill_date'   => $periodTo->copy(),
            ];

            $remaining -= $months;
            $cursor = $periodTo;
        }

        return $blocks;
    }

    /**
     * Ringkasan kolom-kolom otomatis (seperti di Excel) untuk satu keberangkatan.
     */
    public function summary(Departure $departure): array
    {
        $people = max(1, (int) $departure->people_count);
        $blocks = $this->schedule($departure);
        $first = $blocks[0] ?? null;
        $last = $blocks ? $blocks[count($blocks) - 1] : null;

        return [
            'pre_education_total'   => $departure->effectivePreEducationFee() * $people,
            'management_unit_price' => $departure->effectiveManagementFee(),
            'first_billing_date'    => $first['bill_date'] ?? null,
            'end_date'              => $last['bill_date'] ?? null,
            'total_management_fee'  => array_sum(array_column($blocks, 'amount')),
            'total_billings'        => count($blocks),
        ];
    }

    /**
     * Cari blok penagihan keberangkatan yang jatuh tempo pada bulan tertentu.
     */
    public function blockDueInMonth(Departure $departure, Carbon $month): ?array
    {
        foreach ($this->schedule($departure) as $block) {
            if ($block['bill_date']->isSameMonth($month)) {
                return $block;
            }
        }

        return null;
    }

    /**
     * Hitung baris-baris tagihan untuk satu organisasi pada bulan tertentu
     * (tanpa menyimpan). Dipakai untuk preview sebelum generate.
     *
     * @return Collection<int, array>
     */
    public function previewForMonth(AcceptingOrganization $organization, Carbon $month): Collection
    {
        $departures = $organization->departures()
            ->where('status', 'managing')
            ->get();

        $items = collect();
        foreach ($departures as $departure) {
            $block = $this->blockDueInMonth($departure, $month);
            if (! $block) {
                continue;
            }

            $items->push([
                'departure_id' => $departure->id,
                'company_name' => $departure->company_name,
                'description'  => $this->itemDescription($block),
                'people'       => $block['people'],
                'months'       => $block['months'],
                'unit_price'   => $block['unit_price'],
                'amount'       => $block['amount'],
            ]);
        }

        return $items;
    }

    /**
     * Generate (dan simpan) invoice untuk satu organisasi pada bulan tertentu.
     * Mengembalikan null jika tidak ada tagihan yang jatuh tempo.
     */
    public function generateForMonth(AcceptingOrganization $organization, Carbon $month, ?Carbon $issueDate = null): ?Invoice
    {
        $items = $this->previewForMonth($organization, $month);
        if ($items->isEmpty()) {
            return null;
        }

        $issueDate = $issueDate ?? Carbon::today();

        return DB::transaction(function () use ($organization, $month, $items, $issueDate) {
            $invoice = $organization->invoices()->create([
                'invoice_number' => $this->nextInvoiceNumber($issueDate),
                'issue_date'     => $issueDate,
                'period_from'    => $month->copy()->startOfMonth(),
                'period_to'      => $month->copy()->endOfMonth(),
                'total_amount'   => $items->sum('amount'),
                'status'         => 'issued',
            ]);

            foreach ($items as $item) {
                $invoice->items()->create($item);
            }

            return $invoice->load('items');
        });
    }

    /**
     * Nomor invoice bergaya Excel: "YYYY-M-D/NN" (NN = urutan invoice di hari tsb).
     */
    public function nextInvoiceNumber(Carbon $issueDate): string
    {
        $seq = Invoice::whereDate('issue_date', $issueDate->toDateString())->count() + 1;

        return sprintf('%s/%02d', $issueDate->format('Y-n-j'), $seq);
    }

    private function itemDescription(array $block): string
    {
        $from = $block['period_from'];
        $toInclusive = $block['period_to']->copy()->subMonthNoOverflow();

        return sprintf(
            '技能実習生管理費（%s〜%s）',
            $from->format('Y年n月'),
            $toInclusive->format('Y年n月')
        );
    }
}
