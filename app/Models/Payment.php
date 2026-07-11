<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'user_id',
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
        'discount',
        'original_amount',
    ];

    protected $casts = [
        'payment_date' => 'date:Y-m-d',
        'amount' => 'integer',
        'discount' => 'integer',
        'original_amount' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
