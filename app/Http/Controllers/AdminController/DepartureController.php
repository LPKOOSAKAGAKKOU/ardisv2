<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\AcceptingOrganization;
use App\Models\Company;
use App\Models\Departure;
use App\Models\Interview;
use App\Models\InterviewDetail;
use App\Services\BillingService;
use App\Services\DepartureReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;

class DepartureController extends Controller
{
    public function __construct(
        private BillingService $billing,
        private DepartureReportService $report,
    ) {
    }

    public function index(Request $request)
    {
        $month = $this->resolveMonth($request->input('month'));

        $query = Departure::query()
            ->with([
                'acceptingOrganization:id,name,pre_education_fee,management_fee',
                'company:id,name,name_in_japanese',
                'interview:id',
                'interview.details:id,interview_id,user_id,result',
                'interview.details.user:id,name',
            ])
            ->whereYear('departure_date', $month->year)
            ->whereMonth('departure_date', $month->month)
            ->orderBy('departure_date')
            ->orderBy('id');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('company_name', 'like', "%{$request->search}%")
                  ->orWhere('notes', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->organization_id) {
            $query->where('accepting_organization_id', $request->organization_id);
        }

        $departures = $query->paginate(10)->withQueryString()
            ->through(function (Departure $d) {
                $summary = $this->billing->summary($d);

                return [
                    'id'                  => $d->id,
                    'company_name'        => $d->company_name,
                    'organization'        => $d->acceptingOrganization?->name,
                    'departure_date'      => $d->departure_date?->toDateString(),
                    'people_count'        => $d->people_count,
                    'travel_cost'         => $d->travel_cost,
                    'status'              => $d->status,
                    'notes'               => $d->notes,
                    'students'            => $this->studentNames($d),
                    'first_billing_date'  => $summary['first_billing_date']?->toDateString(),
                    'end_date'            => $summary['end_date']?->toDateString(),
                    'total_management_fee' => $summary['total_management_fee'],
                ];
            });

        return Inertia::render('admin/departure/Index', [
            'departures'    => $departures,
            'organizations' => AcceptingOrganization::orderBy('name')->get(['id', 'name']),
            'filters'       => $request->only(['search', 'status', 'organization_id']),
            'summary'       => $this->departedSummary(),
            'month'         => $this->monthMeta($month),
        ]);
    }

    /**
     * Unduh laporan keberangkatan bulanan (format Kemnaker) untuk satu bulan.
     * Laporan selalu mencakup seluruh keberangkatan bulan tersebut, terlepas
     * dari filter pencarian/organisasi di halaman daftar.
     */
    public function monthlyReport(Request $request)
    {
        $month = $this->resolveMonth($request->input('month'));

        $spreadsheet = $this->report->build($month);
        $filename = $this->report->filename($month);

        return response()->streamDownload(function () use ($spreadsheet) {
            IOFactory::createWriter($spreadsheet, 'Xlsx')->save('php://output');
        }, $filename, [
            'Content-Type'  => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0, must-revalidate',
        ]);
    }

    /**
     * Bulan aktif tampilan. Menerima "YYYY-MM"; nilai tidak valid jatuh ke bulan ini.
     */
    private function resolveMonth(?string $value): Carbon
    {
        if ($value && preg_match('/^\d{4}-\d{2}$/', $value)) {
            try {
                return Carbon::createFromFormat('Y-m-d', $value . '-01')->startOfMonth();
            } catch (\Throwable) {
                // abaikan, pakai bulan berjalan
            }
        }

        return Carbon::now()->startOfMonth();
    }

    /**
     * Metadata navigasi bulan + rekap headcount bulan tersebut (tanpa filter).
     */
    private function monthMeta(Carbon $month): array
    {
        $ofMonth = Departure::query()
            ->where('status', '!=', 'cancelled')
            ->whereYear('departure_date', $month->year)
            ->whereMonth('departure_date', $month->month)
            ->get(['id', 'people_count']);

        return [
            'value'      => $month->format('Y-m'),
            'label'      => $this->report->monthLabel($month),
            'prev'       => $month->copy()->subMonthNoOverflow()->format('Y-m'),
            'next'       => $month->copy()->addMonthNoOverflow()->format('Y-m'),
            'current'    => Carbon::now()->format('Y-m'),
            'departures' => $ofMonth->count(),
            'people'     => (int) $ofMonth->sum('people_count'),
        ];
    }

    /**
     * Ringkasan siswa yang sudah berangkat (keberangkatan non-batal, tgl <= hari ini),
     * total & rincian per kumiai/organisasi penerima.
     */
    private function departedSummary(): array
    {
        $departed = Departure::query()
            ->where('status', '!=', 'cancelled')
            ->whereNotNull('departure_date')
            ->whereDate('departure_date', '<=', now()->toDateString())
            ->with('acceptingOrganization:id,name')
            ->get(['id', 'accepting_organization_id', 'people_count', 'departure_date', 'status']);

        $perOrg = $departed
            ->groupBy(fn (Departure $d) => $d->acceptingOrganization?->name ?? 'Tanpa Organisasi')
            ->map(fn ($group, $name) => [
                'name'       => $name,
                'departures' => $group->count(),
                'people'     => (int) $group->sum('people_count'),
            ])
            ->sortByDesc('people')
            ->values();

        return [
            'total_people'     => (int) $departed->sum('people_count'),
            'total_departures' => $departed->count(),
            'per_organization' => $perOrg,
        ];
    }

    public function create()
    {
        return Inertia::render('admin/departure/DepartureForm', [
            'organizations' => AcceptingOrganization::orderBy('name')->get(['id', 'name', 'pre_education_fee', 'management_fee']),
            'companies'     => Company::orderBy('name')->get(['id', 'name', 'name_in_japanese']),
            'interviews'    => $this->interviewOptions(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateDeparture($request);
        $data = $this->resolveCompanyName($data);
        $data['people_count'] = $this->peopleFromInterview($data['interview_id'] ?? null);
        $data['program_type'] = $this->resolveProgramType($data);

        Departure::create($data);

        return redirect()->route('admin.departures.index')
            ->with('success', 'Data keberangkatan berhasil ditambahkan.');
    }

    public function show($id)
    {
        $departure = Departure::with([
            'acceptingOrganization:id,name,pre_education_fee,management_fee',
            'company:id,name,name_in_japanese',
            'interview:id,interview_date',
            'interview.details:id,interview_id,user_id,result',
            'interview.details.user:id,name',
            'billings',
        ])->findOrFail($id);

        $schedule = collect($this->billing->schedule($departure))->map(fn ($b) => [
            'index'       => $b['index'],
            'months'      => $b['months'],
            'people'      => $b['people'],
            'unit_price'  => $b['unit_price'],
            'amount'      => $b['amount'],
            'period_from' => $b['period_from']->toDateString(),
            'period_to'   => $b['period_to']->toDateString(),
            'bill_date'   => $b['bill_date']->toDateString(),
        ])->values();

        $summary = $this->billing->summary($departure);

        return Inertia::render('admin/departure/Show', [
            'departure' => [
                'id'              => $departure->id,
                'company_name'    => $departure->company_name,
                'company_id'      => $departure->company_id,
                'organization'    => $departure->acceptingOrganization?->name,
                'program_type'    => $departure->program_type,
                'departure_date'  => $departure->departure_date?->toDateString(),
                'people_count'    => $departure->people_count,
                'travel_cost'     => $departure->travel_cost,
                'shoukairyou_fee' => $departure->shoukairyou_fee,
                'status'          => $departure->status,
                'notes'           => $departure->notes,
                'interview_id'    => $departure->interview_id,
                'students'        => $this->studentNames($departure),
            ],
            'schedule' => $schedule,
            'summary'  => [
                'pre_education_total'   => $summary['pre_education_total'],
                'management_unit_price' => $summary['management_unit_price'],
                'first_billing_date'    => $summary['first_billing_date']?->toDateString(),
                'end_date'              => $summary['end_date']?->toDateString(),
                'total_management_fee'  => $summary['total_management_fee'],
                'total_billings'        => $summary['total_billings'],
            ],
            // Cicilan manual TG (渡航費 / 紹介料), beserta opsi penerima penagihan.
            'billings'   => $departure->billings
                ->sortBy('due_date')
                ->map(fn ($b) => [
                    'id'          => $b->id,
                    'kind'        => $b->kind,
                    'description' => $b->description,
                    'due_date'    => $b->due_date?->toDateString(),
                    'people'      => $b->people,
                    'unit_price'  => $b->unit_price,
                    'amount'      => $b->amount,
                    'bill_to'     => $b->bill_to,
                ])->values(),
            'recipients' => [
                'organization' => $departure->acceptingOrganization?->name,
                'company'      => $departure->company?->name_in_japanese ?: $departure->company?->name ?: $departure->company_name,
            ],
        ]);
    }

    /**
     * Simpan ulang (replace) seluruh cicilan manual TG untuk satu keberangkatan.
     * Frontend mengirim daftar baris hasil preset/edit; kita ganti total.
     */
    public function saveBillings(Request $request, $id)
    {
        $departure = Departure::findOrFail($id);

        $validated = $request->validate([
            'billings'               => 'present|array',
            'billings.*.kind'        => 'required|in:travel,shoukairyou,other',
            'billings.*.description' => 'nullable|string|max:255',
            'billings.*.due_date'    => 'required|date',
            'billings.*.people'      => 'required|integer|min:1',
            'billings.*.unit_price'  => 'required|integer|min:0',
            'billings.*.bill_to'     => 'required|in:organization,company',
        ]);

        $departure->billings()->delete();

        foreach ($validated['billings'] as $row) {
            $departure->billings()->create([
                'kind'        => $row['kind'],
                'description' => $row['description'] ?? null,
                'due_date'    => $row['due_date'],
                'people'      => $row['people'],
                'unit_price'  => $row['unit_price'],
                'amount'      => (int) $row['people'] * (int) $row['unit_price'],
                'bill_to'     => $row['bill_to'],
            ]);
        }

        return redirect()->back()->with('success', 'Cicilan penagihan berhasil disimpan.');
    }

    public function edit($id)
    {
        $departure = Departure::findOrFail($id);

        return Inertia::render('admin/departure/DepartureForm', [
            'departure'     => $departure,
            'organizations' => AcceptingOrganization::orderBy('name')->get(['id', 'name', 'pre_education_fee', 'management_fee']),
            'companies'     => Company::orderBy('name')->get(['id', 'name', 'name_in_japanese']),
            'interviews'    => $this->interviewOptions(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $departure = Departure::findOrFail($id);

        $data = $this->validateDeparture($request);
        $data = $this->resolveCompanyName($data);
        $data['people_count'] = $this->peopleFromInterview($data['interview_id'] ?? null, $departure->people_count);
        $data['program_type'] = $this->resolveProgramType($data, $departure->program_type);

        $departure->update($data);

        return redirect()->route('admin.departures.index')
            ->with('success', 'Data keberangkatan berhasil diperbarui.');
    }

    public function destroy($id)
    {
        Departure::findOrFail($id)->delete();

        return redirect()->route('admin.departures.index')
            ->with('success', 'Data keberangkatan berhasil dihapus.');
    }

    private function validateDeparture(Request $request): array
    {
        return $request->validate([
            'accepting_organization_id' => 'required|exists:accepting_organizations,id',
            'company_id'                => 'nullable|exists:companies,id',
            'interview_id'              => 'nullable|exists:interviews,id',
            'program_type'              => 'nullable|in:ginou_jisshuu,tokutei_ginou',
            'company_name'              => 'required_without:company_id|nullable|string|max:255',
            'departure_date'            => 'required|date',
            'travel_cost'               => 'nullable|integer|min:0',
            'pre_education_fee'         => 'nullable|integer|min:0',
            'shoukairyou_fee'           => 'nullable|integer|min:0',
            'management_fee'            => 'nullable|integer|min:0',
            'notes'                     => 'nullable|string',
            'status'                    => 'required|in:managing,completed,cancelled',
        ]);
    }

    /**
     * Snapshot nama perusahaan: jika perusahaan dipilih, ambil nama dari record
     * (utamakan nama Jepang) agar konsisten. Jika tidak, pakai input teks.
     */
    private function resolveCompanyName(array $data): array
    {
        if (! empty($data['company_id'])) {
            $company = Company::find($data['company_id']);
            if ($company) {
                $data['company_name'] = $company->name_in_japanese ?: $company->name;
            }
        }

        $data['travel_cost'] = $data['travel_cost'] ?? 0;

        return $data;
    }

    /**
     * Tentukan tipe program keberangkatan. Jika ditautkan ke wawancara, ikut
     * tipe wawancara (sumber kebenaran) agar tidak redundan. Tanpa wawancara,
     * pakai input manual / nilai lama / default ginou_jisshuu.
     */
    private function resolveProgramType(array $data, string $fallback = 'ginou_jisshuu'): string
    {
        if (! empty($data['interview_id'])) {
            $type = Interview::whereKey($data['interview_id'])->value('type');

            return $type === 'tokuteiginou' ? 'tokutei_ginou' : 'ginou_jisshuu';
        }

        return $data['program_type'] ?? $fallback;
    }

    /**
     * Daftar nama siswa keberangkatan, diambil dari peserta interview yang lulus.
     *
     * @return array<int, string>
     */
    private function studentNames(Departure $departure): array
    {
        return $departure->interview?->details
            ->where('result', 'passed')
            ->map(fn ($detail) => $detail->user?->name)
            ->filter()
            ->values()
            ->all() ?? [];
    }

    /**
     * Jumlah orang otomatis = jumlah siswa lulus pada interview yang ditautkan.
     * Tanpa interview, pakai fallback (default 1).
     */
    private function peopleFromInterview($interviewId, int $fallback = 1): int
    {
        if (! $interviewId) {
            return max(1, $fallback);
        }

        $count = InterviewDetail::where('interview_id', $interviewId)
            ->where('result', 'passed')
            ->count();

        return max(1, $count);
    }

    /**
     * Opsi interview untuk dropdown pada form keberangkatan.
     */
    private function interviewOptions()
    {
        return Interview::query()
            ->with('company:id,name,name_in_japanese')
            ->withCount(['details as people' => fn ($q) => $q->where('result', 'passed')])
            ->latest('interview_date')
            ->get(['id', 'interviewer_title', 'type', 'company_id', 'accepting_organization_id', 'interview_date'])
            ->map(fn (Interview $i) => [
                'id'                        => $i->id,
                'label'                     => ($i->interviewer_title ?: $i->company?->name ?: 'Interview') . ' — ' . ($i->interview_date ?? '-'),
                'people'                    => $i->people,
                'company_id'                => $i->company_id,
                'company_name'              => $i->company?->name_in_japanese ?: $i->company?->name,
                'accepting_organization_id' => $i->accepting_organization_id,
                'program_type'              => $i->type === 'tokuteiginou' ? 'tokutei_ginou' : 'ginou_jisshuu',
            ]);
    }
}
