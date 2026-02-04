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
import { Input } from '@/components/ui/input'
import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'
import { Head, useForm } from '@inertiajs/react'
import { 
    BookOpen, 
    CalendarCheck, 
    ChevronLeft, 
    MoreHorizontal, 
    Plus, 
    UserMinus, 
    UserPlus,
    Users,
    X
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { route } from 'ziggy-js'
import AttendanceSection from './AttendanceSection'
import GradesSection from './GradesSection'

// --- TIPE DATA ---
interface Student {
    id: number
    nik: string
    full_name: string // Sesuai kolom database
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
                                                {/* Pakai full_name */}
                                                {student.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{student.full_name}</p>
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

                    {/* --- TAB ABSENSI --- */}
                    {activeTab === 'attendance' && (
                        <AttendanceSection classroom={classroom} />
                    )}

                    {/* --- TAB NILAI --- */}
                    {activeTab === 'grades' && (
                        <GradesSection classroom={classroom} />
                    )}
                </div>
            </div>

            {/* MODAL: TAMBAH SISWA (Versi Search Simple) */}
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

// MODAL TAMBAH SISWA (Dengan Fitur Pencarian Simple)
function AddStudentModal({ open, setOpen, availableStudents, classroomId }: any) {
    const { data, setData, post, processing, reset } = useForm({
        student_id: ''
    })

    // State untuk pencarian & tampilan
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<any>(null)

    // Reset state saat modal ditutup
    useEffect(() => {
        if (!open) {
            setSearchQuery('')
            setSelectedStudent(null)
            setData('student_id', '')
            reset()
        }
    }, [open])

    // Logic Filter Manual
    const filteredStudents = searchQuery === ''
        ? [] 
        : availableStudents.filter((student: any) =>
            student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.nik.includes(searchQuery)
        )

    // Saat user memilih siswa dari list
    const handleSelectStudent = (student: any) => {
        setData('student_id', String(student.id))
        setSelectedStudent(student)
        setSearchQuery('') 
    }

    // Batalkan pilihan
    const handleClearSelection = () => {
        setData('student_id', '')
        setSelectedStudent(null)
        setSearchQuery('')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('sensei.classrooms.add-student', classroomId), {
            onSuccess: () => {
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] overflow-visible">
                <DialogHeader>
                    <DialogTitle>Tambah Siswa ke Kelas</DialogTitle>
                    <DialogDescription>
                        Cari siswa berdasarkan nama atau NIK, lalu klik Simpan.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    
                    {/* AREA INPUT PENCARIAN SIMPLE */}
                    <div className="relative group">
                        {/* Jika belum ada yang dipilih, tampilkan Input Search */}
                        {!selectedStudent ? (
                            <>
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                                    <UserPlus size={18} />
                                </div>
                                <Input
                                    placeholder="Ketik nama siswa..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-12 bg-white dark:bg-zinc-950 border-sidebar-border/70 rounded-xl focus-visible:ring-neutral-900"
                                    autoFocus={open}
                                />
                                
                                {/* DROPDOWN HASIL */}
                                {searchQuery.length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-sidebar-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map((student: any) => (
                                                <button
                                                    type="button"
                                                    key={student.id}
                                                    onClick={() => handleSelectStudent(student)}
                                                    className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center justify-between border-b last:border-0 border-sidebar-border transition-colors"
                                                >
                                                    <div className="min-w-0 pr-4">
                                                        <p className="font-bold text-sm truncate">{student.full_name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate font-mono">
                                                            {student.nik}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="flex-shrink-0 bg-white dark:bg-zinc-800">
                                                        Pilih
                                                    </Badge>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                Tidak ditemukan siswa dengan nama "{searchQuery}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            // JIKA SUDAH DIPILIH (Tampilan Card Terpilih)
                            <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl bg-neutral-50 dark:bg-zinc-900 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-white border shadow-sm font-bold text-neutral-700">
                                        {selectedStudent.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{selectedStudent.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedStudent.nik}</p>
                                    </div>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={handleClearSelection}
                                    className="text-muted-foreground hover:text-red-600"
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-neutral-900 text-white dark:bg-white dark:text-black" 
                            disabled={processing || !data.student_id}
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Siswa'}
                        </Button>
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
                        Update status {student.full_name} di kelas ini. Tindakan ini akan mencatat riwayat keluar.
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