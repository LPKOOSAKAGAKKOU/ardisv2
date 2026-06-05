<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\AcceptingOrganization;
use App\Models\Company;
use App\Models\Departure;
use App\Models\Interview;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartureController extends Controller
{
    public function __construct(private BillingService $billing)
    {
    }

    public function index(Request $request)
    {
        $query = Departure::query()
            ->with([
                'acceptingOrganization:id,name,pre_education_fee,management_fee',
                'company:id,name,name_in_japanese',
                'interview:id',
                'interview.details:id,interview_id,user_id,result',
                'interview.details.user:id,name',
            ])
            ->latest('departure_date');

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

        $departures = $query->paginate(15)->withQueryString()
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
        ]);
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
                'id'             => $departure->id,
                'company_name'   => $departure->company_name,
                'organization'   => $departure->acceptingOrganization?->name,
                'departure_date' => $departure->departure_date?->toDateString(),
                'people_count'   => $departure->people_count,
                'travel_cost'    => $departure->travel_cost,
                'status'         => $departure->status,
                'notes'          => $departure->notes,
                'interview_id'   => $departure->interview_id,
                'students'       => $this->studentNames($departure),
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
        ]);
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
            'company_name'              => 'required_without:company_id|nullable|string|max:255',
            'departure_date'            => 'required|date',
            'people_count'              => 'required|integer|min:1',
            'travel_cost'               => 'nullable|integer|min:0',
            'pre_education_fee'         => 'nullable|integer|min:0',
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
     * Opsi interview untuk dropdown pada form keberangkatan.
     */
    private function interviewOptions()
    {
        return Interview::query()
            ->with('company:id,name,name_in_japanese')
            ->latest('interview_date')
            ->get(['id', 'interviewer_title', 'company_id', 'interview_date'])
            ->map(fn (Interview $i) => [
                'id'    => $i->id,
                'label' => ($i->interviewer_title ?: $i->company?->name ?: 'Interview') . ' — ' . ($i->interview_date ?? '-'),
            ]);
    }
}
