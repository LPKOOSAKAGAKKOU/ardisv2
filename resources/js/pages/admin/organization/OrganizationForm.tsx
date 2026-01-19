import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Building2, Globe, Phone, Mail, User, MapPin } from 'lucide-react';

interface Props {
    organization?: any; // Jika ada, berarti mode EDIT
}

export default function OrganizationForm({ organization }: Props) {
    const isEdit = !!organization;

    const { data, setData, post, patch, processing, errors } = useForm({
        name: organization?.name || '',
        name_in_japanese: organization?.name_in_japanese || '',
        type: organization?.type || '',
        address: organization?.address || '',
        address_in_japanese: organization?.address_in_japanese || '',
        phone: organization?.phone || '',
        email: organization?.email || '',
        pic_name: organization?.pic_name || '',
    });

    const breadcrumbs = [
        { title: 'Organisasi Penerima', href: '/admin/organizations' },
        { title: isEdit ? 'Edit Organisasi' : 'Tambah Organisasi', href: '#' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            patch(`/admin/organizations/${organization.id}`);
        } else {
            post('/admin/organizations');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Organisasi' : 'Tambah Organisasi'} />
            
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <div className="mb-6 flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{isEdit ? 'Edit Data Organisasi' : 'Tambah Organisasi Baru'}</h1>
                        <p className="text-sm text-muted-foreground">Kelola detail Kumiai (Kanri Dantai) atau TSK (Supporting Organization).</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-sidebar-border shadow-sm">
                    
                    {/* SECTION: IDENTITAS UTAMA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Building2 size={12} /> Nama Organisasi (Kumiai/TSK)
                            </label>
                            <Input 
                                value={data.name} 
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Masukkan nama organisasi alfabet..."
                                className="h-11"
                            />
                            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Globe size={12} /> Nama dalam Bahasa Jepang (Optional)
                            </label>
                            <Input 
                                value={data.name_in_japanese} 
                                onChange={e => setData('name_in_japanese', e.target.value)}
                                placeholder="Nama Kanji/Kana..."
                                className="h-11 font-japanese"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tipe Organisasi</label>
                            <Select value={data.type} onValueChange={(val) => setData('type', val)}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Pilih Tipe Organisasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kanri_dantai">Kanri Dantai (Program Magang)</SelectItem>
                                    <SelectItem value="tsk">TSK (Program SSW)</SelectItem>
                                    <SelectItem value="both">Keduanya (Magang & SSW)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-xs text-red-500 font-medium">{errors.type}</p>}
                        </div>
                    </div>

                    <hr className="border-sidebar-border" />

                    {/* SECTION: ALAMAT & KONTAK */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <MapPin size={12} /> Alamat di Jepang
                            </label>
                            <Textarea 
                                value={data.address} 
                                onChange={e => setData('address', e.target.value)}
                                placeholder="Alamat lengkap alfabet..."
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <MapPin size={12} /> Alamat (Bahasa Jepang)
                            </label>
                            <Textarea 
                                value={data.address_in_japanese} 
                                onChange={e => setData('address_in_japanese', e.target.value)}
                                placeholder="Alamat dalam Kanji..."
                                className="resize-none font-japanese"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Phone size={12} /> Nomor Telepon
                            </label>
                            <Input value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+81..." className="h-11" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Mail size={12} /> Email
                            </label>
                            <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="office@organization.jp" className="h-11" />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <User size={12} /> Nama PIC (Penanggung Jawab)
                            </label>
                            <Input value={data.pic_name} onChange={e => setData('pic_name', e.target.value)} placeholder="Nama PIC di Jepang..." className="h-11" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-sidebar-border">
                        <Button variant="ghost" type="button" onClick={() => window.history.back()}>Batal</Button>
                        <Button disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px] h-11 shadow-lg shadow-indigo-500/20">
                            {processing ? 'Menyimpan...' : (isEdit ? 'Update Data' : 'Simpan Organisasi')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}