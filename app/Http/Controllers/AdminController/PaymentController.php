<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Payment;
use App\Models\Interview;
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
     * Display a listing of interviews and their passed students' payments.
     */
    public function index(Request $request)
    {
        $search = $request->search;

        $interviews = Interview::whereHas('details', function ($q) {
                $q->where('result', 'passed');
            })
            ->with([
                'company',
                'details' => function ($q) {
                    $q->where('result', 'passed')->with([
                        'user.student_profile',
                        'payments' => function ($p) {
                            $p->whereIn('payment_category', ['biaya_lulus_job', 'biaya_coe_turun']);
                        }
                    ]);
                }
            ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('interviewer_title', 'like', "%{$search}%")
                        ->orWhereHas('company', function ($c) use ($search) {
                            $c->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('details', function ($det) use ($search) {
                            $det->where('result', 'passed')
                                ->whereHas('user', function ($u) use ($search) {
                                    $u->where('name', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->orderByDesc('interview_date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($interview) {
                $students = $interview->details->map(function ($detail) {
                    $user = $detail->user;
                    
                    $paymentJob = $detail->payments->where('payment_category', 'biaya_lulus_job')->sortByDesc('id')->first();
                    $paymentCoe = $detail->payments->where('payment_category', 'biaya_coe_turun')->sortByDesc('id')->first();

                    // Fallback Auto-sync: jika webhook terblokir firewall, sinkronkan status langsung dari Aulaa saat admin memuat halaman
                    $syncPayment = function ($payment) {
                        if ($payment && $payment->status === 'pending' && $payment->aulaa_payment_id) {
                            try {
                                $statusData = $this->aulaa->getPaymentStatus($payment->aulaa_payment_id);
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
                                Log::warning("Auto-sync admin failed for payment ID {$payment->id}: " . $e->getMessage());
                            }
                        }
                    };
                    $syncPayment($paymentJob);
                    $syncPayment($paymentCoe);

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
                        'payment_job' => $formatPayment($paymentJob),
                        'payment_coe' => $formatPayment($paymentCoe),
                    ];
                });

                return [
                    'id' => $interview->id,
                    'interviewer_title' => $interview->interviewer_title,
                    'company_name' => $interview->company?->name ?? 'N/A',
                    'interview_date' => $interview->interview_date ? date('Y-m-d', strtotime($interview->interview_date)) : '-',
                    'students' => $students,
                ];
            });

        return Inertia::render('admin/payment/Index', [
            'students' => $interviews, // Passed as 'students' to remain compatible with pagination in frontend
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
        $studentNameSlug = strtoupper(\Illuminate\Support\Str::slug($user->name));
        $invoiceNumber = 'INV-' . $catPrefix . '-' . $detail->id . '-' . $studentNameSlug . '-' . time();

        try {
            // Call Aulaa Payment Gateway
            $aulaaResponse = $this->aulaa->createPaymentLink($invoiceNumber, $finalAmount);
            $paymentUrl = 'https://payment.aulaa.co/pay/' . $aulaaResponse['id'];

            $payment = Payment::create([
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

            // Kirim email tagihan ke siswa
            try {
                if ($user->email) {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\PaymentBillingMail($payment));
                }
            } catch (\Exception $mailEx) {
                Log::error('Gagal mengirim email tagihan ke siswa: ' . $mailEx->getMessage());
            }

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
            $studentNameSlug = strtoupper(\Illuminate\Support\Str::slug($user->name));
            $invoiceNumber = 'INV-' . $catPrefix . '-MAN-' . $detail->id . '-' . $studentNameSlug . '-' . time();

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

        // Jika tagihan dibuat melalui Aulaa (memiliki ID pembayaran Aulaa), batalkan di gateway juga
        if ($payment->aulaa_payment_id) {
            try {
                $this->aulaa->cancelPaymentLink($payment->aulaa_payment_id);
            } catch (\Exception $e) {
                Log::error('Gagal membatalkan tagihan di Aulaa Gateway: ' . $e->getMessage());
                // Tetap lanjutkan pembatalan lokal, tetapi beri tahu admin lewat warning/notifikasi
                $payment->status = 'cancelled';
                $payment->save();
                return back()->with('success', 'Tagihan dibatalkan secara lokal, namun gagal membatalkan di Aulaa Gateway: ' . $e->getMessage());
            }
        }

        $payment->status = 'cancelled';
        $payment->save();

        return back()->with('success', 'Tagihan pembayaran berhasil dibatalkan.');
    }
}
