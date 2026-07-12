<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentCoePartialPaidMail extends Mailable
{
    use Queueable, SerializesModels;

    public Payment $paidPayment;
    public ?Payment $pendingPayment;
    public string $studentName;
    public string $paidCategoryName;
    public string $pendingCategoryName;

    /**
     * Create a new message instance.
     * $paidPayment is the one just paid, $pendingPayment is the one still pending.
     */
    public function __construct(Payment $paidPayment, ?Payment $pendingPayment)
    {
        $this->paidPayment = $paidPayment;
        $this->pendingPayment = $pendingPayment;
        $this->studentName = $paidPayment->user?->name ?? 'Siswa';
        $this->paidCategoryName = Payment::CATEGORY_LABELS[$paidPayment->payment_category] ?? $paidPayment->payment_category;
        $this->pendingCategoryName = $pendingPayment
            ? (Payment::CATEGORY_LABELS[$pendingPayment->payment_category] ?? $pendingPayment->payment_category)
            : '';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pembayaran COE Diterima (1 dari 2 Tagihan Lunas)',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.payment_coe_partial_paid',
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
