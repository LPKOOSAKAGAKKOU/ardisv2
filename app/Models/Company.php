<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'name',
        'name_in_japanese',
        'industry',
        'address',
        'address_in_japanese',
        'prefecture',
        'contact_person',
        'phone',
        'email',
        'website',
    ];

    /**
     * Relasi ke Interview.
     * Satu perusahaan bisa memiliki banyak jadwal wawancara.
     */
    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class);
    }
}