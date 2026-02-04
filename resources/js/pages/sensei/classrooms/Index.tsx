import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, Link, router } from '@inertiajs/react'
import { 
    ArrowRight, 
    Calendar, 
    ChevronRight, 
    GraduationCap, 
    MoreHorizontal, 
    Plus, 
    School, 
    Search, 
    Users 
} from 'lucide-react'
import { useState } from 'react'
import { route } from 'ziggy-js'
import ClassroomForm from './ClassroomForm'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Definisi Tipe Data
interface Classroom {
    id: number
    name: string
    level: string
    status: 'active' | 'finished'
    start_date: string
    end_date: string | null
    students_count?: number
    teacher?: {
        name: string
    }
}

interface Props {
    classrooms: {
        data: Classroom[]
        links: any[]
        current_page: number
        total: number
        per_page: number
        from: number
    }
    filters: {
        search: string
    }
}

export default function ClassroomIndex({ classrooms, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '')
    const [isFormOpen, setIsFormOpen] = useState(false)

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('sensei.dashboard') },
        { title: 'Manajemen Kelas', href: route('sensei.classrooms.index') },
    ]

    // Handle Search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        router.get(route('sensei.classrooms.index'), { search }, { preserveState: true })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Kelas" />

            <div className="flex flex-col gap-6 p-4 lg:p-6">
                
                {/* 1. STATISTIK RINGKAS (Responsive Grid) */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard 
                        title="Total Kelas" 
                        value={classrooms.total} 
                        icon={<School className="size-4" />} 
                        className="col-span-1"
                    />
                    <StatCard 
                        title="Kelas Aktif" 
                        value={classrooms.data.filter(c => c.status === 'active').length} 
                        icon={<Users className="size-4" />} 
                        className="col-span-1"
                        active
                    />
                </div>

                {/* 2. HEADER & SEARCH */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama kelas..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>

                    <Button 
                        onClick={() => setIsFormOpen(true)}
                        className="w-full bg-neutral-900 text-white hover:bg-neutral-800 sm:w-auto dark:bg-white dark:text-black"
                    >
                        <Plus className="mr-2 size-4" /> Buka Kelas Baru
                    </Button>
                </div>

                {/* 3. LIST DATA (HYBRID: CARD vs TABLE) */}
                <div className="space-y-4">
                    
                    {/* TAMPILAN HP (MOBILE CARDS) - Hidden di Layar Besar (md) */}
                    <div className="grid gap-3 md:hidden">
                        {classrooms.data.length > 0 ? classrooms.data.map((classroom) => (
                            <div key={classroom.id} className="flex flex-col gap-3 rounded-xl border border-sidebar-border bg-white p-4 shadow-sm dark:bg-zinc-950">
                                {/* Card Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-foreground">{classroom.name}</h3>
                                            {classroom.status === 'active' ? (
                                                <span className="flex size-2 rounded-full bg-green-500 ring-2 ring-green-500/20" />
                                            ) : (
                                                <span className="flex size-2 rounded-full bg-zinc-300" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{classroom.level}</p>
                                    </div>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground">
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('sensei.classrooms.show', classroom.id)}>
                                                    Detail & Siswa
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Card Body Stats */}
                                <div className="grid grid-cols-2 gap-2 border-y border-sidebar-border py-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="size-4" />
                                        <span>{classroom.students_count || 0} Siswa</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="size-4" />
                                        <span>{new Date(classroom.start_date).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })}</span>
                                    </div>
                                </div>

                                {/* Card Footer Button */}
                                <Link 
                                    href={route('sensei.classrooms.show', classroom.id)}
                                    className="flex w-full items-center justify-center rounded-lg border border-sidebar-border bg-neutral-50 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                                >
                                    Masuk Kelas <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </div>
                        )) : (
                            <EmptyState />
                        )}
                    </div>


                    {/* TAMPILAN DESKTOP (TABLE) - Hidden di HP (< md) */}
                    <div className="hidden rounded-xl border border-sidebar-border bg-white shadow-sm md:block dark:bg-zinc-950">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-sidebar-border bg-neutral-50/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:bg-neutral-900/50">
                                    <tr>
                                        <th className="px-6 py-3 w-12 text-center">#</th>
                                        <th className="px-6 py-3">Nama Kelas</th>
                                        <th className="px-6 py-3">Level</th>
                                        <th className="px-6 py-3">Jumlah Siswa</th>
                                        <th className="px-6 py-3">Mulai Belajar</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                        <th className="px-6 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border">
                                    {classrooms.data.length > 0 ? classrooms.data.map((classroom, index) => (
                                        <tr key={classroom.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors">
                                            <td className="px-6 py-3 text-center text-muted-foreground">
                                                {classrooms.from + index}
                                            </td>
                                            <td className="px-6 py-3 font-medium text-foreground">
                                                {classroom.name}
                                            </td>
                                            <td className="px-6 py-3">
                                                <Badge variant="outline" className="font-normal text-muted-foreground">
                                                    {classroom.level}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3 text-muted-foreground">
                                                {classroom.students_count || 0} orang
                                            </td>
                                            <td className="px-6 py-3 text-muted-foreground">
                                                {new Date(classroom.start_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {classroom.status === 'active' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none shadow-none dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-none shadow-none">
                                                        Selesai
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <Link href={route('sensei.classrooms.show', classroom.id)}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <ChevronRight className="size-4 text-muted-foreground" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7}>
                                                <EmptyState />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 4. PAGINATION */}
                    {classrooms.total > classrooms.per_page && (
                        <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
                            <span className="text-xs text-muted-foreground">
                                {classrooms.from}-{classrooms.from + classrooms.data.length - 1} dari {classrooms.total} kelas
                            </span>
                            <div className="flex gap-1">
                                {classrooms.links.map((link: any, i: number) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md px-3 py-1 text-xs border ${
                                            link.active 
                                                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black' 
                                                : 'bg-white text-neutral-600 border-sidebar-border hover:bg-neutral-50 dark:bg-zinc-950 dark:text-neutral-400'
                                        } ${!link.url && 'opacity-50 cursor-not-allowed pointer-events-none'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* MODAL FORM */}
            <ClassroomForm open={isFormOpen} setOpen={setIsFormOpen} />
        </AppLayout>
    )
}

// --- SUB COMPONENTS ---

function StatCard({ title, value, icon, className, active }: { title: string, value: any, icon: any, className?: string, active?: boolean }) {
    return (
        <div className={`flex flex-col gap-2 rounded-xl border p-4 shadow-sm ${
            active 
            ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white' 
            : 'bg-white border-sidebar-border dark:bg-zinc-950'
        } ${className}`}>
            <div className="flex items-center justify-between opacity-70">
                <span className="text-[10px] uppercase font-bold tracking-widest">{title}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-3">
                <School className="size-6 text-neutral-400" />
            </div>
            <p className="font-medium">Belum ada kelas</p>
            <p className="text-xs">Silakan buat kelas baru untuk memulai.</p>
        </div>
    )
}