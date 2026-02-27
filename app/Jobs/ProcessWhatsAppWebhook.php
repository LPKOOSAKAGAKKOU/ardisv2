<?php

namespace App\Jobs;

use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\StudentProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessWhatsAppWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $data;

    // Otomatis coba lagi hingga 3 kali jika terjadi error database
    public $tries = 3;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function handle()
    {
        $payload = $this->data['payload'] ?? [];
        $isFromMe = $payload['is_from_me'] ?? false;
        
        $fromJid = $payload['from'] ?? '';
        $chatIdJid = $payload['chat_id'] ?? '';
        $rawTargetJid = $isFromMe ? $chatIdJid : $fromJid;
        
        $studentPhone = $this->extractPhoneNumber($rawTargetJid);
        $formattedStudentPhone = $this->formatPhoneNumber($studentPhone);

        $student = StudentProfile::where(function($query) use ($formattedStudentPhone) {
            $query->whereRaw("REGEXP_REPLACE(phone_student, '[^0-9]', '') LIKE ?", ["%{$formattedStudentPhone}%"])
                  ->orWhereRaw("CONCAT('62', SUBSTRING(REGEXP_REPLACE(phone_student, '[^0-9]', ''), 2)) = ?", [$formattedStudentPhone]);
        })->first();
        
        if (!$student) {
            Log::info("WhatsApp Webhook (Job): Nomor tidak terdaftar.", ['nomor' => $formattedStudentPhone]);
            return; // Hentikan job jika siswa tidak ada
        }

        $pushName = $student->full_name ?? $payload['from_name'] ?? 'Unknown';
        $messageText = $payload['body'] ?? ($payload['caption'] ?? '');
        $waMsgId = $payload['id'] ?? null;
        
        $msgTimestamp = isset($payload['timestamp']) 
            ? date('Y-m-d H:i:s', strtotime($payload['timestamp'])) 
            : now();

        if (empty($messageText)) {
            $messageText = '[File/Media]';
        }

        $senderType = $isFromMe ? 'admin' : 'student';

        DB::transaction(function () use ($formattedStudentPhone, $student, $pushName, $messageText, $waMsgId, $msgTimestamp, $senderType, $isFromMe) {
            
            $chat = Chat::updateOrCreate(
                ['phone_number' => $formattedStudentPhone],
                [
                    'student_profile_id' => $student->id,
                    'incoming_name' => $pushName,
                    'last_message' => $messageText,
                    'last_message_at' => $msgTimestamp,
                ]
            );

            if (!$isFromMe) {
                $chat->increment('unread_count');
            }

            ChatMessage::firstOrCreate(
                ['wa_message_id' => $waMsgId], 
                [
                    'chat_id'       => $chat->id,
                    'sender_type'   => $senderType,
                    'message_body'  => $messageText,
                    'message_type'  => 'chat',
                    'read_at'       => $isFromMe ? now() : null,
                    'created_at'    => $msgTimestamp,
                ]
            );
        });
    }

    private function extractPhoneNumber($jid)
    {
        if (is_array($jid)) { $jid = $jid['String'] ?? ''; }
        $parts = explode('@', $jid);
        return $parts[0] ?? '';
    }

    private function formatPhoneNumber($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }
        return $phone;
    }
}