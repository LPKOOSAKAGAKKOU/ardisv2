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
     * Webhook Handler (Sangat Cepat & Responsif)
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

        $data = $request->all();
        
        // Log untuk monitoring
        Log::info("Payload WhatsApp Diterima:", $data);
        
        if (($data['event'] ?? '') !== 'message') {
            return response()->json(['status' => 'ignored_event']);
        }

        $payload = $data['payload'] ?? [];
        $chatIdJid = $payload['chat_id'] ?? '';

        // Abaikan jika ini pesan grup
        if (str_contains($chatIdJid, '@g.us')) {
            return response()->json(['status' => 'ignored_group_message']);
        }

        // 2. LEMPAR TUGAS KE QUEUE LALU TINGGALKAN
        \App\Jobs\ProcessWhatsAppWebhook::dispatch($data);

        // 3. RESPON GOWA INSTAN DALAM HITUNGAN MILIDETIK
        return response()->json(['status' => 'queued_successfully'], 200);
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

        // 1. SIMPAN KE DB DULU (Dashboard langsung update)
        $chatMessage = DB::transaction(function () use ($destinationPhone, $messageText) {
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

            return ChatMessage::create([
                'chat_id'       => $chat->id,
                'sender_type'   => 'admin',
                'message_body'  => $messageText,
                'message_type'  => 'chat',
                'read_at'       => now(),
                'created_at'    => now(),
            ]);
        });

        // 2. PROSES PENGIRIMAN KE GOWA
        try {
            $response = Http::withHeaders([
                "Content-Type"  => "application/json",
                "Authorization" => "Basic " . base64_encode($apiKey)
            ])->timeout(30) // Set ke 30 detik agar tangguh menghadapi koneksi lambat
              ->post($baseUrl . "/send/message", [
                "phone"   => $destinationPhone,
                "message" => $messageText
            ]);

            if ($response->successful()) {
                $responseBody = $response->json();
                $waMsgId = $responseBody['id'] ?? $responseBody['data']['id'] ?? null;
                
                if ($waMsgId) {
                    $chatMessage->update(['wa_message_id' => $waMsgId]);
                }
                
                return response()->json(['status' => 'success', 'data' => $responseBody]);
            }

            return response()->json(['status' => 'error', 'message' => $response->body()], $response->status());

        } catch (\Exception $e) {
            Log::error("WhatsApp Exception: " . $e->getMessage());
            // Tetap berikan respons positif agar UI tidak crash, karena pesan sudah di DB
            return response()->json(['status' => 'partial_success', 'message' => 'Tersimpan di DB, tapi ada jeda pengiriman ke GOWA'], 200);
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