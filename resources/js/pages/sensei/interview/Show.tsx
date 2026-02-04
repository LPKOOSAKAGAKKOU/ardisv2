import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    FileText, Users, CheckCircle, Clock, Building2, MapPin, 
    ArrowLeft, Eye, UserPlus, Trash2, GripVertical, Save,
    FileSpreadsheet, MoreVertical, Loader2, ExternalLink
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import axios from 'axios';
import { format, isValid } from 'date-fns';
import { route } from 'ziggy-js';

// --- DND-KIT (Untuk Reorder) ---
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

// --- SORTABLE ROW COMPONENT ---
function SortableRow({ detail, index, onRemove, interviewId }: any) {
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
                    {/* Handle Drag */}
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-blue-600 transition-colors">
                        <GripVertical size={16} />
                    </button>
                    <span className="text-xs font-mono font-bold text-neutral-500">{index + 1}</span>
                </div>
            </td>

            <td className="px-4 py-4 min-w-[200px]">
                <div className="flex items-center gap-2">
                    <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {detail.user?.student_profile?.full_name || 'No Name'}
                    </div>
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
                    {/* Link CV Generator */}
                    <a href={route('cv.generate', { userId: detail.user_id, interviewId: interviewId })} target="_blank">
                        <Button variant="outline" size="sm" className="h-8 border-emerald-600 text-emerald-600 hover:bg-emerald-50 gap-1.5">
                            <FileSpreadsheet size={14} /> CV
                        </Button>
                    </a>
                    
                    {/* Link Profil Siswa */}
                    <Link href={`/sensei/students/${detail.user?.student_profile?.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-blue-600 font-bold">Profil</Button>
                    </Link>

                    {/* Tombol Hapus */}
                    <Button onClick={() => onRemove(detail.id)} variant="ghost" size="sm" className="h-8 text-neutral-300 hover:text-rose-600">
                        <Trash2 size={16} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}

// --- MAIN COMPONENT ---
export default function InterviewShow({ interview, availableStudents = [] }: Props) {
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    
    // State untuk List Peserta (Local state untuk drag & drop)
    const [localDetails, setLocalDetails] = useState<any[]>(interview?.details || []);
    const [hasChanges, setHasChanges] = useState(false); // Deteksi perubahan urutan
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    
    // -- INIT LOCAL STATE (Sorting awal berdasarkan order_number) --
    useEffect(() => {
        setLocalDetails(interview?.details?.sort((a: any, b: any) => a.order_number - b.order_number) || []);
        setHasChanges(false);
    }, [interview.details]);

    // -- DND SENSORS --
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // -- HANDLER DRAG END (REORDER LOGIC) --
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLocalDetails((items: any[]) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newArray = arrayMove(items, oldIndex, newIndex);
                setHasChanges(true); // Aktifkan tombol simpan
                return newArray;
            });
        }
    };

    // -- SAVE ORDER TO BACKEND --
// -- SAVE ORDER TO BACKEND --
    const saveNewOrder = () => {
        // PERBAIKAN: Tambahkan ': any' setelah 'item'
        const orders = localDetails.map((item: any, index: number) => ({
            id: item.id,
            order_number: index + 1
        }));

        router.patch(route('sensei.interviews.batch-reorder', interview.id), { orders }, {
            preserveScroll: true,
            onSuccess: () => setHasChanges(false) 
        });
    };  

    // -- SEARCH SISWA LOGIC --
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

    // -- ASSIGN SISWA --
    const handleAssignStudent = (userId: number) => {
        router.post(route('sensei.interviews.assign', interview.id), { user_id: userId }, {
            preserveScroll: true,
            onSuccess: () => setSearchQuery('')
        });
    };

    // -- REMOVE SISWA --
    const handleRemoveStudent = (detailId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus siswa ini dari daftar wawancara?')) {
            router.delete(route('sensei.interviews.remove-student', detailId), { preserveScroll: true });
        }
    };

    const formatDateSafe = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isValid(date) ? format(date, 'PPP') : '-';
    };

    const breadcrumbs = [
        { title: 'Data Wawancara', href: '/sensei/interviews' },
        { title: 'Detail', href: '#' },
    ];

    // -- PREVIEW KYUUJINHYOU --
    const handlePreview = async () => {
        setIsLoadingPreview(true);
        try {
            const response = await axios.post(route('sensei.interviews.preview-kyuujinhyou', interview.id));
            if (response.data.status === 'success' && response.data.view_url) {
                setPreviewUrl(response.data.view_url);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail - ${interview?.interviewer_title || 'Wawancara'}`} />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 w-full overflow-x-hidden overflow-y-auto">
                
                <div className="flex items-center justify-between">
                    <Link href="/sensei/interviews">
                        <Button variant="ghost" size="sm" className="-ml-2">
                            <ArrowLeft className="mr-2 h-4 w-4" /> 
                            <span className="hidden sm:inline">Kembali</span>
                        </Button>
                    </Link>
                </div>

                {/* HEADER INFO WAWANCARA */}
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
                                    <Clock size={16} className="text-amber-500 flex-shrink-0" />
                                    <span>{formatDateSafe(interview?.interview_date)}</span>
                                </div>
                            </div>
                        </div>

                        {/* PANEL KANAN: KYUUJINHYOU */}
                        <div className="bg-neutral-50/50 dark:bg-zinc-900/30 p-6 lg:w-80 flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-3 lg:flex-col lg:text-center">
                                <FileText className={interview?.kyuujinhyou_yunerva_uuid ? "text-green-600" : "text-muted-foreground"} size={32} />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider">Kyuujinhyou</p>
                                    <p className="text-[10px] text-muted-foreground">PDF Document</p>
                                </div>
                            </div>
                            
                            {interview?.kyuujinhyou_yunerva_uuid ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold" onClick={handlePreview} disabled={isLoadingPreview}>
                                        {isLoadingPreview ? <Loader2 className="animate-spin h-3 w-3" /> : "PREVIEW"}
                                    </Button>
                                    <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold text-green-700" onClick={handleDownload}>
                                        UNDUH
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center text-xs text-muted-foreground italic">Belum tersedia</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SEARCH & ADD STUDENT */}
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

                {/* TABS UTAMA */}
                <Tabs defaultValue="candidates" className="w-full flex flex-col">
                    <div className="flex items-center justify-between border-b border-sidebar-border/70 mb-4">
                        <TabsList className="bg-transparent w-full justify-start rounded-none h-auto p-0 border-b border-sidebar-border/50 gap-4 sm:gap-6">
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
                        </TabsList>

                        {/* TOMBOL SIMPAN URUTAN (Hanya muncul jika ada perubahan drag-drop) */}
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

                    {/* CONTENT 1: DAFTAR PESERTA (DRAGGABLE) */}
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
                                                    interviewId={interview.id}
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
                    
                    {/* CONTENT 2: DESKRIPSI */}
                    <TabsContent value="details" className="m-0">
                        <div className="rounded-xl border border-sidebar-border/70 bg-white dark:bg-zinc-950 p-6 text-sm leading-relaxed whitespace-pre-line">
                            {interview?.description || "Tidak ada deskripsi."}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* FLOATING ACTION BUTTON (Jika scroll jauh) */}
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

            {/* PREVIEW MODAL */}
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
        </AppLayout>
    );
}