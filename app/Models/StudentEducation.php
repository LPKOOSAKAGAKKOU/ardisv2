<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentEducation extends Model
{
    protected $table = 'student_educations';

    protected $fillable = [
        'student_profile_id', 'level', 'school_name', 
        'school_type', 'major', 'entry_date', 'graduation_date'
    ];

    protected $casts = [
        'entry_date' => 'date:Y-m-d',
        'graduation_date' => 'date:Y-m-d',
    ];

    public function profile()
    {
        return $this->belongsTo(StudentProfile::class);
    }
}