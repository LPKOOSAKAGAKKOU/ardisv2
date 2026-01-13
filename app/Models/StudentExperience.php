<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentExperience extends Model
{
    protected $fillable = [
        'student_profile_id', 'company_name', 
        'job_type', 'start_date', 'end_date'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function profile()
    {
        return $this->belongsTo(StudentProfile::class);
    }
}