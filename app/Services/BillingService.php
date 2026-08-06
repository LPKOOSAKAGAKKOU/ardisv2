<?php

namespace App\Services;

use App\Models\AcceptingOrganization;
use App\Models\Company;
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
        // Tokutei Ginou (TG) tidak memakai jadwal management fee berbasis rumus.
        // Penagihannya manual lewat departure_billings (渡航費 / 紹介料).
        if ($departure->isTokuteiGinou()) {
            return [];
        }

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

            // Tagihan dibayar di akhir siklus (in arrears). Periode yang ditagih
            // adalah `$months` bulan yang BERAKHIR di bulan penagihan (inklusif),
            // mis. tagihan bulan Juni utk siklus 3 bulan = April–Juni.
            $billDate = $cursor->copy()->addMonthsNoOverflow($months);
            $periodTo = $billDate->copy();                                  // bulan terakhir (inklusif)
            $periodFrom = $billDate->copy()->subMonthsNoOverflow($months - 1); // bulan pertama (inklusif)
            $amount = $unitPrice * $people * $months;

            $blocks[] = [
                'index'       => $index,
                'months'      => $months,
                'people'      => $people,
                'unit_price'  => $unitPrice,
                'amount'      => $amount,
                'period_from' => $periodFrom,
                'period_to'   => $periodTo,
                'bill_date'   => $billDate->copy(),
            ];

            $remaining -= $months;
            $cursor = $cursor->copy()->addMonthsNoOverflow($months);
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
            ->with(['interview.details.user', 'billings', 'returns'])
            ->get();

        $items = collect();
        foreach ($departures as $departure) {
            $students = $this->studentNames($departure);
            $people = max(1, (int) $departure->people_count);

            // Cicilan manual (TG: 渡航費/紹介料) yang ditujukan ke organisasi.
            foreach ($this->installmentItems($departure, $month, 'organization', $students) as $installment) {
                $items->push($installment);
            }

            // Ginou Jisshuu: penagihan otomatis berbasis rumus. TG dilewati.
            if ($departure->isTokuteiGinou()) {
                continue;
            }

            // Penagihan satu kali (渡航費 & 事前教育費) di bulan keberangkatan.
            if ($departure->departure_date && $departure->departure_date->isSameMonth($month)) {
                $travel = (int) ($departure->travel_cost ?? 0);
                if ($travel > 0) {
                    $items->push([
                        'departure_id' => $departure->id,
                        'kind'         => 'travel',
                        'company_name' => $departure->company_name,
                        'description'  => '渡航費',
                        'students'     => $students,
                        'people'       => $people,
                        'months'       => 1,
                        'unit_price'   => $travel,
                        'amount'       => $travel * $people,
                    ]);
                }

                $preEducation = $departure->effectivePreEducationFee();
                if ($preEducation > 0) {
                    $items->push([
                        'departure_id' => $departure->id,
                        'kind'         => 'pre_education',
                        'company_name' => $departure->company_name,
                        'description'  => '事前教育費',
                        'students'     => $students,
                        'people'       => $people,
                        'months'       => 1,
                        'unit_price'   => $preEducation,
                        'amount'       => $preEducation * $people,
                    ]);
                }
            }

            // Penagihan management fee per siklus (jika jatuh tempo bulan ini).
            $block = $this->blockDueInMonth($departure, $month);
            if ($block) {
                $calculated = $this->activePersonMonthsForBlock($departure, $block);
                $totalPersonMonths = $calculated['total_person_months'];
                $activeStudents = $calculated['active_students'];

                if ($totalPersonMonths > 0) {
                    // Total tagihan = tarif per bulan * jumlah total bulan-orang aktif dalam siklus 3 bulan ini
                    $amount = $block['unit_price'] * $totalPersonMonths;
                    $effectivePeople = (int) ceil($totalPersonMonths / $block['months']);

                    $items->push([
                        'departure_id' => $departure->id,
                        'kind'         => 'management',
                        'company_name' => $departure->company_name,
                        'description'  => $this->itemDescription($block),
                        'students'     => $activeStudents,
                        'people'       => $effectivePeople,
                        'months'       => $block['months'],
                        'unit_price'   => $block['unit_price'],
                        'amount'       => $amount,
                    ]);
                }
            }
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
     * Preview tagihan yang ditujukan LANGSUNG ke perusahaan (bill_to=company)
     * pada bulan tertentu. Khusus skema TG yang dibayar perusahaan sendiri.
     *
     * @return Collection<int, array>
     */
    public function previewForCompany(Company $company, Carbon $month): Collection
    {
        $departures = $company->departures()
            ->where('status', 'managing')
            ->with(['interview.details.user', 'billings'])
            ->get();

        $items = collect();
        foreach ($departures as $departure) {
            $students = $this->studentNames($departure);
            foreach ($this->installmentItems($departure, $month, 'company', $students) as $installment) {
                $items->push($installment);
            }
        }

        return $items;
    }

    /**
     * Generate invoice yang ditujukan langsung ke perusahaan (bill_to=company).
     */
    public function generateForCompany(Company $company, Carbon $month, ?Carbon $issueDate = null): ?Invoice
    {
        $items = $this->previewForCompany($company, $month);
        if ($items->isEmpty()) {
            return null;
        }

        $issueDate = $issueDate ?? Carbon::today();

        return DB::transaction(function () use ($company, $month, $items, $issueDate) {
            $invoice = Invoice::create([
                'company_id'   => $company->id,
                'bill_to'      => 'company',
                'invoice_number' => $this->nextInvoiceNumber($issueDate),
                'issue_date'   => $issueDate,
                'period_from'  => $month->copy()->startOfMonth(),
                'period_to'    => $month->copy()->endOfMonth(),
                'total_amount' => $items->sum('amount'),
                'status'       => 'issued',
            ]);

            foreach ($items as $item) {
                $invoice->items()->create($item);
            }

            return $invoice->load('items');
        });
    }

    /**
     * Ubah cicilan manual sebuah keberangkatan menjadi baris-baris invoice
     * yang jatuh tempo pada bulan & penerima (bill_to) tertentu.
     *
     * @param  array<int, string>  $students
     * @return array<int, array>
     */
    private function installmentItems(Departure $departure, Carbon $month, string $billTo, array $students = []): array
    {
        $rows = [];
        foreach ($departure->billings as $billing) {
            if ($billing->bill_to !== $billTo) {
                continue;
            }
            if (! $billing->due_date || ! $billing->due_date->isSameMonth($month)) {
                continue;
            }

            $rows[] = [
                'departure_id' => $departure->id,
                'kind'         => $billing->kind,
                'company_name' => $departure->company_name,
                'description'  => $billing->description ?: $this->installmentLabel($billing->kind),
                'students'     => $students,
                'people'       => max(1, (int) $billing->people),
                'months'       => 1,
                'unit_price'   => (int) $billing->unit_price,
                'amount'       => (int) $billing->amount,
            ];
        }

        return $rows;
    }

    /**
     * Label default (Jepang) untuk jenis cicilan TG.
     */
    public function installmentLabel(string $kind): string
    {
        return match ($kind) {
            'travel'      => '渡航費',
            'shoukairyou' => '紹介料',
            default       => 'その他費用',
        };
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
        // period_from & period_to keduanya inklusif (bulan pertama & terakhir ditagih).
        return sprintf(
            '技能実習生管理費（%s〜%s）',
            $block['period_from']->format('Y年n月'),
            $block['period_to']->format('Y年n月')
        );
    }

    /**
     * Hitung total bulan aktif (person-months) untuk suatu keberangkatan selama periode siklus penagihan.
     * Siswa yang pulang pada pertengahan bulan tetap dihitung aktif untuk bulan tersebut (bulan kepulangan dihitung 1 bulan penuh).
     * Siswa hanya menjadi tidak aktif pada bulan-bulan SETELAH tanggal kepulangannya.
     *
     * @return array{total_person_months: int, active_students: array<int, string>}
     */
    public function activePersonMonthsForBlock(Departure $departure, array $block): array
    {
        $departure->loadMissing(['interview.details.user.student_profile', 'returns']);

        $periodFrom = $block['period_from']->copy()->startOfMonth();
        $periodTo = $block['period_to']->copy()->startOfMonth();

        // Kumpulkan bulan-bulan kalender dalam siklus ini (mis. April, Mei, Juni)
        $cycleMonths = [];
        $curr = $periodFrom->copy();
        while ($curr->lte($periodTo)) {
            $cycleMonths[] = $curr->copy();
            $curr->addMonthNoOverflow();
        }

        $blockTotalMonths = max(1, count($cycleMonths));
        $totalPersonMonths = 0;
        $activeStudentNamesMap = [];

        if ($passedDetails->isNotEmpty()) {
            foreach ($passedDetails as $detail) {
                $user = $detail->user;
                $userId = $user?->id;
                $studentName = $user?->student_profile?->full_name ?: $user?->name ?: 'Siswa';

                $studentReturn = $departure->returns->firstWhere('user_id', $userId);
                $returnDate = $studentReturn?->return_date;

                $studentActiveMonths = 0;
                foreach ($cycleMonths as $cMonth) {
                    // Siswa aktif jika tidak ada tanggal pulang ATAU tanggal pulang >= awal bulan cMonth
                    // Contoh: pulang 15 Mei -> untuk bulan Mei (1 Mei), 15 Mei >= 1 Mei -> AKTIF di bulan Mei.
                    // Untuk bulan Juni (1 Juni), 15 Mei < 1 Juni -> TIDAK AKTIF di bulan Juni.
                    if (! $returnDate || $returnDate->gte($cMonth->copy()->startOfMonth())) {
                        $studentActiveMonths++;
                    }
                }

                if ($studentActiveMonths > 0) {
                    // Jika siswa hanya aktif sebagian bulan dalam siklus ini, tambahkan keterangan （〇〇ヶ月分）
                    if ($studentActiveMonths < $blockTotalMonths) {
                        $formattedName = sprintf('%s（%dヶ月分）', $studentName, $studentActiveMonths);
                    } else {
                        $formattedName = $studentName;
                    }
                    $activeStudentNamesMap[$formattedName] = true;
                }

                $totalPersonMonths += $studentActiveMonths;
            }
        } else {
            // Fallback jika tidak ada link detail siswa (hitung berbasis data kepulangan tanpa user_id)
            $unlinkedReturns = $departure->returns->whereNull('user_id');
            for ($i = 0; $i < $totalStudentsCount; $i++) {
                $returnRecord = $unlinkedReturns->skip($i)->first();
                $returnDate = $returnRecord?->return_date;

                foreach ($cycleMonths as $cMonth) {
                    if (! $returnDate || $returnDate->gte($cMonth->copy()->startOfMonth())) {
                        $totalPersonMonths++;
                    }
                }
            }
        }

        return [
            'total_person_months' => $totalPersonMonths,
            'active_students'     => array_keys($activeStudentNamesMap),
        ];
    }

    /**
     * Nama siswa keberangkatan, diambil dari peserta wawancara yang lulus.
     *
     * @return array<int, string>
     */
    private function studentNames(Departure $departure, ?Carbon $month = null): array
    {
        $departure->loadMissing(['interview.details.user.student_profile', 'returns']);

        $returnedUserIds = [];
        if ($month) {
            $returnedUserIds = $departure->returns
                ->filter(function ($ret) use ($month) {
                    return $ret->return_date && $ret->return_date->endOfMonth()->lte($month->endOfMonth());
                })
                ->pluck('user_id')
                ->filter()
                ->all();
        }

        return $departure->interview?->details
            ->where('result', 'passed')
            ->filter(fn ($detail) => ! $detail->user_id || ! in_array($detail->user_id, $returnedUserIds, true))
            ->map(fn ($detail) => $detail->user?->student_profile?->full_name ?: $detail->user?->name)
            ->filter()
            ->values()
            ->all() ?? [];
    }
}
