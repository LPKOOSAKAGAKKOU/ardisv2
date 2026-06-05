import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, Link } from '@inertiajs/react'
import { route } from 'ziggy-js'
import {
    Users,
    Building2,
    Briefcase,
    GraduationCap,
    CalendarClock,
    MessageSquare,
    Plus,
    ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Stats {
    total_students: number
    total_interviews: number
    upcoming_interviews: number
    total_companies: number
    total_organizations: number
    total_teachers: number
}

interface RecentInterview {
    id: number
    interviewer_title: string
    type: string
    interview_date: string | null
    details_count: number
    company?: { id: number; name: string } | null
    accepting_organization?: { id: number; name: string } | null
}

interface Props {
    stats: Stats
    recentInterviews: RecentInterview[]
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('admin.dashboard'),
    },
]

export default function AdminDashboard({ stats, recentInterviews }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Admin" />

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-8">
                {/* --- WELCOME --- */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Selamat Datang, Admin! 👋</h1>
                    <p className="text-muted-foreground">
                        Ringkasan data dan akses cepat ke modul-modul utama.
                    </p>
                </div>

                {/* --- STAT CARDS --- */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="Total Siswa"
                        value={stats.total_students}
                        desc="Akun siswa terdaftar"
                        icon={<Users className="h-5 w-5 text-emerald-600" />}
                        href={route('admin.students.index')}
                    />
                    <StatCard
                        title="Wawancara Mendatang"
                        value={stats.upcoming_interviews}
                        desc={`dari ${stats.total_interviews} total wawancara`}
                        icon={<CalendarClock className="h-5 w-5 text-purple-600" />}
                        href={route('admin.interviews.index')}
                    />
                    <StatCard
                        title="Perusahaan"
                        value={stats.total_companies}
                        desc="Kumiai / perusahaan Jepang"
                        icon={<Briefcase className="h-5 w-5 text-blue-600" />}
                        href={route('admin.companies.index')}
                    />
                    <StatCard
                        title="Organisasi Penerima"
                        value={stats.total_organizations}
                        desc="Accepting organizations"
                        icon={<Building2 className="h-5 w-5 text-amber-600" />}
                        href={route('admin.organizations.index')}
                    />
                    <StatCard
                        title="Sensei"
                        value={stats.total_teachers}
                        desc="Pengajar terdaftar"
                        icon={<GraduationCap className="h-5 w-5 text-rose-600" />}
                        href={route('admin.teachers.index')}
                    />
                </div>

                {/* --- QUICK ACTIONS (SHORTCUT TAMBAH) --- */}
                <div>
                    <h3 className="mb-3 text-lg font-semibold">Aksi Cepat</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <QuickAction
                            title="Tambah Wawancara"
                            desc="Buat jadwal wawancara baru"
                            icon={<MessageSquare className="h-6 w-6 text-purple-600" />}
                            href={route('admin.interviews.create')}
                        />
                        <QuickAction
                            title="Tambah Perusahaan"
                            desc="Daftarkan perusahaan / kumiai"
                            icon={<Briefcase className="h-6 w-6 text-blue-600" />}
                            href={route('admin.companies.create')}
                        />
                        <QuickAction
                            title="Tambah Organisasi Penerima"
                            desc="Daftarkan accepting organization"
                            icon={<Building2 className="h-6 w-6 text-amber-600" />}
                            href={route('admin.organizations.create')}
                        />
                        <QuickAction
                            title="Tambah Siswa"
                            desc="Buat data siswa baru"
                            icon={<Users className="h-6 w-6 text-emerald-600" />}
                            href={route('admin.students.create')}
                        />
                        <QuickAction
                            title="Tambah Sensei"
                            desc="Daftarkan pengajar baru"
                            icon={<GraduationCap className="h-6 w-6 text-rose-600" />}
                            href={route('admin.teachers.create')}
                        />
                        <QuickAction
                            title="Tambah Rekrutmen"
                            desc="Buka periode rekrutmen baru"
                            icon={<CalendarClock className="h-6 w-6 text-indigo-600" />}
                            href={route('admin.recruitments.create')}
                        />
                    </div>
                </div>

                {/* --- RECENT INTERVIEWS --- */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="text-base">Wawancara Terbaru</CardTitle>
                            <CardDescription>5 jadwal wawancara terakhir yang dibuat</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href={route('admin.interviews.index')}>
                                Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentInterviews.length > 0 ? (
                            <div className="divide-y divide-border">
                                {recentInterviews.map((iv) => (
                                    <Link
                                        key={iv.id}
                                        href={route('admin.interviews.show', iv.id)}
                                        className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{iv.interviewer_title}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {iv.company?.name ?? '-'}
                                                {iv.accepting_organization?.name
                                                    ? ` • ${iv.accepting_organization.name}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <Badge variant="secondary">{iv.details_count} peserta</Badge>
                                            <span className="hidden text-sm text-muted-foreground sm:inline">
                                                {iv.interview_date
                                                    ? new Date(iv.interview_date).toLocaleDateString('id-ID')
                                                    : '-'}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Belum ada wawancara. Buat yang pertama lewat aksi cepat di atas.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}

function StatCard({
    title,
    value,
    desc,
    icon,
    href,
}: {
    title: string
    value: number
    desc: string
    icon: React.ReactNode
    href: string
}) {
    return (
        <Link href={href}>
            <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className="rounded-lg bg-muted p-2">{icon}</div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
            </Card>
        </Link>
    )
}

function QuickAction({
    title,
    desc,
    icon,
    href,
}: {
    title: string
    desc: string
    icon: React.ReactNode
    href: string
}) {
    return (
        <Link href={href}>
            <Card className="group h-full cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="rounded-lg bg-muted p-2">{icon}</div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <CardTitle className="flex items-center gap-1 text-base">
                            {title}
                            <Plus className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </CardTitle>
                        <CardDescription className="text-xs">{desc}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    )
}
