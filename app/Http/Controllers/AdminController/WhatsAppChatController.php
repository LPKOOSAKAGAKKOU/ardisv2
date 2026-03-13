<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\StudentProfile;
use App\Models\AllowedGroup; // Tambahan Model AllowedGroup
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

    public function getChatList(Request $request)
    {
        // 1. Tangkap kata kunci pencarian
        $search = $request->query('search');

        // 2. Ambil daftar percakapan (Chat Aktif) dengan Pagination
        // Kita pisahkan logic search agar daftar chat aktif tetap rapi
        $chatsQuery = Chat::with('student')
            ->when($search, function ($query) use ($search) {
                $query->where(function($q) use ($search) {
                    $q->whereHas('student', function ($sub) use ($search) {
                        $sub->where('full_name', 'like', "%{$search}%");
                    })
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('incoming_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('last_message_at');

        $chats = $chatsQuery->paginate(15);

        $chatData = collect($chats->items())->map(function ($chat) {
            return [
                'id'             => $chat->id,
                'student_id'     => $chat->student_profile_id,
                'is_group'       => $chat->is_group ?? 0, // Tambahan untuk membedakan ikon grup di Frontend
                'name'           => $chat->is_group ? $chat->incoming_name : ($chat->student->full_name ?? $chat->incoming_name ?? $chat->phone_number), // Modifikasi tampilan nama
                'phone'          => $chat->phone_number,
                'avatar_url'     => null,
                'last_message'   => \Illuminate\Support\Str::limit($chat->last_message, 30),
                'time_ago'       => $chat->last_message_at ? $chat->last_message_at->diffForHumans() : '',
                'unread_count'   => $chat->unread_count,
            ];
        });

        // 3. Ambil SEMUA siswa untuk opsi "New Chat" 
        // Tanpa Pagination agar semua daftar nomor muncul saat dicari
        $students = StudentProfile::select('id', 'full_name', 'phone_student')
            ->when($search, function($query) use ($search) {
                $query->where('full_name', 'like', "%{$search}%")
                      ->orWhere('phone_student', 'like', "%{$search}%");
            })
            ->orderBy('full_name', 'asc')
            ->get() // ✅ Pakai get() agar semua kontak muncul tanpa terpotong halaman
            ->map(function($student) {
                return [
                    'id'    => $student->id,
                    'name'  => $student->full_name,
                    // Pastikan fungsi formatPhoneNumber sudah ada di controller agan
                    'phone' => $this->formatPhoneNumber($student->phone_student), 
                ];
            });

        // 4. Return response
        return response()->json([
            'chats'    => $chatData,
            'contacts' => $students, // Daftar semua siswa (terfilter search)
            'pagination' => [
                'current_page' => $chats->currentPage(),
                'last_page'    => $chats->lastPage(),
                'has_more'     => $chats->hasMorePages(),
            ]
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
                'sender_name'  => $msg->sender_name, // Tambahan untuk memunculkan nama siswa di dalam Grup
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
                'id'       => $chat->id,
                'is_group' => $chat->is_group ?? 0, // Tambahan Info Grup
                'name'     => $chat->is_group ? $chat->incoming_name : ($chat->student->full_name ?? $chat->incoming_name), // Modifikasi tampilan nama header
                'phone'    => $chat->phone_number,
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
        // 1. Ambil data mentah secepat mungkin
        $data = $request->all();
        $event = $data['event'] ?? ''; // <--- WAJIB didefinisikan dulu
    
        // 2. FILTER PALING ATAS (Kunci agar tidak timeout/macet)
        if ($event !== 'message') {
            // Balas 200 OK agar Gowa tidak kirim ulang laporan status (ack)
            return response()->json(['status' => 'ok'], 200); 
        }
    
        $payload = $data['payload'] ?? [];
        $chatIdJid = $payload['chat_id'] ?? '';
        
        Log::info("Payload Webhook Masuk: ", $payload);
    
        // Abaikan pesan grup (MODIFIKASI: Sekarang Grup Diizinkan asalkan terdaftar)
        $isGroup = str_contains($chatIdJid, '@g.us');
        $isGroupFlag = 0;
        $displayName = "";

        if ($isGroup) {
            $allowedGroup = AllowedGroup::where('id_group_wa', $chatIdJid)->first();
            if (!$allowedGroup) {
                return response()->json(['status' => 'ignored_group_message'], 200);
            }
            $displayName = $allowedGroup->nama_group;
            $isGroupFlag = 1;
        }
    
        // Log hanya untuk event message yang valid
        Log::info("WA Webhook Masuk: ", $data);
    
        // 3. VALIDASI SECURITY
        $secret = config('services.waha.secret');
        $signature = $request->header('X-Hub-Signature') ?? $request->header('X-Gowa-Signature');
    
        if ($secret && $signature) {
            $computedSignature = 'sha256=' . hash_hmac('sha256', $request->getContent(), $secret);
            if (!hash_equals($computedSignature, (string)$signature)) {
                Log::warning("WhatsApp Webhook: Invalid Signature.");
                return response()->json(['message' => 'Unauthorized'], 401);
            }
        }
    
        try {
            $isFromMe = $payload['is_from_me'] ?? false;
            $fromJid = $payload['from'] ?? '';
            
            // MODIFIKASI: Tentukan Target Identifier (ID Grup atau No HP Personal)
            $rawTargetJid = $isFromMe ? $chatIdJid : ($isGroup ? $chatIdJid : $fromJid);
            $targetIdentifier = $isGroup ? $rawTargetJid : $this->formatPhoneNumber($this->extractPhoneNumber($rawTargetJid));

            // MODIFIKASI: Cari Pengirim Asli untuk Pesan di dalam Grup atau Personal
            $senderPhoneRaw = $this->extractPhoneNumber($fromJid);
            $formattedSenderPhone = $this->formatPhoneNumber($senderPhoneRaw);

            $student = StudentProfile::select('id', 'full_name')
                ->where(function($query) use ($formattedSenderPhone) {
                    $query->whereRaw("REGEXP_REPLACE(phone_student, '[^0-9]', '') LIKE ?", ["%{$formattedSenderPhone}%"])
                          ->orWhereRaw("CONCAT('62', SUBSTRING(REGEXP_REPLACE(phone_student, '[^0-9]', ''), 2)) = ?", [$formattedSenderPhone]);
                })->first();
            
            // 2. PENENTUAN NAMA PENGIRIM (Sender Name)
            $waName = $payload['from_name'] ?? $formattedSenderPhone;
            if ($student) {
                $senderName = $student->full_name;
            } else {
                $senderName = $waName . " (Tidak Terdaftar di Ardis)";
            }

            // Nama untuk Sidebar (Incoming Name)
            $pushName = $isGroup ? $displayName : $senderName;
    
            // 6. LOGIKA MEDIA & TEKS
            $messageType = 'chat'; 
            if (!empty($payload['image'])) { $messageType = 'image'; }
            elseif (!empty($payload['video'])) { $messageType = 'video'; }
            elseif (!empty($payload['document'])) { $messageType = 'document'; }
            elseif (!empty($payload['audio'])) { $messageType = 'audio'; }
    
            $messageText = $payload['body'] ?? ($payload['caption'] ?? '');
            if (empty($messageText) && $messageType !== 'chat') {
                $messageText = "[" . strtoupper($messageType) . "]";
            }
    
            // 7. PARSING TIMESTAMP (Fix Error 1970)
            $rawTs = $payload['timestamp'] ?? null;
            if ($rawTs) {
                $msgTimestamp = (is_string($rawTs) && str_contains($rawTs, 'T')) 
                    ? date('Y-m-d H:i:s', strtotime($rawTs)) 
                    : date('Y-m-d H:i:s', (int)$rawTs);
            } else {
                $msgTimestamp = now();
            }
    
            $waMsgId = $payload['id'] ?? \Illuminate\Support\Str::random(30);
            $mediaUrl =
                (is_array($payload['image'] ?? null) ? $payload['image']['url'] : ($payload['image'] ?? null)) ??
                (is_array($payload['video'] ?? null) ? $payload['video']['url'] : ($payload['video'] ?? null)) ??
                (is_array($payload['document'] ?? null) ? $payload['document']['url'] : ($payload['document'] ?? null)) ??
                (is_array($payload['audio'] ?? null) ? $payload['audio']['url'] : ($payload['audio'] ?? null));
    
            // 8. SIMPAN KE DATABASE (Gunakan Transaction agar data Chat & Message sinkron)
            DB::transaction(function () use ($mediaUrl, $payload, $targetIdentifier, $student, $pushName, $senderName, $messageText, $waMsgId, $msgTimestamp, $isFromMe, $messageType, $isGroupFlag) {
    
            // 1. Siapkan data yang akan diupdate di tabel Chat (Sidebar)
            $chatUpdateData = [
                'is_group'           => $isGroupFlag, // Tambahan
                'group_id'           => $isGroupFlag ? $targetIdentifier : null, // Tambahan
                'student_profile_id' => (!$isGroupFlag && $student) ? $student->id : null,
                'last_message'       => ($isGroupFlag && !$isFromMe ? "$senderName: " : "") . \Illuminate\Support\Str::limit($messageText, 190), // Tambahan penanda nama di last message
                'last_message_at'    => $msgTimestamp,
            ];
        
            // FIX: Hanya masukkan 'incoming_name' ke array update jika pesan BUKAN dari admin
            // Dengan begini, saat admin balas, nama chat di sidebar tidak akan berubah jadi nama admin.
            if (!$isFromMe) {
                $chatUpdateData['incoming_name'] = $pushName;
            }
        
            $chat = Chat::updateOrCreate(
                ['phone_number' => $targetIdentifier],
                $chatUpdateData
            );
        
            // 2. Tambah unread count hanya jika pesan dari siswa
            if (!$isFromMe) {
                $chat->increment('unread_count');
            }
        
            // 3. Simpan Detail Pesan
            ChatMessage::updateOrCreate(
                ['wa_message_id' => $waMsgId], 
                [
                    'chat_id'       => $chat->id,
                    'sender_type'   => $isFromMe ? 'admin' : 'student',
                    'sender_name'   => $senderName, // Tambahan: Menyimpan nama pengirim
                    'message_body'  => $messageText,
                    'media_url'     => $mediaUrl,
                    'file_name'     => $payload['document']['filename'] ?? null,
                    'mime_type'     => $payload['document']['mime_type'] ?? null,
                    'message_type'  => $messageType,
                    'created_at'    => $msgTimestamp,
                ]
            );
        });
    
            return response()->json(['status' => 'processed_successfully'], 200);
    
        } catch (\Exception $e) {
            Log::error("❌ ERROR WEBHOOK: " . $e->getMessage());
            // Selalu return 200 walau error agar server Gowa berhenti mengirim ulang
            return response()->json(['status' => 'error_recorded'], 200);
        }
    }

    /**
     * Kirim Pesan (Admin -> Siswa) Mendukung Media & Lokasi
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'phone_number' => 'required',
            'message'      => 'nullable|string',
            'file'         => 'nullable|file|max:20480', // Maks 20MB
            'latitude'     => 'nullable|numeric',
            'longitude'    => 'nullable|numeric',
        ]);

        // MODIFIKASI: Jangan format phone number jika itu adalah JID Grup
        $target = $request->phone_number;
        $isGroup = str_contains($target, '@g.us');
        $destinationPhone = $isGroup ? $target : $this->formatPhoneNumber($target);

        $messageText = $request->message ?? '';
        
        $baseUrl = config('services.waha.url');
        $apiKey  = config('services.waha.key');

        $mediaUrl = null;
        $fileName = null;
        $mimeType = null;
        $messageType = 'chat'; 
        
        $gowaEndpoint = '/send/message';
        $gowaPayload = ['phone' => $destinationPhone];

        // 2. CEK TIPE PESAN
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $mimeType = $file->getMimeType();
            
            // Bersihkan nama file agar tidak ada karakter aneh & double extension
            $fileName = time() . '_' . Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
            
            // SIMPAN KE DISK 'public' (Penting!)
            $path = $file->storeAs('chat_media', $fileName, 'public'); 
            $mediaUrl = asset('storage/' . $path); // URL Lengkap untuk Frontend

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
        } elseif ($request->filled('latitude') && $request->filled('longitude')) {
            $messageType = 'location';
            $gowaEndpoint = '/send/location';
            $gowaPayload['latitude'] = $request->latitude;
            $gowaPayload['longitude'] = $request->longitude;
            $gowaPayload['name'] = 'Lokasi Dikirim Admin';
        } else {
            if (empty($messageText)) {
                return response()->json(['status' => 'error', 'message' => 'Pesan kosong'], 400);
            }
            $gowaPayload['message'] = $messageText;
        }

        // 3. SIMPAN KE DB
        $chatMessage = DB::transaction(function () use ($destinationPhone, $messageText, $mediaUrl, $fileName, $mimeType, $messageType, $request, $isGroup) {
            
            // MODIFIKASI: Pencarian student profile hanya jika bukan grup
            $student = null;
            if (!$isGroup) {
                $student = StudentProfile::where('phone_student', 'LIKE', "%{$destinationPhone}%")
                          ->orWhere('phone_student', $destinationPhone)
                          ->first();
            }

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
                'sender_name'   => 'Admin', // Tambahan
                'message_body'  => $messageText,
                'message_type'  => $messageType,
                'media_url'     => $mediaUrl,
                'file_name'     => $fileName,
                'mime_type'     => $mimeType,
                'latitude'      => $request->latitude,
                'longitude'     => $request->longitude,
                'read_at'       => now(),
                'created_at'    => now(),
            ]);
        });

        // 4. PROSES PENGIRIMAN KE GOWA (Sudah Menggunakan Attach Berantai)
        try {
            $httpReq = Http::withHeaders([
                "Authorization" => "Basic " . base64_encode($apiKey)
            ])->timeout(60);

            if ($request->hasFile('file')) {
                $response = $httpReq->attach(
                    'file', 
                    file_get_contents($request->file('file')->getRealPath()), 
                    $fileName
                )
                ->attach('phone', $destinationPhone)
                ->attach('caption', $messageText)
                ->post($baseUrl . $gowaEndpoint);
            } else {
                $response = $httpReq->post($baseUrl . $gowaEndpoint, $gowaPayload);
            }

            if ($response->successful()) {
                $responseBody = $response->json();
                $waMsgId = $responseBody['id'] ?? $responseBody['data']['id'] ?? null;
                
                if ($waMsgId) {
                    $chatMessage->update(['wa_message_id' => $waMsgId]);
                }
                return response()->json(['status' => 'success', 'data' => $responseBody]);
            }

            return response()->json(['status' => 'error', 'message' => $response->json() ?? $response->body()], $response->status());

        } catch (\Exception $e) {
            Log::error("WhatsApp Exception: " . $e->getMessage());
            return response()->json(['status' => 'partial_success', 'message' => 'Error: ' . $e->getMessage()], 200);
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