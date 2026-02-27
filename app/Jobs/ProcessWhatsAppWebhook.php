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
            Log::info("WhatsApp Webhook: Nomor tidak terdaftar.", ['nomor' => $formattedStudentPhone]);
            return; 
        }

        $pushName = $student->full_name ?? $payload['from_name'] ?? 'Unknown';
        $messageText = $payload['body'] ?? ($payload['caption'] ?? '');
        $waMsgId = $payload['id'] ?? null;
        $msgTimestamp = isset($payload['timestamp']) ? date('Y-m-d H:i:s', strtotime($payload['timestamp'])) : now();
        $senderType = $isFromMe ? 'admin' : 'student';

        // DETEKSI TIPE PESAN MEDIA DARI GOWA
        $waType = $payload['type'] ?? 'chat'; 
        
        $mediaUrl = null;
        $fileName = null;
        $mimeType = null;
        $latitude = $payload['location']['latitude'] ?? null;
        $longitude = $payload['location']['longitude'] ?? null;

        $mediaTypes = ['image', 'video', 'document', 'audio', 'sticker'];
        $messageType = in_array($waType, $mediaTypes) ? $waType : (isset($latitude) ? 'location' : 'chat');

        // PROSES DOWNLOAD MEDIA JIKA ADA
        if (in_array($messageType, $mediaTypes) && $waMsgId) {
            try {
                $baseUrl = config('services.waha.url');
                $apiKey  = config('services.waha.key');
                
                // Panggil Endpoint Download Media GOWA
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    "Authorization" => "Basic " . base64_encode($apiKey)
                ])->timeout(30)->get("{$baseUrl}/message/{$waMsgId}/download");

                if ($response->successful()) {
                    $fileContent = $response->body();
                    $mimeType = $response->header('Content-Type') ?? 'application/octet-stream';
                    
                    // Tebak ekstensi file dari MimeType
                    $extension = explode('/', $mimeType)[1] ?? 'bin';
                    if (str_contains($extension, ';')) $extension = explode(';', $extension)[0];
                    
                    $fileName = "wa_{$waMsgId}.{$extension}";
                    $path = "public/chat_media/{$fileName}";
                    
                    // Simpan ke storage lokal
                    \Illuminate\Support\Facades\Storage::put($path, $fileContent);
                    $mediaUrl = \Illuminate\Support\Facades\Storage::url($path);
                }
            } catch (\Exception $e) {
                Log::error("Gagal mendownload media Webhook: " . $e->getMessage());
            }
        }

        if (empty($messageText)) {
            $messageText = $mediaUrl ? "[$messageType diterima]" : ($latitude ? "[Lokasi diterima]" : '');
        }

        // SIMPAN KE DB
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