<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    protected $fillable = ['teacher_id', 'name', 'level', 'status', 'start_date', 'end_date'];

    public function teacher() {
        return $this->belongsTo(Teacher::class);
    }

    // Relasi ke Siswa (Current & History)
    public function students() {
        return $this->belongsToMany(StudentProfile::class, 'classroom_students')
                    ->withPivot(['status', 'joined_at', 'left_at', 'notes'])
                    ->withTimestamps();
    }
    
    // Helper: Ambil siswa yang MASIH AKTIF di kelas ini saja
    public function activeStudents() {
        return $this->students()->wherePivot('status', 'active');
    }

    // Relasi ke Nilai
    public function grades() {
        return $this->hasMany(ClassroomGrade::class);
    }

    // Relasi ke Absensi
    public function attendances() {
        return $this->hasMany(ClassroomAttendance::class);
    }
}