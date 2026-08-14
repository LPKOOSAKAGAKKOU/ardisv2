import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    User, Mail, Fingerprint, Calendar, MapPin, 
    Ruler, Weight, Heart, Shield, GraduationCap, 
    Briefcase, Users, ArrowLeft, Edit, Phone, 
    Target, Award, BookOpen, PlaneTakeoff,
    Eye, Beer, Flame, Anchor, CreditCard, Info, File, Download, CheckCircle2, UploadCloud, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import axios from 'axios';

// Ganti impor manual yang error tadi dengan ini:
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Props {
    student: any;
}

export default function StudentShow({ student }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Data Siswa', href: '/sensei/students' },
        { title: 'Profil Siswa', href: '#' },
    ];

    const [previewData, setPreviewData] = useState<{ url: string; type: string } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const handlePreview = async (uuid: string, fieldName: string) => {
        setLoadingPreview(fieldName); // Set nama field yang sedang loading
        try {
            const res = await axios.post(`/sensei/students/${student.id}/preview-file`, { uuid });
            if (res.data.status === 'success') {
                setPreviewData({ 
                    url: res.data.data.view_url, 
                    type: res.data.data.mime_type 
                });
            }
        } catch (err) {
            alert("Gagal memuat pratinjau.");
        } finally {
            setLoadingPreview(null); // Reset setelah selesai
        }
    };


    // Fungsi untuk Upload
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // VALIDASI JENIS FILE (JPG, JPEG, PDF)
        const allowedExtensions = ['image/jpeg', 'image/jpg', 'application/pdf'];
        if (!allowedExtensions.includes(file.type)) {
            alert("Format file tidak didukung. Harap unggah file JPG, JPEG, atau PDF.");
            e.target.value = ''; // Reset input
            return;
        }

        setUploadingField(fieldName);
        setUploadProgress(0);
        
        try {
            // 1. Request URL
            setUploadStatus('Menghubungkan ke Yunerva...');
            const req = await axios.post('/sensei/upload-request', {
                filename: file.name,
                extension: file.name.split('.').pop(),
                mime_type: file.type,
                size: file.size
            });

            const { upload_url, upload_ticket } = req.data.data;

            // 2. PUT ke Cloudflare R2
            setUploadStatus('Mengunggah berkas...');
            await axios.put(upload_url, file, { 
                headers: { 'Content-Type': file.type },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
                    setUploadProgress(percentCompleted);
                }
            });

            // 3. Finalize ke Backend
            setUploadStatus('Menyimpan metadata...');
            await axios.post(`/sensei/students/${student.id}/documents-store`, {
                upload_ticket: upload_ticket,
                field_name: fieldName
            });

            setUploadStatus('Selesai!');
            // SOLUSI: Mengambil data terbaru dari server tanpa full reload browser
            // REFRESH DATA TANPA RELOAD BROWSER
            router.reload({ 
                only: ['student'],
                onSuccess: () => {
                    setUploadStatus('');
                    setUploadingField(null);
                }
            });
        } catch (err: any) {
            // Cek log di F12 Console untuk melihat error spesifiknya
            console.error("Detail Error:", err.response?.data || err.message);
            alert("Gagal mengunggah: " + (err.response?.data?.message || "Terjadi kesalahan koneksi"));
            setUploadStatus('');
        } finally {
            setUploadingField(null);
            setUploadProgress(0);
        }
    };
    

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Profil - ${student.full_name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-8 overflow-x-auto rounded-xl">
                
                {/* --- HEADER ACTIONS --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/sensei/students">
                            <Button variant="outline" size="sm" className="border-sidebar-border/70 dark:border-sidebar-border">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">{student.full_name}</h1>
                        <Badge variant="secondary" className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold uppercase tracking-wider text-[10px]">
                            {student.student_status}
                        </Badge>
                    </div>
                    <Link href={`/sensei/students/${student.id}/edit`}>
                        <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 shadow-sm">
                            <Edit className="mr-2 h-4 w-4" /> Edit Profil
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* --- SIDEBAR INFO (LEFT) --- */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardContent className="pt-8 text-center relative">
                                <div className="mx-auto h-28 w-28 rounded-2xl bg-sidebar-accent flex items-center justify-center text-sidebar-foreground border border-sidebar-border/70 mb-4 overflow-hidden relative">
                                    <User size={56} strokeWidth={1.5} />
                                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                                </div>
                                <h3 className="text-lg font-bold">{student.full_name}</h3>
                                <p className="text-sm text-muted-foreground">{student.full_name_katakana || 'カナ未登録'}</p>
                            </CardContent>
                            <Separator className="bg-sidebar-border/50" />
                            <CardContent className="space-y-4 py-6">
                                <DetailRow icon={<Fingerprint size={16}/>} label="NIK" value={student.nik} />
                                <DetailRow icon={<Mail size={16}/>} label="Email" value={student.user?.email} />
                                <DetailRow icon={<Phone size={16}/>} label="Whatsapp" value={student.phone_student} />
                                <DetailRow icon={<MapPin size={16}/>} label="Alamat" value={student.address_ktp} />
                            </CardContent>
                        </Card>

                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardHeader className="bg-sidebar-accent/30 py-3 border-b border-sidebar-border/70">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Info size={14}/> Kondisi Fisik & Medis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-px bg-sidebar-border/70 border-b border-sidebar-border/70">
                                <StatCell label="Tinggi" value={`${student.height} cm`} />
                                <StatCell label="Berat" value={`${student.weight} kg`} />
                                <StatCell label="Darah" value={student.blood_type} />
                                <StatCell label="Warna" value={student.color_blind} />
                            </CardContent>
                            <CardContent className="p-4 space-y-3">
                                <HabitRow label="Merokok" value={student.smoking} />
                                <HabitRow label="Alkohol" value={student.alcohol} />
                                <HabitRow label="Tato" value={student.tattoo} />
                                <HabitRow label="Riwayat TBC" value={student.tbc_history} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- MAIN CONTENT (RIGHT) --- */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* QUICK STATS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <QuickBox title="Target Tabungan" value={`¥${Number(student.savings_target).toLocaleString()}`} icon={<CreditCard size={18}/>} />
                            <QuickBox title="Program LPK" value={student.program_expert || 'B. Jepang'} icon={<Target size={18}/>} />
                            <QuickBox title="Level Kelas" value={student.class_level || 'N/A'} icon={<Award size={18}/>} />
                        </div>

                        {/* EDUCATION RECORDS */}
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardHeader className="border-b border-sidebar-border/70 bg-sidebar-accent/30 py-4 flex flex-row items-center gap-3">
                                <GraduationCap size={20} className="text-muted-foreground" />
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Riwayat Pendidikan</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-sidebar-border/50">
                                {student.educations?.length > 0 ? student.educations.map((edu: any, i: number) => (
                                    <div key={i} className="p-5 flex justify-between items-start hover:bg-sidebar-accent/20 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground leading-none">{edu.school_name}</p>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">{edu.level} • {edu.major || 'Umum'} • {edu.school_type}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="text-[9px] border-sidebar-border/70 text-muted-foreground">{edu.entry_date} - {edu.graduation_date}</Badge>
                                        </div>
                                    </div>
                                )) : <EmptyPlaceholder label="Data pendidikan belum tersedia" />}
                            </CardContent>
                        </Card>

                        {/* WORK RECORDS */}
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardHeader className="border-b border-sidebar-border/70 bg-sidebar-accent/30 py-4 flex flex-row items-center gap-3">
                                <Briefcase size={20} className="text-muted-foreground" />
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Pengalaman Kerja</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-sidebar-border/50">
                                {student.experiences?.length > 0 ? student.experiences.map((exp: any, i: number) => (
                                    <div key={i} className="p-5 flex justify-between items-center hover:bg-sidebar-accent/20 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground leading-none">{exp.company_name}</p>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">{exp.job_type}</p>
                                            <p className="text-[10px] text-muted-foreground/60 italic">{exp.start_date} s/d {exp.end_date || 'Sekarang'}</p>
                                        </div>
                                        <div className="text-right px-4 py-2 bg-sidebar-accent/40 rounded-xl border border-sidebar-border/50">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Salary</p>
                                            <p className="text-sm font-black text-foreground">Rp {Number(exp.monthly_salary).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )) : <EmptyPlaceholder label="Pengalaman kerja belum ditambahkan" />}
                            </CardContent>
                        </Card>

                        {/* FAMILY TABLE */}
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardHeader className="border-b border-sidebar-border/70 bg-sidebar-accent/30 py-4 flex flex-row items-center gap-3">
                                <Users size={20} className="text-muted-foreground" />
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Anggota Keluarga</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-sidebar-border/50">
                                    {student.families?.map((fam: any, i: number) => (
                                        <div key={i} className="p-4 flex items-center gap-4 hover:bg-sidebar-accent/20 transition-colors">
                                            <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0 text-[10px] font-black border border-sidebar-border/70 uppercase">
                                                {fam.relationship.substring(0, 3)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-sm text-foreground truncate leading-tight">{fam.name}</p>
                                                <p className="text-[11px] text-muted-foreground leading-none mt-1">{fam.occupation} • {fam.age} Thn</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* --- DOCUMENT SECTION --- */}
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden mt-6">
                            <CardHeader className="border-b border-sidebar-border/70 bg-sidebar-accent/30 py-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <File size={20} className="text-muted-foreground" />
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Arsip Dokumen Digital</CardTitle>
                                </div>
                                <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-200">
                                    <Shield size={14} className="text-blue-600" />
                                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tighter">
                                        Password: {student.yunerva_file_password}
                                    </span>
                                </div>
                            </CardHeader>
                           <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                        <div key={doc.field} className="group relative flex flex-col p-4 rounded-xl border border-sidebar-border/50 bg-sidebar-accent/5 hover:bg-sidebar-accent/10 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2 rounded-lg ${student[doc.field] ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                                    {student[doc.field] ? <CheckCircle2 size={18} /> : <UploadCloud size={18} />}
                                                </div>
                                                <div className="flex gap-1">
                                                    {student[doc.field] && (
                                                        <>
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="ghost" 
                                                                    className="h-7 w-7" 
                                                                    // TAMBAHKAN field ke dalam parameter fungsi
                                                                    onClick={() => handlePreview(student[doc.field], doc.field)}
                                                                    // CEK apakah field ini yang sedang loading
                                                                    disabled={loadingPreview !== null}
                                                                >
                                                                    {loadingPreview === doc.field ? (
                                                                        <Loader2 size={12} className="animate-spin" />
                                                                    ) : (
                                                                        <Eye size={14} />
                                                                    )}
                                                                </Button>
                                                            <a href={`https://yunerva.aulaa.co/f/${student[doc.field]}`} target="_blank">
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600">
                                                                    <Download size={14} />
                                                                </Button>
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-bold text-foreground uppercase mb-1">{doc.label}</p>
                                            
                                            {uploadingField === doc.field ? (
                                                <div className="mt-auto space-y-2">
                                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
                                                        <span className="text-blue-600 animate-pulse">{uploadStatus}</span>
                                                        <span className="text-muted-foreground">{uploadProgress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-sidebar-accent rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="mt-auto">
                                                    {/* INPUT HANYA MENERIMA JPG, JPEG, PDF */}
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        accept=".jpg,.jpeg,.pdf"
                                                        onChange={(e) => onFileChange(e, doc.field)} 
                                                        disabled={!!uploadingField} 
                                                    />
                                                    <div className="w-full py-2 rounded-md text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors bg-foreground text-background hover:bg-foreground/90">
                                                        {student[doc.field] ? 'Ganti File' : 'Upload'}
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* MODAL PREVIEW */}
            <Dialog open={!!previewData} onOpenChange={() => setPreviewData(null)}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-neutral-950/5 dark:bg-zinc-950/5 backdrop-blur-xl">
                    
                    {/* Header dengan tombol Close manual */}
                    <DialogHeader className="p-4 bg-background/80 backdrop-blur-md border-b flex flex-row items-center justify-between sticky top-0 z-50">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-foreground/80">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                    <Eye size={16} className="text-blue-600" />
                                </div>
                                Pratinjau Dokumen Digital
                            </DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-medium ml-8">Format: {previewData?.type.split('/')[1].toUpperCase()}</p>
                        </div>

                        {/* TOMBAL CLOSE MANUAL */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full hover:bg-muted transition-colors"
                            onClick={() => setPreviewData(null)}
                        >
                            <X size={18} className="text-muted-foreground" />
                        </Button>
                    </DialogHeader>

                    {/* Content Area */}
                    <div className="flex-1 w-full overflow-auto bg-neutral-900/50 flex items-start justify-center p-6">
                        {previewData?.type.includes('image') ? (
                            <div className="relative group flex items-center justify-center min-h-full w-full">
                                <img 
                                    src={previewData.url} 
                                    alt="Preview Dokumen" 
                                    className="max-w-full h-auto object-contain rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden border border-white/20">
                                <iframe 
                                    src={`${previewData?.url}#toolbar=0&navpanes=0`} 
                                    className="w-full h-full" 
                                    title="PDF Preview" 
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-background/80 backdrop-blur-md border-t flex justify-center">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic text-center">
                            Dokumen terenkripsi secara otomatis oleh Yunerva Secure Service
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}


/* --- REUSABLE INTERNAL COMPONENTS (MATCHING THE DASHBOARD THEME) --- */

function DetailRow({ icon, label, value }: any) {
    return (
        <div className="flex gap-4 items-start group">
            <div className="text-muted-foreground/60 mt-0.5 group-hover:text-foreground transition-colors">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className="text-sm font-semibold text-foreground leading-tight">{value || '-'}</p>
            </div>
        </div>
    );
}

function StatCell({ label, value }: any) {
    return (
        <div className="bg-background p-4 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <p className="text-base font-black text-foreground">{value}</p>
        </div>
    );
}

function HabitRow({ label, value }: any) {
    const isHighlight = ['ada', 'merokok', 'minum'].includes(value?.toLowerCase());
    return (
        <div className="flex items-center justify-between py-1 border-b border-sidebar-border/30 last:border-0">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0 h-5 border-sidebar-border/70 ${isHighlight ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                {value}
            </Badge>
        </div>
    );
}

function QuickBox({ title, value, icon }: any) {
    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-sidebar-accent flex items-center justify-center border border-sidebar-border/70 shadow-sm text-muted-foreground">
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                    <p className="text-sm font-black text-foreground mt-0.5 leading-none">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyPlaceholder({ label }: { label: string }) {
    return (
        <div className="p-10 text-center relative overflow-hidden group">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest relative z-10 italic">{label}</p>
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/[0.03] dark:stroke-neutral-100/[0.03]" />
        </div>
    );
}