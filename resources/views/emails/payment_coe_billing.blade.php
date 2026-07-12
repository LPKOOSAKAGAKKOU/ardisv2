<x-mail::message>
# Tagihan Pembayaran COE Diterbitkan

Halo **{{ $studentName }}**,

Admin LPK telah menerbitkan **2 tagihan pembayaran COE** untuk Anda. Berikut adalah rinciannya:

---

## 1. Pengurusan Dokumen Indonesia - Jepang
* **Nomor Invoice:** `{{ $payment1->invoice_number }}`
* **Jumlah Pembayaran:** Rp {{ number_format($payment1->amount, 0, ',', '.') }}
@if($payment1->discount > 0)
* **Diskon/Potongan:** Rp {{ number_format($payment1->discount, 0, ',', '.') }}
@endif
@if($payment1->additional_items && count($payment1->additional_items) > 0)
* **Item Tambahan:**
@foreach($payment1->additional_items as $item)
  * {{ $item['name'] }}: +Rp {{ number_format($item['amount'], 0, ',', '.') }}
@endforeach
@endif

<x-mail::button :url="$payment1->payment_url">
Bayar Tagihan 1
</x-mail::button>

---

## 2. Administrasi COE
* **Nomor Invoice:** `{{ $payment2->invoice_number }}`
* **Jumlah Pembayaran:** Rp {{ number_format($payment2->amount, 0, ',', '.') }}
@if($payment2->discount > 0)
* **Diskon/Potongan:** Rp {{ number_format($payment2->discount, 0, ',', '.') }}
@endif
@if($payment2->additional_items && count($payment2->additional_items) > 0)
* **Item Tambahan:**
@foreach($payment2->additional_items as $item)
  * {{ $item['name'] }}: +Rp {{ number_format($item['amount'], 0, ',', '.') }}
@endforeach
@endif

<x-mail::button :url="$payment2->payment_url">
Bayar Tagihan 2
</x-mail::button>

---

**Total Keseluruhan:** Rp {{ number_format($payment1->amount + $payment2->amount, 0, ',', '.') }}

Silakan selesaikan kedua pembayaran di atas secara mandiri melalui tautan masing-masing. Jika Anda melakukan pembayaran secara manual/tunai di kantor, abaikan email ini atau hubungi Admin untuk konfirmasi pembayaran.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
