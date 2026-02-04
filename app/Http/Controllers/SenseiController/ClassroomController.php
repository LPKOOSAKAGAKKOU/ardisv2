<?php

namespace App\Http\Controllers\SenseiController; // Sesuaikan namespace Anda

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\StudentProfile;
use App\Models\ClassroomLog;
use App\Models\ClassroomAttendance; // Tambahkan ini
use App\Models\ClassroomGrade;      // Tambahkan ini
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClassroomController extends Controller
{
    /**
     * 1. CREATE CLASS
     * Aturan: Jika Sensei buat kelas baru, kelas lama otomatis Nonaktif.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'level' => 'required|in:N5,N4,N3,N2,N1,Kaigo,Basic',
        ]);

        $user = Auth::user();
        // Asumsi: Relasi User -> Teacher sudah ada.
        // Jika user login adalah admin yang memilihkan guru, sesuaikan logic ini.
        $teacher = $user->role === 'sensei' ? $user->teacher : null; 
        
        if (!$teacher) {
            return back()->withErrors(['error' => 'Data Sensei tidak ditemukan untuk akun ini.']);
        }

        DB::beginTransaction();
        try {
            // A. Nonaktifkan semua kelas aktif milik sensei ini (Auto-Close)
            Classroom::where('teacher_id', $teacher->id)
                ->where('status', 'active')
                ->update(['status' => 'finished', 'end_date' => now()]);

            // B. Buat Kelas Baru
            $classroom = Classroom::create([
                'teacher_id' => $teacher->id,
                'name' => $request->name,
                'level' => $request->level,
                'status' => 'active',
                'start_date' => now(),
            ]);

            // C. Catat Log
            ClassroomLog::create([
                'classroom_id' => $classroom->id,
                'user_id' => $user->id,
                'action' => 'created',
                'description' => "Kelas {$classroom->name} dibuat. Kelas lama dinonaktifkan."
            ]);

            DB::commit();
            return back()->with('success', 'Kelas baru berhasil dibuka!');
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show($id)
    {
        // Load kelas beserta siswa yang aktif di dalamnya
        $classroom = Classroom::with(['students' => function($q) {
            $q->wherePivot('status', 'active')
              ->orderBy('name', 'asc');
        }])->findOrFail($id);

        // Ambil data siswa yang BISA ditambahkan (Siswa yang belum masuk kelas manapun yang aktif)
        // Logic: Cari siswa yang TIDAK PUNYA riwayat kelas dengan status 'active'
        $availableStudents = StudentProfile::whereDoesntHave('classrooms', function($q) {
            $q->where('classrooms.status', 'active')
              ->where('classroom_students.status', 'active');
        })->orderBy('name', 'asc')->get();

        return Inertia::render('sensei/classrooms/Show', [
            'classroom' => $classroom,
            'availableStudents' => $availableStudents, // Untuk dropdown "Tambah Siswa"
        ]);
    }

    /**
     * 2. ADD STUDENT
     * Aturan: Siswa tidak boleh masuk jika sedang aktif di kelas lain.
     */
    public function addStudent(Request $request, $classroomId)
    {
        $request->validate(['student_id' => 'required|exists:student_profiles,id']);
        
        $classroom = Classroom::findOrFail($classroomId);
        $student = StudentProfile::findOrFail($request->student_id);

        // Validasi: Apakah kelas ini aktif?
        if ($classroom->status !== 'active') {
            return back()->withErrors(['error' => 'Kelas ini sudah ditutup/nonaktif.']);
        }

        // Validasi: Apakah siswa sudah ada di kelas LAIN yang aktif?
        // Kita cek di tabel pivot, apakah ada status 'active' untuk siswa ini
        $isBusy = DB::table('classroom_students')
                    ->join('classrooms', 'classroom_students.classroom_id', '=', 'classrooms.id')
                    ->where('classroom_students.student_profile_id', $student->id)
                    ->where('classroom_students.status', 'active') // Status siswa aktif
                    ->where('classrooms.status', 'active') // Kelasnya juga aktif
                    ->exists();

        if ($isBusy) {
            return back()->withErrors(['error' => 'Siswa ini sedang aktif di kelas lain. Keluarkan dulu dari kelas lama.']);
        }

        DB::transaction(function() use ($classroom, $student) {
            // Masukkan ke kelas (Attach)
            $classroom->students()->attach($student->id, [
                'status' => 'active',
                'joined_at' => now(),
                'notes' => 'Masuk baru'
            ]);

            // Log
            ClassroomLog::create([
                'classroom_id' => $classroom->id,
                'user_id' => Auth::id(),
                'action' => 'student_added',
                'description' => "Menambahkan siswa: {$student->name}"
            ]);
        });

        return back()->with('success', 'Siswa berhasil ditambahkan ke kelas.');
    }

    /**
     * 3. REMOVE / GRADUATE STUDENT
     * Siswa dikeluarkan atau diluluskan dari kelas (Soft detach).
     */
    public function removeStudent(Request $request, $classroomId, $studentId)
    {
        $request->validate([
            'reason' => 'required|in:graduated,dropped,moved', // Lulus, Keluar, Pindah
            'note' => 'nullable|string'
        ]);

        $classroom = Classroom::findOrFail($classroomId);

        // Update Pivot (Bukan delete, tapi update status & left_at)
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

        // Log
        ClassroomLog::create([
            'classroom_id' => $classroom->id,
            'user_id' => Auth::id(),
            'action' => 'student_removed',
            'description' => "Siswa dikeluarkan dengan status: {$request->reason}"
        ]);

        return back()->with('success', 'Status siswa diperbarui.');
    }

    /**
     * 4. INPUT ABSENSI (Batch/Harian)
     * Sensei mengabsen banyak siswa sekaligus dalam satu tanggal.
     */
    public function storeAttendance(Request $request, $classroomId)
    {
        $request->validate([
            'date' => 'required|date',
            // Kita terima array data absen agar bisa simpan satu kelas sekaligus
            // Format: [{student_id: 1, status: 'hadir', note: ''}, ...]
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:student_profiles,id',
            'attendances.*.status' => 'required|in:hadir,sakit,izin,alpha,terlambat',
            'attendances.*.note' => 'nullable|string',
        ]);

        $classroom = Classroom::findOrFail($classroomId);

        DB::transaction(function() use ($request, $classroom) {
            foreach ($request->attendances as $data) {
                // Gunakan updateOrCreate agar jika data tanggal tsb sudah ada, 
                // datanya di-update (koreksi), bukan error duplicate.
                ClassroomAttendance::updateOrCreate(
                    [
                        'classroom_id' => $classroom->id,
                        'student_profile_id' => $data['student_id'],
                        'date' => $request->date, // Unique Key gabungan
                    ],
                    [
                        'status' => $data['status'],
                        'note' => $data['note'] ?? null,
                    ]
                );
            }

            // Log activity (sekali saja per batch)
            ClassroomLog::create([
                'classroom_id' => $classroom->id,
                'user_id' => Auth::id(),
                'action' => 'attendance_filled',
                'description' => "Mengisi absensi untuk tanggal {$request->date}"
            ]);
        });

        return back()->with('success', 'Data absensi berhasil disimpan.');
    }

    /**
     * 5. INPUT ABSENSI VIA QR CODE
     * Menerima hash string dari QR, mencari siswa di kelas ini, lalu absen.
     */
    public function storeAttendanceQR(Request $request, $classroomId)
    {
        $request->validate([
            'date' => 'required|date',
            'qr_code' => 'required|string', // String hash hasil scan
            'status' => 'in:hadir,sakit,izin,alpha,terlambat', // Default hadir jika kosong
            'note' => 'nullable|string',
        ]);

        $classroom = Classroom::findOrFail($classroomId);
        
        // 1. Ambil semua siswa yang ada di kelas ini (Active Students)
        // Kita butuh NIK mereka untuk verifikasi hash
        $studentsInClass = $classroom->students()
                            ->wherePivot('status', 'active')
                            ->get();

        $matchedStudent = null;

        // 2. Loop siswa di kelas untuk mencocokkan Hash QR
        // Kenapa loop? Karena hash_hmac satu arah, kita tidak bisa query DB 'where hash = ?'
        // Tapi karena 1 kelas cuma 20-40 siswa, loop ini sangat cepat (microseconds).
        foreach ($studentsInClass as $student) {
            // Generate hash siswa ini
            $studentHash = hash_hmac('sha256', $student->nik, config('app.key'));
            
            // Bandingkan dengan QR yang discan
            if ($studentHash === $request->qr_code) {
                $matchedStudent = $student;
                break; 
            }
        }

        if (!$matchedStudent) {
            return response()->json([
                'status' => 'error',
                'message' => 'QR Code tidak dikenali atau siswa tidak terdaftar di kelas ini.'
            ], 404);
        }

        // 3. Simpan Absen
        DB::transaction(function() use ($classroom, $matchedStudent, $request) {
            ClassroomAttendance::updateOrCreate(
                [
                    'classroom_id' => $classroom->id,
                    'student_profile_id' => $matchedStudent->id,
                    'date' => $request->date,
                ],
                [
                    'status' => $request->status ?? 'hadir',
                    'note' => $request->note ?? 'Via QR Scan',
                ]
            );

            // Log activity (Opsional, matikan jika terlalu spammy untuk scan satu-satu)

            ClassroomLog::create([
                'classroom_id' => $classroom->id,
                'user_id' => Auth::id(),
                'action' => 'attendance_qr',
                'description' => "Scan QR kehadiran: {$matchedStudent->name}"
            ]);

        });

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil absen: {$matchedStudent->name}",
            'student' => [
                'name' => $matchedStudent->name,
                'status' => $request->status ?? 'hadir'
            ]
        ]);
    }

    /**
     * 6. INPUT NILAI (Per Siswa atau Per Tugas)
     * Sensei memasukkan nilai quiz/ujian.
     */
    public function storeGrade(Request $request, $classroomId)
    {
        $request->validate([
            'student_id' => 'required|exists:student_profiles,id',
            'type' => 'required|string', // Contoh: "Bunpo", "Ch 
            'title' => 'required|string', // Contoh: "Bab 1", "Quiz 2"
            'score' => 'required|integer|min:0|max:100',
            'feedback' => 'nullable|string'
        ]);

        $classroom = Classroom::findOrFail($classroomId);

        // Simpan Nilai
        $grade = ClassroomGrade::create([
            'classroom_id' => $classroom->id,
            'student_profile_id' => $request->student_id,
            'type' => $request->type,
            'title' => $request->title,
            'score' => $request->score,
            'feedback' => $request->feedback
        ]);

        // Log
        ClassroomLog::create([
            'classroom_id' => $classroom->id,
            'user_id' => Auth::id(),
            'action' => 'grade_added',
            'description' => "Input nilai {$request->type} ({$request->title}) untuk siswa ID: {$request->student_id}"
        ]);

        return back()->with('success', 'Nilai berhasil dimasukkan.');
    }
    
    /**
     * 6. HAPUS NILAI (Opsional, jika salah input)
     */
    public function destroyGrade($classroomId, $gradeId)
    {
        $grade = ClassroomGrade::where('classroom_id', $classroomId)->findOrFail($gradeId);
        $grade->delete();

        return back()->with('success', 'Data nilai berhasil dihapus.');
    }
}