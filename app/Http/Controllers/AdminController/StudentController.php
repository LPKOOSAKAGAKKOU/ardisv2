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

        $students = $query->latest()
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
        ]);
    }

    public function store(Request $request)
    {
        // 1. Validasi Data
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'nik' => 'required|unique:student_profiles,nik',
            'full_name' => 'required|string|max:255',
            'dob' => 'required|date',
        ]);

        // Fungsi Helper untuk Kapitalisasi (Non-Jepang)
        $makeUpper = function ($value) {
            if (!is_string($value)) return $value;
            
            // Cek karakter Jepang (Hiragana, Katakana, Kanji)
            if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FAF}]/u', $value)) {
                return $value;
            }
            
            return strtoupper($value);
        };

        // Fungsi Helper untuk memproses array (recursive)
        $processArray = function ($array) use ($makeUpper) {
            return array_map(function ($item) use ($makeUpper) {
                if (is_array($item)) {
                    return array_map($makeUpper, $item);
                }
                return $makeUpper($item);
            }, $array);
        };

        DB::beginTransaction();
        try {
            // 2. Buat User Login (Nama User diset Kapital)
            $user = User::create([
                'name'     => strtoupper($request->full_name),
                'email'    => $request->email, // Email tetap kecil (standar)
                'password' => Hash::make('password123'), 
                'role'     => 'student',
            ]);

            // 3. Simpan Data Profil Utama
            $profileData = $request->except(['email', 'educations', 'experiences', 'families']);
            
            // Kapitalisasi semua data profil
            $profileData = array_map($makeUpper, $profileData);
            
            $profileData['user_id'] = $user->id;
            $profileData['yunerva_file_password'] = Str::random(8);
            
            $profile = StudentProfile::create($profileData);

            // 4. Simpan Relasi (Kapitalisasi Otomatis)
            if (!empty($request->educations)) {
                $profile->educations()->createMany($processArray($request->educations));
            }

            if (!empty($request->experiences)) {
                $profile->experiences()->createMany($processArray($request->experiences));
            }

            if (!empty($request->families)) {
                $profile->families()->createMany($processArray($request->families));
            }

            DB::commit();

            return redirect('/admin/students')->with('success', 'Siswa berhasil didaftarkan dengan format kapital.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal menyimpan: ' . $e->getMessage()])->withInput();
        }
    }

    public function edit($id)
    {
        // Mengambil data lengkap beserta relasinya
        $student = StudentProfile::with(['user', 'educations', 'experiences', 'families'])
            ->findOrFail($id);

        // Ambil data provinces dan jobSectors seperti di method create()
        $provinces = Province::all(); // Contoh tabel provinsi
        $jobSectors = JobSector::all(); // Contoh tabel sektor kerja (Kaigo, dll)
        $majors = Major::all(); // Contoh tabel jurusan


        // Inertia akan mengirimkan objek $student sebagai PROPS ke React
        return Inertia::render('admin/student/StudentForm', [
            'student' => $student,
            'provinces' => $provinces,      // TAMBAHKAN INI
            'jobSectors' => $jobSectors,    // TAMBAHKAN INI
            'majors' => $majors,            // TAMBAHKAN INI
        ]);
    }

    public function update(Request $request, $id)
    {
        // Mengambil profil beserta relasi user-nya
        $profile = StudentProfile::with('user')->findOrFail($id);
        
        // 1. Validasi Data
        $request->validate([
            'email' => 'required|email|unique:users,email,' . $profile->user_id,
            'nik'   => 'required|unique:student_profiles,nik,' . $profile->id,
            'full_name' => 'required|string|max:255',
            'dob'   => 'required|date',
        ]);

        // --- LOGIKA KAPITALISASI ---
        $makeUpper = function ($value) {
            if (!is_string($value)) return $value;
            // Abaikan jika mengandung karakter Jepang (Hiragana/Katakana/Kanji)
            if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FAF}]/u', $value)) {
                return $value;
            }
            return strtoupper($value);
        };

        $processArray = function ($array) use ($makeUpper) {
            return array_map(function ($item) use ($makeUpper) {
                // Jika item di dalam array adalah array lagi (seperti di educations), proses setiap value-nya
                return is_array($item) ? array_map($makeUpper, $item) : $makeUpper($item);
            }, $array);
        };
        // ----------------------------

        DB::beginTransaction();
        try {
            // 2. Update Data di Tabel Users (Nama User jadi kapital)
            $profile->user->update([
                'name'  => $makeUpper($request->full_name),
                'email' => $request->email // Email tetap biarkan sesuai input (lowercase)
            ]);

            // 3. Update Data Profil Utama (Kecuali email dan relasi)
            $profileData = $request->except(['email', 'educations', 'experiences', 'families']);
            $profileData = array_map($makeUpper, $profileData);
            
            $profile->update($profileData);

            // 4. Update Riwayat Pendidikan (Re-sync + Kapitalisasi)
            if ($request->has('educations')) {
                $profile->educations()->delete(); 
                if (!empty($request->educations)) {
                    $profile->educations()->createMany($processArray($request->educations));
                }
            }

            // 5. Update Riwayat Pekerjaan (Re-sync + Kapitalisasi)
            if ($request->has('experiences')) {
                $profile->experiences()->delete();
                if (!empty($request->experiences)) {
                    $profile->experiences()->createMany($processArray($request->experiences));
                }
            }

            // 6. Update Riwayat Keluarga (Re-sync + Kapitalisasi)
            if ($request->has('families')) {
                $profile->families()->delete();
                if (!empty($request->families)) {
                    $profile->families()->createMany($processArray($request->families));
                }
            }

            DB::commit();
            
            return redirect()->route('admin.students.index')
                            ->with('success', 'Data profil ' . $profile->full_name . ' berhasil diperbarui dalam format kapital.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withInput()->withErrors(['error' => 'Gagal memperbarui data: ' . $e->getMessage()]);
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