<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\AcceptingOrganization;
use App\Models\Company;
use App\Models\Interview;
use App\Models\Teacher;
use App\Models\User;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
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
            'stats' => $stats,
            'recentInterviews' => $recentInterviews,
        ]);
    }
}
