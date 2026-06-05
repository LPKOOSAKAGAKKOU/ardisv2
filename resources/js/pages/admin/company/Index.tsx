import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Plus, Search, Edit, Trash2, 
    Factory, Globe, Phone, Mail, User, MapPin, ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Company {
    id: number;
    name: string;
    name_in_japanese: string | null;
    industry: string;
    prefecture: string | null;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
}

interface Props {
    companies: {
        data: Company[];
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        current_page: number;
        total: number;
        per_page: number;
    };
    filters: { search: string };
}

export default function CompanyIndex({ companies, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Perusahaan', href: '#' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/companies', { search }, { preserveState: true });
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Hapus perusahaan ${name}? Ini juga akan mengecek keterkaitan dengan jadwal wawancara.`)) {
            router.delete(`/admin/companies/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Perusahaan Jepang" />

            <div className="flex flex-col gap-6 p-4 lg:p-8">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-600 rounded-xl shadow-lg shadow-amber-500/20 text-white">
                            <Factory size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Perusahaan Penerima</h1>
                            <p className="text-sm text-muted-foreground">Daftar Jisshu Saki / Perusahaan di Jepang yang bekerjasama.</p>
                        </div>
                    </div>
                    <Link href="/admin/companies/create">
                        <Button className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Perusahaan
                        </Button>
                    </Link>
                </div>

                {/* SEARCH BAR */}
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama, industri, atau prefektur..."
                        className="pl-10 h-11"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                {/* TABLE CONTAINER */}
                <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-4">Nama Perusahaan</th>
                                    <th className="px-6 py-4">Industri</th>
                                    <th className="px-6 py-4 text-center">Prefektur</th>
                                    <th className="px-6 py-4">Kontak / PIC</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {companies?.data?.length > 0 ? companies.data.map((company) => (
                                    <tr key={company.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-foreground">{company.name}</span>
                                                {company.name_in_japanese && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-japanese">
                                                        <Globe size={10} /> {company.name_in_japanese}
                                                    </span>
                                                )}
                                                {company.website && (
                                                    <a href={company.website} target="_blank" className="text-[10px] text-blue-500 flex items-center gap-1 hover:underline">
                                                        <ExternalLink size={10} /> Visit Website
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="font-medium">
                                                {company.industry}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                <MapPin size={12} className="text-red-500" />
                                                {company.prefecture || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-[11px]">
                                                {company.contact_person && (
                                                    <span className="flex items-center gap-2 font-medium">
                                                        <User size={12} className="text-amber-600"/> {company.contact_person}
                                                    </span>
                                                )}
                                                <div className="flex gap-3 text-muted-foreground">
                                                    {company.phone && <span className="flex items-center gap-1"><Phone size={10}/> {company.phone}</span>}
                                                    {company.email && <span className="flex items-center gap-1"><Mail size={10}/> {company.email}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/companies/${company.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50">
                                                        <Edit size={16} />
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(company.id, company.name)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground italic">
                                            Data perusahaan belum tersedia.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col items-center justify-between gap-4 px-2 md:flex-row">
                    <p className="text-sm text-muted-foreground">
                        Menampilkan {companies?.data?.length || 0} dari {companies?.total || 0} perusahaan
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {companies?.links?.map((link, i) => (
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