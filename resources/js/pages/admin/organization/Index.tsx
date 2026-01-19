import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Plus, Search, Edit, Trash2, 
    Network, Globe, Phone, Mail, User 
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function OrganizationIndex({ organizations, filters }: any) {
    const [search, setSearch] = useState(filters?.search || '');

    // Pastikan breadcrumbs tidak memanggil route() yang rusak
    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Organisasi Penerima', href: '#' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/organizations', { search }, { preserveState: true });
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus organisasi ${name}?`)) {
            router.delete(`/admin/organizations/${id}`);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'kanri_dantai': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Kanri Dantai</Badge>;
            case 'tsk': return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">TSK</Badge>;
            default: return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Both</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Organisasi Penerima" />

            <div className="flex flex-col gap-6 p-4 lg:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
                            <Network size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Organisasi Penerima</h1>
                            <p className="text-sm text-muted-foreground">Kelola data Kumiai dan TSK di Jepang.</p>
                        </div>
                    </div>
                    <Link href="/admin/organizations/create">
                        <Button className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Organisasi
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama organisasi..."
                        className="pl-10 h-11"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-4">Nama Organisasi</th>
                                    <th className="px-6 py-4 text-center">Tipe</th>
                                    <th className="px-6 py-4">Kontak</th>
                                    <th className="px-6 py-4">PIC Jepang</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {/* Gunakan Optional Chaining ?. di sini agar tidak blank */}
                                {organizations?.data?.length > 0 ? organizations.data.map((org: any) => (
                                    <tr key={org.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-foreground text-sm">{org.name}</span>
                                                {org.name_in_japanese && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Globe size={10} /> {org.name_in_japanese}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getTypeBadge(org.type)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-[11px]">
                                                {org.phone && <span className="flex items-center gap-2"><Phone size={12} /> {org.phone}</span>}
                                                {org.email && <span className="flex items-center gap-2"><Mail size={12} /> {org.email}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs">{org.pic_name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/organizations/${org.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600">
                                                        <Edit size={16} />
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-red-600"
                                                    onClick={() => handleDelete(org.id, org.name)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground italic">
                                            Belum ada data.
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