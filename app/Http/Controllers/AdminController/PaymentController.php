<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Payment;
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

        $students = User::where('role', 'student')
            ->whereHas('hasManyInterviewDetails', function ($q) {
                $q->where('result', 'passed');
            })
            ->with([
                'student_profile',
                'hasManyInterviewDetails' => function ($q) {
                    $q->where('result', 'passed')->with('interview.company');
                },
                'payments' => function ($q) {
                    $q->where('payment_category', 'sudah_dapat_job')->latest();
                }
            ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhereHas('student_profile', function ($sp) use ($search) {
                            $sp->where('nik', 'like', "%{$search}%");
                        });
                });
            })
            ->paginate(15)
            ->withQueryString()
            ->through(function ($user) {
                // Get passed interview detail
                $passedDetail = $user->hasManyInterviewDetails->first();
                $jobTitle = $passedDetail?->interview?->interviewer_title ?? 'N/A';
                $companyName = $passedDetail?->interview?->company?->name ?? 'N/A';

                // Get latest job payment
                $payment = $user->payments->first();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nik' => $user->student_profile?->nik ?? '-',
                    'job_title' => $jobTitle,
                    'company_name' => $companyName,
                    'payment' => $payment ? [
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
                    ] : null
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
            'user_id' => 'required|exists:users,id',
            'discount' => 'nullable|integer|min:0|max:15000000',
            'description' => 'nullable|string',
        ]);

        $user = User::findOrFail($request->user_id);

        // Ensure the student has passed an interview
        $hasPassed = $user->hasManyInterviewDetails()->where('result', 'passed')->exists();
        if (!$hasPassed) {
            return back()->with('error', 'Siswa terpilih belum lulus wawancara kerja.');
        }

        // Check if student already has a pending or paid job payment
        $existingPayment = Payment::where('user_id', $user->id)
            ->where('payment_category', 'sudah_dapat_job')
            ->whereIn('status', ['pending', 'paid'])
            ->first();

        if ($existingPayment) {
            return back()->with('error', 'Tagihan untuk siswa ini sudah aktif atau sudah lunas.');
        }

        $discount = $request->discount ?? 0;
        $originalAmount = 15000000;
        $finalAmount = $originalAmount - $discount;
        $invoiceNumber = 'INV-JOB-' . $user->id . '-' . time();

        try {
            // Call Aulaa Payment Gateway
            $aulaaResponse = $this->aulaa->createPaymentLink($invoiceNumber, $finalAmount);

            // Store payment link in local database
            // Redirect URL format is https://payment.aulaa.co/pay/{id}
            $paymentUrl = 'https://payment.aulaa.co/pay/' . $aulaaResponse['id'];

            Payment::create([
                'user_id' => $user->id,
                'invoice_number' => $invoiceNumber,
                'original_amount' => $originalAmount,
                'discount' => $discount,
                'amount' => $finalAmount,
                'payment_category' => 'sudah_dapat_job',
                'status' => 'pending',
                'aulaa_payment_id' => $aulaaResponse['id'],
                'payment_url' => $paymentUrl,
                'description' => $request->description,
            ]);

            return back()->with('success', 'Tagihan pembayaran berhasil dibuat.');

        } catch (\Exception $e) {
            Log::error('Gagal membuat tagihan Aulaa: ' . $e->getMessage());
            return back()->with('error', 'Gagal memproses pembayaran ke Aulaa.co: ' . $e->getMessage());
        }
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
