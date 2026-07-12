<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentCoeBillingMail extends Mailable
{
    use Queueable, SerializesModels;

    public Payment $payment1;
    public Payment $payment2;
    public string $studentName;

    /**
     * Create a new message instance.
     * Receives both COE payments to display in a single email.
     */
    public function __construct(Payment $payment1, Payment $payment2)
    {
        $this->payment1 = $payment1;
        $this->payment2 = $payment2;
        $this->studentName = $payment1->user?->name ?? 'Siswa';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tagihan Pembayaran COE (2 Tagihan)',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.payment_coe_billing',
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
