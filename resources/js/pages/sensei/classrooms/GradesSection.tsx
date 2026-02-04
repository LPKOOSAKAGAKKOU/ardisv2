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
    BookOpen, 
    Edit, 
    Loader2, 
    Plus, 
    Save, 
    Trash2,
    AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { route } from 'ziggy-js'
import axios from 'axios'

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
}

interface Assignment {
    type: string
    title: string
    avg: number
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
    
    // State Modal Edit
    const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null)

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

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="summary" className="gap-2"><BarChart3 size={16}/> Rekap Nilai</TabsTrigger>
                        <TabsTrigger value="input" className="gap-2"><Plus size={16}/> Input Nilai Baru</TabsTrigger>
                    </TabsList>
                    
                    {activeTab === 'summary' && (
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
                            {isLoading ? <Loader2 className="size-3 animate-spin mr-2"/> : null}
                            Refresh Data
                        </Button>
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
                                        {assignments.length > 0 ? assignments.map((assign, idx) => (
                                            <TableHead key={idx} className="text-center min-w-[100px] border-l">
                                                <div className="flex flex-col items-center py-2">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{assign.type}</span>
                                                    <span className="text-xs font-semibold text-foreground">{assign.title}</span>
                                                    <Badge variant="secondary" className="mt-1 text-[9px] h-4 px-1">Avg: {assign.avg}</Badge>
                                                </div>
                                            </TableHead>
                                        )) : (
                                            <TableHead className="text-center italic text-muted-foreground">Belum ada tugas</TableHead>
                                        )}
                                        {assignments.length > 0 && <TableHead className="text-center font-bold border-l bg-neutral-50 sticky right-0 dark:bg-zinc-900">Total Avg</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classroom.students.map((student) => {
                                        // Filter nilai siswa ini
                                        const studentGrades = grades.filter(g => g.student_profile_id === student.id)
                                        const totalScore = studentGrades.reduce((sum, g) => sum + g.score, 0)
                                        const avgScore = studentGrades.length > 0 ? (totalScore / studentGrades.length).toFixed(1) : '-'

                                        return (
                                            <TableRow key={student.id} className="hover:bg-neutral-50/50">
                                                <TableCell className="font-medium sticky left-0 bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:bg-zinc-950 dark:border-zinc-800">
                                                    <div className="flex flex-col">
                                                        <span>{student.full_name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{student.nik}</span>
                                                    </div>
                                                </TableCell>
                                                
                                                {assignments.length > 0 ? assignments.map((assign, idx) => {
                                                    const grade = studentGrades.find(g => g.type === assign.type && g.title === assign.title)
                                                    return (
                                                        <TableCell key={idx} className="text-center border-l p-2 dark:border-zinc-800">
                                                            {grade ? (
                                                                <button 
                                                                    onClick={() => setEditingGrade(grade)}
                                                                    className="w-full h-full flex justify-center items-center hover:bg-neutral-100 rounded p-1 transition-colors"
                                                                    title="Klik untuk edit / remedial"
                                                                >
                                                                    <GradeBadge score={grade.score} isRemedial={grade.is_remedial} original={grade.original_score} />
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">-</span>
                                                            )}
                                                        </TableCell>
                                                    )
                                                }) : (
                                                    <TableCell className="text-center text-muted-foreground">-</TableCell>
                                                )}

                                                {assignments.length > 0 && (
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

            {/* MODAL EDIT NILAI */}
            <EditGradeModal 
                grade={editingGrade} 
                open={!!editingGrade} 
                setOpen={(val) => !val && setEditingGrade(null)} 
                classroomId={classroom.id}
                onSuccess={() => {
                    fetchData()
                    setEditingGrade(null)
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
        
        // Convert object scores to array
        const scoresArray = Object.keys(data.scores).map(studentId => {
            const val = data.scores[parseInt(studentId)];
            // Jika kosong, isi 0 (sesuai request) atau skip. Disini kita isi 0 agar tersimpan.
            return {
                student_id: parseInt(studentId),
                score: val === '' ? 0 : parseInt(val)
            }
        })

        // Gunakan endpoint BATCH baru
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
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bunpo">Bunpo (Tata Bahasa)</SelectItem>
                                    <SelectItem value="Kanji">Kanji</SelectItem>
                                    <SelectItem value="Choukai">Choukai (Mendengar)</SelectItem>
                                    <SelectItem value="Kaiwa">Kaiwa (Percakapan)</SelectItem>
                                    <SelectItem value="Harian">Tugas Harian</SelectItem>
                                    <SelectItem value="Ujian">Ujian Akhir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Judul / Bab</Label>
                            <Input 
                                placeholder="Contoh: Bab 1-5, Quiz 1" 
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                            />
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
                                            <Input 
                                                type="number" 
                                                min="0" 
                                                max="100"
                                                className="h-8"
                                                placeholder="0"
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
function EditGradeModal({ grade, open, setOpen, classroomId, onSuccess }: any) {
    const { data, setData, put, processing, reset } = useForm({
        score: '',
        feedback: '',
        is_remedial: false
    })

    // Populate data saat modal dibuka
    useEffect(() => {
        if (grade) {
            setData({
                score: String(grade.score),
                feedback: grade.feedback || '',
                is_remedial: grade.is_remedial || false
            })
        }
    }, [grade])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!grade) return

        put(route('sensei.classrooms.grades.update', [classroomId, grade.id]), {
            onSuccess: () => {
                setOpen(false)
                onSuccess()
            }
        })
    }

    if (!grade) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Nilai: {grade.title}</DialogTitle>
                    <DialogDescription>
                        Ubah nilai atau tandai sebagai remedial.
                        {grade.is_remedial && <span className="block text-amber-600 mt-1 font-bold">Status: Remedial (Asli: {grade.original_score})</span>}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nilai Baru</Label>
                        <Input 
                            type="number" min="0" max="100" 
                            value={data.score} 
                            onChange={e => setData('score', e.target.value)} 
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="remedial" 
                            checked={data.is_remedial}
                            onCheckedChange={(checked) => setData('is_remedial', checked as boolean)}
                        />
                        <Label htmlFor="remedial" className="text-sm font-normal cursor-pointer">
                            Ini adalah nilai Remedial?
                        </Label>
                    </div>
                    <div className="space-y-2">
                        <Label>Catatan / Feedback</Label>
                        <Input 
                            value={data.feedback} 
                            onChange={e => setData('feedback', e.target.value)} 
                            placeholder="Opsional..."
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={processing}>Simpan Perubahan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// --- UTILS ---
function GradeBadge({ score, isRemedial, original }: { score: number, isRemedial?: boolean, original?: number }) {
    let color = "bg-red-100 text-red-700"
    if (score >= 90) color = "bg-green-100 text-green-700"
    else if (score >= 75) color = "bg-blue-100 text-blue-700"
    else if (score >= 60) color = "bg-yellow-100 text-yellow-700"

    // Jika remedial, warna kuning oranye biar mencolok
    if (isRemedial) color = "bg-amber-100 text-amber-700 border-amber-300 border"

    return (
        <div className="flex flex-col items-center">
            <Badge className={`${color} hover:${color} shadow-none cursor-pointer w-10 justify-center`}>
                {score}
            </Badge>
            {isRemedial && original !== undefined && (
                <span className="text-[9px] text-muted-foreground line-through mt-0.5">{original}</span>
            )}
        </div>
    )
}