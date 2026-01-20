<?php

namespace App\Http\Controllers\StudentController;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Mengambil profil siswa beserta relasi yang diperlukan
        $student = StudentProfile::with(['educations', 'experiences', 'families'])
            ->where('user_id', $user->id)
            ->first();

        // Placeholder untuk data wawancara (bisa dihubungkan ke model Interview nanti)
        $interviews = []; 

        return Inertia::render('student/Dashboard', [
            'student' => $student,
            'interviews' => $interviews,
            'auth' => [
                'user' => $user
            ]
        ]);
    }
}