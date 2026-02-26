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
     * Method: GET /api/admin/whatsapp/chats
     */
    public function getChatList()
    {
        // Ambil semua room chat, urutkan dari yang pesan terakhirnya paling baru
        $chats = Chat::with('student') // Eager load relasi student
            ->orderByDesc('last_message_at')
            ->get();

        // Transform data agar mudah dibaca oleh React
        $data = $chats->map(function ($chat) {
            return [
                'id'            => $chat->id,
                'student_id'    => $chat->student_profile_id,
                // Prioritaskan nama dari database siswa, jika null pakai nama dari WA
                'name'          => $chat->student->full_name ?? $chat->incoming_name ?? $chat->phone_number,
                'phone'         => $chat->phone_number,
                'avatar_url'    => null, // Bisa diisi logic URL foto siswa jika ada
                'last_message'  => \Illuminate\Support\Str::limit($chat->last_message, 30), // Potong jika kepanjangan
                'time_ago'      => $chat->last_message_at ? $chat->last_message_at->diffForHumans() : '',
                'unread_count'  => $chat->unread_count,
            ];
        });

        return response()->json($data);
    }

    /**
     * API: Ambil Detail Pesan (Saat salah satu chat diklik)
     * Method: GET /api/admin/whatsapp/chats/{chatId}/messages
     */
    public function getMessages($chatId)
    {
        $chat = Chat::with('student')->findOrFail($chatId);

        // 1. Reset Unread Count karena admin sudah membuka chat ini
        if ($chat->unread_count > 0) {
            $chat->update(['unread_count' => 0]);
        }

        // 2. Ambil pesan-pesan di dalamnya
        $messages = ChatMessage::where('chat_id', $chat->id)
            ->orderBy('created_at', 'asc') // Urutkan dari yang terlama ke terbaru (Chat Bubble style)
            ->get()
            ->map(function ($msg) {
                return [
                    'id'           => $msg->id,
                    'direction'    => $msg->sender_type === 'admin' ? 'outbound' : 'inbound',
                    'text'         => $msg->message_body,
                    'status'       => 'read', // Bisa dikembangkan nanti (sent, delivered, read)
                    'time'         => $msg->created_at->format('H:i'), // Format jam:menit (14:30)
                    'full_date'    => $msg->created_at->translatedFormat('d F Y'), // Tanggal lengkap untuk separator hari
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
     * Webhook Handler untuk GOWA (Support Pesan Masuk & Keluar)
     */
    public function handleWebhook(Request $request)
    {
        // --- 1. VALIDASI SECURITY (HMAC SHA256) ---
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

        // --- 2. PARSING PAYLOAD ---
        $data = $request->all();
        
        // Hanya proses event 'message'
        if (($data['event'] ?? '') !== 'message') {
            return response()->json(['status' => 'ignored_event']);
        }

        $innerPayload = $data['payload'] ?? [];
        $info = $innerPayload['Info'] ?? []; // Metadata pesan (Sender, ID, Timestamp, dll)
        
        // Cek apakah pesan ini dikirim oleh KITA (Admin via HP) atau MEREKA (Siswa)
        $isFromMe = $info['IsFromMe'] ?? false;
        
        // --- 3. MENENTUKAN SIAPA "LAWAN BICARA" (SISWA) ---
        // Jika pesan DARI SAYA (IsFromMe=true), maka siswa adalah PENERIMA (Chat JID)
        // Jika pesan DARI ORANG LAIN (IsFromMe=false), maka siswa adalah PENGIRIM (Sender JID)
        $rawTargetJid = $isFromMe ? ($info['Chat'] ?? '') : ($info['Sender']['String'] ?? '');
        
        // Bersihkan nomor (ambil angka saja & format ke 62...)
        $studentPhone = $this->extractPhoneNumber($rawTargetJid);
        $formattedStudentPhone = $this->formatPhoneNumber($studentPhone);

        // --- 4. FILTER: HANYA PROSES JIKA NOMOR TERDAFTAR DI DATABASE SISWA ---
        // Cari siswa berdasarkan nomor HP yang sudah diformat
        $student = StudentProfile::where(function($query) use ($formattedStudentPhone) {
             // Asumsi format di DB konsisten angka saja, tapi kita gunakan LIKE untuk jaga-jaga
             $query->where('phone_student', 'LIKE', "%{$formattedStudentPhone}%")
                   ->orWhere('phone_student', $formattedStudentPhone);
        })->first();

        // JIKA SISWA TIDAK DITEMUKAN -> SKIP (Jangan simpan sampah)
        if (!$student) {
            return response()->json(['status' => 'skipped_unregistered_number']);
        }

        // --- 5. SIAPKAN DATA PESAN ---
        $pushName = $innerPayload['PushName'] ?? ($student->full_name ?? 'Unknown');
        $messageText = $innerPayload['Text'] ?? '';
        $waMsgId = $info['ID'] ?? null;
        
        // Timestamp convert dari Unix ke DateTime MySQL
        $msgTimestamp = isset($info['Timestamp']) ? date('Y-m-d H:i:s', $info['Timestamp']) : now();

        if (empty($messageText)) {
            $messageText = '[File/Media]'; // Placeholder jika pesan hanya gambar tanpa caption
        }

        // Tentukan tipe pengirim untuk database kita
        $senderType = $isFromMe ? 'admin' : 'student';

        try {
            DB::transaction(function () use ($formattedStudentPhone, $student, $pushName, $messageText, $waMsgId, $msgTimestamp, $senderType, $isFromMe) {
                
                // A. Update/Buat Room Chat
                // Logic Unread: Jika pesan dari siswa, tambah 1. Jika dari admin, jangan tambah (tetap).
                $unreadIncrement = $isFromMe ? 0 : 1;

                $chat = Chat::updateOrCreate(
                    ['phone_number' => $formattedStudentPhone], // Key pencarian (Nomor HP Siswa)
                    [
                        'student_profile_id' => $student->id,
                        'incoming_name' => $pushName,
                        'last_message' => $messageText,
                        'last_message_at' => $msgTimestamp,
                    ]
                );

                // Kita update unread_count secara terpisah agar bisa menggunakan increment
                if ($unreadIncrement > 0) {
                    $chat->increment('unread_count');
                }

                // B. Simpan Detail Pesan
                ChatMessage::firstOrCreate(
                    ['wa_message_id' => $waMessageId], // Cek ID dulu
                    [
                        'chat_id'       => $chat->id,
                        'sender_type'   => 'admin',
                        'message_body'  => $messageText,
                        'message_type'  => 'chat',
                        'read_at'       => now(),
                        'created_at'    => now(),
                        'updated_at'    => now(),
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
     * Menggunakan logika HTTP Client yang sudah terbukti work
     */
    public function sendMessage(Request $request)
    {
        // 1. Validasi Input
        $request->validate([
            'phone_number' => 'required',
            'message' => 'required|string',
        ]);

        // Normalisasi nomor menggunakan fungsi helper yang sama
        $destinationPhone = $this->formatPhoneNumber($request->phone_number);
        $messageText = $request->message;

        // 2. Konfigurasi WAHA (Sesuai kode Anda)
        $baseUrl = config('services.waha.url');
        $apiKey  = config('services.waha.key');

        $data = [
            "phone"   => $destinationPhone,
            "message" => $messageText
        ];

        try {
            // --- LOGIKA PENGIRIMAN (COPY DARI KODE ANDA) ---
            $response = Http::withHeaders([
                "Content-Type"  => "application/json",
                "Authorization" => "Basic " . base64_encode($apiKey)
            ])->post($baseUrl . "/send/message", $data);
            // -----------------------------------------------

            // 3. Cek Status Response
            if ($response->successful()) {
                $responseBody = $response->json();
                
                // Ambil ID pesan dari response GOWA (biasanya di field 'id' atau 'data.id')
                // GOWA v8 seringkali mengembalikan: { "id": "...", "timestamp": ... }
                $waMessageId = $responseBody['id'] ?? $responseBody['data']['id'] ?? null;

                // 4. Simpan ke Database (Agar history chat muncul di dashboard)
                DB::transaction(function () use ($destinationPhone, $messageText, $waMessageId) {
                    
                    // Cari siswa (opsional, untuk memastikan relasi)
                    $student = StudentProfile::where(function($query) use ($destinationPhone) {
                        $query->where('phone_student', 'LIKE', "%{$destinationPhone}%")
                              ->orWhere('phone_student', $destinationPhone);
                    })->first();

                    // Update Room Chat
                    $chat = Chat::updateOrCreate(
                        ['phone_number' => $destinationPhone],
                        [
                            'student_profile_id' => $student ? $student->id : null,
                            'last_message'      => $messageText,
                            'last_message_at'   => now(),
                            // unread_count tidak ditambah karena ini pesan keluar (Admin yg kirim)
                        ]
                    );

                    // Simpan Chat Message
                    ChatMessage::create([
                        'chat_id'       => $chat->id,
                        'wa_message_id' => $waMessageId, // Simpan ID agar sinkron dengan webhook nanti
                        'sender_type'   => 'admin',      // Tandai sebagai Admin
                        'message_body'  => $messageText,
                        'message_type'  => 'chat',
                        'read_at'       => now(),        // Otomatis terbaca
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ]);
                });

                return response()->json([
                    'status' => 'success', 
                    'message' => 'Pesan berhasil dikirim dan disimpan',
                    'data' => $responseBody
                ]);
            } else {
                // Jika GOWA menolak (misal nomor salah atau server mati)
                Log::error("WhatsApp Send Error: " . $response->body());
                return response()->json([
                    'status' => 'error', 
                    'message' => 'Gagal mengirim pesan ke WhatsApp Server',
                    'error' => $response->body()
                ], $response->status());
            }

        } catch (\Exception $e) {
            Log::error("WhatsApp Exception: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Mengambil bagian depan sebelum @ dari JID (misal: 62812@s.whatsapp.net -> 62812)
     */
    private function extractPhoneNumber($jid)
    {
        // JID bisa berupa object atau string, pastikan string
        if (is_array($jid)) {
            $jid = $jid['String'] ?? '';
        }
        $parts = explode('@', $jid);
        return $parts[0] ?? '';
    }

    /**
     * Normalisasi nomor agar konsisten 628xxx
     */
    private function formatPhoneNumber($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }
        return $phone;
    }
}