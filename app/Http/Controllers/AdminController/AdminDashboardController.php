<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\AcceptingOrganization;
use App\Models\Company;
use App\Models\Departure;
use App\Models\Interview;
use App\Models\Teacher;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function __construct(private BillingService $billing)
    {
    }

    public function index()
    {
        $stats = [
            'total_students'      => User::where('role', 'student')->count(),
            'total_interviews'    => Interview::count(),
            'upcoming_interviews' => Interview::where('interview_date', '>=', now()->toDateString())->count(),
            'total_companies'     => Company::count(),
            'total_organizations' => AcceptingOrganization::count(),
            'total_teachers'      => Teacher::count(),
        ];

        $recentInterviews = Interview::with(['company:id,name', 'acceptingOrganization:id,name'])
            ->withCount('details')
            ->latest()
            ->take(5)
            ->get(['id', 'interviewer_title', 'type', 'interview_date', 'company_id', 'accepting_organization_id']);

        return Inertia::render('admin/dashboard', [
            'stats'           => $stats,
            'recentInterviews' => $recentInterviews,
            'calendarEvents'  => $this->calendarEvents(),
        ]);
    }

    /**
     * Kumpulkan semua event lintas-modul untuk kalender dashboard.
     *
     * Jenis event:
     *  - interview          : tanggal wawancara
     *  - interview_deadline : batas pendaftaran wawancara
     *  - departure          : keberangkatan ke Jepang
     *  - training_end       : selesai pelatihan training center (H+1 bulan)
     *  - billing            : tanggal penagihan + item (management fee / 渡航費 / 事前教育費)
     *
     * @return array<int, array<string, mixed>>
     */
    private function calendarEvents(): array
    {
        $events = [];

        // 1 & 2 — Wawancara + deadline pendaftaran.
        $interviews = Interview::with(['company:id,name,name_in_japanese', 'acceptingOrganization:id,name'])
            ->withCount('details')
            ->get(['id', 'interviewer_title', 'company_id', 'accepting_organization_id', 'interview_date', 'interview_registration_deadline']);

        foreach ($interviews as $iv) {
            $company = $iv->company?->name_in_japanese ?: $iv->company?->name;
            $org = $iv->acceptingOrganization?->name;
            $subtitle = trim(($company ?? '-') . ($org ? ' • ' . $org : ''));

            if ($iv->interview_date) {
                $events[] = [
                    'date'     => Carbon::parse($iv->interview_date)->toDateString(),
                    'type'     => 'interview',
                    'title'    => $iv->interviewer_title ?: ($company ?: 'Wawancara'),
                    'subtitle' => $subtitle,
                    'people'   => $iv->details_count,
                    'url'      => "/admin/interviews/{$iv->id}",
                ];
            }

            if ($iv->interview_registration_deadline) {
                $events[] = [
                    'date'     => Carbon::parse($iv->interview_registration_deadline)->toDateString(),
                    'type'     => 'interview_deadline',
                    'title'    => $iv->interviewer_title ?: ($company ?: 'Wawancara'),
                    'subtitle' => $subtitle,
                    'detail'   => 'Batas pendaftaran wawancara',
                    'url'      => "/admin/interviews/{$iv->id}",
                ];
            }
        }

        // 3, 4 & 5 — Keberangkatan, selesai training center, dan penagihan.
        $departures = Departure::with([
                'acceptingOrganization:id,name,pre_education_fee,management_fee',
                'company:id,name,name_in_japanese',
                'interview.details.user:id,name',
                'billings',
            ])
            ->whereNotNull('departure_date')
            ->where('status', '!=', 'cancelled')
            ->get();

        foreach ($departures as $d) {
            $students = $this->passedStudentNames($d);
            $people = max(1, (int) $d->people_count);
            $company = $d->company_name;
            $org = $d->acceptingOrganization?->name;
            $subtitle = trim(($company ?? '-') . ($org ? ' • ' . $org : ''));

            // 3 — Keberangkatan ke Jepang.
            $events[] = [
                'date'     => $d->departure_date->toDateString(),
                'type'     => 'departure',
                'title'    => $company,
                'subtitle' => $subtitle,
                'people'   => $people,
                'students' => $students,
                'url'      => "/admin/departures/{$d->id}",
            ];

            // 4 — Selesai pelatihan training center (H+1 bulan setelah berangkat).
            $events[] = [
                'date'     => $d->departure_date->copy()->addMonthsNoOverflow(BillingService::TRAINING_CENTER_MONTHS)->toDateString(),
                'type'     => 'training_end',
                'title'    => $company,
                'subtitle' => $subtitle,
                'people'   => $people,
                'students' => $students,
                'detail'   => 'Selesai pelatihan training center',
                'url'      => "/admin/departures/{$d->id}",
            ];

            // 5-TG — Penagihan TG memakai cicilan manual (渡航費 / 紹介料), bukan rumus.
            if ($d->status === 'managing' && $d->isTokuteiGinou()) {
                foreach ($d->billings as $billing) {
                    if (! $billing->due_date) {
                        continue;
                    }

                    $recipient = $billing->bill_to === 'company'
                        ? ($d->company?->name_in_japanese ?: $d->company?->name ?: $company)
                        : $org;

                    $url = $billing->bill_to === 'company'
                        ? "/admin/invoices/create?recipient_type=company&recipient_id={$d->company_id}&month={$billing->due_date->format('Y-m')}"
                        : "/admin/invoices/create?recipient_type=organization&recipient_id={$d->accepting_organization_id}&month={$billing->due_date->format('Y-m')}";

                    $events[] = [
                        'date'     => $billing->due_date->toDateString(),
                        'type'     => 'billing',
                        'title'    => $company,
                        'subtitle' => $recipient,
                        'detail'   => ($billing->description ?: $this->billing->installmentLabel($billing->kind))
                            . ' (' . ($billing->bill_to === 'company' ? 'ke perusahaan' : 'ke kumiai') . ')',
                        'people'   => max(1, (int) $billing->people),
                        'amount'   => (int) $billing->amount,
                        'students' => $students,
                        'url'      => $url,
                    ];
                }

                continue;
            }

            // 5a — Penagihan satu kali (渡航費 & 事前教育費) di tanggal keberangkatan.
            if ($d->status === 'managing') {
                $travel = (int) ($d->travel_cost ?? 0);
                if ($travel > 0) {
                    $events[] = [
                        'date'     => $d->departure_date->toDateString(),
                        'type'     => 'billing',
                        'title'    => $company,
                        'subtitle' => $org,
                        'detail'   => '渡航費 (biaya keberangkatan)',
                        'people'   => $people,
                        'amount'   => $travel * $people,
                        'students' => $students,
                        'url'      => "/admin/invoices/create?organization_id={$d->accepting_organization_id}&month={$d->departure_date->format('Y-m')}",
                    ];
                }

                $preEducation = $d->effectivePreEducationFee();
                if ($preEducation > 0) {
                    $events[] = [
                        'date'     => $d->departure_date->toDateString(),
                        'type'     => 'billing',
                        'title'    => $company,
                        'subtitle' => $org,
                        'detail'   => '事前教育費 (biaya pendidikan pra-keberangkatan)',
                        'people'   => $people,
                        'amount'   => $preEducation * $people,
                        'students' => $students,
                        'url'      => "/admin/invoices/create?organization_id={$d->accepting_organization_id}&month={$d->departure_date->format('Y-m')}",
                    ];
                }

                // 5b — Penagihan management fee per siklus.
                foreach ($this->billing->schedule($d) as $block) {
                    $events[] = [
                        'date'     => $block['bill_date']->toDateString(),
                        'type'     => 'billing',
                        'title'    => $company,
                        'subtitle' => $org,
                        'detail'   => sprintf(
                            '技能実習生管理費 %s〜%s (%d bulan)',
                            $block['period_from']->format('M Y'),
                            $block['period_to']->format('M Y'),
                            $block['months'],
                        ),
                        'people'   => $block['people'],
                        'amount'   => $block['amount'],
                        'students' => $students,
                        'url'      => "/admin/invoices/create?organization_id={$d->accepting_organization_id}&month={$block['bill_date']->format('Y-m')}",
                    ];
                }
            }
        }

        return $events;
    }

    /**
     * Nama siswa keberangkatan (peserta wawancara yang lulus).
     *
     * @return array<int, string>
     */
    private function passedStudentNames(Departure $departure): array
    {
        return $departure->interview?->details
            ->where('result', 'passed')
            ->map(fn ($detail) => $detail->user?->name)
            ->filter()
            ->values()
            ->all() ?? [];
    }
}
