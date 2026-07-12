<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    /**
     * Default amounts per payment category.
     */
    const CATEGORY_AMOUNTS = [
        'biaya_lulus_wawancara' => 7500000,
        'biaya_pendidikan_bahasa' => 7500000,
        'biaya_pengurusan_dokumen' => 7500000,
        'biaya_administrasi_coe' => 7500000,
    ];

    /**
     * Human-readable labels per payment category.
     */
    const CATEGORY_LABELS = [
        'biaya_lulus_wawancara' => 'Biaya Lulus Wawancara',
        'biaya_pendidikan_bahasa' => 'Biaya Pendidikan Bahasa Jepang Setelah Wawancara',
        'biaya_pengurusan_dokumen' => 'Pengurusan Dokumen Indonesia - Jepang',
        'biaya_administrasi_coe' => 'Administrasi COE',
    ];

    /**
     * Invoice number prefix per payment category.
     */
    const CATEGORY_PREFIXES = [
        'biaya_lulus_wawancara' => 'LAW',
        'biaya_pendidikan_bahasa' => 'PEN',
        'biaya_pengurusan_dokumen' => 'DOC',
        'biaya_administrasi_coe' => 'ADM',
    ];

    /**
     * The two Job sub-categories that are always created as a pair.
     */
    const JOB_PAIR_CATEGORIES = ['biaya_lulus_wawancara', 'biaya_pendidikan_bahasa'];

    /**
     * The two COE sub-categories that are always created as a pair.
     */
    const COE_PAIR_CATEGORIES = ['biaya_pengurusan_dokumen', 'biaya_administrasi_coe'];

    /**
     * All valid payment categories.
     */
    const ALL_CATEGORIES = [
        'biaya_lulus_wawancara',
        'biaya_pendidikan_bahasa',
        'biaya_pengurusan_dokumen',
        'biaya_administrasi_coe'
    ];

    protected $fillable = [
        'user_id',
        'interview_detail_id',
        'invoice_number',
        'amount',
        'payment_category',
        'payment_date',
        'payment_method',
        'proof_file',
        'description',
        'status',
        'aulaa_payment_id',
        'payment_url',
        'expired_at',
        'discount',
        'original_amount',
        'additional_items',
    ];

    protected $casts = [
        'payment_date' => 'date:Y-m-d',
        'expired_at' => 'datetime',
        'amount' => 'integer',
        'discount' => 'integer',
        'original_amount' => 'integer',
        'additional_items' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function interviewDetail(): BelongsTo
    {
        return $this->belongsTo(InterviewDetail::class);
    }
}
