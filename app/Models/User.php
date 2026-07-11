<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // <--- TAMBAHKAN INI
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
    
    public function student_profile() { // Menggunakan underscore
        return $this->hasOne(StudentProfile::class);
    }

    /**
     * Relasi: Satu User (Role Sensei) memiliki Satu Data Teacher
     */
    public function teacher(): HasOne
    {
        return $this->hasOne(Teacher::class);
    }
    // app/Models/User.php
    
    public function hasManyInterviewDetails()
    {
        return $this->hasMany(InterviewDetail::class, 'user_id');
    }
    // Tambahkan di dalam class User jika ingin akses langsung
    public function chat()
    {
        return $this->hasOneThrough(
            Chat::class, 
            StudentProfile::class, 
            'user_id',            // Foreign key di student_profiles
            'student_profile_id', // Foreign key di chats
            'id',                 // Local key di users
            'id'                  // Local key di student_profiles
        );
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
