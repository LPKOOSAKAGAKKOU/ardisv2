<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\StudentProfile;

class Recruitment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'date',
        'type', // 'regular' atau 'job_matching'
        'is_active'
    ];

    /**
     * Biar otomatis muncul saat dikirim ke Inertia Frontend
     */
    protected $appends = ['type_label'];

    /**
     * Relasi ke Siswa
     * Satu Rekrutmen memiliki banyak Siswa (HasMany)
     */
    public function students()
    {
        return $this->hasMany(StudentProfile::class, 'recruitments_id');
    }

    /**
     * Accessor untuk Label Tipe yang lebih rapi di UI
     */
    public function getTypeLabelAttribute()
    {
        return [
            'regular'      => 'Reguler',
            'job_matching' => 'Job Matching',
        ][$this->type] ?? $this->type;
    }
}