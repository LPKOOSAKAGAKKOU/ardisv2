<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassroomGrade extends Model
{
    protected $fillable = ['classroom_id', 'student_profile_id', 'type', 'title', 'score', 'feedback'];

    public function student() {
        return $this->belongsTo(StudentProfile::class);
    }
}