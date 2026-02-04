<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassroomAttendance extends Model
{
    protected $fillable = ['classroom_id', 'student_profile_id', 'date', 'status', 'note'];

    public function student() {
        return $this->belongsTo(StudentProfile::class);
    }
}