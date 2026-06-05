import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Search, School, UserCircle, Calendar, GraduationCap } from 'lucide-react';
import { useState } from 'react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
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
import Pagination from '@/components/pagination';

interface Props {
    classrooms: any;
    teachers: any[];
    filters: {
        search: string;
    };
}

export default function AdminClassroomIndex({ classrooms, teachers, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Manajemen Kelas', href: '/admin/classrooms' },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        teacher_id: '',
        level: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Menggunakan string path langsung
        router.get('/admin/classrooms', { search: searchQuery }, { preserveState: true });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Menggunakan string path langsung
        post('/admin/classrooms', {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    const levels = [
        'ATARASHII', 'N5', 'N4', 'N3', 'N2', 'N1', 
        'Pra-Pemberangkatan', 'Pra-Pemberangkatan Kaigo'
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Kelas" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header & Stats Section */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Kelas" value={classrooms.total} icon={<School className="size-4" />} />
                    <StatCard title="Siswa Aktif" value="-" icon={<GraduationCap className="size-4" />} />
                    <StatCard title="Total Pengajar" value={teachers.length} icon={<UserCircle className="size-4" />} />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                    
                    {/* Toolbar: Search & Add Button */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <form onSubmit={handleSearch} className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari kelas atau nama guru..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full md:w-auto">
                                    <Plus className="mr-2 size-4" /> Buka Kelas Baru
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <form onSubmit={submit}>
                                    <DialogHeader>
                                        <DialogTitle>Buat Kelas Baru</DialogTitle>
                                        <DialogDescription>
                                            Admin dapat membuat kelas dan langsung menugaskan pengajar (Sensei).
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Nama Kelas</Label>
                                            <Input
                                                id="name"
                                                placeholder="Contoh: Kelas Sakura 01"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                            />
                                            {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="teacher">Pilih Pengajar (Sensei)</Label>
                                            <Select onValueChange={(val) => setData('teacher_id', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Sensei" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {teachers.map((t) => (
                                                        <SelectItem key={t.id} value={t.id.toString()}>
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.teacher_id && <span className="text-xs text-destructive">{errors.teacher_id}</span>}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="level">Level/Tingkatan</Label>
                                            <Select onValueChange={(val) => setData('level', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {levels.map((lvl) => (
                                                        <SelectItem key={lvl} value={lvl}>
                                                            {lvl}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.level && <span className="text-xs text-destructive">{errors.level}</span>}
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button type="submit" disabled={processing}>
                                            Simpan & Buka Kelas
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Table Section */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Kelas</TableHead>
                                    <TableHead>Pengajar</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead className="text-center">Siswa Aktif</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classrooms.data.length > 0 ? (
                                    classrooms.data.map((classroom: any) => (
                                        <TableRow key={classroom.id}>
                                            <TableCell className="font-medium">{classroom.name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{classroom.teacher?.name || 'N/A'}</span>
                                                    <span className="text-xs text-muted-foreground">ID: {classroom.teacher_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{classroom.level}</TableCell>
                                            <TableCell className="text-center">{classroom.students_count}</TableCell>
                                            <TableCell>
                                                <Badge variant={classroom.status === 'active' ? 'default' : 'secondary'}>
                                                    {classroom.status === 'active' ? 'Aktif' : 'Selesai'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => router.get(`/admin/classrooms/${classroom.id}`)}
                                                >
                                                    Detail Kelas
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Tidak ada data kelas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <div className="mt-4">
                        <Pagination
                            links={classrooms?.links}
                            from={classrooms?.from}
                            to={classrooms?.to}
                            total={classrooms?.total}
                            label="kelas"
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon }: { title: string; value: any; icon: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {icon}
                <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}