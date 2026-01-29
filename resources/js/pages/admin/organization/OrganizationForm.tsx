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
import { 
    Building2, Globe, Phone, Mail, User, MapPin, 
    Home, UtensilsCrossed, Banknote, Info, GraduationCap,
    ArrowLeft, Save, CheckCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
        // Training Center Detail
        training_center_name: organization?.training_center_name || '',
        training_center_address: organization?.training_center_address || '',
        training_center_phone: organization?.training_center_phone || '',
        training_center_area: organization?.training_center_area || '',
        training_center_capacity: organization?.training_center_capacity || '',
        training_center_type: organization?.training_center_type || '',
        // Allowance Logic
        allowance_in_first_month: organization?.allowance_in_first_month ?? true,
        allowance_amount: organization?.allowance_amount || '60,000',
        meal_allowance: organization?.meal_allowance ?? false,
        meal_allowance_amount: organization?.meal_allowance_amount || '',
        student_pays_meal: organization?.student_pays_meal ?? false,
        student_pays_meal_amount: organization?.student_pays_meal_amount || '',
        accommodation_allowance: organization?.accommodation_allowance ?? false,
        accommodation_allowance_amount: organization?.accommodation_allowance_amount || '',
        student_pays_accommodation: organization?.student_pays_accommodation ?? false,
        student_pays_accommodation_amount: organization?.student_pays_accommodation_amount || '',
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
            
            <div className="max-w-5xl mx-auto p-4 lg:p-10 space-y-8">
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                            <Building2 size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                {isEdit ? 'Update Data Organisasi' : 'Registrasi Organisasi Baru'}
                            </h1>
                            <p className="text-sm text-muted-foreground">Kelola detail Kumiai/TSK serta fasilitas Training Center di Jepang.</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => window.history.back()} className="w-fit">
                        <ArrowLeft size={16} className="mr-2" /> Kembali
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                    
                    {/* SECTION 1: PROFIL & IDENTITAS */}
                    <div className="bg-white dark:bg-zinc-950 p-6 lg:p-8 rounded-3xl border shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold border-b pb-4 mb-2">
                            <Info size={18} />
                            <span className="uppercase tracking-widest text-xs">Informasi Profil Organisasi</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nama Organisasi (Kumiai/TSK)</label>
                                <Input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Contoh: Zenkoku Business Kumiai" className="h-12" />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-japanese text-indigo-500">日本語の名称 (Nama Jepang)</label>
                                <Input value={data.name_in_japanese} onChange={e => setData('name_in_japanese', e.target.value)} placeholder="全国ビジネス組合" className="h-12 font-japanese" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tipe Program</label>
                                <Select value={data.type} onValueChange={v => setData('type', v)}>
                                    <SelectTrigger className="h-12"><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kanri_dantai">Kanri Dantai (Program Magang)</SelectItem>
                                        <SelectItem value="tsk">TSK (Program SSW)</SelectItem>
                                        <SelectItem value="both">Keduanya (Magang & SSW)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nomor Telepon Kantor</label>
                                <Input value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+81..." className="h-12" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email Korespondensi</label>
                                <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="office@organization.jp" className="h-12" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nama PIC (Penanggung Jawab di Jepang)</label>
                                <Input value={data.pic_name} onChange={e => setData('pic_name', e.target.value)} placeholder="Masukkan nama PIC..." className="h-12" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Alamat Pusat (Alphabet)</label>
                                <Textarea value={data.address} onChange={e => setData('address', e.target.value)} placeholder="Full address in Romanji..." rows={3} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-japanese text-indigo-500">日本語の住所 (Alamat Jepang)</label>
                                <Textarea value={data.address_in_japanese} onChange={e => setData('address_in_japanese', e.target.value)} placeholder="住所を記入してください..." rows={3} className="font-japanese" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: TRAINING CENTER DETAIL */}
                    <div className="bg-white dark:bg-zinc-950 p-6 lg:p-8 rounded-3xl border shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-amber-600 font-bold border-b pb-4 mb-2">
                            <GraduationCap size={18} />
                            <span className="uppercase tracking-widest text-xs">Fasilitas Training Center (講習センター)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase">Nama TC</label>
                                <Input value={data.training_center_name} onChange={e => setData('training_center_name', e.target.value)} placeholder="Masukkan nama Training Center..." className="h-12" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase">Alamat Lengkap TC</label>
                                <Textarea value={data.training_center_address} onChange={e => setData('training_center_address', e.target.value)} placeholder="Alamat lengkap fasilitas training..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase">Telepon TC</label>
                                <Input value={data.training_center_phone} onChange={e => setData('training_center_phone', e.target.value)} placeholder="Nomor telepon TC..." className="h-12" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase">Tipe Hunian</label>
                                <Select value={data.training_center_type} onValueChange={v => setData('training_center_type', v)}>
                                    <SelectTrigger className="h-12"><SelectValue placeholder="Pilih Tipe Hunian" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="asrama">Asrama (Dormitory)</SelectItem>
                                        <SelectItem value="kos">Kos (Apartment)</SelectItem>
                                        <SelectItem value="lainnya">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase">Kapasitas (Orang)</label>
                                <Input value={data.training_center_capacity} onChange={e => setData('training_center_capacity', e.target.value)} placeholder="0" className="h-12" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase">Luas Area (m²)</label>
                                <Input value={data.training_center_area} onChange={e => setData('training_center_area', e.target.value)} placeholder="0" className="h-12" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: ALLOWANCE & COST LOGIC (SMART UX) */}
                    <div className="bg-indigo-50/50 dark:bg-zinc-900/30 p-6 lg:p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 space-y-8">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold border-b border-indigo-100 dark:border-indigo-900/50 pb-4">
                            <Banknote size={20} />
                            <span className="uppercase tracking-widest text-xs">Skema Biaya & Tunjangan Siswa</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            
                            {/* 1. UANG SAKU BULAN PERTAMA */}
                            <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-950 border shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        <Banknote className="text-emerald-600" size={18}/> 
                                        Uang Saku Bulan Pertama
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Status Tunjangan</label>
                                    <Select 
                                        value={data.allowance_in_first_month ? 'yes' : 'no'} 
                                        onValueChange={v => setData('allowance_in_first_month', v === 'yes')}
                                    >
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes">Diberikan Tunjangan</SelectItem>
                                            <SelectItem value="no">Tidak Ada Tunjangan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {data.allowance_in_first_month && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-bold text-indigo-600 uppercase">Nominal (Yen)</label>
                                        <Input value={data.allowance_amount} onChange={e => setData('allowance_amount', e.target.value)} className="h-11 mt-1 font-mono text-lg font-bold" />
                                    </div>
                                )}
                            </div>

                            {/* 2. TUNJANGAN MAKAN */}
                            <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-950 border shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        <UtensilsCrossed className="text-orange-600" size={18}/> 
                                        Skema Konsumsi (Makan)
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Siapa yang menanggung?</label>
                                    <Select 
                                        value={data.meal_allowance ? 'yes' : 'no'} 
                                        onValueChange={v => {
                                            setData(d => ({ ...d, meal_allowance: v === 'yes', student_pays_meal: v === 'no' }));
                                        }}
                                    >
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes">Ditanggung Organisasi (Tunjangan)</SelectItem>
                                            <SelectItem value="no">Siswa Membayar Sendiri</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {data.meal_allowance ? (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-bold text-indigo-600 uppercase">Nominal Tunjangan (Yen)</label>
                                        <Input value={data.meal_allowance_amount} onChange={e => setData('meal_allowance_amount', e.target.value)} placeholder="0" className="h-11 mt-1 font-mono" />
                                    </div>
                                ) : (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter italic">Estimasi Pengeluaran Siswa (Yen)</label>
                                        <Input value={data.student_pays_meal_amount} onChange={e => setData('student_pays_meal_amount', e.target.value)} placeholder="Masukkan angka..." className="h-11 mt-1 border-rose-100 focus-visible:ring-rose-500 font-mono" />
                                    </div>
                                )}
                            </div>

                            {/* 3. TUNJANGAN AKOMODASI */}
                            <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-950 border shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        <Home className="text-blue-600" size={18}/> 
                                        Skema Tempat Tinggal
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Status Akomodasi</label>
                                    <Select 
                                        // Kita gunakan logic: jika keduanya false, berarti "Gratis Penuh"
                                        value={
                                            data.accommodation_allowance ? 'allowance' : 
                                            data.student_pays_accommodation ? 'pay' : 'free'
                                        } 
                                        onValueChange={v => {
                                            if (v === 'allowance') {
                                                setData(d => ({ ...d, accommodation_allowance: true, student_pays_accommodation: false }));
                                            } else if (v === 'pay') {
                                                setData(d => ({ ...d, accommodation_allowance: false, student_pays_accommodation: true }));
                                            } else {
                                                // Gratis Penuh: Set keduanya false, nominal dikosongkan/0
                                                setData(d => ({ 
                                                    ...d, 
                                                    accommodation_allowance: false, 
                                                    student_pays_accommodation: false,
                                                    accommodation_allowance_amount: '0',
                                                    student_pays_accommodation_amount: '0'
                                                }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">Gratis Penuh (Disediakan Organisasi)</SelectItem>
                                            <SelectItem value="allowance">Diberikan Tunjangan Uang Sewa</SelectItem>
                                            <SelectItem value="pay">Siswa Membayar Sewa Mandiri</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* TAMPILKAN INPUT HANYA JIKA BUKAN GRATIS PENUH */}
                                {data.accommodation_allowance && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-bold text-indigo-600 uppercase">Nominal Tunjangan Sewa (Yen)</label>
                                        <Input 
                                            value={data.accommodation_allowance_amount} 
                                            onChange={e => setData('accommodation_allowance_amount', e.target.value)} 
                                            placeholder="0" 
                                            className="h-11 mt-1 font-mono" 
                                        />
                                    </div>
                                )}

                                {data.student_pays_accommodation && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter italic">Biaya Sewa Ditanggung Siswa (Yen)</label>
                                        <Input 
                                            value={data.student_pays_accommodation_amount} 
                                            onChange={e => setData('student_pays_accommodation_amount', e.target.value)} 
                                            placeholder="Masukkan angka..." 
                                            className="h-11 mt-1 border-rose-100 focus-visible:ring-rose-500 font-mono" 
                                        />
                                    </div>
                                )}

                                {/* FEEDBACK VISUAL UNTUK GRATIS PENUH */}
                                {!data.accommodation_allowance && !data.student_pays_accommodation && (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300">
                                        <div className="p-1.5 bg-emerald-500 rounded-full text-white">
                                            <CheckCircle size={12} />
                                        </div>
                                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Akomodasi Gratis Tanpa Biaya/Potongan</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center p-6 bg-indigo-600/5 rounded-2xl border border-indigo-200/50">
                                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full mr-4">
                                    <Info size={20} />
                                </div>
                                <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
                                    Sistem akan secara otomatis menyembunyikan opsi "Bayar Sendiri" jika Anda memilih untuk memberikan tunjangan penuh kepada siswa.
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* FORM ACTIONS */}
                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-sidebar-border">
                        <Button variant="ghost" type="button" onClick={() => window.history.back()} className="h-12 px-8 rounded-2xl font-bold">
                            Batal
                        </Button>
                        <Button disabled={processing} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 rounded-2xl h-12 shadow-xl shadow-indigo-500/30 font-bold transition-all active:scale-95">
                            {processing ? 'Menyimpan Data...' : (
                                <span className="flex items-center gap-2">
                                    <Save size={18} />
                                    {isEdit ? 'Update Data Organisasi' : 'Simpan Organisasi'}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}