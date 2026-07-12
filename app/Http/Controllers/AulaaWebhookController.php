<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AulaaWebhookController extends Controller
{
    /**
     * Handle incoming webhook notification from Aulaa.co
     */
    public function handleWebhook(Request $request)
    {
        Log::info('Aulaa Webhook request reached controller!', [
            'ip' => $request->ip(),
            'headers' => $request->headers->all(),
            'content' => $request->getContent()
        ]);

        $signature = $request->header('X-Webhook-Signature');
        
        if (!$signature) {
            Log::warning('Aulaa Webhook warning: Missing X-Webhook-Signature header.');
            return response()->json(['error' => 'Missing signature'], 401);
        }

        $rawPayload = $request->getContent(); // Raw request body is required for signature verification
        
        $webhookSecret = config('services.aulaa.webhook_secret');
        
        if (empty($webhookSecret)) {
            Log::error('Aulaa Webhook Error: Webhook secret is not configured.');
            return response()->json(['error' => 'Webhook secret not configured'], 500);
        }

        // Calculate expected HMAC-SHA256 signature
        $expectedSignature = hash_hmac('sha256', $rawPayload, $webhookSecret);

        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('Aulaa Webhook warning: Invalid signature.', [
                'received_signature' => $signature,
                'expected_signature' => $expectedSignature,
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Parse payload
        $data = json_decode($rawPayload, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json(['error' => 'Invalid JSON payload'], 400);
        }

        $orderId = $data['order_id'] ?? null;
        $status = $data['status'] ?? null; // paid, expired, cancelled, failed

        if (!$orderId || !$status) {
            return response()->json(['error' => 'Missing order_id or status'], 400);
        }

        Log::info("Aulaa Webhook received: Order ID {$orderId} is now {$status}");

        // Find payment record
        $payment = Payment::where('invoice_number', $orderId)->first();

        if (!$payment) {
            Log::warning("Aulaa Webhook warning: Payment not found for Order ID {$orderId}");
            return response()->json(['error' => 'Payment not found'], 404);
        }

        // Update payment status
        $payment->status = $status;

        if ($status === 'paid') {
            $payment->payment_date = isset($data['paid_at']) ? date('Y-m-d', strtotime($data['paid_at'])) : now();
            $payment->payment_method = $data['payment_method'] ?? 'aulaa';
        }

        $payment->save();

        // Kirim email notifikasi ke siswa
        try {
            $user = $payment->user;
            if ($user && $user->email) {
                if ($status === 'paid') {
                    $this->handlePaidNotification($payment, $user);
                } elseif ($status === 'expired') {
                    Mail::to($user->email)->send(new \App\Mail\PaymentExpiredMail($payment));
                } elseif ($status === 'failed') {
                    Mail::to($user->email)->send(new \App\Mail\PaymentFailedMail($payment));
                }
            }
        } catch (\Exception $mailEx) {
            Log::error("Gagal mengirim email notifikasi status ({$status}) ke siswa: " . $mailEx->getMessage());
        }

        return response()->json(['received' => true], 200);
    }

    /**
     * Handle paid notification logic.
     * For COE categories, check if the partner payment is also paid.
     */
    private function handlePaidNotification(Payment $payment, $user)
    {
        $category = $payment->payment_category;

        // Check if this is a COE paired category
        if (in_array($category, Payment::COE_PAIR_CATEGORIES)) {
            // Find the partner category
            $partnerCategory = $category === 'biaya_pengurusan_dokumen'
                ? 'biaya_administrasi_coe'
                : 'biaya_pengurusan_dokumen';

            // Find partner payment (same user, same interview detail)
            $partnerPayment = Payment::where('user_id', $payment->user_id)
                ->where('interview_detail_id', $payment->interview_detail_id)
                ->where('payment_category', $partnerCategory)
                ->latest()
                ->first();

            if ($partnerPayment && $partnerPayment->status === 'paid') {
                // Both COE payments are paid → send "all paid" email
                Mail::to($user->email)->send(new \App\Mail\PaymentCoeAllPaidMail($payment, $partnerPayment));
            } else {
                // Only this one is paid → send "partial paid" email with reminder
                Mail::to($user->email)->send(new \App\Mail\PaymentCoePartialPaidMail($payment, $partnerPayment));
            }
        } else {
            // Standard single payment notification
            Mail::to($user->email)->send(new \App\Mail\PaymentPaidMail($payment));
        }
    }
}
