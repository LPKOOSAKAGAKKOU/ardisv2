import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { 
    Calendar, CheckCircle2, Clock, FileText, AlertCircle, 
    Download, Eye, Loader2, Users, ChevronDown, ChevronUp, 
    UploadCloud, FileCheck, XCircle, ExternalLink
} from 'lucide-react';
import { route } from 'ziggy-js';

// --- CONFIG MAPPING DOKUMEN ---
// Mapping label ke nama kolom database student_profiles
// --- CONFIG MAPPING DOKUMEN (UPDATED) ---
const GINOU_DOCS = [
    { label: "Form 1-3 (Resume)", field: "ginou_jisshuu_1-3_document_yunerva_uuid", typeKey: "ginou_1-3" },
    { label: "Form 1-19 (Agreement)", field: "ginou_jisshuu_1-19_document_yunerva_uuid", typeKey: "ginou_1-19" },
    { label: "Form 1-20", field: "ginou_jisshuu_1-20_document_yunerva_uuid", typeKey: "ginou_1-20" },
    { label: "Form 1-21", field: "ginou_jisshuu_1-21_document_yunerva_uuid", typeKey: "ginou_1-21" },
    { label: "Form 1-39", field: "ginou_jisshuu_1-39_document_yunerva_uuid", typeKey: "ginou_1-39" },
    { label: "Agreement Letter", field: "ginou_jisshuu_aggreement_document_yunerva_uuid", typeKey: "ginou_agreement" },
];

const TOKUTEI_DOCS = [
    { label: "Form 1-1", field: "tokutei_ginou_1-1_document_yunerva_uuid", typeKey: "tg_1-1" },
    { label: "Form 1-5", field: "tokutei_ginou_1-5_document_yunerva_uuid", typeKey: "tg_1-5" },
    { label: "Form 1-6", field: "tokutei_ginou_1-6_document_yunerva_uuid", typeKey: "tg_1-6" },
    { label: "Form 1-16", field: "tokutei_ginou_1-16_document_yunerva_uuid", typeKey: "tg_1-16" },
    { label: "Form 1-17", field: "tokutei_ginou_1-17_document_yunerva_uuid", typeKey: "tg_1-17" },
    { label: "Power of Attorney", field: "power_of_attorney_letter_yunerva_uuid", typeKey: "power_attorney" },
    { label: "SSW Test Result", field: "ssw_test_result_yunerva_uuid", typeKey: "ssw_result" },
];

interface Props {
    mode: 'PASSED' | 'LISTING';
    data?: any;
    upcoming?: any[];
    past?: any[];
    // Tambahkan definisi tipe untuk props baru
    studentProfile?: {
        id: number;
        user_id: number;
        [key: string]: any;
    };
}

export default function InterviewDashboard({ mode, data, upcoming, past, studentProfile }: Props) {
    // Ambil data user dari props global inertia (untuk nama siswa & id profile)
    const { auth } = usePage().props as any;
    const studentName = auth.user.name;
    const studentProfileId = studentProfile?.id;
    // Pastikan backend mengirim relasi student_profile di handleInertiaRequest atau auth

    // --- STATE MANAGEMENT ---
    const [isLoadingId, setIsLoadingId] = useState<number | string | null>(null); 
    
    // State untuk Preview (Baik Kyuujinhyou maupun Dokumen Upload)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    // State untuk Detail Peserta
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [participantsList, setParticipantsList] = useState<any[]>([]);
    const [selectedInterviewTitle, setSelectedInterviewTitle] = useState('');

    const breadcrumbs = [{ title: 'Interview Dashboard', href: '#' }];

    // --- LOGIC HANDLERS ---

    const handleApply = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin mendaftar pada wawancara ini?')) return;

        setIsLoadingId(id);
        try {
            const response = await axios.post(route('student.interviews.apply', id));
            
            if (response.data.status === 'success') {
                router.reload({ only: ['upcoming', 'past'] });
                alert(response.data.message);
            }
        } catch (err: any) {
            // TANGKAP ERROR DARI CONTROLLER DISINI
            const res = err.response?.data;
            const status = err.response?.status;

            // 1. Jika statusnya 'need_profile' (dari Controller tadi)
            if (status === 403 && res?.status === 'need_profile') {
                if(confirm(res.message + "\n\nKlik OK untuk mengisi biodata sekarang.")) {
                    // Redirect ke halaman Profile
                    router.visit(res.redirect_url); 
                }
            } 
            // 2. Error lainnya (misal: Double pendaftaran)
            else {
                const msg = res?.message || 'Terjadi kesalahan saat mendaftar.';
                alert(msg);
            }
        } finally {
            setIsLoadingId(null);
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm('PERINGATAN: Apakah Anda yakin ingin MENGUNDURKAN DIRI?')) return;
        setIsLoadingId(id);
        try {
            const response = await axios.post(route('student.interviews.cancel', id));
            if (response.data.status === 'success') {
                router.reload({ only: ['upcoming', 'past'] });
                alert(response.data.message);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal membatalkan.');
        } finally {
            setIsLoadingId(null);
        }
    };

// --- LOGIC PREVIEW YANG DIPERBAIKI ---
    const handlePreviewKyuujinhyou = async (id: number) => {
        setIsLoadingId(id);
        try {
            // Gunakan GET sesuai perbaikan route sebelumnya
            const response = await axios.get(route('student.interviews.preview-kyuujinhyou', id));
            
            if (response.data.status === 'success' && response.data.data.view_url) {
                setPreviewUrl(response.data.data.view_url);
                setPreviewTitle("Pratinjau Dokumen Lowongan");
                setIsPreviewOpen(true); // Buka Modal
            } else {
                alert(response.data.message || "Gagal mendapatkan dokumen.");
            }
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Dokumen tidak tersedia atau terjadi kesalahan.");
        } finally {
            setIsLoadingId(null);
        }
    };

    const handleShowParticipants = async (id: number, title: string) => {
        setSelectedInterviewTitle(title);
        setIsParticipantsOpen(true);
        setParticipantsList([]); 
        try {
            const response = await axios.get(route('student.interviews.participants', id));
            if (response.data.status === 'success') {
                setParticipantsList(response.data.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- LOGIC UPLOAD DOKUMEN (YUNERVA FLOW) ---

   // --- LOGIC UPLOAD DOKUMEN (FIXED) ---
    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, docLabel: string) => {
        // 1. CEK ID PROFIL DULU (PENTING!)
        if (!studentProfileId) {
            alert("Profil siswa tidak ditemukan. Silakan lengkapi biodata Anda terlebih dahulu di menu Profil.");
            return;
        }

        const file = e.target.files?.[0];
        if (!file) return;

        // Validasi Ukuran (Max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Ukuran file terlalu besar (Maksimal 5MB)");
            return;
        }

        setIsLoadingId(fieldName);

        try {
            // ... (Logic Rename file sama seperti sebelumnya) ...
            const ext = file.name.split('.').pop();
            const cleanName = studentName.replace(/[/\\?%*:|"<>]/g, '-'); 
            const cleanLabel = docLabel.replace(/[/\\?%*:|"<>]/g, '');
            const newFileName = `${cleanLabel} - ${cleanName}.${ext}`;
            const renamedFile = new File([file], newFileName, { type: file.type });

            // Request Upload
            const reqResponse = await axios.post(route('student.profile.upload-request'), {
                filename: newFileName,
                extension: ext,
                mime_type: file.type,
                size: file.size
            });

            // Handling response structure (seperti yg kamu minta)
            const responseData = reqResponse.data.data || reqResponse.data;
            const uploadUrl = responseData.upload_url || responseData.url;
            const ticket = responseData.upload_ticket || responseData.ticket;

            if (!uploadUrl || !ticket) throw new Error("Gagal mendapatkan tiket upload.");

            // Upload ke Cloud
            await axios.put(uploadUrl, renamedFile, {
                headers: { 'Content-Type': file.type }
            });

            // Finalize
            // KARENA KITA SUDAH CEK ID DI ATAS, ZIGGY TIDAK AKAN ERROR DISINI
            const storeResponse = await axios.post(route('student.profile.documents-store', studentProfileId), {
                field_name: fieldName,
                upload_ticket: ticket 
            });

            if (storeResponse.data.status === 'success') {
                alert(`Berhasil mengunggah ${docLabel}!`);
                router.reload(); 
            }

        } catch (err: any) {
            console.error("Upload Error:", err);
            alert(`Gagal: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoadingId(null);
        }
    };

    const handlePreviewUploadedDoc = async (fieldName: string, currentUuid: string, docLabel: string) => {
        setIsLoadingId(fieldName);
        try {
            const response = await axios.post(route('student.profile.preview-file', studentProfileId), {
                uuid: currentUuid
            });

            if (response.data.data?.view_url) {
                setPreviewUrl(response.data.data.view_url);
                setPreviewTitle(`Pratinjau: ${docLabel}`);
                setIsPreviewOpen(true);
            }
        } catch (err) {
            alert("Gagal membuka dokumen.");
        } finally {
            setIsLoadingId(null);
        }
    };

    // --- SUB-COMPONENT: DOCUMENT ROW (PERBAIKAN) ---
    const DocumentRow = ({ doc, programType }: { doc: any, programType: string }) => {
        const currentUuid = studentProfile?.[doc.field];
        
        const isUploaded = !!currentUuid;
        const isLoading = isLoadingId === doc.field;
        const fileInputRef = useRef<HTMLInputElement>(null);
        const handleGenerate = (docType: string) => { 
                // Langsung gunakan 'programType' dari props di atas
                const routeName = programType === 'ginoujisshuu' 
                    ? 'student.documents.ginou.generate' 
                    : 'student.documents.tokutei.generate';
                
                const url = route(routeName, { type: docType });
                window.open(url, '_blank');
            };

        return (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-slate-50 transition-colors">
                {/* ... (Tampilan Sisa Code Sama) ... */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isUploaded ? <FileCheck className="size-5" /> : <FileText className="size-5" />}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                            {isUploaded ? 'Dokumen tersimpan' : 'Wajib diisi'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* --- TOMBOL GENERATE / DOWNLOAD TEMPLATE (AKTIF) --- */}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700" 
                        title="Download Template untuk Ditandatangani"
                        onClick={() => handleGenerate(doc.typeKey)} // Panggil fungsi generate
                    >
                        <Download className="size-3" />
                        <span className="text-xs">Template</span>
                    </Button>
                    {/* Input File Hidden */}
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleUploadFile(e, doc.field, doc.label)}
                    />

                    {/* Logic Tombol */}
                    {isUploaded ? (
                        <div className="flex gap-2">
                             <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                onClick={() => handlePreviewUploadedDoc(doc.field, currentUuid, doc.label)}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Eye className="size-3 mr-1" />}
                                Lihat
                            </Button>
                            {/* Tombol Re-upload */}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                title="Ganti File"
                            >
                                <UploadCloud className="size-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            size="sm" 
                            className="h-8 text-xs gap-2"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="size-3 animate-spin" /> : <UploadCloud className="size-3" />}
                            Upload
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    // --- SUB-COMPONENT: INTERVIEW CARD ---
    const InterviewCard = ({ item, isPast, result }: { item: any, isPast: boolean, result?: string }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const date = new Date(item.interview_date);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Oct", "Nov", "Des"];
        
        const myApplication = item.details && item.details.length > 0 ? item.details[0] : null;
        const myStatus = myApplication ? myApplication.result : null;
        const participantCount = item.details_count || item.details?.length || 0;

        return (
            <div className={`border rounded-lg bg-card hover:shadow-md transition-all ${isPast ? 'opacity-70 bg-gray-50' : ''}`}>
                <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-secondary px-3 py-2 rounded-md text-center min-w-[70px]">
                                <div className="text-xs text-muted-foreground font-medium">{monthNames[date.getMonth()]}</div>
                                <div className="text-2xl font-bold">{date.getDate()}</div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-base mb-1">{item.interviewer_title}</h4>
                                <p className="text-xs text-muted-foreground">
                                    {item.company?.name || 'General'} • {item.type === 'ginoujisshuu' ? 'Magang' : 'TG'}
                                </p>
                                {!isPast && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleShowParticipants(item.id, item.interviewer_title); }}
                                        className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 hover:bg-secondary hover:text-emerald-600 w-fit px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                    >
                                        <Users className="size-3" /> <span>Lihat Daftar Peserta</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 self-end sm:self-start">
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" size="sm" className="h-8 text-xs"
                                    onClick={(e) => { e.stopPropagation(); handlePreviewKyuujinhyou(item.id); }}
                                    disabled={isLoadingId === item.id}
                                >
                                    {isLoadingId === item.id ? <Loader2 className="size-3 animate-spin mr-1"/> : <Eye className="size-3 mr-1" />} Detail
                                </Button>
                                {isPast ? (
                                    <Badge variant="secondary" className="h-8 px-3 text-xs font-medium uppercase">{result}</Badge>
                                ) : (
                                    <>
                                        {myStatus ? (
                                            myStatus === 'waiting' ? (
                                                <div className="flex gap-2"> {/* Container untuk merapikan posisi tombol */}
                                                    {/* Tombol Join Group Chat */}
                                                    {item.group_chat_link && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="h-8 px-3 text-xs font-medium uppercase border-blue-600 text-blue-600 hover:bg-blue-50"
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                window.open(item.group_chat_link, '_blank'); 
                                                            }}
                                                        >
                                                            Join Group
                                                        </Button>
                                                    )}

                                                    {/* Tombol Batal yang sudah ada */}
                                                    <Button 
                                                        size="sm" 
                                                        className="h-8 px-3 text-xs font-medium uppercase bg-amber-500 hover:bg-red-600 transition-colors"
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            handleCancel(item.id); 
                                                        }}
                                                        disabled={isLoadingId === item.id}
                                                    >
                                                        {isLoadingId === item.id ? <Loader2 className="size-3 animate-spin" /> : 'Terdaftar (Batal?)'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Badge className={`h-8 px-3 text-xs font-medium uppercase ${myStatus === 'passed' ? 'bg-emerald-500' : 'bg-red-500'}`}>{myStatus}</Badge>
                                            )
                                        ) : (
                                            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                onClick={(e) => { e.stopPropagation(); handleApply(item.id); }}
                                                disabled={isLoadingId === item.id}
                                            >
                                                {isLoadingId === item.id ? <Loader2 className="size-3 animate-spin" /> : 'Daftar Sekarang'}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => setIsExpanded(!isExpanded)}>
                                {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                            </Button>
                        </div>
                    </div>
                </div>
                {isExpanded && (
                    <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <div className="pt-4 border-t border-dashed">
                            <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">Deskripsi Pekerjaan</h5>
                            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                {item.description || "Tidak ada deskripsi tersedia untuk lowongan ini."}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // --- HELPER INFO ITEM ---
    const InfoItem = ({ label, value }: { label: string, value: string }) => (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="font-semibold text-sm text-foreground">{value}</p>
        </div>
    );
    
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Interview Dashboard" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                
                {mode === 'PASSED' ? (
                    /* ================= VIEW LULUS (DOKUMEN & UPLOAD) ================= */
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                            <div className="relative z-10">
                                <Badge className="bg-white/20 text-white border-none mb-3 text-xs font-medium">Status: Lulus Seleksi</Badge>
                                <h1 className="text-3xl font-bold mb-2">{data.interview.interviewer_title}</h1>
                                <p className="text-sm opacity-90 max-w-2xl">Selamat! Anda telah diterima. Silakan lengkapi dokumen yang dibutuhkan.</p>
                            </div>
                            <CheckCircle2 className="absolute right-4 bottom-4 size-24 opacity-10" />
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 bg-card border rounded-lg p-6 h-fit">
                                <div className="flex items-center gap-2 mb-6">
                                    <AlertCircle className="size-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-sm text-muted-foreground">Informasi Program</h3>
                                </div>
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4">
                                        <InfoItem label="Jenis Program" value={data.interview.type === 'ginoujisshuu' ? 'Magang (Ginou Jisshuu)' : 'Tokutei Ginou (TG)'} />
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border space-y-3">
                                        <InfoItem label="Nama Perusahaan" value={data.interview.company?.name || 'Data tidak tersedia'} />
                                        <InfoItem label="Lokasi Penempatan" value={data.interview.company?.address || 'Jepang'} />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <InfoItem label="Tanggal Wawancara" value={formatDate(data.interview.interview_date)} />
                                        <InfoItem label="Estimasi Keberangkatan" value={data.date_fly_to_japan ? formatDate(data.date_fly_to_japan) : (data.interview.date_fly_to_japan ? formatDate(data.interview.date_fly_to_japan) : 'Dalam Proses Penjadwalan')} />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 bg-card border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                                    <FileText className="size-4 text-emerald-600" />
                                    <h3 className="font-semibold text-sm text-foreground">
                                        Upload Dokumen Wajib
                                    </h3>
                                </div>
                                
                            <div className="space-y-3">
                                {data.interview.type === 'ginoujisshuu' ? (
                                    GINOU_DOCS.map((doc, i) => (
                                        <DocumentRow key={i} doc={doc} programType="ginoujisshuu" /> // Tambahkan programType
                                    ))
                                ) : (
                                    TOKUTEI_DOCS.map((doc, i) => (
                                        <DocumentRow key={i} doc={doc} programType="tokuteiginou" /> // Tambahkan programType
                                    ))
                                )}
                            </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ================= VIEW LISTING ================= */
                    <div className="space-y-8">
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="size-5 text-emerald-600" />
                                <h2 className="font-semibold text-base text-foreground">Jadwal Wawancara Mendatang</h2>
                            </div>
                            <div className="grid gap-3">
                                {upcoming && upcoming.length > 0 ? (
                                    upcoming.map((item, i) => <InterviewCard key={i} item={item} isPast={false} />)
                                ) : <div className="py-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground"><AlertCircle className="size-8 mb-3 opacity-40" /><p className="text-sm font-medium opacity-60">Belum ada lowongan tersedia</p></div>}
                            </div>
                        </section>
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="size-5 text-amber-600" />
                                <h2 className="font-semibold text-base text-foreground">Riwayat Wawancara</h2>
                            </div>
                            <div className="grid gap-3">
                                {past && past.length > 0 ? (
                                    past.map((item, i) => <InterviewCard key={i} item={item.interview} result={item.result} isPast={true} />)
                                ) : <div className="py-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground"><AlertCircle className="size-8 mb-3 opacity-40" /><p className="text-sm font-medium opacity-60">Belum ada riwayat</p></div>}
                            </div>
                        </section>
                    </div>
                )}

                {/* --- MODALS --- */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                        <DialogHeader className="px-6 py-4 border-b">
                            <DialogTitle className="flex items-center gap-2 text-base">
                                <FileText className="size-4 text-emerald-600" /> {previewTitle}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 w-full h-full bg-slate-50">
                            {previewUrl ? <iframe src={previewUrl} className="w-full h-full border-none" title="Preview" /> : <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><Loader2 className="size-8 animate-spin mb-2" /><p>Memuat dokumen...</p></div>}
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>Peserta Terdaftar: {selectedInterviewTitle}</DialogTitle></DialogHeader>
                        <div className="space-y-2 mt-4 max-h-[60vh] overflow-y-auto">
                            {participantsList.length > 0 ? (
                                participantsList.map((p, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                                        <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{p.user?.name?.charAt(0) || '?'}</div>
                                        <div><p className="text-sm font-medium">{p.user?.name || 'Peserta'}</p><p className="text-xs text-muted-foreground">Mendaftar: {new Date(p.created_at).toLocaleDateString()}</p></div>
                                    </div>
                                ))
                            ) : <div className="text-center py-6 text-muted-foreground text-sm">Belum ada data peserta.</div>}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            {/* --- MODAL PREVIEW PDF (VERSI ADMIN YANG DI-PORTING KE SISWA) --- */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden bg-zinc-900 border-none shadow-2xl">
                    {/* Header Modal */}
                    <DialogHeader className="p-4 bg-white dark:bg-zinc-950 border-b flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <FileText size={18} />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold">
                                    {previewTitle}
                                </DialogTitle>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                    Dokumen Resmi Kyuujinhyou
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 pr-8">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(previewUrl, '_blank')} 
                                className="h-8 text-xs"
                            >
                                <ExternalLink className="mr-2 h-3 w-3" /> Buka Tab Baru
                            </Button>
                        </div>
                    </DialogHeader>
                    
                    {/* Body Modal (Iframe) */}
                    <div className="flex-1 h-full w-full bg-zinc-800 relative">
                        {previewUrl ? (
                            <iframe 
                                src={`${previewUrl}#toolbar=0`} 
                                className="w-full h-[calc(90vh-65px)] border-none"
                                title="Kyuujinhyou PDF"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                <p className="text-sm animate-pulse">Menyiapkan dokumen...</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}