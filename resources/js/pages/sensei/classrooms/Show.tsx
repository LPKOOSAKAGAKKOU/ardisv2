import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'
import { Head, useForm, router } from '@inertiajs/react'
import { 
    BookOpen, 
    CalendarCheck, 
    ChevronLeft, 
    MoreHorizontal, 
    Plus, 
    UserMinus, 
    Users 
} from 'lucide-react'
import { useState } from 'react'
import { route } from 'ziggy-js'

// --- TIPE DATA ---
interface Student {
    id: number
    nik: string
    name: string // Ingat di model StudentProfile namanya 'full_name' atau 'name'? sesuaikan
    gender: string
}

interface Classroom {
    id: number
    name: string
    level: string
    status: string
    students: Student[]
}

interface Props {
    classroom: Classroom
    availableStudents: Student[]
}

export default function ClassroomShow({ classroom, availableStudents }: Props) {
    const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'grades'>('students')
    
    // State Modal
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
    const [studentToRemove, setStudentToRemove] = useState<Student | null>(null)

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('sensei.dashboard') },
        { title: 'Manajemen Kelas', href: route('sensei.classrooms.index') },
        { title: classroom.name, href: '#' },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Kelas ${classroom.name}`} />

            <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full">
                
                {/* 1. HEADER KELAS */}
                <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8" onClick={() => window.history.back()}>
                                <ChevronLeft className="size-5" />
                            </Button>
                            <h1 className="text-2xl font-bold tracking-tight">{classroom.name}</h1>
                            <Badge variant="outline" className="bg-neutral-100">{classroom.level}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                            Status: {classroom.status === 'active' ? 'Aktif Berjalan' : 'Selesai'} • {classroom.students.length} Siswa Terdaftar
                        </p>
                    </div>
                </div>

                {/* 2. TABS NAVIGATION */}
                <div className="flex w-full items-center rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
                    <TabButton 
                        active={activeTab === 'students'} 
                        onClick={() => setActiveTab('students')} 
                        icon={<Users className="size-4" />}
                        label="Daftar Siswa"
                    />
                    <TabButton 
                        active={activeTab === 'attendance'} 
                        onClick={() => setActiveTab('attendance')} 
                        icon={<CalendarCheck className="size-4" />}
                        label="Absensi"
                    />
                    <TabButton 
                        active={activeTab === 'grades'} 
                        onClick={() => setActiveTab('grades')} 
                        icon={<BookOpen className="size-4" />}
                        label="Nilai"
                    />
                </div>

                {/* 3. TAB CONTENT */}
                <div className="min-h-[500px]">
                    
                    {/* --- TAB SISWA --- */}
                    {activeTab === 'students' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Button onClick={() => setIsAddStudentOpen(true)} className="bg-neutral-900 text-white dark:bg-white dark:text-black">
                                    <Plus className="mr-2 size-4" /> Tambah Siswa
                                </Button>
                            </div>

                            {/* List Siswa (Responsive) */}
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {classroom.students.length > 0 ? classroom.students.map((student) => (
                                    <div key={student.id} className="flex items-center justify-between rounded-xl border border-sidebar-border bg-white p-4 shadow-sm dark:bg-zinc-950">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-neutral-100 font-bold text-neutral-600 dark:bg-neutral-800">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{student.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{student.nik}</p>
                                            </div>
                                        </div>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                <DropdownMenuItem 
                                                    onClick={() => setStudentToRemove(student)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <UserMinus className="mr-2 size-4" /> Keluarkan
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-12 text-center text-muted-foreground">
                                        Belum ada siswa di kelas ini.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB ABSENSI (PLACEHOLDER) --- */}
                    {activeTab === 'attendance' && (
                        <div className="flex flex-col items-center justify-center py-12 border rounded-xl border-dashed">
                            <CalendarCheck className="size-10 text-muted-foreground mb-4" />
                            <h3 className="font-semibold">Modul Absensi</h3>
                            <p className="text-sm text-muted-foreground mb-4">Fitur Scan QR dan Input Manual akan muncul di sini.</p>
                            {/* Nanti kita buat komponen AttendanceSection.tsx terpisah */}
                        </div>
                    )}

                    {/* --- TAB NILAI (PLACEHOLDER) --- */}
                    {activeTab === 'grades' && (
                        <div className="flex flex-col items-center justify-center py-12 border rounded-xl border-dashed">
                            <BookOpen className="size-10 text-muted-foreground mb-4" />
                            <h3 className="font-semibold">Modul Penilaian</h3>
                            <p className="text-sm text-muted-foreground">Fitur Input Nilai akan muncul di sini.</p>
                             {/* Nanti kita buat komponen GradesSection.tsx terpisah */}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: TAMBAH SISWA */}
            <AddStudentModal 
                open={isAddStudentOpen} 
                setOpen={setIsAddStudentOpen} 
                availableStudents={availableStudents}
                classroomId={classroom.id}
            />

            {/* MODAL: REMOVE SISWA */}
            <RemoveStudentModal
                open={!!studentToRemove}
                setOpen={() => setStudentToRemove(null)}
                student={studentToRemove}
                classroomId={classroom.id}
            />

        </AppLayout>
    )
}

// --- SUB COMPONENTS ---

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
                active 
                ? 'bg-white text-black shadow-sm dark:bg-zinc-950 dark:text-white' 
                : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'
            }`}
        >
            {icon}
            {label}
        </button>
    )
}

// MODAL TAMBAH SISWA
function AddStudentModal({ open, setOpen, availableStudents, classroomId }: any) {
    const { data, setData, post, processing, reset } = useForm({
        student_id: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('sensei.classrooms.add-student', classroomId), {
            onSuccess: () => {
                setOpen(false)
                reset()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tambah Siswa ke Kelas</DialogTitle>
                    <DialogDescription>
                        Pilih siswa yang tersedia. Siswa yang sedang aktif di kelas lain tidak akan muncul di sini.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Pilih Siswa</label>
                        <Select onValueChange={(val) => setData('student_id', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Cari nama siswa..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStudents.length > 0 ? availableStudents.map((s: any) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name || s.full_name} ({s.nik})
                                    </SelectItem>
                                )) : (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        Tidak ada siswa tersedia (free).
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={processing || !data.student_id}>Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// MODAL KELUARKAN SISWA
function RemoveStudentModal({ open, setOpen, student, classroomId }: any) {
    const { data, setData, post, processing, reset } = useForm({
        reason: '',
        note: ''
    })

    if (!student) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Menggunakan method remove-student yang sudah kita buat di route
        post(route('sensei.classrooms.remove-student', [classroomId, student.id]), {
            onSuccess: () => {
                setOpen(false)
                reset()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Keluarkan Siswa</DialogTitle>
                    <DialogDescription>
                        Update status {student.name} di kelas ini. Tindakan ini akan mencatat riwayat keluar.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Alasan Keluar</label>
                        <Select onValueChange={(val) => setData('reason', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Status Akhir" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="graduated">Lulus (Graduated)</SelectItem>
                                <SelectItem value="dropped">Mengundurkan Diri (Dropped)</SelectItem>
                                <SelectItem value="moved">Pindah Kelas (Moved)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Catatan (Opsional)</label>
                        <textarea 
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Contoh: Pindah ke kelas N3 karena progress cepat."
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" variant="destructive" disabled={processing || !data.reason}>
                            Konfirmasi Keluar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}