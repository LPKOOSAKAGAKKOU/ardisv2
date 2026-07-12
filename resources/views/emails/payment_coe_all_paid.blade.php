<x-mail::message>
# 🎉 Semua Tagihan COE Sudah LUNAS!

Halo **{{ $studentName }}**,

Selamat! **Seluruh tagihan COE Anda telah lunas.** Terima kasih telah menyelesaikan semua pembayaran tepat waktu.

## ✅ Rincian Pembayaran

### 1. Pengurusan Dokumen Indonesia - Jepang
* **Nomor Invoice:** `{{ $payment1->invoice_number }}`
* **Jumlah:** Rp {{ number_format($payment1->amount, 0, ',', '.') }}
* **Metode:** {{ strtoupper($payment1->payment_method) }}
* **Tanggal Bayar:** {{ $payment1->payment_date ? date('d-m-Y', strtotime($payment1->payment_date)) : date('d-m-Y') }}

### 2. Administrasi COE
* **Nomor Invoice:** `{{ $payment2->invoice_number }}`
* **Jumlah:** Rp {{ number_format($payment2->amount, 0, ',', '.') }}
* **Metode:** {{ strtoupper($payment2->payment_method) }}
* **Tanggal Bayar:** {{ $payment2->payment_date ? date('d-m-Y', strtotime($payment2->payment_date)) : date('d-m-Y') }}

---

**Total Keseluruhan:** Rp {{ number_format($totalAmount, 0, ',', '.') }}

Status pembayaran Anda di portal Ardis telah diperbarui menjadi **LUNAS**. Anda dapat memeriksa detailnya kembali dengan masuk ke dashboard siswa Anda.

<x-mail::button :url="route('student.dashboard')">
Buka Dashboard Siswa
</x-mail::button>

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
