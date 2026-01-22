<?php

namespace App\Http\Controllers\StudentController;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Models\InterviewDetail;
use App\Models\StudentProfile;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\YunervaService; 
use Illuminate\Http\Request;

class StudentInterviewController extends Controller
{
    protected $yunervaService;

    public function __construct(YunervaService $yunerva)
    {
        $this->yunerva = $yunerva;
    }

    public function index()
    {
        $user = Auth::user();

        // 1. AMBIL DATA PROFILE TERPISAH (Tanpa load ke user)
        // Pastikan model StudentProfile sudah di-import
        $studentProfile = StudentProfile::where('user_id', $user->id)->first();

        // 2. Logic Passed Interview (Tetap sama)
        $passedInterview = InterviewDetail::with(['interview.company'])
            ->where('user_id', $user->id)
            ->where('result', 'passed')
            ->first();

        if ($passedInterview) {
            return Inertia::render('student/Interview', [
                'mode' => 'PASSED',
                'data' => $passedInterview,
                'studentProfile' => $studentProfile, // <--- KIRIM DISINI
            ]);
        }

        // 3. Logic Upcoming & Past (Tetap sama)
        $upcoming = Interview::with([
            'company', 
            'details' => function($query) use ($user) {
                $query->where('user_id', $user->id);
            }
        ])
        ->where('interview_date', '>=', now()->toDateString())
        ->orderBy('interview_date', 'asc')
        ->get();

        $past = InterviewDetail::with(['interview.company'])
            ->where('user_id', $user->id)
            ->where('result', '!=', 'passed')
            ->whereHas('interview', function($q) {
                $q->where('interview_date', '<', now()->toDateString());
            })
            ->get();

        return Inertia::render('student/Interview', [
            'mode' => 'LISTING',
            'upcoming' => $upcoming,
            'past' => $past,
            'studentProfile' => $studentProfile, // <--- KIRIM DISINI JUGA
        ]);
    }

    // --- 2. METHOD PREVIEW KYUUJINHYOU (Sama persis dengan Admin) ---
    public function previewKyuujinhyou(Request $request, $id)
    {
        // Cari data interview
        $interview = Interview::findOrFail($id);

        // Cek kolom di database
        if (!$interview->kyuujinhyou_yunerva_uuid) {
            return response()->json([
                'status' => 'error', 
                'message' => 'File tidak ditemukan'
            ], 404);
        }

        try {
            // Panggil service Yunerva (gunakan $this->yunerva yang sudah diisi di construct)
            $response = $this->yunerva->generateViewLink(
                $interview->kyuujinhyou_yunerva_uuid,
                null // Password null sesuai request
            );

            return response()->json($response);

        } catch (\Exception $e) {
            // Log error biar ketahuan kalau ada masalah lain
            \Log::error('Preview Error: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error', 
                'message' => 'Gagal menghubungi server dokumen.'
            ], 500);
        }
    }

    public function apply($id)
    {
        $user = Auth::user();

        // 1. CEK PROFILE: Apakah siswa sudah mengisi biodata?
        $profileExists = StudentProfile::where('user_id', $user->id)->exists();

        if (!$profileExists) {
            // Kirim response JSON dengan instruksi redirect
            return response()->json([
                'status' => 'need_profile', // Status khusus untuk ditangkap Frontend
                'message' => 'Mohon lengkapi biodata Anda terlebih dahulu sebelum mendaftar.',
                'redirect_url' => route('student.profile.edit') // URL tujuan
            ], 403); // Gunakan 403 (Forbidden) karena akses ditolak sebelum syarat terpenuhi
        }
        
        // 2. Proteksi double pendaftaran (Kode lama Anda)
        $exists = \App\Models\InterviewDetail::where('interview_id', $id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            return response()->json(['status' => 'error', 'message' => 'Anda sudah terdaftar.'], 422);
        }

        // 3. Simpan Pendaftaran
        \App\Models\InterviewDetail::create([
            'interview_id' => $id,
            'user_id' => $user->id,
            'result' => 'waiting',
        ]);

        return response()->json(['status' => 'success', 'message' => 'Berhasil mendaftar!']);
    }

    public function participants($id)
    {
        // Ambil detail pendaftaran untuk interview ini
        $participants = InterviewDetail::with('user:id,name,email') // Hanya ambil nama & email
            ->where('interview_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $participants
        ]);
    }

    // Tambahkan method ini di dalam StudentInterviewController

    public function cancel($id)
    {
        $user = Auth::user();

        // Cari data pendaftaran
        $application = InterviewDetail::where('interview_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$application) {
            return response()->json(['status' => 'error', 'message' => 'Data pendaftaran tidak ditemukan.'], 404);
        }

        // Opsional: Cegah pembatalan jika status bukan 'waiting' (misal sudah Lulus)
        if ($application->result !== 'waiting') {
            return response()->json(['status' => 'error', 'message' => 'Tidak dapat membatalkan wawancara yang sudah diproses.'], 422);
        }

        // Hapus pendaftaran
        $application->delete();

        return response()->json(['status' => 'success', 'message' => 'Berhasil mengundurkan diri dari wawancara.']);
    }

}