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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

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
                            $p->whereIn('payment_category', Payment::ALL_CATEGORIES);
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
                    
                    $paymentJobWawancara = $detail->payments->where('payment_category', 'biaya_lulus_wawancara')->sortByDesc('id')->first();
                    $paymentJobPendidikan = $detail->payments->where('payment_category', 'biaya_pendidikan_bahasa')->sortByDesc('id')->first();
                    $paymentCoeDokumen = $detail->payments->where('payment_category', 'biaya_pengurusan_dokumen')->sortByDesc('id')->first();
                    $paymentCoeAdmin = $detail->payments->where('payment_category', 'biaya_administrasi_coe')->sortByDesc('id')->first();

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
                            'expired_at' => $payment->expired_at?->toIso8601String(),
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
                        'payment_job_wawancara' => $formatPayment($paymentJobWawancara),
                        'payment_job_pendidikan' => $formatPayment($paymentJobPendidikan),
                        'payment_coe_dokumen' => $formatPayment($paymentCoeDokumen),
                        'payment_coe_admin' => $formatPayment($paymentCoeAdmin),
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
            'students' => $interviews,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created billing and request payment link from Aulaa.
     * For COE and Job categories, creates 2 invoices simultaneously.
     */
    public function store(Request $request)
    {
        $request->validate([
            'interview_detail_id' => 'required|exists:interview_details,id',
            'payment_category' => 'required|in:' . implode(',', Payment::ALL_CATEGORIES),
            'discount' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'additional_items' => 'nullable|array',
            'additional_items.*.name' => 'required_with:additional_items|string',
            'additional_items.*.amount' => 'required_with:additional_items|integer|min:0',
            // Dual-specific: second invoice fields
            'discount_2' => 'nullable|integer|min:0',
            'additional_items_2' => 'nullable|array',
            'additional_items_2.*.name' => 'required_with:additional_items_2|string',
            'additional_items_2.*.amount' => 'required_with:additional_items_2|integer|min:0',
        ]);

        $detail = InterviewDetail::findOrFail($request->interview_detail_id);
        $user = $detail->user;

        if (!$user) {
            return back()->with('error', 'Siswa tidak ditemukan.');
        }

        $category = $request->payment_category;

        // Backend Validation: Subtotal cannot exceed 9,500,000 per link
        try {
            $this->validateAmountsLimit($request, $category);
        } catch (\Exception $ex) {
            return back()->with('error', $ex->getMessage());
        }

        // Block direct individual creation of the second partner categories
        if (in_array($category, ['biaya_pendidikan_bahasa', 'biaya_administrasi_coe'])) {
            return back()->with('error', 'Kategori ini harus dibuat bersamaan dengan pasangannya.');
        }

        // --- JOB: Create 2 invoices at once ---
        if ($category === 'biaya_lulus_wawancara') {
            return $this->storeJobPayments($request, $detail, $user);
        }

        // --- COE: Create 2 invoices at once ---
        if ($category === 'biaya_pengurusan_dokumen') {
            return $this->storeCoePayments($request, $detail, $user);
        }

        // Standard single payment logic (kept as fallback, currently unused since all are paired or blocked)
        $existingPayment = Payment::where('interview_detail_id', $detail->id)
            ->where('payment_category', $category)
            ->whereIn('status', ['pending', 'paid'])
            ->first();

        if ($existingPayment) {
            return back()->with('error', 'Tagihan untuk kategori ini sudah aktif atau sudah lunas.');
        }

        $originalAmount = Payment::CATEGORY_AMOUNTS[$category];
        $discount = $request->discount ?? 0;
        $additionalItems = $request->additional_items ?? [];
        $additionalSum = collect($additionalItems)->sum(fn($item) => (int)$item['amount']);
        $finalAmount = $originalAmount - $discount + $additionalSum;

        $catPrefix = Payment::CATEGORY_PREFIXES[$category];
        $studentNameSlug = strtoupper(Str::slug($user->name));
        $invoiceNumber = 'INV-' . $catPrefix . '-' . $detail->id . '-' . $studentNameSlug . '-' . time();

        try {
            $aulaaResponse = $this->aulaa->createPaymentLink($invoiceNumber, $finalAmount);
            $paymentUrl = 'https://payment.aulaa.co/pay/' . $aulaaResponse['id'];
            $expiredAt = isset($aulaaResponse['expired_at']) ? date('Y-m-d H:i:s', strtotime($aulaaResponse['expired_at'])) : null;

            $payment = Payment::create([
                'user_id' => $user->id,
                'interview_detail_id' => $detail->id,
                'invoice_number' => $invoiceNumber,
                'original_amount' => $originalAmount,
                'discount' => $discount,
                'amount' => $finalAmount,
                'payment_category' => $category,
                'status' => 'pending',
                'aulaa_payment_id' => $aulaaResponse['id'],
                'payment_url' => $paymentUrl,
                'expired_at' => $expiredAt,
                'description' => $request->description,
                'additional_items' => $additionalItems,
            ]);

            try {
                if ($user->email) {
                    Mail::to($user->email)->send(new \App\Mail\PaymentBillingMail($payment));
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
     * Create 2 Job payments simultaneously (Lulus Wawancara + Pendidikan Bahasa).
     */
    private function storeJobPayments(Request $request, InterviewDetail $detail, User $user)
    {
        $existingJob = Payment::where('interview_detail_id', $detail->id)
            ->whereIn('payment_category', Payment::JOB_PAIR_CATEGORIES)
            ->whereIn('status', ['pending', 'paid'])
            ->first();

        if ($existingJob) {
            return back()->with('error', 'Tagihan kelulusan wawancara/pendidikan bahasa untuk siswa ini sudah aktif atau sudah lunas.');
        }

        $studentNameSlug = strtoupper(Str::slug($user->name));
        $timestamp = time();

        // --- Payment 1: Biaya Lulus Wawancara ---
        $cat1 = 'biaya_lulus_wawancara';
        $originalAmount1 = Payment::CATEGORY_AMOUNTS[$cat1];
        $discount1 = $request->discount ?? 0;
        $additionalItems1 = $request->additional_items ?? [];
        $additionalSum1 = collect($additionalItems1)->sum(fn($item) => (int)$item['amount']);
        $finalAmount1 = $originalAmount1 - $discount1 + $additionalSum1;
        $invoiceNumber1 = 'INV-LAW-' . $detail->id . '-' . $studentNameSlug . '-' . $timestamp;

        // --- Payment 2: Biaya Pendidikan Bahasa Jepang ---
        $cat2 = 'biaya_pendidikan_bahasa';
        $originalAmount2 = Payment::CATEGORY_AMOUNTS[$cat2];
        $discount2 = $request->discount_2 ?? 0;
        $additionalItems2 = $request->additional_items_2 ?? [];
        $additionalSum2 = collect($additionalItems2)->sum(fn($item) => (int)$item['amount']);
        $finalAmount2 = $originalAmount2 - $discount2 + $additionalSum2;
        $invoiceNumber2 = 'INV-PEN-' . $detail->id . '-' . $studentNameSlug . '-' . $timestamp;

        try {
            $aulaaResponse1 = $this->aulaa->createPaymentLink($invoiceNumber1, $finalAmount1);
            $paymentUrl1 = 'https://payment.aulaa.co/pay/' . $aulaaResponse1['id'];
            $expiredAt1 = isset($aulaaResponse1['expired_at']) ? date('Y-m-d H:i:s', strtotime($aulaaResponse1['expired_at'])) : null;

            $aulaaResponse2 = $this->aulaa->createPaymentLink($invoiceNumber2, $finalAmount2);
            $paymentUrl2 = 'https://payment.aulaa.co/pay/' . $aulaaResponse2['id'];
            $expiredAt2 = isset($aulaaResponse2['expired_at']) ? date('Y-m-d H:i:s', strtotime($aulaaResponse2['expired_at'])) : null;

            $payment1 = Payment::create([
                'user_id' => $user->id,
                'interview_detail_id' => $detail->id,
                'invoice_number' => $invoiceNumber1,
                'original_amount' => $originalAmount1,
                'discount' => $discount1,
                'amount' => $finalAmount1,
                'payment_category' => $cat1,
                'status' => 'pending',
                'aulaa_payment_id' => $aulaaResponse1['id'],
                'payment_url' => $paymentUrl1,
                'expired_at' => $expiredAt1,
                'description' => $request->description,
                'additional_items' => $additionalItems1,
            ]);

            $payment2 = Payment::create([
                'user_id' => $user->id,
                'interview_detail_id' => $detail->id,
                'invoice_number' => $invoiceNumber2,
                'original_amount' => $originalAmount2,
                'discount' => $discount2,
                'amount' => $finalAmount2,
                'payment_category' => $cat2,
                'status' => 'pending',
                'aulaa_payment_id' => $aulaaResponse2['id'],
                'payment_url' => $paymentUrl2,
                'expired_at' => $expiredAt2,
                'description' => $request->description,
                'additional_items' => $additionalItems2,
            ]);

            try {
                if ($user->email) {
                    Mail::to($user->email)->send(new \App\Mail\PaymentJobBillingMail($payment1, $payment2));
                }
            } catch (\Exception $mailEx) {
                Log::error('Gagal mengirim email tagihan lulus job ke siswa: ' . $mailEx->getMessage());
            }

            return back()->with('success', 'Dua tagihan Kelulusan Job berhasil dibuat (Lulus Wawancara + Pendidikan Bahasa).');

        } catch (\Exception $e) {
            Log::error('Gagal membuat tagihan Lulus Job di Aulaa: ' . $e->getMessage());
            return back()->with('error', 'Gagal memproses tagihan Lulus Job ke Aulaa.co: ' . $e->getMessage());
        }
    }

    /**
     * Create 2 COE payments simultaneously (Pengurusan Dokumen + Administrasi COE).
     */
    private function storeCoePayments(Request $request, InterviewDetail $detail, User $user)
    {
        $existingCoe = Payment::where('interview_detail_id', $detail->id)
            ->whereIn('payment_category', Payment::COE_PAIR_CATEGORIES)
            ->whereIn('status', ['pending', 'paid'])
            ->first();

        if ($existingCoe) {
            return back()->with('error', 'Tagihan COE untuk siswa ini sudah aktif atau sudah lunas.');
        }

        $studentNameSlug = strtoupper(Str::slug($user->name));
        $timestamp = time();

        // --- Payment 1: Pengurusan Dokumen Indonesia - Jepang ---
        $cat1 = 'biaya_pengurusan_dokumen';
        $originalAmount1 = Payment::CATEGORY_AMOUNTS[$cat1];
        $discount1 = $request->discount ?? 0;
        $additionalItems1 = $request->additional_items ?? [];
        $additionalSum1 = collect($additionalItems1)->sum(fn($item) => (int)$item['amount']);
        $finalAmount1 = $originalAmount1 - $discount1 + $additionalSum1;
        $invoiceNumber1 = 'INV-DOC-' . $detail->id . '-' . $studentNameSlug . '-' . $timestamp;

        // --- Payment 2: Administrasi COE ---
        $cat2 = 'biaya_administrasi_coe';
        $originalAmount2 = Payment::CATEGORY_AMOUNTS[$cat2];
        $discount2 = $request->discount_2 ?? 0;
        $additionalItems2 = $request->additional_items_2 ?? [];
        $additionalSum2 = collect($additionalItems2)->sum(fn($item) => (int)$item['amount']);
        $finalAmount2 = $originalAmount2 - $discount2 + $additionalSum2;
        $invoiceNumber2 = 'INV-ADM-' . $detail->id . '-' . $studentNameSlug . '-' . $timestamp;

        try {
            // Create first Aulaa payment
            $aulaaResponse1 = $this->aulaa->createPaymentLink($invoiceNumber1, $finalAmount1);
            $paymentUrl1 = 'https://payment.aulaa.co/pay/' . $aulaaResponse1['id'];
            $expiredAt1 = isset($aulaaResponse1['expired_at']) ? date('Y-m-d H:i:s', strtotime($aulaaResponse1['expired_at'])) : null;

            // Create second Aulaa payment
            $aulaaResponse2 = $this->aulaa->createPaymentLink($invoiceNumber2, $finalAmount2);
            $paymentUrl2 = 'https://payment.aulaa.co/pay/' . $aulaaResponse2['id'];
            $expiredAt2 = isset($aulaaResponse2['expired_at']) ? date('Y-m-d H:i:s', strtotime($aulaaResponse2['expired_at'])) : null;

            // Save payment 1
            $payment1 = Payment::create([
                'user_id' => $user->id,
                'interview_detail_id' => $detail->id,
                'invoice_number' => $invoiceNumber1,
                'original_amount' => $originalAmount1,
                'discount' => $discount1,
                'amount' => $finalAmount1,
                'payment_category' => $cat1,
                'status' => 'pending',
                'aulaa_payment_id' => $aulaaResponse1['id'],
                'payment_url' => $paymentUrl1,
                'expired_at' => $expiredAt1,
                'description' => $request->description,
                'additional_items' => $additionalItems1,
            ]);

            // Save payment 2
            $payment2 = Payment::create([
                'user_id' => $user->id,
                'interview_detail_id' => $detail->id,
                'invoice_number' => $invoiceNumber2,
                'original_amount' => $originalAmount2,
                'discount' => $discount2,
                'amount' => $finalAmount2,
                'payment_category' => $cat2,
                'status' => 'pending',
                'aulaa_payment_id' => $aulaaResponse2['id'],
                'payment_url' => $paymentUrl2,
                'expired_at' => $expiredAt2,
                'description' => $request->description,
                'additional_items' => $additionalItems2,
            ]);

            // Kirim 1 email berisi 2 tagihan
            try {
                if ($user->email) {
                    Mail::to($user->email)->send(new \App\Mail\PaymentCoeBillingMail($payment1, $payment2));
                }
            } catch (\Exception $mailEx) {
                Log::error('Gagal mengirim email tagihan COE ke siswa: ' . $mailEx->getMessage());
            }

            return back()->with('success', 'Dua tagihan COE berhasil dibuat (Pengurusan Dokumen + Administrasi COE).');

        } catch (\Exception $e) {
            Log::error('Gagal membuat tagihan COE di Aulaa: ' . $e->getMessage());
            return back()->with('error', 'Gagal memproses tagihan COE ke Aulaa.co: ' . $e->getMessage());
        }
    }

    /**
     * Mark a billing payment as paid manually.
     * For COE and Job split, marks both invoices as paid at once.
     */
    public function markAsPaid(Request $request)
    {
        $request->validate([
            'interview_detail_id' => 'required|exists:interview_details,id',
            'payment_category' => 'required|in:' . implode(',', Payment::ALL_CATEGORIES),
            'discount' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'additional_items' => 'nullable|array',
            'additional_items.*.name' => 'required_with:additional_items|string',
            'additional_items.*.amount' => 'required_with:additional_items|integer|min:0',
            // Dual-specific
            'discount_2' => 'nullable|integer|min:0',
            'additional_items_2' => 'nullable|array',
            'additional_items_2.*.name' => 'required_with:additional_items_2|string',
            'additional_items_2.*.amount' => 'required_with:additional_items_2|integer|min:0',
        ]);

        $detail = InterviewDetail::findOrFail($request->interview_detail_id);
        $user = $detail->user;

        if (!$user) {
            return back()->with('error', 'Siswa tidak ditemukan.');
        }

        $category = $request->payment_category;

        // Backend Validation: Subtotal cannot exceed 9,500,000 per link
        try {
            $this->validateAmountsLimit($request, $category);
        } catch (\Exception $ex) {
            return back()->with('error', $ex->getMessage());
        }

        // --- JOB: Mark both as paid ---
        if ($category === 'biaya_lulus_wawancara') {
            return $this->markJobPaid($request, $detail, $user);
        }

        // --- COE: Mark both as paid ---
        if ($category === 'biaya_pengurusan_dokumen') {
            return $this->markCoePaid($request, $detail, $user);
        }

        // Standard single payment (kept as fallback, currently unused since all are paired or blocked)
        $paidPayment = Payment::where('interview_detail_id', $detail->id)
            ->where('payment_category', $category)
            ->where('status', 'paid')
            ->first();

        if ($paidPayment) {
            return back()->with('error', 'Pembayaran untuk kategori ini sudah lunas.');
        }

        $originalAmount = Payment::CATEGORY_AMOUNTS[$category];
        $discount = $request->discount ?? 0;
        $additionalItems = $request->additional_items ?? [];
        $additionalSum = collect($additionalItems)->sum(fn($item) => (int)$item['amount']);
        $finalAmount = $originalAmount - $discount + $additionalSum;

        $payment = Payment::where('interview_detail_id', $detail->id)
            ->where('payment_category', $category)
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
            $catPrefix = Payment::CATEGORY_PREFIXES[$category];
            $studentNameSlug = strtoupper(Str::slug($user->name));
            $invoiceNumber = 'INV-' . $catPrefix . '-MAN-' . $detail->id . '-' . $studentNameSlug . '-' . time();

            Payment::create([
                'user_id' => $user->id,
                'interview_detail_id' => $detail->id,
                'invoice_number' => $invoiceNumber,
                'original_amount' => $originalAmount,
                'discount' => $discount,
                'amount' => $finalAmount,
                'payment_category' => $category,
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
     * Mark both Job payments as paid manually.
     */
    private function markJobPaid(Request $request, InterviewDetail $detail, User $user)
    {
        $paidCount = Payment::where('interview_detail_id', $detail->id)
            ->whereIn('payment_category', Payment::JOB_PAIR_CATEGORIES)
            ->where('status', 'paid')
            ->count();

        if ($paidCount >= 2) {
            return back()->with('error', 'Kedua tagihan Kelulusan Job sudah lunas.');
        }

        $studentNameSlug = strtoupper(Str::slug($user->name));
        $timestamp = time();

        foreach (Payment::JOB_PAIR_CATEGORIES as $index => $cat) {
            $originalAmount = Payment::CATEGORY_AMOUNTS[$cat];
            $discount = $index === 0 ? ($request->discount ?? 0) : ($request->discount_2 ?? 0);
            $additionalItems = $index === 0 ? ($request->additional_items ?? []) : ($request->additional_items_2 ?? []);
            $additionalSum = collect($additionalItems)->sum(fn($item) => (int)$item['amount']);
            $finalAmount = $originalAmount - $discount + $additionalSum;

            $existing = Payment::where('interview_detail_id', $detail->id)
                ->where('payment_category', $cat)
                ->where('status', 'pending')
                ->first();

            if ($existing) {
                $existing->update([
                    'status' => 'paid',
                    'payment_method' => 'manual',
                    'payment_date' => now(),
                    'discount' => $discount,
                    'amount' => $finalAmount,
                    'description' => $request->description,
                    'additional_items' => $additionalItems,
                ]);
            } else {
                $alreadyPaid = Payment::where('interview_detail_id', $detail->id)
                    ->where('payment_category', $cat)
                    ->where('status', 'paid')
                    ->exists();

                if (!$alreadyPaid) {
                    $catPrefix = Payment::CATEGORY_PREFIXES[$cat];
                    $invoiceNumber = 'INV-' . $catPrefix . '-MAN-' . $detail->id . '-' . $studentNameSlug . '-' . $timestamp;

                    Payment::create([
                        'user_id' => $user->id,
                        'interview_detail_id' => $detail->id,
                        'invoice_number' => $invoiceNumber,
                        'original_amount' => $originalAmount,
                        'discount' => $discount,
                        'amount' => $finalAmount,
                        'payment_category' => $cat,
                        'status' => 'paid',
                        'payment_method' => 'manual',
                        'payment_date' => now(),
                        'description' => $request->description,
                        'additional_items' => $additionalItems,
                    ]);
                }
            }
        }

        return back()->with('success', 'Kedua tagihan Kelulusan Job berhasil ditandai sebagai LUNAS secara manual.');
    }

    /**
     * Mark both COE payments as paid manually.
     */
    private function markCoePaid(Request $request, InterviewDetail $detail, User $user)
    {
        $paidCount = Payment::where('interview_detail_id', $detail->id)
            ->whereIn('payment_category', Payment::COE_PAIR_CATEGORIES)
            ->where('status', 'paid')
            ->count();

        if ($paidCount >= 2) {
            return back()->with('error', 'Kedua tagihan COE sudah lunas.');
        }

        $studentNameSlug = strtoupper(Str::slug($user->name));
        $timestamp = time();

        foreach (Payment::COE_PAIR_CATEGORIES as $index => $cat) {
            $originalAmount = Payment::CATEGORY_AMOUNTS[$cat];
            $discount = $index === 0 ? ($request->discount ?? 0) : ($request->discount_2 ?? 0);
            $additionalItems = $index === 0 ? ($request->additional_items ?? []) : ($request->additional_items_2 ?? []);
            $additionalSum = collect($additionalItems)->sum(fn($item) => (int)$item['amount']);
            $finalAmount = $originalAmount - $discount + $additionalSum;

            $existing = Payment::where('interview_detail_id', $detail->id)
                ->where('payment_category', $cat)
                ->where('status', 'pending')
                ->first();

            if ($existing) {
                $existing->update([
                    'status' => 'paid',
                    'payment_method' => 'manual',
                    'payment_date' => now(),
                    'discount' => $discount,
                    'amount' => $finalAmount,
                    'description' => $request->description,
                    'additional_items' => $additionalItems,
                ]);
            } else {
                $alreadyPaid = Payment::where('interview_detail_id', $detail->id)
                    ->where('payment_category', $cat)
                    ->where('status', 'paid')
                    ->exists();

                if (!$alreadyPaid) {
                    $catPrefix = Payment::CATEGORY_PREFIXES[$cat];
                    $invoiceNumber = 'INV-' . $catPrefix . '-MAN-' . $detail->id . '-' . $studentNameSlug . '-' . $timestamp;

                    Payment::create([
                        'user_id' => $user->id,
                        'interview_detail_id' => $detail->id,
                        'invoice_number' => $invoiceNumber,
                        'original_amount' => $originalAmount,
                        'discount' => $discount,
                        'amount' => $finalAmount,
                        'payment_category' => $cat,
                        'status' => 'paid',
                        'payment_method' => 'manual',
                        'payment_date' => now(),
                        'description' => $request->description,
                        'additional_items' => $additionalItems,
                    ]);
                }
            }
        }

        return back()->with('success', 'Kedua tagihan COE berhasil ditandai sebagai LUNAS secara manual.');
    }

    /**
     * Helper to validate that no payment amount exceeds Rp9.500.000
     */
    private function validateAmountsLimit(Request $request, string $category)
    {
        $limit = 9500000;

        if ($category === 'biaya_lulus_wawancara' || $category === 'biaya_pengurusan_dokumen') {
            // Check first payment in pair
            $originalAmount1 = Payment::CATEGORY_AMOUNTS[$category];
            $discount1 = (int)($request->discount ?? 0);
            $additionalItems1 = $request->additional_items ?? [];
            $additionalSum1 = collect($additionalItems1)->sum(fn($item) => (int)($item['amount'] ?? 0));
            $finalAmount1 = $originalAmount1 - $discount1 + $additionalSum1;

            $partnerCat = $category === 'biaya_lulus_wawancara' ? 'biaya_pendidikan_bahasa' : 'biaya_administrasi_coe';
            $originalAmount2 = Payment::CATEGORY_AMOUNTS[$partnerCat];
            $discount2 = (int)($request->discount_2 ?? 0);
            $additionalItems2 = $request->additional_items_2 ?? [];
            $additionalSum2 = collect($additionalItems2)->sum(fn($item) => (int)($item['amount'] ?? 0));
            $finalAmount2 = $originalAmount2 - $discount2 + $additionalSum2;

            if ($finalAmount1 > $limit) {
                throw new \Exception("Total tagihan pertama (" . Payment::CATEGORY_LABELS[$category] . ") melebihi batas Rp" . number_format($limit, 0, ',', '.'));
            }

            if ($finalAmount2 > $limit) {
                throw new \Exception("Total tagihan kedua (" . Payment::CATEGORY_LABELS[$partnerCat] . ") melebihi batas Rp" . number_format($limit, 0, ',', '.'));
            }
        } else {
            // Check single payment
            $originalAmount = Payment::CATEGORY_AMOUNTS[$category] ?? 0;
            $discount = (int)($request->discount ?? 0);
            $additionalItems = $request->additional_items ?? [];
            $additionalSum = collect($additionalItems)->sum(fn($item) => (int)($item['amount'] ?? 0));
            $finalAmount = $originalAmount - $discount + $additionalSum;

            if ($finalAmount > $limit) {
                throw new \Exception("Total tagihan melebihi batas Rp" . number_format($limit, 0, ',', '.'));
            }
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

            if (isset($aulaaData['expired_at'])) {
                $payment->expired_at = date('Y-m-d H:i:s', strtotime($aulaaData['expired_at']));
            }

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
