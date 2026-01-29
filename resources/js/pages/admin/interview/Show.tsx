import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    FileText, Upload, Users, CheckCircle, XCircle, 
    Clock, Building2, MapPin, Briefcase, Calendar,
    ExternalLink, Download, ArrowLeft, Info, Eye,
    UserPlus, Trash2, Hash, GripVertical, Save,
    FileSpreadsheet, MoreVertical, ChevronRight,
    Loader2, UploadCloud
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from 'axios';
import { format, isValid } from 'date-fns';
import { route } from 'ziggy-js';

// --- DND-KIT ---
import {
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
    interview: any;
    availableStudents?: any[];
}

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

const INTERVIEW_GINOU_REPORTS = [
    { label: "Surat Bukti Pelatihan Teknis (1-34)", typeKey: "ginou_1-34", field: "ginou_1_34_uuid" },
    { label: "Surat Perjanjian Sertifikasi Pelatihan (1-10)", typeKey: "ginou_1_10", field: "ginou_1_10_uuid" },
    { label: "Rekom Pemberangkatan (1-23)", typeKey: "ginou_1_23", field: "ginou_1_23_uuid" },
    { label: "Surat Pengajuan Rekom (1-23)", typeKey: "ginou_1_23_req", field: "ginou_1_23_req_uuid" },
    { label: "Profile LPK (1-13)", typeKey: "ginou_1_13", field: "ginou_1_13_uuid" },
    { label: "Jadwal Pelatihan Pra-Pemberangkatan (4-8)", typeKey: "ginou_4_8", field: "ginou_4_8_uuid" },
    { label: "Pernyataan Pelatihan Kaigo (1-29)", typeKey: "ginou_1_29", field: "ginou_1_29_uuid" },
    { label: "Pernyataan Pengajar Bahasa Jepang", typeKey: "stmt_jp_teacher", field: "stmt_jp_teacher_uuid" },
    { label: "Pernyataan Pengajar Keterampilan Kaigo", typeKey: "stmt_kg_teacher", field: "stmt_kg_teacher_uuid" },
    { label: "CV Pengajar Bahasa Jepang", typeKey: "cv_jp_teacher", field: "cv_jp_teacher_uuid" },
    { label: "CV Pengajar Keterampilan Kaigo", typeKey: "cv_kg_teacher", field: "cv_kg_teacher_uuid" },
    { label: "Jadwal Perincian Pelatihan", typeKey: "schedule_detail", field: "schedule_detail_uuid" },
];

const INTERVIEW_TOKUTEI_REPORTS = [
    { label: "Surat Bukti Pelatihan Teknis (1-34)", typeKey: "ginou_1-34" },
    { label: "Surat Perjanjian Sertifikasi Pelatihan (1-10)", typeKey: "ginou_1-10" },
    { label: "Pernyataan Pengajar Keterampilan Kaigo", typeKey: "stmt_kg_teacher" },
    { label: "CV Pengajar Bahasa Jepang", typeKey: "cv_jp_teacher" },
    { label: "CV Pengajar Keterampilan Kaigo", typeKey: "cv_kg_teacher" },
    { label: "Jadwal Perincian Pelatihan", typeKey: "schedule_detail" },
];



// --- KOMPONEN BARIS / CARD YANG BISA DI DRAG ---
function SortableRow({ detail, index, onRemove, onUpdateModal, interviewId, onManageDocs }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: detail.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <tr 
            ref={setNodeRef} 
            style={style} 
            className={`group transition-colors ${isDragging ? 'bg-white shadow-lg opacity-80' : 'hover:bg-neutral-50/50'}`}
        >
            <td className="px-4 py-4 w-16 text-center">
                <div className="flex items-center justify-center gap-2">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-blue-600 transition-colors">
                        <GripVertical size={16} />
                    </button>
                    <span className="text-xs font-mono font-bold text-neutral-500">{index + 1}</span>
                </div>
            </td>

            <td className="px-4 py-4 min-w-[200px]">
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {detail.user?.student_profile?.full_name || 'No Name'}
                </div>
            </td>

            <td className="px-4 py-4 w-32 text-center">
                <Badge variant="outline" className={`text-[10px] font-bold ${
                    detail.result === 'passed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    detail.result === 'failed' ? "bg-rose-50 text-rose-700 border-rose-100" : 
                    "bg-neutral-50 text-neutral-600 border-neutral-100"
                }`}>
                    {detail.result?.toUpperCase() || 'WAITING'}
                </Badge>
            </td>

            <td className="px-4 py-4">
                <p className="text-xs text-neutral-500 italic line-clamp-1">{detail.remarks || '-'}</p>
            </td>

            <td className="px-4 py-4 w-64 text-right">
                <div className="flex items-center justify-end gap-1">
                    {detail.result === 'passed' && (
                        <Button 
                            onClick={() => onManageDocs(detail)} 
                            variant="outline" 
                            size="sm" 
                            className="h-8 bg-blue-50 text-blue-700 border-blue-200"
                        >
                            <Upload size={14} className="mr-1.5" /> Berkas
                        </Button>
                    )}
                    <a href={route('cv.generate', { userId: detail.user_id, interviewId: interviewId })} target="_blank">
                        <Button variant="outline" size="sm" className="h-8 border-emerald-600 text-emerald-600 hover:bg-emerald-50 gap-1.5">
                            <FileSpreadsheet size={14} /> CV
                        </Button>
                    </a>
                    <Button onClick={() => onUpdateModal(detail)} variant="secondary" size="sm" className="h-8">Status</Button>
                    <Link href={`/admin/students/${detail.user?.student_profile?.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-blue-600 font-bold">Profil</Button>
                    </Link>
                    <Button onClick={() => onRemove(detail.id)} variant="ghost" size="sm" className="h-8 text-neutral-300 hover:text-rose-600">
                        <Trash2 size={16} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}

export default function InterviewShow({ interview, availableStudents = [] }: Props) {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [localDetails, setLocalDetails] = useState(interview?.details || []);
    const [hasChanges, setHasChanges] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    
    // State Baru untuk Kelola Dokumen Admin
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [selectedStudentForDoc, setSelectedStudentForDoc] = useState<any>(null);
    const [isLoadingId, setIsLoadingId] = useState<string | null>(null);

    useEffect(() => {
        setLocalDetails(interview?.details?.sort((a: any, b: any) => a.order_number - b.order_number) || []);
        setHasChanges(false);
    }, [interview.details]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLocalDetails((items: any[]) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newArray = arrayMove(items, oldIndex, newIndex);
                setHasChanges(true);
                return newArray;
            });
        }
    };

    const saveNewOrder = () => {
        const orders = localDetails.map((item, index) => ({
            id: item.id,
            order_number: index + 1
        }));

        router.patch(`/admin/interviews/${interview.id}/batch-reorder`, { orders }, {
            preserveScroll: true,
            onSuccess: () => setHasChanges(false)
        });
    };

    useEffect(() => {
        if (searchQuery.length > 1) {
            const filtered = availableStudents.filter(s => 
                s.student_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents([]);
        }
    }, [searchQuery, availableStudents]);

    const handleAssignStudent = (userId: number) => {
        router.post(`/admin/interviews/${interview.id}/assign`, { user_id: userId }, {
            preserveScroll: true,
            onSuccess: () => setSearchQuery('')
        });
    };

    const handleRemoveStudent = (detailId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus siswa ini dari daftar wawancara?')) {
            router.delete(`/admin/interview-details/${detailId}`, { preserveScroll: true });
        }
    };

    const { data, setData, patch, processing, reset } = useForm({
        result: '',
        remarks: ''
    });

    const formatDateSafe = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isValid(date) ? format(date, 'PPP') : '-';
    };

    const breadcrumbs = [
        { title: 'Data Wawancara', href: '/admin/interviews' },
        { title: 'Detail', href: '#' },
    ];

    const openUpdateModal = (candidate: any) => {
        setSelectedCandidate(candidate);
        setData({
            result: candidate.result || 'pending',
            remarks: candidate.remarks || ''
        });
        setIsModalOpen(true);
    };

    const handleUpdateResult = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCandidate?.id) return;
        patch(`/admin/interview-details/${selectedCandidate.id}`, {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
                setSelectedCandidate(null);
            },
            preserveScroll: true
        });
    };

    const handlePreview = async () => {
        setIsLoadingPreview(true);
        try {
            const response = await axios.post(route('admin.interviews.preview-kyuujinhyou', interview.id));
            if (response.data.status === 'success' && response.data.data.view_url) {
                setPreviewUrl(response.data.data.view_url);
                setPreviewTitle(interview?.interviewer_title || "Pratinjau Kyuujinhyou");
                setIsPreviewOpen(true);
            } else {
                alert(response.data.message || "Gagal mendapatkan link pratinjau.");
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || "Terjadi kesalahan pada server.";
            alert(msg);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleDownload = () => {
        window.open(`https://yunerva.com/f/${interview.kyuujinhyou_yunerva_uuid}`, '_blank');
    };

    const handleUploadKyuujinhyou = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") {
            alert("Hanya file PDF yang diperbolehkan!");
            return;
        }
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const req = await axios.post(route('admin.documents.request'), {
                filename: file.name,
                extension: 'pdf',
                mime_type: 'application/pdf',
                size: file.size
            });
            const { upload_url, upload_ticket } = req.data.data;
            await axios.put(upload_url, file, {
                headers: { 'Content-Type': 'application/pdf' },
                onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / (p.total || file.size))),
            });
            router.post(`/admin/interviews/${interview.id}/upload-kyuujinhyou`, {
                upload_ticket: upload_ticket
            }, {
                onFinish: () => {
                    setIsUploading(false);
                    setUploadProgress(0);
                }
            });
        } catch (err) {
            alert("Gagal mengunggah.");
            setIsUploading(false);
        }
    };

    // --- LOGIC BARU: ADMIN MANAGE DOKUMEN ---

    // Logika untuk menentukan daftar dokumen yang muncul di Tab Documents
    const currentReports = useMemo(() => {
        return interview.type === 'ginoujisshuu' 
            ? INTERVIEW_GINOU_REPORTS 
            : INTERVIEW_TOKUTEI_REPORTS;
    }, [interview.type]);

    const handleManageDocs = (detail: any) => {
        setSelectedStudentForDoc(detail);
        setIsDocModalOpen(true);
    };

    const handleAdminGenerate = (docType: string, studentUserId: number) => {
        const routeName = interview.type === 'ginoujisshuu' 
            ? 'student.documents.ginou.generate' 
            : 'student.documents.tokutei.generate';
        
        const url = route(routeName, { type: docType, userId: studentUserId });
        window.open(url, '_blank');
    };

    const handleAdminUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, studentProfileId: number, studentName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoadingId(fieldName);
        try {
            const ext = file.name.split('.').pop();
            const cleanStudentName = studentName.replace(/\s+/g, '_');
            const newFileName = `${fieldName}_${cleanStudentName}.${ext}`;

            const req = await axios.post(route('admin.documents.request'), {
                filename: newFileName,
                extension: ext,
                mime_type: file.type,
                size: file.size
            });

            const { upload_url, upload_ticket } = req.data.data;
            await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });

            await axios.post(route('admin.documents.store', studentProfileId), {
                field_name: fieldName,
                upload_ticket: upload_ticket 
            });

            alert(`Berhasil mengunggah dokumen untuk ${studentName}`);
            router.reload();
        } catch (err: any) {
            console.error(err);
            alert("Gagal mengunggah berkas.");
        } finally {
            setIsLoadingId(null);
        }
    };

    const handleAdminPreviewDoc = async (fieldName: string, uuid: string, studentProfileId: number) => {
        setIsLoadingId(fieldName);
        try {
            const response = await axios.post(route('admin.documents.preview', studentProfileId), {
                uuid: uuid
            });

            if (response.data.data?.view_url) {
                setPreviewUrl(response.data.data.view_url);
                setPreviewTitle("Pratinjau Dokumen Siswa");
                setIsPreviewOpen(true);
            }
        } catch (err) {
            alert("Gagal memuat pratinjau.");
        } finally {
            setIsLoadingId(null);
        }
    };

    const handleInterviewReportUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingId(fieldName);
    try {
        const ext = file.name.split('.').pop();
        const newFileName = `${label}_${interview.interviewer_title}.${ext}`.replace(/\s+/g, '_');

        // 1. Request Upload
        const req = await axios.post(route('admin.documents.request'), {
            filename: newFileName, extension: ext, mime_type: file.type, size: file.size
        });
        const { upload_url, upload_ticket } = req.data.data;

        // 2. Physical Upload
        await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });

        // 3. Store to Interview Table (Bukan Student Table)
        // Buat route baru di backend: admin.interviews.store-report
        await axios.post(route('admin.interviews.store-report', interview.id), {
            field_name: fieldName,
            upload_ticket: upload_ticket 
        });

        alert(`Berhasil mengunggah ${label}`);
        router.reload();
    } catch (err) {
        alert("Gagal mengunggah laporan.");
    } finally {
        setIsLoadingId(null);
    }
    
    };
    const handleInterviewReportPreview = async (uuid: string) => {
        setIsLoadingId(uuid); // Gunakan UUID sebagai loading state sementara
        try {
            // Tembak ke route preview khusus interview, bukan student
            const response = await axios.post(route('admin.interviews.preview-report', interview.id), {
                uuid: uuid
            });

            if (response.data.data?.view_url) {
                setPreviewUrl(response.data.data.view_url);
                setPreviewTitle("Pratinjau Laporan Kolektif");
                setIsPreviewOpen(true);
            }
        } catch (err) {
            alert("Gagal membuka pratinjau laporan.");
        } finally {
            setIsLoadingId(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail - ${interview?.interviewer_title || 'Wawancara'}`} />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 w-full overflow-x-hidden overflow-y-auto">
                
                <div className="flex items-center justify-between">
                    <Link href="/admin/interviews">
                        <Button variant="ghost" size="sm" className="-ml-2">
                            <ArrowLeft className="mr-2 h-4 w-4" /> 
                            <span className="hidden sm:inline">Kembali</span>
                        </Button>
                    </Link>
                    <Link href={`/admin/interviews/${interview?.id}/edit`}>
                        <Button variant="outline" size="sm">Edit Jadwal</Button>
                    </Link>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-white dark:bg-zinc-950 dark:border-sidebar-border overflow-hidden">
                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-sidebar-border/70">
                        <div className="flex-1 p-6 space-y-4">
                            <div>
                                <Badge className="bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 border-none mb-2">
                                    {interview?.accepting_organization?.type || 'JOB'}
                                </Badge>
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                    {interview?.interviewer_title || 'No Title'}
                                </h1>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 size={16} className="text-blue-500 flex-shrink-0" />
                                    <span className="font-medium truncate">{interview?.company?.name || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin size={16} className="text-red-500 flex-shrink-0" />
                                    <span>{interview?.company?.prefecture || 'Japan'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar size={16} className="text-amber-500 flex-shrink-0" />
                                    <span>{formatDateSafe(interview?.interview_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-rose-600 font-semibold">
                                    <Clock size={16} className="flex-shrink-0" />
                                    <span>Deadline: {formatDateSafe(interview?.interview_registration_deadline)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-50/50 dark:bg-zinc-900/30 p-6 lg:w-80 flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-3 lg:flex-col lg:text-center">
                                <FileText className={interview?.kyuujinhyou_yunerva_uuid ? "text-green-600" : "text-muted-foreground"} size={32} />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider">Kyuujinhyou</p>
                                    <p className="text-[10px] text-muted-foreground">PDF Document</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2">
                                {!isUploading ? (
                                    <>
                                        <label className="w-full">
                                            <Input type="file" className="hidden" onChange={handleUploadKyuujinhyou} accept="application/pdf" />
                                            <Button variant="outline" className="w-full h-9 text-xs" asChild>
                                                <span><Upload className="mr-2 h-3.5 w-3.5" /> Upload</span>
                                            </Button>
                                        </label>
                                        {interview?.kyuujinhyou_yunerva_uuid && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold" onClick={handlePreview} disabled={isLoadingPreview}>
                                                    PREVIEW
                                                </Button>
                                                <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold text-green-700" onClick={handleDownload}>
                                                    UNDUH
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold text-blue-600">
                                            <span>UPLOADING...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                                            <div className="bg-blue-600 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                        <UserPlus size={18} />
                    </div>
                    <Input 
                        placeholder="Tambahkan siswa ke daftar..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 bg-white dark:bg-zinc-950 border-sidebar-border/70 rounded-xl focus-visible:ring-blue-500"
                    />
                    {filteredStudents.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-sidebar-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
                            {filteredStudents.map((student) => (
                                <button
                                    key={student.id}
                                    onClick={() => handleAssignStudent(student.id)}
                                    className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center justify-between border-b last:border-0 border-sidebar-border"
                                >
                                    <div className="min-w-0 pr-4">
                                        <p className="font-bold text-sm truncate">{student.student_profile?.full_name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate uppercase">{student.email}</p>
                                    </div>
                                    <Badge variant="outline" className="flex-shrink-0">Pilih</Badge>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Tabs defaultValue="candidates" className="w-full flex flex-col">
                    <div className="flex items-center justify-between border-b border-sidebar-border/70 mb-4">
                        <TabsList className="bg-transparent w-full justify-start rounded-none h-auto p-0 border-b border-sidebar-border/50 gap-4 sm:gap-6 overflow-x-auto flex-nowrap scrollbar-hide">
                            <TabsTrigger 
                                value="candidates" 
                                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-1 pb-4 pt-2 font-bold text-xs sm:text-sm transition-all data-[state=active]:text-blue-600 shadow-none whitespace-nowrap"
                            >
                                Daftar Peserta
                                <span className="ml-2 py-0.5 px-2 text-[10px] rounded-full bg-neutral-100 text-neutral-500 group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600">
                                    {localDetails.length}
                                </span>
                            </TabsTrigger>
                            
                            <TabsTrigger 
                                value="details" 
                                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-1 pb-4 pt-2 font-bold text-xs sm:text-sm transition-all data-[state=active]:text-blue-600 shadow-none whitespace-nowrap"
                            >
                                Deskripsi Lowongan
                            </TabsTrigger>

                            <TabsTrigger 
                                value="documents" 
                                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-1 pb-4 pt-2 font-bold text-xs sm:text-sm transition-all data-[state=active]:text-blue-600 shadow-none whitespace-nowrap"
                            >
                                Dokumen Wawancara
                            </TabsTrigger>
                        </TabsList>

                        {hasChanges && (
                            <Button 
                                onClick={saveNewOrder} 
                                className="bg-green-600 hover:bg-green-700 text-white h-8 mb-2 px-3 text-xs"
                                size="sm"
                            >
                                <Save className="mr-2 h-3.5 w-3.5" /> Simpan Urutan
                            </Button>
                        )}
                    </div>

                    <TabsContent value="candidates" className="m-0">
                        <div className="rounded-xl border border-sidebar-border/70 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-zinc-900/50 border-b border-sidebar-border/70">
                                        <th className="px-4 py-3.5 w-16 text-center text-[10px] font-black uppercase tracking-widest text-neutral-400">#</th>
                                        <th className="px-4 py-3.5 min-w-[200px] text-[10px] font-black uppercase tracking-widest text-neutral-400">Nama Siswa</th>
                                        <th className="px-4 py-3.5 w-32 text-center text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</th>
                                        <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">Catatan/Evaluasi</th>
                                        <th className="px-4 py-3.5 w-64 text-right text-[10px] font-black uppercase tracking-widest text-neutral-400">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70">
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={localDetails.map((i:any) => i.id)} strategy={verticalListSortingStrategy}>
                                            {localDetails.length > 0 ? localDetails.map((detail: any, index: number) => (
                                                <SortableRow 
                                                    key={detail.id} 
                                                    detail={detail} 
                                                    index={index}
                                                    onRemove={handleRemoveStudent}
                                                    onUpdateModal={openUpdateModal}
                                                    interviewId={interview.id}
                                                    onManageDocs={handleManageDocs}
                                                />
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-20 text-center">
                                                        <Users className="mx-auto h-10 w-10 text-neutral-200 mb-2" />
                                                        <p className="text-sm text-neutral-400 italic">Belum ada peserta yang ditambahkan.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </SortableContext>
                                    </DndContext>
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="m-0">
                        <div className="rounded-xl border border-sidebar-border/70 bg-white dark:bg-zinc-950 p-6 text-sm leading-relaxed whitespace-pre-line">
                            {interview?.description || "Tidak ada deskripsi."}
                        </div>
                    </TabsContent>
                    <TabsContent value="documents" className="m-0">
                    <div className="rounded-xl border bg-white dark:bg-zinc-950 p-6 shadow-sm">
                        <div className="mb-6 border-b pb-4">
                            <h3 className="text-lg font-bold">Laporan Kolektif Wawancara</h3>
                            <p className="text-sm text-muted-foreground">Otomatisasi dokumen berdasarkan data perusahaan dan peserta lulus.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentReports.map((report, idx) => {
                                // Ambil UUID langsung dari object interview yang dipassing dari props
                                const currentUuid = interview[report.field]; 
                                const isLoading = isLoadingId === report.field;

                                return (
                                    <div key={idx} className="flex items-center justify-between p-4 border rounded-xl hover:bg-neutral-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${currentUuid ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold leading-none mb-1">{report.label}</p>
                                                {currentUuid && <p className="text-[10px] text-emerald-600 font-bold uppercase">Sudah Terupload</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Tombol GENERATE Word */}
                                            <Button 
                                                size="sm" variant="secondary" className="h-9 w-9 p-0" title="Generate Word"
                                                onClick={() => window.open(route('admin.interviews.report.generate', { id: interview.id, type: report.typeKey }), '_blank')}
                                            >
                                                <Download size={14} />
                                            </Button>

                                            {/* Tombol PREVIEW PDF */}
                                            {currentUuid && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-9 w-9 p-0" 
                                                    title="Lihat Dokumen"
                                                    onClick={() => handleInterviewReportPreview(currentUuid)} // Panggil fungsi baru
                                                    disabled={isLoadingId === currentUuid}
                                                >
                                                    {isLoadingId === currentUuid ? (
                                                        <Loader2 className="size-4 animate-spin" />
                                                    ) : (
                                                        <Eye size={14} />
                                                    )}
                                                </Button>
                                            )}

                                            {/* Tombol UPLOAD */}
                                            <label className="cursor-pointer">
                                                <Input type="file" className="hidden" onChange={(e) => handleInterviewReportUpload(e, report.field, report.label)} />
                                                <div className={`flex items-center justify-center h-9 w-9 rounded-md border transition-all ${currentUuid ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                                    {isLoading ? <Loader2 className="animate-spin size-4" /> : <UploadCloud size={16} />}
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </TabsContent>
                </Tabs>
            </div>

            {hasChanges && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <Button 
                        onClick={saveNewOrder} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-500/40 h-14 px-8 rounded-full font-black text-sm uppercase tracking-widest gap-3"
                    >
                        <Save size={20} /> Simpan Urutan Terbaru
                    </Button>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden">
                    <form onSubmit={handleUpdateResult}>
                        <div className="p-6 pb-0">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black">Status Wawancara</DialogTitle>
                                <p className="text-sm text-neutral-500 font-bold">{selectedCandidate?.user?.student_profile?.full_name}</p>
                            </DialogHeader>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Hasil Keputusan</label>
                                <Select value={data.result} onValueChange={(v) => setData('result', v)}>
                                    <SelectTrigger className="h-12 border-2 bg-neutral-50 dark:bg-zinc-900 border-neutral-100 dark:border-zinc-800 focus:ring-blue-600 font-bold">
                                        <SelectValue placeholder="Pilih Hasil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="waiting" className="font-bold">Menunggu (Waiting)</SelectItem>
                                        <SelectItem value="passed" className="text-emerald-600 font-bold">LULUS (Passed)</SelectItem>
                                        <SelectItem value="failed" className="text-rose-600 font-bold">GAGAL (Failed)</SelectItem>
                                        <SelectItem value="reserved" className="text-blue-600 font-bold">CADANGAN (Reserved)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Catatan Evaluasi</label>
                                <Textarea 
                                    value={data.remarks} 
                                    onChange={(e) => setData('remarks', e.target.value)} 
                                    placeholder="Tulis alasan atau catatan interview..." 
                                    rows={4} 
                                    className="bg-neutral-50 dark:bg-zinc-900 border-2 border-neutral-100 dark:border-zinc-800 rounded-xl resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-neutral-50 dark:bg-zinc-900/50 flex flex-col gap-2">
                            <Button type="submit" disabled={processing} className="bg-blue-600 text-white w-full h-12 font-black uppercase tracking-widest">Simpan Keputusan</Button>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="w-full text-neutral-400">Batal</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-6xl w-[95vw] h-[95vh] p-0 overflow-hidden bg-zinc-900 border-none shadow-2xl rounded-2xl">
                    <div className="flex flex-col h-full">
                        <div className="p-4 bg-white dark:bg-zinc-950 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><FileText size={18} /></div>
                                <DialogTitle className="text-sm font-bold truncate max-w-[200px] md:max-w-md">{previewTitle}</DialogTitle>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, '_blank')} className="h-9 px-4 font-bold text-xs">
                                    <ExternalLink size={14} className="mr-2" /> Tab Baru
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="rounded-full">
                                    <MoreVertical size={18} />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 bg-zinc-800">
                            {previewUrl ? (
                                <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-none shadow-inner" title="Preview PDF" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-white"></div>
                                    <p className="text-xs uppercase tracking-widest font-bold">Generating Preview...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Kelola Dokumen: {selectedStudentForDoc?.user?.student_profile?.full_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {(interview.type === 'ginoujisshuu' ? GINOU_DOCS : TOKUTEI_DOCS).map((doc) => {
                            const profile = selectedStudentForDoc?.user?.student_profile;
                            const currentUuid = profile?.[doc.field];
                            
                            return (
                                <div key={doc.field} className="flex items-center justify-between p-3 border rounded-xl">
                                    <span className="text-sm font-medium">{doc.label}</span>
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm" variant="secondary" 
                                            title="Generate Word"
                                            onClick={() => handleAdminGenerate(doc.typeKey, selectedStudentForDoc.user_id)}
                                        >
                                            <Download size={14} />
                                        </Button>

                                        {currentUuid && (
                                            <Button 
                                                size="sm" variant="outline" 
                                                title="Preview File"
                                                onClick={() => handleAdminPreviewDoc(doc.field, currentUuid, profile.id)}
                                            >
                                                {isLoadingId === doc.field ? <Loader2 className="animate-spin size-4" /> : <Eye size={14} />}
                                            </Button>
                                        )}
                                        
                                        <label className="cursor-pointer">
                                            <Input 
                                                type="file" className="hidden" 
                                                onChange={(e) => handleAdminUpload(e, doc.field, profile.id, profile.full_name)} 
                                            />
                                            <Button size="sm" variant={currentUuid ? "outline" : "default"} asChild>
                                                <span title="Upload File">
                                                    {isLoadingId === doc.field ? <Loader2 className="animate-spin size-4" /> : <UploadCloud size={14} />}
                                                </span>
                                            </Button>
                                        </label>
                                        
                                        {currentUuid && <Badge className="bg-emerald-500 text-[10px] h-5">TERSIMPAN</Badge>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}