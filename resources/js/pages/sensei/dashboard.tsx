import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'
import { Head, Link } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { 
    School, 
    Users, 
    MessageSquare, 
    ArrowRight, 
    Clock, 
    Calendar,
    BookOpen
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Definisikan tipe data yang dikirim dari controller
interface Props {
    activeClass?: {
        id: number;
        name: string;
        level: string;
        students_count: number;
        start_date: string;
    };
    stats: {
        total_students: number;
        upcoming_interviews: number;
    };
}

export default function SenseiDashboard({ activeClass, stats }: Props) {

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: route('sensei.dashboard'),
        },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Sensei" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 overflow-y-auto">
                
                {/* --- WELCOME SECTION --- */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Oha You Gozaimasu, Sensei! 👋</h1>
                    <p className="text-muted-foreground">Berikut adalah ringkasan aktivitas pembelajaran Anda hari ini.</p>
                </div>

                {/* --- HERO: ACTIVE CLASS (AKSES CEPAT) --- */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    
                    {/* KARTU KELAS AKTIF (Mengambil porsi lebar lebih banyak) */}
                    <Card className="col-span-1 md:col-span-2 lg:col-span-4 border-l-4 border-l-blue-600 shadow-md bg-gradient-to-br from-white to-blue-50/50 dark:from-zinc-950 dark:to-blue-950/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <School className="h-5 w-5 text-blue-600" />
                                Kelas Sedang Aktif
                            </CardTitle>
                            <CardDescription>
                                Akses cepat ke kelas yang sedang berlangsung saat ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {activeClass ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-black text-foreground tracking-tight">{activeClass.name}</h2>
                                            <Badge className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1">
                                                Level {activeClass.level}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {activeClass.students_count} Siswa
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Mulai: {new Date(activeClass.start_date).toLocaleDateString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                                    <div className="p-3 bg-neutral-100 dark:bg-zinc-800 rounded-full">
                                        <School className="h-8 w-8 text-neutral-400" />
                                    </div>
                                    <p className="text-sm font-medium">Tidak ada kelas yang aktif saat ini.</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            {activeClass ? (
                                <Button asChild className="w-full h-12 text-md font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                                    <Link href={route('sensei.classrooms.show', activeClass.id)}>
                                        Masuk ke Kelas <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild variant="outline" className="w-full border-dashed">
                                    <Link href={route('sensei.classrooms.index')}>
                                        + Buka Kelas Baru
                                    </Link>
                                </Button>
                            )}
                        </CardFooter>
                    </Card>

                    {/* STATISTIK SAMPING */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 gap-4">
                        {/* Stat 1: Total Siswa */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Siswa Aktif
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_students}</div>
                                <p className="text-xs text-muted-foreground">
                                    Di kelas yang Anda ajar
                                </p>
                            </CardContent>
                        </Card>

                        {/* Stat 2: Jadwal Wawancara */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Wawancara Mendatang
                                </CardTitle>
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.upcoming_interviews}</div>
                                <p className="text-xs text-muted-foreground">
                                    Lowongan aktif tersedia
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* --- QUICK MENU (GRID BAWAH) --- */}
                <h3 className="text-lg font-semibold mt-4">Menu Cepat</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <QuickMenuCard 
                        title="Data Siswa" 
                        desc="Kelola biodata dan dokumen siswa"
                        icon={<Users className="h-6 w-6 text-emerald-600" />}
                        href={route('sensei.students.index')}
                    />
                    <QuickMenuCard 
                        title="Jadwal Wawancara" 
                        desc="Lihat lowongan dan atur peserta"
                        icon={<MessageSquare className="h-6 w-6 text-purple-600" />}
                        href={route('sensei.interviews.index')}
                    />
                    <QuickMenuCard 
                        title="Riwayat Kelas" 
                        desc="Lihat arsip kelas yang sudah selesai"
                        icon={<BookOpen className="h-6 w-6 text-amber-600" />}
                        href={route('sensei.classrooms.index')}
                    />
                </div>
            </div>
        </AppLayout>
    )
}

// --- KOMPONEN KECIL UNTUK MENU CEPAT ---
function QuickMenuCard({ title, desc, icon, href }: { title: string, desc: string, icon: React.ReactNode, href: string }) {
    return (
        <Link href={href}>
            <Card className="hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="p-2 bg-neutral-100 dark:bg-zinc-800 rounded-lg">
                        {icon}
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-base">{title}</CardTitle>
                        <CardDescription className="text-xs">{desc}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    )
}