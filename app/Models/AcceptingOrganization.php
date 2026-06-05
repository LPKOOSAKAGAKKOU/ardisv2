<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcceptingOrganization extends Model
{ 
    protected $fillable = [
        'name',
        'name_in_japanese',
        'type',
        'address',
        'address_in_japanese',
        'phone',
        'email',
        'pic_name',
        'pre_education_fee',
        'management_fee',
        'training_center_name',
        'training_center_address',
        'training_center_phone',
        'training_center_area',
        'training_center_capacity',
        'training_center_type',
        'allowance_in_first_month',
        'allowance_amount',
        'meal_allowance',
        'meal_allowance_amount',
        'student_pays_meal',
        'student_pays_meal_amount',
        'accommodation_allowance',
        'accommodation_allowance_amount',
        'student_pays_accommodation',
        'student_pays_accommodation_amount',
    ];

    protected $casts = [
        'allowance_in_first_month'    => 'boolean',
        'meal_allowance'              => 'boolean',
        'student_pays_meal'           => 'boolean',
        'accommodation_allowance'     => 'boolean',
        'student_pays_accommodation'  => 'boolean',
        'pre_education_fee'           => 'integer',
        'management_fee'              => 'integer',
    ];

    /**
     * Relasi ke Interview
     */
    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class);
    }

    /**
     * Relasi ke Keberangkatan
     */
    public function departures(): HasMany
    {
        return $this->hasMany(Departure::class);
    }

    /**
     * Relasi ke Invoice / Penagihan
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}