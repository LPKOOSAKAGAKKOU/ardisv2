<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\YunervaService;
use Inertia\Inertia;
use App\Models\Province;
use App\Models\JobSector;
use App\Models\Recruitment;
use Illuminate\Support\Str;
use App\Models\Major;

class StudentController extends Controller
{

    // 1. ANDA WAJIB MENAMBAHKAN BARIS INI
    protected $yunerva;

    // 2. Pastikan inisialisasi di constructor seperti ini
    public function __construct(YunervaService $yunerva)
    {
        $this->yunerva = $yunerva;
    }
    
    public function index(Request $request)
    {
        $query = StudentProfile::with('user');

        // Filter berdasarkan role user (student)
        $query->whereHas('user', function ($q) {
            $q->where('role', 'student');
        });

        // Fitur Search: Mencari di nama user ATAU NIK di profil
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('full_name', 'like', "%{$request->search}%")
                ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }

        $students = $query->orderByDesc('id')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/student/Index', [
            'students' => $students,
            'filters' => $request->only(['search'])
        ]);
    }

    public function create()
    {
        // Mengambil master data dari database
        $provinces = Province::all(); // Contoh tabel provinsi
        $jobSectors = JobSector::all(); // Contoh tabel sektor kerja (Kaigo, dll)
        $majors = Major::all(); // Contoh tabel jurusan

        return Inertia::render('admin/student/StudentForm', [
            'provinces' => Province::all(),
            'jobSectors' => JobSector::all(),
            'majors' => Major::all(),
            'recruitments' => Recruitment::where('is_active', true)
                            ->orderBy('date', 'desc')
                            ->get(),
        ]);
    }

    public function store(Request $request)
    {
        // 1. Validasi Data Lengkap
        $request->validate([
            'email'               => 'required|email|unique:users,email',
            'nik'                 => 'required|string|max:20|unique:student_profiles,nik',
            'full_name'           => 'required|string|max:255',
            'full_name_katakana'  => 'nullable|string|max:255',
            'pob'                 => 'required|string|max:255',
            'pob_province'        => 'required|string|max:255',
            'dob'                 => 'required|date',
            'gender'              => 'required|in:Laki-laki,Perempuan',
            'address_ktp'         => 'required|string',
            'phone_student'       => 'required|string|max:50',
            'phone_parent'        => 'required|string|max:50',
            'height'              => 'required|numeric|min:50|max:250',
            'weight'              => 'required|numeric|min:20|max:200',
            'blood_type'          => 'required|in:A,B,O,AB',
            'religion'            => 'required|in:Islam,Kristen,Katholik,Hindu,Budha,Kong Hu Chu',
            'marital_status'      => 'required|in:Belum Menikah,Menikah,Cerai,Cerai Mati',
            'tattoo'              => 'required|in:ada,tidak',
            'smoking'             => 'required|in:merokok,tidak merokok',
            'alcohol'             => 'required|in:minum,tidak minum',
            'family_in_japan'     => 'required|in:ada,tidak',
            'tbc_history'         => 'required|in:ada,tidak',
            'color_blind'         => 'required|in:normal,parsial,biru-kuning,merah-hijau,total',
            'other_illness'       => 'nullable|string',
            'has_passport'        => 'required|in:ada,tidak',
            'passport_number'     => 'nullable|string|max:50',
            'passport_issue_date' => 'nullable|date',
            'passport_expiry_date'=> 'nullable|date',
            'class_level'         => 'nullable|string|max:255',
            'program_expert'      => 'nullable|string|max:255',
            'entry_date_lpk'      => 'required|date',
            'strength'            => 'required|string|max:255',
            'weakness'            => 'required|string|max:255',
            'skill_technical'     => 'required|string|max:255',
            'hobby'               => 'required|string|max:255',
            'savings_target'      => 'required|string|max:255',
            'savings_reason'      => 'required|string|max:255',
            'student_status'      => 'nullable|in:pelatihan,matching,lolos_job,berangkat',
            'recruitments_id'     => 'nullable|exists:recruitments,id',
            'educations'          => 'nullable|array',
            'experiences'         => 'nullable|array',
            'families'            => 'nullable|array',
        ]);

        // Helper untuk Kapitalisasi (Non-Jepang)
        $makeUpper = function ($value) {
            if (!is_string($value)) return $value;
            if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FAF}]/u', $value)) {
                return $value;
            }
            return strtoupper(trim($value));
        };

        $processArray = function ($array) use ($makeUpper) {
            return array_map(function ($item) use ($makeUpper) {
                return is_array($item) ? array_map($makeUpper, $item) : $makeUpper($item);
            }, $array);
        };

        DB::beginTransaction();
        try {
            // 2. Buat User Login
            $user = User::create([
                'name'     => $makeUpper($request->full_name),
                'email'    => $request->email,
                'password' => Hash::make('password123'), 
                'role'     => 'student',
            ]);

            // 3. Simpan Data Profil Utama
            $profileData = $request->except(['email', 'educations', 'experiences', 'families']);
            $profileData = array_map($makeUpper, $profileData);
            
            $profileData['user_id'] = $user->id;
            $profileData['yunerva_file_password'] = Str::random(8);
            $profileData['height'] = (int) $request->input('height', 0);
            $profileData['weight'] = (int) $request->input('weight', 0);
            $profileData['passport_issue_date'] = $request->filled('passport_issue_date') ? $request->input('passport_issue_date') : null;
            $profileData['passport_expiry_date'] = $request->filled('passport_expiry_date') ? $request->input('passport_expiry_date') : null;
            $profileData['passport_number'] = $request->filled('passport_number') ? strtoupper(trim($request->input('passport_number'))) : null;
            $profileData['other_illness'] = $request->filled('other_illness') ? strtoupper(trim($request->input('other_illness'))) : null;
            $profileData['class_level'] = $profileData['class_level'] ?: 'SISWA BARU';
            $profileData['program_expert'] = $profileData['program_expert'] ?: 'BAHASA JEPANG';
            $profileData['student_status'] = $profileData['student_status'] ?: 'pelatihan';
            
            $profile = StudentProfile::create($profileData);

            // 4. Simpan Relasi
            if ($request->has('educations') && is_array($request->educations)) {
                $validEducations = array_filter($request->educations, fn($item) => !empty($item['school_name']));
                if (!empty($validEducations)) {
                    $profile->educations()->createMany($processArray(array_values($validEducations)));
                }
            }

            if ($request->has('experiences') && is_array($request->experiences)) {
                $validExperiences = array_filter($request->experiences, fn($item) => !empty($item['company_name']));
                if (!empty($validExperiences)) {
                    $profile->experiences()->createMany($processArray(array_values($validExperiences)));
                }
            }

            if ($request->has('families') && is_array($request->families)) {
                $validFamilies = array_filter($request->families, fn($item) => !empty($item['name']));
                if (!empty($validFamilies)) {
                    $profile->families()->createMany($processArray(array_values($validFamilies)));
                }
            }

            DB::commit();
            return redirect('/admin/students')->with('success', 'Siswa berhasil didaftarkan.');
        } catch (\Exception $e) {
            DB::rollback();
            \Illuminate\Support\Facades\Log::error('Error storing student: ' . $e->getMessage(), ['exception' => $e]);
            return back()->withErrors(['error' => 'Gagal menyimpan data siswa. Mohon periksa kembali isian form Anda.'])->withInput();
        }
    }

    public function edit($id)
    {
        $student = StudentProfile::with(['user', 'educations', 'experiences', 'families'])
            ->findOrFail($id);

        $provinces = Province::all();
        $jobSectors = JobSector::all();
        $majors = Major::all();
        $recruitments = Recruitment::where('is_active', true)->orderBy('date', 'desc')->get();

        return Inertia::render('admin/student/StudentForm', [
            'student' => $student,
            'provinces' => $provinces,
            'jobSectors' => $jobSectors,
            'majors' => $majors,
            'recruitments' => $recruitments,
        ]);
    }

    public function update(Request $request, $id)
    {
        $profile = StudentProfile::with('user')->findOrFail($id);
        
        // 1. Validasi Data
        $request->validate([
            'email'               => 'required|email|unique:users,email,' . $profile->user_id,
            'nik'                 => 'required|string|max:20|unique:student_profiles,nik,' . $profile->id,
            'full_name'           => 'required|string|max:255',
            'full_name_katakana'  => 'nullable|string|max:255',
            'pob'                 => 'required|string|max:255',
            'pob_province'        => 'required|string|max:255',
            'dob'                 => 'required|date',
            'gender'              => 'required|in:Laki-laki,Perempuan',
            'address_ktp'         => 'required|string',
            'phone_student'       => 'required|string|max:50',
            'phone_parent'        => 'required|string|max:50',
            'height'              => 'required|numeric|min:50|max:250',
            'weight'              => 'required|numeric|min:20|max:200',
            'blood_type'          => 'required|in:A,B,O,AB',
            'religion'            => 'required|in:Islam,Kristen,Katholik,Hindu,Budha,Kong Hu Chu',
            'marital_status'      => 'required|in:Belum Menikah,Menikah,Cerai,Cerai Mati',
            'tattoo'              => 'required|in:ada,tidak',
            'smoking'             => 'required|in:merokok,tidak merokok',
            'alcohol'             => 'required|in:minum,tidak minum',
            'family_in_japan'     => 'required|in:ada,tidak',
            'tbc_history'         => 'required|in:ada,tidak',
            'color_blind'         => 'required|in:normal,parsial,biru-kuning,merah-hijau,total',
            'other_illness'       => 'nullable|string',
            'has_passport'        => 'required|in:ada,tidak',
            'passport_number'     => 'nullable|string|max:50',
            'passport_issue_date' => 'nullable|date',
            'passport_expiry_date'=> 'nullable|date',
            'class_level'         => 'nullable|string|max:255',
            'program_expert'      => 'nullable|string|max:255',
            'entry_date_lpk'      => 'required|date',
            'strength'            => 'required|string|max:255',
            'weakness'            => 'required|string|max:255',
            'skill_technical'     => 'required|string|max:255',
            'hobby'               => 'required|string|max:255',
            'savings_target'      => 'required|string|max:255',
            'savings_reason'      => 'required|string|max:255',
            'student_status'      => 'nullable|in:pelatihan,matching,lolos_job,berangkat',
            'recruitments_id'     => 'nullable|exists:recruitments,id',
            'educations'          => 'nullable|array',
            'experiences'         => 'nullable|array',
            'families'            => 'nullable|array',
        ]);

        $makeUpper = function ($value) {
            if (!is_string($value)) return $value;
            if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FAF}]/u', $value)) {
                return $value;
            }
            return strtoupper(trim($value));
        };

        $processArray = function ($array) use ($makeUpper) {
            return array_map(function ($item) use ($makeUpper) {
                return is_array($item) ? array_map($makeUpper, $item) : $makeUpper($item);
            }, $array);
        };

        DB::beginTransaction();
        try {
            // Update User
            $profile->user->update([
                'name'  => $makeUpper($request->full_name),
                'email' => $request->email
            ]);

            $profileData = $request->except(['email', 'educations', 'experiences', 'families']);
            $profileData = array_map($makeUpper, $profileData);
            
            $profileData['height'] = (int) $request->input('height', 0);
            $profileData['weight'] = (int) $request->input('weight', 0);
            $profileData['passport_issue_date'] = $request->filled('passport_issue_date') ? $request->input('passport_issue_date') : null;
            $profileData['passport_expiry_date'] = $request->filled('passport_expiry_date') ? $request->input('passport_expiry_date') : null;
            $profileData['passport_number'] = $request->filled('passport_number') ? strtoupper(trim($request->input('passport_number'))) : null;
            $profileData['other_illness'] = $request->filled('other_illness') ? strtoupper(trim($request->input('other_illness'))) : null;
            $profileData['class_level'] = $profileData['class_level'] ?: 'SISWA BARU';
            $profileData['program_expert'] = $profileData['program_expert'] ?: 'BAHASA JEPANG';

            $profile->update($profileData);

            // Update Educations
            $profile->educations()->delete(); 
            if ($request->has('educations') && is_array($request->educations)) {
                $validEducations = array_filter($request->educations, fn($item) => !empty($item['school_name']));
                if (!empty($validEducations)) {
                    $profile->educations()->createMany($processArray(array_values($validEducations)));
                }
            }

            // Update Experiences
            $profile->experiences()->delete();
            if ($request->has('experiences') && is_array($request->experiences)) {
                $validExperiences = array_filter($request->experiences, fn($item) => !empty($item['company_name']));
                if (!empty($validExperiences)) {
                    $profile->experiences()->createMany($processArray(array_values($validExperiences)));
                }
            }

            // Update Families
            $profile->families()->delete();
            if ($request->has('families') && is_array($request->families)) {
                $validFamilies = array_filter($request->families, fn($item) => !empty($item['name']));
                if (!empty($validFamilies)) {
                    $profile->families()->createMany($processArray(array_values($validFamilies)));
                }
            }

            DB::commit();
            
            $message = 'Data profil ' . $profile->full_name . ' berhasil diperbarui.';
            if (str_contains(url()->previous(), '/edit')) {
                return redirect()->route('admin.students.show', $profile->id)->with('success', $message);
            }
            return redirect()->route('admin.students.index')->with('success', $message);

        } catch (\Exception $e) {
            DB::rollback();
            \Illuminate\Support\Facades\Log::error('Error updating student: ' . $e->getMessage(), ['exception' => $e]);
            return back()->withErrors(['error' => 'Gagal memperbarui data siswa. Mohon periksa kembali isian form Anda.'])->withInput();
        }
    }

    public function show($id)
    {
        // 1. Ambil data siswa dengan semua relasi + Filter Absen & Nilai per Kelas
        $student = StudentProfile::with([
            'user',         // Foto & Email
            'educations',   // Pendidikan
            'experiences',  // Pengalaman Kerja
            'families',     // Keluarga
            
            // RELASI KELAS (Complex Query)
            'classrooms' => function($query) use ($id) {
                $query->with('teacher') // Ambil data Sensei
                      
                      // Ambil ABSENSI (Filter hanya punya siswa ini)
                      ->with(['attendances' => function($q) use ($id) {
                          $q->where('student_profile_id', $id)
                            ->orderBy('date', 'desc');
                      }])
                      
                      // Ambil NILAI (Filter hanya punya siswa ini)
                      ->with(['grades' => function($q) use ($id) {
                          $q->where('student_profile_id', $id)
                            ->orderBy('created_at', 'desc');
                      }])
                      
                      // Urutkan kelas dari yang paling baru dimasuki
                      ->orderByPivot('joined_at', 'desc');
            }
        ])->findOrFail($id);

        // 2. Formatting Data untuk Frontend
        // Kita rapikan strukturnya agar Frontend tinggal looping tanpa pusing logic
        $classHistory = $student->classrooms->map(function ($class) {
            
            // Hitung statistik absen sederhana (Opsional, tapi berguna)
            $totalAbsen = $class->attendances->count();
            $hadir = $class->attendances->where('status', 'hadir')->count();
            $persentaseKehadiran = $totalAbsen > 0 ? round(($hadir / $totalAbsen) * 100) : 0;

            return [
                // Info Dasar Kelas
                'id'            => $class->id,
                'name'          => $class->name,
                'level'         => $class->level,
                'status_class'  => $class->status, // Status kelas (active/finished)
                
                // Info Sensei
                'teacher_name'  => $class->teacher ? $class->teacher->name : 'Tidak ada Guru',
                'teacher_type'  => $class->teacher ? $class->teacher->type_label : '-',
                
                // Info Pivot (Status Siswa di Kelas)
                'status_student'=> $class->pivot->status, // active, graduated, dropped
                'joined_at'     => $class->pivot->joined_at,
                'left_at'       => $class->pivot->left_at,
                'notes'         => $class->pivot->notes,
                
                // DATA BARU: Absensi & Nilai
                'attendance_summary' => "{$persentaseKehadiran}% ({$hadir}/{$totalAbsen})",
                'attendances'   => $class->attendances, // Array list absen
                'grades'        => $class->grades,      // Array list nilai
            ];
        });

        // 3. Return ke Inertia
        return Inertia::render('admin/student/Show', [
            'student' => $student,
            'classHistory' => $classHistory
        ]);
    }

    public function destroy($id)
    {
        $profile = StudentProfile::findOrFail($id);
        $user = User::find($profile->user_id);

        $documentFields = [
            'photo_yunerva_uuid',
            'photo_with_suit_yunerva_uuid',
            'id_card_yunerva_uuid',
            'family_card_yunerva_uuid',
            'birth_certificate_yunerva_uuid',
            'diploma_yunerva_uuid',
            'transcript_yunerva_uuid',
            '1st_medical_checkup_yunerva_uuid',
            '2nd_medical_checkup_yunerva_uuid',
            '3rd_medical_checkup_yunerva_uuid',
            'passport_photo_page_yunerva_uuid',
            'parents_consent_letter_yunerva_uuid',
            'japanese_language_certificate_yunerva_uuid',
            'work_contract_yunerva_uuid',
        ];

        // 1. Kumpulkan UUID sebelum datanya dihapus dari DB
        $uuidsToDelete = [];
        foreach ($documentFields as $field) {
            if (!empty($profile->$field)) {
                $uuidsToDelete[] = $profile->$field;
            }
        }

        // 2. Transaksi Database (Cepat)
        DB::beginTransaction();
        try {
            $profile->educations()->delete();
            $profile->experiences()->delete();
            $profile->families()->delete();
            $profile->delete();
            
            if ($user) {
                $user->delete();
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal menghapus data database: ' . $e->getMessage()]);
        }

        // 3. Proses Hapus File ke API Yunerva (Di luar Transaction)
        // Karena DB sudah commit, meskipun di sini lambat, data di web sudah terupdate
        foreach ($uuidsToDelete as $uuid) {
            try {
                // Gunakan timeout agar tidak menunggu selamanya jika API down
                $this->yunerva->deleteFile($uuid);
                
                // Jeda cukup 100ms - 200ms saja (0.1 - 0.2 detik)
                // 1 detik terlalu lama jika filenya banyak
                usleep(200000); 
                
                \Log::info("Berhasil hapus file Yunerva: " . $uuid);
            } catch (\Exception $e) {
                \Log::error("Gagal hapus file Yunerva UUID: {$uuid}. Error: " . $e->getMessage());
            }
        }

        return redirect()->route('admin.students.index')
            ->with('success', 'Data siswa dan ' . count($uuidsToDelete) . ' berkas berhasil dihapus.');
    }

}