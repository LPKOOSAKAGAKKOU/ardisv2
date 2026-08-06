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
            'nik'                 => 'required|string|max:20|unique:student_profiles,nik,' . ($profile->id ?? 'NULL'),
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
            'educations'          => 'required|array|min:1',
            'educations.*.level'  => 'required|string',
            'educations.*.school_name' => 'required|string',
            'experiences'         => 'nullable|array',
            'experiences.*.company_name' => 'nullable|string',
            'families'            => 'nullable|array',
            'families.*.name'     => 'nullable|string',
        ], [
            'educations.required' => 'Wajib mengisi minimal 1 data riwayat sekolah/pendidikan (misal SMA/SMK).',
            'educations.min'      => 'Wajib mengisi minimal 1 data riwayat sekolah/pendidikan (misal SMA/SMK).',
            'educations.*.level.required' => 'Jenjang pendidikan wajib dipilih.',
            'educations.*.school_name.required' => 'Nama sekolah / instansi pendidikan wajib diisi.',
        ]);

        // Helper untuk kapitalisasi string non-Jepang
        $convertToUpper = function ($data) {
            if (!is_array($data)) return $data;

            return array_map(function ($value) {
                if (is_string($value)) {
                    if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FAF}]/u', $value)) {
                        return $value;
                    }
                    return strtoupper(trim($value));
                }
                return $value;
            }, $data);
        };

        DB::beginTransaction();
        try {
            $rawValues = $request->except(['email', 'educations', 'experiences', 'families']);
            $data = $convertToUpper($rawValues);

            $data['user_id'] = $user->id;
            $data['height'] = (int) $request->input('height', 0);
            $data['weight'] = (int) $request->input('weight', 0);
            $data['passport_issue_date'] = $request->filled('passport_issue_date') ? $request->input('passport_issue_date') : null;
            $data['passport_expiry_date'] = $request->filled('passport_expiry_date') ? $request->input('passport_expiry_date') : null;
            $data['passport_number'] = $request->filled('passport_number') ? strtoupper(trim($request->input('passport_number'))) : null;
            $data['other_illness'] = $request->filled('other_illness') ? strtoupper(trim($request->input('other_illness'))) : null;
            $data['class_level'] = $data['class_level'] ?: 'SISWA BARU';
            $data['program_expert'] = $data['program_expert'] ?: 'BAHASA JEPANG';

            if (!$profile) {
                $data['yunerva_file_password'] = Str::random(8);
                $data['student_status'] = $data['student_status'] ?: 'matching';
                $profile = StudentProfile::create($data);
            } else {
                $profile->update($data);
            }

            // Sync Educations (filter baris kosong)
            $profile->educations()->delete();
            if ($request->has('educations') && is_array($request->educations)) {
                $validEducations = array_filter($request->educations, fn($item) => !empty($item['school_name']));
                if (!empty($validEducations)) {
                    $upperEducations = array_map($convertToUpper, array_values($validEducations));
                    $profile->educations()->createMany($upperEducations);
                }
            }

            // Sync Experiences (filter baris kosong)
            $profile->experiences()->delete();
            if ($request->has('experiences') && is_array($request->experiences)) {
                $validExperiences = array_filter($request->experiences, fn($item) => !empty($item['company_name']));
                if (!empty($validExperiences)) {
                    $upperExperiences = array_map($convertToUpper, array_values($validExperiences));
                    $profile->experiences()->createMany($upperExperiences);
                }
            }

            // Sync Families (filter baris kosong)
            $profile->families()->delete();
            if ($request->has('families') && is_array($request->families)) {
                $validFamilies = array_filter($request->families, fn($item) => !empty($item['name']));
                if (!empty($validFamilies)) {
                    $upperFamilies = array_map($convertToUpper, array_values($validFamilies));
                    $profile->families()->createMany($upperFamilies);
                }
            }

            DB::commit();
            return redirect()->route('student.dashboard')->with('success', 'Biodata berhasil disimpan dengan format rapi.');
        } catch (\Exception $e) {
            DB::rollback();
            \Illuminate\Support\Facades\Log::error('Error saving student profile: ' . $e->getMessage(), ['exception' => $e]);
            return back()->withErrors(['error' => 'Gagal menyimpan data profil. Mohon periksa kembali isian form Anda.'])->withInput();
        }
    }
}