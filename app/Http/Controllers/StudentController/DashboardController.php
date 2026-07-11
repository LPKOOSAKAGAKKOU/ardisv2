<?php

namespace App\Http\Controllers\StudentController;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\InterviewDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Interview;
use App\Models\Payment;
use App\Services\AulaaPaymentService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentBillingMail;

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

    /**
     * Regenerate a new payment link for an expired or cancelled payment.
     */
    public function regeneratePayment($id, AulaaPaymentService $aulaa)
    {
        $user = Auth::user();
        
        $oldPayment = Payment::where('id', $id)
            ->where('user_id', $user->id)
            ->whereIn('status', ['expired', 'cancelled', 'failed'])
            ->firstOrFail();

        $catPrefix = $oldPayment->payment_category === 'biaya_lulus_job' ? 'JOB' : 'COE';
        $studentNameSlug = strtoupper(Str::slug($user->name));
        $invoiceNumber = 'INV-' . $catPrefix . '-' . $oldPayment->interview_detail_id . '-' . $studentNameSlug . '-' . time();

        try {
            $aulaaResponse = $aulaa->createPaymentLink($invoiceNumber, $oldPayment->amount);
            $paymentUrl = 'https://payment.aulaa.co/pay/' . $aulaaResponse['id'];
            $expiredAt = isset($aulaaResponse['expired_at']) ? date('Y-m-d H:i:s', strtotime($aulaaResponse['expired_at'])) : null;

            $newPayment = Payment::create([
                'user_id' => $user->id,
                'interview_detail_id' => $oldPayment->interview_detail_id,
                'invoice_number' => $invoiceNumber,
                'original_amount' => $oldPayment->original_amount,
                'discount' => $oldPayment->discount,
                'amount' => $oldPayment->amount,
                'payment_category' => $oldPayment->payment_category,
                'status' => 'pending',
                'aulaa_payment_id' => $aulaaResponse['id'],
                'payment_url' => $paymentUrl,
                'expired_at' => $expiredAt,
                'description' => $oldPayment->description,
                'additional_items' => $oldPayment->additional_items,
            ]);

            try {
                if ($user->email) {
                    Mail::to($user->email)->send(new PaymentBillingMail($newPayment));
                }
            } catch (\Exception $mailEx) {
                Log::error('Gagal mengirim email tagihan baru ke siswa: ' . $mailEx->getMessage());
            }

            return back()->with('success', 'Link pembayaran baru berhasil dibuat.');

        } catch (\Exception $e) {
            Log::error('Gagal regenerasi pembayaran oleh siswa: ' . $e->getMessage());
            return back()->with('error', 'Gagal membuat link pembayaran baru: ' . $e->getMessage());
        }
    }
}