import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Factory, Globe, Phone, Mail, User, MapPin, Laptop } from 'lucide-react';

interface Props {
    company?: any;
}

export default function CompanyForm({ company }: Props) {
    const isEdit = !!company;

    const { data, setData, post, patch, processing, errors } = useForm({
        name: company?.name || '',
        name_in_japanese: company?.name_in_japanese || '',
        industry: company?.industry || '',
        address: company?.address || '',
        address_in_japanese: company?.address_in_japanese || '',
        prefecture: company?.prefecture || '',
        contact_person: company?.contact_person || '',
        phone: company?.phone || '',
        email: company?.email || '',
        website: company?.website || '',
    });

    const breadcrumbs = [
        { title: 'Data Perusahaan', href: '/admin/companies' },
        { title: isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan', href: '#' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        isEdit ? patch(`/admin/companies/${company.id}`) : post('/admin/companies');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan'} />
            
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <div className="mb-6 flex items-center gap-4">
                    <div className="p-3 bg-amber-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
                        <Factory size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}</h1>
                        <p className="text-sm text-muted-foreground">Detail perusahaan penerima (Jisshu Saki) di Jepang.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-sidebar-border shadow-sm">
                    
                    {/* IDENTITAS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">Nama Perusahaan (Alfabet)</label>
                            <Input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Contoh: Tanaka Kensetsu Co., Ltd." className="h-11" />
                            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">Nama (Bahasa Jepang)</label>
                            <Input value={data.name_in_japanese} onChange={e => setData('name_in_japanese', e.target.value)} placeholder="株式会社田中建設" className="h-11 font-japanese" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Sektor Industri</label>
                            <Input value={data.industry} onChange={e => setData('industry', e.target.value)} placeholder="Contoh: Kaigo, Konstruksi, dll" className="h-11" />
                            {errors.industry && <p className="text-xs text-red-500 font-medium">{errors.industry}</p>}
                        </div>
                    </div>

                    <hr className="border-sidebar-border" />

                    {/* LOKASI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><MapPin size={12} /> Prefektur</label>
                            <Input value={data.prefecture} onChange={e => setData('prefecture', e.target.value)} placeholder="Contoh: Tokyo, Osaka, Saitama..." className="h-11" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Laptop size={12} /> Website</label>
                            <Input value={data.website} onChange={e => setData('website', e.target.value)} placeholder="https://www.tanaka.co.jp" className="h-11" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Alamat Alfabet</label>
                            <Textarea value={data.address} onChange={e => setData('address', e.target.value)} className="resize-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Alamat Kanji</label>
                            <Textarea value={data.address_in_japanese} onChange={e => setData('address_in_japanese', e.target.value)} className="resize-none font-japanese" />
                        </div>
                    </div>

                    <hr className="border-sidebar-border" />

                    {/* KONTAK */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><User size={12} /> PIC Perusahaan</label>
                            <Input value={data.contact_person} onChange={e => setData('contact_person', e.target.value)} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Phone size={12} /> Telepon</label>
                            <Input value={data.phone} onChange={e => setData('phone', e.target.value)} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Mail size={12} /> Email</label>
                            <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="h-11" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-sidebar-border">
                        <Button variant="ghost" type="button" onClick={() => window.history.back()}>Batal</Button>
                        <Button disabled={processing} className="bg-amber-600 hover:bg-amber-700 text-white min-w-[150px] h-11">
                            {processing ? 'Menyimpan...' : (isEdit ? 'Update Perusahaan' : 'Simpan Perusahaan')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}