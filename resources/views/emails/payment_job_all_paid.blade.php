<x-mail::message>
# 🎉 Semua Tagihan Kelulusan Job Sudah LUNAS!

Halo **{{ $studentName }}**,

Selamat! **Seluruh tagihan kelulusan wawancara dan pendidikan bahasa Jepang Anda telah lunas.** Terima kasih telah menyelesaikan seluruh pembayaran tepat waktu.

## ✅ Rincian Pembayaran

### 1. Biaya Lulus Wawancara
* **Nomor Invoice:** `{{ $payment1->invoice_number }}`
* **Jumlah:** Rp {{ number_format($payment1->amount, 0, ',', '.') }}
* **Metode:** {{ strtoupper($payment1->payment_method) }}
* **Tanggal Bayar:** {{ $payment1->payment_date ? date('d-m-Y', strtotime($payment1->payment_date)) : date('d-m-Y') }}

### 2. Biaya Pendidikan Bahasa Jepang Setelah Wawancara
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
