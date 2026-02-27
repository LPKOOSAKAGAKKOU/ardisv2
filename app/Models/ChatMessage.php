<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $fillable = [
        'chat_id', 
        'wa_message_id', 
        'sender_type', 
        'message_body', 
        'message_type', 
        'read_at',
        'media_url',
        'file_name',
        'mime_type',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }
}