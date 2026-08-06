import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { 
    User as UserIcon, Activity, GraduationCap, Briefcase, 
    Users as FamilyIcon, ChevronRight, ChevronLeft, Plus, Trash2, Save,
    ShieldCheck, HeartPulse, FileText, Target, Info, MapPin, AlertCircle
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
    provinces: { id: number; name: string; name_id?: string }[];
    jobSectors: { id: number; name: string; name_id?: string; code: string }[];
    majors: { id: number; name: string }[];
    recruitments: { id: number; name: string; date: string; type: string }[];
}

export default function StudentForm({ student, provinces, jobSectors, majors, recruitments }: Props) {
    const [step, setStep] = useState(1);
    const isEdit = !!student;

    const getStepForErrorKey = (key: string): number => {
        if (['nik', 'email', 'full_name', 'full_name_katakana', 'pob', 'pob_province', 'dob', 'gender', 'address_ktp', 'phone_student', 'phone_parent'].includes(key)) return 1;
        if (['height', 'weight', 'blood_type', 'religion', 'marital_status', 'tbc_history', 'color_blind', 'other_illness', 'has_passport', 'passport_number', 'passport_issue_date', 'passport_expiry_date', 'tattoo', 'smoking', 'alcohol', 'family_in_japan'].includes(key)) return 2;
        if (key.startsWith('educations')) return 3;
        if (key.startsWith('experiences')) return 4;
        return 5;
    };

    const validateStep = (currentStep: number) => {
        switch (currentStep) {
            case 1:
                return !!(data.nik && data.full_name && data.pob && data.pob_province && data.dob && data.gender && data.phone_student && data.phone_parent && data.address_ktp);
            case 2:
                return !!(data.height && data.weight && data.blood_type && data.religion && data.marital_status && data.tbc_history && data.color_blind);
            case 3:
                return data.educations.length > 0;
            case 4:
                return true; // Pengalaman kerja opsional untuk fresh graduate
            case 5:
                return !!(data.student_status && data.program_expert && data.class_level && data.entry_date_lpk && data.strength && data.weakness && data.skill_technical && data.hobby && data.savings_target && data.savings_reason);
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
        class_level: student?.class_level || 'SISWA BARU',
        program_expert: student?.program_expert || 'BAHASA JEPANG',
        entry_date_lpk: student?.entry_date_lpk || new Date().toISOString().split('T')[0],
        strength: student?.strength || '',
        weakness: student?.weakness || '',
        skill_technical: student?.skill_technical || '',
        hobby: student?.hobby || '',
        savings_target: student?.savings_target || '',
        savings_reason: student?.savings_reason || '',
        student_status: student?.student_status || 'pelatihan',
        recruitments_id: student?.recruitments_id || '',

        // Arrays
        educations: student?.educations || [],
        experiences: student?.experiences || [],
        families: student?.families || [],
    });
        
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(route('student.profile.save'), {
            preserveScroll: true,
            onError: (errs) => {
                console.error("Gagal Simpan:", errs);
                const firstErrorField = Object.keys(errs)[0];
                if (firstErrorField) {
                    setStep(getStepForErrorKey(firstErrorField));
                }
            },
            onSuccess: () => {
                // Success redirect handled by controller
            }
        });
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
            
            <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
                
                {/* Header Section */}
                <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                            {isEdit ? 'Perbarui Data Siswa' : 'Registrasi Siswa Baru'}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Lengkapi seluruh informasi dokumen dan data pribadi siswa.</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-secondary/50 p-1.5 rounded-lg border border-border overflow-x-auto">
                        <StepBadge step={1} current={step} icon={<UserIcon size={14} className="sm:w-4 sm:h-4"/>} />
                        <StepBadge step={2} current={step} icon={<HeartPulse size={14} className="sm:w-4 sm:h-4"/>} />
                        <StepBadge step={3} current={step} icon={<GraduationCap size={14} className="sm:w-4 sm:h-4"/>} />
                        <StepBadge step={4} current={step} icon={<Briefcase size={14} className="sm:w-4 sm:h-4"/>} />
                        <StepBadge step={5} current={step} icon={<FamilyIcon size={14} className="sm:w-4 sm:h-4"/>} />
                    </div>
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                    
                    {/* Top Error Banner */}
                    {Object.keys(errors).length > 0 && (
                        <div className="lg:col-span-12 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl dark:bg-red-950/50 dark:border-red-900 dark:text-red-300">
                            <div className="flex items-center gap-2 font-bold text-sm mb-1 text-red-900 dark:text-red-200">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                                <span>Gagal menyimpan data profil! Mohon periksa kembali {Object.keys(errors).length} kesalahan berikut:</span>
                            </div>
                            <ul className="list-disc list-inside text-xs space-y-1 ml-6 mt-2">
                                {Object.entries(errors).map(([key, msg]) => (
                                    <li key={key}>
                                        <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {String(msg)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                        
                        {/* STEP 1: IDENTITAS */}
                        {step === 1 && (
                            <Card className="shadow-sm border-border">
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="flex gap-2 items-center text-blue-600 text-base sm:text-lg"><ShieldCheck size={18} className="sm:w-5 sm:h-5"/> Identitas Utama</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Data login akun dan informasi identitas sesuai KTP.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <FormItem label="NIK" error={errors.nik} required>
                                            <Input value={data.nik} onChange={e => setData('nik', e.target.value)} placeholder="16 digit NIK" className="text-sm" />
                                        </FormItem>
                                        <FormItem label="Email Akun (Read Only)" error={errors.email}>
                                            <Input 
                                                type="email" 
                                                value={data.email} 
                                                disabled={true}
                                                className="bg-muted cursor-not-allowed font-semibold text-muted-foreground text-sm" 
                                            />
                                            <p className="text-[10px] text-blue-600 mt-1">* Email otomatis menggunakan akun login Anda.</p>
                                        </FormItem>
                                        <FormItem label="Nama Lengkap" required error={errors.full_name}><Input value={data.full_name} onChange={e => setData('full_name', e.target.value)} className="text-sm" /></FormItem>
                                        <FormItem label="Nama Katakana" required error={errors.full_name_katakana}><Input value={data.full_name_katakana} onChange={e => setData('full_name_katakana', e.target.value)} placeholder="フリガナ" className="text-sm" /></FormItem>
                                        <FormItem label="Tempat Lahir" required error={errors.pob}><Input value={data.pob} onChange={e => setData('pob', e.target.value)} className="text-sm" /></FormItem>
                                        <FormItem label="Provinsi Lahir" required error={errors.pob_province}>
                                            <Select 
                                                value={data.pob_province} 
                                                onValueChange={v => setData('pob_province', v)}
                                            >
                                                <SelectTrigger className="text-sm">
                                                    <SelectValue placeholder="Pilih Provinsi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map((prov) => (
                                                        <SelectItem key={prov.id} value={prov.name_id || prov.name} className="text-sm">
                                                            {prov.name_id || prov.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                        <FormItem label="Tgl Lahir" required error={errors.dob}><Input type="date" value={data.dob} onChange={e => setData('dob', e.target.value)} className="text-sm" /></FormItem>
                                        <FormItem label="Jenis Kelamin" required error={errors.gender}>
                                        <Select
                                            value={data.gender || ""}
                                            onValueChange={(v) => setData("gender", v)}
                                        >
                                            <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Pilih jenis kelamin" />
                                            </SelectTrigger>

                                            <SelectContent>
                                            <SelectItem value="Laki-laki" className="text-sm">
                                                Laki-laki
                                            </SelectItem>
                                            <SelectItem value="Perempuan" className="text-sm">
                                                Perempuan
                                            </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        </FormItem>
                                        <FormItem label="HP Siswa" required error={errors.phone_student}>
                                            <Input 
                                                type="tel"
                                                value={data.phone_student} 
                                                onChange={e => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    setData('phone_student', value);
                                                }}
                                                onKeyPress={e => {
                                                    if (!/[0-9]/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className="text-sm" 
                                                placeholder="08xxxxxxxxxx"
                                            />
                                        </FormItem>

                                        <FormItem label="HP Orang Tua" required error={errors.phone_parent}>
                                            <Input 
                                                type="tel"
                                                value={data.phone_parent} 
                                                onChange={e => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    setData('phone_parent', value);
                                                }}
                                                onKeyPress={e => {
                                                    if (!/[0-9]/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className="text-sm" 
                                                placeholder="08xxxxxxxxxx"
                                            />
                                        </FormItem>
                                    </div>
                                    <FormItem label="Alamat KTP" required error={errors.address_ktp}><Textarea value={data.address_ktp} onChange={e => setData('address_ktp', e.target.value)} rows={3} className="text-sm" /></FormItem>
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 2: FISIK & MEDIS */}
                        {step === 2 && (
                            <Card className="shadow-sm">
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="flex gap-2 items-center text-red-600 text-base sm:text-lg"><HeartPulse size={18} className="sm:w-5 sm:h-5"/> Fisik & Kesehatan</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Data kondisi fisik dan riwayat kesehatan siswa.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                        <FormItem label="Tinggi (cm)" required error={errors.height}><Input type="number" value={data.height} onChange={e => setData('height', e.target.value)} className="text-sm" /></FormItem>
                                        <FormItem label="Berat (kg)" required error={errors.weight}><Input type="number" value={data.weight} onChange={e => setData('weight', e.target.value)} className="text-sm" /></FormItem>
                                        <FormItem label="Gol. Darah" required error={errors.blood_type}>
                                            <Select value={data.blood_type} onValueChange={v => setData('blood_type', v as any)}>
                                                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent>{['A','B','O','AB'].map(v => <SelectItem key={v} value={v} className="text-sm">{v}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </FormItem>
                                        <FormItem label="Agama" required error={errors.religion}>
                                            <Select value={data.religion} onValueChange={v => setData('religion', v as any)}>
                                                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent>{['Islam','Kristen','Katholik','Hindu','Budha','Kong Hu Chu'].map(v => <SelectItem key={v} value={v} className="text-sm">{v}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </FormItem>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 border p-3 sm:p-4 rounded-xl bg-muted/20">
                                        <FormItem label="Tato" required error={errors.tattoo}><Select value={data.tattoo} onValueChange={v => setData('tattoo', v as any)}><SelectTrigger className="bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ada" className="text-sm">Ada</SelectItem><SelectItem value="tidak" className="text-sm">Tidak</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Merokok" required error={errors.smoking}><Select value={data.smoking} onValueChange={v => setData('smoking', v as any)}><SelectTrigger className="bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="merokok" className="text-sm">Ya</SelectItem><SelectItem value="tidak merokok" className="text-sm">Tidak</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Alkohol" required error={errors.alcohol}><Select value={data.alcohol} onValueChange={v => setData('alcohol', v as any)}><SelectTrigger className="bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minum" className="text-sm">Ya</SelectItem><SelectItem value="tidak minum" className="text-sm">Tidak</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Status Nikah" required error={errors.marital_status}><Select value={data.marital_status} onValueChange={v => setData('marital_status', v as any)}><SelectTrigger className="bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent>{['Belum Menikah','Menikah','Cerai','Cerai Mati'].map(v => <SelectItem key={v} value={v} className="text-sm">{v}</SelectItem>)}</SelectContent></Select></FormItem>
                                        <FormItem label="Buta Warna" required error={errors.color_blind}><Select value={data.color_blind} onValueChange={v => setData('color_blind', v as any)}><SelectTrigger className="bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal" className="text-sm">Normal</SelectItem><SelectItem value="parsial" className="text-sm">Parsial</SelectItem><SelectItem value="total" className="text-sm">Total</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Keluarga di Jepang" required error={errors.family_in_japan}><Select value={data.family_in_japan} onValueChange={v => setData('family_in_japan', v as any)}><SelectTrigger className="bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ada" className="text-sm">Ada</SelectItem><SelectItem value="tidak" className="text-sm">Tidak</SelectItem></SelectContent></Select></FormItem>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                        <FormItem label="Riwayat TBC" required error={errors.tbc_history}><Select value={data.tbc_history} onValueChange={v => setData('tbc_history', v as any)}><SelectTrigger className="text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ada" className="text-sm">Pernah</SelectItem><SelectItem value="tidak" className="text-sm">Tidak Pernah</SelectItem></SelectContent></Select></FormItem>
                                        <FormItem label="Penyakit Lainnya" error={errors.other_illness}><Textarea value={data.other_illness} onChange={e => setData('other_illness', e.target.value)} placeholder="Sebutkan jika ada riwayat operasi/penyakit berat" className="text-sm" /></FormItem>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 3: PENDIDIKAN & PASPOR */}
                        {step === 3 && (
                            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                {/* CARD PENDIDIKAN */}
                                <Card className="border-border shadow-none overflow-hidden">
                                    <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="p-1.5 sm:p-2 bg-secondary rounded-lg">
                                                    <GraduationCap className="text-foreground w-5 h-5 sm:w-[22px] sm:h-[22px]"/>
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base sm:text-lg font-bold">Riwayat Pendidikan <span className="text-red-500">*</span></CardTitle>
                                                    <CardDescription className="text-[10px] sm:text-xs">Wajib tambahkan semua riwayat pendidikan.</CardDescription>
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={addEducation}
                                                className="h-8 sm:h-9 gap-1.5 sm:gap-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm w-full sm:w-auto"
                                            >
                                                <Plus size={14} className="sm:w-4 sm:h-4"/> Tambah Sekolah
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {data.educations.length > 0 ? (
                                            <div className="divide-y divide-border">
                                                {data.educations.map((edu: any, idx: number) => (
                                                    <div key={idx} className="p-4 sm:p-6 hover:bg-secondary/10 transition-colors">
                                                        {/* Row Header: Numbering & Delete */}
                                                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary flex items-center justify-center text-[9px] sm:text-[10px] font-black text-primary-foreground">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                                                    Informasi Institusi
                                                                </span>
                                                            </div>
                                                            <Button 
                                                                type="button"
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive transition-colors" 
                                                                onClick={() => removeRow('educations', idx)}
                                                            >
                                                                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]"/>
                                                            </Button>
                                                        </div>
                                                        
                                                        {/* Grid Form Pendidikan */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-5">
                                                            <FormItem label="Tingkat / Jenjang">
                                                                <Select value={edu.level} onValueChange={v => { const updated = [...data.educations]; updated[idx].level = v; setData('educations', updated); }}>
                                                                    <SelectTrigger className="text-sm"><SelectValue placeholder="Pilih Jenjang" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="小学校" className="text-sm">Sekolah Dasar (SD)</SelectItem>
                                                                        <SelectItem value="中学校" className="text-sm">SMP / Sederajat</SelectItem>
                                                                        <SelectItem value="高校" className="text-sm">SMA / SMK / Sederajat</SelectItem>
                                                                        <SelectItem value="大学" className="text-sm">Perguruan Tinggi / Sarjana</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>

                                                            <FormItem label="Tipe Sekolah">
                                                                <Select value={edu.school_type} onValueChange={v => { const updated = [...data.educations]; updated[idx].school_type = v; setData('educations', updated); }}>
                                                                    <SelectTrigger className="text-sm"><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="国立" className="text-sm">Negeri</SelectItem>
                                                                        <SelectItem value="私立" className="text-sm">Swasta</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>

                                                            <FormItem label="Nama Sekolah / Universitas">
                                                                <Input 
                                                                    placeholder="Masukkan nama lengkap instansi" 
                                                                    value={edu.school_name} 
                                                                    onChange={e => { const updated = [...data.educations]; updated[idx].school_name = e.target.value; setData('educations', updated); }} 
                                                                    className="text-sm"
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
                                                                    <SelectTrigger className="text-sm">
                                                                        <SelectValue placeholder="Pilih Jurusan" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {majors.map((m) => (
                                                                            <SelectItem key={m.id} value={m.name_id} className="text-sm">
                                                                                {m.name_id}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>

                                                            <FormItem label="Tanggal Masuk">
                                                                <Input 
                                                                    type="month" 
                                                                    value={edu.entry_date ? edu.entry_date.substring(0, 7) : ''}
                                                                    onChange={e => { 
                                                                        const updated = [...data.educations];
                                                                        // Tambahkan -01 agar jadi YYYY-MM-01 sebelum masuk ke state/DB
                                                                        updated[idx].entry_date = e.target.value ? `${e.target.value}-01` : ''; 
                                                                        setData('educations', updated); 
                                                                    }} 
                                                                    className="text-sm"
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Tanggal Keluar / Lulus">
                                                                <Input 
                                                                    type="month" 
                                                                    value={edu.graduation_date ? edu.graduation_date.substring(0, 7) : ''} 
                                                                    onChange={e => { 
                                                                        const updated = [...data.educations];
                                                                        // Jika dihapus oleh user, simpan sebagai null/empty string agar tidak error
                                                                        updated[idx].graduation_date = e.target.value ? `${e.target.value}-01` : ''; 
                                                                        setData('educations', updated); 
                                                                    }} 
                                                                    className="text-sm"
                                                                />
                                                            </FormItem>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-muted/5 px-4">
                                                <GraduationCap size={40} className="sm:w-12 sm:h-12 text-muted-foreground/20 mb-3 sm:mb-4" />
                                                <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center">Belum ada riwayat pendidikan yang ditambahkan.</p>
                                                <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1 text-center">* Wajib tambahkan minimal 1 data pendidikan</p>
                                                <Button variant="link" onClick={addEducation} className="mt-2 sm:mt-1 text-blue-600 text-xs sm:text-sm">Tambah data sekarang</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* CARD PASPOR */}
                                <Card className="border-border shadow-none">
                                    <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="p-1.5 sm:p-2 bg-secondary rounded-lg">
                                                <FileText className="text-foreground w-5 h-5 sm:w-[22px] sm:h-[22px]"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-base sm:text-lg font-bold">Dokumen Paspor</CardTitle>
                                                <CardDescription className="text-[10px] sm:text-xs">Informasi paspor jika sudah memiliki.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                            <FormItem label="Kepemilikan Paspor">
                                                <Select value={data.has_passport} onValueChange={v => setData('has_passport', v as any)}>
                                                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ada" className="text-sm">Sudah Ada</SelectItem>
                                                        <SelectItem value="tidak" className="text-sm">Belum Ada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>

                                            <FormItem label="Nomor Paspor">
                                                <Input 
                                                    disabled={data.has_passport === 'tidak'} 
                                                    value={data.passport_number} 
                                                    onChange={e => setData('passport_number', e.target.value)} 
                                                    placeholder="Contoh: A1234567"
                                                    className="font-mono uppercase text-sm"
                                                />
                                            </FormItem>

                                            <FormItem label="Tanggal Pengeluaran">
                                                <Input 
                                                    disabled={data.has_passport === 'tidak'} 
                                                    type="date" 
                                                    value={data.passport_issue_date} 
                                                    onChange={e => setData('passport_issue_date', e.target.value)} 
                                                    className="text-sm"
                                                />
                                            </FormItem>

                                            <FormItem label="Tanggal Kadaluarsa">
                                                <Input 
                                                    disabled={data.has_passport === 'tidak'} 
                                                    type="date" 
                                                    value={data.passport_expiry_date} 
                                                    onChange={e => setData('passport_expiry_date', e.target.value)} 
                                                    className="text-sm"
                                                />
                                            </FormItem>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* STEP 4: KERJA */}
                        {step === 4 && (
                            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-border shadow-none overflow-hidden">
                                    <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-transparent">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="p-1.5 sm:p-2 bg-secondary rounded-lg">
                                                    <Briefcase className="text-foreground w-5 h-5 sm:w-[22px] sm:h-[22px]"/>
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base sm:text-lg font-bold tracking-tight">Riwayat Pekerjaan (Opsional)</CardTitle>
                                                    <CardDescription className="text-[10px] sm:text-xs">Tambahkan pengalaman kerja jika ada (Kosongkan jika lulusan baru).</CardDescription>
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={addExperience}
                                                className="h-8 sm:h-9 gap-1.5 sm:gap-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm w-full sm:w-auto"
                                            >
                                                <Plus size={14} className="sm:w-4 sm:h-4"/> Tambah Kerja
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {data.experiences.length > 0 ? (
                                            <div className="divide-y divide-border">
                                                {data.experiences.map((exp: any, idx: number) => (
                                                    <div key={idx} className="p-4 sm:p-6 hover:bg-secondary/10 transition-colors">
                                                        {/* Row Header */}
                                                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary flex items-center justify-center text-[9px] sm:text-[10px] font-black text-primary-foreground">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                                                    Informasi Pekerjaan
                                                                </span>
                                                            </div>
                                                            <Button 
                                                                type="button"
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive transition-colors" 
                                                                onClick={() => removeRow('experiences', idx)}
                                                            >
                                                                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]"/>
                                                            </Button>
                                                        </div>
                                                        
                                                        {/* Grid Form Pengalaman Kerja */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-5">
                                                            <FormItem label="Nama Perusahaan">
                                                                <Input 
                                                                    placeholder="PT. Nama Perusahaan" 
                                                                    value={exp.company_name} 
                                                                    onChange={e => { const updated = [...data.experiences]; updated[idx].company_name = e.target.value; setData('experiences', updated); }} 
                                                                    className="text-sm"
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
                                                                    <SelectTrigger className="text-sm">
                                                                        <SelectValue placeholder="Pilih Bidang" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {jobSectors.map((job) => (
                                                                            <SelectItem key={job.id} value={job.name_id || job.name} className="text-sm">
                                                                                {job.name_id || job.name} ({job.code})
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
                                                                    className="text-sm"
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Tanggal Mulai">
                                                                <Input 
                                                                    type="month" 
                                                                    value={exp.start_date ? exp.start_date.substring(0, 7) : ''} 
                                                                    onChange={e => { 
                                                                        const updated = [...data.experiences]; 
                                                                        updated[idx].start_date = e.target.value ? `${e.target.value}-01` : ''; 
                                                                        setData('experiences', updated); 
                                                                    }} 
                                                                    className="text-sm"
                                                                />
                                                            </FormItem>

                                                            <FormItem label="Tanggal Berakhir">
                                                                <Input 
                                                                    type="month" 
                                                                    value={exp.end_date ? exp.end_date.substring(0, 7) : ''} 
                                                                    onChange={e => { 
                                                                        const updated = [...data.experiences]; 
                                                                        updated[idx].end_date = e.target.value ? `${e.target.value}-01` : ''; 
                                                                        setData('experiences', updated); 
                                                                    }} 
                                                                    className="text-sm"
                                                                />
                                                                <p className="text-[10px] text-muted-foreground mt-1 italic">
                                                                    *Kosongkan jika masih bekerja di tempat ini.
                                                                </p>
                                                            </FormItem>

                                                            <div className="flex items-center pt-2 sm:pt-6 px-2">
                                                                <p className="text-[10px] text-muted-foreground leading-tight italic">
                                                                    * Kosongkan tanggal berakhir jika masih bekerja di instansi tersebut.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-muted/5 px-4">
                                                <Briefcase size={40} className="sm:w-12 sm:h-12 text-muted-foreground/20 mb-3 sm:mb-4" />
                                                <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center">Belum ada riwayat pekerjaan.</p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 text-center">Opsional: Kosongkan jika Anda belum pernah bekerja sebelumnya.</p>
                                                <Button variant="link" onClick={addExperience} className="mt-2 sm:mt-1 text-blue-600 text-xs sm:text-sm">Tambah data pengalaman kerja</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                {/* CARD ANGGOTA KELUARGA (DIVIDE-Y STYLE) */}
                                <Card className="border-border shadow-none overflow-hidden">
                                    <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-transparent">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="p-1.5 sm:p-2 bg-secondary rounded-lg">
                                                    <FamilyIcon className="text-foreground w-5 h-5 sm:w-[22px] sm:h-[22px]"/>
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base sm:text-lg font-bold tracking-tight">Anggota Keluarga</CardTitle>
                                                    <CardDescription className="text-[10px] sm:text-xs">Data orang tua atau keluarga inti siswa (opsional).</CardDescription>
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={addFamily}
                                                className="h-8 sm:h-9 gap-1.5 sm:gap-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm w-full sm:w-auto"
                                            >
                                                <Plus size={14} className="sm:w-4 sm:h-4"/> Tambah Anggota
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {data.families.length > 0 ? (
                                            <div className="divide-y divide-border">
                                                {data.families.map((fam: any, idx: number) => (
                                                    <div key={idx} className="p-4 sm:p-6 hover:bg-secondary/10 transition-colors">
                                                        <div className="flex justify-between items-center mb-4 sm:mb-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary flex items-center justify-center text-[9px] sm:text-[10px] font-black text-primary-foreground">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                                                    Data Keluarga
                                                                </span>
                                                            </div>
                                                            <Button 
                                                                type="button"
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive" 
                                                                onClick={() => removeRow('families', idx)}
                                                            >
                                                                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]"/>
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                                            <FormItem label="Hubungan Keluarga">
                                                                <Select 
                                                                    value={fam.relationship} 
                                                                    onValueChange={v => { 
                                                                        const updated = [...data.families]; 
                                                                        updated[idx].relationship = v; 
                                                                        setData('families', updated); 
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="text-sm">
                                                                        <SelectValue placeholder="Pilih Hubungan" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="父" className="text-sm">Ayah</SelectItem>
                                                                        <SelectItem value="母" className="text-sm">Ibu</SelectItem>
                                                                        <SelectItem value="姉" className="text-sm">Kakak Perempuan</SelectItem>
                                                                        <SelectItem value="兄" className="text-sm">Kakak Laki-Laki</SelectItem>
                                                                        <SelectItem value="妹" className="text-sm">Adik Perempuan</SelectItem>
                                                                        <SelectItem value="弟" className="text-sm">Adik Laki-Laki</SelectItem>
                                                                        <SelectItem value="祖父" className="text-sm">Kakek</SelectItem>
                                                                        <SelectItem value="祖母" className="text-sm">Nenek</SelectItem>
                                                                        <SelectItem value="兄弟" className="text-sm">Saudara Kandung</SelectItem>
                                                                        <SelectItem value="夫" className="text-sm">Suami</SelectItem>
                                                                        <SelectItem value="妻" className="text-sm">Istri</SelectItem>
                                                                        <SelectItem value="娘" className="text-sm">Anak Perempuan</SelectItem>
                                                                        <SelectItem value="息子" className="text-sm">Anak Laki-Laki</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                            <FormItem label="Nama Lengkap">
                                                                <Input placeholder="Nama anggota keluarga" value={fam.name} onChange={e => { const updated = [...data.families]; updated[idx].name = e.target.value; setData('families', updated); }} className="text-sm" />
                                                            </FormItem>
                                                            <FormItem label="Usia">
                                                                <Input type="number" placeholder="Tahun" value={fam.age} onChange={e => { const updated = [...data.families]; updated[idx].age = e.target.value; setData('families', updated); }} className="text-sm" />
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
                                                                    <SelectTrigger className="text-sm">
                                                                        <SelectValue placeholder="Pilih Pekerjaan" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {/* Menggunakan daftar yang sama dengan jobSectors */}
                                                                        {jobSectors.map((job) => (
                                                                            <SelectItem key={job.id} value={job.name_id} className="text-sm">
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
                                            <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-muted/5 px-4">
                                                <FamilyIcon size={40} className="sm:w-12 sm:h-12 text-muted-foreground/20 mb-3 sm:mb-4" />
                                                <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center">Belum ada data keluarga.</p>
                                                <Button variant="link" onClick={addFamily} className="mt-2 sm:mt-1 text-blue-600 text-xs sm:text-sm">Klik untuk menambah</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* STEP 5: INTERNAL LPK & KOMPETENSI */}
                        {step === 5 && (
                            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-border shadow-none overflow-hidden">
                                    <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-transparent">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="p-1.5 sm:p-2 bg-secondary rounded-lg">
                                                <Target className="text-foreground w-5 h-5 sm:w-[22px] sm:h-[22px]"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-base sm:text-lg font-bold tracking-tight">Manajemen & Kompetensi</CardTitle>
                                                <CardDescription className="text-[10px] sm:text-xs">Data internal ini dikunci dan hanya dapat diubah oleh Admin.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                        
                                        {/* FIELD TERKUNCI (DISABLED) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 bg-muted/20 p-3 sm:p-4 rounded-xl border border-dashed">
                                            <FormItem label="Status Siswa" required>
                                                <Input value={data.student_status.toUpperCase()} disabled className="bg-background font-black text-emerald-600 cursor-not-allowed opacity-100 text-sm" />
                                            </FormItem>

                                            <FormItem label="Program Keahlian" required>
                                                <Input value={data.program_expert} disabled className="bg-background font-black text-blue-600 cursor-not-allowed opacity-100 text-sm" />
                                            </FormItem>

                                            <FormItem label="Level Kelas" required>
                                                <Input value={data.class_level} disabled className="bg-background font-bold cursor-not-allowed opacity-100 text-sm" />
                                            </FormItem>


                                        </div>

                                        <Separator />

                                        {/* FIELD YANG HARUS DIISI (EDITABLE) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-6">
                                            {/* TANGGAL MASUK LPK */}
                                            <FormItem label="Tgl Mulai Belajar Bahasa Jepang (atau Tgl Masuk LPK untuk yang masih belum bisa bahasa jepang)" required>
                                                <Input 
                                                    type="date" 
                                                    value={data.entry_date_lpk} 
                                                    onChange={e => setData('entry_date_lpk', e.target.value)}
                                                    className="bg-background font-bold text-sm cursor-pointer" 
                                                    placeholder="YYYY-MM-DD"
                                                />
                                            </FormItem>
                                            {/* SELEKSI ANGKATAN PEREKRUTAN (BARU) */}
                                            <FormItem label="Angkatan Perekrutan" required error={errors.recruitments_id}>
                                                <Select 
                                                    value={data.recruitments_id?.toString()} 
                                                    onValueChange={v => setData('recruitments_id', v)}
                                                >
                                                    <SelectTrigger className="text-sm bg-white font-bold">
                                                        <SelectValue placeholder="Pilih Gelombang Rekrutmen" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {recruitments.map((rec: any) => (
                                                            <SelectItem key={rec.id} value={rec.id.toString()} className="text-sm">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold">{rec.name}</span>
                                                                    <span className="text-[10px] opacity-70 uppercase">
                                                                        {rec.type.replace('_', ' ')} — {new Date(rec.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Pilih program rekrutmen yang Anda ikuti saat ini.
                                                </p>
                                            </FormItem>
                                            {/* KELEBIHAN (STRENGTH) */}
                                            <FormItem label="Kelebihan Diri" required error={errors.strength}>
                                                <Select 
                                                    value={data.strength} 
                                                    onValueChange={v => setData('strength', v)}
                                                >
                                                    <SelectTrigger className="text-sm">
                                                        <SelectValue placeholder="Pilih Kelebihan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="リーダーシップがある" className="text-sm">Memiliki sifat kepemimpinan</SelectItem>
                                                        <SelectItem value="ストレス耐性が強い" className="text-sm">Kuat dalam menghadapi stres</SelectItem>
                                                        <SelectItem value="世話好き" className="text-sm">Suka menolong / Merawat orang lain</SelectItem>
                                                        <SelectItem value="努力家" className="text-sm">Pekerja keras / Rajin berusaha</SelectItem>
                                                        <SelectItem value="協調性がある" className="text-sm">Memiliki sikap kerja sama (Kooperatif)</SelectItem>
                                                        <SelectItem value="几帳面" className="text-sm">Rapi / Teratur</SelectItem>
                                                        <SelectItem value="主体性がある" className="text-sm">Memiliki inisiatif / Mandiri</SelectItem>
                                                        <SelectItem value="論理的思考力がある" className="text-sm">Berpikir logis / Rasional</SelectItem>
                                                        <SelectItem value="行動力がある" className="text-sm">Aktif dalam bertindak</SelectItem>
                                                        <SelectItem value="相手の気持ちを尊重できる" className="text-sm">Menghargai perasaan orang lain</SelectItem>
                                                        <SelectItem value="忍耐力がある" className="text-sm">Memiliki ketahanan / Sabar</SelectItem>
                                                        <SelectItem value="好奇心旺盛" className="text-sm">Rasa ingin tahu yang besar</SelectItem>
                                                        <SelectItem value="調整力がある" className="text-sm">Mampu mengatur situasi / Adaptif</SelectItem>
                                                        <SelectItem value="責任感がある" className="text-sm">Memiliki rasa tanggung jawab</SelectItem>
                                                        <SelectItem value="計画性がある" className="text-sm">Memiliki perencanaan yang baik</SelectItem>
                                                        <SelectItem value="積極性がある" className="text-sm">Proaktif</SelectItem>
                                                        <SelectItem value="前向きな性格" className="text-sm">Sikap positif / Optimis</SelectItem>
                                                        <SelectItem value="柔軟性がある" className="text-sm">Fleksibel / Mudah beradaptasi</SelectItem>
                                                        <SelectItem value="負けず嫌い" className="text-sm">Sangat gigih (Tidak suka kalah)</SelectItem>
                                                        <SelectItem value="目の前の事に集中できる" className="text-sm">Mampu fokus pada tugas</SelectItem>
                                                        <SelectItem value="自分に厳しい" className="text-sm">Kritis terhadap diri sendiri</SelectItem>
                                                        <SelectItem value="素直な性格" className="text-sm">Jujur / Tulus</SelectItem>
                                                        <SelectItem value="礼儀正しい" className="text-sm">Berperilaku sopan (Etika baik)</SelectItem>
                                                        <SelectItem value="仕事が早い" className="text-sm">Cepat dan efisien dalam bekerja</SelectItem>
                                                        <SelectItem value="器用な人" className="text-sm">Terampil / Pandai berbagai hal</SelectItem>
                                                        <SelectItem value="明るい性格" className="text-sm">Sifat ceria / Ramah</SelectItem>
                                                        <SelectItem value="頑張り屋" className="text-sm">Orang yang rajin / Gigih</SelectItem>
                                                        <SelectItem value="真面目" className="text-sm">Serius / Tekun</SelectItem>
                                                        <SelectItem value="社交的" className="text-sm">Senang berinteraksi sosial</SelectItem>
                                                        <SelectItem value="コミュニケーション能力がある" className="text-sm">Kemampuan komunikasi baik</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>

                                            {/* KEKURANGAN (WEAKNESS) */}
                                            <FormItem label="Kekurangan Diri" required error={errors.weakness}>
                                                <Select 
                                                    value={data.weakness} 
                                                    onValueChange={v => setData('weakness', v)}
                                                >
                                                    <SelectTrigger className="text-sm">
                                                        <SelectValue placeholder="Pilih Kekurangan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="我が強い" className="text-sm">Egois / Keras kepala</SelectItem>
                                                        <SelectItem value="頑固" className="text-sm">Keras kepala (Sulit diubah)</SelectItem>
                                                        <SelectItem value="慎重すぎる" className="text-sm">Terlalu cemas / Sangat sensitif</SelectItem>
                                                        <SelectItem value="理屈っぽい" className="text-sm">Terlalu mencari pembenaran logis</SelectItem>
                                                        <SelectItem value="気が弱い" className="text-sm">Cemas / Mudah tertekan</SelectItem>
                                                        <SelectItem value="諦めが悪い" className="text-sm">Sulit menerima kegagalan</SelectItem>
                                                        <SelectItem value="飽き性" className="text-sm">Mudah bosan / Jenuh</SelectItem>
                                                        <SelectItem value="心配性" className="text-sm">Khawatir / Cemas berlebih</SelectItem>
                                                        <SelectItem value="楽親的" className="text-sm">Terlalu santai / Meremehkan</SelectItem>
                                                        <SelectItem value="緊張しやすい" className="text-sm">Mudah gugup / Tegang</SelectItem>
                                                        <SelectItem value="恥ずかしがり屋" className="text-sm">Pemalu / Penakut</SelectItem>
                                                        <SelectItem value="せっかち" className="text-sm">Tergesa-gesa / Cerewet</SelectItem>
                                                        <SelectItem value="人見知り" className="text-sm">Canggung dengan orang baru</SelectItem>
                                                        <SelectItem value="一つの事に集中しやすい" className="text-sm">Hanya bisa fokus pada satu hal</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                            <FormItem label="Skill Teknis" required error={errors.skill_technical}>
                                                <Input maxLength={255} value={data.skill_technical} onChange={e => setData('skill_technical', e.target.value)} placeholder="Contoh: Mengoperasikan Mesin Bubut, Las Listrik" className="text-sm" />
                                            </FormItem>
                                            <FormItem label="Hobi" required error={errors.hobby}>
                                                <Input maxLength={255} value={data.hobby} onChange={e => setData('hobby', e.target.value)} placeholder="Contoh: Olahraga, Membaca Buku" className="text-sm" />
                                            </FormItem>
                                            <FormItem label="Target Tabungan (Yen)" required error={errors.savings_target}>
                                                <Input 
                                                    type="text"
                                                    value={data.savings_target} 
                                                    onChange={e => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        setData('savings_target', value);
                                                    }}
                                                    onKeyPress={e => {
                                                        if (!/[0-9]/.test(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    placeholder="Contoh: 3000000" 
                                                    className="text-sm" 
                                                />
                                            </FormItem>
                                            <FormItem label="Alasan Menabung" required error={errors.savings_reason}>
                                                <Input maxLength={255} value={data.savings_reason} onChange={e => setData('savings_reason', e.target.value)} placeholder="Contoh: Modal Usaha / Membantu Orang Tua" className="text-sm" />
                                            </FormItem>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between mt-6 sm:mt-8 p-3 sm:p-4 bg-secondary/10 rounded-xl border border-border">
                            <Button 
                                variant="ghost" 
                                type="button"
                                disabled={step === 1} 
                                onClick={() => setStep(s => s - 1)}
                                className="text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                            >
                                <ChevronLeft className="mr-1 sm:mr-2 w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Kembali
                            </Button>

                            {step < 5 ? (
                                <Button 
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (validateStep(step)) {
                                            setStep(s => s + 1);
                                        } else {
                                            if (step === 3) {
                                                alert("Mohon tambahkan minimal 1 riwayat pendidikan terakhir Anda.");
                                            } else {
                                                alert("Mohon lengkapi semua field yang wajib diisi pada tahap ini.");
                                            }
                                        }
                                    }}
                                    className={`px-6 sm:px-8 transition-all text-xs sm:text-sm h-9 sm:h-10 ${validateStep(step) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 opacity-50'}`}
                                >
                                    Lanjut <ChevronRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                </Button>
                            ) : (
                                <Button 
                                    type="submit"
                                    // Tombol aktif HANYA JIKA tidak sedang processing DAN validasi step 5 lolos
                                    disabled={processing || !validateStep(5)} 
                                    className="px-6 sm:px-10 bg-green-600 hover:bg-green-700 text-white shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed text-xs sm:text-sm h-9 sm:h-10"
                                >
                                    {processing ? 'Menyimpan...' : (
                                        <>
                                            <Save className="mr-1 sm:mr-2 w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Simpan Seluruh Data
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: SIDEBAR SUMMARY */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-4 sm:top-8 space-y-4 sm:space-y-6">
                            <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden rounded-2xl">
                                {/* Header Ringkasan */}
                                <div className="bg-blue-600 px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2">
                                    <Info className="text-white w-4 h-4 sm:w-5 sm:h-5"/>
                                    <h3 className="text-white text-xs sm:text-sm font-bold uppercase tracking-widest">
                                        Ringkasan Input
                                    </h3>
                                </div>

                                {/* Konten Ringkasan */}
                                <CardContent className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex justify-between border-b border-primary/10 pb-2">
                                            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-medium tracking-tight">NIK</span>
                                            <span className="text-[10px] sm:text-xs font-mono font-bold text-blue-700">{data.nik || '-'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-primary/10 pb-2">
                                            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-medium tracking-tight">Nama</span>
                                            <span className="text-[10px] sm:text-xs font-bold text-right pl-4 break-words">{data.full_name || '-'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-primary/10 pb-2">
                                            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-medium tracking-tight">Status</span>
                                            <span className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase bg-blue-100 px-2 py-0.5 rounded">{data.student_status}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-primary/10 pb-2">
                                            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-medium tracking-tight">TB / BB</span>
                                            <span className="text-[10px] sm:text-xs font-bold">{data.height || '0'} cm / {data.weight || '0'} kg</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2 pt-2">
                                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-black tracking-tighter text-center">Form Step Completion</p>
                                        <div className="flex gap-1 sm:gap-1.5 h-1.5 sm:h-2">
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
                                    <div className="bg-blue-50/50 p-3 sm:p-4 rounded-xl border border-blue-100">
                                        <p className="text-[9px] sm:text-[10px] leading-relaxed text-blue-800 font-medium italic">
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
        <div className={`h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl border-2 transition-all duration-300 flex-shrink-0 ${
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
            <Label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-tight text-muted-foreground/80 ml-1">
                {label} {required && <span className="text-red-500 font-bold">*</span>}
            </Label>
            {children}
            {error && <p className="text-[10px] text-destructive font-bold ml-1">*{error}</p>}
        </div>
    );
}