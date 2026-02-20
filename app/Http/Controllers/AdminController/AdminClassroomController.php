<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\StudentProfile;
use App\Models\Teacher; // <--- UBAH INI (Bukan TeacherProfile)
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
        // Gunakan relasi 'teacher' (yang mengarah ke model Teacher)
        $query = Classroom::with(['teacher.user']); 

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

        // UBAH DISINI: Panggil model Teacher
        $teachers = Teacher::where('is_active', true)->orderBy('name', 'asc')->get();

        return Inertia::render('admin/classrooms/Index', [
            'classrooms' => $classrooms,
            'teachers' => $teachers,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * SIMPAN KELAS BARU
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'teacher_id' => 'required|exists:teachers,id', // <--- Pastikan tabelnya 'teachers'
            'level' => [
                'required', 
                'in:ATARASHII,N5,N4,N3,N2,N1,Pra-Pemberangkatan,Pra-Pemberangkatan Kaigo'
            ],
        ]);

        DB::beginTransaction();
        try {
            // Nonaktifkan kelas lama milik guru tersebut
            Classroom::where('teacher_id', $request->teacher_id)
                ->where('status', 'active')
                ->update(['status' => 'finished', 'end_date' => now()]);

            $classroom = Classroom::create([
                'teacher_id' => $request->teacher_id,
                'name' => $request->name,
                'level' => $request->level,
                'status' => 'active',
                'start_date' => now(),
            ]);

            ClassroomLog::create([
                'classroom_id' => $classroom->id,
                'user_id' => Auth::id(),
                'action' => 'created_by_admin',
                'description' => "Admin membuat kelas {$request->name} untuk Sensei {$classroom->teacher->name}."
            ]);

            DB::commit();
            return back()->with('success', 'Kelas baru berhasil dibuka!');
            
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal: ' . $e->getMessage()]);
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

    /**
     * MONITORING NILAI (ADMIN)
     */
    public function getGradesData($classroomId)
    {
        // Logic sama dengan Sensei agar komponen UI bisa di-reuse
        $grades = \App\Models\ClassroomGrade::where('classroom_id', $classroomId)
            ->with('student:id,full_name,nik')
            ->orderBy('created_at', 'desc')
            ->get();

        $assignments = $grades->groupBy(function($item) {
            return $item->type . ' - ' . $item->title;
        })->map(function($items) {
            return [
                'type' => $items->first()->type,
                'title' => $items->first()->title,
                'avg' => round($items->avg('score'), 1)
            ];
        })->values();

        return response()->json([
            'grades' => $grades,
            'assignments' => $assignments
        ]);
    }

    /**
     * MONITORING ABSENSI (ADMIN)
     */
    public function getAttendanceData(Request $request, $classroomId)
    {
        $request->validate([
            'mode' => 'required|in:day,month',
            'date' => 'required_if:mode,day|date',
            'month' => 'required_if:mode,month|date_format:Y-m',
        ]);

        $query = \App\Models\ClassroomAttendance::where('classroom_id', $classroomId);

        if ($request->mode === 'day') {
            $data = $query->whereDate('date', $request->date)->get();
        } else {
            $parts = explode('-', $request->month);
            $data = $query->whereYear('date', $parts[0])
                          ->whereMonth('date', $parts[1])
                          ->orderBy('date', 'asc')
                          ->get();
        }

        return response()->json($data);
    }

}