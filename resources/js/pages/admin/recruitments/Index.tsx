import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Search, Trash2, Edit, Calendar, ClipboardList, CheckCircle2, Eye } from 'lucide-react';
import { useState } from 'react';

interface Props {
    recruitments: any;
    filters: {
        search: string;
    };
}

export default function RecruitmentIndex({ recruitments, filters }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Manajemen Rekrutmen', href: '/admin/recruitments' },
    ];

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        date: '',
        type: 'regular',
        is_active: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/recruitments', { search: searchQuery }, { preserveState: true });
    };

    const openModal = (recruitment = null) => {
        clearErrors();
        if (recruitment) {
            setEditData(recruitment);
            setData({
                name: recruitment.name,
                date: recruitment.date,
                type: recruitment.type,
                is_active: !!recruitment.is_active,
            });
        } else {
            setEditData(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editData) {
            put(`/admin/recruitments/${editData.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/recruitments', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus data rekrutmen "${name}"?`)) {
            router.delete(`/admin/recruitments/${id}`, {
                preserveScroll: true as any
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Rekrutmen" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Dashboard Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Program" value={recruitments.total} icon={<ClipboardList className="size-4" />} />
                    <StatCard title="Status Aktif" value={recruitments.data.filter((r: any) => r.is_active).length} icon={<CheckCircle2 className="size-4 text-emerald-500" />} />
                    <StatCard title="Hari Ini" value={new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} icon={<Calendar className="size-4" />} />
                </div>

                <div className="flex-1 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                    {/* Toolbar Pencarian & Tambah */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <form onSubmit={handleSearch} className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama rekrutmen..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>

                        <Button onClick={() => openModal()} className="font-bold">
                            <Plus className="mr-2 size-4" /> TAMBAH REKRUTMEN
                        </Button>
                    </div>

                    {/* Tabel Data */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-bold">NAMA REKRUTMEN</TableHead>
                                    <TableHead className="font-bold">TANGGAL</TableHead>
                                    <TableHead className="font-bold">TIPE</TableHead>
                                    <TableHead className="font-bold">STATUS</TableHead>
                                    <TableHead className="text-right font-bold">AKSI</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recruitments.data.length > 0 ? (
                                    recruitments.data.map((item: any) => (
                                        <TableRow key={item.id} className="group">
                                            <TableCell>
                                                <button 
                                                    onClick={() => router.get(`/admin/recruitments/${item.id}`)}
                                                    className="text-left font-bold uppercase hover:text-emerald-600 hover:underline underline-offset-4 transition-all"
                                                >
                                                    {item.name}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(item.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize text-[10px] font-bold">
                                                    {item.type.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {item.is_active ? (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] font-bold">AKTIF</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px] font-bold">NON-AKTIF</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Tombol Show (Lihat Detail) */}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" 
                                                        onClick={() => router.get(`/admin/recruitments/${item.id}`)}
                                                    >
                                                        <Eye size={14} />
                                                    </Button>

                                                    {/* Tombol Edit */}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                                                        onClick={() => openModal(item)}
                                                    >
                                                        <Edit size={14} />
                                                    </Button>

                                                    {/* Tombol Hapus */}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-rose-600 hover:bg-rose-50" 
                                                        onClick={() => handleDelete(item.id, item.name)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground uppercase text-xs font-bold">
                                            Data rekrutmen tidak ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle className="font-black uppercase tracking-tight">
                                {editData ? 'Edit Rekrutmen' : 'Tambah Rekrutmen'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Masukkan detail informasi perekrutan angkatan.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase">Nama Rekrutmen</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Rekrutmen Maret 2026"
                                    className="uppercase font-bold"
                                />
                                {errors.name && <span className="text-[10px] text-destructive font-bold">{errors.name}</span>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="date" className="text-xs font-bold uppercase">Tanggal Pelaksanaan</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                />
                                {errors.date && <span className="text-[10px] text-destructive font-bold">{errors.date}</span>}
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase">Tipe Rekrutmen</Label>
                                <Select value={data.type} onValueChange={(val) => setData('type', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="regular">REGULER</SelectItem>
                                        <SelectItem value="job_matching">JOB MATCHING</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <span className="text-[10px] text-destructive font-bold">{errors.type}</span>}
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase">Status Perekrutan</Label>
                                <Select 
                                    value={data.is_active ? "1" : "0"} 
                                    onValueChange={(val) => setData('is_active', val === "1")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">AKTIF (DIBUKA)</SelectItem>
                                        <SelectItem value="0">NON-AKTIF (DITUTUP)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.is_active && <span className="text-[10px] text-destructive font-bold">{errors.is_active}</span>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold text-xs uppercase">Batal</Button>
                            <Button type="submit" disabled={processing} className="font-bold text-xs uppercase">
                                {editData ? 'Perbarui Data' : 'Simpan Data'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function StatCard({ title, value, icon }: { title: string; value: any; icon: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{title}</span>
            </div>
            <div className="text-2xl font-black tracking-tighter">{value}</div>
        </div>
    );
}