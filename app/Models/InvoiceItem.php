<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'departure_id',
        'kind',
        'company_name',
        'description',
        'students',
        'people',
        'months',
        'unit_price',
        'amount',
    ];

    protected $casts = [
        'students'   => 'array',
        'people'     => 'integer',
        'months'     => 'integer',
        'unit_price' => 'integer',
        'amount'     => 'integer',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function departure(): BelongsTo
    {
        return $this->belongsTo(Departure::class);
    }
}
