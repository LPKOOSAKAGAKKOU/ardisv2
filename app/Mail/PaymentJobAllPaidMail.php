<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentJobAllPaidMail extends Mailable
{
    use Queueable, SerializesModels;

    public Payment $payment1;
    public Payment $payment2;
    public string $studentName;
    public int $totalAmount;

    /**
     * Create a new message instance.
     * Both Job payments are paid.
     */
    public function __construct(Payment $payment1, Payment $payment2)
    {
        $this->payment1 = $payment1;
        $this->payment2 = $payment2;
        $this->studentName = $payment1->user?->name ?? 'Siswa';
        $this->totalAmount = $payment1->amount + $payment2->amount;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Semua Tagihan Kelulusan Job Sudah LUNAS! 🎉',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.payment_job_all_paid',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
