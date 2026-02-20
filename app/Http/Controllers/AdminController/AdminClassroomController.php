<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\StudentProfile;
use App\Models\TeacherProfile; // Tambahkan model TeacherProfile
use App\Models\ClassroomLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminClassroomController extends Controller
{
    /**
     * TAMPILKAN SEMUA DAFTAR KELAS (ADMIN VIEW)
     */
    public function index(Request $request)
    {
        $query = Classroom::with(['teacher.user', 'students']); // Load relasi guru & siswa

        // Filter Pencarian Berdasarkan Nama Kelas atau Nama Guru
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhereHas('teacher', function($q) use ($request) {
                      $q->where('name', 'like', '%' . $request->search . '%');
                  });
        }

        $classrooms = $query->withCount(['students' => function ($q) {
                $q->where('classroom_students.status', 'active');
            }])
            ->orderByRaw("CASE WHEN status = 'active' THEN 1 ELSE 2 END")
            ->orderBy('start_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Admin butuh daftar semua Guru untuk dropdown "Buka Kelas Baru"
        $teachers = TeacherProfile::orderBy('name', 'asc')->get();

        return Inertia::render('admin/classrooms/Index', [
            'classrooms' => $classrooms,
            'teachers' => $teachers, // Dikirim agar Admin bisa pilih guru saat buat kelas
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * SIMPAN KELAS BARU (ADMIN VERSION)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'teacher_id' => 'required|exists:teacher_profiles,id', // Admin wajib pilih Guru
            'level' => [
                'required', 
                'in:ATARASHII,N5,N4,N3,N2,N1,Pra-Pemberangkatan,Pra-Pemberangkatan Kaigo'
            ],
        ]);

        DB::beginTransaction();
        try {
            // A. Nonaktifkan kelas lama milik Guru yang dipilih (Optional, tergantung kebijakan LPK)
            // Jika satu guru hanya boleh mengajar satu kelas aktif di level yang sama:
            Classroom::where('teacher_id', $request->teacher_id)
                ->where('status', 'active')
                ->update(['status' => 'finished', 'end_date' => now()]);

            // B. Buat Kelas Baru
            $classroom = Classroom::create([
                'teacher_id' => $request->teacher_id,
                'name' => $request->name,
                'level' => $request->level,
                'status' => 'active',
                'start_date' => now(),
            ]);

            // C. Log Aktifitas Admin
            ClassroomLog::create([
                'classroom_id' => $classroom->id,
                'user_id' => Auth::id(),
                'action' => 'created_by_admin',
                'description' => "Admin membuat kelas {$request->name} dan ditugaskan kepada Sensei ID: {$request->teacher_id}."
            ]);

            DB::commit();
            return back()->with('success', 'Kelas baru berhasil dibuat dan ditugaskan!');
            
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal menyimpan: ' . $e->getMessage()]);
        }
    }

    /**
     * DETAIL KELAS (ADMIN VIEW)
     */
    public function show($id)
    {
        $classroom = Classroom::with([
            'teacher.user', 
            'students' => function($q) {
                $q->wherePivot('status', 'active')->orderBy('full_name', 'asc');
            }
        ])->findOrFail($id);

        // Siswa yang tersedia untuk ditambahkan oleh Admin
        $availableStudents = StudentProfile::whereDoesntHave('classrooms', function($q) {
            $q->where('classrooms.status', 'active')
              ->where('classroom_students.status', 'active');
        })->orderBy('full_name', 'asc')->get();

        return Inertia::render('admin/classrooms/Show', [
            'classroom' => $classroom,
            'availableStudents' => $availableStudents,
        ]);
    }

    /**
     * ADD STUDENT (ADMIN VERSION)
     * Aturan: Siswa tidak boleh masuk jika sedang aktif di kelas lain.
     */
    public function addStudent(Request $request, $classroomId)
    {
        $request->validate(['student_id' => 'required|exists:student_profiles,id']);
        
        $classroom = Classroom::findOrFail($classroomId);
        $student = StudentProfile::findOrFail($request->student_id);

        // Validasi: Apakah kelas ini aktif?
        if ($classroom->status !== 'active') {
            return back()->withErrors(['error' => 'Admin tidak dapat menambahkan siswa ke kelas yang sudah nonaktif.']);
        }

        // Validasi: Apakah siswa sudah ada di kelas LAIN yang aktif?
        $isBusy = DB::table('classroom_students')
                    ->join('classrooms', 'classroom_students.classroom_id', '=', 'classrooms.id')
                    ->where('classroom_students.student_profile_id', $student->id)
                    ->where('classroom_students.status', 'active') 
                    ->where('classrooms.status', 'active')
                    ->exists();

        if ($isBusy) {
            return back()->withErrors(['error' => 'Siswa ini masih terdaftar aktif di kelas lain.']);
        }

        DB::transaction(function() use ($classroom, $student) {
            // Masukkan ke kelas (Attach)
            $classroom->students()->attach($student->id, [
                'status' => 'active',
                'joined_at' => now(),
                'notes' => 'Ditambahkan oleh Admin'
            ]);

            // Log Aktifitas Admin
            ClassroomLog::create([
                'classroom_id' => $classroom->id,
                'user_id' => Auth::id(),
                'action' => 'student_added_by_admin',
                'description' => "Admin menambahkan siswa: {$student->full_name}"
            ]);
        });

        return back()->with('success', 'Siswa berhasil ditambahkan ke kelas oleh Admin.');
    }

    /**
     * REMOVE / GRADUATE STUDENT (ADMIN VERSION)
     * Admin mengeluarkan atau meluluskan siswa dari kelas.
     */
    public function removeStudent(Request $request, $classroomId, $studentId)
    {
        $request->validate([
            'reason' => 'required|in:graduated,dropped,moved',
            'note' => 'nullable|string'
        ]);

        $classroom = Classroom::findOrFail($classroomId);
        $student = StudentProfile::findOrFail($studentId);

        // Update Pivot status
        DB::table('classroom_students')
            ->where('classroom_id', $classroomId)
            ->where('student_profile_id', $studentId)
            ->where('status', 'active')
            ->update([
                'status' => $request->reason,
                'left_at' => now(),
                'notes' => $request->note,
                'updated_at' => now()
            ]);

        // Log Aktifitas Admin
        ClassroomLog::create([
            'classroom_id' => $classroom->id,
            'user_id' => Auth::id(),
            'action' => 'student_removed_by_admin',
            'description' => "Admin mengeluarkan {$student->full_name} dengan status: {$request->reason}"
        ]);

        return back()->with('success', 'Status siswa berhasil diperbarui oleh Admin.');
    }

}