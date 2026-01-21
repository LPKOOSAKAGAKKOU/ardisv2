import { PlaceholderPattern } from '@/components/ui/placeholder-pattern'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, Link, router } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { 
    UserPlus, Edit3, Calendar, User, FileText, CheckCircle2, 
    AlertCircle, Info, ClipboardList, BookOpen, HeartPulse, Sparkles, ChevronRight,
    Eye, UploadCloud, Loader2, X, ShieldCheck, AlertTriangle, Download, Clock,
    MapPin, Phone, Activity, Heart, Plane, Droplet, Cigarette, Wine, Globe,
    Ban, GraduationCap, Briefcase, Users, Building2, Award, Target, TrendingUp, ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

// Shadcn UI Components
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
    student: any;
    interviews: any[];
}

export default function StudentDashboard({ student, interviews }: Props) {
    // 1. Breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('student.dashboard') },
    ];

    // 2. States
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [previewData, setPreviewData] = useState<{ url: string; type: string } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        identity: true,
        physical: true,
        medical: false,
        passport: false,
        lpk: false,
        education: false,
        experience: false,
        family: false
    });

    // 3. Logic: Preview File
    const handlePreview = async (uuid: string, fieldName: string) => {
        setLoadingPreview(fieldName);
        try {
            const res = await axios.post(route('student.profile.preview-file', student.id), { uuid });
            if (res.data.status === 'success') {
                setPreviewData({ 
                    url: res.data.data.view_url, 
                    type: res.data.data.mime_type 
                });
            }
        } catch (err) {
            alert("Gagal memuat pratinjau berkas.");
        } finally {
            setLoadingPreview(null);
        }
    };

    // 4. Logic: Upload File
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file || !student) return;

        // 1. Validasi Format
        const allowedExtensions = ['image/jpeg', 'image/jpg', 'application/pdf'];
        if (!allowedExtensions.includes(file.type)) {
            alert("Format file tidak didukung. Harap unggah file JPG atau PDF.");
            return;
        }

        // 2. Mapping Label untuk Nama File Otomatis
        const labelMapping: Record<string, string> = {
            "photo_yunerva_uuid": "Foto Studio",
            "photo_with_suit_yunerva_uuid": "Foto Jas",
            "id_card_yunerva_uuid": "KTP",
            "family_card_yunerva_uuid": "Kartu Keluarga",
            "birth_certificate_yunerva_uuid": "Akta Kelahiran",
            "diploma_yunerva_uuid": "Ijazah",
            "transcript_yunerva_uuid": "Transkrip Nilai",
            "1st_medical_checkup_yunerva_uuid": "MCU Tahap 1",
            "2nd_medical_checkup_yunerva_uuid": "MCU Tahap 2",
            "3rd_medical_checkup_yunerva_uuid": "MCU Tahap 3",
            "passport_photo_page_yunerva_uuid": "Paspor",
            "parents_consent_letter_yunerva_uuid": "Izin Orang Tua",
            "japanese_language_certificate_yunerva_uuid": "Sertifikat Jepang",
            "work_contract_yunerva_uuid": "Kontrak Kerja",
        };

        // 3. Proses Pengubahan Nama File
        const extension = file.name.split('.').pop();
        const documentLabel = labelMapping[fieldName] || "Dokumen";
        // Bersihkan nama siswa dari karakter yang dilarang oleh sistem file (OS)
        const cleanStudentName = student.full_name.replace(/[/\\?%*:|"<>]/g, '-');
        
        // Format Hasil: "Foto Jas - Ahmad Zaki.jpg"
        const customFileName = `${documentLabel} - ${cleanStudentName}.${extension}`;

        setUploadingField(fieldName);
        setUploadProgress(0);
        
        try {
            setUploadStatus('Meminta akses...');
            // Mengirim customFileName ke backend
            const req = await axios.post(route('student.profile.upload-request'), {
                filename: customFileName,
                extension: extension,
                mime_type: file.type,
                size: file.size
            });

            const { upload_url, upload_ticket } = req.data.data;

            setUploadStatus('Mengunggah...');
            await axios.put(upload_url, file, { 
                headers: { 'Content-Type': file.type },
                onUploadProgress: (p) => {
                    setUploadProgress(Math.round((p.loaded * 100) / (p.total || 100)));
                }
            });

            setUploadStatus('Menyimpan...');
            await axios.post(route('student.profile.documents-store', student.id), {
                upload_ticket: upload_ticket,
                field_name: fieldName
            });

            setUploadStatus('Berhasil!');
            router.reload({ only: ['student'] });
        } catch (err: any) {
            console.error("Upload Error:", err);
            alert("Gagal mengunggah: " + (err.response?.data?.message || "Terjadi kesalahan koneksi"));
        } finally {
            setUploadingField(null);
            setUploadProgress(0);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'pelatihan': 'bg-blue-100 text-blue-700 border-blue-200',
            'matching': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'lolos_job': 'bg-green-100 text-green-700 border-green-200',
            'berangkat': 'bg-purple-100 text-purple-700 border-purple-200'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100';
    };

    const calculateBMI = () => {
        if (!student?.height || !student?.weight) return '0.0';
        const heightInMeters = student.height / 100;
        const bmi = student.weight / (heightInMeters * heightInMeters);
        return bmi.toFixed(1);
    };

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { text: 'Underweight', color: 'text-blue-600' };
        if (bmi < 25) return { text: 'Normal', color: 'text-green-600' };
        if (bmi < 30) return { text: 'Overweight', color: 'text-orange-600' };
        return { text: 'Obese', color: 'text-red-600' };
    };

    const bmi = parseFloat(calculateBMI());
    const bmiCategory = getBMICategory(bmi);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Siswa" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                {/* --- HEADER --- */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">
                            Halo, {student?.full_name || 'Calon Siswa'}! 👋
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            {student 
                                ? 'Kelola dokumen dan pantau progres karir Jepang Anda.' 
                                : 'Selamat datang! Langkah pertama Anda dimulai dari pengisian profil.'}
                        </p>
                    </div>
                    
                    {student && (
                        <Link 
                            href={route('student.profile.edit')} 
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background shadow-lg hover:opacity-90 transition-all active:scale-95"
                        >
                            <Edit3 className="size-4" /> Edit Profil Lengkap
                        </Link>
                    )}
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* --- MAIN COLUMN (LEFT) --- */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        <AnimatePresence>
                            {isConfirming && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        className="bg-card w-full max-w-md rounded-3xl shadow-2xl border p-8 space-y-6"
                                    >
                                        <div className="flex items-center gap-4 text-amber-600">
                                            <div className="p-3 bg-amber-100 rounded-2xl">
                                                <AlertTriangle className="size-8" />
                                            </div>
                                            <h2 className="text-2xl font-black">PENTING!</h2>
                                        </div>
                                        
                                        <div className="space-y-4 text-sm leading-relaxed">
                                            <p className="text-muted-foreground font-medium">Data yang Anda masukkan bersifat **RESMI** untuk keperluan imigrasi Jepang.</p>
                                            <div className="bg-destructive/5 p-4 rounded-2xl border border-destructive/10 text-destructive text-xs font-bold leading-relaxed">
                                                Dilarang memalsukan data. Kesalahan input data keluarga atau medis dapat menyebabkan penolakan Visa/COE secara permanen.
                                            </div>
                                        </div>

                                        <div className="space-y-3 text-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                Konfirmasi Persetujuan:
                                            </label>
                                            <p className="text-blue-600 text-xs font-bold italic">"saya mengerti dan lanjutkan"</p>
                                            <input 
                                                type="text" 
                                                className="w-full rounded-2xl border-2 bg-secondary/30 px-4 py-4 text-center text-sm focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold"
                                                placeholder="..."
                                                value={confirmationText}
                                                onChange={(e) => setConfirmationText(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <Button 
                                                variant="ghost" 
                                                className="flex-1 h-14 rounded-2xl font-bold"
                                                onClick={() => { setIsConfirming(false); setConfirmationText(''); }}
                                            >
                                                Batal
                                            </Button>
                                            <Link
                                                href={student ? route('student.profile.edit') : route('student.profile.create')}
                                                as="button"
                                                disabled={confirmationText.toLowerCase() !== "saya mengerti dan lanjutkan"}
                                                className={`flex-1 h-14 rounded-2xl font-bold text-white transition-all ${
                                                    confirmationText.toLowerCase() === "saya mengerti dan lanjutkan" 
                                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200' 
                                                    : 'bg-slate-300 cursor-not-allowed'
                                                }`}
                                            >
                                                Lanjutkan
                                            </Link>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {!student ? (
                            <div className="space-y-8">
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-10 text-white shadow-2xl"
                                >
                                    <div className="relative z-10 space-y-6">
                                        <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-4 py-1">Langkah 1: Lengkapi Profil</Badge>
                                        <h3 className="text-4xl font-black leading-tight max-w-md">Mulai Karir Profesional Anda di Jepang.</h3>
                                        <p className="text-blue-100 max-w-lg text-lg leading-relaxed opacity-90">
                                            Profil yang lengkap memudahkan kami mencocokkan keahlian Anda dengan perusahaan di Jepang.
                                        </p>
                                        <button 
                                            onClick={() => setIsConfirming(true)}
                                            className="inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-sm font-black text-blue-700 hover:bg-blue-50 transition-all hover:scale-105 shadow-xl"
                                        >
                                            <UserPlus className="size-5" /> Isi Biodata Sekarang
                                        </button>
                                    </div>
                                    <PlaceholderPattern className="absolute inset-0 size-full stroke-white/5 [mask-image:radial-gradient(white,transparent)]" />
                                </motion.div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <PreparationCard 
                                        icon={<ClipboardList className="text-orange-500" />}
                                        title="Data KTP & Fisik"
                                        description="Siapkan NIK dan hasil ukur TB/BB terbaru."
                                        details={["NIK 16 Digit", "Tinggi & Berat Badan", "Golongan Darah", "Status Tato"]}
                                    />
                                    <PreparationCard 
                                        icon={<BookOpen className="text-blue-500" />}
                                        title="Data Pendidikan"
                                        description="Informasi ijazah dari SD hingga terakhir."
                                        details={["Nama Sekolah", "Tahun Lulus", "Jurusan", "Scan Ijazah"]}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* STATUS BADGE UTAMA */}
                                <div className="rounded-[2rem] border bg-card p-6 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                                                {student.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-foreground">{student.full_name}</h3>
                                                <p className="text-xs text-muted-foreground font-medium">NIK: {student.nik}</p>
                                            </div>
                                        </div>
                                        <Badge className={`${getStatusColor(student.student_status)} font-black uppercase px-4 py-2`}>
                                            {student.student_status?.replace('_', ' ') || 'AKTIF'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* SECTION 1: IDENTITAS DASAR */}
                                <CollapsibleSection
                                    title="Identitas Dasar"
                                    icon={<User className="size-5 text-blue-600" />}
                                    isExpanded={expandedSections.identity}
                                    onToggle={() => toggleSection('identity')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        <InfoBlock label="Nama Lengkap" value={student.full_name} />
                                        {student.full_name_katakana && (
                                            <InfoBlock label="Nama Katakana" value={student.full_name_katakana} icon="🇯🇵" />
                                        )}
                                        <InfoBlock label="NIK" value={student.nik} icon={<ShieldCheck className="size-3" />} />
                                        <InfoBlock label="Jenis Kelamin" value={student.gender} />
                                        <InfoBlock label="Tempat Lahir" value={student.pob} icon={<MapPin className="size-3" />} />
                                        <InfoBlock label="Provinsi Lahir" value={student.pob_province} />
                                        <InfoBlock label="Tanggal Lahir" value={student.dob} icon={<Calendar className="size-3" />} />
                                        <InfoBlock label="Usia" value={`${new Date().getFullYear() - new Date(student.dob).getFullYear()} tahun`} />
                                        <InfoBlock label="Agama" value={student.religion} />
                                        <InfoBlock label="Status Nikah" value={student.marital_status} />
                                        <InfoBlock label="Telepon Siswa" value={student.phone_student} icon={<Phone className="size-3" />} />
                                        <InfoBlock label="Telepon Ortu" value={student.phone_parent} icon={<Phone className="size-3" />} />
                                    </div>
                                    <div className="mt-6 p-4 bg-muted/30 rounded-xl">
                                        <p className="text-xs font-black uppercase text-muted-foreground mb-2">Alamat KTP</p>
                                        <p className="text-sm font-medium text-foreground">{student.address_ktp}</p>
                                    </div>
                                </CollapsibleSection>

                                {/* SECTION 2: DATA FISIK & KEBIASAAN */}
                                <CollapsibleSection
                                    title="Data Fisik & Kebiasaan"
                                    icon={<Activity className="size-5 text-green-600" />}
                                    isExpanded={expandedSections.physical}
                                    onToggle={() => toggleSection('physical')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <InfoBlock label="Tinggi Badan" value={`${student.height} cm`} />
                                        <InfoBlock label="Berat Badan" value={`${student.weight} kg`} />
                                        <InfoBlock label="BMI" value={calculateBMI()} badge={bmiCategory.text} badgeColor={bmiCategory.color} />
                                        <InfoBlock label="Golongan Darah" value={student.blood_type} icon={<Droplet className="size-3 text-red-500" />} />
                                    </div>
                                    
                                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <StatusCard 
                                            label="Tato" 
                                            value={student.tattoo}
                                            icon={student.tattoo === 'ada' ? <AlertCircle className="size-4 text-orange-600" /> : <CheckCircle2 className="size-4 text-green-600" />}
                                            positive={student.tattoo === 'tidak'}
                                        />
                                        <StatusCard 
                                            label="Merokok" 
                                            value={student.smoking}
                                            icon={student.smoking === 'merokok' ? <Cigarette className="size-4 text-orange-600" /> : <Ban className="size-4 text-green-600" />}
                                            positive={student.smoking === 'tidak merokok'}
                                        />
                                        <StatusCard 
                                            label="Alkohol" 
                                            value={student.alcohol}
                                            icon={student.alcohol === 'minum' ? <Wine className="size-4 text-orange-600" /> : <Ban className="size-4 text-green-600" />}
                                            positive={student.alcohol === 'tidak minum'}
                                        />
                                        <StatusCard 
                                            label="Keluarga di Jepang" 
                                            value={student.family_in_japan}
                                            icon={<Globe className="size-4" />}
                                            positive={false}
                                        />
                                    </div>
                                </CollapsibleSection>

                                {/* SECTION 3: DATA MEDIS */}
                                <CollapsibleSection
                                    title="Data Medis"
                                    icon={<Heart className="size-5 text-red-600" />}
                                    isExpanded={expandedSections.medical}
                                    onToggle={() => toggleSection('medical')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <StatusCard 
                                            label="Riwayat TBC" 
                                            value={student.tbc_history}
                                            icon={student.tbc_history === 'ada' ? <AlertCircle className="size-4 text-red-600" /> : <CheckCircle2 className="size-4 text-green-600" />}
                                            positive={student.tbc_history === 'tidak'}
                                        />
                                        <InfoBlock 
                                            label="Buta Warna" 
                                            value={student.color_blind === 'normal' ? 'Normal' : student.color_blind}
                                            icon={<Eye className="size-3" />}
                                        />
                                    </div>
                                    
                                    {student.other_illness && (
                                        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                            <p className="text-xs font-black uppercase text-orange-700 mb-2">Riwayat Penyakit/Operasi Lainnya</p>
                                            <p className="text-sm font-medium text-orange-900">{student.other_illness}</p>
                                        </div>
                                    )}
                                </CollapsibleSection>

                                {/* SECTION 4: DATA PASSPORT */}
                                <CollapsibleSection
                                    title="Data Passport"
                                    icon={<Plane className="size-5 text-indigo-600" />}
                                    isExpanded={expandedSections.passport}
                                    onToggle={() => toggleSection('passport')}
                                >
                                    {student.has_passport === 'ada' ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            <InfoBlock label="Nomor Passport" value={student.passport_number || '-'} />
                                            <InfoBlock label="Tanggal Terbit" value={student.passport_issue_date || '-'} />
                                            <InfoBlock label="Tanggal Kadaluarsa" value={student.passport_expiry_date || '-'} />
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl text-center">
                                            <AlertCircle className="size-8 text-orange-600 mx-auto mb-3" />
                                            <p className="text-sm font-bold text-orange-900">Belum memiliki passport</p>
                                        </div>
                                    )}
                                </CollapsibleSection>

                                {/* SECTION 5: DATA LPK INTERNAL */}
                                <CollapsibleSection
                                    title="Data LPK Internal"
                                    icon={<Building2 className="size-5 text-purple-600" />}
                                    isExpanded={expandedSections.lpk}
                                    onToggle={() => toggleSection('lpk')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        <InfoBlock label="Level Kelas" value={student.class_level} icon={<BookOpen className="size-3" />} />
                                        <InfoBlock label="Program Keahlian" value={student.program_expert} icon={<Award className="size-3" />} />
                                        <InfoBlock label="Tanggal Masuk LPK" value={student.entry_date_lpk} />
                                        <InfoBlock label="Skill Teknis" value={student.skill_technical} />
                                        <InfoBlock label="Hobi" value={student.hobby} />
                                        <InfoBlock label="Target Tabungan" value={student.savings_target} icon={<Target className="size-3" />} />
                                        <InfoBlock label="Alasan Menabung" value={student.savings_reason} />
                                    </div>
                                    
                                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                            <p className="text-xs font-black uppercase text-green-700 mb-2 flex items-center gap-2">
                                                <TrendingUp className="size-3" /> Kelebihan
                                            </p>
                                            <p className="text-sm font-medium text-green-900">{student.strength}</p>
                                        </div>
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                            <p className="text-xs font-black uppercase text-blue-700 mb-2 flex items-center gap-2">
                                                <Target className="size-3" /> Area Pengembangan
                                            </p>
                                            <p className="text-sm font-medium text-blue-900">{student.weakness}</p>
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* SECTION 6: RIWAYAT PENDIDIKAN */}
                                {student.educations && student.educations.length > 0 && (
                                    <CollapsibleSection
                                        title="Riwayat Pendidikan"
                                        icon={<GraduationCap className="size-5 text-blue-600" />}
                                        isExpanded={expandedSections.education}
                                        onToggle={() => toggleSection('education')}
                                        badge={`${student.educations.length} Riwayat`}
                                    >
                                        <div className="space-y-4">
                                            {student.educations.map((edu: any, idx: number) => (
                                                <div key={idx} className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <Badge className="bg-blue-600 text-white mb-2">{edu.level}</Badge>
                                                            <h4 className="font-black text-foreground text-lg">{edu.school_name}</h4>
                                                            <p className="text-sm text-muted-foreground font-medium">{edu.school_type}</p>
                                                        </div>
                                                        <Badge variant="outline" className="font-bold">
                                                            {new Date(edu.entry_date).getFullYear()} - {new Date(edu.graduation_date).getFullYear()}
                                                        </Badge>
                                                    </div>
                                                    {edu.major && (
                                                        <div className="mt-3 flex items-center gap-2 text-sm">
                                                            <Award className="size-4 text-blue-600" />
                                                            <span className="font-bold text-blue-900">Jurusan: {edu.major}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CollapsibleSection>
                                )}

                                {/* SECTION 7: PENGALAMAN KERJA */}
                                {student.experiences && student.experiences.length > 0 && (
                                    <CollapsibleSection
                                        title="Pengalaman Kerja"
                                        icon={<Briefcase className="size-5 text-orange-600" />}
                                        isExpanded={expandedSections.experience}
                                        onToggle={() => toggleSection('experience')}
                                        badge={`${student.experiences.length} Pengalaman`}
                                    >
                                        <div className="space-y-4">
                                            {student.experiences.map((exp: any, idx: number) => (
                                                <div key={idx} className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-black text-foreground text-lg">{exp.company_name}</h4>
                                                            <Badge className="bg-orange-600 text-white mt-2">{exp.job_type}</Badge>
                                                        </div>
                                                        <Badge variant="outline" className="font-bold">
                                                            {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Sekarang'}
                                                        </Badge>
                                                    </div>
                                                    {exp.monthly_salary && (
                                                        <div className="mt-3 flex items-center gap-2 text-sm">
                                                            <span className="font-bold text-orange-900">
                                                                Gaji: Rp {exp.monthly_salary.toLocaleString('id-ID')} / bulan
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CollapsibleSection>
                                )}

                                {/* SECTION 8: DATA KELUARGA */}
                                {student.families && student.families.length > 0 && (
                                    <CollapsibleSection
                                        title="Data Keluarga"
                                        icon={<Users className="size-5 text-pink-600" />}
                                        isExpanded={expandedSections.family}
                                        onToggle={() => toggleSection('family')}
                                        badge={`${student.families.length} Anggota`}
                                    >
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {student.families.map((family: any, idx: number) => (
                                                <div key={idx} className="p-5 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="h-10 w-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-700 font-black">
                                                            {family.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-foreground">{family.name}</h4>
                                                            <Badge className="bg-pink-600 text-white text-xs">{family.relationship}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                                        <div>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase">Usia</p>
                                                            <p className="font-bold text-foreground">{family.age} tahun</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase">Pekerjaan</p>
                                                            <p className="font-bold text-foreground">{family.occupation}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CollapsibleSection>
                                )}

                                {/* WAWANCARA */}
                                <div className="rounded-[2rem] border bg-card p-8 shadow-sm">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h2 className="flex items-center gap-3 font-black uppercase text-sm tracking-widest text-muted-foreground">
                                            <Calendar className="size-5 text-emerald-600" /> Agenda Wawancara
                                        </h2>
                                    </div>
                                    
                                    {interviews && interviews.length > 0 ? (
                                        <div className="space-y-4">
                                            {interviews.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                                   <div className="flex items-center gap-4">
                                                        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-700">
                                                            <Clock size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-foreground">{item.job_title || 'Interview Kerja'}</p>
                                                            <p className="text-xs text-muted-foreground font-medium">{item.date} • {item.time}</p>
                                                        </div>
                                                   </div>
                                                   <Badge className="bg-emerald-600">Mendatang</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-secondary/20 rounded-[1.5rem] border-2 border-dashed border-muted">
                                            <AlertCircle className="mb-3 size-8 opacity-20" />
                                            <p className="text-sm font-bold opacity-40 uppercase tracking-tighter">Belum ada jadwal wawancara aktif</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- SIDEBAR COLUMN (RIGHT) --- */}
                    <div className="lg:col-span-4 space-y-8">
                        {student && (
                            <div className="rounded-[2rem] border bg-card p-8 shadow-sm space-y-6">
                                <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-muted-foreground border-b pb-4">
                                    <FileText className="size-5" /> Berkas Digital
                                </h3>
                                
                                {/* Menggunakan scroll area jika daftar dokumen sangat panjang agar dashboard tidak timpang */}
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                                    {[
                                        { label: "Foto Studio", field: "photo_yunerva_uuid" },
                                        { label: "Foto Setelan Jas", field: "photo_with_suit_yunerva_uuid" },
                                        { label: "KTP (ID Card)", field: "id_card_yunerva_uuid" },
                                        { label: "Kartu Keluarga", field: "family_card_yunerva_uuid" },
                                        { label: "Akta Kelahiran", field: "birth_certificate_yunerva_uuid" },
                                        { label: "Ijazah Terakhir", field: "diploma_yunerva_uuid" },
                                        { label: "Transkrip Nilai", field: "transcript_yunerva_uuid" },
                                        { label: "MCU Tahap 1", field: "1st_medical_checkup_yunerva_uuid" },
                                        { label: "MCU Tahap 2", field: "2nd_medical_checkup_yunerva_uuid" },
                                        { label: "MCU Tahap 3", field: "3rd_medical_checkup_yunerva_uuid" },
                                        { label: "Halaman Foto Paspor", field: "passport_photo_page_yunerva_uuid" },
                                        { label: "Surat Izin Orang Tua", field: "parents_consent_letter_yunerva_uuid" },
                                        { label: "Sertifikat Bahasa Jepang", field: "japanese_language_certificate_yunerva_uuid" },
                                        { label: "Kontrak Kerja", field: "work_contract_yunerva_uuid" },
                                    ].map((doc) => (
                                        <DocStatus 
                                            key={doc.field}
                                            label={doc.label} 
                                            fieldName={doc.field}
                                            isUploaded={!!student?.[doc.field]} 
                                            uuid={student?.[doc.field]}
                                            onUpload={onFileChange}
                                            onPreview={handlePreview}
                                            isUploading={uploadingField}
                                            isLoadingPreview={loadingPreview}
                                            uploadProgress={uploadProgress}
                                        />
                                    ))}
                                </div>

                                {/* Hint Password */}
                                <div className="mt-8 rounded-2xl bg-blue-600 p-5 text-white shadow-xl shadow-blue-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ShieldCheck className="size-5 opacity-80" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enkripsi Berkas</span>
                                    </div>
                                    <p className="text-[10px] font-medium leading-relaxed opacity-80 mb-4">
                                        Gunakan password ini jika dokumen meminta kunci saat dibuka.
                                    </p>
                                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center border border-white/30">
                                        <span className="text-xs font-black font-mono tracking-widest">{student.yunerva_file_password}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bantuan Box */}
                        <div className="rounded-[2rem] border border-orange-200 bg-orange-50/50 p-8 dark:bg-orange-950/10 dark:border-orange-900/30">
                            <h3 className="flex items-center gap-3 text-sm font-black text-orange-800 dark:text-orange-300">
                                <Info className="size-5" /> PANDUAN
                            </h3>
                            <p className="mt-2 text-[11px] text-orange-800/80 font-bold leading-relaxed">
                                Format file harus **JPG** atau **PDF**. Pastikan hasil scan terlihat jelas agar proses verifikasi admin lebih cepat.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL PREVIEW --- */}
            <Dialog open={!!previewData} onOpenChange={() => setPreviewData(null)}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-background/95 backdrop-blur-xl">
                    <DialogHeader className="p-5 bg-background/80 border-b flex flex-row items-center justify-between sticky top-0 z-50">
                        <DialogTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-foreground/70">
                            <div className="p-2 bg-blue-50 rounded-xl"><Eye size={18} className="text-blue-600" /></div>
                            Pratinjau Dokumen
                        </DialogTitle>
                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setPreviewData(null)}>
                            <X size={20} />
                        </Button>
                    </DialogHeader>
                    <div className="flex-1 bg-neutral-900/5 flex items-center justify-center p-8 overflow-auto">
                        {previewData?.type.includes('image') ? (
                            <img src={previewData.url} className="max-w-full h-auto rounded-xl shadow-2xl border-4 border-white" alt="Preview" />
                        ) : (
                            <div className="w-full h-full bg-white rounded-2xl shadow-inner border overflow-hidden">
                                <iframe src={`${previewData?.url}#toolbar=0`} className="w-full h-full" />
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-muted/30 border-t text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter italic">Yunerva Secure Document Viewer • Encrypted</p>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    )
}

// --- SUB-COMPONENTS ---

function CollapsibleSection({ 
    title, 
    icon, 
    children, 
    isExpanded, 
    onToggle,
    badge 
}: { 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    isExpanded: boolean; 
    onToggle: () => void;
    badge?: string;
}) {
    return (
        <div className="rounded-[2rem] border bg-card shadow-sm overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <h2 className="font-black uppercase text-sm tracking-widest text-muted-foreground">
                        {title}
                    </h2>
                    {badge && (
                        <Badge variant="secondary" className="ml-2">{badge}</Badge>
                    )}
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="size-5 text-muted-foreground" />
                </motion.div>
            </button>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-6 pt-0 border-t">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InfoBlock({ 
    label, 
    value, 
    icon, 
    badge, 
    badgeColor 
}: { 
    label: string; 
    value: string; 
    icon?: React.ReactNode; 
    badge?: string;
    badgeColor?: string;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.1em] opacity-70">
                    {label}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground capitalize truncate">
                    {value || '-'}
                </span>
                {badge && (
                    <Badge className={`text-[9px] ${badgeColor}`}>{badge}</Badge>
                )}
            </div>
        </div>
    );
}

function StatusCard({ 
    label, 
    value, 
    icon, 
    positive 
}: { 
    label: string; 
    value: string; 
    icon: React.ReactNode; 
    positive: boolean;
}) {
    return (
        <div className={`p-4 rounded-xl border-2 ${
            positive 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
        }`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-[9px] font-black uppercase tracking-wider opacity-70">
                    {label}
                </span>
            </div>
            <p className={`text-sm font-bold capitalize ${
                positive ? 'text-green-900' : 'text-orange-900'
            }`}>
                {value}
            </p>
        </div>
    );
}

function PreparationCard({ icon, title, description, details }: any) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="h-fit">
            <motion.div 
                layout 
                onClick={() => setIsOpen(!isOpen)}
                className="group cursor-pointer rounded-[1.5rem] border bg-card p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-lg"
            >
                <div className="flex items-start gap-4">
                    <div className="shrink-0 rounded-2xl bg-secondary p-3 transition-colors group-hover:bg-blue-50">{icon}</div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-foreground uppercase tracking-tight">{title}</h4>
                            <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronRight className="size-4 text-muted-foreground" />
                            </motion.div>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{description}</p>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }} 
                                    animate={{ height: 'auto', opacity: 1 }} 
                                    exit={{ height: 0, opacity: 0 }} 
                                    className="mt-4 border-t pt-4 space-y-2"
                                >
                                    {details.map((d: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 p-2 rounded-lg">
                                            <Sparkles className="size-3" /><span>{d}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function DocStatus({ label, isUploaded, fieldName, onUpload, onPreview, isUploading, isLoadingPreview, uploadProgress, uuid }: any) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between rounded-2xl border border-sidebar-border/50 bg-sidebar-accent/5 p-4 transition-all hover:bg-sidebar-accent/10">
                <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                        {isUploaded ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80">{label}</span>
                </div>
                
                <div className="flex gap-2">
                    {isUploaded && uuid && (
                        <>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600" 
                                onClick={() => onPreview(uuid, fieldName)} 
                                disabled={isLoadingPreview !== null}
                            >
                                {isLoadingPreview === fieldName ? <Loader2 size={14} className="animate-spin" /> : <Eye size={16} />}
                            </Button>
                            <a href={`https://yunerva.com/f/${uuid}`} target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground"><Download size={14}/></Button>
                            </a>
                        </>
                    )}
                    <label className="cursor-pointer">
                        <input type="file" className="hidden" accept=".jpg,.jpeg,.pdf" onChange={(e) => onUpload(e, fieldName)} disabled={isUploading !== null} />
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${isUploaded ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'}`}>
                            {isUploading === fieldName ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={16} />}
                        </div>
                    </label>
                </div>
            </div>
            
            {isUploading === fieldName && (
                <div className="px-2 space-y-1.5">
                    <div className="flex justify-between text-[8px] font-black uppercase text-blue-600 tracking-widest">
                        <span className="animate-pulse">Mengunggah ke Yunerva...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-sidebar-accent rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-blue-600" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}