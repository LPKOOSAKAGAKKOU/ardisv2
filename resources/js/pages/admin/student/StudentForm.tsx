import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { 
    User as UserIcon, Activity, GraduationCap, Briefcase, 
    Users as FamilyIcon, ChevronRight, ChevronLeft, Plus, Trash2, Save,
    ShieldCheck, HeartPulse, FileText, Target, Info, MapPin
} from 'lucide-react';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface Props {
    student?: any;
    provinces: { id: number; name: string }[];
    jobSectors: { id: number; name: string; code: string }[];
}

export default function StudentForm({ student, provinces, jobSectors }: Props) {
    const [step, setStep] = useState(1);
    const isEdit = !!student;

    const { data, setData, post, put, processing, errors } = useForm({
        // 1. Akun & Identitas
        email: student?.user?.email || '',
        nik: student?.nik || '',
        full_name: student?.full_name || '',
        full_name_katakana: student?.full_name_katakana || '',
        pob: student?.pob || '',
        pob_province: student?.pob_province || '',
        dob: student?.dob || '',
        gender: student?.gender || 'Laki-laki',
        address_ktp: student?.address_ktp || '',
        phone_student: student?.phone_student || '',
        phone_parent: student?.phone_parent || '',

        // 2. Fisik & Medis
        tattoo: student?.tattoo || 'tidak',
        smoking: student?.smoking || 'tidak merokok',
        alcohol: student?.alcohol || 'tidak minum',
        family_in_japan: student?.family_in_japan || 'tidak',
        height: student?.height || '',
        weight: student?.weight || '',
        blood_type: student?.blood_type || 'O',
        religion: student?.religion || 'Islam',
        marital_status: student?.marital_status || 'Belum Menikah',
        tbc_history: student?.tbc_history || 'tidak',
        color_blind: student?.color_blind || 'normal',
        other_illness: student?.other_illness || '',

        // 3. Paspor & Dokumen
        has_passport: student?.has_passport || 'tidak',
        passport_number: student?.passport_number || '',
        passport_issue_date: student?.passport_issue_date || '',
        passport_expiry_date: student?.passport_expiry_date || '',

        // 4. Data LPK Internal
        class_level: student?.class_level || '',
        program_expert: student?.program_expert || '',
        entry_date_lpk: student?.entry_date_lpk || '',
        strength: student?.strength || '',
        weakness: student?.weakness || '',
        skill_technical: student?.skill_technical || '',
        hobby: student?.hobby || '',
        savings_target: student?.savings_target || '',
        savings_reason: student?.savings_reason || '',
        student_status: student?.student_status || 'pelatihan',

        // Arrays
        educations: student?.educations || [],
        experiences: student?.experiences || [],
        families: student?.families || [],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Pastikan menggunakan fungsi route() agar otomatis terhubung ke Laravel
        if (isEdit) {
            // Rute otomatis: admin.students.update
            put(route('admin.students.update', student.id), {
                preserveScroll: true,
                onSuccess: () => alert('Data berhasil diperbarui!'),
            });
        } else {
            // Rute otomatis: admin.students.store
            post(route('admin.students.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    // Berhasil disimpan, Inertia otomatis redirect sesuai Controller
                },
                onError: (errors) => {
                    // JIKA DIAM SAJA, CEK LOG INI DI CONSOLE (F12)
                    console.error("Gagal Simpan. Cek validasi:", errors);
                    alert("Gagal menyimpan. Pastikan NIK/Email belum terdaftar.");
                }
            });
        }
    };

    const addEducation = () => {
        setData('educations', [...data.educations, { level: 'SMA/SMK', school_name: '', school_type: 'Negeri', major: '', entry_date: '', graduation_date: '' }]);
    };

    const addExperience = () => {
        setData('experiences', [...data.experiences, { company_name: '', job_type: '', monthly_salary: '', start_date: '', end_date: '' }]);
    };

    const addFamily = () => {
        setData('families', [...data.families, { relationship: '', name: '', age: '', occupation: '' }]);
    };

    const removeRow = (field: 'educations' | 'experiences' | 'families', idx: number) => {
        const updated = [...data[field]];
        updated.splice(idx, 1);
        setData(field, updated);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Data Siswa', href: '/admin/students' }, { title: isEdit ? 'Edit' : 'Tambah', href: '#' }]}>
            <Head title={isEdit ? 'Edit Siswa' : 'Siswa Baru'} />
            
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {isEdit ? 'Perbarui Data Siswa' : 'Registrasi Siswa Baru'}
                        </h1>
                        <p className="text-muted-foreground mt-1">Lengkapi seluruh informasi dokumen dan data pribadi siswa.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded-lg border border-border">
                        <StepBadge step={1} current={step} icon={<UserIcon size={16}/>} />
                        <StepBadge step={2} current={step} icon={<HeartPulse size={16}/>} />
                        <StepBadge step={3} current={step} icon={<GraduationCap size={16}/>} />
                        <StepBadge step={4} current={step} icon={<Briefcase size={16}/>} />
                        <StepBadge step={5} current={step} icon={<FamilyIcon size={16}/>} />
                    </div>
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* STEP 1: IDENTITAS */}
                        {step === 1 && (
                            <Card className="shadow-sm border-border">
                                <CardHeader>
                                    <CardTitle className="flex gap-2 items-center text-blue-600"><ShieldCheck size={20}/> Identitas Utama</CardTitle>
                                    <CardDescription>Data login akun dan informasi identitas sesuai KTP.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormItem label="NIK" error={errors.nik}>
                                            <Input value={data.nik} onChange={e => setData('nik', e.target.value)} placeholder="16 digit NIK" />
                                        </FormItem>
                                        <FormItem label="Email Akun" error={errors.email}>
                                            <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="email@siswa.com" />
                                        </FormItem>
                                        <FormItem label="Nama Lengkap"><Input value={data.full_name} onChange={e => setData('full_name', e.target.value)} /></FormItem>
                                        <FormItem label="Nama Katakana"><Input value={data.full_name_katakana} onChange={e => setData('full_name_katakana', e.target.value)} placeholder="フリガナ" /></FormItem>
                                        <FormItem label="Tempat Lahir"><Input value={data.pob} onChange={e => setData('pob', e.target.value)} /></FormItem>
                                        <FormItem label="Provinsi Lahir"><Input value={data.pob_province} onChange={e => setData('pob_province', e.target.value)} /></FormItem>
                                        <FormItem label="Tgl Lahir"><Input type="date" value={data.dob} onChange={e => setData('dob', e.target.value)} /></FormItem>
                                        <FormItem label="Jenis Kelamin">
                                            <Select value={data.gender} onValueChange={v => setData('gender', v as any)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Perempuan">Perempuan</SelectItem></SelectContent>
                                            </Select>
                                        </FormItem>
                                        <FormItem label="HP Siswa"><Input value={data.phone_student} onChange={e => setData('phone_student', e.target.value)} /></FormItem>
                                        <FormItem label="HP Orang Tua"><Input value={data.phone_parent} onChange={e => setData('phone_parent', e.target.value)} /></FormItem>
                                    </div>
                                    <FormItem label="Alamat KTP"><Textarea value={data.address_ktp} onChange={e => setData('address_ktp', e.target.value)} rows={3} /></FormItem>
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 2: FISIK & MEDIS */}
                        {step === 2 && (
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex gap-2 items-center text-red-600"><HeartPulse size={20}/> Fisik & Kesehatan</CardTitle>
                                    <CardDescription>Data kondisi fisik dan riwayat kesehatan siswa.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <FormItem label="Tinggi (cm)"><Input type="number" value={data.height} onChange={e => setData('height', e.target.value)} /></FormItem>
                                        <FormItem label="Berat (kg)"><Input type="number" value={data.weight} onChange={e => setData('weight', e.target.value)} /></FormItem>
                                        <FormItem label="Gol. Darah">
                                            <Select value={data.blood_type} onValueChange={v => setData('blood_type', v as any)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{['A','B','O','AB'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </FormItem>
                                        <FormItem label="Agama">
                                            <Select value={data.religion} onValueChange={v => setData('religion', v as any)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{['Islam','Kristen','Katholik','Hindu','Budha','Kong Hu Chu'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </FormItem>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-xl bg-muted/20">
                                        <FormItem label="Tato"><Select value={data.tattoo} onValueChange={v => setData('tattoo', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ada">Ada</SelectItem><SelectItem value="tidak">Tidak</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Merokok"><Select value={data.smoking} onValueChange={v => setData('smoking', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="merokok">Ya</SelectItem><SelectItem value="tidak merokok">Tidak</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Alkohol"><Select value={data.alcohol} onValueChange={v => setData('alcohol', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minum">Ya</SelectItem><SelectItem value="tidak minum">Tidak</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Status Nikah"><Select value={data.marital_status} onValueChange={v => setData('marital_status', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent>{['Belum Menikah','Menikah','Cerai','Cerai Mati'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></FormItem>
                                        <FormItem label="Buta Warna"><Select value={data.color_blind} onValueChange={v => setData('color_blind', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="parsial">Parsial</SelectItem><SelectItem value="total">Total</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Keluarga di Jepang"><Select value={data.family_in_japan} onValueChange={v => setData('family_in_japan', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ada">Ada</SelectItem><SelectItem value="tidak">Tidak</SelectItem></SelectContent></Select></FormItem>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormItem label="Riwayat TBC"><Select value={data.tbc_history} onValueChange={v => setData('tbc_history', v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ada">Pernah</SelectItem><SelectItem value="tidak">Tidak Pernah</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Penyakit Lainnya"><Textarea value={data.other_illness} onChange={e => setData('other_illness', e.target.value)} placeholder="Sebutkan jika ada riwayat operasi/penyakit berat" /></FormItem>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 3: PENDIDIKAN & PASPOR */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                {/* CARD PENDIDIKAN */}
                                <Card className="border-border shadow-none overflow-hidden">
                                    <CardHeader className="px-6 py-5 border-b">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-secondary rounded-lg">
                                                    <GraduationCap className="text-foreground" size={22}/>
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg font-bold">Riwayat Pendidikan</CardTitle>
                                                    <CardDescription className="text-xs">Urutkan dari jenjang pendidikan terakhir.</CardDescription>
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={addEducation}
                                                className="h-9 gap-2 px-4 font-semibold"
                                            >
                                                <Plus size={16}/> Tambah Sekolah
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {data.educations.length > 0 ? (
                                            <div className="divide-y divide-border">
                                                {data.educations.map((edu: any, idx: number) => (
                                                    <div key={idx} className="p-6 hover:bg-secondary/10 transition-colors">
                                                        {/* Row Header: Numbering & Delete */}
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                                                    Informasi Institusi
                                                                </span>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" 
                                                                onClick={() => removeRow('educations', idx)}
                                                            >
                                                                <Trash2 size={18}/>
                                                            </Button>
                                                        </div>
                                                        
                                                        {/* Grid Form Pendidikan */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                                            <FormItem label="Tingkat / Jenjang">
                                                                <Select value={edu.level} onValueChange={v => { const updated = [...data.educations]; updated[idx].level = v; setData('educations', updated); }}>
                                                                    <SelectTrigger><SelectValue placeholder="Pilih Jenjang" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="SD">Sekolah Dasar (SD)</SelectItem>
                                                                        <SelectItem value="SMP">SMP / Sederajat</SelectItem>
                                                                        <SelectItem value="SMA/SMK">SMA / SMK / Sederajat</SelectItem>
                                                                        <SelectItem value="Perguruan Tinggi">Perguruan Tinggi / Sarjana</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>

                                                            <FormItem label="Tipe Sekolah">
                                                                <Select value={edu.school_type} onValueChange={v => { const updated = [...data.educations]; updated[idx].school_type = v; setData('educations', updated); }}>
                                                                    <SelectTrigger><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Negeri">Negeri</SelectItem>
                                                                        <SelectItem value="Swasta">Swasta</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>

                                                            <FormItem label="Nama Sekolah / Universitas">
                                                                <Input 
                                                                    placeholder="Masukkan nama lengkap instansi" 
                                                                    value={edu.school_name} 
                                                                    onChange={e => { const updated = [...data.educations]; updated[idx].school_name = e.target.value; setData('educations', updated); }} 
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Jurusan / Konsentrasi">
                                                                <Input 
                                                                    placeholder="Contoh: Teknik Mesin / IPA" 
                                                                    value={edu.major} 
                                                                    onChange={e => { const updated = [...data.educations]; updated[idx].major = e.target.value; setData('educations', updated); }} 
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Tanggal Masuk">
                                                                <Input 
                                                                    type="date" 
                                                                    value={edu.entry_date} 
                                                                    onChange={e => { const updated = [...data.educations]; updated[idx].entry_date = e.target.value; setData('educations', updated); }} 
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Tanggal Keluar / Lulus">
                                                                <Input 
                                                                    type="date" 
                                                                    value={edu.graduation_date} 
                                                                    onChange={e => { const updated = [...data.educations]; updated[idx].graduation_date = e.target.value; setData('educations', updated); }} 
                                                                />
                                                            </FormItem>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 bg-muted/5">
                                                <GraduationCap size={48} className="text-muted-foreground/20 mb-4" />
                                                <p className="text-sm font-medium text-muted-foreground">Belum ada riwayat pendidikan yang ditambahkan.</p>
                                                <Button variant="link" onClick={addEducation} className="mt-1 text-blue-600">Tambah data sekarang</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* CARD PASPOR */}
                                <Card className="border-border shadow-none">
                                    <CardHeader className="px-6 py-5 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-secondary rounded-lg">
                                                <FileText className="text-foreground" size={22}/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold">Dokumen Paspor</CardTitle>
                                                <CardDescription className="text-xs">Informasi paspor jika sudah memiliki.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <FormItem label="Kepemilikan Paspor">
                                                <Select value={data.has_passport} onValueChange={v => setData('has_passport', v as any)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ada">Sudah Ada</SelectItem>
                                                        <SelectItem value="tidak">Belum Ada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>

                                            <FormItem label="Nomor Paspor">
                                                <Input 
                                                    disabled={data.has_passport === 'tidak'} 
                                                    value={data.passport_number} 
                                                    onChange={e => setData('passport_number', e.target.value)} 
                                                    placeholder="Contoh: A1234567"
                                                    className="font-mono uppercase"
                                                />
                                            </FormItem>

                                            <FormItem label="Tanggal Pengeluaran">
                                                <Input 
                                                    disabled={data.has_passport === 'tidak'} 
                                                    type="date" 
                                                    value={data.passport_issue_date} 
                                                    onChange={e => setData('passport_issue_date', e.target.value)} 
                                                />
                                            </FormItem>

                                            <FormItem label="Tanggal Kadaluarsa">
                                                <Input 
                                                    disabled={data.has_passport === 'tidak'} 
                                                    type="date" 
                                                    value={data.passport_expiry_date} 
                                                    onChange={e => setData('passport_expiry_date', e.target.value)} 
                                                />
                                            </FormItem>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* STEP 4: KERJA */}
                        {step === 4 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-border shadow-none overflow-hidden">
                                    <CardHeader className="px-6 py-5 border-b bg-transparent">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-secondary rounded-lg">
                                                    <Briefcase className="text-foreground" size={22}/>
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg font-bold tracking-tight">Riwayat Pekerjaan</CardTitle>
                                                    <CardDescription className="text-xs">Data pengalaman kerja siswa (jika ada).</CardDescription>
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={addExperience}
                                                className="h-9 gap-2 px-4 font-semibold"
                                            >
                                                <Plus size={16}/> Tambah Kerja
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {data.experiences.length > 0 ? (
                                            <div className="divide-y divide-border">
                                                {data.experiences.map((exp: any, idx: number) => (
                                                    <div key={idx} className="p-6 hover:bg-secondary/10 transition-colors">
                                                        {/* Row Header */}
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                                                    Informasi Pekerjaan
                                                                </span>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" 
                                                                onClick={() => removeRow('experiences', idx)}
                                                            >
                                                                <Trash2 size={18}/>
                                                            </Button>
                                                        </div>
                                                        
                                                        {/* Grid Form Pengalaman Kerja */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                                            <FormItem label="Nama Perusahaan">
                                                                <Input 
                                                                    placeholder="PT. Nama Perusahaan" 
                                                                    value={exp.company_name} 
                                                                    onChange={e => { const updated = [...data.experiences]; updated[idx].company_name = e.target.value; setData('experiences', updated); }} 
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Bidang / Jenis Pekerjaan">
                                                                <Input 
                                                                    placeholder="Contoh: Konstruksi / Operator" 
                                                                    value={exp.job_type} 
                                                                    onChange={e => { const updated = [...data.experiences]; updated[idx].job_type = e.target.value; setData('experiences', updated); }} 
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Gaji Bulanan (Rp)">
                                                                <Input 
                                                                    type="number"
                                                                    placeholder="Contoh: 5000000" 
                                                                    value={exp.monthly_salary} 
                                                                    onChange={e => { const updated = [...data.experiences]; updated[idx].monthly_salary = e.target.value; setData('experiences', updated); }} 
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Tanggal Mulai">
                                                                <Input 
                                                                    type="date" 
                                                                    value={exp.start_date} 
                                                                    onChange={e => { const updated = [...data.experiences]; updated[idx].start_date = e.target.value; setData('experiences', updated); }} 
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Tanggal Berakhir">
                                                                <Input 
                                                                    type="date" 
                                                                    value={exp.end_date} 
                                                                    onChange={e => { const updated = [...data.experiences]; updated[idx].end_date = e.target.value; setData('experiences', updated); }} 
                                                                />
                                                            </FormItem>

                                                            <div className="flex items-center pt-6 px-2">
                                                                <p className="text-[10px] text-muted-foreground leading-tight italic">
                                                                    * Kosongkan tanggal berakhir jika masih bekerja di instansi tersebut.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 bg-muted/5">
                                                <Briefcase size={48} className="text-muted-foreground/20 mb-4" />
                                                <p className="text-sm font-medium text-muted-foreground">Belum ada riwayat pekerjaan.</p>
                                                <Button variant="link" onClick={addExperience} className="mt-1 text-blue-600">Tambah data sekarang</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                {/* CARD ANGGOTA KELUARGA (DIVIDE-Y STYLE) */}
                                <Card className="border-border shadow-none overflow-hidden">
                                    <CardHeader className="px-6 py-5 border-b bg-transparent">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-secondary rounded-lg">
                                                    <FamilyIcon className="text-foreground" size={22}/>
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg font-bold tracking-tight">Anggota Keluarga</CardTitle>
                                                    <CardDescription className="text-xs">Data orang tua atau keluarga inti siswa.</CardDescription>
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={addFamily}
                                                className="h-9 gap-2 px-4 font-semibold"
                                            >
                                                <Plus size={16}/> Tambah Anggota
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {data.families.length > 0 ? (
                                            <div className="divide-y divide-border">
                                                {data.families.map((fam: any, idx: number) => (
                                                    <div key={idx} className="p-6 hover:bg-secondary/10 transition-colors">
                                                        <div className="flex justify-between items-center mb-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                                                    Data Keluarga
                                                                </span>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                                                                onClick={() => removeRow('families', idx)}
                                                            >
                                                                <Trash2 size={18}/>
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                            <FormItem label="Hubungan">
                                                                <Input placeholder="Ayah / Ibu / Istri" value={fam.relationship} onChange={e => { const updated = [...data.families]; updated[idx].relationship = e.target.value; setData('families', updated); }} />
                                                            </FormItem>
                                                            <FormItem label="Nama Lengkap">
                                                                <Input placeholder="Nama anggota keluarga" value={fam.name} onChange={e => { const updated = [...data.families]; updated[idx].name = e.target.value; setData('families', updated); }} />
                                                            </FormItem>
                                                            <FormItem label="Usia">
                                                                <Input type="number" placeholder="Tahun" value={fam.age} onChange={e => { const updated = [...data.families]; updated[idx].age = e.target.value; setData('families', updated); }} />
                                                            </FormItem>
                                                            <FormItem label="Pekerjaan">
                                                                <Input placeholder="Pekerjaan saat ini" value={fam.occupation} onChange={e => { const updated = [...data.families]; updated[idx].occupation = e.target.value; setData('families', updated); }} />
                                                            </FormItem>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 bg-muted/5">
                                                <FamilyIcon size={48} className="text-muted-foreground/20 mb-4" />
                                                <p className="text-sm font-medium text-muted-foreground">Belum ada data keluarga.</p>
                                                <Button variant="link" onClick={addFamily} className="mt-1 text-blue-600">Klik untuk menambah</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* STEP 5: INTERNAL LPK & KELUARGA */}
                        {step === 5 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                        {/* CARD MANAJEMEN LPK & SKILL */}
                                <Card className="border-border shadow-none overflow-hidden">
                                    <CardHeader className="px-6 py-5 border-b bg-transparent">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-secondary rounded-lg">
                                                <Target className="text-foreground" size={22}/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold tracking-tight">Manajemen & Kompetensi</CardTitle>
                                                <CardDescription className="text-xs">Data internal LPK dan evaluasi kemampuan siswa.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                                            <FormItem label="Status Siswa">
                                                <Select value={data.student_status} onValueChange={v => setData('student_status', v as any)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pelatihan">Pelatihan</SelectItem>
                                                        <SelectItem value="matching">Matching</SelectItem>
                                                        <SelectItem value="lolos_job">Lolos Job</SelectItem>
                                                        <SelectItem value="berangkat">Berangkat</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>

                                            {/* PERBAIKAN DI SINI: Program Keahlian dikunci ke BAHASA JEPANG */}
                                            <FormItem label="Program Keahlian">
                                                <Select 
                                                    value={data.program_expert} 
                                                    onValueChange={v => setData('program_expert', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Program" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="BAHASA JEPANG">BAHASA JEPANG</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>

                                            <FormItem label="Level Kelas">
                                                <Input 
                                                    value={data.class_level} 
                                                    onChange={e => setData('class_level', e.target.value)} 
                                                    placeholder="Contoh: BAB 1-10" 
                                                />
                                            </FormItem>

                                            {/* PASTIKAN INI TERISI: Tgl Masuk LPK */}
                                            <FormItem label="Tgl Masuk LPK">
                                                <Input 
                                                    type="date" 
                                                    value={data.entry_date_lpk} 
                                                    onChange={e => setData('entry_date_lpk', e.target.value)} 
                                                />
                                            </FormItem>

                                            <FormItem label="Kelebihan (Strength)">
                                                <Input value={data.strength} onChange={e => setData('strength', e.target.value)} placeholder="Kelebihan siswa" />
                                            </FormItem>

                                            <FormItem label="Kekurangan (Weakness)">
                                                <Input value={data.weakness} onChange={e => setData('weakness', e.target.value)} placeholder="Kekurangan siswa" />
                                            </FormItem>

                                            <FormItem label="Skill Teknis">
                                                <Input maxLength={15} value={data.skill_technical} onChange={e => setData('skill_technical', e.target.value)} placeholder="Maks 15 huruf" />
                                            </FormItem>

                                            <FormItem label="Hobi">
                                                <Input maxLength={15} value={data.hobby} onChange={e => setData('hobby', e.target.value)} placeholder="Maks 15 huruf" />
                                            </FormItem>

                                            <FormItem label="Target Tabungan (Yen)">
                                                <Input value={data.savings_target} onChange={e => setData('savings_target', e.target.value)} placeholder="Contoh: 3.000.000" />
                                            </FormItem>

                                            <div className="md:col-span-2 lg:col-span-3">
                                                <FormItem label="Alasan Menabung">
                                                    <Input maxLength={15} value={data.savings_reason} onChange={e => setData('savings_reason', e.target.value)} placeholder="Maks 15 huruf" />
                                                </FormItem>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                
                            </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between mt-8 p-4 bg-secondary/10 rounded-xl border border-border">
                            <Button 
                                variant="ghost" 
                                type="button"
                                disabled={step === 1} 
                                onClick={() => setStep(s => s - 1)}
                            >
                                <ChevronLeft className="mr-2" size={18} /> Kembali
                            </Button>

                            {step < 5 ? (
                                <Button 
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setStep(s => s + 1);
                                    }}
                                    className="px-8 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Lanjut <ChevronRight className="ml-2" size={18} />
                                </Button>
                            ) : (
                                <Button 
                                    type="submit"
                                    disabled={processing} 
                                    className="px-10 bg-green-600 hover:bg-green-700 text-white shadow-md"
                                >
                                    {processing ? 'Menyimpan...' : (
                                        <>
                                            <Save className="mr-2" size={18} /> Simpan Seluruh Data
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: SIDEBAR SUMMARY */}
                    <div className="lg:col-span-4 relative"> {/* Tambahkan relative di sini */}
                        <div className="sticky top-8 space-y-6"> {/* Container pembungkus agar sticky bekerja sempurna */}
                            <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden rounded-2xl">
                                {/* Header Ringkasan */}
                                <div className="bg-blue-600 px-4 py-4 flex items-center gap-2">
                                    <Info className="text-white" size={20}/>
                                    <h3 className="text-white text-sm font-bold uppercase tracking-widest">
                                        Ringkasan Input
                                    </h3>
                                </div>

                                {/* Konten Ringkasan */}
                                <CardContent className="p-5 space-y-5">
                                    <div className="space-y-3">
                                        <div className="flex justify-between border-b border-primary/10 pb-2">
                                            <span className="text-xs text-muted-foreground uppercase font-medium tracking-tight">NIK</span>
                                            <span className="text-xs font-mono font-bold text-blue-700">{data.nik || '-'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-primary/10 pb-2">
                                            <span className="text-xs text-muted-foreground uppercase font-medium tracking-tight">Nama</span>
                                            <span className="text-xs font-bold text-right pl-4">{data.full_name || '-'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-primary/10 pb-2">
                                            <span className="text-xs text-muted-foreground uppercase font-medium tracking-tight">Status</span>
                                            <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-100 px-2 py-0.5 rounded">{data.student_status}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-primary/10 pb-2">
                                            <span className="text-xs text-muted-foreground uppercase font-medium tracking-tight">TB / BB</span>
                                            <span className="text-xs font-bold">{data.height || '0'} cm / {data.weight || '0'} kg</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2 pt-2">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter text-center">Form Step Completion</p>
                                        <div className="flex gap-1.5 h-2">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div 
                                                    key={i} 
                                                    className={`flex-1 rounded-full transition-all duration-500 ${
                                                        step >= i ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-muted'
                                                    }`} 
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Info Note */}
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-[10px] leading-relaxed text-blue-800 font-medium italic">
                                            * Pastikan data yang dimasukkan sudah divalidasi dengan dokumen fisik siswa (KTP/Ijazah).
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                </form>
            </div>
        </AppLayout>
    );
}

function StepBadge({ step, current, icon }: { step: number, current: number, icon: any }) {
    const active = current === step;
    const done = current > step;
    return (
        <div className={`h-10 w-10 flex items-center justify-center rounded-xl border-2 transition-all duration-300 ${
            active ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110' : 
            done ? 'bg-green-50 text-green-600 border-green-200' : 
            'bg-background text-muted-foreground border-border'
        }`}>
            {icon}
        </div>
    );
}

function FormItem({ label, children, error }: { label: string, children: any, error?: string }) {
    return (
        <div className="space-y-1.5 w-full">
            <Label className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground/80 ml-1">{label}</Label>
            {children}
            {error && <p className="text-[10px] text-destructive font-bold ml-1">*{error}</p>}
        </div>
    );
}