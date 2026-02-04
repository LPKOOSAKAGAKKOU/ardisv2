import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useForm, router } from '@inertiajs/react'
import { 
    BarChart3, 
    BookOpen, 
    Edit, 
    Loader2, 
    Plus, 
    Save, 
    Trash2 
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { route } from 'ziggy-js'
import axios from 'axios'

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
    feedback: string | null
}

interface Assignment {
    type: string
    title: string
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
                                        <TableHead className="w-[200px] font-bold sticky left-0 bg-neutral-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Siswa</TableHead>
                                        {assignments.length > 0 ? assignments.map((assign, idx) => (
                                            <TableHead key={idx} className="text-center min-w-[100px] border-l">
                                                <div className="flex flex-col items-center py-2">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{assign.type}</span>
                                                    <span className="text-xs font-semibold text-foreground">{assign.title}</span>
                                                </div>
                                            </TableHead>
                                        )) : (
                                            <TableHead className="text-center italic text-muted-foreground">Belum ada tugas</TableHead>
                                        )}
                                        {assignments.length > 0 && <TableHead className="text-center font-bold border-l bg-neutral-50 sticky right-0">Rata-rata</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classroom.students.map((student) => {
                                        // Hitung rata-rata siswa ini
                                        const studentGrades = grades.filter(g => g.student_profile_id === student.id)
                                        const totalScore = studentGrades.reduce((sum, g) => sum + g.score, 0)
                                        const avgScore = studentGrades.length > 0 ? (totalScore / studentGrades.length).toFixed(1) : '-'

                                        return (
                                            <TableRow key={student.id} className="hover:bg-neutral-50/50">
                                                <TableCell className="font-medium sticky left-0 bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:bg-zinc-950">
                                                    <div className="flex flex-col">
                                                        <span>{student.full_name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{student.nik}</span>
                                                    </div>
                                                </TableCell>
                                                
                                                {assignments.length > 0 ? assignments.map((assign, idx) => {
                                                    const grade = studentGrades.find(g => g.type === assign.type && g.title === assign.title)
                                                    return (
                                                        <TableCell key={idx} className="text-center border-l p-2">
                                                            {grade ? (
                                                                <GradeBadge score={grade.score} />
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                    )
                                                }) : (
                                                    <TableCell className="text-center text-muted-foreground">-</TableCell>
                                                )}

                                                {assignments.length > 0 && (
                                                    <TableCell className="text-center font-bold border-l bg-neutral-50 sticky right-0 dark:bg-zinc-900">
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
        </div>
    )
}

// --- SUB COMPONENT: FORM INPUT ---
function InputGradeForm({ classroom, onSuccess }: { classroom: Props['classroom'], onSuccess: () => void }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        type: '',
        title: '',
        // Format: { studentId: score }
        scores: {} as Record<number, string>, 
    })

    // Init scores state kosong
    useEffect(() => {
        const initialScores: any = {}
        classroom.students.forEach(s => initialScores[s.id] = '')
        setData('scores', initialScores)
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        // Karena endpoint storeGrade di controller Anda didesain untuk SINGLE student,
        // Kita harus modifikasi controller agar bisa terima BATCH insert (seperti absen),
        // ATAU kita loop request di frontend (tapi ini kurang efisien).
        
        // SEMENTARA: Agar sesuai dengan Controller `storeGrade` yang ada (Single Entry), 
        // kita akan buat request berulang. 
        // IDEALNYA: Anda buat method `storeGradeBatch` di controller.
        
        // Mari kita asumsikan kita pakai metode loop axios manual disini untuk kompatibilitas controller yg ada
        // Tapi cara terbaik adalah update controller.
        
        // UPDATE CONTROLLER DISARANKAN:
        // public function storeBatchGrades(Request $request) { ... loop insert ... }

        // Disini saya akan gunakan approach "Kirim Array" dan kita ubah sedikit controller agar support array.
        // Jika tidak diubah, loop axios akan sangat lambat.
        
        // Mari kita kirim data dalam format yang bisa ditangkap controller jika dimodifikasi sedikit:
        // Kita post ke endpoint baru / batch endpoint.
        
        // Tapi karena instruksi "tanpa ubah logic lama", mari kita coba kirim satu per satu
        // menggunakan Promise.all. Ini solusi frontend tanpa sentuh backend.
        
        const promises = classroom.students.map(student => {
            const scoreVal = data.scores[student.id]
            if (scoreVal === '' || scoreVal === undefined) return null // Skip kosong

            return axios.post(route('sensei.classrooms.grades.store', classroom.id), {
                student_id: student.id,
                type: data.type,
                title: data.title,
                score: parseInt(scoreVal),
                feedback: ''
            })
        })

        // Filter null promises
        const validPromises = promises.filter(p => p !== null)

        if (validPromises.length === 0) {
            alert("Isi minimal satu nilai siswa.")
            return
        }

        // Execute all
        Promise.all(validPromises)
            .then(() => {
                reset()
                onSuccess()
                // alert("Semua nilai berhasil disimpan.")
            })
            .catch(err => {
                console.error(err)
                alert("Terjadi kesalahan saat menyimpan sebagian nilai.")
            })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Input Nilai Tugas / Ujian</CardTitle>
                <CardDescription>Masukkan detail tugas, lalu input nilai untuk setiap siswa.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header Tugas */}
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

                    <div className="border rounded-md">
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

// --- UTILS ---
function GradeBadge({ score }: { score: number }) {
    let color = "bg-red-100 text-red-700"
    if (score >= 90) color = "bg-green-100 text-green-700"
    else if (score >= 75) color = "bg-blue-100 text-blue-700"
    else if (score >= 60) color = "bg-yellow-100 text-yellow-700"

    return (
        <Badge className={`${color} hover:${color} border-none shadow-none`}>
            {score}
        </Badge>
    )
}