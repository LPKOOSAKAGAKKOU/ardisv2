<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        return response()->json(['received' => true], 200);
    }
}
