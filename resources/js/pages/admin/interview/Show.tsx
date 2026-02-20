import AppLayout from '@/layouts/app-layout';
import StudentForm from '@/pages/admin/student/StudentForm';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    FileText, Upload, Users, CheckCircle, XCircle, 
    Clock, Building2, MapPin, Briefcase, Calendar,
    ExternalLink, Download, ArrowLeft, Info, Eye,
    UserPlus, Trash2, Hash, GripVertical, Save,
    FileSpreadsheet, MoreVertical, ChevronRight,
    Loader2, UploadCloud, AlertTriangle, CheckCircle2, BadgeCheck, Edit
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
// Tambahkan komponen UI yang diperlukan
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import CvPreviewModal from '@/components/CvPreviewModal'; // <-- Import Modal Baru

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
    // Tambahan untuk form edit:
    provinces?: any[];
    jobSectors?: any[];
    majors?: any[];
}

const GINOU_DOCS = [
    { label: "Form 1-3 (Resume)", field: "ginou_jisshuu_1-3_document_yunerva_uuid", typeKey: "ginou_1-3" },
    { label: "Form 1-19 (Agreement)", field: "ginou_jisshuu_1-19_document_yunerva_uuid", typeKey: "ginou_1-19" },
    { label: "Form 1-20", field: "ginou_jisshuu_1-20_document_yunerva_uuid", typeKey: "ginou_1-20" },
    { label: "Form 1-21", field: "ginou_jisshuu_1-21_document_yunerva_uuid", typeKey: "ginou_1-21" },
    { label: "Form 1-39", field: "ginou_jisshuu_1-39_document_yunerva_uuid", typeKey: "ginou_1-39" },
    { label: "Agreement Letter", field: "ginou_jisshuu_aggreement_document_yunerva_uuid", typeKey: "ginou_agreement" },
    { label: "Work Contract", field: "work_contract_yunerva_uuid", typeKey: "work_contract" },
    { label: "Japanese Language Certificate", field: "japanese_language_certificate_yunerva_uuid", typeKey: "japanese_language_certificate" },
    { label: "Photo Studio", field: "photo_yunerva_uuid", typeKey: "photo_studio" },
    { label: "Photo With Suit", field: "photo_with_suit_yunerva_uuid", typeKey: "photo_with_suit" },
    { label: "ID Card", field: "id_card_yunerva_uuid", typeKey: "id_card" },
    { label: "Family Card", field: "family_card_yunerva_uuid", typeKey: "family_card" },
    { label: "Birth Certificate", field: "birth_certificate_yunerva_uuid", typeKey: "birth_certificate" },
    { label: "Diploma", field: "diploma_yunerva_uuid", typeKey: "diploma" },
    { label: "Transcript", field: "transcript_yunerva_uuid", typeKey: "transcript" },
    { label: "1st Medical Checkup", field: "1st_medical_checkup_yunerva_uuid", typeKey: "1st_medical_checkup" },
    { label: "2nd Medical Checkup", field: "2nd_medical_checkup_yunerva_uuid", typeKey: "2nd_medical_checkup" },
    { label: "3rd Medical Checkup", field: "3rd_medical_checkup_yunerva_uuid", typeKey: "3rd_medical_checkup" },
    { label: "Passport Photo Page", field: "passport_photo_page_yunerva_uuid", typeKey: "passport_photo_page" },
    { label: "Parents Consent Letter", field: "parents_consent_letter_yunerva_uuid", typeKey: "parents_consent_letter" },
];

const TOKUTEI_DOCS = [
    { label: "Form 1-1", field: "tokutei_ginou_1-1_document_yunerva_uuid", typeKey: "tg_1-1" },
    { label: "Form 1-5", field: "tokutei_ginou_1-5_document_yunerva_uuid", typeKey: "tg_1-5" },
    { label: "Form 1-6", field: "tokutei_ginou_1-6_document_yunerva_uuid", typeKey: "tg_1-6" },
    { label: "Form 1-16", field: "tokutei_ginou_1-16_document_yunerva_uuid", typeKey: "tg_1-16" },
    { label: "Form 1-17", field: "tokutei_ginou_1-17_document_yunerva_uuid", typeKey: "tg_1-17" },
    { label: "Power of Attorney", field: "power_of_attorney_letter_yunerva_uuid", typeKey: "power_attorney" },
    { label: "SSW Test Result", field: "ssw_test_result_yunerva_uuid", typeKey: "ssw_result" },
    { label: "Japanese Language Certificate", field: "japanese_language_certificate_yunerva_uuid", typeKey: "japanese_language_certificate" },
    { label: "Work Contract", field: "work_contract_yunerva_uuid", typeKey: "work_contract" },
    { label: "Photo Studio", field: "photo_yunerva_uuid", typeKey: "photo_studio" },
    { label: "Photo With Suit", field: "photo_with_suit_yunerva_uuid", typeKey: "photo_with_suit" },
    { label: "ID Card", field: "id_card_yunerva_uuid", typeKey: "id_card" },
    { label: "1st Medical Checkup", field: "1st_medical_checkup_yunerva_uuid", typeKey: "1st_medical_checkup" },
    { label: "2nd Medical Checkup", field: "2nd_medical_checkup_yunerva_uuid", typeKey: "2nd_medical_checkup" },
    { label: "3rd Medical Checkup", field: "3rd_medical_checkup_yunerva_uuid", typeKey: "3rd_medical_checkup" },
    { label: "Passport Photo Page", field: "passport_photo_page_yunerva_uuid", typeKey: "passport_photo_page" },
    { label: "Parents Consent Letter", field: "parents_consent_letter_yunerva_uuid", typeKey: "parents_consent_letter" },
    
];

const INTERVIEW_TOKUTEI_REPORTS = [
    null
];



// --- KOMPONEN BARIS / CARD YANG BISA DI DRAG ---
function SortableRow({ detail, index, onRemove, onUpdateModal, interviewId, onManageDocs, onPreviewCV, onEditStudent }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: detail.id });

    const style = {
        transform: transform ? CSS.Transform.toString(transform) : undefined, 
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
        touchAction: 'none' // Penting untuk mobile drag
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
                <div className="flex items-center gap-2"> {/* Tambahkan wrapper flex */}
                    <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {detail.user?.student_profile?.full_name || 'No Name'}
                    </div>
                    
                    {/* LOGIKA CENTANG SERTIFIKAT */}
                    {detail.user?.student_profile?.japanese_language_certificate_yunerva_uuid && (
                        <BadgeCheck 
                            size={16} 
                            className="text-blue-500 flex-shrink-0" 
                            strokeWidth={2.5}
                        />
                    )}
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
                    {/* GANTI LINK DOWNLOAD DENGAN BUTTON PREVIEW */}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 border-emerald-600 text-emerald-600 hover:bg-emerald-50 gap-1.5"
                        onClick={() => onPreviewCV(detail.user_id, detail.user?.student_profile?.full_name)}
                    >
                        <FileSpreadsheet size={14} /> CV
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={onEditStudent} 
                        title="Edit Data Siswa"
                    >
                        <Edit size={16} />
                    </Button>
                    <Button onClick={() => onUpdateModal(detail)} variant="secondary" size="sm" className="h-8">Status</Button>
                    <a 
                        href={`/admin/students/${detail.user?.student_profile?.id}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        <Button variant="ghost" size="sm" className="h-8 text-blue-600 font-bold">
                            Profil
                        </Button>
                    </a>
                    <Button onClick={() => onRemove(detail.id)} variant="ghost" size="sm" className="h-8 text-neutral-300 hover:text-rose-600">
                        <Trash2 size={16} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}

export default function InterviewShow({ 
        interview, 
        availableStudents = [], 
        provinces = [], 
        jobSectors = [], 
        majors = [] 
    }: Props) {
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

    const [cvModalOpen, setCvModalOpen] = useState(false);
    const [selectedCvUser, setSelectedCvUser] = useState<{id: number, name: string} | null>(null);

    const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<any>(null);
    
    // State Baru untuk Kelola Dokumen Admin
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [selectedStudentForDoc, setSelectedStudentForDoc] = useState<any>(null);
    const [isLoadingId, setIsLoadingId] = useState<string | null>(null);
    // State tambahan untuk Modal Edit Jadwal Pelatihan
    const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);  
    const [isScheduleEditConfirmed, setIsScheduleEditConfirmed] = useState(false);

    const { data: scheduleData, setData: setScheduleData, patch: patchSchedule, processing: processingSchedule } = useForm({
        '1_23_req_letter_number': interview['1_23_req_letter_number'] || '',
        // 1-34
        '1_34_training_start_date': interview['1_34_training_start_date'] || '',
        '1_34_training_end_date': interview['1_34_training_end_date'] || '',
        '1_34_training_duration_hours': interview['1_34_training_duration_hours'] || '',
        '1_34_training_item': interview['1_34_training_item'] || '',

        // 1-29 Stage 1 (PASTIKAN PENAMAAN INI SAMA DENGAN MAP DI BAWAH)
        '1_29_first_training_start_date': interview['1_29_first_training_start_date'] || '',
        '1_29_first_training_end_date': interview['1_29_first_training_end_date'] || '',
        '1_29_first_training_duration_hours': interview['1_29_first_training_duration_hours'] || '',
        '1_29_first_training_item': interview['1_29_first_training_item'] || '',

        // 1-29 Stage 2
        '1_29_second_training_start_date': interview['1_29_second_training_start_date'] || '',
        '1_29_second_training_end_date': interview['1_29_second_training_end_date'] || '',
        '1_29_second_training_duration_hours': interview['1_29_second_training_duration_hours'] || '',
        '1_29_second_training_item': interview['1_29_second_training_item'] || '',

        // 1-29 Stage 3
        '1_29_third_training_start_date': interview['1_29_third_training_start_date'] || '',
        '1_29_third_training_end_date': interview['1_29_third_training_end_date'] || '',
        '1_29_third_training_duration_hours': interview['1_29_third_training_duration_hours'] || '',
        '1_29_third_training_item': interview['1_29_third_training_item'] || '',
    });

    const ginouReports = useMemo(() => {
        // 1. Daftar Dokumen Dasar (Selalu Ada)
        const baseReports = [
            { label: "Surat Bukti Pelatihan Teknis (1-34)", typeKey: "ginou_1-34", field: "ginou_1_34_uuid" },
            { label: "Surat Perjanjian Sertifikasi Pelatihan (1-10)", typeKey: "ginou_1-10", field: "ginou_1_10_uuid" },
            { label: "Rekom Pemberangkatan (1-23)", typeKey: "ginou_1-23", field: "ginou_1_23_uuid" },
            { label: "Surat Pengajuan Rekom (1-23)", typeKey: "ginou_1-23_req", field: "ginou_1_23_req_uuid" },
            { label: "Profile LPK (1-13)", typeKey: "ginou_1-13", field: "ginou_1_13_uuid" },
            { label: "Pernyataan Pelatihan Pra Pemberangkatan (1-29)", typeKey: "ginou_1-29", field: "ginou_1_29_uuid" },
            { label: "Jadwal Pelatihan Pra-Pemberangkatan (4-8)", typeKey: "ginou_4-8", field: "ginou_4_8_uuid" },
        ];

        // 2. Tambahkan dokumen tambahan hanya jika Industrinya adalah Kaigo (介護)
        if (interview?.industry === '介護') {
            return [
                ...baseReports,
                { label: "Pernyataan Pengajar Bahasa Jepang", typeKey: "stmt_jp_teacher", field: "stmt_jp_teacher_uuid" },
                { label: "Pernyataan Pengajar Keterampilan Kaigo", typeKey: "stmt_kg_teacher", field: "stmt_kg_teacher_uuid" },
                { label: "CV Pengajar Bahasa Jepang", typeKey: "cv_jp_teacher", field: "cv_jp_teacher_uuid" },
                { label: "CV Pengajar Keterampilan Kaigo", typeKey: "cv_kg_teacher", field: "cv_kg_teacher_uuid" },
                { label: "Jadwal Perincian Pelatihan", typeKey: "schedule_detail", field: "schedule_detail_uuid" },
            ];
        }

        return baseReports;
    }, [interview?.industry]); // Re-run jika industry berubah

    // Filter siswa yang LULUS untuk bagian Berkas Per Siswa
    const passedStudents = useMemo(() => {
        return localDetails.filter((d: any) => d.result === 'passed');
    }, [localDetails]); 

    const handleEditStudent = (studentProfile: any, user: any) => {
        setStudentToEdit({ ...studentProfile, user: user });
        setIsEditStudentOpen(true);
    };

    const handleUpdateSchedule = (e: React.FormEvent) => {
        e.preventDefault();

        patchSchedule(`/admin/interviews/${interview.id}/update-schedule-params`, {
            onSuccess: () => {
                setIsEditScheduleModalOpen(false);
                setIsScheduleEditConfirmed(false);
                // Biar mantap kasih toast/alert bawaan browser
                alert("Database berhasil di-update secara manual!");
            },
            onError: (err) => {
                console.error("Error Detail:", err);
                alert("Gagal simpan data. Cek console browser.");
            },
            preserveScroll: true
        });
    };

    const onPreviewCV = (userId: number, userName: string) => {
        setSelectedCvUser({ id: userId, name: userName });
        setCvModalOpen(true);
    };

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
            ? ginouReports // Menggunakan hasil useMemo di atas
            : INTERVIEW_TOKUTEI_REPORTS;
    }, [interview.type, ginouReports]); // Tambahkan ginouReports di dependency

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
                                                    onPreviewCV={onPreviewCV} // <--- TAMBAHKAN BARIS INI
                                                    onEditStudent={() => handleEditStudent(detail.user?.student_profile, detail.user)}
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
                    {/* CONTENT: DOKUMEN & BERKAS (VERSI BARU) */}
                <TabsContent value="documents" className="space-y-6">
                    {/* BUTTON EDIT PARAMETER JADWAL */}
                    <div className="flex justify-end">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-amber-500 text-amber-600 hover:bg-amber-50"
                            onClick={() => setIsEditScheduleModalOpen(true)}
                        >
                            <Calendar className="mr-2 h-4 w-4" /> Edit Parameter Pelatihan (Word)
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* KIRI: LAPORAN KOLEKTIF */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="p-4 bg-neutral-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-neutral-300">
                                <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-600"/> Laporan Kolektif
                                </h4>
                                <div className="space-y-2">
                                    {currentReports.map((report, idx) => {
                                        const currentUuid = interview[report.field];
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-950 border rounded-lg text-xs">
                                                <span className="font-medium truncate mr-2">{report.label}</span>
                                                <div className="flex gap-1 shrink-0">
                                                    {/* Tombol GENERATE Word Kolektif */}
                                                    <Button 
                                                        size="sm" 
                                                        variant="secondary" 
                                                        className="h-9 w-9 p-0" 
                                                        title="Generate Word"
                                                        onClick={() => {
                                                            const url = `/admin/interviews/${interview.id}/report/${report.typeKey}`;
                                                            window.open(url, '_blank');
                                                        }}
                                                    >
                                                        <Download size={14} />
                                                    </Button>
                                                    {currentUuid && <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" onClick={() => handleInterviewReportPreview(currentUuid)}><Eye size={12}/></Button>}
                                                    <label className="cursor-pointer">
                                                        <Input type="file" className="hidden" onChange={(e) => handleInterviewReportUpload(e, report.field, report.label)} />
                                                        <div className={`flex items-center justify-center h-7 w-7 rounded-md border ${currentUuid ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-600 text-white'}`}>
                                                            <Upload size={12} />
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* KANAN: BERKAS PER SISWA (LULUS) */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white dark:bg-zinc-950 border rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-4 bg-neutral-50 dark:bg-zinc-900 border-b flex justify-between items-center">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <Users size={16} className="text-emerald-600"/> Berkas Siswa Lulus
                                    </h4>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">{passedStudents.length} Siswa</Badge>
                                </div>
                                <div className="divide-y">
                                    {passedStudents.length > 0 ? passedStudents.map((detail: any) => (
                                        <div key={detail.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                    {detail.user?.student_profile?.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold leading-none">{detail.user?.student_profile?.full_name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase mt-1">ID: {detail.user_id}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                {/* Status Checklist (Indikator Dokumen Lengkap) */}
                                                <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase">
                                                    <CheckCircle size={12} className={detail.user?.student_profile?.ginou_jisshuu_1_3_document_yunerva_uuid ? "text-emerald-500" : "text-neutral-200"} />
                                                    Resume
                                                </div>
                                                
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    className="h-8 text-xs font-bold"
                                                    onClick={() => handleManageDocs(detail)}
                                                >
                                                    Kelola Berkas
                                                </Button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-10 text-center text-neutral-400 text-sm italic">Belum ada siswa yang dinyatakan Lulus.</div>
                                    )}
                                </div>
                            </div>
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

            <Dialog open={isEditScheduleModalOpen} onOpenChange={setIsEditScheduleModalOpen}>
                <DialogContent className="max-w-7xl w-[95vw] lg:max-w-[90vw] max-h-[95vh] overflow-y-auto bg-muted/30 p-0 border shadow-2xl">
                    {/* HEADER STANDAR SHADCN */}
                    <div className="sticky top-0 z-50 bg-background border-b p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold">Parameter Dokumen (1-34 & 1-29)</DialogTitle>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Editor Rencana Pelatihan Magang</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsEditScheduleModalOpen(false)} className="rounded-full">
                            <XCircle className="h-6 w-6 text-muted-foreground" />
                        </Button>
                    </div>

                    {!isScheduleEditConfirmed ? (
                        <div className="p-10 flex flex-col items-center justify-center min-h-[460px] bg-background">
                            <div className="max-w-2xl w-full bg-white dark:bg-zinc-950 p-8 rounded-2xl border shadow-sm space-y-8">
                                <Alert variant="destructive" className="border-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    <AlertTitle className="font-bold text-lg tracking-tight">PERINGATAN DOKUMEN IMIGRASI</AlertTitle>
                                    <AlertDescription className="text-sm leading-relaxed opacity-90">
                                        Data yang Anda ubah akan langsung berdampak pada isi dokumen Word 1-34 dan 1-29. 
                                        Pastikan seluruh perhitungan jam dan periode tanggal sudah divalidasi sesuai standar OTIT.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-6 text-center">
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-foreground">Konfirmasi Akses Editor</p>
                                        <p className="text-xs text-muted-foreground italic">
                                            Klik tombol di bawah untuk membuka lembar kerja dokumen. 
                                            Pastikan Anda memahami struktur Dokumen Rencana Pelatihan.
                                        </p>
                                    </div>
                                    
                                    <Button 
                                        onClick={() => setIsScheduleEditConfirmed(true)} 
                                        size="lg" 
                                        className="w-full sm:w-auto px-12 font-bold uppercase tracking-widest shadow-sm"
                                    >
                                        Buka Lembar Kerja <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateSchedule} className="p-8 lg:p-12 space-y-12">
                            
                            {/* --- BAGIAN 1: FORM 1-34 (STYLE KERTAS PUTIH) --- */}
                            <div className="bg-background p-10 border shadow-sm relative mx-auto max-w-[1000px]">
                                <div className="absolute top-4 right-4 text-[10px] text-muted-foreground font-mono">参考様式第１-34 号</div>
                                <h3 className="text-center text-lg font-bold mb-8 uppercase underline underline-offset-4">訓練実施（予定）表 (Form 1-34)</h3>
                                
                                <table className="w-full border-2 border-foreground text-[11px] border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 font-bold">
                                            <th className="border-2 border-foreground p-3 w-[25%] text-left">科目（内容）</th>
                                            <th className="border-2 border-foreground p-3 w-[40%] text-left">実施場所</th>
                                            <th className="border-2 border-black p-3 w-[20%] text-left">実施期間</th>
                                            <th className="border-2 border-black p-3 w-[15%] text-center">実施時間数</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border-2 border-foreground p-0 bg-background">
                                                <textarea 
                                                    className="w-full h-40 p-3 text-[12px] border-none focus:ring-0 bg-transparent font-japanese leading-relaxed resize-none"
                                                    value={scheduleData['1_34_training_item']}
                                                    onChange={e => setScheduleData('1_34_training_item', e.target.value)}
                                                />
                                            </td>
                                            <td className="border-2 border-foreground p-4 bg-muted/10 text-xs leading-relaxed">
                                                <p className="font-bold">LPK OOSAKA GAKKOU</p>
                                                <p className="text-muted-foreground mt-1">Jl. Raya Wates-Kediri RT. 08 RW. 00 Desa/Kel. Ngletih Kec. Kandat, Kab. Kediri, Prov. Jawa Timur Indonesia</p>
                                            </td>
                                            <td className="border-2 border-foreground p-3 bg-background">
                                                <div className="space-y-3">
                                                    <Input type="date" value={scheduleData['1_34_training_start_date']} onChange={e => setScheduleData('1_34_training_start_date', e.target.value)} className="h-8 text-[11px] border-foreground rounded-none shadow-none" />
                                                    <div className="text-center font-bold">～</div>
                                                    <Input type="date" value={scheduleData['1_34_training_end_date']} onChange={e => setScheduleData('1_34_training_end_date', e.target.value)} className="h-8 text-[11px] border-foreground rounded-none shadow-none" />
                                                </div>
                                            </td>
                                            <td className="border-2 border-foreground p-0 bg-muted/5">
                                                <input 
                                                    className="w-full h-40 text-center text-2xl font-bold border-none focus:ring-0 bg-transparent"
                                                    value={scheduleData['1_34_training_duration_hours']}
                                                    onChange={e => setScheduleData('1_34_training_duration_hours', e.target.value)}
                                                />
                                                <p className="text-[8px] text-center font-bold -mt-10 uppercase text-muted-foreground">Hours</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* --- BAGIAN 2: FORM 1-29 --- */}
                            <div className="bg-background p-10 border shadow-sm relative mx-auto max-w-[1000px]">
                                <div className="absolute top-4 right-4 text-[10px] text-muted-foreground font-mono">参考様式第１-29 号</div>
                                <h3 className="text-center text-lg font-bold mb-8 uppercase underline underline-offset-4 tracking-tight">入国前講習実施（予定）表 (Form 1-29)</h3>
                                
                                <table className="w-full border-2 border-foreground text-[10px] border-collapse">
                                    <thead>
                                        <tr className="bg-muted text-foreground border-b-2 border-foreground font-bold">
                                            <th className="border-2 border-foreground p-2 w-8">#</th>
                                            <th className="border-2 border-foreground p-2 w-[22%]">科目（内容）</th>
                                            <th className="border-2 border-foreground p-2 w-[25%] text-[9px]">実施機関 / 所在地</th>
                                            <th className="border-2 border-foreground p-2 w-[8%] text-center">外部委託</th>
                                            <th className="border-2 border-foreground p-2 w-[15%]">実施場所</th>
                                            <th className="border-2 border-foreground p-2 w-[20%]">実施期間</th>
                                            <th className="border-2 border-foreground p-2 w-[10%] text-center">時間数</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { key: 'first', num: 1, label: '日本語' },
                                            { key: 'second', num: 2, label: '日本での生活一般知識' },
                                            { key: 'third', num: 3, label: '技能等習得知識' }
                                        ].map((stage) => {
                                            const startKey = `1_29_${stage.key}_training_start_date` as keyof typeof scheduleData;
                                            const endKey = `1_29_${stage.key}_training_end_date` as keyof typeof scheduleData;
                                            const hrsKey = `1_29_${stage.key}_training_duration_hours` as keyof typeof scheduleData;
                                            const itemKey = `1_29_${stage.key}_training_item` as keyof typeof scheduleData;

                                            return (
                                                <tr key={stage.key}>
                                                    <td className="border-2 border-foreground text-center font-bold bg-muted/30">{stage.num}</td>
                                                    <td className="border-2 border-foreground p-0 bg-background">
                                                        <textarea 
                                                            className="w-full h-24 p-2 text-[10px] border-none focus:ring-0 font-japanese leading-relaxed bg-transparent resize-none"
                                                            value={String(scheduleData[itemKey] || '')}
                                                            onChange={e => setScheduleData(itemKey as any, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="border-2 border-foreground p-3 text-center font-japanese bg-muted/10 text-[9px]">
                                                        <div className="font-bold underline decoration-1 underline-offset-2 mb-1">
                                                            {interview.accepting_organization?.name_in_japanese || '-'}
                                                        </div>
                                                        <div className="opacity-70 leading-tight">
                                                            {interview.accepting_organization?.address_in_japanese || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="border-2 border-foreground p-1 text-center font-bold bg-muted/5">■有</td>
                                                    <td className="border-2 border-foreground p-2 italic text-[8px] bg-muted/10">
                                                        <strong>職業訓練機関</strong><br/>LPK OOSAKA GAKKOU
                                                    </td>
                                                    <td className="border-2 border-foreground p-2 bg-background">
                                                        <div className="space-y-2">
                                                            <Input type="date" value={String(scheduleData[startKey] || '')} onChange={e => setScheduleData(startKey as any, e.target.value)} className="h-7 text-[10px] p-1 border-foreground rounded-none shadow-none" />
                                                            <div className="text-center text-xs opacity-30">～</div>
                                                            <Input type="date" value={String(scheduleData[endKey] || '')} onChange={e => setScheduleData(endKey as any, e.target.value)} className="h-7 text-[10px] p-1 border-foreground rounded-none shadow-none" />
                                                        </div>
                                                    </td>
                                                    <td className="border-2 border-foreground p-0 bg-muted/5">
                                                        <input 
                                                            className="w-full h-24 text-center text-lg font-bold border-none focus:ring-0 bg-transparent" 
                                                            value={String(scheduleData[hrsKey] || '')} 
                                                            onChange={e => setScheduleData(hrsKey as any, e.target.value)} 
                                                        />
                                                    </td>

                                                </tr>
                                            );
                                        })}

                                        <tr className="bg-muted font-bold border-t-2 border-foreground text-[11px]">
                                            <td colSpan={6} className="border-2 border-foreground p-3 text-center uppercase tracking-widest">Total Hours</td>
                                            <td className="border-2 border-foreground p-3 text-center text-lg underline bg-background">
                                                {(Number(scheduleData['1_29_first_training_duration_hours']) || 0) + 
                                                (Number(scheduleData['1_29_second_training_duration_hours']) || 0) + 
                                                (Number(scheduleData['1_29_third_training_duration_hours']) || 0)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* ACTION BAR STICKY BOTTOM */}
                            <div className="flex justify-end items-center gap-4 bg-background border-t p-6 sticky bottom-0 z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                                <p className="text-[10px] text-muted-foreground uppercase font-medium mr-auto italic">*Cek kembali total jam dan periode sebelum menyimpan.</p>
                                <Button type="button" variant="outline" onClick={() => setIsScheduleEditConfirmed(false)} className="px-8 h-10">Batal</Button>
                                <Button disabled={processingSchedule} type="submit" className="px-10 h-10 font-bold">
                                    {processingSchedule ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4"/>}
                                    SIMPAN DATA
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
                <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-y-auto bg-background">
                    <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-20">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="flex items-center gap-2">
                                Edit Profil Siswa
                                {studentToEdit?.full_name && (
                                    <>
                                        <span className="hidden sm:inline text-muted-foreground font-light text-lg">|</span>
                                        <span className="text-blue-600 truncate max-w-[200px] sm:max-w-md">
                                            {studentToEdit.full_name}
                                        </span>
                                    </>
                                )}
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground">
                                {studentToEdit?.nik ? `NIK: ${studentToEdit.nik}` : 'Perbarui data siswa'}
                            </p>
                        </div>
                    </DialogHeader>
                        
                    {studentToEdit && (
                        <StudentForm 
                            student={studentToEdit}
                            provinces={provinces}
                            jobSectors={jobSectors}
                            majors={majors}
                            isModal={true} // <-- KUNCINYA DISINI
                            onSuccess={() => {
                                setIsEditStudentOpen(false);
                                // Optional: refresh data halaman ini jika perlu
                                // router.reload({ only: ['interview'] });
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
            {/* TAMBAHKAN MODAL PREVIEW CV DISINI */}
            <CvPreviewModal 
                isOpen={cvModalOpen}
                onClose={() => setCvModalOpen(false)}
                userId={selectedCvUser?.id || null}
                interviewId={interview.id}
                userName={selectedCvUser?.name || 'Siswa'}
            />
        </AppLayout>
    );
}