<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassroomLog extends Model
{
    // Mass assignment protection
    protected $fillable = [
        'classroom_id',
        'user_id',
        'action',
        'description'
    ];

    // Opsional: Relasi ke Classroom
    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    // Opsional: Relasi ke User (Sensei/Admin)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}