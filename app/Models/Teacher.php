<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', // <--- Pastikan ini ada
        'name',
        'nip',
        'type',
        'phone_number',
        'is_active'
    ];

    // Biar otomatis muncul saat dikirim sebagai JSON/Inertia Props
    protected $appends = ['type_label'];

    // Label cantik untuk UI
    public function getTypeLabelAttribute()
    {
        return [
            'bahasa_jepang' => 'Sensei Bahasa Jepang',
            'kaigo'         => 'Sensei Kaigo',
            'kensetsu'      => 'Sensei Kensetsu',
            'budaya'        => 'Sensei Budaya',
        ][$this->type] ?? $this->type;
    }

    /**
     * Relasi ke Kelas (nanti jika model Classroom sudah dibuat)
     */
    public function classrooms()
    {
        return $this->hasMany(Classroom::class);
    }
}