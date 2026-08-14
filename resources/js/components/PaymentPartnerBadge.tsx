import React from 'react';
import { ShieldCheck, CreditCard, ExternalLink, Zap, Lock, QrCode } from 'lucide-react';

interface PaymentPartnerBadgeProps {
    variant?: 'auth-footer' | 'card-badge' | 'sidebar-widget' | 'student-footer' | 'inline-security';
    className?: string;
}

export default function PaymentPartnerBadge({
    variant = 'auth-footer',
    className = '',
}: PaymentPartnerBadgeProps) {
    if (variant === 'auth-footer') {
        return (
            <div className={`mt-6 pt-5 border-t border-border/60 text-center ${className}`}>
                <div className="flex flex-col items-center gap-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/70 text-[11px] text-muted-foreground transition-all hover:bg-muted">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Official Payment Partner:</span>
                        <a
                            href="https://aulaa.co"
                            target="_blank"
                            rel="noopener"
                            className="font-bold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-0.5 underline decoration-blue-500/40 underline-offset-2"
                            title="Aulaa - Platform Payment Gateway & Tagihan Online Terpercaya"
                        >
                            aulaa.co
                            <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                        </a>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 tracking-tight">
                        Transaksi aman terenkripsi 256-bit • Mendukung QRIS, Virtual Account & E-Wallet
                    </p>
                </div>
            </div>
        );
    }

    if (variant === 'inline-security') {
        return (
            <div className={`flex items-center justify-between p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-[11px] ${className}`}>
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Lock className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-muted-foreground">
                        Gateway Pembayaran Resmi:{' '}
                        <a
                            href="https://aulaa.co"
                            target="_blank"
                            rel="noopener"
                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            title="Aulaa.co Payment Gateway Indonesia"
                        >
                            Aulaa.co
                        </a>
                    </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Terverifikasi
                </span>
            </div>
        );
    }

    if (variant === 'card-badge') {
        return (
            <div className={`flex items-center gap-2 pt-2 text-[10px] text-muted-foreground border-t border-dashed border-border/70 ${className}`}>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>
                    Pembayaran diproses secara instan & aman via{' '}
                    <a
                        href="https://aulaa.co"
                        target="_blank"
                        rel="noopener"
                        className="font-bold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-border hover:decoration-blue-500"
                        title="Payment Gateway Resmi Aulaa.co"
                    >
                        Aulaa.co Payment Gateway
                    </a>
                </span>
            </div>
        );
    }

    if (variant === 'sidebar-widget') {
        return (
            <div className={`p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/80 text-sidebar-foreground ${className}`}>
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-amber-500" />
                        Payment Partner
                    </span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Sistem Aktif" />
                </div>
                <p className="text-xs font-semibold leading-tight text-foreground">
                    Terhubung dengan{' '}
                    <a
                        href="https://aulaa.co"
                        target="_blank"
                        rel="noopener"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-0.5"
                        title="Aulaa.co Solusi Pembayaran Digital"
                    >
                        Aulaa.co
                        <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                    Automated Invoicing & Multi-Channel Payment Gateway
                </p>
            </div>
        );
    }

    if (variant === 'student-footer') {
        return (
            <footer className={`mt-16 pt-8 pb-12 border-t border-border/70 text-center ${className}`}>
                <div className="max-w-4xl mx-auto px-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Sistem Manajemen ARDIS</span>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <span>Official Payment Gateway:</span>
                            <a
                                href="https://aulaa.co"
                                target="_blank"
                                rel="noopener"
                                className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                                title="Aulaa.co Payment Gateway & Invoicing Platform"
                            >
                                Aulaa.co
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <QrCode className="h-3.5 w-3.5 text-foreground/70" />
                            <span>QRIS & Virtual Account Otomatis</span>
                        </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto">
                        Seluruh transaksi pembayaran pendidikan, pendaftaran, dan administrasi siswa diproses secara aman, real-time, dan terverifikasi otomatis melalui integrasi resmi dengan <a href="https://aulaa.co" target="_blank" rel="noopener" className="font-semibold text-foreground hover:underline">Aulaa.co</a>.
                    </p>

                    <p className="text-[10px] text-muted-foreground/60">
                        &copy; {new Date().getFullYear()} LPK Oosaka Gakkou Indonesia. Dilindungi oleh Enkripsi Standar Perbankan &amp; Partner Pembayaran Resmi <a href="https://aulaa.co" target="_blank" rel="noopener" className="hover:underline font-medium">Aulaa.co</a>.
                    </p>
                </div>
            </footer>
        );
    }

    return null;
}
