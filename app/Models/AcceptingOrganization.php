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
    ];

    /**
     * Relasi ke Interview
     */
    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class);
    }
}