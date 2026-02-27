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
        // 1. Ambil daftar percakapan (Chat) yang sudah ada
        $chats = Chat::with('student')
            ->orderByDesc('last_message_at')
            ->get();

        $chatData = $chats->map(function ($chat) {
            return [
                'id'            => $chat->id,
                'student_id'    => $chat->student_profile_id,
                'name'          => $chat->student->full_name ?? $chat->incoming_name ?? $chat->phone_number,
                // Format nomor HP
                'phone'         => $chat->phone_number,
                'avatar_url'    => null,
                'last_message'  => \Illuminate\Support\Str::limit($chat->last_message, 30),
                'time_ago'      => $chat->last_message_at ? $chat->last_message_at->diffForHumans() : '',
                'unread_count'  => $chat->unread_count,
            ];
        });

        // 2. Ambil semua siswa dari DB untuk opsi "New Chat"
        // PENTING: Gunakan model StudentProfile dan kolom phone_student!
        $students = StudentProfile::select('id', 'full_name', 'phone_student')->get()->map(function($student) {
            return [
                'id'    => $student->id,
                'name'  => $student->full_name,
                // Format nomor HP dari phone_student
                'phone' => $this->formatPhoneNumber($student->phone_student), 
            ];
        });

        // 3. Return gabungan
        return response()->json([
            'chats'    => $chatData,
            'contacts' => $students
        ]);
    }

    /**
     * API: Ambil Detail Pesan (Dengan Pagination & Media)
     */
    public function getMessages(Request $request, $chatId)
    {
        $chat = Chat::with('student')->findOrFail($chatId);

        if ($chat->unread_count > 0) {
            $chat->update(['unread_count' => 0]);
        }

        // Ambil 20 pesan per halaman. Diurutkan desc agar yang terbaru ada di halaman 1
        $perPage = 20;
        $paginator = ChatMessage::where('chat_id', $chat->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Kita reverse koleksinya agar urutan di UI React tetap kronologis (atas ke bawah)
        $messages = collect($paginator->items())->map(function ($msg) {
            return [
                'id'           => $msg->id,
                'direction'    => $msg->sender_type === 'admin' ? 'outbound' : 'inbound',
                'text'         => $msg->message_body,
                'message_type' => $msg->message_type ?? 'chat',
                'media_url'    => $msg->media_url,
                'file_name'    => $msg->file_name,
                'mime_type'    => $msg->mime_type,
                'latitude'     => $msg->latitude,
                'longitude'    => $msg->longitude,
                'status'       => 'read',
                'time'         => $msg->created_at->format('H:i'),
                'full_date'    => $msg->created_at->translatedFormat('d F Y'),
                'is_admin'     => $msg->sender_type === 'admin',
            ];
        })->reverse()->values();

        return response()->json([
            'chat_info' => [
                'id'    => $chat->id,
                'name'  => $chat->student->full_name ?? $chat->incoming_name,
                'phone' => $chat->phone_number,
            ],
            'messages' => $messages,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'has_more'     => $paginator->hasMorePages()
            ]
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
     * Kirim Pesan (Admin -> Siswa) Mendukung Media & Lokasi
     */
    public function sendMessage(Request $request)
    {
        // 1. Validasi dinamis (Bisa teks saja, file saja, atau lokasi saja)
        $request->validate([
            'phone_number' => 'required',
            'message'      => 'nullable|string',
            'file'         => 'nullable|file|max:20480', // Maks 20MB
            'latitude'     => 'nullable|numeric',
            'longitude'    => 'nullable|numeric',
        ]);

        $destinationPhone = $this->formatPhoneNumber($request->phone_number);
        $messageText = $request->message ?? '';
        
        $baseUrl = config('services.waha.url');
        $apiKey  = config('services.waha.key');

        $mediaUrl = null;
        $fileName = null;
        $mimeType = null;
        $messageType = 'chat'; // Default
        
        $gowaEndpoint = '/send/message';
        $gowaPayload = ['phone' => $destinationPhone];

        // 2. CEK TIPE PESAN & SIAPKAN PAYLOAD UNTUK GOWA
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $mimeType = $file->getMimeType();
            
            // Simpan file ke storage/app/public/chat_media
            $path = $file->storeAs('public/chat_media', time() . '_' . preg_replace('/[^A-Za-z0-9.\-]/', '_', $fileName));
            $mediaUrl = \Illuminate\Support\Facades\Storage::url($path);

            if (str_starts_with($mimeType, 'image/')) {
                $messageType = 'image';
                $gowaEndpoint = '/send/image';
            } elseif (str_starts_with($mimeType, 'video/')) {
                $messageType = 'video';
                $gowaEndpoint = '/send/video';
            } else {
                $messageType = 'document';
                $gowaEndpoint = '/send/file';
            }
            
            // GOWA butuh caption untuk media
            $gowaPayload['caption'] = $messageText; 

        } elseif ($request->filled('latitude') && $request->filled('longitude')) {
            $messageType = 'location';
            $gowaEndpoint = '/send/location';
            $gowaPayload['latitude'] = $request->latitude;
            $gowaPayload['longitude'] = $request->longitude;
            $gowaPayload['name'] = 'Lokasi Dikirim Admin';
        } else {
            // Chat teks biasa
            if (empty($messageText)) {
                return response()->json(['status' => 'error', 'message' => 'Pesan tidak boleh kosong jika tidak ada file'], 400);
            }
            $gowaPayload['message'] = $messageText;
        }

        // 3. SIMPAN KE DB DULU
        $chatMessage = DB::transaction(function () use ($destinationPhone, $messageText, $mediaUrl, $fileName, $mimeType, $messageType, $request) {
            $student = StudentProfile::where('phone_student', 'LIKE', "%{$destinationPhone}%")
                      ->orWhere('phone_student', $destinationPhone)
                      ->first();

            $chat = Chat::updateOrCreate(
                ['phone_number' => $destinationPhone],
                [
                    'student_profile_id' => $student ? $student->id : null,
                    'last_message'      => $messageType === 'chat' ? $messageText : "[$messageType dikirim]",
                    'last_message_at'   => now(),
                ]
            );

            return ChatMessage::create([
                'chat_id'       => $chat->id,
                'sender_type'   => 'admin',
                'message_body'  => $messageText,
                'message_type'  => $messageType, // chat, image, document, location, dll
                'media_url'     => $mediaUrl,
                'file_name'     => $fileName,
                'mime_type'     => $mimeType,
                'latitude'      => $request->latitude,
                'longitude'     => $request->longitude,
                'read_at'       => now(),
                'created_at'    => now(),
            ]);
        });

        // 4. PROSES PENGIRIMAN KE GOWA
        try {
            $httpReq = Http::withHeaders([
                "Authorization" => "Basic " . base64_encode($apiKey)
            ])->timeout(60); // Ditambah jadi 60s untuk jaga-jaga file besar

            if ($request->hasFile('file')) {
                // PERBAIKAN: Gunakan attach berantai untuk menyertakan data teks dalam multipart form
                $response = $httpReq->attach(
                    'file', 
                    file_get_contents($request->file('file')->getRealPath()), 
                    $fileName
                )
                ->attach('phone', $destinationPhone) // Kirim phone sebagai bagian dari form-data
                ->attach('caption', $messageText)   // Kirim caption sebagai bagian dari form-data
                ->post($baseUrl . $gowaEndpoint);   // Jangan masukkan $gowaPayload di sini lagi
            } else {
                // Jika hanya teks atau lokasi, tetap kirim sebagai JSON biasa
                $response = $httpReq->post($baseUrl . $gowaEndpoint, $gowaPayload);
            }

            if ($response->successful()) {
                $responseBody = $response->json();
                
                // GOWA biasanya mengembalikan ID di top-level atau di dalam data
                $waMsgId = $responseBody['id'] ?? $responseBody['data']['id'] ?? null;
                
                if ($waMsgId) {
                    $chatMessage->update(['wa_message_id' => $waMsgId]);
                }
                
                return response()->json(['status' => 'success', 'data' => $responseBody]);
            }

            // Jika gagal, log respon asli dari GOWA untuk debugging
            Log::error("GOWA Error Response: " . $response->body());
            return response()->json([
                'status' => 'error', 
                'message' => $response->json() ?? $response->body()
            ], $response->status());

        } catch (\Exception $e) {
            Log::error("WhatsApp Exception: " . $e->getMessage());
            return response()->json(['status' => 'partial_success', 'message' => 'Tersimpan di DB, tapi gagal kirim ke WA: ' . $e->getMessage()], 200);
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