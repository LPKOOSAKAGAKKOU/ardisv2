<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentFamily extends Model
{
    protected $fillable = [
        'student_profile_id', 'relationship', 
        'name', 'age', 'occupation'
    ];

    // ✅ SUDAH BENAR - age sebagai integer
    protected $casts = [
        'age' => 'integer',
    ];

    public function profile()
    {
        return $this->belongsTo(StudentProfile::class);
    }
}