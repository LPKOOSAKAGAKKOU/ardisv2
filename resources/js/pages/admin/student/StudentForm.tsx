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
import { route } from 'ziggy-js';

interface Props {
    student?: any;
    provinces: { id: number; name: string }[];
    jobSectors: { id: number; name: string; code: string }[];
    majors: { id: number; name: string }[]; // Tambahkan baris ini
}

export default function StudentForm({ student, provinces, jobSectors, majors }: Props) {
    const [step, setStep] = useState(1);
    const isEdit = !!student;
    const validateStep = (currentStep: number) => {
        switch (currentStep) {
            case 1:
                return (data.nik && data.full_name && data.pob && data.pob_province && data.dob && data.gender && data.phone_student && data.phone_parent && data.address_ktp);
            case 2:
                return (data.height && data.weight && data.blood_type && data.religion && data.marital_status && data.tbc_history && data.color_blind);
            case 5:
                const isValid = !!(data.student_status && data.program_expert && data.class_level && data.entry_date_lpk && data.strength && data.weakness && data.skill_technical && data.hobby && data.savings_target && data.savings_reason);
                if (!isValid) {
                    console.log("Field yang kosong:", {
                        status: !!data.student_status,
                        expert: !!data.program_expert,
                        level: !!data.class_level,
                        date: !!data.entry_date_lpk,
                        strength: !!data.strength,
                        weakness: !!data.weakness,
                        skill: !!data.skill_technical,
                        hobby: !!data.hobby,
                        target: !!data.savings_target,
                        reason: !!data.savings_reason
                    });
                }
                return isValid;
            default:
                return true;
        }
    };

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
            });
        } else {
            // Rute otomatis: admin.students.store
            post(route('admin.students.store'), {
                preserveScroll: true,
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
                                        <FormItem label="NIK" error={errors.nik} required>
                                            <Input value={data.nik} onChange={e => setData('nik', e.target.value)} placeholder="16 digit NIK" />
                                        </FormItem>
                                        <FormItem label="Email Akun (Read Only)" error={errors.email}>
                                            <Input 
                                                type="email" 
                                                value={data.email} 
                                                disabled={true} // Kunci input email
                                                className="bg-muted cursor-not-allowed font-semibold text-muted-foreground" 
                                            />
                                            <p className="text-[10px] text-blue-600 mt-1">* Email otomatis menggunakan akun login Anda.</p>
                                        </FormItem>
                                        <FormItem label="Nama Lengkap" required><Input value={data.full_name} onChange={e => setData('full_name', e.target.value)} /></FormItem>
                                        <FormItem label="Nama Katakana" required><Input value={data.full_name_katakana} onChange={e => setData('full_name_katakana', e.target.value)} placeholder="フリガナ" /></FormItem>
                                        <FormItem label="Tempat Lahir" required><Input value={data.pob} onChange={e => setData('pob', e.target.value)} /></FormItem>
                                        <FormItem label="Provinsi Lahir" required error={errors.pob_province}>
                                            <Select 
                                                value={data.pob_province} 
                                                onValueChange={v => setData('pob_province', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Provinsi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map((prov) => (
                                                        <SelectItem key={prov.id} value={prov.name_id}>
                                                            {prov.name_id}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                        <FormItem label="Tgl Lahir" required><Input type="date" value={data.dob} onChange={e => setData('dob', e.target.value)} /></FormItem>
                                        <FormItem label="Jenis Kelamin" required>
                                            <Select value={data.gender} onValueChange={v => setData('gender', v as any)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Perempuan">Perempuan</SelectItem></SelectContent>
                                            </Select>
                                        </FormItem>
                                        <FormItem label="HP Siswa" required><Input value={data.phone_student} onChange={e => setData('phone_student', e.target.value)} /></FormItem>
                                        <FormItem label="HP Orang Tua" required><Input value={data.phone_parent} onChange={e => setData('phone_parent', e.target.value)} /></FormItem>
                                    </div>
                                    <FormItem label="Alamat KTP" required><Textarea value={data.address_ktp} onChange={e => setData('address_ktp', e.target.value)} rows={3} /></FormItem>
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
                                        <FormItem label="Tinggi (cm)" required><Input type="number" value={data.height} onChange={e => setData('height', e.target.value)} /></FormItem>
                                        <FormItem label="Berat (kg)" required><Input type="number" value={data.weight} onChange={e => setData('weight', e.target.value)} /></FormItem>
                                        <FormItem label="Gol. Darah" required>
                                            <Select value={data.blood_type} onValueChange={v => setData('blood_type', v as any)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{['A','B','O','AB'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </FormItem>
                                        <FormItem label="Agama" required>
                                            <Select value={data.religion} onValueChange={v => setData('religion', v as any)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{['Islam','Kristen','Katholik','Hindu','Budha','Kong Hu Chu'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </FormItem>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-xl bg-muted/20">
                                        <FormItem label="Tato" required><Select value={data.tattoo} onValueChange={v => setData('tattoo', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ada">Ada</SelectItem><SelectItem value="tidak">Tidak</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Merokok" required><Select value={data.smoking} onValueChange={v => setData('smoking', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="merokok">Ya</SelectItem><SelectItem value="tidak merokok">Tidak</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Alkohol" required><Select value={data.alcohol} onValueChange={v => setData('alcohol', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minum">Ya</SelectItem><SelectItem value="tidak minum">Tidak</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Status Nikah" required><Select value={data.marital_status} onValueChange={v => setData('marital_status', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent>{['Belum Menikah','Menikah','Cerai','Cerai Mati'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></FormItem>
                                        <FormItem label="Buta Warna" required><Select value={data.color_blind} onValueChange={v => setData('color_blind', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="parsial">Parsial</SelectItem><SelectItem value="total">Total</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Keluarga di Jepang" required><Select value={data.family_in_japan} onValueChange={v => setData('family_in_japan', v as any)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ada">Ada</SelectItem><SelectItem value="tidak">Tidak</SelectItem></SelectContent></Select></FormItem>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormItem label="Riwayat TBC" required><Select value={data.tbc_history} onValueChange={v => setData('tbc_history', v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ada">Pernah</SelectItem><SelectItem value="tidak">Tidak Pernah</SelectItem></SelectContent></Select></FormItem>
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
                                                                type="button" // Tambahkan ini
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="..." 
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
                                                                        <SelectItem value="小学校">Sekolah Dasar (SD)</SelectItem>
                                                                        <SelectItem value="中学校">SMP / Sederajat</SelectItem>
                                                                        <SelectItem value="高校">SMA / SMK / Sederajat</SelectItem>
                                                                        <SelectItem value="大学">Perguruan Tinggi / Sarjana</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>

                                                            <FormItem label="Tipe Sekolah">
                                                                <Select value={edu.school_type} onValueChange={v => { const updated = [...data.educations]; updated[idx].school_type = v; setData('educations', updated); }}>
                                                                    <SelectTrigger><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="国立">Negeri</SelectItem>
                                                                        <SelectItem value="私立">Swasta</SelectItem>
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
                                                                <Select 
                                                                    value={edu.major} 
                                                                    onValueChange={v => { 
                                                                        const updated = [...data.educations]; 
                                                                        updated[idx].major = v; 
                                                                        setData('educations', updated); 
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih Jurusan" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {majors.map((m) => (
                                                                            <SelectItem key={m.id} value={m.name_id}>
                                                                                {m.name_id}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
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
                                                                type="button"
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
                                                                <Select 
                                                                    value={exp.job_type} 
                                                                    onValueChange={v => { 
                                                                        const updated = [...data.experiences]; 
                                                                        updated[idx].job_type = v; 
                                                                        setData('experiences', updated); 
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih Bidang" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {jobSectors.map((job) => (
                                                                            <SelectItem key={job.id} value={job.name_id}>
                                                                                {job.name_id} ({job.code})
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
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
                                                                type="button"
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                                                                onClick={() => removeRow('families', idx)}
                                                            >
                                                                <Trash2 size={18}/>
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                            <FormItem label="Hubungan Keluarga">
                                                                <Select 
                                                                    value={fam.relationship} 
                                                                    onValueChange={v => { 
                                                                        const updated = [...data.families]; 
                                                                        updated[idx].relationship = v; 
                                                                        setData('families', updated); 
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih Hubungan" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="父">Ayah</SelectItem>
                                                                        <SelectItem value="母">Ibu</SelectItem>
                                                                        <SelectItem value="姉">Kakak Perempuan</SelectItem>
                                                                        <SelectItem value="兄">Kakak Laki-Laki</SelectItem>
                                                                        <SelectItem value="妹">Adik Perempuan</SelectItem>
                                                                        <SelectItem value="弟">Adik Laki-Laki</SelectItem>
                                                                        <SelectItem value="祖父">Kakek</SelectItem>
                                                                        <SelectItem value="祖母">Nenek</SelectItem>
                                                                        <SelectItem value="兄弟">Saudara Kandung</SelectItem>
                                                                        <SelectItem value="夫">Suami</SelectItem>
                                                                        <SelectItem value="妻">Istri</SelectItem>
                                                                        <SelectItem value="娘">Anak Perempuan</SelectItem>
                                                                        <SelectItem value="息子">Anak Laki-Laki</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                            <FormItem label="Nama Lengkap">
                                                                <Input placeholder="Nama anggota keluarga" value={fam.name} onChange={e => { const updated = [...data.families]; updated[idx].name = e.target.value; setData('families', updated); }} />
                                                            </FormItem>
                                                            <FormItem label="Usia">
                                                                <Input type="number" placeholder="Tahun" value={fam.age} onChange={e => { const updated = [...data.families]; updated[idx].age = e.target.value; setData('families', updated); }} />
                                                            </FormItem>
                                                            <FormItem label="Pekerjaan">
                                                                <Select 
                                                                    value={fam.occupation} 
                                                                    onValueChange={v => { 
                                                                        const updated = [...data.families]; 
                                                                        updated[idx].occupation = v; 
                                                                        setData('families', updated); 
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih Pekerjaan" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {/* Menggunakan daftar yang sama dengan jobSectors */}
                                                                        {jobSectors.map((job) => (
                                                                            <SelectItem key={job.id} value={job.name_id}>
                                                                                {job.name_id}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
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
                                                <Select 
                                                    value={data.class_level} 
                                                    onValueChange={(value) => setData('class_level', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Pilih Level Kelas" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="SISWA BARU">SISWA BARU</SelectItem>
                                                        <SelectItem value="KELAS N5">KELAS N5</SelectItem>
                                                        <SelectItem value="KELAS N4">KELAS N4</SelectItem>
                                                        <SelectItem value="KELAS PRA-PEMBERANGKATAN">KELAS PRA-PEMBERANGKATAN</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>

                                            {/* PASTIKAN INI TERISI: Tgl Masuk LPK */}
                                            <FormItem label="Tgl Masuk LPK">
                                                <Input 
                                                    type="date" 
                                                    value={data.entry_date_lpk} 
                                                    onChange={e => setData('entry_date_lpk', e.target.value)} 
                                                />
                                            </FormItem>

<FormItem label="Kelebihan Diri" required error={errors.strength}>
                                                <Select 
                                                    value={data.strength} 
                                                    onValueChange={v => setData('strength', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Kelebihan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="リーダーシップがある">Memiliki sifat kepemimpinan</SelectItem>
                                                        <SelectItem value="ストレス耐性が強い">Kuat dalam menghadapi stres</SelectItem>
                                                        <SelectItem value="世話好き">Suka menolong / Merawat orang lain</SelectItem>
                                                        <SelectItem value="努力家">Pekerja keras / Rajin berusaha</SelectItem>
                                                        <SelectItem value="協調性がある">Memiliki sikap kerja sama (Kooperatif)</SelectItem>
                                                        <SelectItem value="几帳面">Rapi / Teratur</SelectItem>
                                                        <SelectItem value="主体性がある">Memiliki inisiatif / Mandiri</SelectItem>
                                                        <SelectItem value="論理的思考力がある">Berpikir logis / Rasional</SelectItem>
                                                        <SelectItem value="行動力がある">Aktif dalam bertindak</SelectItem>
                                                        <SelectItem value="相手の気持ちを尊重できる">Menghargai perasaan orang lain</SelectItem>
                                                        <SelectItem value="忍耐力がある">Memiliki ketahanan / Sabar</SelectItem>
                                                        <SelectItem value="好奇心旺盛">Rasa ingin tahu yang besar</SelectItem>
                                                        <SelectItem value="調整力がある">Mampu mengatur situasi / Adaptif</SelectItem>
                                                        <SelectItem value="責任感がある">Memiliki rasa tanggung jawab</SelectItem>
                                                        <SelectItem value="計画性がある">Memiliki perencanaan yang baik</SelectItem>
                                                        <SelectItem value="積極性がある">Proaktif</SelectItem>
                                                        <SelectItem value="前向きな性格">Sikap positif / Optimis</SelectItem>
                                                        <SelectItem value="柔軟性がある">Fleksibel / Mudah beradaptasi</SelectItem>
                                                        <SelectItem value="負けず嫌い">Sangat gigih (Tidak suka kalah)</SelectItem>
                                                        <SelectItem value="目の前の事に集中できる">Mampu fokus pada tugas</SelectItem>
                                                        <SelectItem value="自分に厳しい">Kritis terhadap diri sendiri</SelectItem>
                                                        <SelectItem value="素直な性格">Jujur / Tulus</SelectItem>
                                                        <SelectItem value="礼儀正しい">Berperilaku sopan (Etika baik)</SelectItem>
                                                        <SelectItem value="仕事が早い">Cepat dan efisien dalam bekerja</SelectItem>
                                                        <SelectItem value="器用な人">Terampil / Pandai berbagai hal</SelectItem>
                                                        <SelectItem value="明るい性格">Sifat ceria / Ramah</SelectItem>
                                                        <SelectItem value="頑張り屋">Orang yang rajin / Gigih</SelectItem>
                                                        <SelectItem value="真面目">Serius / Tekun</SelectItem>
                                                        <SelectItem value="社交的">Senang berinteraksi sosial</SelectItem>
                                                        <SelectItem value="コミュニケーション能力がある">Kemampuan komunikasi baik</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>

                                            <FormItem label="Kekurangan Diri" required error={errors.weakness}>
                                                <Select 
                                                    value={data.weakness} 
                                                    onValueChange={v => setData('weakness', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Kekurangan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="我が強い">Egois / Keras kepala</SelectItem>
                                                        <SelectItem value="頑固">Keras kepala (Sulit diubah)</SelectItem>
                                                        <SelectItem value="慎重すぎる">Terlalu cemas / Sangat sensitif</SelectItem>
                                                        <SelectItem value="理屈っぽい">Terlalu mencari pembenaran logis</SelectItem>
                                                        <SelectItem value="気が弱い">Cemas / Mudah tertekan</SelectItem>
                                                        <SelectItem value="諦めが悪い">Sulit menerima kegagalan</SelectItem>
                                                        <SelectItem value="飽き性">Mudah bosan / Jenuh</SelectItem>
                                                        <SelectItem value="心配性">Khawatir / Cemas berlebih</SelectItem>
                                                        <SelectItem value="楽親的">Terlalu santai / Meremehkan</SelectItem>
                                                        <SelectItem value="緊張しやすい">Mudah gugup / Tegang</SelectItem>
                                                        <SelectItem value="恥ずかしがり屋">Pemalu / Penakut</SelectItem>
                                                        <SelectItem value="せっかち">Tergesa-gesa / Cerewet</SelectItem>
                                                        <SelectItem value="人見知り">Canggung dengan orang baru</SelectItem>
                                                        <SelectItem value="一つの事に集中しやすい">Hanya bisa fokus pada satu hal</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                                        if (validateStep(step)) {
                                            setStep(s => s + 1);
                                        } else {
                                            alert("Mohon lengkapi semua field yang wajib diisi pada tahap ini.");
                                        }
                                    }}
                                    className={`px-8 transition-all ${validateStep(step) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 opacity-50'}`}
                                >
                                    Lanjut <ChevronRight className="ml-2" size={18} />
                                </Button>
                            ) : (
                                <Button 
                                    type="submit"
                                    // Tombol aktif HANYA JIKA tidak sedang processing DAN validasi step 5 lolos
                                    disabled={processing || !validateStep(5)} 
                                    className="px-10 bg-green-600 hover:bg-green-700 text-white shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
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

function FormItem({ label, children, error, required }: { label: string, children: any, error?: string, required?: boolean }) {
    return (
        <div className="space-y-1.5 w-full">
            <Label className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground/80 ml-1">
                {label} {required && <span className="text-red-500 font-bold">*</span>}
            </Label>
            {children}
            {error && <p className="text-[10px] text-destructive font-bold ml-1">*{error}</p>}
        </div>
    );
}