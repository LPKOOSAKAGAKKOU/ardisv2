<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentReturn extends Model
{
    protected $fillable = [
        'departure_id',
        'user_id',
        'return_date',
        'reason',
        'notes',
    ];

    protected $casts = [
        'return_date' => 'date',
    ];

    public function departure(): BelongsTo
    {
        return $this->belongsTo(Departure::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reasonLabel(): string
    {
        return match ($this->reason) {
            'working_indonesia' => 'Bekerja di Indonesia',
            'wirausaha'         => 'Wirausaha',
            'education'         => 'Lanjut Pendidikan',
            'ssw'               => 'SSW',
            'finished'          => 'Selesai Kontrak',
            'early_return'      => 'Pulang Awal / Resign',
            default             => $this->reason ?: 'Selesai Kontrak',
        };
    }
}
