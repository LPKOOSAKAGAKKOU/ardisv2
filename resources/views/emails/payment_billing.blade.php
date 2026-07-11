<x-mail::message>
# Tagihan Pembayaran Baru Diterbitkan

Halo **{{ $studentName }}**,

Tagihan pembayaran Anda untuk **{{ $categoryName }}** telah diterbitkan oleh Admin LPK.

## Rincian Tagihan
* **Nomor Invoice:** `{{ $payment->invoice_number }}`
* **Jumlah Pembayaran:** Rp {{ number_format($payment->amount, 0, ',', '.') }}
@if($payment->discount > 0)
* **Diskon/Potongan:** Rp {{ number_format($payment->discount, 0, ',', '.') }}
@endif
@if($payment->additional_items && count($payment->additional_items) > 0)
* **Item Tambahan:**
@foreach($payment->additional_items as $item)
  * {{ $item['name'] }}: +Rp {{ number_format($item['amount'], 0, ',', '.') }}
@endforeach
@endif

Silakan lakukan pembayaran secara mandiri secara aman dan instan dengan meng-klik tombol di bawah ini:

<x-mail::button :url="$payment->payment_url">
Bayar Sekarang
</x-mail::button>

Jika Anda melakukan pembayaran secara manual/tunai di kantor, abaikan email ini atau hubungi Admin untuk konfirmasi pembayaran.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
