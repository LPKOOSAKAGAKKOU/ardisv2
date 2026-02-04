import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Plus, Search, Edit, Eye, 
    Building2, Calendar, 
    Users
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Interview {
    id: number;
    interviewer_title: string;
    interview_date: string;
    interview_registration_deadline: string;
    company: { name: string } | null;
    accepting_organization: { name: string } | null;
    details_count: number;
}

interface Props {
    interviews: {
        data: Interview[];
        links: any[];
    };
    filters: { search: string };
}

export default function InterviewIndex({ interviews, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');

    const breadcrumbs = [
        { title: 'Dashboard', href: '/sensei/dashboard' },
        { title: 'Data Wawancara', href: '#' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Menggunakan string URL manual
        router.get('/sensei/interviews', { search }, { preserveState: true });
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
                                                <Link href={`/sensei/interviews/${item.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                                        <Eye size={16} />
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
            </div>
        </AppLayout>
    );
}