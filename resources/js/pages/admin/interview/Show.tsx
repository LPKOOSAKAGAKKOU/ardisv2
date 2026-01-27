import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    FileText, Upload, Users, CheckCircle, XCircle, 
    Clock, Building2, MapPin, Briefcase, Calendar,
    ExternalLink, Download, ArrowLeft, Info, Eye,
    UserPlus, Trash2, Hash, GripVertical, Save,
    FileSpreadsheet, MoreVertical, ChevronRight
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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

// --- KOMPONEN BARIS / CARD YANG BISA DI DRAG ---
function SortableRow({ detail, index, onRemove, onUpdateModal, interviewId }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: detail.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    const statusColors: any = {
        passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
        failed: "bg-rose-50 text-rose-700 border-rose-200",
        waiting: "bg-amber-50 text-amber-700 border-amber-200",
        reserved: "bg-blue-50 text-blue-700 border-blue-200",
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`group relative flex flex-col md:flex-row items-start md:items-center gap-4 p-4 md:px-6 md:py-4 bg-white dark:bg-zinc-950 border-b border-neutral-100 dark:border-zinc-800 transition-all ${isDragging ? 'shadow-xl ring-1 ring-blue-200 z-10 scale-[1.02] rounded-lg' : ''}`}
        >
            {/* Drag Handle & Numbering */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <button {...attributes} {...listeners} className="p-2 -ml-2 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-blue-600 transition-colors">
                    <GripVertical size={20} />
                </button>
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-zinc-800 text-xs font-bold text-neutral-600">
                    {index + 1}
                </span>
                
                {/* Mobile Identity */}
                <div className="md:hidden flex-1 min-w-0">
                    <p className="font-bold truncate">{detail.user?.student_profile?.full_name || 'No Name'}</p>
                    <Badge variant="outline" className={`text-[10px] h-5 ${statusColors[detail.result] || "bg-neutral-50"}`}>
                        {detail.result?.toUpperCase() || 'PENDING'}
                    </Badge>
                </div>

                {/* Mobile Actions Dropdown */}
                <div className="md:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onUpdateModal(detail)}>Set Status</DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href={route('cv.generate', { userId: detail.user_id, interviewId: interviewId })} target="_blank">Download CV</a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/students/${detail.user?.student_profile?.id}`}>Lihat Profil</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRemove(detail.id)} className="text-red-600">Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Desktop Content */}
            <div className="hidden md:block flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{detail.user?.student_profile?.full_name || 'No Name'}</p>
            </div>

            <div className="hidden md:block w-32 text-center">
                <Badge variant="outline" className={`font-bold ${statusColors[detail.result] || "bg-neutral-50"}`}>
                    {detail.result?.toUpperCase() || 'PENDING'}
                </Badge>
            </div>

            <div className="hidden md:block flex-1 text-xs text-muted-foreground line-clamp-1 italic">
                {detail.remarks || '-'}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-1">
                 <a href={route('cv.generate', { userId: detail.user_id, interviewId: interviewId })} target="_blank">
                    <Button variant="outline" size="sm" className="h-8 border-emerald-600 text-emerald-600 hover:bg-emerald-50 gap-1.5">
                        <FileSpreadsheet size={14} /> CV
                    </Button>
                </a>
                <Button onClick={() => onUpdateModal(detail)} variant="secondary" size="sm" className="h-8 font-semibold">Status</Button>
                <Link href={`/admin/students/${detail.user?.student_profile?.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">Profil</Button>
                </Link>
                <Button onClick={() => onRemove(detail.id)} variant="ghost" size="sm" className="h-8 text-neutral-400 hover:text-red-600">
                    <Trash2 size={16} />
                </Button>
            </div>

            {/* Mobile Remarks Overlay (if exists) */}
            {detail.remarks && (
                <div className="md:hidden w-full mt-1 p-2 rounded bg-neutral-50 dark:bg-zinc-900 text-[11px] text-neutral-500 italic">
                    "{detail.remarks}"
                </div>
            )}
        </div>
    );
}

export default function InterviewShow({ interview, availableStudents = [] }: Props) {
    // ... (Keep all existing useState and Logic)
    const [isUploading, setIsUploading] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [localDetails, setLocalDetails] = useState(interview?.details || []);
    const [hasChanges, setHasChanges] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);

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
            const req = await axios.post('/admin/upload-request', {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail - ${interview?.interviewer_title || 'Wawancara'}`} />

            <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32">
                {/* Navigation & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Link href="/admin/interviews">
                        <Button variant="ghost" size="sm" className="-ml-2"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Index</Button>
                    </Link>
                    <Link href={`/admin/interviews/${interview?.id}/edit`}>
                        <Button variant="default" className="w-full sm:w-auto shadow-sm">Edit Jadwal</Button>
                    </Link>
                </div>

                {/* Hero Information Card */}
                <div className="relative bg-white dark:bg-zinc-950 rounded-3xl border border-neutral-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    
                    <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-8 relative z-10">
                        {/* Info Section */}
                        <div className="flex-1 space-y-6">
                            <div className="space-y-2">
                                <Badge className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-3 py-1 text-[10px] tracking-widest font-bold">
                                    {interview?.accepting_organization?.type || 'INTERVIEW JOB'}
                                </Badge>
                                <h1 className="text-2xl md:text-4xl font-black text-neutral-900 dark:text-white leading-tight">
                                    {interview?.interviewer_title || 'No Title'}
                                </h1>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Company</p>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600"><Building2 size={18} /></div>
                                        <span className="font-bold text-sm">{interview?.company?.name || '-'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Location</p>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-rose-600"><MapPin size={18} /></div>
                                        <span className="font-bold text-sm">{interview?.company?.prefecture || 'Japan'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Interview Date</p>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600"><Calendar size={18} /></div>
                                        <span className="font-bold text-sm">{formatDateSafe(interview?.interview_date)}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-rose-600">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Registration Deadline</p>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg"><Clock size={18} /></div>
                                        <span className="font-black text-sm">{formatDateSafe(interview?.interview_registration_deadline)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Document Panel */}
                        <div className="lg:w-80 flex flex-col items-center justify-center p-8 bg-neutral-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-zinc-800 transition-colors">
                            <FileText className={interview?.kyuujinhyou_yunerva_uuid ? "text-emerald-500" : "text-neutral-300"} size={48} />
                            <h3 className="mt-4 font-bold text-sm">Kyuujinhyou PDF</h3>
                            <p className="text-[11px] text-neutral-500 mb-6 text-center">Pastikan dokumen sesuai dengan spesifikasi pekerjaan.</p>
                            
                            <div className="w-full space-y-3">
                                {!isUploading ? (
                                    <>
                                        <label className="block w-full">
                                            <Input type="file" className="hidden" onChange={handleUploadKyuujinhyou} accept="application/pdf" />
                                            <Button variant={interview?.kyuujinhyou_yunerva_uuid ? "outline" : "default"} className="w-full h-11 text-xs font-bold gap-2" asChild>
                                                <span><Upload size={16} /> {interview?.kyuujinhyou_yunerva_uuid ? "Update Dokumen" : "Upload Dokumen"}</span>
                                            </Button>
                                        </label>
                                        {interview?.kyuujinhyou_yunerva_uuid && (
                                            <div className="flex gap-2">
                                                <Button variant="secondary" className="flex-1 h-10 text-[11px] font-black tracking-tighter" onClick={handlePreview} disabled={isLoadingPreview}>
                                                    {isLoadingPreview ? "LOADING..." : "PREVIEW"}
                                                </Button>
                                                <Button variant="secondary" className="flex-1 h-10 text-[11px] font-black tracking-tighter text-emerald-600" onClick={handleDownload}>
                                                    UNDUH
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full space-y-3">
                                        <div className="flex justify-between text-[11px] font-bold text-blue-600">
                                            <span className="animate-pulse">UPLOADING...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-neutral-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden shadow-inner">
                                            <div className="bg-blue-600 h-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="candidates" className="w-full">
                    <div className="sticky top-0 z-20 bg-neutral-50 dark:bg-zinc-950/80 backdrop-blur-md pt-2 border-b border-neutral-200 dark:border-zinc-800">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                            <TabsList className="bg-transparent w-auto justify-start rounded-none h-auto p-0 gap-6">
                                <TabsTrigger value="candidates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-1 pb-4 font-black text-sm uppercase tracking-tighter">
                                    Daftar Peserta <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">{localDetails.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-1 pb-4 font-black text-sm uppercase tracking-tighter">
                                    Deskripsi
                                </TabsTrigger>
                            </TabsList>

                            {/* Assign Input Inline with Tabs for Desktop */}
                            <div className="w-full md:w-80 relative mb-2">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
                                    <UserPlus size={16} />
                                </div>
                                <Input 
                                    placeholder="Cari siswa untuk ditambahkan..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 bg-white dark:bg-zinc-900 border-neutral-200 focus-visible:ring-blue-500 rounded-full"
                                />
                                {filteredStudents.length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border rounded-2xl shadow-2xl max-h-80 overflow-auto border-neutral-100 p-2 space-y-1">
                                        {filteredStudents.map((student) => (
                                            <button
                                                key={student.id}
                                                onClick={() => handleAssignStudent(student.id)}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl flex items-center justify-between group transition-all"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate">{student.student_profile?.full_name}</p>
                                                    <p className="text-[10px] text-neutral-400 truncate uppercase">{student.email}</p>
                                                </div>
                                                <ChevronRight size={16} className="text-neutral-300 group-hover:text-blue-600" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <TabsContent value="candidates" className="mt-8">
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-neutral-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                            {/* Table Header Desktop */}
                            <div className="hidden md:flex bg-neutral-50 dark:bg-zinc-900/50 border-b border-neutral-100 dark:border-zinc-800 py-3 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                <div className="w-20 pl-6 text-center">Urutan</div>
                                <div className="flex-1">Nama Siswa</div>
                                <div className="w-32 text-center">Status</div>
                                <div className="flex-1">Evaluasi/Catatan</div>
                                <div className="w-64 text-right pr-4">Opsi</div>
                            </div>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={localDetails.map((i:any) => i.id)} strategy={verticalListSortingStrategy}>
                                    <div className="flex flex-col">
                                        {localDetails.length > 0 ? localDetails.map((detail: any, index: number) => (
                                            <SortableRow 
                                                key={detail.id} 
                                                detail={detail} 
                                                index={index}
                                                onRemove={handleRemoveStudent}
                                                onUpdateModal={openUpdateModal}
                                                interviewId={interview.id}
                                            />
                                        )) : (
                                            <div className="py-20 text-center flex flex-col items-center justify-center opacity-40">
                                                <Users size={48} className="mb-4" />
                                                <p className="text-sm font-medium italic">Belum ada kandidat yang terdaftar.</p>
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="mt-8">
                        <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-neutral-200 dark:border-zinc-800 whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-4xl shadow-sm">
                            {interview?.description || "Tidak ada rincian deskripsi tambahan untuk lowongan ini."}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Floating Save Button - High UX visibility */}
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

            {/* Modals & Dialogs (Refactored for mobile comfort) */}
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
                                <DialogTitle className="text-sm font-bold truncate max-w-[200px] md:max-w-md">{interview?.interviewer_title}</DialogTitle>
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
                                <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-none shadow-inner" title="Kyuujinhyou PDF" />
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
        </AppLayout>
    );
}