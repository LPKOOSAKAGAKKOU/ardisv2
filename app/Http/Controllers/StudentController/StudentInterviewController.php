<?php

namespace App\Http\Controllers\StudentController;

use App\Http\Controllers\Controller;
use App\Models\Interview; // <--- PASTIKAN INI MODEL INTERVIEW
use App\Models\InterviewDetail;
use App\Models\StudentProfile;
use App\Services\YunervaService; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StudentInterviewController extends Controller
{
    protected $yunervaService;

    public function __construct(YunervaService $yunervaService)
    {
        $this->yunervaService = $yunervaService;
    }

    public function index()
    {
        $user = Auth::user();
        $studentProfile = StudentProfile::where('user_id', $user->id)->first();

        // Cek Lulus
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

        // List Upcoming
        $upcoming = Interview::with([
            'company', 
            'details' => function($query) use ($user) {
                $query->where('user_id', $user->id);
            }
        ])
        ->where('interview_date', '>=', now()->toDateString())
        ->orderBy('interview_date', 'asc')
        ->get();

        // List Past
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

    // --- BAGIAN INI YANG KEMARIN SALAH KARENA PAKE FILEUPLOAD ---
    public function previewKyuujinhyou($id)
    {
        // KITA CARI INTERVIEW, BUKAN FILEUPLOAD
        $interview = Interview::findOrFail($id);

        if (!$interview->kyuujinhyou_yunerva_uuid) {
            return response()->json([
                'status' => 'error', 
                'message' => 'Dokumen Kyuujinhyou belum tersedia.'
            ], 404);
        }

        try {
            $response = $this->yunervaService->generateViewLink(
                $interview->kyuujinhyou_yunerva_uuid,
                null 
            );

            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('Preview Error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Gagal load dokumen.'], 500);
        }
    }

    // --- Apply, Cancel, Participants tetap sama ---
    public function apply($id)
    {
        $user = Auth::user();
        if (!StudentProfile::where('user_id', $user->id)->exists()) {
            return response()->json([
                'status' => 'need_profile', 
                'message' => 'Lengkapi biodata dulu.',
                'redirect_url' => route('student.profile.edit')
            ], 403);
        }
        
        if (InterviewDetail::where('interview_id', $id)->where('user_id', $user->id)->exists()) {
            return response()->json(['status' => 'error', 'message' => 'Sudah terdaftar.'], 422);
        }

        InterviewDetail::create([
            'interview_id' => $id,
            'user_id' => $user->id,
            'result' => 'waiting',
        ]);

        return response()->json(['status' => 'success', 'message' => 'Berhasil mendaftar!']);
    }

    public function cancel($id)
    {
        $detail = InterviewDetail::where('interview_id', $id)->where('user_id', Auth::id())->first();
        if ($detail && $detail->result === 'waiting') {
            $detail->delete();
            return response()->json(['status' => 'success', 'message' => 'Batal mendaftar.']);
        }
        return response()->json(['status' => 'error', 'message' => 'Gagal membatalkan.'], 400);
    }

    public function participants($id)
    {
        return response()->json(['status' => 'success', 'data' => []]); // Placeholder biar gak error
    }
}