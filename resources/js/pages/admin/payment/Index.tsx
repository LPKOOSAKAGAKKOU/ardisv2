import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { 
    CreditCard, 
    Search, 
    Plus, 
    ExternalLink, 
    RefreshCw, 
    Ban, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Copy,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function PaymentIndex({ students, filters }: any) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>({});
    const [discount, setDiscount] = useState<number>(0);
    const [description, setDescription] = useState<string>('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Pembayaran', href: '#' },
    ];

    // Handle Search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/payments', { search }, { preserveState: true });
    };

    // Open Billing Dialog
    const handleOpenCreate = (student: any) => {
        setSelectedStudent(student);
        setDiscount(0);
        setDescription('Tagihan pembayaran karena sudah lulus wawancara kerja.');
        setIsCreateOpen(true);
    };

    // Submit Billing
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post(
            '/admin/payments',
            {
                user_id: selectedStudent?.id,
                discount: discount,
                description: description,
            },
            {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setProcessing(false);
                },
                onError: (errors) => {
                    alert(Object.values(errors).join('\n'));
                    setProcessing(false);
                },
            }
        );
    };

    // Check Status manually from Aulaa.co
    const handleCheckStatus = (id: number) => {
        router.post(`/admin/payments/${id}/check`, {}, {
            onBefore: () => alert('Menghubungi server Aulaa.co untuk mengecek status...'),
        });
    };

    // Cancel Billing
    const handleCancel = (id: number, studentName: string) => {
        if (confirm(`Apakah Anda yakin ingin membatalkan tagihan untuk siswa "${studentName}"?`)) {
            router.post(`/admin/payments/${id}/cancel`);
        }
    };

    // Copy Link Helper
    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Format IDR Helper
    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Status Badge Helper
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <Badge className="bg-green-100 text-green-700 border-none flex items-center gap-1 w-fit hover:bg-green-150">
                        <CheckCircle2 size={12} /> Lunas
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-amber-100 text-amber-700 border-none flex items-center gap-1 w-fit hover:bg-amber-150 animate-pulse">
                        <Clock size={12} /> Pending
                    </Badge>
                );
            case 'expired':
                return (
                    <Badge className="bg-red-100 text-red-700 border-none flex items-center gap-1 w-fit hover:bg-red-150">
                        <AlertCircle size={12} /> Kedaluwarsa
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="bg-zinc-150 text-zinc-650 border-none flex items-center gap-1 w-fit hover:bg-zinc-200">
                        <Ban size={12} /> Dibatalkan
                    </Badge>
                );
            default:
                return <Badge className="bg-zinc-100 text-zinc-500 border-none">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Pembayaran Siswa" />

            <div className="flex flex-col gap-6 p-4 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-neutral-900 dark:bg-white rounded-xl shadow-lg text-white dark:text-black">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Data Pembayaran Lulus Job</h1>
                            <p className="text-sm text-muted-foreground">Kelola tagihan kelulusan wawancara siswa senilai Rp15.000.000 via Aulaa.co.</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari siswa atau NIK..."
                        className="pl-10 h-11"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                {/* Table Section */}
                <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-4">Siswa & NIK</th>
                                    <th className="px-6 py-4">Wawancara & Perusahaan</th>
                                    <th className="px-6 py-4">Rincian Tagihan</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {students.data.length > 0 ? students.data.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                        {/* Siswa */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-foreground text-sm">{item.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    NIK: {item.nik}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Wawancara */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-foreground text-xs">{item.job_title}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Perusahaan: {item.company_name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Rincian Tagihan */}
                                        <td className="px-6 py-4">
                                            {item.payment ? (
                                                <div className="flex flex-col text-xs gap-0.5">
                                                    <span className="font-semibold text-foreground">
                                                        {formatIDR(item.payment?.amount)}
                                                    </span>
                                                    {item.payment?.discount > 0 && (
                                                        <span className="text-[10px] text-red-500 font-medium">
                                                            Potongan: -{formatIDR(item.payment?.discount)}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        No: {item.payment?.invoice_number}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col text-xs gap-0.5">
                                                    <span className="font-semibold text-neutral-450">
                                                        {formatIDR(15000000)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground italic">
                                                        Belum Diberi Tagihan
                                                    </span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            {item.payment ? (
                                                <div className="flex flex-col gap-1">
                                                    {getStatusBadge(item.payment?.status)}
                                                    {item.payment?.status === 'paid' && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            via {item.payment?.payment_method?.toUpperCase()} ({item.payment?.payment_date})
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">-</span>
                                            )}
                                        </td>

                                        {/* Aksi */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {!item.payment || item.payment?.status === 'cancelled' || item.payment?.status === 'expired' ? (
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => handleOpenCreate(item)}
                                                        className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 text-xs"
                                                    >
                                                        <Plus className="mr-1 h-3.5 w-3.5" /> Buat Tagihan
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        {item.payment?.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => window.open(item.payment?.payment_url, '_blank')}
                                                                    className="text-xs flex items-center gap-1 border-neutral-300"
                                                                >
                                                                    <ExternalLink size={14} /> Bayar
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title="Salin Link Pembayaran"
                                                                    onClick={() => copyToClipboard(item.payment?.payment_url || '', item.payment?.id || '')}
                                                                    className="h-8 w-8 text-neutral-500 hover:text-neutral-700"
                                                                >
                                                                    {copiedId === item.payment?.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title="Perbarui Status"
                                                                    onClick={() => handleCheckStatus(item.payment?.id)}
                                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                >
                                                                    <RefreshCw size={14} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title="Batalkan Tagihan"
                                                                    onClick={() => handleCancel(item.payment?.id, item.name)}
                                                                    className="h-8 w-8 text-red-650 hover:text-red-750 hover:bg-red-50"
                                                                >
                                                                    <Ban size={14} />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {item.payment?.status === 'paid' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleCheckStatus(item.payment?.id)}
                                                                className="text-xs flex items-center gap-1 text-neutral-500 hover:text-neutral-700 border-neutral-200"
                                                            >
                                                                <RefreshCw size={12} /> Sync Ulang
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground italic">
                                            Tidak ada data siswa lulus wawancara yang ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {students.links && students.links.length > 3 && (
                    <div className="flex justify-center gap-1 mt-4">
                        {students.links.map((link: any, i: number) => (
                            <Button
                                key={i}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
                                disabled={!link.url}
                                onClick={() => router.get(link.url, {}, { preserveState: true })}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className="text-xs"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Dialog: Buat Tagihan Baru */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Buat Link Tagihan Pembayaran</DialogTitle>
                            <DialogDescription>
                                Buat tagihan untuk **{selectedStudent?.name}** karena sudah lulus wawancara kerja.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Nominal Asli</Label>
                                <Input
                                    value={formatIDR(15000000)}
                                    disabled
                                    className="col-span-3 bg-neutral-50"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="discount" className="text-right">Potongan (Rp)</Label>
                                <Input
                                    id="discount"
                                    type="number"
                                    min="0"
                                    max="15000000"
                                    value={discount}
                                    onChange={(e) => setDiscount(Math.min(15000000, Math.max(0, parseInt(e.target.value) || 0)))}
                                    placeholder="Masukkan besaran potongan"
                                    className="col-span-3"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Final Tagihan</Label>
                                <Input
                                    value={formatIDR(15000000 - discount)}
                                    disabled
                                    className="col-span-3 bg-green-50 text-green-700 font-bold border-green-200"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="description" className="text-right mt-2">Keterangan</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Keterangan tagihan..."
                                    className="col-span-3"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCreateOpen(false)}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-neutral-900 text-white dark:bg-white dark:text-black"
                                disabled={processing}
                            >
                                {processing ? 'Memproses...' : 'Buat Tagihan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
