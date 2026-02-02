<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingCurriculumCache extends Model
{
    // Nama tabel kalau lo gak pakai jamak (optional)
    protected $table = 'training_curriculum_caches';

    // Kolom yang boleh diisi
    protected $fillable = [
        'label_hash',
        'days',
        'hours',
        'content',
    ];

    // Otomatis ubah JSON di DB jadi Array PHP
    protected $casts = [
        'content' => 'array',
    ];
}