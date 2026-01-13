<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentFamily extends Model
{
    protected $fillable = [
        'student_profile_id', 'relationship', 
        'name', 'age', 'occupation'
    ];

    // Untuk 'age' bisa di-cast ke integer jika ingin memastikan tipenya
    protected $casts = [
        'age' => 'integer',
    ];

    public function profile()
    {
        return $this->belongsTo(StudentProfile::class);
    }
}