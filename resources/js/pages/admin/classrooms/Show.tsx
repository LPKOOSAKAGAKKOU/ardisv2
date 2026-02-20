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
import { Head, useForm, router } from '@inertiajs/react'
import { 
    BookOpen, 
    CalendarCheck, 
    ChevronLeft, 
    MoreHorizontal, 
    Plus, 
    UserMinus, 
    UserPlus,
    Users,
    X,
    User
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import AttendanceSection from '@/pages/sensei/classrooms/AttendanceSection' // Re-use sensei components
import GradesSection from '@/pages/sensei/classrooms/GradesSection'

interface Student {
    id: number
    nik: string
    full_name: string
    gender: string
}

interface Classroom {
    id: number
    name: string
    level: string
    status: string
    teacher?: {
        name: string
    }
    students: Student[]
}

interface Props {
    classroom: Classroom
    availableStudents: Student[]
}

export default function AdminClassroomShow({ classroom, availableStudents }: Props) {
    const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'grades'>('students')
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
    const [studentToRemove, setStudentToRemove] = useState<Student | null>(null)

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Manajemen Kelas', href: '/admin/classrooms' },
        { title: classroom.name, href: '#' },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Admin - Kelas ${classroom.name}`} />

            <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full">
                
                {/* HEADER KELAS */}
                <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8" onClick={() => router.get('/admin/classrooms')}>
                                <ChevronLeft className="size-5" />
                            </Button>
                            <h1 className="text-2xl font-bold tracking-tight">{classroom.name}</h1>
                            <Badge variant="outline" className="bg-neutral-100 uppercase">{classroom.level}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                            Sensei: <span className="font-semibold text-foreground">{classroom.teacher?.name ?? 'Belum Ditugaskan'}</span> • {classroom.students.length} Siswa Terdaftar
                        </p>
                    </div>
                </div>

                {/* TABS NAVIGATION */}
                <div className="flex w-full items-center rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
                    <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users className="size-4" />} label="Siswa" />
                    <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<CalendarCheck className="size-4" />} label="Monitoring Absensi" />
                    <TabButton active={activeTab === 'grades'} onClick={() => setActiveTab('grades')} icon={<BookOpen className="size-4" />} label="Rekap Nilai" />
                </div>

                {/* CONTENT */}
                <div className="min-h-[500px]">
                    {activeTab === 'students' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Button onClick={() => setIsAddStudentOpen(true)} className="bg-neutral-900 text-white dark:bg-white dark:text-black">
                                    <Plus className="mr-2 size-4" /> Daftarkan Siswa
                                </Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {classroom.students.map((student) => (
                                    <div key={student.id} className="flex items-center justify-between rounded-xl border border-sidebar-border bg-white p-4 shadow-sm dark:bg-zinc-950">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-neutral-100 font-bold text-neutral-600 dark:bg-neutral-800 uppercase">
                                                {student.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm uppercase">{student.full_name}</p>
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
                                                <DropdownMenuLabel>Opsi Admin</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.get(`/admin/students/${student.id}`)}>
                                                    <User className="mr-2 size-4" /> Lihat Profil
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setStudentToRemove(student)} className="text-red-600 focus:text-red-600">
                                                    <UserMinus className="mr-2 size-4" /> Keluarkan Siswa
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && <AttendanceSection classroom={classroom} isAdmin={true} />}
                    {activeTab === 'grades' && <GradesSection classroom={classroom} isAdmin={true} />}
                </div>
            </div>

            <AddStudentModal open={isAddStudentOpen} setOpen={setIsAddStudentOpen} availableStudents={availableStudents} classroomId={classroom.id} />
            <RemoveStudentModal open={!!studentToRemove} setOpen={() => setStudentToRemove(null)} student={studentToRemove} classroomId={classroom.id} />
        </AppLayout>
    )
}

// Reuse logic Modal dari Sensei tapi ganti path route ke admin.classrooms.add-student dll
function AddStudentModal({ open, setOpen, availableStudents, classroomId }: any) {
    const { data, setData, post, processing, reset } = useForm({ student_id: '' })
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<any>(null)

    useEffect(() => { if (!open) { setSearchQuery(''); setSelectedStudent(null); reset(); } }, [open])

    const filteredStudents = searchQuery === '' ? [] : availableStudents.filter((s: any) => 
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nik.includes(searchQuery)
    )

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(`/admin/classrooms/${classroomId}/students`, { onSuccess: () => setOpen(false) })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Tambah Siswa (Admin)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {!selectedStudent ? (
                        <Input placeholder="Cari NIK atau Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    ) : (
                        <div className="flex items-center justify-between p-3 border rounded-xl bg-neutral-50">
                            <p className="font-bold text-sm uppercase">{selectedStudent.full_name}</p>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedStudent(null)}><X size={18}/></Button>
                        </div>
                    )}
                    {searchQuery && !selectedStudent && (
                        <div className="border rounded-lg max-h-40 overflow-y-auto">
                            {filteredStudents.map((s: any) => (
                                <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setData('student_id', s.id); setSearchQuery('') }} className="w-full text-left p-2 hover:bg-neutral-100 text-sm border-b uppercase italic">{s.full_name}</button>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={processing || !data.student_id}>Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function RemoveStudentModal({ open, setOpen, student, classroomId }: any) {
    const { data, setData, patch, processing, reset } = useForm({ reason: 'graduated', note: '' })
    if (!student) return null
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        patch(`/admin/classrooms/${classroomId}/students/${student.id}`, { onSuccess: () => { setOpen(false); reset(); } })
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Keluarkan Siswa</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select onValueChange={(val) => setData('reason', val as any)} defaultValue="graduated">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="graduated">Lulus</SelectItem>
                            <SelectItem value="dropped">Berhenti</SelectItem>
                            <SelectItem value="moved">Pindah</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input placeholder="Catatan Admin..." value={data.note} onChange={e => setData('note', e.target.value)} />
                    <DialogFooter>
                        <Button type="submit" variant="destructive" disabled={processing}>Konfirmasi</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button onClick={onClick} className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${active ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {icon} {label}
        </button>
    )
}