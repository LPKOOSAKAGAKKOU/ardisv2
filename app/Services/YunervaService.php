<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class YunervaService
{
    protected $baseUrl;
    protected $apiToken;
    protected $secretKey;

    public function __construct()
    {
        $this->baseUrl   = config('services.yunerva.base_url');
        $this->apiToken  = config('services.yunerva.api_token');
        $this->secretKey = config('services.yunerva.secret_key');
    }

    private function getHeaders()
    {
        return [
            'Authorization' => 'Bearer ' . $this->apiToken,
            'X-Secret-Key'  => $this->secretKey,
            'Accept'        => 'application/json',
        ];
    }

    public function requestUpload($filename, $extension, $mimeType, $size)
    {
        return Http::withHeaders($this->getHeaders())
            ->post("{$this->baseUrl}/files/upload-request", [
                'filename'  => $filename,
                'extension' => $extension,
                'mime_type' => $mimeType,
                'size'      => $size,
            ])->json();
    }

    public function finalizeUpload($ticket, $password = null)
    {
        $accessType = !empty($password) ? 'password' : 'public';

        $payload = [
            'upload_ticket' => $ticket,
            'access_type'   => $accessType,
        ];

        if (!empty($password)) {
            $payload['password'] = $password;
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiToken,
            'X-Secret-Key'  => $this->secretKey,
            'Accept'        => 'application/json',
        ])->post("{$this->baseUrl}/files/upload-finalize", $payload);

        return $response->json();
    }

    public function generateViewLink($uuid, $password = null)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiToken,
            'X-Secret-Key'  => $this->secretKey,
            'Accept'        => 'application/json',
        ])->post("{$this->baseUrl}/files/{$uuid}/generate-view-link", [
            'password' => $password
        ]);

        return $response->json();
    }

    // Tambahkan di dalam class YunervaService
    public function deleteFile($uuid)
    {
        // Tambahkan timeout(5) artinya maksimal menunggu 5 detik per request
        return Http::withHeaders($this->getHeaders())
            ->timeout(5)
            ->delete("{$this->baseUrl}/files/{$uuid}")
            ->json();
    }
}