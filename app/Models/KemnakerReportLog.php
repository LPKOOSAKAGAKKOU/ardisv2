<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KemnakerReportLog extends Model
{
    protected $fillable = [
        'year',
        'month',
        'departure_count',
        'return_count',
        'responsible_wa',
        'departure_file_path',
        'return_file_path',
        'status',
        'response_message',
        'user_id',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'departure_count' => 'integer',
        'return_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
