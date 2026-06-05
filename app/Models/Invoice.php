<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'accepting_organization_id',
        'invoice_number',
        'issue_date',
        'period_from',
        'period_to',
        'total_amount',
        'status',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'issue_date'   => 'date',
        'period_from'  => 'date',
        'period_to'    => 'date',
        'paid_at'      => 'date',
        'total_amount' => 'integer',
    ];

    public function acceptingOrganization(): BelongsTo
    {
        return $this->belongsTo(AcceptingOrganization::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
