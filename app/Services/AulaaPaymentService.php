<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AulaaPaymentService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.aulaa.base_url', 'https://api.aulaa.co/v1');
        $this->apiKey = config('services.aulaa.api_key');
    }

    /**
     * Create payment link in Aulaa.co
     */
    public function createPaymentLink(string $invoiceNumber, int $amount)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/payments', [
            'order_id' => $invoiceNumber,
            'amount' => $amount,
        ]);

        if ($response->failed()) {
            Log::error('Aulaa Payment creation failed: ' . $response->body());
            throw new \Exception('Gagal membuat link pembayaran Aulaa: ' . ($response->json('error') ?? $response->reason()));
        }

        return $response->json();
    }

    /**
     * Fetch payment status from Aulaa.co
     */
    public function getPaymentStatus(string $aulaaPaymentId)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
        ])->get($this->baseUrl . '/payments/' . $aulaaPaymentId);

        if ($response->failed()) {
            Log::error('Aulaa status check failed for ID ' . $aulaaPaymentId . ': ' . $response->body());
            throw new \Exception('Gagal mengecek status pembayaran: ' . ($response->json('error') ?? $response->reason()));
        }

        return $response->json();
    }

    /**
     * Cancel payment link in Aulaa.co
     */
    public function cancelPaymentLink(string $aulaaPaymentId)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
        ])->post($this->baseUrl . '/payments/' . $aulaaPaymentId . '/cancel');

        if ($response->failed()) {
            Log::error('Aulaa Payment cancellation failed for ID ' . $aulaaPaymentId . ': ' . $response->body());
            throw new \Exception('Gagal membatalkan pembayaran di Aulaa: ' . ($response->json('error') ?? $response->reason()));
        }

        return $response->json();
    }
}
