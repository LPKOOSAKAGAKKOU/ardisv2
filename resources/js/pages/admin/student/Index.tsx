import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Edit2, Eye, Trash2, Users, GraduationCap, Briefcase, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Student {
    id: number;
    nik: string;
    full_name: string;
    dob: string;
    gender: string;
    pob: string;
    user?: {
        email: string;
    };
}

interface Props {
    students: {
        data: Student[];
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        current_page: number;
        total: number;
        per_page: number;
    };
    filters: {
        search: string;
    };
}

interface BreadcrumbItem {
    title: string;
    href: string;
}

export default function StudentIndex({ students, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [confirmName, setConfirmName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Siswa', href: '/admin/students' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/students', { search }, { preserveState: true });
    };

    const openDeleteModal = (student: Student) => {
        setStudentToDelete(student);
        setConfirmName('');
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!studentToDelete) return;
        
        setIsDeleting(true);
        router.delete(`/admin/students/${studentToDelete.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setStudentToDelete(null);
                setIsDeleting(false);
                alert('Siswa dan seluruh berkas berhasil dihapus permanen.');
            },
            onError: () => setIsDeleting(false),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Siswa" />

            <div className="flex flex-col gap-6 p-4">
                
                {/* 1. STATISTIK */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard title="Total Siswa" value={students?.total || 0} icon={<Users className="size-5" />} color="text-blue-600" />
                    <StatCard title="Aktif Belajar" value="-" icon={<GraduationCap className="size-5" />} color="text-green-600" />
                    <StatCard title="Siap Kerja" value="-" icon={<Briefcase className="size-5" />} color="text-purple-600" />
                </div>

                {/* 2. HEADER & SEARCH */}
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <form onSubmit={handleSearch} className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari NIK atau nama..."
                            className="w-full rounded-lg border border-sidebar-border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-ring dark:bg-neutral-900 dark:text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>

                    <Link
                        href="/admin/students/create"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 md:w-auto dark:bg-white dark:text-black"
                    >
                        <Plus className="size-4" />
                        Tambah Siswa
                    </Link>
                </div>

                {/* 3. TABEL DATA */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border bg-background shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-muted-foreground uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-center w-12">No</th>
                                    <th className="px-4 py-3 font-bold">NIK</th>
                                    <th className="px-4 py-3 font-bold">Nama</th>
                                    <th className="px-4 py-3 font-bold">Tgl Lahir</th>
                                    <th className="px-4 py-3 font-bold text-center">Jenis Kelamin</th>
                                    <th className="px-4 py-3 font-bold">Email</th>
                                    <th className="px-4 py-3 font-bold">Asal Kota</th>
                                    <th className="px-4 py-3 text-center font-bold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {students?.data?.length > 0 ? (
                                    students.data.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                            <td className="px-4 py-3 text-center text-muted-foreground">
                                                {(students.current_page - 1) * students.per_page + index + 1}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{item.nik || '-'}</td>
                                            <td className="px-4 py-3 font-medium">{item.full_name}</td>
                                            <td className="px-4 py-3">{item.dob || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                    {item.gender || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{item?.user?.email}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.pob || '-'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-3">
                                                    <Link href={`/admin/students/${item.id}`} className="text-blue-600 hover:text-blue-800">
                                                        <Eye className="size-4" />
                                                    </Link>
                                                    <Link href={`/admin/students/${item.id}/edit`} className="text-amber-600 hover:text-amber-800">
                                                        <Edit2 className="size-4" />
                                                    </Link>
                                                    <button 
                                                        onClick={() => openDeleteModal(item)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground italic">
                                            Data siswa tidak ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. PAGINATION */}
                <div className="flex flex-col items-center justify-between gap-4 px-2 md:flex-row">
                    <p className="text-sm text-muted-foreground">
                        Menampilkan {students?.data?.length || 0} dari {students?.total || 0} siswa
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {students?.links?.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`rounded-md px-3 py-1 text-xs border ${
                                    link.active 
                                        ? 'bg-black text-white border-black dark:bg-white dark:text-black' 
                                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400'
                                } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* MODAL KONFIRMASI HAPUS (Sekarang berada di dalam div utama) */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
                        <DialogHeader>
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <DialogTitle className="text-center text-xl font-bold">Hapus Data Siswa?</DialogTitle>
                            <DialogDescription className="text-center pt-2">
                                Tindakan ini <span className="font-bold text-red-600">permanen</span>. Seluruh data profil dan berkas digital di server Yunerva akan dihapus.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Siswa yang akan dihapus:</p>
                                <p className="text-sm font-bold">{studentToDelete?.full_name}</p>
                                <p className="text-[11px] font-mono text-muted-foreground">{studentToDelete?.nik}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Ketik nama lengkap siswa untuk mengonfirmasi:
                                </label>
                                <Input 
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder="Masukkan nama lengkap"
                                    className="border-red-200 focus-visible:ring-red-500"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                            >
                                Batal
                            </Button>
                            <Button 
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={confirmName !== studentToDelete?.full_name || isDeleting}
                                className="w-full sm:w-auto"
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: any; icon: React.ReactNode; color: string }) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-sidebar-border bg-background p-4 shadow-sm dark:bg-neutral-900/30">
            <div className={`rounded-lg bg-neutral-100 dark:bg-neutral-800 p-2.5 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{title}</p>
                <p className="text-xl font-bold dark:text-white">{value}</p>
            </div>
        </div>
    );
}