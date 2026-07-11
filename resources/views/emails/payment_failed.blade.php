<x-mail::message>
# Pembayaran Gagal Diproses

Halo **{{ $studentName }}**,

Kami menginformasikan bahwa pembayaran tagihan Anda untuk **{{ $categoryName }}** dinyatakan **GAGAL** oleh penyedia sistem pembayaran.

## Rincian Tagihan yang Gagal
* **Nomor Invoice:** `{{ $payment->invoice_number }}`
* **Jumlah Pembayaran:** Rp {{ number_format($payment->amount, 0, ',', '.') }}

Anda dapat membuat ulang link pembayaran yang baru secara mandiri langsung dari dashboard siswa Anda dengan mengeklik tombol di bawah ini:

<x-mail::button :url="route('student.dashboard')">
Buat Link Pembayaran Baru
</x-mail::button>

Jika saldo Anda telah terpotong namun status dinyatakan gagal, silakan segera hubungi Admin LPK dengan menyertakan bukti pembayaran Anda.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
