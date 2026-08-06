<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\AcceptingOrganization;
use App\Models\Departure;
use App\Models\StudentReturn;
use App\Models\User;
use App\Services\ReturnReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ReturnController extends Controller
{
    public function __construct(
        private ReturnReportService $report,
    ) {
    }

    /**
     * Unduh laporan kepulangan alumni bulanan (format Kemnaker) untuk satu bulan.
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
    public function index(Request $request)
    {
        $month = $this->resolveMonth($request->input('month'));

        $query = StudentReturn::query()
            ->with([
                'departure.acceptingOrganization:id,name',
                'departure.company:id,name,name_in_japanese',
                'user:id,name,email',
                'user.student_profile:id,user_id,full_name,nik,phone_student',
            ])
            ->whereYear('return_date', $month->year)
            ->whereMonth('return_date', $month->month)
            ->orderByDesc('return_date')
            ->orderByDesc('id');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('user', function ($uq) use ($request) {
                    $uq->where('name', 'like', "%{$request->search}%");
                })
                ->orWhereHas('user.student_profile', function ($pq) use ($request) {
                    $pq->where('full_name', 'like', "%{$request->search}%")
                       ->orWhere('nik', 'like', "%{$request->search}%");
                })
                ->orWhereHas('departure', function ($dq) use ($request) {
                    $dq->where('company_name', 'like', "%{$request->search}%");
                })
                ->orWhere('notes', 'like', "%{$request->search}%");
            });
        }

        if ($request->organization_id) {
            $query->whereHas('departure', function ($q) use ($request) {
                $q->where('accepting_organization_id', $request->organization_id);
            });
        }

        if ($request->reason) {
            $query->where('reason', $request->reason);
        }

        $returns = $query->paginate(10)->withQueryString()
            ->through(function (StudentReturn $r) {
                return [
                    'id'            => $r->id,
                    'departure_id'  => $r->departure_id,
                    'user_id'       => $r->user_id,
                    'student_name'  => $r->user?->student_profile?->full_name ?: $r->user?->name ?: 'Tanpa Nama',
                    'nik'           => $r->user?->student_profile?->nik ?: '-',
                    'company_name'  => $r->departure?->company_name ?: '-',
                    'organization'  => $r->departure?->acceptingOrganization?->name ?: '-',
                    'departure_date'=> $r->departure?->departure_date?->toDateString(),
                    'return_date'   => $r->return_date?->toDateString(),
                    'reason'        => $r->reason,
                    'reason_label'  => $r->reasonLabel(),
                    'notes'         => $r->notes,
                ];
            });

        return Inertia::render('admin/return/Index', [
            'returns'       => $returns,
            'organizations' => AcceptingOrganization::orderBy('name')->get(['id', 'name']),
            'filters'       => $request->only(['search', 'organization_id', 'reason']),
            'month'         => $this->monthMeta($month),
            'summary'       => $this->returnsSummary(),
        ]);
    }

    public function create(Request $request)
    {
        $selectedDepartureId = $request->query('departure_id') ? (int) $request->query('departure_id') : null;
        $departures = $this->getAvailableDepartures($selectedDepartureId);

        return Inertia::render('admin/return/ReturnForm', [
            'departures'           => $departures,
            'selected_departure_id'=> $selectedDepartureId,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'departure_id'              => 'required|exists:departures,id',
            'user_ids'                  => 'nullable|array',
            'user_ids.*'                => 'exists:users,id',
            'student_details'           => 'nullable|array',
            'student_details.*.user_id' => 'required|exists:users,id',
            'student_details.*.reason'  => 'nullable|string',
            'student_details.*.notes'   => 'nullable|string',
            'return_date'               => 'required|date',
            'reason'                    => 'required|string',
            'notes'                     => 'nullable|string',
        ]);

        $departure = Departure::findOrFail($validated['departure_id']);
        $userIds = $validated['user_ids'] ?? [];
        $studentDetails = collect($validated['student_details'] ?? [])->keyBy('user_id');

        if (empty($userIds)) {
            // Pencatatan kepulangan tanpa tautan siswa spesifik (mis. data historis)
            StudentReturn::create([
                'departure_id' => $departure->id,
                'user_id'      => null,
                'return_date'  => $validated['return_date'],
                'reason'       => $validated['reason'],
                'notes'        => $validated['notes'] ?? null,
            ]);
        } else {
            foreach ($userIds as $userId) {
                $detail = $studentDetails->get($userId);
                $reason = ! empty($detail['reason']) ? $detail['reason'] : $validated['reason'];
                $notes = isset($detail['notes']) && $detail['notes'] !== '' ? $detail['notes'] : ($validated['notes'] ?? null);

                // Hindari duplikasi kepulangan untuk siswa & keberangkatan yang sama
                StudentReturn::firstOrCreate(
                    [
                        'departure_id' => $departure->id,
                        'user_id'      => $userId,
                    ],
                    [
                        'return_date' => $validated['return_date'],
                        'reason'      => $reason,
                        'notes'       => $notes,
                    ]
                );
            }
        }

        $departure->syncStatusWithReturns();

        return redirect()->route('admin.returns.index')
            ->with('success', 'Data kepulangan berhasil ditambahkan.');
    }

    public function edit($id)
    {
        $returnRecord = StudentReturn::with([
            'departure.acceptingOrganization:id,name',
            'departure.company:id,name,name_in_japanese',
            'user:id,name',
            'user.student_profile:id,user_id,full_name,nik',
        ])->findOrFail($id);

        $departures = $this->getAvailableDepartures($returnRecord->departure_id);

        return Inertia::render('admin/return/ReturnForm', [
            'returnRecord' => [
                'id'           => $returnRecord->id,
                'departure_id' => $returnRecord->departure_id,
                'user_id'      => $returnRecord->user_id,
                'return_date'  => $returnRecord->return_date?->toDateString(),
                'reason'       => $returnRecord->reason,
                'notes'        => $returnRecord->notes,
            ],
            'departures' => $departures,
        ]);
    }

    /**
     * Ambil daftar keberangkatan yang masih memiliki siswa aktif (belum semua pulang).
     */
    private function getAvailableDepartures(?int $selectedDepartureId = null)
    {
        return Departure::query()
            ->with([
                'acceptingOrganization:id,name',
                'company:id,name,name_in_japanese',
                'interview.details.user:id,name',
                'interview.details.user.student_profile:id,user_id,full_name,nik',
                'returns:id,departure_id,user_id',
            ])
            ->where('status', '!=', 'cancelled')
            ->orderByDesc('departure_date')
            ->get()
            ->map(function (Departure $d) {
                $returnedUserIds = $d->returns->pluck('user_id')->filter()->all();

                $students = $d->interview?->details
                    ->where('result', 'passed')
                    ->map(function ($detail) use ($returnedUserIds) {
                        $user = $detail->user;
                        if (! $user) {
                            return null;
                        }

                        return [
                            'id'          => $user->id,
                            'name'        => $user->student_profile?->full_name ?: $user->name,
                            'nik'         => $user->student_profile?->nik ?: '',
                            'is_returned' => in_array($user->id, $returnedUserIds, true),
                        ];
                    })
                    ->filter()
                    ->values()
                    ->all() ?? [];

                return [
                    'id'           => $d->id,
                    'company_name' => $d->company_name,
                    'organization' => $d->acceptingOrganization?->name,
                    'departure_date' => $d->departure_date?->toDateString(),
                    'people_count' => $d->people_count,
                    'status'       => $d->status,
                    'students'     => $students,
                ];
            })
            ->filter(function ($d) use ($selectedDepartureId) {
                // Pertahankan jika ini adalah keberangkatan yang terpilih (edit / query param)
                if ($selectedDepartureId && $d['id'] === $selectedDepartureId) {
                    return true;
                }
                // Sembunyikan jika status sudah completed (selesai)
                if ($d['status'] === 'completed') {
                    return false;
                }
                // Sembunyikan jika seluruh siswa dalam list sudah tercatat pulang
                if (! empty($d['students']) && collect($d['students'])->every(fn ($s) => $s['is_returned'])) {
                    return false;
                }

                return true;
            })
            ->values();
    }

    public function update(Request $request, $id)
    {
        $returnRecord = StudentReturn::findOrFail($id);

        $validated = $request->validate([
            'departure_id' => 'required|exists:departures,id',
            'return_date'  => 'required|date',
            'reason'       => 'required|in:finished,early_return,other',
            'notes'        => 'nullable|string',
        ]);

        $returnRecord->update($validated);

        if ($returnRecord->departure) {
            $returnRecord->departure->syncStatusWithReturns();
        }

        return redirect()->route('admin.returns.index')
            ->with('success', 'Data kepulangan berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $returnRecord = StudentReturn::findOrFail($id);
        $departure = $returnRecord->departure;

        $returnRecord->delete();

        if ($departure) {
            $departure->syncStatusWithReturns();
        }

        return redirect()->route('admin.returns.index')
            ->with('success', 'Data kepulangan berhasil dihapus.');
    }

    private function resolveMonth(?string $value): Carbon
    {
        if ($value && preg_match('/^\d{4}-\d{2}$/', $value)) {
            try {
                return Carbon::createFromFormat('Y-m-d', $value . '-01')->startOfMonth();
            } catch (\Throwable) {
                // fallback
            }
        }

        return Carbon::now()->startOfMonth();
    }

    private function monthMeta(Carbon $month): array
    {
        $ofMonth = StudentReturn::query()
            ->whereYear('return_date', $month->year)
            ->whereMonth('return_date', $month->month)
            ->get(['id']);

        return [
            'value'   => $month->format('Y-m'),
            'label'   => $this->monthLabel($month),
            'prev'    => $month->copy()->subMonthNoOverflow()->format('Y-m'),
            'next'    => $month->copy()->addMonthNoOverflow()->format('Y-m'),
            'current' => Carbon::now()->format('Y-m'),
            'total'   => $ofMonth->count(),
        ];
    }

    private function returnsSummary(): array
    {
        $totalReturns = StudentReturn::count();

        $finishedCount = StudentReturn::where('reason', 'finished')->count();
        $earlyCount = StudentReturn::where('reason', 'early_return')->count();

        return [
            'total_returns'  => $totalReturns,
            'finished_count' => $finishedCount,
            'early_count'    => $earlyCount,
        ];
    }

    private function monthLabel(Carbon $month): string
    {
        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        return $months[$month->month] . ' ' . $month->year;
    }
}
