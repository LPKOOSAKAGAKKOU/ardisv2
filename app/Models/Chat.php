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
        'unread_count',
        'is_group',
        'group_id',
        
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'is_group'        => 'boolean',
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