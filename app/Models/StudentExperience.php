<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentExperience extends Model
{
    protected $fillable = [
        'student_profile_id', 'company_name', 
        'job_type', 'monthly_salary', 'start_date', 'end_date'
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'monthly_salary' => 'integer',
    ];

    public function profile()
    {
        return $this->belongsTo(StudentProfile::class);
    }
}