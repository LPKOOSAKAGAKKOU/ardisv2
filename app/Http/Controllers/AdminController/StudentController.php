<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Models\Province;
use App\Models\JobSector;

class StudentController extends Controller
{
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

        return Inertia::render('admin/student/StudentForm', [
            'provinces' => Province::all() ?? [],
            'jobSectors' => JobSector::all() ?? []
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
            // Tambahkan validasi lain jika perlu
        ]);

        DB::beginTransaction();
        try {
            // 2. Buat User Login
            $user = User::create([
                'name' => $request->full_name,
                'email' => $request->email,
                'password' => Hash::make('password123'), 
                'role' => 'student', // Pastikan role diset
            ]);

            // 3. Simpan Data Profil Utama
            // Gunakan $request->only atau $request->except agar lebih aman
            $profileData = $request->except(['email', 'educations', 'experiences', 'families']);
            $profileData['user_id'] = $user->id;
            
            $profile = StudentProfile::create($profileData);

            // 4. Simpan Relasi (Hanya jika ada datanya)
            if (!empty($request->educations)) {
                $profile->educations()->createMany($request->educations);
            }

            if (!empty($request->experiences)) {
                $profile->experiences()->createMany($request->experiences);
            }

            if (!empty($request->families)) {
                $profile->families()->createMany($request->families);
            }

            DB::commit();

            // Gunakan nama route yang benar sesuai php artisan route:list
            return redirect('/admin/students')->with('success', 'Siswa berhasil didaftarkan.');

        } catch (\Exception $e) {
            DB::rollback();
            // Log::error($e->getMessage()); // Opsional: catat di storage/logs/laravel.log
            return back()->withErrors(['error' => 'Gagal menyimpan: ' . $e->getMessage()])->withInput();
        }
    }

    public function edit($id)
    {
        // Mengambil data lengkap beserta relasinya
        $student = StudentProfile::with(['user', 'educations', 'experiences', 'families'])
            ->findOrFail($id);

        // Ambil data provinces dan jobSectors seperti di method create()
        $provinces = Province::select('id', 'name')->orderBy('name')->get();
        $jobSectors = JobSector::select('id', 'name', 'code')->orderBy('name')->get();

        // Inertia akan mengirimkan objek $student sebagai PROPS ke React
        return Inertia::render('admin/student/StudentForm', [
            'student' => $student,
            'provinces' => $provinces,      // TAMBAHKAN INI
            'jobSectors' => $jobSectors,    // TAMBAHKAN INI
        ]);
    }

    public function update(Request $request, $id)
    {
        // Mengambil profil beserta relasi user-nya
        $profile = StudentProfile::with('user')->findOrFail($id);
        
        DB::beginTransaction();
        try {
            // 1. Update Email di Tabel Users
            $profile->user->update([
                'name'  => $request->full_name, // Update nama di user juga jika perlu
                'email' => $request->email
            ]);

            // 2. Update Data Profil Utama
            // Mengupdate semua kolom medis, fisik, kebiasaan, dll secara otomatis
            $profile->update($request->except(['email', 'educations', 'experiences', 'families']));

            // 3. Update Riwayat Pendidikan (Re-sync)
            if ($request->has('educations')) {
                $profile->educations()->delete(); // Hapus data lama
                $profile->educations()->createMany($request->educations); // Masukkan data baru dari form
            }

            // 4. Update Riwayat Pekerjaan (Re-sync)
            if ($request->has('experiences')) {
                $profile->experiences()->delete();
                $profile->experiences()->createMany($request->experiences);
            }

            // 5. Update Riwayat Keluarga (Re-sync)
            if ($request->has('families')) {
                $profile->families()->delete();
                $profile->families()->createMany($request->families);
            }

            DB::commit();
            return redirect()->route('student.index')->with('success', 'Data profil ' . $profile->full_name . ' berhasil diperbarui');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withInput()->with('error', 'Gagal memperbarui data: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        // Ambil data lengkap dengan semua relasi
        $student = StudentProfile::with(['user', 'educations', 'experiences', 'families'])
            ->findOrFail($id);

        return Inertia::render('admin/student/Show', [
            'student' => $student
        ]);
    }

}