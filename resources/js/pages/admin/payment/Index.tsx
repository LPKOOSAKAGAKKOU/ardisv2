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
    Check,
    ChevronRight,
    ChevronDown
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

type PaymentCategory = 'biaya_lulus_wawancara' | 'biaya_pendidikan_bahasa' | 'biaya_pengurusan_dokumen' | 'biaya_administrasi_coe';

const CATEGORY_AMOUNTS: Record<string, number> = {
    biaya_lulus_wawancara: 7500000,
    biaya_pendidikan_bahasa: 7500000,
    biaya_pengurusan_dokumen: 7500000,
    biaya_administrasi_coe: 7500000,
};

const CATEGORY_LABELS: Record<string, string> = {
    biaya_lulus_wawancara: 'Biaya Lulus Wawancara',
    biaya_pendidikan_bahasa: 'Pendidikan Bahasa Jepang',
    biaya_pengurusan_dokumen: 'Pengurusan Dokumen ID-JP',
    biaya_administrasi_coe: 'Administrasi COE',
};

export default function PaymentIndex({ students = { data: [], links: [] }, filters }: any) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>({});
    const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>('biaya_lulus_wawancara');
    
    // Single payment fields (fallback/unused but kept for structure)
    const [discount, setDiscount] = useState<number>(0);
    const [additionalItems, setAdditionalItems] = useState<{ name: string, amount: number }[]>([]);
    
    // Dual payment fields (COE and Job split)
    const [discount1, setDiscount1] = useState<number>(0);
    const [additionalItems1, setAdditionalItems1] = useState<{ name: string, amount: number }[]>([]);
    const [discount2, setDiscount2] = useState<number>(0);
    const [additionalItems2, setAdditionalItems2] = useState<{ name: string, amount: number }[]>([]);
    
    const [description, setDescription] = useState<string>('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [syncingId, setSyncingId] = useState<number | null>(null);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    const isCoeCategory = paymentCategory === 'biaya_pengurusan_dokumen';
    const isJobCategory = paymentCategory === 'biaya_lulus_wawancara';
    const isDualCategory = isCoeCategory || isJobCategory;

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Pembayaran', href: '#' },
    ];

    // Handle Search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/payments', { search }, { preserveState: true });
    };

    // Toggle expand row
    const toggleExpand = (id: number) => {
        if (expandedIds.includes(id)) {
            setExpandedIds(expandedIds.filter(x => x !== id));
        } else {
            setExpandedIds([...expandedIds, id]);
        }
    };

    // Open Billing Dialog
    const handleOpenCreate = (student: any, category: PaymentCategory) => {
        setSelectedStudent(student);
        setPaymentCategory(category);
        setDiscount(0);
        setAdditionalItems([]);
        setDiscount1(0);
        setAdditionalItems1([]);
        setDiscount2(0);
        setAdditionalItems2([]);
        setDescription(
            category === 'biaya_lulus_wawancara' 
                ? 'Tagihan kelulusan wawancara dan pendidikan bahasa Jepang.'
                : 'Tagihan pembayaran COE (Pengurusan Dokumen Indonesia - Jepang & Administrasi COE).'
        );
        setIsCreateOpen(true);
    };

    // --- Additional Items helpers for single payment ---
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

    // --- Additional Items helpers for dual payment 1 ---
    const handleAddItem1 = () => setAdditionalItems1([...additionalItems1, { name: '', amount: 0 }]);
    const handleRemoveItem1 = (index: number) => setAdditionalItems1(additionalItems1.filter((_, i) => i !== index));
    const handleItemChange1 = (index: number, field: 'name' | 'amount', value: any) => {
        const updated = [...additionalItems1];
        updated[index][field] = field === 'amount' ? Math.max(0, parseInt(value) || 0) : value;
        setAdditionalItems1(updated);
    };

    // --- Additional Items helpers for dual payment 2 ---
    const handleAddItem2 = () => setAdditionalItems2([...additionalItems2, { name: '', amount: 0 }]);
    const handleRemoveItem2 = (index: number) => setAdditionalItems2(additionalItems2.filter((_, i) => i !== index));
    const handleItemChange2 = (index: number, field: 'name' | 'amount', value: any) => {
        const updated = [...additionalItems2];
        updated[index][field] = field === 'amount' ? Math.max(0, parseInt(value) || 0) : value;
        setAdditionalItems2(updated);
    };

    // Submit Billing
    const handleSubmit = (e: React.FormEvent, isManual: boolean = false) => {
        e.preventDefault();
        if (isOverLimit) {
            alert('Tidak dapat memproses transaksi karena salah satu link melebihi Rp9.500.000!');
            return;
        }
        setProcessing(true);

        const url = isManual ? '/admin/payments/manual' : '/admin/payments';

        const payload: any = {
            interview_detail_id: selectedStudent?.id,
            payment_category: paymentCategory,
            description: description,
        };

        if (isDualCategory) {
            // Dual: send dual invoice fields
            payload.discount = discount1;
            payload.additional_items = additionalItems1.filter(item => item.name && item.amount > 0);
            payload.discount_2 = discount2;
            payload.additional_items_2 = additionalItems2.filter(item => item.name && item.amount > 0);
        } else {
            // Single payment
            payload.discount = discount;
            payload.additional_items = additionalItems.filter(item => item.name && item.amount > 0);
        }

        router.post(
            url,
            payload,
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
            onStart: () => setSyncingId(id),
            onFinish: () => setSyncingId(null),
            preserveScroll: true,
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

    // Calculate totals dynamically for the dual dialogs
    const getSingleTotal = () => {
        const base = CATEGORY_AMOUNTS[paymentCategory] || 7500000;
        const addSum = additionalItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        return base - discount + addSum;
    };

    const getInvoiceTotal1 = () => {
        const base = CATEGORY_AMOUNTS[paymentCategory] || 7500000;
        const addSum = additionalItems1.reduce((sum, item) => sum + (item.amount || 0), 0);
        return base - discount1 + addSum;
    };

    const getInvoiceTotal2 = () => {
        let partnerCat = '';
        if (paymentCategory === 'biaya_lulus_wawancara') partnerCat = 'biaya_pendidikan_bahasa';
        else if (paymentCategory === 'biaya_pengurusan_dokumen') partnerCat = 'biaya_administrasi_coe';

        const base = CATEGORY_AMOUNTS[partnerCat] || 7500000;
        const addSum = additionalItems2.reduce((sum, item) => sum + (item.amount || 0), 0);
        return base - discount2 + addSum;
    };

    const limit = 9500000;
    const isOverLimit = isDualCategory
        ? (getInvoiceTotal1() > limit || getInvoiceTotal2() > limit)
        : (getSingleTotal() > limit);

    // Render Payment Column Cell helper
    const renderPaymentCell = (payment: any, category: PaymentCategory, item: any) => {
        if (!payment) {
            // For COE & Job sub-categories, only show "Buat Tagihan" on the first column of the pair
            if (category === 'biaya_administrasi_coe') {
                const partnerPayment = item.payment_coe_dokumen;
                if (!partnerPayment) {
                    return <span className="text-xs text-muted-foreground italic">Akan dibuat bersama tagihan dokumen</span>;
                }
            }
            if (category === 'biaya_pendidikan_bahasa') {
                const partnerPayment = item.payment_job_wawancara;
                if (!partnerPayment) {
                    return <span className="text-xs text-muted-foreground italic">Akan dibuat bersama tagihan wawancara</span>;
                }
            }

            return (
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground italic">Belum ada tagihan</span>
                    <Button 
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreate(
                                item, 
                                category === 'biaya_administrasi_coe' 
                                    ? 'biaya_pengurusan_dokumen' 
                                    : (category === 'biaya_pendidikan_bahasa' ? 'biaya_lulus_wawancara' : category)
                            );
                        }}
                        className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 text-xs w-fit"
                    >
                        <Plus className="mr-1 h-3.5 w-3.5" /> 
                        {
                            (category === 'biaya_pengurusan_dokumen' || category === 'biaya_administrasi_coe')
                                ? 'Buat Tagihan COE'
                                : 'Buat Tagihan Job'
                        }
                    </Button>
                </div>
            );
        }

        const isAulaa = payment.payment_method !== 'manual';

        return (
            <div className="flex flex-col gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
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
                                         disabled={syncingId === payment.id}
                                         onClick={() => handleCheckStatus(payment.id)}
                                         className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                     >
                                         <RefreshCw size={12} className={syncingId === payment.id ? 'animate-spin' : ''} />
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
                            disabled={syncingId === payment.id}
                            onClick={() => handleCheckStatus(payment.id)}
                            className="text-[10px] h-7 px-2 flex items-center gap-1 text-neutral-500 hover:text-neutral-700 border-neutral-200"
                        >
                            <RefreshCw size={10} className={syncingId === payment.id ? 'animate-spin' : ''} /> {syncingId === payment.id ? 'Syncing...' : 'Sync Ulang'}
                        </Button>
                    )}
                    {(payment.status === 'cancelled' || payment.status === 'expired' || payment.status === 'failed') && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCreate(
                                item, 
                                category === 'biaya_administrasi_coe' 
                                    ? 'biaya_pengurusan_dokumen' 
                                    : (category === 'biaya_pendidikan_bahasa' ? 'biaya_lulus_wawancara' : category)
                            )}
                            className="text-[10px] h-7 px-2 border-neutral-300 hover:bg-neutral-50"
                        >
                            <Plus className="mr-0.5 h-3 w-3" /> Buat Ulang
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    // Render additional items editor
    const renderAdditionalItemsEditor = (
        items: { name: string, amount: number }[],
        onAdd: () => void,
        onChange: (i: number, f: 'name' | 'amount', v: any) => void,
        onRemove: (i: number) => void,
    ) => (
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Item Tambahan (Opsional)</h4>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                    className="h-7 text-xs flex items-center gap-1 border-neutral-355"
                >
                    <Plus size={12} /> Tambah Item
                </Button>
            </div>
            {items.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <Input
                                placeholder="Nama Item"
                                value={item.name}
                                onChange={(e) => onChange(idx, 'name', e.target.value)}
                                className="flex-1 h-9 text-xs"
                            />
                            <Input
                                type="number"
                                placeholder="Nominal (Rp)"
                                value={item.amount || ''}
                                onChange={(e) => onChange(idx, 'amount', e.target.value)}
                                className="w-32 h-9 text-xs"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemove(idx)}
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
    );

    // Render Dialog Content
    const renderDialogBody = () => {
        if (isDualCategory) {
            let label1 = '';
            let label2 = '';
            let totalLabel = '';
            let badgeText = '';

            if (isJobCategory) {
                label1 = 'Biaya Lulus Wawancara';
                label2 = 'Biaya Pendidikan Bahasa Jepang';
                totalLabel = 'Total Kelulusan Job';
                badgeText = 'Tagihan Kelulusan Job (2 Invoice)';
            } else {
                label1 = 'Pengurusan Dokumen Indonesia - Jepang';
                label2 = 'Administrasi COE';
                totalLabel = 'Total COE';
                badgeText = 'Tagihan COE (2 Invoice)';
            }

            return (
                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-medium">Kategori</Label>
                        <Badge className="col-span-3 w-fit text-xs bg-neutral-900 text-white dark:bg-white dark:text-black">
                            {badgeText}
                        </Badge>
                    </div>

                    {/* --- Tagihan 1 --- */}
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                            <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">1</span>
                            {label1}
                        </h3>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right font-medium text-xs">Nominal</Label>
                            <Input value={formatIDR(7500000)} disabled className="col-span-3 bg-neutral-50 text-xs" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right font-medium text-xs">Potongan</Label>
                            <Input
                                type="number" min="0" max="7500000"
                                value={discount1 || ''}
                                onChange={(e) => setDiscount1(Math.min(7500000, Math.max(0, parseInt(e.target.value) || 0)))}
                                placeholder="Masukkan potongan"
                                className="col-span-3 text-xs"
                            />
                        </div>
                        {renderAdditionalItemsEditor(additionalItems1, handleAddItem1, handleItemChange1, handleRemoveItem1)}
                        <div className="grid grid-cols-4 items-center gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <Label className="text-right font-bold text-xs">Subtotal</Label>
                            <Input value={formatIDR(getInvoiceTotal1())} disabled className={`col-span-3 font-bold text-xs ${getInvoiceTotal1() > limit ? 'bg-red-50 text-red-750 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`} />
                        </div>
                        {getInvoiceTotal1() > limit && (
                            <p className="text-red-500 text-[10px] font-semibold text-right">
                                Subtotal melebihi batas limit Rp{formatIDR(limit)} per link!
                            </p>
                        )}
                    </div>

                    {/* --- Tagihan 2 --- */}
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                            <span className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-md">2</span>
                            {label2}
                        </h3>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right font-medium text-xs">Nominal</Label>
                            <Input value={formatIDR(7500000)} disabled className="col-span-3 bg-neutral-50 text-xs" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right font-medium text-xs">Potongan</Label>
                            <Input
                                type="number" min="0" max="7500000"
                                value={discount2 || ''}
                                onChange={(e) => setDiscount2(Math.min(7500000, Math.max(0, parseInt(e.target.value) || 0)))}
                                placeholder="Masukkan potongan"
                                className="col-span-3 text-xs"
                            />
                        </div>
                        {renderAdditionalItemsEditor(additionalItems2, handleAddItem2, handleItemChange2, handleRemoveItem2)}
                        <div className="grid grid-cols-4 items-center gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <Label className="text-right font-bold text-xs">Subtotal</Label>
                            <Input value={formatIDR(getInvoiceTotal2())} disabled className={`col-span-3 font-bold text-xs ${getInvoiceTotal2() > limit ? 'bg-red-50 text-red-750 border-red-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`} />
                        </div>
                        {getInvoiceTotal2() > limit && (
                            <p className="text-red-500 text-[10px] font-semibold text-right">
                                Subtotal melebihi batas limit Rp{formatIDR(limit)} per link!
                            </p>
                        )}
                    </div>

                    {/* Grand Total */}
                    <div className="grid grid-cols-4 items-center gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                        <Label className="text-right font-black text-foreground">{totalLabel}</Label>
                        <Input
                            value={formatIDR(getInvoiceTotal1() + getInvoiceTotal2())}
                            disabled
                            className="col-span-3 bg-green-50 text-green-700 font-bold border-green-200"
                        />
                    </div>

                    {isOverLimit && (
                        <div className="text-red-650 font-semibold text-xs bg-red-50 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>Batas maksimum per link adalah Rp9.500.000! Harap kurangi biaya tambahan atau tambah potongan.</span>
                        </div>
                    )}

                    {/* Description */}
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
            );
        }

        // Single payment dialog fallback
        const baseAmount = CATEGORY_AMOUNTS[paymentCategory] || 7500000;
        return (
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">Kategori</Label>
                    <Badge className="col-span-3 w-fit text-xs bg-neutral-900 text-white dark:bg-white dark:text-black">
                        {CATEGORY_LABELS[paymentCategory] || paymentCategory}
                    </Badge>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">Nominal Utama</Label>
                    <Input
                        value={formatIDR(baseAmount)}
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
                        max={String(baseAmount)}
                        value={discount || ''}
                        onChange={(e) => setDiscount(Math.min(baseAmount, Math.max(0, parseInt(e.target.value) || 0)))}
                        placeholder="Masukkan potongan"
                        className="col-span-3"
                    />
                </div>

                {renderAdditionalItemsEditor(additionalItems, handleAddAdditionalItem, handleAdditionalItemChange, handleRemoveAdditionalItem)}

                <div className="grid grid-cols-4 items-center gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                    <Label className="text-right font-bold text-foreground">Total Tagihan</Label>
                    <Input
                        value={formatIDR(getSingleTotal())}
                        disabled
                        className="col-span-3 bg-green-50 text-green-700 font-bold border-green-200"
                    />
                </div>

                {isOverLimit && (
                    <div className="text-red-650 font-semibold text-xs bg-red-50 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>Batas maksimum per link adalah Rp9.500.000!</span>
                    </div>
                )}

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
                            <h1 className="text-xl font-bold tracking-tight">Data Pembayaran Wawancara</h1>
                            <p className="text-sm text-muted-foreground">Kelola tagihan kelulusan wawancara dan COE peserta per event wawancara.</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari wawancara, perusahaan, atau siswa..."
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
                                    <th className="px-6 py-4 w-12 text-center"></th>
                                    <th className="px-6 py-4">Wawancara & Perusahaan</th>
                                    <th className="px-6 py-4">Tanggal Wawancara</th>
                                    <th className="px-6 py-4 text-center">Jumlah Siswa Lulus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {students?.data && students.data.length > 0 ? students.data.map((interview: any) => {
                                    const isExpanded = expandedIds.includes(interview.id);
                                    return (
                                        <React.Fragment key={interview.id}>
                                            <tr 
                                                className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer"
                                                onClick={() => toggleExpand(interview.id)}
                                            >
                                                <td className="px-6 py-4 text-center">
                                                    {isExpanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-foreground text-sm">{interview.interviewer_title}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Perusahaan: {interview.company_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">
                                                    {interview.interview_date}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                                        {interview.students?.length || 0} Orang
                                                    </Badge>
                                                </td>
                                            </tr>

                                            {/* Expanded Students Details Row */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={4} className="bg-neutral-50/40 dark:bg-neutral-950/20 px-6 py-4">
                                                        <div className="rounded-xl border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden shadow-xs ml-6">
                                                            <table className="w-full text-left text-xs">
                                                                <thead className="bg-neutral-50 dark:bg-neutral-900/30 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border-b border-neutral-100 dark:border-neutral-900">
                                                                    <tr>
                                                                        <th className="px-4 py-3">Siswa & NIK</th>
                                                                        <th className="px-4 py-3 w-1/5">Biaya Lulus Wawancara (Rp7,5jt)</th>
                                                                        <th className="px-4 py-3 w-1/5">Pendidikan Bahasa (Rp7,5jt)</th>
                                                                        <th className="px-4 py-3 w-1/5">Pengurusan Dokumen ID-JP (Rp7,5jt)</th>
                                                                        <th className="px-4 py-3 w-1/5">Administrasi COE (Rp7,5jt)</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                                    {interview.students && interview.students.length > 0 ? (
                                                                        interview.students.map((student: any) => (
                                                                            <tr key={student.id} className="hover:bg-neutral-50/40 transition-colors">
                                                                                <td className="px-4 py-3 align-top">
                                                                                    <div className="flex flex-col gap-0.5">
                                                                                        <span className="font-semibold text-foreground text-xs">{student.name}</span>
                                                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                                                            NIK: {student.nik}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-3 align-top">
                                                                                    {renderPaymentCell(student.payment_job_wawancara, 'biaya_lulus_wawancara', student)}
                                                                                </td>
                                                                                <td className="px-4 py-3 align-top">
                                                                                    {renderPaymentCell(student.payment_job_pendidikan, 'biaya_pendidikan_bahasa', student)}
                                                                                </td>
                                                                                <td className="px-4 py-3 align-top">
                                                                                    {renderPaymentCell(student.payment_coe_dokumen, 'biaya_pengurusan_dokumen', student)}
                                                                                </td>
                                                                                <td className="px-4 py-3 align-top">
                                                                                    {renderPaymentCell(student.payment_coe_admin, 'biaya_administrasi_coe', student)}
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                                                                                Tidak ada siswa dalam wawancara ini.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground italic">
                                            Tidak ada data wawancara yang ditemukan.
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
                <DialogContent className={`${isDualCategory ? 'sm:max-w-[600px]' : 'sm:max-w-[500px]'} max-h-[85vh] overflow-y-auto`}>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>Kelola Tagihan Pembayaran</DialogTitle>
                            <DialogDescription>
                                {isDualCategory 
                                    ? `Buat 2 tagihan sekaligus untuk **${selectedStudent?.name}**. Masing-masing tagihan akan dikirim sebagai transaksi terpisah.`
                                    : `Detail tagihan pembayaran untuk **${selectedStudent?.name}**.`
                                }
                            </DialogDescription>
                        </DialogHeader>
                        
                        {renderDialogBody()}

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
                                    disabled={processing || isOverLimit}
                                >
                                    {processing ? 'Memproses...' : 'Tandai Lunas Manual'}
                                </Button>
                                <Button 
                                    type="button"
                                    onClick={(e) => handleSubmit(e, false)}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-black w-full sm:w-auto text-xs"
                                    disabled={processing || isOverLimit}
                                >
                                    {processing ? 'Memproses...' : 'Buat 2 Link Aulaa'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
