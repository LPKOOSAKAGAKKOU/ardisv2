<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartureBilling extends Model
{
    protected $fillable = [
        'departure_id',
        'kind',
        'description',
        'due_date',
        'people',
        'unit_price',
        'amount',
        'bill_to',
    ];

    protected $casts = [
        'due_date'   => 'date',
        'people'     => 'integer',
        'unit_price' => 'integer',
        'amount'     => 'integer',
    ];

    public function departure(): BelongsTo
    {
        return $this->belongsTo(Departure::class);
    }
}
