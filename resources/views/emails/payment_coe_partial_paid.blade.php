<x-mail::message>
# Pembayaran COE Diterima (1 dari 2 Tagihan)

Halo **{{ $studentName }}**,

Pembayaran Anda untuk **{{ $paidCategoryName }}** telah sukses kami terima. Terima kasih!

## ✅ Tagihan yang Sudah Lunas
* **Nomor Invoice:** `{{ $paidPayment->invoice_number }}`
* **Jumlah Pembayaran:** Rp {{ number_format($paidPayment->amount, 0, ',', '.') }}
* **Metode Pembayaran:** {{ strtoupper($paidPayment->payment_method) }}
* **Tanggal Bayar:** {{ $paidPayment->payment_date ? date('d-m-Y', strtotime($paidPayment->payment_date)) : date('d-m-Y') }}

@if($pendingPayment)
---

## ⏳ Tagihan yang Masih Harus Dibayar
Anda masih memiliki **1 tagihan COE** yang belum dibayar:

* **Kategori:** {{ $pendingCategoryName }}
* **Nomor Invoice:** `{{ $pendingPayment->invoice_number }}`
* **Jumlah Pembayaran:** Rp {{ number_format($pendingPayment->amount, 0, ',', '.') }}

Silakan segera selesaikan pembayaran tagihan tersisa melalui tautan di bawah ini:

@if($pendingPayment->payment_url)
<x-mail::button :url="$pendingPayment->payment_url">
Bayar Tagihan Tersisa
</x-mail::button>
@endif
@endif

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
