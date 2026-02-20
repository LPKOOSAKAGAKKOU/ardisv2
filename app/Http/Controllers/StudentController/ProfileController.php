<?php

namespace App\Http\Controllers\StudentController;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\Province;
use App\Models\JobSector;
use App\Models\Major;
use App\Models\Recruitment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    public function showForm()
    {
        $user = Auth::user();
        
        // 1. Pastikan memuat relasi 'user' agar email tersedia saat EDIT
        $student = StudentProfile::with(['user', 'educations', 'experiences', 'families'])
            ->where('user_id', $user->id)
            ->first();

        // Jika profil belum ada (Registrasi Baru)
        if (!$student) {
            $student = [
                'id' => null,
                'user' => ['email' => $user->email], // Ini sudah benar untuk data baru
                'educations' => [],
                'experiences' => [],
                'families' => [],
                'student_status' => 'pelatihan',
                'program_expert' => 'BAHASA JEPANG',
                'class_level' => 'SISWA BARU',
                'recruitments_id' => null, // Inisialisasi untuk data baru
            ];
        }

        return Inertia::render('student/StudentForm', [
            'student' => $student,
            'provinces' => Province::all(),
            'jobSectors' => JobSector::all(),
            'majors' => Major::all(),
            'recruitments' => Recruitment::where('is_active', true)
                            ->orderBy('date', 'desc')
                            ->get(),
        ]);
    }

    public function storeOrUpdate(Request $request)
    {
        $user = Auth::user();
        $profile = StudentProfile::where('user_id', $user->id)->first();

        $request->validate([
            'nik' => 'required|string|max:20|unique:student_profiles,nik,' . ($profile->id ?? 'NULL'),
            'full_name' => 'required|string|max:255',
            'dob' => 'required|date',
            'recruitments_id' => 'nullable|exists:recruitments,id',
        ]);

        // Fungsi pembantu (helper) untuk kapitalisasi string non-Jepang
        $convertToUpper = function ($data) {
            if (!is_array($data)) return $data;

            return array_map(function ($value) {
                if (is_string($value)) {
                    // Cek apakah string mengandung karakter Jepang (Hiragana/Katakana/Kanji)
                    // Jika mengandung karakter Jepang, jangan di-upper
                    if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FAF}]/u', $value)) {
                        return $value;
                    }
                    return strtoupper($value);
                }
                return $value;
            }, $data);
        };

        DB::beginTransaction();
        try {
            // 1. Ambil data dasar & bersihkan dari field relasi
            $rawValues = $request->except(['email', 'educations', 'experiences', 'families']);
            
            // 2. Ubah ke Kapital (kecuali field sensitif atau bahasa Jepang)
            $data = $convertToUpper($rawValues);
            
            // Field tambahan yang tidak boleh hilang/berubah case sembarangan
            $data['user_id'] = $user->id;

            if (!$profile) {
                $data['yunerva_file_password'] = Str::random(8);
                $data['student_status'] = 'matching';
                $data['program_expert'] = 'BAHASA JEPANG';
                $profile = StudentProfile::create($data);
            } else {
                $profile->update($data);
            }

            // 3. Sync Educations (Kapitalisasi Otomatis)
            $profile->educations()->delete();
            if ($request->has('educations')) {
                $upperEducations = array_map($convertToUpper, $request->educations);
                $profile->educations()->createMany($upperEducations);
            }

            // 4. Sync Experiences (Kapitalisasi Otomatis)
            $profile->experiences()->delete();
            if ($request->has('experiences')) {
                $upperExperiences = array_map($convertToUpper, $request->experiences);
                $profile->experiences()->createMany($upperExperiences);
            }

            // 5. Sync Families (Kapitalisasi Otomatis)
            $profile->families()->delete();
            if ($request->has('families')) {
                $upperFamilies = array_map($convertToUpper, $request->families);
                $profile->families()->createMany($upperFamilies);
            }

            DB::commit();
            return redirect()->route('student.dashboard')->with('success', 'Biodata berhasil disimpan dengan format rapi.');
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal menyimpan data: ' . $e->getMessage()])->withInput();
        }
    }
}