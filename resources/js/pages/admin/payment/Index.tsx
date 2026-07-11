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

export default function PaymentIndex({ students = { data: [], links: [] }, filters }: any) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>({});
    const [paymentCategory, setPaymentCategory] = useState<'biaya_lulus_job' | 'biaya_coe_turun'>('biaya_lulus_job');
    const [discount, setDiscount] = useState<number>(0);
    const [additionalItems, setAdditionalItems] = useState<{ name: string, amount: number }[]>([]);
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
    const handleOpenCreate = (student: any, category: 'biaya_lulus_job' | 'biaya_coe_turun') => {
        setSelectedStudent(student);
        setPaymentCategory(category);
        setDiscount(0);
        setAdditionalItems([]);
        setDescription(
            category === 'biaya_lulus_job' 
                ? 'Tagihan pembayaran karena sudah lulus wawancara kerja.' 
                : 'Tagihan pembayaran karena Certificate of Eligibility (COE) telah turun.'
        );
        setIsCreateOpen(true);
    };

    // Add / Remove / Change custom items
    const handleAddAdditionalItem = () => {
        setAdditionalItems([...additionalItems, { name: '', amount: 0 }]);
    };

    const handleRemoveAdditionalItem = (index: number) => {
        setAdditionalItems(additionalItems.filter((_, i) => i !== index));
    };

    const handleAdditionalItemChange = (index: number, field: 'name' | 'amount', value: any) => {
        const updated = [...additionalItems];
        if (field === 'amount') {
            updated[index][field] = Math.max(0, parseInt(value) || 0);
        } else {
            updated[index][field] = value;
        }
        setAdditionalItems(updated);
    };

    // Submit Billing
    const handleSubmit = (e: React.FormEvent, isManual: boolean = false) => {
        e.preventDefault();
        setProcessing(true);

        const url = isManual ? '/admin/payments/manual' : '/admin/payments';

        router.post(
            url,
            {
                interview_detail_id: selectedStudent?.id,
                payment_category: paymentCategory,
                discount: discount,
                description: description,
                additional_items: additionalItems.filter(item => item.name && item.amount > 0),
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

    const additionalTotal = additionalItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const finalAmount = 15000000 - discount + additionalTotal;

    // Render Payment Column Cell helper
    const renderPaymentCell = (payment: any, category: 'biaya_lulus_job' | 'biaya_coe_turun', item: any) => {
        if (!payment) {
            return (
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground italic">Belum ada tagihan</span>
                    <Button 
                        size="sm"
                        onClick={() => handleOpenCreate(item, category)}
                        className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 text-xs w-fit"
                    >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Buat Tagihan
                    </Button>
                </div>
            );
        }

        const isAulaa = payment.payment_method !== 'manual';

        return (
            <div className="flex flex-col gap-2 text-xs">
                <div className="flex flex-col gap-0.5 border border-neutral-100 dark:border-neutral-800 p-2.5 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/10">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-foreground">
                            {formatIDR(payment.amount)}
                        </span>
                        {getStatusBadge(payment.status)}
                    </div>
                    {payment.discount > 0 && (
                        <span className="text-[10px] text-red-500 font-medium">
                            Potongan: -{formatIDR(payment.discount)}
                        </span>
                    )}
                    {payment.additional_items && payment.additional_items.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60">
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase">Item Tambahan:</span>
                            <ul className="list-disc pl-3.5 text-[10px] text-neutral-600 dark:text-neutral-400 gap-0.5 mt-0.5">
                                {payment.additional_items.map((add: any, idx: number) => (
                                    <li key={idx}>
                                        {add.name}: +{formatIDR(add.amount)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <span className="text-[9px] text-muted-foreground font-mono mt-1.5">
                        No: {payment.invoice_number}
                    </span>
                    {payment.status === 'paid' && (
                        <span className="text-[9px] text-green-600 font-medium mt-0.5">
                            Lunas via {payment.payment_method?.toUpperCase()} ({payment.payment_date})
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-1">
                    {payment.status === 'pending' && (
                        <>
                            {isAulaa ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(payment.payment_url, '_blank')}
                                        className="text-xs h-8 px-2 flex items-center gap-1 border-neutral-300"
                                    >
                                        <ExternalLink size={12} /> Bayar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Salin Link Pembayaran"
                                        onClick={() => copyToClipboard(payment.payment_url, payment.id)}
                                        className="h-8 w-8 text-neutral-500 hover:text-neutral-700"
                                    >
                                        {copiedId === payment.id ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Perbarui Status"
                                        onClick={() => handleCheckStatus(payment.id)}
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                        <RefreshCw size={12} />
                                    </Button>
                                </>
                            ) : null}
                            
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Batalkan Tagihan"
                                onClick={() => handleCancel(payment.id, item.name)}
                                className="h-8 w-8 text-red-650 hover:text-red-750 hover:bg-red-50"
                            >
                                <Ban size={12} />
                            </Button>
                        </>
                    )}
                    {payment.status === 'paid' && isAulaa && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckStatus(payment.id)}
                            className="text-[10px] h-7 px-2 flex items-center gap-1 text-neutral-500 hover:text-neutral-700 border-neutral-200"
                        >
                            <RefreshCw size={10} /> Sync Ulang
                        </Button>
                    )}
                    {(payment.status === 'cancelled' || payment.status === 'expired') && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCreate(item, category)}
                            className="text-[10px] h-7 px-2 border-neutral-300 hover:bg-neutral-50"
                        >
                            <Plus className="mr-0.5 h-3 w-3" /> Buat Ulang
                        </Button>
                    )}
                </div>
            </div>
        );
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
                            <h1 className="text-xl font-bold tracking-tight">Data Pembayaran Lulus Job & COE</h1>
                            <p className="text-sm text-muted-foreground">Kelola tagihan kelulusan wawancara (Rp15jt) dan biaya COE turun (Rp15jt) siswa.</p>
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
                                    <th className="px-6 py-4">Tagihan Lulus Job (Rp15jt)</th>
                                    <th className="px-6 py-4">Tagihan COE Turun (Rp15jt)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {students?.data && students.data.length > 0 ? students.data.map((item: any) => (
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

                                        {/* Tagihan Lulus Job */}
                                        <td className="px-6 py-4">
                                            {renderPaymentCell(item.payment_job, 'biaya_lulus_job', item)}
                                        </td>

                                        {/* Tagihan COE Turun */}
                                        <td className="px-6 py-4">
                                            {renderPaymentCell(item.payment_coe, 'biaya_coe_turun', item)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground italic">
                                            Tidak ada data siswa lulus wawancara yang ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {students?.links && students.links.length > 3 && (
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
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>Kelola Tagihan Pembayaran</DialogTitle>
                            <DialogDescription>
                                Detail tagihan pembayaran {paymentCategory === 'biaya_lulus_job' ? 'Lulus Wawancara' : 'COE Turun'} untuk **{selectedStudent?.name}**.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4 text-sm">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-medium">Kategori</Label>
                                <Badge className="col-span-3 w-fit text-xs bg-neutral-900 text-white dark:bg-white dark:text-black">
                                    {paymentCategory === 'biaya_lulus_job' ? 'Biaya Lulus Job' : 'Biaya COE Turun'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-medium">Nominal Utama</Label>
                                <Input
                                    value={formatIDR(15000000)}
                                    disabled
                                    className="col-span-3 bg-neutral-50"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="discount" className="text-right font-medium">Potongan (Rp)</Label>
                                <Input
                                    id="discount"
                                    type="number"
                                    min="0"
                                    max="15000000"
                                    value={discount || ''}
                                    onChange={(e) => setDiscount(Math.min(15000000, Math.max(0, parseInt(e.target.value) || 0)))}
                                    placeholder="Masukkan potongan"
                                    className="col-span-3"
                                />
                            </div>

                            {/* Additional Custom Items */}
                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Item Tambahan (Opsional)</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddAdditionalItem}
                                        className="h-7 text-xs flex items-center gap-1 border-neutral-350"
                                    >
                                        <Plus size={12} /> Tambah Item
                                    </Button>
                                </div>

                                {additionalItems.length > 0 ? (
                                    <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                                        {additionalItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Nama Item (misal: Tiket Pesawat)"
                                                    value={item.name}
                                                    onChange={(e) => handleAdditionalItemChange(idx, 'name', e.target.value)}
                                                    className="flex-1 h-9 text-xs"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Nominal (Rp)"
                                                    value={item.amount || ''}
                                                    onChange={(e) => handleAdditionalItemChange(idx, 'amount', e.target.value)}
                                                    className="w-32 h-9 text-xs"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveAdditionalItem(idx)}
                                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                >
                                                    <span className="text-lg">×</span>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-2 bg-neutral-50/50 rounded-lg">
                                        Belum ada item tambahan.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                                <Label className="text-right font-bold text-foreground">Total Tagihan</Label>
                                <Input
                                    value={formatIDR(finalAmount)}
                                    disabled
                                    className="col-span-3 bg-green-50 text-green-700 font-bold border-green-200"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="description" className="text-right mt-2 font-medium">Keterangan</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Keterangan pembayaran..."
                                    className="col-span-3 text-xs"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCreateOpen(false)}
                                disabled={processing}
                                className="w-full sm:w-auto text-xs"
                            >
                                Batal
                            </Button>
                            
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto ml-auto">
                                <Button 
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto text-xs"
                                    disabled={processing}
                                >
                                    {processing ? 'Memproses...' : 'Tandai Lunas Manual'}
                                </Button>
                                <Button 
                                    type="button"
                                    onClick={(e) => handleSubmit(e, false)}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-black w-full sm:w-auto text-xs"
                                    disabled={processing}
                                >
                                    {processing ? 'Memproses...' : 'Buat Link Aulaa'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
