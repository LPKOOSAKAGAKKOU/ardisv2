import { PlaceholderPattern } from '@/components/ui/placeholder-pattern'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, Link } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { 
    UserPlus, Edit3, Calendar, User, FileText, CheckCircle2, 
    AlertCircle, Info, ClipboardList, BookOpen, HeartPulse, Sparkles, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'



interface Props {
    student: any;
    interviews: any[];
}



export default function StudentDashboard({ student, interviews }: Props) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const requiredPhrase = "saya mengerti dan lanjutkan";
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('student.dashboard') },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Siswa" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Halo, {student?.full_name || 'Calon Siswa'}! 👋</h1>
                        <p className="text-muted-foreground text-sm">
                            {student 
                                ? 'Pantau status aplikasi dan jadwal wawancara Anda di sini.' 
                                : 'Selamat bergabung! Mari persiapkan profil Anda untuk bekerja di Jepang.'}
                        </p>
                    </div>
                    
                    {student && (
                        <Link 
                            href={route('student.profile.edit', student.id)} 
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
                        >
                            <Edit3 className="size-4" /> Edit Profil
                        </Link>
                    )}
                </div>

                

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {/* MODAL PERSETUJUAN */}
                            <AnimatePresence>
                                {isConfirming && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                            className="bg-card w-full max-w-md rounded-2xl shadow-2xl border p-6 space-y-5"
                                        >
                                            <div className="flex items-center gap-3 text-amber-600">
                                                <div className="p-2 bg-amber-100 rounded-full">
                                                    <AlertTriangle className="size-6" />
                                                </div>
                                                <h2 className="text-xl font-bold">Pernyataan Penting</h2>
                                            </div>
                                            
                                            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                                                <p>
                                                    Data diri yang Anda masukkan akan digunakan secara resmi untuk keperluan:
                                                </p>
                                                <ul className="list-disc pl-5 space-y-1 font-medium text-foreground">
                                                    <li>Verifikasi Dokumen Imigrasi Jepang</li>
                                                    <li>Administrasi COE (Certificate of Eligibility)</li>
                                                    <li>Pengajuan Visa Kerja</li>
                                                </ul>
                                                <p className="bg-destructive/10 p-3 rounded-lg text-destructive font-semibold">
                                                    Pastikan seluruh data sesuai dengan dokumen asli. Kesalahan input dapat menghambat proses keberangkatan Anda.
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    Ketik kalimat di bawah untuk konfirmasi:
                                                    <span className="block mt-1 text-blue-600 normal-case italic">"saya mengerti dan lanjutkan"</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="w-full rounded-xl border-2 bg-secondary/30 px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium"
                                                    placeholder="Ketik di sini..."
                                                    value={confirmationText}
                                                    onChange={(e) => setConfirmationText(e.target.value)}
                                                />
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button 
                                                    onClick={() => {
                                                        setIsConfirming(false);
                                                        setConfirmationText('');
                                                    }}
                                                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold hover:bg-secondary transition-colors"
                                                >
                                                    Batal
                                                </button>
                                                <Link
                                                    href={route('student.profile.edit')}
                                                    as="button"
                                                    disabled={confirmationText.toLowerCase() !== "saya mengerti dan lanjutkan"}
                                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                                                        confirmationText.toLowerCase() === "saya mengerti dan lanjutkan" 
                                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                                                        : 'bg-slate-300 cursor-not-allowed shadow-none'
                                                    }`}
                                                >
                                                    Lanjutkan
                                                </Link>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* MAIN CONTENT */}
                            {!student ? (
                                <div className="space-y-8">
                                    {/* Banner Utama */}
                                    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
                                        <div className="relative z-10">
                                            <h3 className="text-2xl font-bold">Langkah Awal Karir di Jepang</h3>
                                            <p className="mt-3 text-blue-100 max-w-lg leading-relaxed">
                                                Biodata Anda adalah dokumen pertama yang akan diperiksa oleh pemberi kerja di Jepang. 
                                                Mari lengkapi profil Anda agar admin dapat segera menjadwalkan wawancara kerja.
                                            </p>
                                            <button 
                                                onClick={() => setIsConfirming(true)}
                                                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all hover:scale-105 shadow-lg shadow-black/10"
                                            >
                                                <UserPlus className="size-5" /> Buat Profil Sekarang
                                            </button>
                                        </div>
                                        <PlaceholderPattern className="absolute inset-0 size-full stroke-white/10 [mask-image:radial-gradient(white,transparent)]" />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <Info className="size-5 text-blue-500" /> Checklist Persiapan Data
                                        </h3>
                                        
                                        <div className="grid gap-4 md:grid-cols-2 items-start">
                                            {/* 1. IDENTITAS & FISIK */}
                                            <PreparationCard 
                                                icon={<ClipboardList className="text-orange-500" />}
                                                title="Identitas & Kondisi Fisik"
                                                description="Informasi dasar sesuai KTP dan pemeriksaan fisik mandiri."
                                                details={[
                                                    "NIK KTP & Nama Lengkap",
                                                    "Nama Katakana (Opsional/Jika sudah ada)",
                                                    "Tempat & Provinsi Lahir",
                                                    "Tinggi Badan (cm) & Berat Badan (kg)",
                                                    "Golongan Darah & Status Tato",
                                                    "Kebiasaan Merokok & Konsumsi Alkohol",
                                                    "Nomor HP Siswa & Nomor HP Orang Tua"
                                                ]}
                                            />

                                            {/* 2. RIWAYAT PENDIDIKAN */}
                                            <PreparationCard 
                                                icon={<BookOpen className="text-blue-500" />}
                                                title="Riwayat Pendidikan"
                                                description="Detail jenjang pendidikan dari sekolah dasar hingga terakhir."
                                                details={[
                                                    "Nama Sekolah (SD, SMP, SMA/SMK, PT)",
                                                    "Status Sekolah (Negeri atau Swasta)",
                                                    "Jurusan Spesifik (khusus SMK/Diploma/S1)",
                                                    "Tanggal Masuk & Tanggal Kelulusan",
                                                    "Tahun kelulusan sesuai yang tertera di Ijazah"
                                                ]}
                                            />

                                            {/* 3. KESEHATAN & DOKUMEN */}
                                            <PreparationCard 
                                                icon={<HeartPulse className="text-red-500" />}
                                                title="Kesehatan & Paspor"
                                                description="Informasi riwayat medis spesifik dan dokumen perjalanan."
                                                details={[
                                                    "Riwayat Penyakit TBC (Ada/Tidak)",
                                                    "Kondisi Buta Warna (Normal/Parsial/Total)",
                                                    "Catatan Operasi atau Penyakit Kronis lainnya",
                                                    "Status Kepemilikan Paspor",
                                                    "Nomor & Masa Berlaku Paspor (jika ada)",
                                                    "Siapkan file Scan KTP, KK, & Ijazah asli"
                                                ]}
                                            />

                                            {/* 4. KELUARGA & PENGALAMAN */}
                                            <PreparationCard 
                                                icon={<FileText className="text-emerald-500" />}
                                                title="Keluarga & Pengalaman Kerja"
                                                description="Data anggota keluarga dan riwayat pekerjaan sebelumnya."
                                                details={[
                                                    "Nama, Umur, & Pekerjaan Ayah & Ibu",
                                                    "Status keluarga yang tinggal di Jepang",
                                                    "Nama Perusahaan & Bidang Pekerjaan",
                                                    "Gaji bulanan terakhir di tempat kerja lama",
                                                    "Periode mulai dan selesai kontrak kerja"
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                            /* TAMPILAN SETELAH ADA PROFIL */
                            <div className="grid gap-6">
                                <div className="rounded-xl border bg-card p-6 shadow-sm">
                                    <div className="mb-4 flex items-center justify-between border-b pb-4">
                                        <h2 className="flex items-center gap-2 font-bold uppercase tracking-tight">
                                            <User className="size-5 text-blue-500" /> Profil Ringkas
                                        </h2>
                                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                            NIK: {student.nik}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-6 md:grid-cols-4">
                                        <InfoBlock label="Tempat Lahir" value={student.pob} />
                                        <InfoBlock label="Tgl Lahir" value={student.dob} />
                                        <InfoBlock label="Agama" value={student.religion} />
                                        <InfoBlock label="Status" value={student.marital_status} />
                                        <InfoBlock label="Tinggi Badan" value={`${student.height} cm`} />
                                        <InfoBlock label="Berat Badan" value={`${student.weight} kg`} />
                                        <InfoBlock label="Gol. Darah" value={student.blood_type} />
                                        <InfoBlock label="Tato" value={student.tattoo} />
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-card p-6 shadow-sm">
                                    <h2 className="mb-4 flex items-center gap-2 font-bold uppercase tracking-tight">
                                        <Calendar className="size-5 text-emerald-500" /> Jadwal Wawancara
                                    </h2>
                                    {interviews.length > 0 ? (
                                        <div className="divide-y"></div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                                            <AlertCircle className="mb-2 size-6 opacity-30" />
                                            <p className="text-sm italic">Belum ada panggilan wawancara saat ini.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Status & Bantuan */}
                    <div className="space-y-6">
                        {student && (
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground">
                                    <FileText className="size-4" /> Status Berkas
                                </h3>
                                <div className="space-y-3">
                                    <DocStatus label="Pas Foto" isUploaded={!!student?.photo_yunerva_uuid} />
                                    <DocStatus label="KTP & KK" isUploaded={!!student?.id_card_yunerva_uuid} />
                                    <DocStatus label="Ijazah Terakhir" isUploaded={!!student?.diploma_yunerva_uuid} />
                                    <DocStatus label="Paspor" isUploaded={student?.has_passport === 'ada'} />
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-6 dark:bg-orange-950/20 dark:border-orange-900/30">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-orange-800 dark:text-orange-300">
                                <Info className="size-4" /> Butuh Bantuan?
                            </h3>
                            <p className="mt-2 text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
                                Jika Anda kesulitan mengisi data atau mengunggah dokumen, silakan hubungi admin LPK melalui WhatsApp di jam kerja.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

function PreparationCard({ 
    icon, 
    title, 
    description, 
    details 
}: { 
    icon: React.ReactNode, 
    title: string, 
    description: string,
    details: string[] 
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="h-fit"> {/* Wrapper untuk menjaga stabilitas grid */}
            <motion.div 
                layout // Animasi layout tetap ada tapi lebih terkontrol
                onClick={() => setIsOpen(!isOpen)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
                whileTap={{ scale: 0.98 }}
                transition={{
                    layout: { duration: 0.3, type: "spring", stiffness: 200, damping: 25 }
                }}
            >
                <div className="flex items-start gap-4">
                    <div className="shrink-0 rounded-lg bg-secondary p-2.5 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                        {icon}
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold tracking-tight">{title}</h4>
                            <motion.div
                                animate={{ rotate: isOpen ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronRight className="size-4 text-muted-foreground" />
                            </motion.div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {description}
                        </p>

                        <AnimatePresence mode="wait">
                            {isOpen && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 grid grid-cols-1 gap-2 border-t pt-4">
                                        {details.map((item, idx) => (
                                            <motion.div 
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={idx} 
                                                className="flex items-center gap-2 text-[11px] text-blue-600 dark:text-blue-400"
                                            >
                                                <Sparkles className="size-3 shrink-0" />
                                                <span>{item}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function InfoBlock({ label, value }: { label: string, value: any }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-widest">{label}</span>
            <span className="text-sm font-semibold text-foreground capitalize">{value || '-'}</span>
        </div>
    )
}

function DocStatus({ label, isUploaded }: { label: string, isUploaded: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm transition-all hover:bg-secondary/50">
            <span className="font-medium">{label}</span>
            {isUploaded ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
            ) : (
                <AlertCircle className="size-4 text-orange-400" />
            )}
        </div>
    )
}