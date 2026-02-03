<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TeacherController extends Controller
{
    /**
     * Menampilkan daftar guru
     */
    public function index()
    {
        // Kita eager load 'user' untuk mengambil emailnya
        $teachers = Teacher::with('user')
            ->latest()
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'user_id' => $teacher->user_id,
                    'name' => $teacher->name,
                    'nip' => $teacher->nip,
                    'type' => $teacher->type,
                    'type_label' => $teacher->type_label, // Dari Accessor Model
                    'phone_number' => $teacher->phone_number,
                    'is_active' => $teacher->is_active,
                    // Ambil email dari tabel users, jika user terhapus/null tampilkan strip
                    'email' => $teacher->user ? $teacher->user->email : '-',
                ];
            });

        return Inertia::render('admin/teachers/Index', [
            'teachers' => $teachers
        ]);
    }

    /**
     * Menyimpan data guru baru (Sekaligus buat akun User)
     */
    public function store(Request $request)
    {
        // 1. Validasi
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email', // Cek unik di tabel users
            'nip' => 'nullable|string|unique:teachers,nip', // Cek unik di tabel teachers
            'type' => 'required|in:bahasa_jepang,kaigo,kensetsu,budaya',
            'phone_number' => 'nullable|string',
        ]);

        // Helper Kapitalisasi (Sama seperti Student, abaikan huruf Jepang)
        $makeUpper = function ($value) {
            if (!is_string($value)) return $value;
            if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FAF}]/u', $value)) {
                return $value;
            }
            return strtoupper($value);
        };

        DB::beginTransaction();
        try {
            // 2. Buat Akun User (Login)
            $user = User::create([
                'name'     => $makeUpper($request->name),
                'email'    => $request->email,
                'password' => Hash::make('password123'), // Default password
                'role'     => 'sensei',
            ]);

            // 3. Buat Data Profil Guru
            Teacher::create([
                'user_id'      => $user->id,
                'name'         => $makeUpper($request->name),
                'nip'          => $request->nip,
                'type'         => $request->type,
                'phone_number' => $request->phone_number,
                'is_active'    => true,
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Sensei berhasil didaftarkan (Akun Login dibuat).');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal menyimpan: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Update data guru (Update tabel teachers & users)
     */
    public function update(Request $request, Teacher $teacher)
    {
        // Pastikan relasi user terbawa (jika belum diload)
        $teacher->load('user');

        $request->validate([
            'name' => 'required|string|max:255',
            // Validasi email unik, tapi abaikan ID user milik guru ini
            'email' => 'required|email|unique:users,email,' . $teacher->user_id,
            // Validasi NIP unik, abaikan ID guru ini
            'nip' => 'nullable|string|unique:teachers,nip,' . $teacher->id,
            'type' => 'required|in:bahasa_jepang,kaigo,kensetsu,budaya',
            'phone_number' => 'nullable|string',
            'is_active' => 'required|boolean'
        ]);

        $makeUpper = function ($value) {
            if (!is_string($value)) return $value;
            if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FAF}]/u', $value)) {
                return $value;
            }
            return strtoupper($value);
        };

        DB::beginTransaction();
        try {
            // 1. Update Tabel Teachers
            $teacher->update([
                'name'         => $makeUpper($request->name),
                'nip'          => $request->nip,
                'type'         => $request->type,
                'phone_number' => $request->phone_number,
                'is_active'    => $request->is_active,
            ]);

            // 2. Update Tabel Users (Email & Nama sinkron)
            if ($teacher->user) {
                $teacher->user->update([
                    'name'  => $makeUpper($request->name),
                    'email' => $request->email, // Email login ikut berubah
                ]);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Data sensei berhasil diperbarui.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal update: ' . $e->getMessage()]);
        }
    }

    /**
     * Hapus guru (Soft Delete)
     */
    public function destroy(Teacher $teacher)
    {
        // Kita hanya melakukan Soft Delete pada Teacher agar history kelas aman.
        // User login bisa dibiarkan aktif atau ikut di-banned tergantung kebijakan.
        // Di sini kita biarkan User aktif (atau bisa dinonaktifkan manual), fokus hapus data guru.
        
        $teacher->delete();

        return redirect()->back()->with('success', 'Data sensei dihapus (Soft Delete).');
    }
}