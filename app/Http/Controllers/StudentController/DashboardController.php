<?php

namespace App\Http\Controllers\StudentController;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\InterviewDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Interview;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // 1. Ambil profil siswa
        $student = StudentProfile::with(['educations', 'experiences', 'families'])
            ->where('user_id', $user->id)
            ->first();

        // 2. CEK STATUS KELULUSAN
        // Cari apakah user ini punya riwayat interview yang statusnya 'passed'
        $passedApplication = InterviewDetail::with(['interview.company'])
            ->where('user_id', $user->id)
            ->where('result', 'passed')
            ->latest()
            ->first();

        // 3. Ambil daftar wawancara (Hanya jika BELUM lulus)
        $interviews = [];
        if (!$passedApplication) {
            $interviews = Interview::with(['company'])
                ->where('interview_date', '>=', now()->toDateString())
                ->orderBy('interview_date', 'asc')
                ->get();
        }

        return Inertia::render('student/dashboard', [
            'student' => $student,
            'passedApplication' => $passedApplication, // Kirim data kelulusan ke frontend
            'interviews' => $interviews,
            'auth' => [
                'user' => $user
            ]
        ]);
    }
}