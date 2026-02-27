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

        // --- LOGIKA IDENTIFIKASI MEDIA & METADATA ---
        $baseUrl = rtrim(config('services.waha.url'), '/');
        $mediaUrl = null;
        $messageType = 'chat';
        $mimeType = null;
        $fileName = null;

        // Cek satu-per-satu berdasarkan payload GOWA
        if (isset($payload['image'])) {
            $messageType = 'image';
            $mediaUrl = $baseUrl . '/' . $payload['image'];
            $mimeType = 'image/jpeg'; // Default WA image
        } elseif (isset($payload['video'])) {
            $messageType = 'video';
            $mediaUrl = $baseUrl . '/' . $payload['video'];
            $mimeType = 'video/mp4';
        } elseif (isset($payload['document'])) {
            $messageType = 'document';
            $mediaUrl = $baseUrl . '/' . $payload['document'];
            // Dokumen biasanya mengirim mime_type asli di payload
            $mimeType = $payload['mime_type'] ?? 'application/octet-stream';
            $fileName = $payload['filename'] ?? 'document.pdf';
        } elseif (isset($payload['audio'])) {
            $messageType = 'audio';
            $mediaUrl = $baseUrl . '/' . $payload['audio'];
            $mimeType = 'audio/ogg';
        }

        // Lokasi
        $latitude = $payload['location']['latitude'] ?? null;
        $longitude = $payload['location']['longitude'] ?? null;
        if ($latitude) {
            $messageType = 'location';
        }

        $messageText = $payload['body'] ?? ($payload['caption'] ?? '');

        // Fallback teks untuk info di sidebar
        if (empty($messageText)) {
            $messageText = $mediaUrl ? "[$messageType]" : ($latitude ? "[Lokasi]" : '');
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

            ChatMessage::updateOrCreate(
                ['wa_message_id' => $waMsgId], 
                [
                    'chat_id'       => $chat->id,
                    'sender_type'   => $senderType,
                    'message_body'  => $messageText,
                    'message_type'  => $messageType,
                    'media_url'     => $mediaUrl,   // Tetap diisi URL dari GOWA
                    'file_name'     => $fileName,   // Tetap disimpan jika ada
                    'mime_type'     => $mimeType,   // Tetap disimpan
                    'latitude'      => $latitude,   // Tetap disimpan
                    'longitude'     => $longitude,  // Tetap disimpan
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