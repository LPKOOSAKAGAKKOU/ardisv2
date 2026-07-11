<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InterviewDetail extends Model
{
    protected $fillable = [
        'interview_id',
        'user_id',
        'order_number',
        'result',
        'remarks',
    ];

    /**
     * Relasi kembali ke data utama Interview
     */
    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }

    /**
     * Relasi ke User (Siswa)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke data Pembayaran terkait interview ini
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Helper untuk mengecek apakah siswa lulus
     */
    public function isPassed(): bool
    {
        return $this->result === 'passed';
    }
}