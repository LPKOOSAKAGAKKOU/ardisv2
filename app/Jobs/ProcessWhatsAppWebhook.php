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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

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

        // 1. IDENTIFIKASI TIPE PESAN
        $waType = $payload['type'] ?? 'chat'; 
        $mediaTypes = ['image', 'video', 'document', 'audio', 'sticker'];
        
        $latitude = $payload['location']['latitude'] ?? null;
        $longitude = $payload['location']['longitude'] ?? null;
        $messageType = in_array($waType, $mediaTypes) ? $waType : (isset($latitude) ? 'location' : 'chat');

        $mediaUrl = null;
        $fileName = null;
        $mimeType = null;
        
        // Ambil caption/body teks
        $messageText = $payload['body'] ?? ($payload['caption'] ?? '');

        // 2. PROSES DOWNLOAD MEDIA (JIKA PESAN ADALAH MEDIA)
        if (in_array($messageType, $mediaTypes) && $waMsgId && !$isFromMe) {
            try {
                $baseUrl = config('services.waha.url');
                $apiKey  = config('services.waha.key');
                
                $response = Http::withHeaders([
                    "Authorization" => "Basic " . base64_encode($apiKey)
                ])->timeout(60)->get("{$baseUrl}/message/{$waMsgId}/download");

                if ($response->successful()) {
                    $fileContent = $response->body();
                    $mimeType = $response->header('Content-Type') ?? 'application/octet-stream';
                    
                    // Tentukan ekstensi
                    $extension = $this->getExtensionFromMime($mimeType);
                    $fileName = "incoming_" . time() . "_" . $waMsgId . "." . $extension;
                    
                    // SIMPAN KE DISK PUBLIC
                    $savePath = "chat_media/" . $fileName;
                    Storage::disk('public')->put($savePath, $fileContent);
                    
                    // URL ASSET UNTUK FRONTEND
                    $mediaUrl = asset('storage/' . $savePath);
                } else {
                    Log::error("GOWA Download Gagal: " . $response->body());
                }
            } catch (\Exception $e) {
                Log::error("Gagal mendownload media Webhook: " . $e->getMessage());
            }
        }

        // Set teks fallback jika pesan hanya berisi media tanpa caption
        if (empty($messageText)) {
            $messageText = $mediaUrl ? "[$messageType diterima]" : ($latitude ? "[Lokasi diterima]" : '');
        }

        // 3. SIMPAN KE DB
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

            ChatMessage::firstOrCreate(
                ['wa_message_id' => $waMsgId], 
                [
                    'chat_id'       => $chat->id,
                    'sender_type'   => $senderType,
                    'message_body'  => $messageText,
                    'message_type'  => $messageType,
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

    private function getExtensionFromMime($mimeType)
    {
        $mimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'video/mp4' => 'mp4',
            'application/pdf' => 'pdf',
            'audio/mpeg' => 'mp3',
            'audio/ogg' => 'ogg',
            'audio/mp4' => 'm4a',
        ];
        return $mimes[$mimeType] ?? 'bin';
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