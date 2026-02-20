<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\Recruitment;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecruitmentsController extends Controller
{
    /**
     * Tampilkan daftar rekrutmen (Read)
     */
    public function index(Request $request)
    {
        $query = Recruitment::query();

        // Fitur Pencarian
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Mengurutkan berdasarkan kolom 'date' secara descending (terbaru ke terlama)
        $recruitments = $query->orderBy('date', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/recruitments/Index', [
            'recruitments' => $recruitments,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Simpan data rekrutmen baru (Create)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'type' => 'required|in:regular,job_matching',
            'is_active' => 'required|boolean',
        ]);

        Recruitment::create($validated);

        return back()->with('success', 'Data rekrutmen berhasil ditambahkan.');
    }

    /**
     * Update data rekrutmen (Update)
     */
    public function update(Request $request, $id)
    {
        $recruitment = Recruitment::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'type' => 'required|in:regular,job_matching',
            'is_active' => 'required|boolean',
        ]);

        $recruitment->update($validated);

        return back()->with('success', 'Data rekrutmen berhasil diperbarui.');
    }

    /**
     * Hapus data rekrutmen (Delete)
     */
    public function destroy($id)
    {
        $recruitment = Recruitment::findOrFail($id);

        $recruitment->delete();

        return back()->with('success', 'Data rekrutmen berhasil dihapus.');
    }

    public function show($id)
    {
        // 1. Ambil data rekrutmen beserta siswanya
        // Kita gunakan Eager Loading yang dalam (Deep Eager Loading) untuk performa
        $recruitment = Recruitment::with([
            'students' => function($query) {
                $query->with([
                    'user',
                    // Ambil riwayat kelas dan guru yang mengajar
                    'classrooms' => function($q) {
                        $q->with('teacher');
                    },
                    // Ambil riwayat wawancara, hasil, dan detail perusahaannya
                    'user.hasManyInterviewDetails' => function($q) {
                        $q->with(['interview.company']);
                    }
                ]);
            }
        ])->findOrFail($id);

        // 2. Transformasi data siswa agar lebih mudah dibaca di Frontend (Inertia)
        $studentList = $recruitment->students->map(function ($student) {
            
            // A. Cari Kelas Sekarang (yang statusnya aktif)
            $currentClass = $student->classrooms->where('pivot.status', 'active')->first();

            // B. Kumpulkan daftar Sensei yang pernah mengajar (unik)
            $teachers = $student->classrooms->map(function($cls) {
                return $cls->teacher ? $cls->teacher->name : null;
            })->filter()->unique()->values();

            // C. Filter Riwayat Wawancara
            $allInterviews = $student->user->hasManyInterviewDetails ?? collect([]);
            
            $passedInterview = $allInterviews->where('result', 'passed')->first();

            return [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'nik' => $student->nik,
                'gender' => $student->gender,
                // Status Kelas
                'current_class' => $currentClass ? $currentClass->name : 'CUTI / TIDAK ADA KELAS',
                'class_level' => $currentClass ? $currentClass->level : '-',
                'all_teachers' => $teachers,
                // Statistik Wawancara
                'total_interviews' => $allInterviews->count(),
                'interview_status' => $passedInterview ? 'LULUS SELEKSI' : 'BELUM LULUS',
                // Detail Jika Lulus
                'passed_job' => $passedInterview ? [
                    'company_name' => $passedInterview->interview->company->name,
                    'company_japanese' => $passedInterview->interview->company->name_in_japanese,
                    'job_type' => $passedInterview->interview->interviewer_title,
                    'interview_date' => $passedInterview->interview->interview_date,
                ] : null,
                'interview_history' => $allInterviews->map(function($detail) {
                    return [
                        'title' => $detail->interview->interviewer_title,
                        'company' => $detail->interview->company->name,
                        'date' => $detail->interview->interview_date,
                        'result' => $detail->result
                    ];
                })
            ];
        });

        return Inertia::render('admin/recruitments/Show', [
            'recruitment' => $recruitment->only(['id', 'name', 'date', 'type', 'is_active']),
            'students' => $studentList,
            'stats' => [
                'total_students' => $studentList->count(),
                'passed_count' => $studentList->where('interview_status', 'LULUS SELEKSI')->count(),
                'waiting_count' => $studentList->where('interview_status', 'BELUM LULUS')->count(),
            ]
        ]);
    }
}