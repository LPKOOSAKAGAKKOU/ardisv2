<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentEducation extends Model
{
    protected $fillable = [
        'student_profile_id', 'level', 'school_name', 
        'school_type', 'major', 'entry_date', 'graduation_date'
    ];

    protected $casts = [
        'entry_date' => 'date',
        'graduation_date' => 'date',
    ];

    public function profile()
    {
        return $this->belongsTo(StudentProfile::class);
    }
}