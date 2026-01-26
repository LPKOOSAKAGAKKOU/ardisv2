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
    // Pastikan nama properti konsisten
    protected $yunervaService;

    public function __construct(YunervaService $yunervaService)
    {
        $this->yunervaService = $yunervaService;
    }

    public function index()
    {
        $user = Auth::user();

        // 1. AMBIL DATA PROFILE
        $studentProfile = StudentProfile::where('user_id', $user->id)->first();

        // 2. Logic Passed Interview
        $passedInterview = InterviewDetail::with(['interview.company'])
            ->where('user_id', $user->id)
            ->where('result', 'passed')
            ->first();

        if ($passedInterview) {
            return Inertia::render('student/Interview', [
                'mode' => 'PASSED',
                'data' => $passedInterview,
                'studentProfile' => $studentProfile,
            ]);
        }

        // 3. Logic Upcoming & Past
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
            'studentProfile' => $studentProfile,
        ]);
    }

    // --- PERBAIKAN DI SINI ---
    public function previewKyuujinhyou($id)
    {
        // 1. Cari data INTERVIEW (Ini punya Admin)
        $interview = Interview::findOrFail($id);

        // 2. Cek apakah Admin sudah upload file UUID nya
        if (!$interview->kyuujinhyou_yunerva_uuid) {
            return response()->json([
                'status' => 'error', 
                'message' => 'Dokumen Kyuujinhyou belum tersedia untuk lowongan ini.'
            ], 404);
        }

        try {
            // 3. Panggil Service (Gunakan $this->yunervaService, BUKAN $this->yunerva)
            // Password diset NULL karena file admin biasanya tidak dipassword user
            $response = $this->yunervaService->generateViewLink(
                $interview->kyuujinhyou_yunerva_uuid,
                null 
            );

            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('Gagal preview Kyuujinhyou: ' . $e->getMessage());

            return response()->json([
                'status' => 'error', 
                'message' => 'Terjadi kesalahan server saat mengambil dokumen.'
            ], 500);
        }
    }

    public function apply($id)
    {
        $user = Auth::user();

        // Cek Profile
        $profileExists = StudentProfile::where('user_id', $user->id)->exists();

        if (!$profileExists) {
            return response()->json([
                'status' => 'need_profile', 
                'message' => 'Mohon lengkapi biodata Anda terlebih dahulu sebelum mendaftar.',
                'redirect_url' => route('student.profile.edit')
            ], 403); 
        }
        
        // Cek Double
        $exists = \App\Models\InterviewDetail::where('interview_id', $id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            return response()->json(['status' => 'error', 'message' => 'Anda sudah terdaftar.'], 422);
        }

        // --- TAMBAHAN LOGIKA NOMOR URUT ---
        // Ambil nomor urut tertinggi saat ini untuk wawancara ini
        $lastOrder = \App\Models\InterviewDetail::where('interview_id', $id)
            ->max('order_number') ?? 0;

        // Simpan dengan nomor urut baru
        \App\Models\InterviewDetail::create([
            'interview_id' => $id,
            'user_id'      => $user->id,
            'order_number' => $lastOrder + 1, // <--- Masukkan ke sini
            'result'       => 'waiting',
        ]);

        return response()->json(['status' => 'success', 'message' => 'Berhasil mendaftar!']);
    }

    public function participants($id)
    {
        $participants = InterviewDetail::with('user:id,name,email') 
            ->where('interview_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $participants
        ]);
    }

    public function cancel($id)
    {
        $user = Auth::user();

        $application = InterviewDetail::where('interview_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$application) {
            return response()->json(['status' => 'error', 'message' => 'Data pendaftaran tidak ditemukan.'], 404);
        }

        if ($application->result !== 'waiting') {
            return response()->json(['status' => 'error', 'message' => 'Tidak dapat membatalkan wawancara yang sudah diproses.'], 422);
        }

        $application->delete();

        return response()->json(['status' => 'success', 'message' => 'Berhasil mengundurkan diri dari wawancara.']);
    }
}