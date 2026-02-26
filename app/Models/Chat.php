<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $fillable = [
        'student_profile_id', 
        'phone_number', 
        'incoming_name', 
        'last_message', 
        'last_message_at', 
        'unread_count'
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(StudentProfile::class, 'student_profile_id');
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class);
    }
}