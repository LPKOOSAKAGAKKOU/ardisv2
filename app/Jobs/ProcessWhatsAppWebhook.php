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
            Log::info("WhatsApp Webhook: Nomor tidak terdaftar.", ['nomor' => $formattedStudentPhone]);
            return; 
        }

        $pushName = $student->full_name ?? $payload['from_name'] ?? 'Unknown';
        $waMsgId = $payload['id'] ?? null;
        $msgTimestamp = isset($payload['timestamp']) ? date('Y-m-d H:i:s', strtotime($payload['timestamp'])) : now();
        $senderType = $isFromMe ? 'admin' : 'student';

        // --- FIX LOGIKA IDENTIFIKASI MEDIA ---
        $baseUrl = rtrim(config('services.waha.url'), '/');
        $mediaUrl = null;
        $messageType = 'chat'; // Default awal
        $mimeType = null;
        $fileName = null;

        // 1. Deteksi Image
        if (!empty($payload['image'])) {
            $messageType = 'image';
            $mediaUrl = $baseUrl . '/' . ltrim($payload['image'], '/');
            $mimeType = 'image/jpeg';
        } 
        // 2. Deteksi Video
        elseif (!empty($payload['video'])) {
            $messageType = 'video';
            $mediaUrl = $baseUrl . '/' . ltrim($payload['video'], '/');
            $mimeType = 'video/mp4';
        } 
        // 3. Deteksi Document
        elseif (!empty($payload['document'])) {
            $messageType = 'document';
            $mediaUrl = $baseUrl . '/' . ltrim($payload['document'], '/');
            $mimeType = $payload['mime_type'] ?? 'application/octet-stream';
            $fileName = $payload['filename'] ?? 'document.pdf';
        }
        // 4. Deteksi Audio
        elseif (!empty($payload['audio'])) {
            $messageType = 'audio';
            $mediaUrl = $baseUrl . '/' . ltrim($payload['audio'], '/');
            $mimeType = 'audio/ogg';
        }

        // Lokasi
        $latitude = $payload['location']['latitude'] ?? null;
        $longitude = $payload['location']['longitude'] ?? null;
        if ($latitude && $longitude) {
            $messageType = 'location';
        }

        // Ambil isi teks (caption)
        $messageText = $payload['body'] ?? ($payload['caption'] ?? '');

        // Fallback jika media tidak punya caption agar sidebar tidak kosong
        if (empty($messageText)) {
            if ($messageType !== 'chat') {
                $messageText = "[" . strtoupper($messageType) . "]";
            }
        }

        // --- SIMPAN KE DATABASE ---
        DB::transaction(function () use ($formattedStudentPhone, $student, $pushName, $messageText, $waMsgId, $msgTimestamp, $senderType, $isFromMe, $messageType, $mediaUrl, $fileName, $mimeType, $latitude, $longitude) {
            
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

            // MENGGUNAKAN updateOrCreate AGAR DATA TIDAK DUPLIKAT DAN TYPE TERUPDATE
            ChatMessage::updateOrCreate(
                ['wa_message_id' => $waMsgId], 
                [
                    'chat_id'       => $chat->id,
                    'sender_type'   => $senderType,
                    'message_body'  => $messageText,
                    'message_type'  => $messageType, // <--- INI AKAN MENJADI 'image'
                    'media_url'     => $mediaUrl,
                    'file_name'     => $fileName,
                    'mime_type'     => $mimeType,
                    'latitude'      => $latitude,
                    'longitude'     => $longitude,
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