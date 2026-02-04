<?php

namespace App\Http\Controllers\SenseiController;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth; // Jangan lupa import Auth
use App\Services\YunervaService;
use Inertia\Inertia;
use App\Models\Province;
use App\Models\JobSector;
use Illuminate\Support\Str;
use App\Models\Major;

class SenseiStudentController extends Controller
{
    protected $yunerva;

    public function __construct(YunervaService $yunerva)
    {
        $this->yunerva = $yunerva;
    }

    /**
     * =========================================================================
     * HELPER: CORE QUERY FILTER
     * Fungsi ini memastikan Sensei HANYA bisa mengakses siswa yang:
     * 1. Ada di kelas milik Sensei tersebut.
     * 2. Status kelasnya 'active'.
     * 3. Status siswanya di kelas tersebut 'active'.
     * =========================================================================
     */
    private function getMyStudentsQuery()
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'sensei' || !$user->teacher) {
            return StudentProfile::where('id', 0);
        }

        $teacherId = $user->teacher->id;

        return StudentProfile::whereHas('classrooms', function ($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId)
              ->where('classrooms.status', 'active') // <--- PERBAIKAN DI SINI (tambah 'classrooms.')
              ->where('classroom_students.status', 'active');
        });
    }

    /**
     * INDEX: Menampilkan daftar siswa aktif milik Sensei
     */
    public function index(Request $request)
    {
        // 1. Panggil query proteksi dasar
        $query = $this->getMyStudentsQuery()->with('user');

        // 2. Fitur Search (Nama atau NIK)
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('full_name', 'like', "%{$request->search}%")
                  ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }

        // 3. Paginate
        $students = $query->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('sensei/student/Index', [
            'students' => $students,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * EDIT: Form edit siswa
     */
    public function edit($id)
    {
        // 1. Cari siswa dengan ID tersebut, TAPI harus lolos filter getMyStudentsQuery
        // Jika siswa ada tapi bukan murid aktif sensei ini, akan return 404 Not Found
        $student = $this->getMyStudentsQuery()
            ->with(['user', 'educations', 'experiences', 'families'])
            ->findOrFail($id);

        // 2. Data pendukung untuk dropdown
        $provinces = Province::all();
        $jobSectors = JobSector::all();
        $majors = Major::all();

        return Inertia::render('sensei/student/StudentForm', [
            'student' => $student,
            'provinces' => $provinces,
            'jobSectors' => $jobSectors,
            'majors' => $majors,
        ]);
    }

    /**
     * UPDATE: Simpan perubahan data
     */
    public function update(Request $request, $id)
    {
        // 1. Proteksi: Pastikan yang diupdate adalah siswa aktif sensei ini
        $profile = $this->getMyStudentsQuery()->with('user')->findOrFail($id);
        
        // 2. Validasi
        $request->validate([
            'email' => 'required|email|unique:users,email,' . $profile->user_id,
            'nik'   => 'required|unique:student_profiles,nik,' . $profile->id,
            'full_name' => 'required|string|max:255',
            'dob'   => 'required|date',
        ]);

        // --- Helper Kapitalisasi (Sama seperti kode Anda) ---
        $makeUpper = function ($value) {
            if (!is_string($value)) return $value;
            if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FAF}]/u', $value)) {
                return $value;
            }
            return strtoupper($value);
        };

        $processArray = function ($array) use ($makeUpper) {
            return array_map(function ($item) use ($makeUpper) {
                return is_array($item) ? array_map($makeUpper, $item) : $makeUpper($item);
            }, $array);
        };
        // ----------------------------------------------------

        DB::beginTransaction();
        try {
            // Update User
            $profile->user->update([
                'name'  => $makeUpper($request->full_name),
                'email' => $request->email 
            ]);

            // Update Profile
            $profileData = $request->except(['email', 'educations', 'experiences', 'families']);
            $profileData = array_map($makeUpper, $profileData);
            $profile->update($profileData);

            // Update Educations
            if ($request->has('educations')) {
                $profile->educations()->delete(); 
                if (!empty($request->educations)) {
                    $profile->educations()->createMany($processArray($request->educations));
                }
            }

            // Update Experiences
            if ($request->has('experiences')) {
                $profile->experiences()->delete();
                if (!empty($request->experiences)) {
                    $profile->experiences()->createMany($processArray($request->experiences));
                }
            }

            // Update Families
            if ($request->has('families')) {
                $profile->families()->delete();
                if (!empty($request->families)) {
                    $profile->families()->createMany($processArray($request->families));
                }
            }

            DB::commit();
            
            return redirect()->route('sensei.students.index')
                            ->with('success', 'Data profil ' . $profile->full_name . ' berhasil diperbarui.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withInput()->withErrors(['error' => 'Gagal memperbarui data: ' . $e->getMessage()]);
        }
    }

    /**
     * SHOW: Detail siswa (Read Only)
     */
    public function show($id)
    {
        // 1. Proteksi: Gunakan getMyStudentsQuery() sebagai base query
        // Lalu chain dengan logic 'with' yang kompleks dari kode Anda sebelumnya
        $query = $this->getMyStudentsQuery();

        $student = $query->with([
            'user',         
            'educations',   
            'experiences',  
            'families',     
            
            // Relasi Kelas (History)
            'classrooms' => function($query) use ($id) {
                $query->with('teacher') 
                      // Absensi Siswa Ini
                      ->with(['attendances' => function($q) use ($id) {
                          $q->where('student_profile_id', $id)
                            ->orderBy('date', 'desc');
                      }])
                      // Nilai Siswa Ini
                      ->with(['grades' => function($q) use ($id) {
                          $q->where('student_profile_id', $id)
                            ->orderBy('created_at', 'desc');
                      }])
                      ->orderByPivot('joined_at', 'desc');
            }
        ])->findOrFail($id); // Jika ID siswa tidak valid/tidak aktif, throw 404

        // 2. Formatting Data (Logic asli Anda)
        $classHistory = $student->classrooms->map(function ($class) {
            $totalAbsen = $class->attendances->count();
            $hadir = $class->attendances->where('status', 'hadir')->count();
            $persentaseKehadiran = $totalAbsen > 0 ? round(($hadir / $totalAbsen) * 100) : 0;

            return [
                'id'            => $class->id,
                'name'          => $class->name,
                'level'         => $class->level,
                'status_class'  => $class->status,
                'teacher_name'  => $class->teacher ? $class->teacher->name : 'Tidak ada Guru',
                'teacher_type'  => $class->teacher ? $class->teacher->type_label : '-',
                'status_student'=> $class->pivot->status,
                'joined_at'     => $class->pivot->joined_at,
                'left_at'       => $class->pivot->left_at,
                'notes'         => $class->pivot->notes,
                'attendance_summary' => "{$persentaseKehadiran}% ({$hadir}/{$totalAbsen})",
                'attendances'   => $class->attendances,
                'grades'        => $class->grades,
            ];
        });

        return Inertia::render('sensei/students/Show', [
            'student' => $student,
            'classHistory' => $classHistory
        ]);
    }
}