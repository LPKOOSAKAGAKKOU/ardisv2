<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Payment;
use App\Models\InterviewDetail;
use App\Services\AulaaPaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected AulaaPaymentService $aulaa;

    public function __construct(AulaaPaymentService $aulaa)
    {
        $this->aulaa = $aulaa;
    }

    /**
     * Display a listing of students who passed interviews and their payments.
     */
    public function index(Request $request)
    {
        $search = $request->search;

        $students = InterviewDetail::where('result', 'passed')
            ->with([
                'user.student_profile',
                'interview.company',
                'payments' => function ($q) {
                    $q->whereIn('payment_category', ['biaya_lulus_job', 'biaya_coe_turun']);
                }
            ])
            ->when($search, function ($query, $search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhereHas('student_profile', function ($sp) use ($search) {
                            $sp->where('nik', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($detail) {
                $user = $detail->user;
                $interview = $detail->interview;
                
                // Get payments for this interview detail
                $paymentJob = $detail->payments->where('payment_category', 'biaya_lulus_job')->first();
                $paymentCoe = $detail->payments->where('payment_category', 'biaya_coe_turun')->first();

                $formatPayment = function ($payment) {
                    if (!$payment) return null;
                    return [
                        'id' => $payment->id,
                        'invoice_number' => $payment->invoice_number,
                        'original_amount' => $payment->original_amount,
                        'discount' => $payment->discount,
                        'amount' => $payment->amount,
                        'status' => $payment->status,
                        'payment_url' => $payment->payment_url,
                        'payment_method' => $payment->payment_method,
                        'payment_date' => $payment->payment_date?->toDateString(),
                        'description' => $payment->description,
                        'additional_items' => $payment->additional_items ?? [],
                    ];
                };

                return [
                    'id' => $detail->id, // interview detail ID
                    'user_id' => $user?->id,
                    'name' => $user?->name ?? 'N/A',
                    'nik' => $user?->student_profile?->nik ?? '-',
                    'job_title' => $interview?->interviewer_title ?? 'N/A',
                    'company_name' => $interview?->company?->name ?? 'N/A',
                    'payment_job' => $formatPayment($paymentJob),
                    'payment_coe' => $formatPayment($paymentCoe),
                ];
            });

        return Inertia::render('admin/payment/Index', [
            'students' => $students,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created billing and request payment link from Aulaa.
     */
    public function store(Request $request)
    {
        $request->validate([
            'interview_detail_id' => 'required|exists:interview_details,id',
            'payment_category' => 'required|in:biaya_lulus_job,biaya_coe_turun',
            'discount' => 'nullable|integer|min:0|max:15000000',
            'description' => 'nullable|string',
            'additional_items' => 'nullable|array',
            'additional_items.*.name' => 'required_with:additional_items|string',
            'additional_items.*.amount' => 'required_with:additional_items|integer|min:0',
        ]);

        $detail = InterviewDetail::findOrFail($request->interview_detail_id);
        $user = $detail->user;

        if (!$user) {
            return back()->with('error', 'Siswa tidak ditemukan.');
        }

        // Check if payment already exists for this category
        $existingPayment = Payment::where('interview_detail_id', $detail->id)
            ->where('payment_category', $request->payment_category)
            ->whereIn('status', ['pending', 'paid'])
            ->first();

        if ($existingPayment) {
            return back()->with('error', 'Tagihan untuk kategori ini sudah aktif atau sudah lunas.');
        }

        $discount = $request->discount ?? 0;
        $originalAmount = 15000000;
        
        // Sum additional items
        $additionalItems = $request->additional_items ?? [];
        $additionalSum = 0;
        foreach ($additionalItems as $item) {
            $additionalSum += (int)$item['amount'];
        }

        $finalAmount = $originalAmount - $discount + $additionalSum;
        
        $catPrefix = $request->payment_category === 'biaya_lulus_job' ? 'JOB' : 'COE';
        $invoiceNumber = 'INV-' . $catPrefix . '-' . $detail->id . '-' . time();

        try {
            // Call Aulaa Payment Gateway
            $aulaaResponse = $this->aulaa->createPaymentLink($invoiceNumber, $finalAmount);
            $paymentUrl = 'https://payment.aulaa.co/pay/' . $aulaaResponse['id'];

            Payment::create([
                'user_id' => $user->id,
                'interview_detail_id' => $detail->id,
                'invoice_number' => $invoiceNumber,
                'original_amount' => $originalAmount,
                'discount' => $discount,
                'amount' => $finalAmount,
                'payment_category' => $request->payment_category,
                'status' => 'pending',
                'aulaa_payment_id' => $aulaaResponse['id'],
                'payment_url' => $paymentUrl,
                'description' => $request->description,
                'additional_items' => $additionalItems,
            ]);

            return back()->with('success', 'Tagihan pembayaran Aulaa berhasil dibuat.');

        } catch (\Exception $e) {
            Log::error('Gagal membuat tagihan Aulaa: ' . $e->getMessage());
            return back()->with('error', 'Gagal memproses pembayaran ke Aulaa.co: ' . $e->getMessage());
        }
    }

    /**
     * Mark a billing payment as paid manually.
     */
    public function markAsPaid(Request $request)
    {
        $request->validate([
            'interview_detail_id' => 'required|exists:interview_details,id',
            'payment_category' => 'required|in:biaya_lulus_job,biaya_coe_turun',
            'discount' => 'nullable|integer|min:0|max:15000000',
            'description' => 'nullable|string',
            'additional_items' => 'nullable|array',
            'additional_items.*.name' => 'required_with:additional_items|string',
            'additional_items.*.amount' => 'required_with:additional_items|integer|min:0',
        ]);

        $detail = InterviewDetail::findOrFail($request->interview_detail_id);
        $user = $detail->user;

        if (!$user) {
            return back()->with('error', 'Siswa tidak ditemukan.');
        }

        // Check if there is already a paid payment
        $paidPayment = Payment::where('interview_detail_id', $detail->id)
            ->where('payment_category', $request->payment_category)
            ->where('status', 'paid')
            ->first();

        if ($paidPayment) {
            return back()->with('error', 'Pembayaran untuk kategori ini sudah lunas.');
        }

        $discount = $request->discount ?? 0;
        $originalAmount = 15000000;

        $additionalItems = $request->additional_items ?? [];
        $additionalSum = 0;
        foreach ($additionalItems as $item) {
            $additionalSum += (int)$item['amount'];
        }

        $finalAmount = $originalAmount - $discount + $additionalSum;

        // If there's an existing pending payment, update it to paid manual
        $payment = Payment::where('interview_detail_id', $detail->id)
            ->where('payment_category', $request->payment_category)
            ->where('status', 'pending')
            ->first();

        if ($payment) {
            $payment->update([
                'status' => 'paid',
                'payment_method' => 'manual',
                'payment_date' => now(),
                'discount' => $discount,
                'amount' => $finalAmount,
                'description' => $request->description,
                'additional_items' => $additionalItems,
            ]);
        } else {
            $catPrefix = $request->payment_category === 'biaya_lulus_job' ? 'JOB' : 'COE';
            $invoiceNumber = 'INV-' . $catPrefix . '-MAN-' . $detail->id . '-' . time();

            Payment::create([
                'user_id' => $user->id,
                'interview_detail_id' => $detail->id,
                'invoice_number' => $invoiceNumber,
                'original_amount' => $originalAmount,
                'discount' => $discount,
                'amount' => $finalAmount,
                'payment_category' => $request->payment_category,
                'status' => 'paid',
                'payment_method' => 'manual',
                'payment_date' => now(),
                'description' => $request->description,
                'additional_items' => $additionalItems,
            ]);
        }

        return back()->with('success', 'Pembayaran berhasil ditandai sebagai LUNAS secara manual.');
    }

    /**
     * Manually check and sync payment status from Aulaa.co.
     */
    public function checkStatus($id)
    {
        $payment = Payment::findOrFail($id);

        if (!$payment->aulaa_payment_id) {
            return back()->with('error', 'ID pembayaran Aulaa tidak ditemukan.');
        }

        try {
            $aulaaData = $this->aulaa->getPaymentStatus($payment->aulaa_payment_id);
            $newStatus = $aulaaData['status']; // paid, pending, expired, cancelled, failed

            $payment->status = $newStatus;

            if ($newStatus === 'paid') {
                $payment->payment_date = $aulaaData['paid_at'] ? date('Y-m-d', strtotime($aulaaData['paid_at'])) : now();
                $payment->payment_method = $aulaaData['payment_method'] ?? 'aulaa';
            }

            $payment->save();

            return back()->with('success', 'Status pembayaran berhasil diperbarui menjadi: ' . strtoupper($newStatus));

        } catch (\Exception $e) {
            Log::error('Gagal sinkronisasi status Aulaa: ' . $e->getMessage());
            return back()->with('error', 'Gagal menyinkronkan status dari Aulaa.co: ' . $e->getMessage());
        }
    }

    /**
     * Cancel a pending payment billing.
     */
    public function cancel($id)
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'pending') {
            return back()->with('error', 'Hanya tagihan pending yang dapat dibatalkan.');
        }

        $payment->status = 'cancelled';
        $payment->save();

        return back()->with('success', 'Tagihan pembayaran berhasil dibatalkan.');
    }
}
