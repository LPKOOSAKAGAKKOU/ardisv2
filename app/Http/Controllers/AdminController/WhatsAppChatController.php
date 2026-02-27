<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class WhatsAppChatController extends Controller
{   

    /**
     * API: Ambil Daftar Chat (Untuk Sidebar Widget)
     */
    public function getChatList()
    {
        $chats = Chat::with('student')
            ->orderByDesc('last_message_at')
            ->get();

        $data = $chats->map(function ($chat) {
            return [
                'id'            => $chat->id,
                'student_id'    => $chat->student_profile_id,
                'name'          => $chat->student->full_name ?? $chat->incoming_name ?? $chat->phone_number,
                'phone'         => $chat->phone_number,
                'avatar_url'    => null,
                'last_message'  => \Illuminate\Support\Str::limit($chat->last_message, 30),
                'time_ago'      => $chat->last_message_at ? $chat->last_message_at->diffForHumans() : '',
                'unread_count'  => $chat->unread_count,
            ];
        });

        return response()->json($data);
    }

    /**
     * API: Ambil Detail Pesan
     */
    public function getMessages($chatId)
    {
        $chat = Chat::with('student')->findOrFail($chatId);

        if ($chat->unread_count > 0) {
            $chat->update(['unread_count' => 0]);
        }

        $messages = ChatMessage::where('chat_id', $chat->id)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($msg) {
                return [
                    'id'           => $msg->id,
                    'direction'    => $msg->sender_type === 'admin' ? 'outbound' : 'inbound',
                    'text'         => $msg->message_body,
                    'status'       => 'read',
                    'time'         => $msg->created_at->format('H:i'),
                    'full_date'    => $msg->created_at->translatedFormat('d F Y'),
                    'is_admin'     => $msg->sender_type === 'admin',
                ];
            });

        return response()->json([
            'chat_info' => [
                'id'    => $chat->id,
                'name'  => $chat->student->full_name ?? $chat->incoming_name,
                'phone' => $chat->phone_number,
            ],
            'messages' => $messages
        ]);
    }

   /**
     * Webhook Handler untuk GOWA / WAHA (Versi Sinkron dengan Payload Asli)
     */
    public function handleWebhook(Request $request)
    {
        // 1. VALIDASI SECURITY
        $secret = config('services.waha.secret');
        $signature = $request->header('X-Hub-Signature') ?? $request->header('X-Gowa-Signature');

        if ($secret) {
            $payloadRaw = $request->getContent();
            $computedSignature = 'sha256=' . hash_hmac('sha256', $payloadRaw, $secret);

            if (!$signature || !hash_equals($computedSignature, (string)$signature)) {
                Log::warning("WhatsApp Webhook: Invalid Signature.");
                return response()->json(['message' => 'Unauthorized'], 401);
            }
        }

        // 2. PARSING PAYLOAD
        $data = $request->all();
        
        // Log untuk monitoring
        Log::info("Payload WhatsApp Diterima:", $data);
        
        if (($data['event'] ?? '') !== 'message') {
            return response()->json(['status' => 'ignored_event']);
        }

        // Sesuai log: data utama ada di dalam 'payload'
        $payload = $data['payload'] ?? [];
        
        // --- 3. IDENTIFIKASI DATA & FILTER GRUP ---
        $payload = $data['payload'] ?? [];
        $isFromMe = $payload['is_from_me'] ?? false;
        
        // JID 'from' adalah pengirim pesan
        // JID 'chat_id' adalah lokasi chat (bisa individu atau grup)
        $fromJid = $payload['from'] ?? '';
        $chatIdJid = $payload['chat_id'] ?? '';

        // BUG FIX: Jika chat_id mengandung '@g.us', berarti ini adalah pesan grup.
        // Kita harus mengabaikannya agar tidak salah mendeteksi member grup sebagai chat pribadi.
        if (str_contains($chatIdJid, '@g.us')) {
            return response()->json(['status' => 'ignored_group_message']);
        }

        // Tentukan JID lawan bicara
        $rawTargetJid = $isFromMe ? $chatIdJid : $fromJid;
        
        // Ekstrak angka saja
        $studentPhone = $this->extractPhoneNumber($rawTargetJid);
        $formattedStudentPhone = $this->formatPhoneNumber($studentPhone);

        Log::info("WhatsApp Webhook Terdeteksi", [
            'nomor_raw' => $rawTargetJid,
            'nomor_bersih' => $formattedStudentPhone,
            'is_from_me' => $isFromMe
        ]);

        // 4. FILTER SISWA TERDAFTAR (Gunakan REPLACE untuk membersihkan karakter di DB)
        $student = StudentProfile::where(function($query) use ($formattedStudentPhone) {
            // Kita hapus semua karakter non-digit di kolom phone_student saat pencarian
            $query->whereRaw("REGEXP_REPLACE(phone_student, '[^0-9]', '') LIKE ?", ["%{$formattedStudentPhone}%"])
                  // Jika nomor di DB diawali 0, kita coba cocokkan juga dengan versi 62-nya
                  ->orWhereRaw("CONCAT('62', SUBSTRING(REGEXP_REPLACE(phone_student, '[^0-9]', ''), 2)) = ?", [$formattedStudentPhone]);
        })->first();
        
        if (!$student) {
            Log::info("WhatsApp Webhook: Nomor tetap tidak ditemukan meski sudah dibersihkan.", ['nomor' => $formattedStudentPhone]);
            return response()->json(['status' => 'skipped_unregistered_number']);
        }

        // 5. PREPARASI DATA
        // PRIORITAS: 1. Nama dari Database ($student->full_name), 2. Nama dari WA ($payload['from_name'])
        $pushName = $student->full_name ?? $payload['from_name'] ?? 'Unknown';
        
        $messageText = $payload['body'] ?? ($payload['caption'] ?? '');
        $waMsgId = $payload['id'] ?? null;
        
        // Parsing timestamp ISO 8601 ke format MySQL
        $msgTimestamp = isset($payload['timestamp']) 
            ? date('Y-m-d H:i:s', strtotime($payload['timestamp'])) 
            : now();

        if (empty($messageText)) {
            $messageText = '[File/Media]';
        }

        $senderType = $isFromMe ? 'admin' : 'student';

        try {
            DB::transaction(function () use ($formattedStudentPhone, $student, $pushName, $messageText, $waMsgId, $msgTimestamp, $senderType, $isFromMe) {
                
                // A. Update Room Chat
                $chat = Chat::updateOrCreate(
                    ['phone_number' => $formattedStudentPhone],
                    [
                        'student_profile_id' => $student->id,
                        'incoming_name' => $pushName,
                        'last_message' => $messageText,
                        'last_message_at' => $msgTimestamp,
                    ]
                );

                // Increment unread jika pesan datang dari siswa
                if (!$isFromMe) {
                    $chat->increment('unread_count');
                }

                // B. Simpan Detail Pesan
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

            return response()->json(['status' => 'success_saved']);

        } catch (\Exception $e) {
            Log::error("WhatsApp Webhook Error: " . $e->getMessage());
            return response()->json(['status' => 'error'], 500);
        }
    }

    /**
     * Kirim Pesan (Admin -> Siswa)
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'phone_number' => 'required',
            'message' => 'required|string',
        ]);

        $destinationPhone = $this->formatPhoneNumber($request->phone_number);
        $messageText = $request->message;

        $baseUrl = config('services.waha.url');
        $apiKey  = config('services.waha.key');

        try {
            $response = Http::withHeaders([
                "Content-Type"  => "application/json",
                "Authorization" => "Basic " . base64_encode($apiKey)
            ])->post($baseUrl . "/send/message", [
                "phone"   => $destinationPhone,
                "message" => $messageText
            ]);

            if ($response->successful()) {
                $responseBody = $response->json();
                $waMsgId = $responseBody['id'] ?? $responseBody['data']['id'] ?? null;

                DB::transaction(function () use ($destinationPhone, $messageText, $waMsgId) {
                    $student = StudentProfile::where('phone_student', 'LIKE', "%{$destinationPhone}%")
                              ->orWhere('phone_student', $destinationPhone)
                              ->first();

                    $chat = Chat::updateOrCreate(
                        ['phone_number' => $destinationPhone],
                        [
                            'student_profile_id' => $student ? $student->id : null,
                            'last_message'      => $messageText,
                            'last_message_at'   => now(),
                        ]
                    );

                    ChatMessage::create([
                        'chat_id'       => $chat->id,
                        'wa_message_id' => $waMsgId,
                        'sender_type'   => 'admin',
                        'message_body'  => $messageText,
                        'message_type'  => 'chat',
                        'read_at'       => now(),
                        'created_at'    => now(),
                    ]);
                });

                return response()->json(['status' => 'success', 'data' => $responseBody]);
            }

            return response()->json(['status' => 'error', 'message' => $response->body()], $response->status());

        } catch (\Exception $e) {
            Log::error("WhatsApp Exception: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
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