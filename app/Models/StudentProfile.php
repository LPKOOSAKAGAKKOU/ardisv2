<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    // Menggunakan guarded kosong agar semua kolom yang Anda list tadi bisa masuk sekaligus
    protected $guarded = []; 
    protected $appends = ['qr_code_value'];

    /**
     * Casting atribut agar otomatis menjadi tipe data yang sesuai.
     * Sangat penting untuk tanggal (dob, entry_date_lpk) agar bisa dimanipulasi Carbon.
     */
    protected $casts = [
        'dob' => 'date:Y-m-d',
        'entry_date_lpk' => 'date:Y-m-d',
        'passport_issue_date' => 'date:Y-m-d',  // Tambahkan juga
        'passport_expiry_date' => 'date:Y-m-d', // Tambahkan juga
        'height' => 'integer',
        'weight' => 'integer',
    ];

    // --- Relasi Utama ---

    public function user() 
    {
        return $this->belongsTo(User::class);
    }

    // --- Relasi Riwayat (One to Many) ---

    public function educations() 
    {
        return $this->hasMany(StudentEducation::class);
    }

    public function experiences() 
    {
        return $this->hasMany(StudentExperience::class);
    }

    public function families() 
    {
        return $this->hasMany(StudentFamily::class);
    }

    public function myApplications()
    {
        // Karena di interview_details pakainya user_id, hubungkan ke User
        return $this->user->hasMany(InterviewDetail::class);
    }

    // ... di dalam class StudentProfile
    public function classrooms() {
        return $this->belongsToMany(Classroom::class, 'classroom_students')
                    ->withPivot(['status', 'joined_at', 'left_at'])
                    ->orderBy('pivot_joined_at', 'desc'); // Urutkan dari yang terbaru
    }

    // Cek apakah siswa sedang punya kelas aktif (untuk validasi)
    public function hasActiveClass() {
        return $this->classrooms()
                    ->wherePivot('status', 'active')
                    ->where('classrooms.status', 'active')
                    ->exists();
    }

    // Relasi ke Nilai
    public function grades() {
        return $this->hasMany(ClassroomGrade::class);
    }

    // Relasi ke Absensi
    public function attendances() {
        return $this->hasMany(ClassroomAttendance::class);
    }

    public function getQrCodeValueAttribute()
    {
        // Kita gunakan hash_hmac dengan SHA256
        // Key-nya menggunakan APP_KEY dari .env agar aman dan unik per aplikasi
        return hash_hmac('sha256', $this->nik, config('app.key'));
    }

    // Di dalam class StudentProfile
    public function recruitment()
    {
        return $this->belongsTo(Recruitment::class, 'recruitments_id');
    }

    public function chat()
    {
        // Relasi ke model Chat menggunakan foreign key student_profile_id
        return $this->hasOne(Chat::class, 'student_profile_id');
    }
}