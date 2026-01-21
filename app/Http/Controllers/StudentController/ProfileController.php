<?php

namespace App\Http\Controllers\StudentController;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\Province;
use App\Models\JobSector;
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
            ];
        }

        return Inertia::render('student/StudentForm', [
            'student' => $student,
            'provinces' => Province::all(),
            'jobSectors' => JobSector::all(),
            'majors' => Major::orderBy('name', 'asc')->get(), // Jurusan SMA/SMK
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
        ]);

        DB::beginTransaction();
        try {
            $data = $request->except(['email', 'educations', 'experiences', 'families']);
            $data['user_id'] = $user->id;
            
            if (!$profile) {
                // Jika belum ada, buat baru
                $data['yunerva_file_password'] = Str::random(8);
                $data['student_status'] = 'matching';
                $data['program_expert'] = 'BAHASA JEPANG';
                $profile = StudentProfile::create($data);
            } else {
                // Jika sudah ada, update
                $profile->update($data);
            }

            // Sync Relasi (Hapus lama, isi baru)
            $profile->educations()->delete();
            $profile->educations()->createMany($request->educations ?? []);

            $profile->experiences()->delete();
            $profile->experiences()->createMany($request->experiences ?? []);

            $profile->families()->delete();
            $profile->families()->createMany($request->families ?? []);

            DB::commit();
            return redirect()->route('student.dashboard')->with('success', 'Biodata berhasil disimpan.');
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal menyimpan data: ' . $e->getMessage()])->withInput();
        }
    }
}