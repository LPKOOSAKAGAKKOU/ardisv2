import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { 
    ArrowLeft, Users, Trophy, Hourglass, 
    Search, GraduationCap, Building2, CalendarDays, 
    UserCheck, UserMinus, History
} from 'lucide-react';
import { useState, useMemo } from 'react';

// Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
    recruitment: {
        id: number;
        name: string;
        date: string;
        type: string;
        is_active: boolean;
    };
    students: any[];
    stats: {
        total_students: number;
        passed_count: number;
        waiting_count: number;
    };
}

export default function RecruitmentShow({ recruitment, students, stats }: Props) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'LULUS SELEKSI' | 'BELUM LULUS'>('ALL');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Perekrutan', href: '/admin/recruitments' },
        { title: recruitment.name, href: `/admin/recruitments/${recruitment.id}` },
    ];

    // Logika Filter & Search
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) || 
                                 s.nik.includes(search);
            const matchesStatus = filterStatus === 'ALL' || s.interview_status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [search, filterStatus, students]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Angkatan - ${recruitment.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => router.get('/admin/recruitments')}
                            className="rounded-full"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight uppercase">{recruitment.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                    {recruitment.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-medium">
                                    Pelaksanaan: {new Date(recruitment.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard 
                        title="Total Siswa" 
                        value={stats.total_students} 
                        icon={<Users className="size-5 text-blue-500" />} 
                        active={filterStatus === 'ALL'}
                        onClick={() => setFilterStatus('ALL')}
                    />
                    <StatCard 
                        title="Lulus Seleksi" 
                        value={stats.passed_count} 
                        icon={<Trophy className="size-5 text-emerald-500" />} 
                        active={filterStatus === 'LULUS SELEKSI'}
                        onClick={() => setFilterStatus('LULUS SELEKSI')}
                    />
                    <StatCard 
                        title="Belum Lulus" 
                        value={stats.waiting_count} 
                        icon={<Hourglass className="size-5 text-orange-500" />} 
                        active={filterStatus === 'BELUM LULUS'}
                        onClick={() => setFilterStatus('BELUM LULUS')}
                    />
                </div>

                {/* Students Table Section */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari NIK atau nama siswa..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <Users size={14} /> {filteredStudents.length} Siswa ditemukan
                        </div>
                    </div>

                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[300px]">Informasi Siswa</TableHead>
                                    <TableHead>Kelas Saat Ini</TableHead>
                                    <TableHead>Riwayat Guru</TableHead>
                                    <TableHead>Status Seleksi</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student) => (
                                    <TableRow key={student.id} className="group">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm uppercase leading-none mb-1 group-hover:text-blue-600 transition-colors">
                                                    {student.full_name}
                                                </span>
                                                <span className="text-[10px] font-mono text-muted-foreground tracking-tighter">
                                                    NIK: {student.nik} • {student.gender}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap size={14} className="text-muted-foreground" />
                                                    <span className="text-xs font-bold uppercase">{student.current_class}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground ml-5">{student.class_level}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex -space-x-2 overflow-hidden cursor-help">
                                                            {student.all_teachers.length > 0 ? (
                                                                student.all_teachers.map((t: string, i: number) => (
                                                                    <div key={i} className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[8px] font-bold uppercase">
                                                                        {t.substring(0, 2)}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground italic">Belum ada riwayat</span>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-[10px] font-bold uppercase">Daftar Sensei:</p>
                                                        <ul className="text-[10px]">
                                                            {student.all_teachers.map((t: string, i: number) => <li key={i}>• {t}</li>)}
                                                        </ul>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>
                                            {student.interview_status === 'LULUS SELEKSI' ? (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <div className="flex items-center gap-2 cursor-pointer group/badge">
                                                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[9px] font-black tracking-widest">
                                                                LULUS
                                                            </Badge>
                                                            <Building2 size={12} className="text-emerald-500 opacity-50 group-hover/badge:opacity-100 transition-opacity" />
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-64 p-4">
                                                        <div className="space-y-3">
                                                            <h4 className="font-bold text-xs uppercase text-emerald-600 border-b pb-2">Detail Kontrak Kerja</h4>
                                                            <div className="space-y-2">
                                                                <p className="text-[10px] font-black leading-tight">{student.passed_job?.company_name}</p>
                                                                <p className="text-[9px] font-medium text-muted-foreground italic">{student.passed_job?.company_japanese}</p>
                                                                <div className="flex items-center gap-2 pt-1">
                                                                    <Badge variant="secondary" className="text-[8px] uppercase">{student.passed_job?.job_type}</Badge>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                                                                    <CalendarDays size={10} /> 
                                                                    <span>Wawancara: {new Date(student.passed_job?.interview_date).toLocaleDateString('id-ID')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] font-black tracking-widest text-muted-foreground">
                                                        WAITING
                                                    </Badge>
                                                    <span className="text-[9px] font-bold text-muted-foreground">{student.total_interviews}x Gagal</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-[10px] font-bold uppercase"
                                                onClick={() => router.get(`/admin/students/${student.id}`)}
                                            >
                                                Profil <ChevronRight size={14} className="ml-1" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon, active, onClick }: { title: string; value: any; icon: React.ReactNode; active: boolean; onClick: () => void }) {
    return (
        <div 
            className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${active ? 'border-blue-500 bg-blue-50/10 shadow-sm' : 'border-sidebar-border/70 bg-card'}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-muted-foreground'}`}>{title}</span>
                    <span className="text-3xl font-black mt-1 tracking-tighter">{value}</span>
                </div>
                <div className={`rounded-xl p-3 ${active ? 'bg-blue-100/50' : 'bg-muted'}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function ChevronRight(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
}