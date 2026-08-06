import AppLayout from '@/layouts/app-layout'
import { Head, Link, router } from '@inertiajs/react'
import { PlaneLanding, Plus, Search, Edit, Trash2, Users, Building2, ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Pagination from '@/components/pagination'

interface ReturnRow {
    id: number
    departure_id: number
    user_id: number | null
    student_name: string
    nik: string
    company_name: string
    organization: string
    departure_date: string | null
    return_date: string | null
    reason: 'finished' | 'early_return' | 'other'
    reason_label: string
    notes: string | null
}

interface MonthMeta {
    value: string
    label: string
    prev: string
    next: string
    current: string
    total: number
}

interface Summary {
    total_returns: number
    finished_count: number
    early_count: number
}

interface Props {
    returns: { data: ReturnRow[]; links: any[]; from: number; to: number; total: number }
    organizations: { id: number; name: string }[]
    filters: { search?: string; organization_id?: string; reason?: string }
    month: MonthMeta
    summary: Summary
}

const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const reasonMap: Record<string, { label: string; cls: string }> = {
    finished: { label: 'Selesai Kontrak', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    early_return: { label: 'Pulang Awal / Resign', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    other: { label: 'Lainnya', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
}

export default function ReturnIndex({ returns, organizations, filters, month, summary }: Props) {
    const [search, setSearch] = useState(filters?.search || '')

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Kepulangan', href: '#' },
    ]

    const applyFilter = (extra: Record<string, string>) => {
        router.get(
            '/admin/returns',
            { search, month: month.value, ...filters, ...extra },
            { preserveState: true, replace: true }
        )
    }

    const goToMonth = (value: string) => applyFilter({ month: value, page: '1' })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        applyFilter({})
    }

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Hapus data kepulangan ${name}?`)) {
            router.delete(`/admin/returns/${id}`)
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Kepulangan Siswa" />

            <div className="flex flex-col gap-6 p-4 lg:p-8">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
                            <PlaneLanding size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Data Kepulangan Siswa</h1>
                            <p className="text-sm text-muted-foreground">
                                Pencatatan siswa yang selesai magang/pulang & dasar pembaruan penagihan Kanrihi.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <a href={`/admin/returns/report?month=${month.value}`}>
                            <Button
                                variant="outline"
                                className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                title={`Unduh laporan kepulangan alumni ${month.label} (format Kemnaker)`}
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Laporan Alumni {month.label}
                            </Button>
                        </a>
                        <Link href="/admin/returns/create">
                            <Button className="bg-emerald-700 text-white dark:bg-emerald-600 hover:bg-emerald-800">
                                <Plus className="mr-2 h-4 w-4" /> Catat Kepulangan
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* NAVIGASI BULAN */}
                <div className="flex flex-col gap-3 rounded-2xl border border-sidebar-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-950">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            aria-label="Bulan sebelumnya"
                            onClick={() => goToMonth(month.prev)}
                        >
                            <ChevronLeft size={18} />
                        </Button>

                        <div className="min-w-[150px] text-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Bulan Kepulangan</p>
                            <p className="text-lg font-bold leading-tight">{month.label}</p>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            aria-label="Bulan berikutnya"
                            onClick={() => goToMonth(month.next)}
                        >
                            <ChevronRight size={18} />
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                            <span className="font-bold text-foreground tabular-nums">{month.total}</span> siswa pulang bulan ini
                        </span>
                        <input
                            type="month"
                            value={month.value}
                            onChange={(e) => e.target.value && goToMonth(e.target.value)}
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            aria-label="Pilih bulan"
                        />
                        {month.value !== month.current && (
                            <Button variant="ghost" className="h-10 text-xs" onClick={() => goToMonth(month.current)}>
                                <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Bulan Ini
                            </Button>
                        )}
                    </div>
                </div>

                {/* STATS SUMMARY */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Total Kepulangan</p>
                                <p className="text-2xl font-bold tabular-nums">{summary.total_returns}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-sky-600 p-2.5 text-white shadow-lg shadow-sky-500/20">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Selesai Kontrak</p>
                                <p className="text-2xl font-bold tabular-nums text-emerald-600">{summary.finished_count}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-amber-600 p-2.5 text-white shadow-lg shadow-amber-500/20">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Pulang Awal / Resign</p>
                                <p className="text-2xl font-bold tabular-nums text-amber-600">{summary.early_count}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex flex-col md:flex-row gap-3">
                    <form onSubmit={handleSearch} className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama siswa, NIK, perusahaan..."
                            className="pl-10 h-11"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                    <select
                        value={filters?.reason || ''}
                        onChange={(e) => applyFilter({ reason: e.target.value })}
                        className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="">Semua Alasan</option>
                        <option value="finished">Selesai Kontrak</option>
                        <option value="early_return">Pulang Awal / Resign</option>
                        <option value="other">Lainnya</option>
                    </select>
                    <select
                        value={filters?.organization_id || ''}
                        onChange={(e) => applyFilter({ organization_id: e.target.value })}
                        className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="">Semua Organisasi</option>
                        {organizations.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* DATA TABLE */}
                <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-4">Nama Siswa / Alumni</th>
                                    <th className="px-6 py-4">Perusahaan & Organisasi</th>
                                    <th className="px-6 py-4 text-center">Tgl Berangkat</th>
                                    <th className="px-6 py-4 text-center">Tgl Pulang</th>
                                    <th className="px-6 py-4 text-center">Keterangan</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {returns?.data?.length > 0 ? (
                                    returns.data.map((r) => (
                                        <tr key={r.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-foreground">{r.student_name}</span>
                                                    <span className="text-[11px] text-muted-foreground">NIK: {r.nik}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-medium text-foreground font-japanese">{r.company_name}</span>
                                                    <span className="text-[11px] text-muted-foreground">{r.organization}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs">{fmtDate(r.departure_date)}</td>
                                            <td className="px-6 py-4 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                {fmtDate(r.return_date)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="secondary" className={reasonMap[r.reason]?.cls}>
                                                    {r.reason_label}
                                                </Badge>
                                                {r.notes && (
                                                    <p className="text-[11px] text-muted-foreground mt-1 truncate max-w-[180px]">
                                                        {r.notes}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link href={`/admin/returns/${r.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50">
                                                            <Edit size={16} />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(r.id, r.student_name)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground italic">
                                            Tidak ada data kepulangan pada {month.label}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    links={returns?.links}
                    from={returns?.from}
                    to={returns?.to}
                    total={returns?.total}
                    label={`kepulangan ${month.label}`}
                />
            </div>
        </AppLayout>
    )
}
