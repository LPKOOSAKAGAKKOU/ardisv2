import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    FileText, Upload, Users, CheckCircle, XCircle, 
    Clock, Building2, MapPin, Briefcase, Calendar,
    ExternalLink, Download, ArrowLeft, Info, Eye,
    UserPlus, Trash2, Hash, GripVertical, Save,
    FileSpreadsheet // --- TAMBAHKAN IKON INI ---
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
import axios from 'axios';
import { format, isValid } from 'date-fns';
import { route } from 'ziggy-js';

// --- IMPORT DND-KIT ---
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

// --- KOMPONEN BARIS TABEL YANG BISA DI DRAG ---
// --- TAMBAHKAN interviewId KE PROPS ---
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
        position: 'relative' as const,
    };

    return (
        <tr 
            ref={setNodeRef} 
            style={style} 
            className={`hover:bg-neutral-50/50 transition-colors group ${isDragging ? 'bg-white shadow-2xl opacity-80' : ''}`}
        >
            <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-3">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-blue-600">
                        <GripVertical size={18} />
                    </button>
                    <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 w-7 h-7 flex items-center justify-center rounded-full border border-blue-100">
                        {index + 1}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4 font-bold capitalize">
                {detail.user?.student_profile?.full_name || 'No Name'}
            </td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={
                    detail.result === 'passed' ? "bg-green-50 text-green-700 border-green-200" :
                    detail.result === 'failed' ? "bg-red-50 text-red-700 border-red-200" : ""
                }>
                    {detail.result?.toUpperCase() || 'PENDING'}
                </Badge>
            </td>
            <td className="px-6 py-4 text-xs italic text-muted-foreground">{detail.remarks || '-'}</td>
            <td className="px-6 py-4 text-right space-x-1 flex items-center justify-end">
                {/* --- TOMBOL GENERATE CV (EXCEL) --- */}
                    <a href={route('cv.generate', { userId: detail.user_id, interviewId: interviewId })} target="_blank">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 border-green-600 text-green-600 hover:bg-green-50"
                        >
                            <FileSpreadsheet size={14} className="mr-1.5" /> CV
                        </Button>
                    </a>

                <Button onClick={() => onUpdateModal(detail)} variant="outline" size="sm" className="h-8">Set Status</Button>
                
                <Link href={`/admin/students/${detail.user?.student_profile?.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-blue-600 font-bold">Profil</Button>
                </Link>
                
                <Button 
                    onClick={() => onRemove(detail.id)} 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-neutral-300 hover:text-red-600 transition-colors"
                >
                    <Trash2 size={16} />
                </Button>
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

    // --- FITUR BARU: DRAG & DROP LOGIC ---
    const [localDetails, setLocalDetails] = useState(interview?.details || []);
    const [hasChanges, setHasChanges] = useState(false);

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

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    
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

            <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <Link href="/admin/interviews">
                        <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Button>
                    </Link>
                    <Link href={`/admin/interviews/${interview?.id}/edit`}>
                        <Button variant="outline" size="sm">Edit Jadwal</Button>
                    </Link>
                </div>

                {/* Header Info */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-sidebar-border shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                            <div>
                                <Badge className="mb-2 bg-indigo-100 text-indigo-700 uppercase">
                                    {interview?.accepting_organization?.type || 'JOB'}
                                </Badge>
                                <h1 className="text-3xl font-bold tracking-tight">{interview?.interviewer_title || 'No Title'}</h1>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 size={16} className="text-blue-500" />
                                    <span className="font-bold text-foreground">{interview?.company?.name || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin size={16} className="text-red-500" />
                                    <span>{interview?.company?.prefecture || 'Japan'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar size={16} className="text-amber-500" />
                                    <span>Wawancara: {formatDateSafe(interview?.interview_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-red-600 font-bold">
                                    <Clock size={16} />
                                    <span>Deadline: {formatDateSafe(interview?.interview_registration_deadline)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="md:w-72 bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl border border-dashed border-neutral-300 flex flex-col items-center justify-center text-center">
                            <FileText className={interview?.kyuujinhyou_yunerva_uuid ? "text-green-600 mb-2" : "text-neutral-300 mb-2"} size={40} />
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-3 text-muted-foreground">Dokumen Kyuujinhyou (PDF)</p>
                            
                            <div className="flex flex-col w-full gap-2">
                                {!isUploading ? (
                                    <>
                                        <label className="w-full cursor-pointer">
                                            <Input type="file" className="hidden" onChange={handleUploadKyuujinhyou} accept="application/pdf" />
                                            <Button variant={interview?.kyuujinhyou_yunerva_uuid ? "outline" : "default"} className="w-full h-9 text-xs font-bold" asChild>
                                                <span><Upload className="mr-2 h-3.5 w-3.5" /> {interview?.kyuujinhyou_yunerva_uuid ? "Ganti PDF" : "Upload PDF"}</span>
                                            </Button>
                                        </label>
                                        {interview?.kyuujinhyou_yunerva_uuid && (
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="h-8 text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" 
                                                    onClick={handlePreview}
                                                    disabled={isLoadingPreview}
                                                >
                                                    {isLoadingPreview ? "LOADING..." : "PREVIEW"}
                                                </Button>
                                                <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold text-green-700" onClick={handleDownload}>
                                                    UNDUH
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full space-y-2 py-1">
                                        <div className="flex justify-between text-[10px] font-bold text-blue-600 italic">
                                            <span>MENGUNGGAH...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assign Panel */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                    <div className="bg-blue-600 p-2.5 rounded-xl text-white">
                        <UserPlus size={20} />
                    </div>
                    <div className="flex-1 w-full relative">
                        <Input 
                            placeholder="Ketik nama siswa untuk menambahkan ke daftar wawancara ini..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white dark:bg-zinc-950 border-blue-200 focus-visible:ring-blue-500"
                        />
                        {filteredStudents.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                {filteredStudents.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => handleAssignStudent(student.id)}
                                        className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center justify-between group transition-colors"
                                    >
                                        <div>
                                            <p className="font-bold text-sm">{student.student_profile?.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{student.email}</p>
                                        </div>
                                        <Badge variant="secondary" className="group-hover:bg-blue-600 group-hover:text-white transition-colors">Assign</Badge>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Tabs defaultValue="candidates" className="w-full">
                    <div className="flex justify-between items-center border-b border-sidebar-border">
                        <TabsList className="bg-transparent w-auto justify-start rounded-none h-auto p-0 gap-8">
                            <TabsTrigger value="candidates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-2 pb-4 font-bold">
                                Daftar Peserta ({localDetails.length})
                            </TabsTrigger>
                            <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-2 pb-4 font-bold">
                                Detail Lowongan
                            </TabsTrigger>
                        </TabsList>
                        
                        {hasChanges && (
                            <Button 
                                onClick={saveNewOrder} 
                                className="mb-2 bg-green-600 hover:bg-green-700 text-white animate-pulse"
                                size="sm"
                            >
                                <Save className="mr-2 h-4 w-4" /> Simpan Urutan Baru
                            </Button>
                        )}
                    </div>

                    <TabsContent value="candidates" className="mt-6">
                        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-sidebar-border overflow-hidden shadow-sm text-sm">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-sidebar-border">
                                    <tr>
                                        <th className="px-6 py-4 w-24 text-center">Urutan</th>
                                        <th className="px-6 py-4">Siswa</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4">Catatan</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border">
                                    <DndContext 
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext 
                                            items={localDetails.map((i:any) => i.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {localDetails.length > 0 ? localDetails.map((detail: any, index: number) => (
                                                <SortableRow 
                                                    key={detail.id} 
                                                    detail={detail} 
                                                    index={index}
                                                    onRemove={handleRemoveStudent}
                                                    onUpdateModal={openUpdateModal}
                                                    interviewId={interview.id} // --- PASS INTERVIEW ID KE ROW ---
                                                />
                                            )) : (
                                                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">Belum ada pendaftar.</td></tr>
                                            )}
                                        </SortableContext>
                                    </DndContext>
                                </tbody>
                            </table>
                        </div>
                        {hasChanges && (
                            <p className="mt-4 text-xs text-amber-600 font-medium flex items-center gap-2">
                                <Info size={14} /> Anda telah merubah urutan. Jangan lupa menekan tombol "Simpan Urutan Baru" di atas.
                            </p>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="details" className="mt-6">
                        <div className="bg-white p-6 rounded-xl border border-sidebar-border whitespace-pre-line text-sm text-muted-foreground">
                            {interview?.description || "Tidak ada deskripsi."}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Modals & Dialogs */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <form onSubmit={handleUpdateResult}>
                        <DialogHeader>
                            <DialogTitle>Hasil Wawancara</DialogTitle>
                            <p className="text-sm text-muted-foreground">Siswa: {selectedCandidate?.user?.student_profile?.full_name}</p>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <Select value={data.result} onValueChange={(v) => setData('result', v)}>
                                <SelectTrigger className="h-11 border-2">
                                    <SelectValue placeholder="Pilih Hasil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="waiting">Menunggu (Waiting)</SelectItem>
                                    <SelectItem value="passed">LULUS (Passed)</SelectItem>
                                    <SelectItem value="failed">GAGAL (Failed)</SelectItem>
                                    <SelectItem value="reserved">CADANGAN (Reserved)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea 
                                value={data.remarks} 
                                onChange={(e) => setData('remarks', e.target.value)} 
                                placeholder="Tulis catatan evaluasi..." 
                                rows={4} 
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing} className="bg-blue-600 text-white w-full h-11 font-bold">Simpan Keputusan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden bg-zinc-900 border-none shadow-2xl">
                    <DialogHeader className="p-4 bg-white dark:bg-zinc-950 border-b flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <FileText size={18} />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold">Preview Kyuujinhyou</DialogTitle>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{interview?.interviewer_title}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 pr-8">
                            <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, '_blank')} className="h-8 text-xs font-bold">
                                <ExternalLink className="mr-2 h-3 w-3" /> Buka Tab Baru
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 h-full w-full bg-zinc-800 relative">
                        {previewUrl ? (
                            <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-[calc(90vh-65px)] border-none" title="Kyuujinhyou PDF" />
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