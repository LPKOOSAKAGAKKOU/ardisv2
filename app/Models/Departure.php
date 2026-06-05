<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Departure extends Model
{
    protected $fillable = [
        'accepting_organization_id',
        'company_id',
        'interview_id',
        'company_name',
        'departure_date',
        'people_count',
        'travel_cost',
        'pre_education_fee',
        'management_fee',
        'notes',
        'status',
    ];

    protected $casts = [
        'departure_date'    => 'date',
        'people_count'      => 'integer',
        'travel_cost'       => 'integer',
        'pre_education_fee' => 'integer',
        'management_fee'    => 'integer',
    ];

    public function acceptingOrganization(): BelongsTo
    {
        return $this->belongsTo(AcceptingOrganization::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }

    /**
     * Tarif efektif: override per keberangkatan, jika null pakai default organisasi penerima.
     */
    public function effectiveManagementFee(): int
    {
        return $this->management_fee ?? (int) ($this->acceptingOrganization->management_fee ?? 0);
    }

    public function effectivePreEducationFee(): int
    {
        return $this->pre_education_fee ?? (int) ($this->acceptingOrganization->pre_education_fee ?? 0);
    }
}
