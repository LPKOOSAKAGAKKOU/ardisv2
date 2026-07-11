<?php

namespace App\Http\Controllers\StudentController;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\InterviewDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Interview;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // 1. Ambil profil siswa
        $student = StudentProfile::with(['educations', 'experiences', 'families'])
            ->where('user_id', $user->id)
            ->first();

        // 2. CEK STATUS KELULUSAN
        // Cari apakah user ini punya riwayat interview yang statusnya 'passed'
        $passedApplication = InterviewDetail::with(['interview.company'])
            ->where('user_id', $user->id)
            ->where('result', 'passed')
            ->latest()
            ->first();

        // 3. Ambil daftar wawancara (Hanya jika BELUM lulus)
        $interviews = [];
        if (!$passedApplication) {
            $interviews = Interview::with(['company'])
                ->where('interview_date', '>=', now()->toDateString())
                ->orderBy('interview_date', 'asc')
                ->get();
        }

        // 4. Ambil data tagihan kelulusan job dan COE (jika ada)
        $paymentJob = \App\Models\Payment::where('user_id', $user->id)
            ->where('payment_category', 'biaya_lulus_job')
            ->latest()
            ->first();

        $paymentCoe = \App\Models\Payment::where('user_id', $user->id)
            ->where('payment_category', 'biaya_coe_turun')
            ->latest()
            ->first();

        // Fallback Auto-sync: Jika webhook terhambat firewall, sync status dari Aulaa saat siswa memuat dashboard
        $aulaa = app(\App\Services\AulaaPaymentService::class);
        $syncPayment = function ($payment) use ($aulaa) {
            if ($payment && $payment->status === 'pending' && $payment->aulaa_payment_id) {
                try {
                    $statusData = $aulaa->getPaymentStatus($payment->aulaa_payment_id);
                    $newStatus = $statusData['status'] ?? 'pending';
                    if ($newStatus !== $payment->status) {
                        $payment->status = $newStatus;
                        if ($newStatus === 'paid') {
                            $payment->payment_date = isset($statusData['paid_at']) ? date('Y-m-d', strtotime($statusData['paid_at'])) : now();
                            $payment->payment_method = $statusData['payment_method'] ?? 'aulaa';
                        }
                        $payment->save();
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning("Auto-sync failed for payment ID {$payment->id}: " . $e->getMessage());
                }
            }
        };
        $syncPayment($paymentJob);
        $syncPayment($paymentCoe);

        return Inertia::render('student/dashboard', [
            'student' => $student,
            'passedApplication' => $passedApplication, // Kirim data kelulusan ke frontend
            'paymentJob' => $paymentJob, // Kirim data tagihan lulus job ke frontend
            'paymentCoe' => $paymentCoe, // Kirim data tagihan coe ke frontend
            'interviews' => $interviews,
            'auth' => [
                'user' => $user
            ]
        ]);
    }
}