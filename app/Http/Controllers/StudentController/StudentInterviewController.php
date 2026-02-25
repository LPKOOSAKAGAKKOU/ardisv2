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

        // 1. Ambil data Interview & Cek batas waktu pendaftaran
        $interview = \App\Models\Interview::findOrFail($id);

        if ($interview->interview_registration_deadline < now()) {
            return response()->json([
                'status' => 'error', 
                'message' => 'Maaf, batas waktu pendaftaran untuk wawancara ini sudah berakhir.'
            ], 422);
        }

        // 2. Cek Profile (Menggunakan relasi student_profile)
        $profile = \App\Models\StudentProfile::where('user_id', $user->id)->first();

        if (!$profile) {
            return response()->json([
                'status' => 'need_profile', 
                'message' => 'Mohon lengkapi biodata Anda terlebih dahulu sebelum mendaftar.',
                'redirect_url' => route('student.profile.edit')
            ], 403); 
        }
        
        // 3. Cek Double Registration
        $exists = \App\Models\InterviewDetail::where('interview_id', $id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            return response()->json(['status' => 'error', 'message' => 'Anda sudah terdaftar.'], 422);
        }

        // 4. Ambil nomor urut tertinggi
        $lastOrder = \App\Models\InterviewDetail::where('interview_id', $id)
            ->max('order_number') ?? 0;

        // 5. Simpan data ke database
        \App\Models\InterviewDetail::create([
            'interview_id' => $id,
            'user_id'      => $user->id,
            'order_number' => $lastOrder + 1,
            'result'       => 'waiting',
        ]);

        // Data untuk Notifikasi
        $studentName = $profile->full_name;
        $interviewDate = \Carbon\Carbon::parse($interview->interview_date)->format('d-m-Y');
        $groupLink = $interview->group_chat_link ?? 'Hubungi admin untuk link grup.';

        // --- 6. KIRIM EMAIL ---
        try {
            $emailData = [
                'name' => $studentName,
                'interview' => $interview->interviewer_title,
                'date' => $interviewDate,
                'group_link' => $groupLink
            ];

            \Illuminate\Support\Facades\Mail::send('emails.interview_apply_confirmation', $emailData, function($message) use ($user, $interview) {
                $message->to($user->email)
                        ->subject('Konfirmasi Pendaftaran Wawancara: ' . $interview->interviewer_title);
            });
        } catch (\Exception $e) {
            \Log::error("Email Apply Error: " . $e->getMessage());
        }

        // --- 7. KIRIM WHATSAPP ---
        $phoneNumber = $this->formatPhoneNumber($profile->phone_student);
        $waMessage = "*KONFIRMASI PENDAFTARAN WAWANCARA*\n\n" .
                    "Halo *{$studentName}*,\n" .
                    "Pendaftaran Anda berhasil diterima:\n" .
                    "Program: *{$interview->interviewer_title}*\n" .
                    "Tanggal: {$interviewDate}\n\n" .
                    "*PERINGATAN PENTING:*\n" .
                    "Jika status sudah menjadi *RESERVED* (Terseleksi), Anda *TIDAK BISA* mengundurkan diri lagi.\n\n" .
                    "Link Grup WhatsApp:\n" .
                    "{$groupLink}\n\n" .
                    "Terima kasih.";

        $this->sendWhatsApp($phoneNumber, $waMessage);

        return response()->json([
            'status' => 'success', 
            'message' => 'Berhasil mendaftar! Konfirmasi telah dikirim ke Email dan WhatsApp Anda.'
        ]);
    }

    private function formatPhoneNumber($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }
        return $phone;
    }

    private function sendWhatsApp($phone, $message)
    {
        $data = [
            "phone"   => $phone,
            "message" => $message
        ];

        try {
            $baseUrl = config('services.waha.url');
            $apiKey  = config('services.waha.key');

            \Illuminate\Support\Facades\Http::withHeaders([
                "Content-Type" => "application/json",
                "Authorization" => "Basic " . base64_encode($apiKey)
            ])->post($baseUrl . "/send/message", $data);
            
        } catch (\Exception $e) {
            \Log::error("WhatsApp Error saat Apply: " . $e->getMessage());
        }
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