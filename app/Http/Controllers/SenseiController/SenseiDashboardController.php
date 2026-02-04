<?php

namespace App\Http\Controllers\SenseiController;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\StudentProfile;
use App\Models\Interview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SenseiDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $teacherId = $user->teacher ? $user->teacher->id : null;

        // 1. Cari Kelas yang Sedang AKTIF milik Sensei ini
        $activeClass = Classroom::where('teacher_id', $teacherId)
            ->where('status', 'active')
            ->withCount(['students' => function($q) {
                $q->where('classroom_students.status', 'active');
            }])
            ->first(); 

        // 2. Statistik Total Siswa Aktif (di kelas sensei ini)
        $totalStudents = StudentProfile::whereHas('classrooms', function($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId)
              ->where('classrooms.status', 'active')
              ->where('classroom_students.status', 'active');
        })->count();

        // 3. Statistik Wawancara Mendatang (Global/Umum)
        $interviewCount = Interview::where('interview_date', '>=', now())->count();

        return Inertia::render('sensei/dashboard', [
            'activeClass' => $activeClass,
            'stats' => [
                'total_students' => $totalStudents,
                'upcoming_interviews' => $interviewCount,
            ]
        ]);
    }
}