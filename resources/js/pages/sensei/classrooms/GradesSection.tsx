import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useForm, router } from '@inertiajs/react'
import { 
    BarChart3, 
    Plus, 
    Save, 
    Loader2, 
    Filter,
    ChevronLeft,
    ChevronRight,
    Calendar
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { route } from 'ziggy-js'
import axios from 'axios'
import { 
    format, 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    isWithinInterval, 
    parseISO,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// --- TYPES ---
interface Student {
    id: number
    nik: string
    full_name: string
}

interface GradeRecord {
    id: number
    student_profile_id: number
    type: string
    title: string
    score: number
    original_score?: number
    is_remedial?: boolean
    feedback: string | null
    created_at: string
}

interface Assignment {
    type: string
    title: string
    avg: number
    date?: string // Tanggal tugas dibuat (ambil dari created_at record pertama)
}

interface Props {
    classroom: {
        id: number
        students: Student[]
    }
}

export default function GradesSection({ classroom }: Props) {
    const [activeTab, setActiveTab] = useState('summary')
    const [isLoading, setIsLoading] = useState(false)
    const [grades, setGrades] = useState<GradeRecord[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    
    // Filter State
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week' | 'day'>('all')
    const [currentDate, setCurrentDate] = useState(new Date()) // Tanggal aktif navigasi
    const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])

    // State Modal Edit / Create Single
    const [editingCell, setEditingCell] = useState<{
        grade?: GradeRecord, 
        studentId?: number, 
        type?: string,
        title?: string
    } | null>(null)

    // Fetch Data Nilai
    const fetchData = async () => {
        setIsLoading(true)
        try {
            const res = await axios.get(route('sensei.classrooms.grades.data', classroom.id))
            setGrades(res.data.grades)
            setAssignments(res.data.assignments)
        } catch (error) {
            console.error("Gagal load nilai:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [classroom.id])

    // --- NAVIGASI TANGGAL ---
    const handlePrev = () => {
        if (timeFilter === 'month') setCurrentDate(d => subMonths(d, 1))
        else if (timeFilter === 'week') setCurrentDate(d => subWeeks(d, 1))
        else if (timeFilter === 'day') setCurrentDate(d => subDays(d, 1))
    }

    const handleNext = () => {
        if (timeFilter === 'month') setCurrentDate(d => addMonths(d, 1))
        else if (timeFilter === 'week') setCurrentDate(d => addWeeks(d, 1))
        else if (timeFilter === 'day') setCurrentDate(d => addDays(d, 1))
    }

    // Label Navigasi
    const getDateLabel = () => {
        if (timeFilter === 'all') return 'Semua Periode'
        if (timeFilter === 'month') return format(currentDate, 'MMMM yyyy', { locale: idLocale })
        if (timeFilter === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 })
            const end = endOfWeek(currentDate, { weekStartsOn: 1 })
            return `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}`
        }
        return format(currentDate, 'EEEE, d MMM yyyy', { locale: idLocale })
    }

    // Logic Filtering
    useEffect(() => {
        if (timeFilter === 'all') {
            setFilteredAssignments(assignments)
            return
        }

        let start: Date, end: Date

        if (timeFilter === 'day') {
            start = currentDate; end = currentDate; 
        } else if (timeFilter === 'week') {
            start = startOfWeek(currentDate, { weekStartsOn: 1 }); end = endOfWeek(currentDate, { weekStartsOn: 1 })
        } else {
            // Default month
            start = startOfMonth(currentDate); end = endOfMonth(currentDate)
        }

        // Filter assignment berdasarkan tanggal created_at tugas tersebut
        // Asumsi: Backend perlu kirim created_at di objek assignment atau kita cek salah satu grade-nya
        // Karena di controller sebelumnya kita grouping, kita perlu pastikan `date` ada di assignment object frontend.
        // *Workaround*: Kita cari grade pertama yg match title & type, lalu ambil tanggalnya.
        
        const filtered = assignments.filter(a => {
            // Cari sampel grade untuk tugas ini untuk tau tanggalnya
            const sampleGrade = grades.find(g => g.type === a.type && g.title === a.title)
            if (!sampleGrade) return false // Harusnya gak mungkin

            const assignDate = parseISO(sampleGrade.created_at)
            
            if (timeFilter === 'day') {
                return format(assignDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
            }
            return isWithinInterval(assignDate, { start, end })
        })
        setFilteredAssignments(filtered)

    }, [assignments, timeFilter, currentDate, grades])

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="summary" className="gap-2"><BarChart3 size={16}/> Rekap Nilai</TabsTrigger>
                        <TabsTrigger value="input" className="gap-2"><Plus size={16}/> Input Nilai Baru</TabsTrigger>
                    </TabsList>
                    
                    {activeTab === 'summary' && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                            {/* Filter Control */}
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 border rounded-md p-1 w-full sm:w-auto justify-between">
                                {/* Dropdown Tipe Waktu */}
                                <div className="flex items-center">
                                    <Filter size={14} className="ml-2 text-muted-foreground mr-2" />
                                    <Select value={timeFilter} onValueChange={(val: any) => setTimeFilter(val)}>
                                        <SelectTrigger className="h-7 border-none shadow-none focus:ring-0 w-[110px] text-xs px-0">
                                            <SelectValue placeholder="Pilih Waktu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="month">Bulanan</SelectItem>
                                            <SelectItem value="week">Mingguan</SelectItem>
                                            <SelectItem value="day">Harian</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Navigasi Kiri Kanan (Hanya Muncul jika bukan 'all') */}
                                {timeFilter !== 'all' && (
                                    <div className="flex items-center gap-2 border-l pl-2 ml-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePrev}>
                                            <ChevronLeft size={14} />
                                        </Button>
                                        <span className="text-xs font-medium w-[140px] text-center truncate">
                                            {getDateLabel()}
                                        </span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNext}>
                                            <ChevronRight size={14} />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading ? <Loader2 className="size-3 animate-spin mr-2"/> : null}
                                Refresh
                            </Button>
                        </div>
                    )}
                </div>

                {/* TAB 1: REKAP MATRIKS NILAI */}
                <TabsContent value="summary" className="mt-0">
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-950">
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-neutral-50 dark:bg-zinc-900">
                                    <TableRow>
                                        <TableHead className="w-[200px] font-bold sticky left-0 bg-neutral-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:bg-zinc-900">Nama Siswa</TableHead>
                                        {filteredAssignments.length > 0 ? filteredAssignments.map((assign, idx) => (
                                            <TableHead key={idx} className="text-center min-w-[120px] border-l">
                                                <div className="flex flex-col items-center py-2">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{assign.type}</span>
                                                    <span className="text-xs font-semibold text-foreground truncate max-w-[100px]" title={assign.title}>{assign.title}</span>
                                                    <Badge variant="secondary" className="mt-1 text-[9px] h-4 px-1">Avg: {assign.avg}</Badge>
                                                </div>
                                            </TableHead>
                                        )) : (
                                            <TableHead className="text-center italic text-muted-foreground p-8 min-w-[300px]">
                                                {timeFilter === 'all' ? 'Belum ada tugas.' : 'Tidak ada tugas pada periode ini.'}
                                            </TableHead>
                                        )}
                                        {filteredAssignments.length > 0 && <TableHead className="text-center font-bold border-l bg-neutral-50 sticky right-0 dark:bg-zinc-900">Total Avg</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classroom.students.map((student) => {
                                        const studentGrades = grades.filter(g => g.student_profile_id === student.id)
                                        const relevantGrades = studentGrades.filter(g => 
                                            filteredAssignments.some(a => a.type === g.type && a.title === g.title)
                                        )
                                        const totalScore = relevantGrades.reduce((sum, g) => sum + g.score, 0)
                                        const avgScore = relevantGrades.length > 0 ? (totalScore / relevantGrades.length).toFixed(1) : '-'

                                        return (
                                            <TableRow key={student.id} className="hover:bg-neutral-50/50">
                                                <TableCell className="font-medium sticky left-0 bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:bg-zinc-950 dark:border-zinc-800">
                                                    <div className="flex flex-col">
                                                        <span>{student.full_name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{student.nik}</span>
                                                    </div>
                                                </TableCell>
                                                
                                                {filteredAssignments.length > 0 ? filteredAssignments.map((assign, idx) => {
                                                    const grade = studentGrades.find(g => g.type === assign.type && g.title === assign.title)
                                                    return (
                                                        <TableCell key={idx} className="text-center border-l p-1 dark:border-zinc-800 relative group">
                                                            <button 
                                                                onClick={() => setEditingCell({ 
                                                                    grade, 
                                                                    studentId: student.id, 
                                                                    type: assign.type, 
                                                                    title: assign.title 
                                                                })}
                                                                className="w-full h-10 flex justify-center items-center hover:bg-neutral-100 rounded transition-colors"
                                                                title={grade ? "Klik untuk edit/remedial" : "Klik untuk input nilai susulan"}
                                                            >
                                                                {grade ? (
                                                                    <GradeBadge score={grade.score} isRemedial={grade.is_remedial} original={grade.original_score} />
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs opacity-20 group-hover:opacity-100 group-hover:text-blue-500 font-bold">+</span>
                                                                )}
                                                            </button>
                                                        </TableCell>
                                                    )
                                                }) : (
                                                    <TableCell className="text-center text-muted-foreground">-</TableCell>
                                                )}

                                                {filteredAssignments.length > 0 && (
                                                    <TableCell className="text-center font-bold border-l bg-neutral-50 sticky right-0 dark:bg-zinc-900 dark:border-zinc-800">
                                                        {avgScore}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: INPUT NILAI BARU */}
                <TabsContent value="input" className="mt-0">
                    <InputGradeForm 
                        classroom={classroom} 
                        onSuccess={() => {
                            fetchData()
                            setActiveTab('summary')
                        }} 
                    />
                </TabsContent>
            </Tabs>

            {/* MODAL EDIT NILAI (REMEDIAL / SUSULAN) */}
            <EditGradeModal 
                cellData={editingCell} 
                open={!!editingCell} 
                setOpen={(val) => !val && setEditingCell(null)} 
                classroomId={classroom.id}
                onSuccess={() => {
                    fetchData()
                    setEditingCell(null)
                }}
            />
        </div>
    )
}

// --- SUB COMPONENT: FORM INPUT (BATCH) ---
function InputGradeForm({ classroom, onSuccess }: { classroom: Props['classroom'], onSuccess: () => void }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        type: '',
        title: '',
        scores: {} as Record<number, string>, 
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const scoresArray = Object.keys(data.scores).map(studentId => {
            const val = data.scores[parseInt(studentId)];
            return {
                student_id: parseInt(studentId),
                score: val === '' ? 0 : parseInt(val)
            }
        })

        router.post(route('sensei.classrooms.grades.batch', classroom.id), {
            type: data.type,
            title: data.title,
            scores: scoresArray
        }, {
            onSuccess: () => {
                reset()
                onSuccess()
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Input Nilai Tugas / Ujian (Batch)</CardTitle>
                <CardDescription>Masukkan detail tugas, lalu input nilai untuk setiap siswa sekaligus.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Kategori Tugas</Label>
                            <Select onValueChange={(val) => setData('type', val)} value={data.type}>
                                <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bunpo">Bunpo</SelectItem>
                                    <SelectItem value="Kanji">Kanji</SelectItem>
                                    <SelectItem value="Choukai">Choukai</SelectItem>
                                    <SelectItem value="Kaiwa">Kaiwa</SelectItem>
                                    <SelectItem value="Harian">Tugas Harian</SelectItem>
                                    <SelectItem value="Ujian">Ujian Akhir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Judul / Bab</Label>
                            <Input placeholder="Contoh: Bab 1-5" value={data.title} onChange={e => setData('title', e.target.value)} />
                        </div>
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Siswa</TableHead>
                                    <TableHead className="w-[150px]">Nilai (0-100)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classroom.students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell className="py-2">
                                            <p className="font-medium">{student.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{student.nik}</p>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <Input type="number" min="0" max="100" className="h-8" placeholder="0" 
                                                value={data.scores[student.id] || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    setData('scores', { ...data.scores, [student.id]: val })
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={!data.type || !data.title || processing} className="bg-neutral-900 text-white">
                            <Save className="mr-2 size-4" /> Simpan Semua Nilai
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

// --- SUB COMPONENT: MODAL EDIT NILAI ---
function EditGradeModal({ cellData, open, setOpen, classroomId, onSuccess }: any) {
    const isNewEntry = !cellData?.grade; 
    const { data, setData, put, post, processing, reset } = useForm({
        score: '',
        feedback: '',
        is_remedial: false,
        student_id: '', type: '', title: ''
    })

    useEffect(() => {
        if (open && cellData) {
            if (cellData.grade) {
                setData({
                    score: String(cellData.grade.score),
                    feedback: cellData.grade.feedback || '',
                    is_remedial: cellData.grade.is_remedial || false,
                    student_id: '', type: '', title: '' 
                })
            } else {
                setData({
                    score: '',
                    feedback: '',
                    is_remedial: false,
                    student_id: String(cellData.studentId),
                    type: cellData.type,
                    title: cellData.title
                })
            }
        }
    }, [cellData, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isNewEntry) {
            router.post(route('sensei.classrooms.grades.batch', classroomId), {
                type: data.type, title: data.title,
                scores: [{ student_id: parseInt(data.student_id), score: parseInt(data.score) }]
            }, { onSuccess: () => { setOpen(false); onSuccess(); } })
        } else {
            router.put(route('sensei.classrooms.grades.update', [classroomId, cellData.grade.id]), {
                score: parseInt(data.score), feedback: data.feedback, is_remedial: data.is_remedial
            }, { onSuccess: () => { setOpen(false); onSuccess(); } })
        }
    }

    if (!cellData) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isNewEntry ? 'Input Nilai Susulan' : `Edit Nilai: ${cellData.grade.title}`}</DialogTitle>
                    <DialogDescription>
                        {isNewEntry ? `Masukkan nilai susulan untuk tugas ${cellData.type}.` : 'Ubah nilai atau tandai sebagai remedial.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nilai {isNewEntry ? '' : 'Baru'}</Label>
                        <Input type="number" min="0" max="100" value={data.score} onChange={e => setData('score', e.target.value)} autoFocus />
                    </div>
                    {!isNewEntry && (
                        <div className="flex items-center space-x-2 bg-neutral-50 p-2 rounded border">
                            <Checkbox id="remedial" checked={data.is_remedial} onCheckedChange={(checked) => setData('is_remedial', checked as boolean)} />
                            <Label htmlFor="remedial" className="text-sm font-normal cursor-pointer flex-1">
                                Tandai Remedial? <span className="block text-[10px] text-muted-foreground">Nilai lama ({cellData.grade.score}) disimpan history.</span>
                            </Label>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Catatan</Label>
                        <Input value={data.feedback} onChange={e => setData('feedback', e.target.value)} placeholder="Opsional..." />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={processing}>Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function GradeBadge({ score, isRemedial, original }: { score: number, isRemedial?: boolean, original?: number }) {
    let color = "bg-red-100 text-red-700"
    if (score >= 90) color = "bg-green-100 text-green-700"
    else if (score >= 75) color = "bg-blue-100 text-blue-700"
    else if (score >= 60) color = "bg-yellow-100 text-yellow-700"
    if (isRemedial) color = "bg-amber-100 text-amber-700 border-amber-300 border"

    return (
        <div className="flex flex-col items-center">
            <Badge className={`${color} hover:${color} shadow-none cursor-pointer w-10 justify-center`}>{score}</Badge>
            {isRemedial && original !== undefined && <span className="text-[9px] text-muted-foreground line-through mt-0.5">{original}</span>}
        </div>
    )
}