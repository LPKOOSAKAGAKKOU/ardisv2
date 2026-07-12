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
    Ban, GraduationCap, Briefcase, Users, Building2, Award, Target, TrendingUp, ChevronDown, PlaneTakeoff,
    FileSpreadsheet,
    Trash2,
    CreditCard,
    ExternalLink,
    RefreshCw,
} from 'lucide-react'
import { useState, useEffect } from 'react'
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

interface PaymentData {
    id: number;
    invoice_number: string;
    amount: number;
    original_amount: number;
    discount: number;
    status: string;
    payment_url: string;
    expired_at?: string;
    payment_method?: string;
    payment_date?: string;
    description?: string;
    additional_items?: { name: string; amount: number }[];
}

interface Props {
    student: any;
    interviews: any[];
    passedApplication?: {
        interview: {
            interviewer_title: string;
            type: string;
            date_fly_to_japan?: string;
            company?: {
                name: string;
                address: string;
            }
        }
    } | null;
    paymentJob?: PaymentData | null;
    paymentCoeDokumen?: PaymentData | null;
    paymentCoeAdmin?: PaymentData | null;
}

function Countdown({ expiredAt, onExpire }: { expiredAt: string; onExpire?: () => void }) {
    const calculateTimeLeft = () => {
        const difference = +new Date(expiredAt) - +new Date();
        let timeLeft = '';

        if (difference > 0) {
            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            const parts = [];
            if (hours > 0) parts.push(`${hours}j`);
            parts.push(`${minutes}m`);
            parts.push(`${seconds}d`);
            timeLeft = parts.join(' ');
        } else {
            timeLeft = 'Kedaluwarsa';
        }

        return { difference, text: timeLeft };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const calculated = calculateTimeLeft();
            setTimeLeft(calculated);
            if (calculated.difference <= 0) {
                clearInterval(timer);
                if (onExpire) onExpire();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiredAt]);

    return (
        <span className={timeLeft.difference <= 0 ? "text-red-500 font-bold text-xs" : "text-amber-600 font-bold text-xs"}>
            {timeLeft.text}
        </span>
    );
}

export default function StudentDashboard({ student, interviews, passedApplication, paymentJob, paymentCoeDokumen, paymentCoeAdmin }: Props) {
    const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

    const handleRegeneratePayment = (id: number) => {
        router.post(route('student.payment.regenerate', id), {}, {
            onStart: () => setRegeneratingId(id),
            onFinish: () => setRegeneratingId(null),
            preserveScroll: true,
        });
    };

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

    // Tambahkan di bagian state (dekat state lainnya)
    const [loadingDelete, setLoadingDelete] = useState<string | null>(null);

    const handleDelete = async (fieldName: string, label: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus file "${label}"?`)) return;

        setLoadingDelete(fieldName);
        try {
            const res = await axios.delete(route('student.profile.documents-delete', student.id), {
                data: { field_name: fieldName }
            });

            if (res.data.status === 'success') {
                router.reload({ preserveScroll: true, only: ['student'] });
            }
        } catch (err) {
            console.error(err);
            alert("Gagal menghapus berkas.");
        } finally {
            setLoadingDelete(null);
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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left Side: Greeting */}
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            Halo, {student?.full_name || 'Calon Siswa'}! 👋
                        </h1>
                        <p className="text-muted-foreground text-xs sm:text-sm font-medium mt-1">
                            {student 
                                ? 'Kelola dokumen dan pantau progres karir Jepang Anda.' 
                                : 'Selamat datang! Langkah pertama Anda dimulai dari pengisian profil.'}
                        </p>
                    </div>

                    {/* Right Side: Action Buttons (Edit Profile & Download CV) */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {student && (
                            <>
                                {/* Tombol Download CV Langsung ke URL String */}
                                <Button 
                                    onClick={() => window.open(`/generate-cv/${student.user_id}`, '_blank')}
                                    variant="outline"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto"
                                >
                                    <FileSpreadsheet className="size-3.5 sm:size-4" /> Download CV (Excel)
                                </Button>

                                {/* Tombol Edit Profil */}
                                <Link 
                                    href={route('student.profile.edit')} 
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-background shadow-lg hover:opacity-90 transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto"
                                >
                                    <Edit3 className="size-3.5 sm:size-4" /> Edit Profil Lengkap
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* --- CARD SECTION: Company Placement OR Interview Schedule --- */}
                <div className="mt-6">
                    {passedApplication ? (
                        <div className="flex flex-col gap-6">
                            {/* ========== CARD: LULUS SELEKSI - INFO PERUSAHAAN ========== */}
                            <div className="rounded-2xl sm:rounded-[2rem] border bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden">
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>

                                {/* Header */}
                                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                                    <h2 className="flex items-center gap-2 sm:gap-3 font-black uppercase text-xs sm:text-sm tracking-widest text-emerald-700">
                                        <Building2 className="size-4 sm:size-5" /> Perusahaan Penempatan
                                    </h2>
                                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                        Lulus Seleksi
                                    </Badge>
                                </div>

                                {/* Content Card */}
                                <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-100/50 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                        {/* Left: Job Position */}
                                        <div>
                                            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Posisi Pekerjaan</p>
                                            <h3 className="text-xl sm:text-2xl font-black text-foreground mb-2">
                                                {passedApplication.interview.interviewer_title}
                                            </h3>
                                            <p className="text-xs sm:text-sm font-medium text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full w-fit">
                                                Program: {passedApplication.interview.type === 'ginoujisshuu' ? 'Magang (Ginou Jisshuu)' : 'Tokutei Ginou (TG)'}
                                            </p>
                                        </div>

                                        {/* Right: Company Details */}
                                        <div className="space-y-3 sm:space-y-4">
                                            {/* Company Name */}
                                            <div className="flex items-start gap-2 sm:gap-3">
                                                <div className="mt-1 p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                                                    <Building2 className="size-4 sm:size-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">Nama Perusahaan</p>
                                                    <p className="font-bold text-base sm:text-lg text-foreground break-words">
                                                        {passedApplication.interview.company?.name || 'Nama Perusahaan Dirahasiakan'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Location */}
                                            <div className="flex items-start gap-2 sm:gap-3">
                                                <div className="mt-1 p-1.5 sm:p-2 bg-orange-50 text-orange-600 rounded-lg flex-shrink-0">
                                                    <MapPin className="size-4 sm:size-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">Lokasi</p>
                                                    <p className="font-semibold text-sm sm:text-base text-foreground break-words">
                                                        {passedApplication.interview.company?.address || 'Jepang'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Departure Date */}
                                            {passedApplication.interview.date_fly_to_japan && (
                                                <div className="flex items-start gap-2 sm:gap-3">
                                                    <div className="mt-1 p-1.5 sm:p-2 bg-purple-50 text-purple-600 rounded-lg flex-shrink-0">
                                                        <PlaneTakeoff className="size-4 sm:size-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">Estimasi Keberangkatan</p>
                                                        <p className="font-bold text-sm sm:text-base text-foreground">
                                                            {new Date(passedApplication.interview.date_fly_to_japan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer: Action Button */}
                                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-emerald-100 flex justify-end">
                                        <Button 
                                            onClick={() => router.visit(route('student.interviews.index'))}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 text-xs sm:text-sm w-full sm:w-auto"
                                        >
                                            <FileText className="size-3.5 sm:size-4 mr-2" /> Lengkapi Dokumen Keberangkatan
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* ========== CARD: TAGIHAN PEMBAYARAN LULUS JOB (AULAA) ========== */}
                            {paymentJob && (
                                <div className="rounded-2xl sm:rounded-[2rem] border bg-white dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden">
                                    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                                        <h2 className="flex items-center gap-2 sm:gap-3 font-black uppercase text-xs sm:text-sm tracking-widest text-neutral-800 dark:text-neutral-200">
                                            <CreditCard className="size-4 sm:size-5 text-neutral-700 dark:text-neutral-300" /> Tagihan Kelulusan Wawancara (Lulus Job)
                                        </h2>
                                        {paymentJob.status === 'paid' ? (
                                            <Badge className="bg-green-600 hover:bg-green-700 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                                Lunas
                                            </Badge>
                                        ) : paymentJob.status === 'pending' ? (
                                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                                Belum Dibayar
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-zinc-500 hover:bg-zinc-650 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                                {paymentJob.status.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="relative z-10 bg-neutral-50/50 dark:bg-zinc-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-neutral-100 dark:border-zinc-800 shadow-sm">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div>
                                                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Rincian Pembayaran</p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl sm:text-3xl font-black text-foreground">
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentJob.amount)}
                                                        </span>
                                                    </div>
                                                    {paymentJob.discount > 0 && (
                                                        <p className="text-xs text-red-500 font-medium">
                                                            Potongan (Diskon Admin): -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentJob.discount)}
                                                        </p>
                                                    )}
                                                    {paymentJob.additional_items && paymentJob.additional_items.length > 0 && (
                                                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                                            <span className="font-semibold text-neutral-550">Item Tambahan:</span>
                                                            <ul className="list-disc pl-4 text-[11px] gap-0.5 mt-0.5">
                                                                {paymentJob.additional_items.map((add: any, idx: number) => (
                                                                    <li key={idx}>
                                                                        {add.name}: +{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(add.amount)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                                                        No. Invoice: {paymentJob.invoice_number}
                                                    </p>
                                                    {paymentJob.status === 'pending' && paymentJob.expired_at && (
                                                        <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30 w-fit">
                                                            <span>Batas Waktu Bayar:</span>
                                                            <Countdown expiredAt={paymentJob.expired_at} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full md:w-auto">
                                                {paymentJob.status === 'pending' ? (
                                                    <div className="flex flex-col gap-3">
                                                        <p className="text-xs text-muted-foreground max-w-sm">
                                                            Silakan selesaikan pembayaran tagihan lulus wawancara Anda melalui tautan resmi Aulaa di bawah ini.
                                                        </p>
                                                        {paymentJob.payment_url ? (
                                                            <Button 
                                                                onClick={() => window.open(paymentJob.payment_url, '_blank')}
                                                                className="bg-neutral-900 text-white dark:bg-white dark:text-black font-bold rounded-xl shadow-lg text-xs sm:text-sm w-full md:w-auto"
                                                            >
                                                                <ExternalLink className="size-3.5 sm:size-4 mr-2" /> Bayar Sekarang
                                                            </Button>
                                                        ) : (
                                                            <p className="text-xs font-semibold text-emerald-600">Silakan lakukan pembayaran langsung ke kantor LPK.</p>
                                                        )}
                                                    </div>
                                                ) : paymentJob.status === 'paid' ? (
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        <p className="text-green-650 font-bold flex items-center gap-1">
                                                            <CheckCircle2 size={14} className="text-green-600" /> Pembayaran Anda telah diterima. Terima kasih!
                                                        </p>
                                                        <p>Metode Pembayaran: <strong className="text-foreground">{paymentJob.payment_method?.toUpperCase()}</strong></p>
                                                        <p>Tanggal Bayar: <strong className="text-foreground">{paymentJob.payment_date}</strong></p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-xs text-muted-foreground italic">
                                                            Tagihan {paymentJob.status === 'expired' ? 'kedaluwarsa' : (paymentJob.status === 'failed' ? 'gagal' : 'dibatalkan')}.
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={regeneratingId === paymentJob.id}
                                                            onClick={() => handleRegeneratePayment(paymentJob.id)}
                                                            className="text-xs font-semibold flex items-center gap-1 border-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                        >
                                                            <RefreshCw size={12} className={regeneratingId === paymentJob.id ? 'animate-spin' : ''} />
                                                            {regeneratingId === paymentJob.id ? 'Memproses...' : 'Buat Ulang Link Pembayaran'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ========== CARD: TAGIHAN PENGURUSAN DOKUMEN ID-JP (COE 1) ========== */}
                            {paymentCoeDokumen && (
                                <div className="rounded-2xl sm:rounded-[2rem] border bg-white dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden">
                                    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                                        <h2 className="flex items-center gap-2 sm:gap-3 font-black uppercase text-xs sm:text-sm tracking-widest text-neutral-800 dark:text-neutral-200">
                                            <CreditCard className="size-4 sm:size-5 text-blue-600" /> Pengurusan Dokumen Indonesia - Jepang
                                        </h2>
                                        {paymentCoeDokumen.status === 'paid' ? (
                                            <Badge className="bg-green-600 hover:bg-green-700 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                                Lunas
                                            </Badge>
                                        ) : paymentCoeDokumen.status === 'pending' ? (
                                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                                Belum Dibayar
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-zinc-500 hover:bg-zinc-650 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                                {paymentCoeDokumen.status.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="relative z-10 bg-neutral-50/50 dark:bg-zinc-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-neutral-100 dark:border-zinc-800 shadow-sm">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div>
                                                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Rincian Pembayaran (1 dari 2 Tagihan COE)</p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl sm:text-3xl font-black text-foreground">
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentCoeDokumen.amount)}
                                                        </span>
                                                    </div>
                                                    {paymentCoeDokumen.discount > 0 && (
                                                        <p className="text-xs text-red-500 font-medium">
                                                            Potongan (Diskon Admin): -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentCoeDokumen.discount)}
                                                        </p>
                                                    )}
                                                    {paymentCoeDokumen.additional_items && paymentCoeDokumen.additional_items.length > 0 && (
                                                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                                            <span className="font-semibold text-neutral-550">Item Tambahan:</span>
                                                            <ul className="list-disc pl-4 text-[11px] gap-0.5 mt-0.5">
                                                                {paymentCoeDokumen.additional_items.map((add: any, idx: number) => (
                                                                    <li key={idx}>
                                                                        {add.name}: +{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(add.amount)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                                                        No. Invoice: {paymentCoeDokumen.invoice_number}
                                                    </p>
                                                    {paymentCoeDokumen.status === 'pending' && paymentCoeDokumen.expired_at && (
                                                        <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30 w-fit">
                                                            <span>Batas Waktu Bayar:</span>
                                                            <Countdown expiredAt={paymentCoeDokumen.expired_at} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full md:w-auto">
                                                {paymentCoeDokumen.status === 'pending' ? (
                                                    <div className="flex flex-col gap-3">
                                                        <p className="text-xs text-muted-foreground max-w-sm">
                                                            Silakan selesaikan pembayaran tagihan pengurusan dokumen melalui tautan resmi Aulaa di bawah ini.
                                                        </p>
                                                        {paymentCoeDokumen.payment_url ? (
                                                            <Button 
                                                                onClick={() => window.open(paymentCoeDokumen.payment_url, '_blank')}
                                                                className="bg-neutral-900 text-white dark:bg-white dark:text-black font-bold rounded-xl shadow-lg text-xs sm:text-sm w-full md:w-auto"
                                                            >
                                                                <ExternalLink className="size-3.5 sm:size-4 mr-2" /> Bayar Sekarang
                                                            </Button>
                                                        ) : (
                                                            <p className="text-xs font-semibold text-emerald-600">Silakan lakukan pembayaran langsung ke kantor LPK.</p>
                                                        )}
                                                    </div>
                                                ) : paymentCoeDokumen.status === 'paid' ? (
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        <p className="text-green-650 font-bold flex items-center gap-1">
                                                            <CheckCircle2 size={14} className="text-green-600" /> Pembayaran Anda telah diterima. Terima kasih!
                                                        </p>
                                                        <p>Metode Pembayaran: <strong className="text-foreground">{paymentCoeDokumen.payment_method?.toUpperCase()}</strong></p>
                                                        <p>Tanggal Bayar: <strong className="text-foreground">{paymentCoeDokumen.payment_date}</strong></p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-xs text-muted-foreground italic">
                                                            Tagihan {paymentCoeDokumen.status === 'expired' ? 'kedaluwarsa' : (paymentCoeDokumen.status === 'failed' ? 'gagal' : 'dibatalkan')}.
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={regeneratingId === paymentCoeDokumen.id}
                                                            onClick={() => handleRegeneratePayment(paymentCoeDokumen.id)}
                                                            className="text-xs font-semibold flex items-center gap-1 border-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                        >
                                                            <RefreshCw size={12} className={regeneratingId === paymentCoeDokumen.id ? 'animate-spin' : ''} />
                                                            {regeneratingId === paymentCoeDokumen.id ? 'Memproses...' : 'Buat Ulang Link Pembayaran'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ========== CARD: TAGIHAN ADMINISTRASI COE (COE 2) ========== */}
                            {paymentCoeAdmin && (
                                <div className="rounded-2xl sm:rounded-[2rem] border bg-white dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden">
                                    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                                        <h2 className="flex items-center gap-2 sm:gap-3 font-black uppercase text-xs sm:text-sm tracking-widest text-neutral-800 dark:text-neutral-200">
                                            <CreditCard className="size-4 sm:size-5 text-purple-600" /> Administrasi COE
                                        </h2>
                                        {paymentCoeAdmin.status === 'paid' ? (
                                            <Badge className="bg-green-600 hover:bg-green-700 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                                Lunas
                                            </Badge>
                                        ) : paymentCoeAdmin.status === 'pending' ? (
                                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                                Belum Dibayar
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-zinc-500 hover:bg-zinc-650 text-white border-none px-3 sm:px-4 py-1 uppercase tracking-wider font-bold text-xs w-fit">
                                                {paymentCoeAdmin.status.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="relative z-10 bg-neutral-50/50 dark:bg-zinc-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-neutral-100 dark:border-zinc-800 shadow-sm">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div>
                                                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Rincian Pembayaran (2 dari 2 Tagihan COE)</p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl sm:text-3xl font-black text-foreground">
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentCoeAdmin.amount)}
                                                        </span>
                                                    </div>
                                                    {paymentCoeAdmin.discount > 0 && (
                                                        <p className="text-xs text-red-500 font-medium">
                                                            Potongan (Diskon Admin): -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentCoeAdmin.discount)}
                                                        </p>
                                                    )}
                                                    {paymentCoeAdmin.additional_items && paymentCoeAdmin.additional_items.length > 0 && (
                                                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                                            <span className="font-semibold text-neutral-550">Item Tambahan:</span>
                                                            <ul className="list-disc pl-4 text-[11px] gap-0.5 mt-0.5">
                                                                {paymentCoeAdmin.additional_items.map((add: any, idx: number) => (
                                                                    <li key={idx}>
                                                                        {add.name}: +{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(add.amount)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                                                        No. Invoice: {paymentCoeAdmin.invoice_number}
                                                    </p>
                                                    {paymentCoeAdmin.status === 'pending' && paymentCoeAdmin.expired_at && (
                                                        <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30 w-fit">
                                                            <span>Batas Waktu Bayar:</span>
                                                            <Countdown expiredAt={paymentCoeAdmin.expired_at} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full md:w-auto">
                                                {paymentCoeAdmin.status === 'pending' ? (
                                                    <div className="flex flex-col gap-3">
                                                        <p className="text-xs text-muted-foreground max-w-sm">
                                                            Silakan selesaikan pembayaran tagihan administrasi COE melalui tautan resmi Aulaa di bawah ini.
                                                        </p>
                                                        {paymentCoeAdmin.payment_url ? (
                                                            <Button 
                                                                onClick={() => window.open(paymentCoeAdmin.payment_url, '_blank')}
                                                                className="bg-neutral-900 text-white dark:bg-white dark:text-black font-bold rounded-xl shadow-lg text-xs sm:text-sm w-full md:w-auto"
                                                            >
                                                                <ExternalLink className="size-3.5 sm:size-4 mr-2" /> Bayar Sekarang
                                                            </Button>
                                                        ) : (
                                                            <p className="text-xs font-semibold text-emerald-600">Silakan lakukan pembayaran langsung ke kantor LPK.</p>
                                                        )}
                                                    </div>
                                                ) : paymentCoeAdmin.status === 'paid' ? (
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        <p className="text-green-650 font-bold flex items-center gap-1">
                                                            <CheckCircle2 size={14} className="text-green-600" /> Pembayaran Anda telah diterima. Terima kasih!
                                                        </p>
                                                        <p>Metode Pembayaran: <strong className="text-foreground">{paymentCoeAdmin.payment_method?.toUpperCase()}</strong></p>
                                                        <p>Tanggal Bayar: <strong className="text-foreground">{paymentCoeAdmin.payment_date}</strong></p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-xs text-muted-foreground italic">
                                                            Tagihan {paymentCoeAdmin.status === 'expired' ? 'kedaluwarsa' : (paymentCoeAdmin.status === 'failed' ? 'gagal' : 'dibatalkan')}.
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={regeneratingId === paymentCoeAdmin.id}
                                                            onClick={() => handleRegeneratePayment(paymentCoeAdmin.id)}
                                                            className="text-xs font-semibold flex items-center gap-1 border-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                        >
                                                            <RefreshCw size={12} className={regeneratingId === paymentCoeAdmin.id ? 'animate-spin' : ''} />
                                                            {regeneratingId === paymentCoeAdmin.id ? 'Memproses...' : 'Buat Ulang Link Pembayaran'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ========== CARD: BELUM LULUS - JADWAL WAWANCARA ========== */
                        <div className="rounded-2xl sm:rounded-[2rem] border bg-card p-4 sm:p-6 lg:p-8 shadow-sm">
                            {/* Header */}
                            <div className="mb-4 sm:mb-6 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 sm:gap-3 font-black uppercase text-xs sm:text-sm tracking-widest text-muted-foreground">
                                    <Calendar className="size-4 sm:size-5 text-emerald-600" /> Agenda Wawancara
                                </h2>
                            </div>
                            
                            {/* Interview List OR Empty State */}
                            {interviews && interviews.length > 0 ? (
                                <div className="space-y-3 sm:space-y-4">
                                    {/* Tampilkan HANYA 1 wawancara teratas */}
                                    {(() => {
                                        const item = interviews[0]; // Ambil wawancara pertama
                                        const dateObj = new Date(item.interview_date);
                                        const formattedDate = dateObj.toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        }).toUpperCase();

                                        return (
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl sm:rounded-2xl">
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                    <div className="bg-emerald-100 p-2 sm:p-3 rounded-xl text-emerald-700 flex-shrink-0">
                                                        <Clock size={18} className="sm:w-5 sm:h-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-sm sm:text-base text-foreground uppercase truncate">
                                                            {item.interviewer_title || 'INTERVIEW KERJA'}
                                                        </p>
                                                        {item.company && (
                                                            <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase mb-1 truncate">
                                                                {item.company.name}
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                                            {formattedDate}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-emerald-600 hover:bg-emerald-700 border-none shadow-none text-xs w-fit">
                                                    MENDATANG
                                                </Badge>
                                            </div>
                                        );
                                    })()}

                                    {/* Tombol Lihat Selengkapnya (jika ada lebih dari 1 wawancara) */}
                                    {interviews.length > 0 && (
                                        <div className="flex justify-center pt-2">
                                            <Button 
                                                onClick={() => router.visit(route('student.interviews.index'))}
                                                variant="outline"
                                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl text-xs sm:text-sm"
                                            >
                                                <Calendar className="size-3.5 sm:size-4 mr-2" /> 
                                                Lihat Semua Wawancara ({interviews.length})
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground bg-secondary/20 rounded-xl sm:rounded-[1.5rem] border-2 border-dashed border-muted">
                                    <AlertCircle className="mb-2 sm:mb-3 size-6 sm:size-8 opacity-20" />
                                    <p className="text-xs sm:text-sm font-bold opacity-40 uppercase tracking-tighter text-center px-4">
                                        Belum ada jadwal wawancara aktif
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* --- MAIN COLUMN (LEFT) --- */}
                    <div className="lg:col-span-8 space-y-8">
                    {/* --- 1. MODAL KONFIRMASI (ANALYTICS & LEGAL) --- */}
                    <AnimatePresence>
                        {isConfirming && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border p-8 space-y-6"
                                >
                                    <div className="flex items-center gap-4 text-amber-600">
                                        <div className="p-3 bg-amber-100 rounded-2xl">
                                            <AlertTriangle className="size-8" />
                                        </div>
                                        <h2 className="text-2xl font-black tracking-tight">Pernyataan Penting</h2>
                                    </div>
                                    
                                    <div className="space-y-4 text-sm leading-relaxed">
                                        <p className="text-muted-foreground font-medium">
                                            Data yang Anda masukkan akan digunakan secara resmi untuk keperluan verifikasi Imigrasi Jepang, COE, dan Visa Kerja.
                                        </p>
                                        <div className="bg-destructive/5 p-4 rounded-2xl border border-destructive/10 text-destructive text-xs font-bold leading-relaxed">
                                            Dilarang memalsukan data. Kesalahan input data keluarga atau riwayat medis dapat menyebabkan penolakan dokumen secara permanen oleh pihak Jepang.
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                            Ketik kalimat konfirmasi di bawah:
                                        </label>
                                        <p className="text-blue-600 text-xs font-bold italic ml-1">"saya mengerti dan lanjutkan"</p>
                                        <input 
                                            type="text" 
                                            className="w-full rounded-2xl border-2 bg-secondary/30 px-4 py-4 text-sm focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold"
                                            placeholder="Tulis kalimat di atas..."
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
                                            href={route('student.profile.edit')} // Mengarah ke rute profile.edit Anda
                                            as="button"
                                            disabled={confirmationText.toLowerCase() !== "saya mengerti dan lanjutkan"}
                                            className={`flex-1 h-14 rounded-2xl font-bold text-white transition-all flex items-center justify-center ${
                                                confirmationText.toLowerCase() === "saya mengerti dan lanjutkan" 
                                                ? 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95' 
                                                : 'bg-slate-300 cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            Lanjutkan
                                        </Link>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* --- 2. TAMPILAN DASHBOARD (BANNER & CHECKLIST) --- */}
                    {!student ? (
                        <div className="space-y-8">
                            {/* Banner Utama */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative overflow-hidden rounded-[2.5rem] border bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-10 text-white shadow-2xl"
                            >
                                <div className="relative z-10 space-y-6">
                                    <div className="inline-flex items-center gap-2 bg-white/20 text-white border-none backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <Sparkles className="size-3" /> Langkah 1: Registrasi Profil
                                    </div>
                                    <h3 className="text-4xl font-black leading-[1.1] max-w-md tracking-tight">
                                        Bangun Masa Depan Anda di Jepang.
                                    </h3>
                                    <p className="text-blue-100 max-w-lg text-lg leading-relaxed opacity-90">
                                        Lengkapi profil Anda sekarang. Data yang akurat memudahkan tim LPK Oosaka Gakkou mencocokkan Anda dengan perusahaan impian.
                                    </p>
                                    <button 
                                        onClick={() => setIsConfirming(true)}
                                        className="inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-sm font-black text-blue-700 hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20"
                                    >
                                        <UserPlus className="size-5" /> Isi Biodata Lengkap
                                    </button>
                                </div>
                                {/* Background Pattern */}
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-white/5 [mask-image:radial-gradient(white,transparent)]" />
                            </motion.div>

                            {/* Checklist Persiapan */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-black flex items-center gap-3 ml-2 uppercase tracking-tighter text-foreground/80">
                                    <div className="p-2 bg-blue-500 rounded-lg text-white">
                                        <ClipboardList className="size-4" />
                                    </div>
                                    Persiapan Data Sebelum Mengisi
                                </h3>
                                
                                <div className="grid gap-6 md:grid-cols-2">
                                    <PreparationCard 
                                        icon={<User className="text-orange-500" />}
                                        title="Identitas & Fisik"
                                        description="Data KTP dan hasil pengukuran fisik terbaru Anda."
                                        details={["NIK 16 Digit", "Tinggi & Berat Badan", "Golongan Darah", "Status Tato"]}
                                    />
                                    <PreparationCard 
                                        icon={<GraduationCap className="text-blue-500" />}
                                        title="Data Akademik"
                                        description="Detail ijazah dari sekolah dasar hingga terakhir."
                                        details={["Nama Sekolah", "Tahun Kelulusan", "Jurusan / Konsentrasi", "Scan Ijazah Asli"]}
                                    />
                                </div>
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
                                    <div className="space-y-10 pt-2"> {/* Tambah space-y untuk jarak antar grup besar */}
                                        {/* Row 1: Nama & NIK (Highlight Utama) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Nama Lengkap</p>
                                                <h3 className="text-xl font-black text-foreground">{student.full_name}</h3>
                                                {student.full_name_katakana && (
                                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                        <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-foreground font-bold">カナ</span>
                                                        {student.full_name_katakana}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-center md:items-end">
                                                <div className="inline-flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-2xl border border-border">
                                                    <ShieldCheck className="size-4 text-blue-600" />
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground leading-none">Nomor Induk Kependudukan</p>
                                                        <p className="text-sm font-mono font-bold text-foreground tracking-widest">{student.nik}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Grid Informasi Detail */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                                            <InfoBlock label="Jenis Kelamin" value={student.gender} />
                                            <InfoBlock label="Agama" value={student.religion} />
                                            <InfoBlock label="Status Nikah" value={student.marital_status} />
                                            <InfoBlock label="Usia" value={`${new Date().getFullYear() - new Date(student.dob).getFullYear()} Tahun`} />
                                            
                                            <InfoBlock 
                                                label="Kelahiran" 
                                                value={`${student.pob}, ${student.pob_province}`} 
                                                icon={<MapPin className="size-3" />} 
                                            />
                                            <InfoBlock 
                                                label="Tanggal Lahir" 
                                                value={student.dob} 
                                                icon={<Calendar className="size-3" />} 
                                            />
                                            <InfoBlock 
                                                label="HP Siswa" 
                                                value={student.phone_student} 
                                                icon={<Phone className="size-3 text-green-600" />} 
                                            />
                                            <InfoBlock 
                                                label="HP Orang Tua" 
                                                value={student.phone_parent} 
                                                icon={<Users className="size-3" />} 
                                            />
                                        </div>

                                        {/* Row 3: Alamat (Box Berbeda) */}
                                        <div className="group relative overflow-hidden rounded-2xl border border-dashed border-border bg-muted/20 p-5 transition-colors hover:bg-muted/30">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 rounded-full bg-background p-2 shadow-sm text-muted-foreground group-hover:text-blue-600 transition-colors">
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Domisili Sesuai KTP</p>
                                                    <p className="text-sm font-semibold leading-relaxed text-foreground/90 italic">
                                                        "{student.address_ktp}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* SECTION 2: DATA FISIK & KEBIASAAN */}
                                <CollapsibleSection
                                    title="Kondisi Fisik & Kebiasaan"
                                    icon={<Activity className="size-5 text-green-600" />}
                                    isExpanded={expandedSections.physical}
                                    onToggle={() => toggleSection('physical')}
                                >
                                    <div className="space-y-10 pt-2"> {/* Tambah space-y untuk jarak antar grup besar */}
                                        
                                        {/* Row 1: Statistik Vital (Highlight Utama) */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 border-b pb-10 mb-2"> 
                                            {/* pb-10 memberikan jarak dari teks ke garis bawah */}
                                            {/* mb-2 memberikan sedikit ruang tambahan di luar garis */}
                                            
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600/80">Tinggi Badan</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-foreground">{student.height}</span>
                                                    <span className="text-xs font-bold text-muted-foreground uppercase">cm</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600/80">Berat Badan</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-foreground">{student.weight}</span>
                                                    <span className="text-xs font-bold text-muted-foreground uppercase">kg</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600/80">Indeks Massa Tubuh</p>
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-black text-foreground">{calculateBMI()}</span>
                                                    <span className={`text-[10px] font-extrabold uppercase tracking-tighter ${bmiCategory.color}`}>
                                                        {bmiCategory.text}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600/80">Gol. Darah</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-red-50 p-1.5 rounded-lg">
                                                        <Droplet className="size-5 text-red-500 fill-red-500/20" />
                                                    </div>
                                                    <span className="text-3xl font-black text-foreground">{student.blood_type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Status & Kebiasaan */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <StatusCard 
                                                label="Tato / Bekas Luka" 
                                                value={student.tattoo === 'ada' ? 'Memiliki Tato' : 'Bersih / Tidak Ada'}
                                                icon={<ShieldCheck className={`size-4 ${student.tattoo === 'ada' ? 'text-orange-500' : 'text-green-600'}`} />}
                                                positive={student.tattoo === 'tidak'}
                                            />
                                            <StatusCard 
                                                label="Kebiasaan Merokok" 
                                                value={student.smoking}
                                                icon={<Cigarette className={`size-4 ${student.smoking === 'merokok' ? 'text-orange-500' : 'text-green-600'}`} />}
                                                positive={student.smoking === 'tidak merokok'}
                                            />
                                            <StatusCard 
                                                label="Konsumsi Alkohol" 
                                                value={student.alcohol}
                                                icon={<Wine className={`size-4 ${student.alcohol === 'minum' ? 'text-orange-500' : 'text-green-600'}`} />}
                                                positive={student.alcohol === 'tidak minum'}
                                            />
                                            <StatusCard 
                                                label="Keluarga di Jepang" 
                                                value={student.family_in_japan === 'ada' ? 'Ada' : 'Tidak Ada'}
                                                icon={<Globe className="size-4 text-blue-600" />}
                                                positive={student.family_in_japan === 'tidak'}
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* SECTION 3: DATA MEDIS */}
                                <CollapsibleSection
                                    title="Informasi Kesehatan"
                                    icon={<Heart className="size-5 text-red-600" />}
                                    isExpanded={expandedSections.medical}
                                    onToggle={() => toggleSection('medical')}
                                >
                                    <div className="space-y-8 pt-2">
                                        {/* Row 1: Status Kesehatan Utama */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-8 mb-2">
                                            <StatusCard 
                                                label="Riwayat Penyakit TBC" 
                                                value={student.tbc_history === 'ada' ? 'Pernah Mengalami' : 'Tidak Ada Riwayat'}
                                                icon={student.tbc_history === 'ada' ? <AlertTriangle className="size-4 text-red-600" /> : <CheckCircle2 className="size-4 text-green-600" />}
                                                positive={student.tbc_history === 'tidak'}
                                            />
                                            <StatusCard 
                                                label="Kondisi Buta Warna" 
                                                value={student.color_blind === 'normal' ? 'Normal (Tidak Buta Warna)' : student.color_blind}
                                                icon={<Eye className={`size-4 ${student.color_blind === 'normal' ? 'text-green-600' : 'text-orange-500'}`} />}
                                                positive={student.color_blind === 'normal'}
                                            />
                                        </div>

                                        {/* Row 2: Riwayat Penyakit Lainnya */}
                                        <div className="group relative overflow-hidden rounded-2xl border border-dashed border-red-200 bg-red-50/30 p-6 transition-colors hover:bg-red-50/50">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 rounded-full bg-white p-2 shadow-sm text-red-600 group-hover:scale-110 transition-transform">
                                                    <Activity size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-700/70 mb-2">Catatan Medis / Riwayat Operasi</p>
                                                    {student.other_illness ? (
                                                        <p className="text-sm font-bold leading-relaxed text-red-900 italic">
                                                            "{student.other_illness}"
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm font-medium text-muted-foreground italic">
                                                            Tidak ada riwayat penyakit berat atau operasi yang dilaporkan.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Dekorasi latar belakang tipis */}
                                            <HeartPulse className="absolute -bottom-2 -right-2 size-16 text-red-500/5 rotate-12" />
                                        </div>

                                        <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                            <ShieldCheck size={12} />
                                            Data medis digunakan untuk memproses asuransi dan kelayakan kerja di Jepang
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* SECTION 4: DATA PASPOR */}
                                <CollapsibleSection
                                    title="Dokumen Perjalanan (Paspor)"
                                    icon={<Plane className="size-5 text-indigo-600" />}
                                    isExpanded={expandedSections.passport}
                                    onToggle={() => toggleSection('passport')}
                                >
                                    <div className="space-y-8 pt-2">
                                        {student.has_passport === 'ada' ? (
                                            <div className="space-y-6">
                                                {/* Row 1: Paspor Highlight (Gaya ID Card) */}
                                                <div className="relative group overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-background p-6 transition-all hover:shadow-md">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="space-y-4 flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/80 leading-none mb-1">Nomor Paspor</p>
                                                                    <p className="text-2xl font-mono font-black text-foreground tracking-widest">
                                                                        {student.passport_number || 'N/A'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Status Validitas */}
                                                        <div className="flex items-center gap-4 px-6 border-l border-indigo-100">
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1.5">Status Dokumen</p>
                                                                <Badge className="bg-indigo-600 text-white font-bold uppercase text-[10px] px-3">Aktif / Valid</Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Dekorasi Pesawat Terbang Transparan */}
                                                    <PlaneTakeoff className="absolute -bottom-4 -right-4 size-24 text-indigo-600/5 -rotate-12" />
                                                </div>

                                                {/* Row 2: Grid Tanggal Penting */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/5">
                                                        <div className="p-2.5 bg-background rounded-lg shadow-sm">
                                                            <Calendar className="size-5 text-indigo-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Tanggal Pengeluaran</p>
                                                            <p className="text-sm font-bold text-foreground">{student.passport_issue_date || '-'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/5">
                                                        <div className="p-2.5 bg-background rounded-lg shadow-sm">
                                                            <Clock className="size-5 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Tanggal Kadaluarsa</p>
                                                            <p className="text-sm font-bold text-foreground">{student.passport_expiry_date || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Tampilan Jika Belum Ada Paspor */
                                            <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 p-10 text-center transition-colors hover:bg-orange-50/50">
                                                <div className="relative z-10">
                                                    <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                        <Plane className="size-8 text-orange-400 opacity-40" />
                                                    </div>
                                                    <h4 className="text-sm font-black text-orange-900 uppercase tracking-tight">Paspor Belum Tersedia</h4>
                                                    <p className="text-xs text-orange-700/70 mt-2 max-w-xs mx-auto leading-relaxed">
                                                        Siswa dilaporkan belum memiliki paspor. Mohon segera proses pembuatan paspor untuk keperluan pengajuan COE.
                                                    </p>
                                                </div>
                                                {/* Background Pattern */}
                                                <Globe className="absolute -bottom-6 -left-6 size-32 text-orange-600/5 rotate-12" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                            <Info size={12} />
                                            Data paspor harus sesuai dengan ID Card untuk verifikasi data di Imigrasi Jepang
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* SECTION 5: DATA LPK INTERNAL & KOMPETENSI */}
                                <CollapsibleSection
                                    title="Data LPK & Analisis Siswa"
                                    icon={<Building2 className="size-5 text-purple-600" />}
                                    isExpanded={expandedSections.lpk}
                                    onToggle={() => toggleSection('lpk')}
                                >
                                    <div className="space-y-8 pt-2">
                                        
                                        {/* SUB-SECTION 1: STATUS AKADEMIK */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                <GraduationCap size={14} className="text-purple-500" /> Status Akademik & Kelas
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-purple-700/60 uppercase tracking-widest">Level Kelas</span>
                                                    <span className="text-lg font-black text-purple-900">{student.class_level}</span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-blue-700/60 uppercase tracking-widest">Program Keahlian</span>
                                                    <span className="text-lg font-black text-blue-900">{student.program_expert}</span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-slate-700/60 uppercase tracking-widest">Mulai Pelatihan</span>
                                                    <span className="text-lg font-black text-slate-900">{student.entry_date_lpk}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SUB-SECTION 2: TARGET FINANSIAL */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                <Target size={14} className="text-emerald-500" /> Motivasi & Target Finansial
                                            </h4>
                                            <div className="relative group overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-background p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black uppercase text-emerald-700/70 tracking-widest">Target Tabungan (Yen)</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-3xl font-black text-foreground">¥ {Number(student.savings_target).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 border-l border-emerald-100 pl-8">
                                                        <p className="text-[10px] font-black uppercase text-emerald-700/70 tracking-widest">Alasan / Tujuan Utama</p>
                                                        <p className="text-sm font-bold text-foreground italic leading-relaxed">
                                                            "{student.savings_reason}"
                                                        </p>
                                                    </div>
                                                </div>
                                                <TrendingUp className="absolute -bottom-4 -right-4 size-24 text-emerald-600/5 -rotate-12" />
                                            </div>
                                        </div>

                                        {/* SUB-SECTION 3: ANALISIS KOMPETENSI (SWOT STYLE) */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                <Activity size={14} className="text-orange-500" /> Analisis Kompetensi Siswa
                                            </h4>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {/* Strength & Skill */}
                                                <div className="space-y-4">
                                                    <div className="p-5 bg-green-50 border border-green-200 rounded-2xl relative overflow-hidden group">
                                                        <div className="relative z-10">
                                                            <p className="text-[10px] font-black uppercase text-green-700 mb-3 flex items-center gap-2">
                                                                <CheckCircle2 className="size-3" /> Kelebihan Utama
                                                            </p>
                                                            <p className="text-sm font-bold text-green-900 leading-relaxed">{student.strength}</p>
                                                        </div>
                                                        <Sparkles className="absolute -top-2 -right-2 size-12 text-green-600/10" />
                                                    </div>
                                                    <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-2xl">
                                                        <p className="text-[10px] font-black uppercase text-indigo-700 mb-3 flex items-center gap-2">
                                                            <Award className="size-3" /> Skill Teknis
                                                        </p>
                                                        <p className="text-sm font-bold text-indigo-900 leading-relaxed">{student.skill_technical}</p>
                                                    </div>
                                                </div>

                                                {/* Weakness & Hobby */}
                                                <div className="space-y-4">
                                                    <div className="p-5 bg-red-50 border border-red-200 rounded-2xl">
                                                        <p className="text-[10px] font-black uppercase text-red-700 mb-3 flex items-center gap-2">
                                                            <AlertCircle className="size-3" /> Area Pengembangan (Weakness)
                                                        </p>
                                                        <p className="text-sm font-bold text-red-900 leading-relaxed">{student.weakness}</p>
                                                    </div>
                                                    <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                                                        <p className="text-[10px] font-black uppercase text-amber-700 mb-3 flex items-center gap-2">
                                                            <Heart size={14} /> Hobi & Minat
                                                        </p>
                                                        <p className="text-sm font-bold text-amber-900 leading-relaxed">{student.hobby}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter italic border-t pt-4">
                                            <Info size={12} />
                                            Data internal ini digunakan oleh tim LPK OOSAKA GAKKOU untuk menentukan rekomendasi pekerjaan yang sesuai bagi siswa.
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
                                        badge={`${student.educations.length} Jenjang`}
                                    >
                                        <div className="relative space-y-6 pt-2 before:absolute before:inset-y-0 before:left-4 before:block before:w-px before:bg-gradient-to-b before:from-blue-200 before:via-slate-200 before:to-transparent">
                                            {student.educations.map((edu: any, idx: number) => (
                                                <div key={idx} className="relative pl-10 group">
                                                    {/* Dot Timeline */}
                                                    <div className="absolute left-[11px] top-1.5 h-[10px] w-[10px] rounded-full border-2 border-blue-600 bg-white ring-4 ring-blue-50 transition-transform group-hover:scale-125" />
                                                    
                                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50/50 px-5 py-3 border-b border-slate-100 gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <Badge className="bg-blue-600 text-[10px] font-black uppercase tracking-wider px-2">
                                                                    {edu.level}
                                                                </Badge>
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                                    <Building2 size={10} /> {edu.school_type}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-blue-700">
                                                                <Calendar size={12} className="opacity-60" />
                                                                <span className="text-[11px] font-black tracking-tighter">
                                                                    {new Date(edu.entry_date).getFullYear()} — {new Date(edu.graduation_date).getFullYear()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="p-5">
                                                            <h4 className="text-lg font-black text-foreground leading-tight mb-1 group-hover:text-blue-700 transition-colors">
                                                                {edu.school_name}
                                                            </h4>
                                                            
                                                            {edu.major ? (
                                                                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                                                                    <Award className="size-3.5 text-indigo-600" />
                                                                    <span className="text-xs font-bold text-indigo-900">Konsentrasi: {edu.major}</span>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs font-medium text-muted-foreground italic mt-1">
                                                                    Kurikulum Pendidikan Umum
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-8 flex items-center gap-2 px-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter italic">
                                            <Info size={12} />
                                            Data ijazah diverifikasi untuk keperluan sinkronisasi dokumen COE ke Imigrasi Jepang
                                        </div>
                                    </CollapsibleSection>
                                )}

                                {/* SECTION 7: PENGALAMAN KERJA */}
                                {student.experiences && student.experiences.length > 0 && (
                                    <CollapsibleSection
                                        title="Riwayat Pekerjaan"
                                        icon={<Briefcase className="size-5 text-orange-600" />}
                                        isExpanded={expandedSections.experience}
                                        onToggle={() => toggleSection('experience')}
                                        badge={`${student.experiences.length} Instansi`}
                                    >
                                        <div className="relative space-y-8 pt-4 before:absolute before:inset-y-0 before:left-4 before:block before:w-px before:bg-gradient-to-b before:from-orange-200 before:via-slate-200 before:to-transparent">
                                            {student.experiences.map((exp: any, idx: number) => (
                                                <div key={idx} className="relative pl-10 group">
                                                    {/* Dot Timeline */}
                                                    <div className="absolute left-[11px] top-2 h-2.5 w-2.5 rounded-full border-2 border-orange-500 bg-white ring-4 ring-orange-50 transition-all group-hover:scale-125 group-hover:bg-orange-500" />
                                                    
                                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-orange-300 hover:shadow-md">
                                                        {/* Header: Company & Date */}
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between bg-orange-50/30 px-5 py-4 border-b border-orange-100 gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-white rounded-xl shadow-sm border border-orange-100">
                                                                    <Building2 size={18} className="text-orange-600" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black text-foreground leading-none mb-1 group-hover:text-orange-700 transition-colors">
                                                                        {exp.company_name}
                                                                    </h4>
                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                                                        {exp.job_type}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-orange-100 shadow-sm">
                                                                <Calendar size={12} className="text-orange-500" />
                                                                <span className="text-[10px] font-black text-orange-700 uppercase tracking-tighter">
                                                                    {exp.start_date} — {exp.end_date || 'Sekarang'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Body: Salary & Additional Details */}
                                                        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                                                            <div className="flex items-center gap-6">
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Penghasilan Terakhir</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1 bg-green-100 rounded text-green-700">
                                                                            <TrendingUp size={12} />
                                                                        </div>
                                                                        <span className="text-sm font-black text-foreground">
                                                                            Rp {Number(exp.monthly_salary).toLocaleString('id-ID')}
                                                                            <span className="text-[10px] text-muted-foreground font-medium ml-1">/ bulan</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Masa Kerja Badge */}
                                                            <div className="flex items-center gap-2 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <Clock size={12} />
                                                                <span className="text-[10px] font-bold uppercase tracking-tighter">Valid Performance</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-8 flex items-center gap-2 px-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter italic">
                                            <Info size={12} />
                                            Pengalaman kerja membantu Admin menyesuaikan penempatan sektor pekerjaan di Jepang (Tokutei Ginou/Internship)
                                        </div>
                                    </CollapsibleSection>
                                )}

                                {/* SECTION 8: DATA KELUARGA */}
                                {student.families && student.families.length > 0 && (
                                    <CollapsibleSection
                                        title="Jaringan Keluarga"
                                        icon={<Users className="size-5 text-pink-600" />}
                                        isExpanded={expandedSections.family}
                                        onToggle={() => toggleSection('family')}
                                        badge={`${student.families.length} Anggota`}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            {student.families.map((family: any, idx: number) => (
                                                <div 
                                                    key={idx} 
                                                    className="group relative overflow-hidden rounded-2xl border border-pink-100 bg-white p-5 transition-all hover:border-pink-300 hover:shadow-md"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {/* Avatar Lingkaran dengan Inisial */}
                                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-xl font-black text-white shadow-lg shadow-pink-100 group-hover:scale-110 transition-transform">
                                                            {family.name.charAt(0)}
                                                        </div>

                                                        <div className="flex-1 space-y-3">
                                                            {/* Identitas Utama */}
                                                            <div>
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="font-black text-foreground group-hover:text-pink-700 transition-colors">
                                                                        {family.name}
                                                                    </h4>
                                                                    <Badge className="bg-pink-50 text-pink-700 border-pink-100 font-bold text-[9px] uppercase tracking-widest">
                                                                        {family.relationship}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">
                                                                    Kontak Keluarga Terdaftar
                                                                </p>
                                                            </div>

                                                            {/* Grid Detail Kecil */}
                                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-pink-50">
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-black text-pink-800/40 uppercase tracking-widest leading-none">Usia</p>
                                                                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                                        <Clock size={12} className="text-pink-400" />
                                                                        {family.age} <span className="text-[10px] opacity-60">Thn</span>
                                                                    </p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-black text-pink-800/40 uppercase tracking-widest leading-none">Pekerjaan</p>
                                                                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                                        <Briefcase size={12} className="text-pink-400" />
                                                                        <span className="truncate">{family.occupation || '-'}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Dekorasi Latar Belakang */}
                                                    <Heart className="absolute -bottom-2 -right-2 size-12 text-pink-500/5 rotate-12 transition-transform group-hover:scale-125" />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-8 flex items-center gap-2 px-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter italic border-t pt-4">
                                            <Info size={12} />
                                            Data keluarga inti diperlukan sebagai jaminan darurat dan syarat administrasi penjamin di Jepang
                                        </div>
                                    </CollapsibleSection>
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- SIDEBAR COLUMN (RIGHT) --- */}
                    <div className="lg:col-span-4 space-y-8">
                        {student && (
                            <div className="rounded-[2rem] border bg-card p-6 shadow-sm space-y-6">
                                <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-muted-foreground border-b pb-4">
                                    <FileText className="size-5" /> Berkas Digital
                                </h3>
                                
                                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
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
                                                <div className={`p-2 rounded-lg ${student[doc.field] ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                                    {student[doc.field] ? <CheckCircle2 size={18} /> : <UploadCloud size={18} />}
                                                </div>
                                                
                                                <div className="flex gap-1">
                                                    {student[doc.field] && (
                                                        <>
                                                            {/* Preview */}
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-7 w-7" 
                                                                onClick={() => handlePreview(student[doc.field], doc.field)}
                                                                disabled={loadingPreview !== null || uploadingField !== null}
                                                            >
                                                                {loadingPreview === doc.field ? <Loader2 size={12} className="animate-spin" /> : <Eye size={14} />}
                                                            </Button>
                                                            
                                                            {/* Download */}
                                                            <a href={`https://yunerva.com/f/${student[doc.field]}`} target="_blank" rel="noreferrer">
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600">
                                                                    <Download size={14} />
                                                                </Button>
                                                            </a>

                                                            {/* Delete */}
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                                onClick={() => handleDelete(doc.field, doc.label)}
                                                                disabled={loadingDelete !== null || uploadingField !== null}
                                                            >
                                                                {loadingDelete === doc.field ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <p className="text-[11px] font-black text-foreground uppercase mb-2">{doc.label}</p>
                                            
                                            {uploadingField === doc.field ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-black uppercase">
                                                        <span className="text-blue-600 animate-pulse">{uploadStatus}</span>
                                                        <span className="text-muted-foreground">{uploadProgress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-sidebar-accent rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="mt-auto">
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        accept=".jpg,.jpeg,.pdf"
                                                        onChange={(e) => onFileChange(e, doc.field)} 
                                                        disabled={!!uploadingField || !!loadingDelete} 
                                                    />
                                                    <div className="w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-all bg-foreground text-background hover:opacity-90 active:scale-95">
                                                        {student[doc.field] ? 'Ganti Berkas' : 'Unggah Sekarang'}
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Hint Password Tetap Ada */}
                                <div className="mt-4 rounded-2xl bg-blue-600 p-5 text-white shadow-xl shadow-blue-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ShieldCheck className="size-5 opacity-80" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enkripsi Berkas</span>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center border border-white/30">
                                        <span className="text-xs font-black font-mono tracking-widest">{student.yunerva_file_password}</span>
                                    </div>
                                </div>
                            </div>
                        )}
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

function DocStatus({ 
    label, 
    isUploaded, 
    fieldName, 
    onUpload, 
    onPreview, 
    onDelete, 
    isUploading, 
    isLoadingPreview, 
    isLoadingDelete, 
    uploadProgress, 
    uuid 
}: any) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/5 p-4 transition-all hover:bg-sidebar-accent/10">
                <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                        {isUploaded ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80">{label}</span>
                </div>
                
                {/* CONTAINER ACTION - SEKARANG TERPISAH DARI LABEL */}
                <div className="flex items-center gap-2">
                    {isUploaded && uuid && (
                        <div className="flex items-center gap-1.5"> {/* Bungkus action buttons */}
                            {/* Tombol Preview */}
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600" 
                                onClick={() => onPreview(uuid, fieldName)} 
                                disabled={isLoadingPreview !== null || isLoadingDelete !== null}
                            >
                                {isLoadingPreview === fieldName ? <Loader2 size={14} className="animate-spin" /> : <Eye size={16} />}
                            </Button>

                            {/* Tombol Download */}
                            <a href={`https://yunerva.com/f/${uuid}`} target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                                    <Download size={14}/>
                                </Button>
                            </a>

                            {/* Tombol Delete */}
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                onClick={() => onDelete(fieldName, label)}
                                disabled={isLoadingPreview !== null || isLoadingDelete !== null}
                            >
                                {isLoadingDelete === fieldName ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Trash2 size={14} />
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Tombol Upload - Label HANYA membungkus icon upload saja */}
                    <div className="relative">
                        <input 
                            id={`file-upload-${fieldName}`}
                            type="file" 
                            className="hidden" 
                            accept=".jpg,.jpeg,.pdf" 
                            onChange={(e) => onUpload(e, fieldName)} 
                            disabled={isUploading !== null || isLoadingDelete !== null} 
                        />
                        <label 
                            htmlFor={`file-upload-${fieldName}`}
                            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all ${
                                isUploaded 
                                ? 'bg-muted text-muted-foreground hover:bg-muted/80' 
                                : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'
                            } ${(isUploading !== null || isLoadingDelete !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUploading === fieldName ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <UploadCloud size={16} />
                            )}
                        </label>
                    </div>
                </div>
            </div>
            
            {/* Progress Bar Upload */}
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