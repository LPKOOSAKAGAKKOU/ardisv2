<x-mail::message>
# Pembayaran Diterima (Lunas)

Halo **{{ $studentName }}**,

Pembayaran Anda untuk **{{ $categoryName }}** telah sukses kami terima. Terima kasih telah menyelesaikan pembayaran tepat waktu!

## Rincian Pembayaran
* **Nomor Invoice:** `{{ $payment->invoice_number }}`
* **Jumlah Pembayaran:** Rp {{ number_format($payment->amount, 0, ',', '.') }}
* **Metode Pembayaran:** {{ strtoupper($payment->payment_method) }}
* **Tanggal Bayar:** {{ $payment->payment_date ? date('d-m-Y', strtotime($payment->payment_date)) : date('d-m-Y') }}

Status pembayaran Anda di portal Ardis telah diperbarui menjadi **LUNAS**. Anda dapat memeriksa detailnya kembali dengan masuk ke dashboard siswa Anda.

<x-mail::button :url="route('student.dashboard')">
Buka Dashboard Siswa
</x-mail::button>

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
