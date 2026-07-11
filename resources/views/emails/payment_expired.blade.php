<x-mail::message>
# Batas Waktu Pembayaran Kedaluwarsa

Halo **{{ $studentName }}**,

Batas waktu pembayaran tagihan Anda untuk **{{ $categoryName }}** telah kedaluwarsa sebelum pembayaran diselesaikan.

## Rincian Tagihan yang Kedaluwarsa
* **Nomor Invoice:** `{{ $payment->invoice_number }}`
* **Jumlah Pembayaran:** Rp {{ number_format($payment->amount, 0, ',', '.') }}

Jangan khawatir, Anda dapat membuat link pembayaran baru yang aktif secara mandiri dengan mengeklik tombol di bawah ini lalu memilih **"Buat Ulang Link Pembayaran"** pada dashboard Anda:

<x-mail::button :url="route('student.dashboard')">
Buat Link Pembayaran Baru
</x-mail::button>

Jika Anda membutuhkan bantuan atau telah melakukan transfer secara manual, silakan hubungi Admin LPK untuk bantuan lebih lanjut.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
