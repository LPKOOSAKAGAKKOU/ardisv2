<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
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
