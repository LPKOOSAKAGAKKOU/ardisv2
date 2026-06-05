import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Plus, Search, Edit, Eye,
    Building2,
    Users, GraduationCap, Plane, Clock
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/pagination';

interface Interview {
    id: number;
    interviewer_title: string;
    interview_date: string;
    interview_registration_deadline: string;
    company: { name: string } | null;
    accepting_organization: { name: string } | null;
    details_count: number;
}

interface DepartedStudent {
    name: string;
    company: string | null;
    organization: string | null;
    date: string | null;
}
interface Summary {
    total_passed: number;
    departed_count: number;
    not_departed_count: number;
    departed_students: DepartedStudent[];
}
interface Props {
    interviews: {
        data: Interview[];
        links: any[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: { search: string };
    summary: Summary;
}

export default function InterviewIndex({ interviews, filters, summary }: Props) {
    const [search, setSearch] = useState(filters?.search || '');

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Wawancara', href: '#' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Menggunakan string URL manual
        router.get('/admin/interviews', { search }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Wawancara" />

            <div className="flex flex-col gap-6 p-4 lg:p-8">
                {/* HEADER & ACTIONS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Jadwal Wawancara</h1>
                        <p className="text-sm text-muted-foreground">Kelola jadwal interview siswa dengan perusahaan Jepang.</p>
                    </div>
                    <Link href="/admin/interviews/create">
                        <Button className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-sm transition-colors">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Wawancara
                        </Button>
                    </Link>
                </div>

                {/* RINGKASAN KELULUSAN & KEBERANGKATAN */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:col-span-1">
                        <div className="rounded-2xl border border-sidebar-border bg-background p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <GraduationCap size={15} className="text-purple-600" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Total Lulus</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold tabular-nums">{summary.total_passed}</p>
                        </div>
                        <div className="rounded-2xl border border-sidebar-border bg-background p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Plane size={15} className="text-sky-600" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Sudah Berangkat</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-sky-600">{summary.departed_count}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                <Clock size={15} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Lulus, Belum Berangkat</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">{summary.not_departed_count}</p>
                        </div>
                    </div>

                    {/* Daftar siswa yang sudah berangkat */}
                    <div className="rounded-2xl border border-sidebar-border bg-background p-5 shadow-sm lg:col-span-2">
                        <div className="mb-3 flex items-center gap-2">
                            <Plane size={15} className="text-sky-600" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                                Siswa Sudah Berangkat ({summary.departed_students.length})
                            </p>
                        </div>
                        {summary.departed_students.length > 0 ? (
                            <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
                                {summary.departed_students.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-sidebar-border px-3 py-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                                                {s.name.charAt(0)}
                                            </span>
                                            <span className="truncate text-sm font-medium">{s.name}</span>
                                        </div>
                                        <span className="shrink-0 truncate text-[11px] text-muted-foreground font-japanese" title={`${s.company ?? ''} ${s.organization ?? ''}`}>
                                            {s.company || s.organization || '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-6 text-center text-sm italic text-muted-foreground">Belum ada siswa yang berangkat.</p>
                        )}
                    </div>
                </div>

                {/* SEARCH BAR */}
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama perusahaan..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                {/* TABLE */}
                <div className="rounded-xl border border-sidebar-border bg-background overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-sidebar-border">
                                <tr>
                                    <th className="px-4 py-3">Perusahaan & Lokasi</th>
                                    <th className="px-4 py-3 text-center">Tgl Wawancara</th>
                                    <th className="px-4 py-3 text-center">Deadline Daftar</th>
                                    <th className="px-4 py-3 text-center">Pendaftar</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {interviews?.data?.length > 0 ? interviews.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{item.interviewer_title}</span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Building2 size={10} /> {item.company?.name || 'Perusahaan N/A'} 
                                                    <span className="mx-1">•</span> 
                                                    {item.accepting_organization?.name || 'AO N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Badge variant="outline" className="font-mono text-[10px]">
                                                {item.interview_date}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs text-muted-foreground">{item.interview_registration_deadline}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-black text-blue-600">{item.details_count}</span>
                                                <span className="text-[9px] uppercase font-bold text-muted-foreground">Siswa</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/interviews/${item.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                                        <Eye size={16} />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/interviews/${item.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600">
                                                        <Edit size={16} />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">
                                            Belum ada jadwal wawancara yang dibuat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    links={interviews.links}
                    from={interviews.from}
                    to={interviews.to}
                    total={interviews.total}
                    label="wawancara"
                />
            </div>
        </AppLayout>
    );
}