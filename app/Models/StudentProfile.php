<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    // Menggunakan guarded kosong agar semua kolom yang Anda list tadi bisa masuk sekaligus
    protected $guarded = []; 

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
}