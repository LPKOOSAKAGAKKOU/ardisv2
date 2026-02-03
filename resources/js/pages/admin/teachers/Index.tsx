import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { 
    GraduationCap, 
    Plus, 
    Search, 
    Pencil, 
    Trash2, 
    Phone, 
    Mail 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import TeacherForm from './TeacherForm'; // Pastikan file TeacherForm.tsx ada di folder yang sama

export default function TeacherIndex({ teachers, filters }: any) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Guru', href: '#' },
    ];

    // Handle Search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/teachers', { search }, { preserveState: true });
    };

    // Handle Delete
    const handleDelete = (id: number, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus Sensei ${name}?`)) {
            router.delete(`/admin/teachers/${id}`);
        }
    };

    // Handle Open Modal Create
    const handleAdd = () => {
        setSelectedTeacher(null);
        setIsFormOpen(true);
    };

    // Handle Open Modal Edit
    const handleEdit = (teacher: any) => {
        setSelectedTeacher(teacher);
        setIsFormOpen(true);
    };

    // Badge Helper (Clean Style)
    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'bahasa_jepang': 
                return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Bahasa Jepang</Badge>;
            case 'kaigo': 
                return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Kaigo</Badge>;
            case 'kensetsu': 
                return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Kensetsu</Badge>;
            case 'budaya': 
                return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Budaya</Badge>;
            default: 
                return <Badge variant="outline" className="text-zinc-600 border-zinc-200 bg-zinc-50">{type}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Guru & Sensei" />

            <div className="flex flex-col gap-6 p-4 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-neutral-900 dark:bg-white rounded-xl shadow-lg text-white dark:text-black">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Data Guru (Sensei)</h1>
                            <p className="text-sm text-muted-foreground">Kelola instruktur dan akun login pengajar.</p>
                        </div>
                    </div>
                    
                    {/* Tombol Tambah memicu Modal */}
                    <Button 
                        onClick={handleAdd}
                        className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Sensei
                    </Button>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama atau NIP..."
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
                                    <th className="px-6 py-4">Nama & NIP</th>
                                    <th className="px-6 py-4 text-center">Spesialisasi</th>
                                    <th className="px-6 py-4">Kontak</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {teachers.length > 0 ? teachers.map((teacher: any) => (
                                    <tr key={teacher.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-foreground text-sm">{teacher.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    NIP: {teacher.nip || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 text-center">
                                            {getTypeBadge(teacher.type)}
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                                                {teacher.email && (
                                                    <span className="flex items-center gap-2">
                                                        <Mail size={12} /> {teacher.email}
                                                    </span>
                                                )}
                                                {teacher.phone_number && (
                                                    <span className="flex items-center gap-2">
                                                        <Phone size={12} /> {teacher.phone_number}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            {teacher.is_active ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
                                                    Aktif
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 hover:bg-zinc-200 border-none">
                                                    Nonaktif
                                                </Badge>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                    onClick={() => handleEdit(teacher)}
                                                >
                                                    <Pencil size={16} />
                                                </Button>
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(teacher.id, teacher.name)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground italic">
                                            Belum ada data guru.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            <TeacherForm 
                open={isFormOpen} 
                setOpen={setIsFormOpen} 
                teacher={selectedTeacher} 
            />
        </AppLayout>
    );
}