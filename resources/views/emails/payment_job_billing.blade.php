<x-mail::message>
# Tagihan Pembayaran Kelulusan Wawancara & Pendidikan Diterbitkan

Halo **{{ $studentName }}**,

Selamat atas kelulusan wawancara kerja Anda! Admin LPK telah menerbitkan **2 tagihan pembayaran kelulusan** untuk Anda. Berikut adalah rinciannya:

---

## 1. Biaya Lulus Wawancara
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

## 2. Biaya Pendidikan Bahasa Jepang Setelah Wawancara
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

Silakan selesaikan kedua pembayaran di atas secara mandiri melalui tautan masing-masing. Batas maksimal per transaksi adalah Rp 9.500.000, oleh karena itu pembayaran ini dipecah menjadi 2 link terpisah.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
