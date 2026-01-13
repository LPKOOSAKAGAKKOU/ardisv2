<?php

namespace App\Http\Controllers;

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
        $students = StudentProfile::with('user')
            ->whereHas('user', function ($query) use ($request) {
                $query->where('role', 'student');
                
                // Opsional: Tambah fitur search nama jika ada input dari frontend
                if ($request->search) {
                    $query->where('name', 'like', "%{$request->search}%");
                }
            })
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Student/Index', [
            'students' => $students,
            'filters' => $request->only(['search']) // Mengirim balik kata kunci pencarian ke React
        ]);
    }

    public function create()
    {
        // Mengambil master data dari database
        $provinces = Province::all(); // Contoh tabel provinsi
        $jobSectors = JobSector::all(); // Contoh tabel sektor kerja (Kaigo, dll)

        return Inertia::render('Student/Create', [
            'provinces' => Province::all() ?? [],
            'jobSectors' => JobSector::all() ?? []
        ]);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            // 1. Buat User untuk login
            $user = User::create([
                'name' => $request->full_name,
                'email' => $request->email,
                'password' => Hash::make('password123'), // Default password
            ]);

            // 2. Simpan Data Profil Utama
            // Kita ambil SEMUA input kecuali data user dan data array riwayat
            $profileData = $request->except(['email', 'educations', 'experiences', 'families']);
            $profileData['user_id'] = $user->id;
            
            $profile = StudentProfile::create($profileData);

            // 3. Simpan Riwayat Pendidikan
            if ($request->has('educations')) {
                $profile->educations()->createMany($request->educations);
            }

            // 4. Simpan Riwayat Pekerjaan
            if ($request->has('experiences')) {
                $profile->experiences()->createMany($request->experiences);
            }

            // 5. Simpan Riwayat Keluarga
            if ($request->has('families')) {
                $profile->families()->createMany($request->families);
            }

            DB::commit();
            return redirect()->route('student.index')->with('success', 'Data Siswa ' . $profile->full_name . ' berhasil disimpan.');

        } catch (\Exception $e) {
            DB::rollback();
            // Log error untuk debug jika perlu
            return back()->withInput()->with('error', 'Gagal menyimpan data: ' . $e->getMessage());
        }
    }

    public function edit($id)
    {
        // Mengambil data lengkap beserta relasinya
        $student = StudentProfile::with(['user', 'educations', 'experiences', 'families'])
            ->findOrFail($id);

        // Inertia akan mengirimkan objek $student sebagai PROPS ke React
        return Inertia::render('Student/Edit', [
            'student' => $student
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
}