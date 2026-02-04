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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/sensei/dashboard' },
        { title: 'Data Siswa', href: '/sensei/students' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/sensei/students', { search }, { preserveState: true });
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
                                                    <Link href={`/sensei/students/${item.id}`} className="text-blue-600 hover:text-blue-800">
                                                        <Eye className="size-4" />
                                                    </Link>
                                                    <Link href={`/sensei/students/${item.id}/edit`} className="text-amber-600 hover:text-amber-800">
                                                        <Edit2 className="size-4" />
                                                    </Link>
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