import AppLayout from '@/layouts/app-layout'
import { Head, Link, router } from '@inertiajs/react'
import { Plane, Plus, Search, Edit, Trash2, Eye, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface DepartureRow {
    id: number
    company_name: string
    organization: string | null
    departure_date: string | null
    people_count: number
    travel_cost: number
    status: 'managing' | 'completed' | 'cancelled'
    notes: string | null
    students: string[]
    first_billing_date: string | null
    end_date: string | null
    total_management_fee: number
}

interface Props {
    departures: { data: DepartureRow[]; links: any[] }
    organizations: { id: number; name: string }[]
    filters: { search?: string; status?: string; organization_id?: string }
}

const yen = (n: number) => '¥' + (n ?? 0).toLocaleString('ja-JP')
const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const statusMap: Record<string, { label: string; cls: string }> = {
    managing: { label: 'Dikelola', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    completed: { label: 'Selesai', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
    cancelled: { label: 'Batal', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default function DepartureIndex({ departures, organizations, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '')

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Keberangkatan', href: '#' },
    ]

    const applyFilter = (extra: Record<string, string>) => {
        router.get('/admin/departures', { search, ...filters, ...extra }, { preserveState: true, replace: true })
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        applyFilter({})
    }

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Hapus data keberangkatan ${name}?`)) {
            router.delete(`/admin/departures/${id}`)
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Keberangkatan" />

            <div className="flex flex-col gap-6 p-4 lg:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-600 rounded-xl shadow-lg shadow-sky-500/20 text-white">
                            <Plane size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Data Keberangkatan</h1>
                            <p className="text-sm text-muted-foreground">
                                Catatan keberangkatan technical intern & dasar perhitungan penagihan.
                            </p>
                        </div>
                    </div>
                    <Link href="/admin/departures/create">
                        <Button className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Keberangkatan
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <form onSubmit={handleSearch} className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari perusahaan atau catatan..."
                            className="pl-10 h-11"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                    <select
                        value={filters?.status || ''}
                        onChange={(e) => applyFilter({ status: e.target.value })}
                        className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="">Semua Status</option>
                        <option value="managing">Dikelola</option>
                        <option value="completed">Selesai</option>
                        <option value="cancelled">Batal</option>
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

                <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-4">Perusahaan</th>
                                    <th className="px-6 py-4 text-center">Tgl Berangkat</th>
                                    <th className="px-6 py-4 text-center">Orang</th>
                                    <th className="px-6 py-4 text-center">Tagihan Pertama</th>
                                    <th className="px-6 py-4 text-right">Total Management Fee</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {departures?.data?.length > 0 ? (
                                    departures.data.map((d) => (
                                        <tr key={d.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-foreground font-japanese">{d.company_name}</span>
                                                    <span className="text-[11px] text-muted-foreground">{d.organization || '-'}</span>
                                                    {d.students?.length > 0 ? (
                                                        <span className="text-[11px] text-sky-600 dark:text-sky-400 truncate max-w-[240px]">
                                                            {d.students.join(', ')}
                                                        </span>
                                                    ) : d.notes ? (
                                                        <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">{d.notes}</span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs">{fmtDate(d.departure_date)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium">
                                                    <Users size={12} className="text-sky-600" /> {d.people_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs">{fmtDate(d.first_billing_date)}</td>
                                            <td className="px-6 py-4 text-right font-semibold tabular-nums">{yen(d.total_management_fee)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="secondary" className={statusMap[d.status]?.cls}>
                                                    {statusMap[d.status]?.label || d.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link href={`/admin/departures/${d.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-600 hover:bg-sky-50">
                                                            <Eye size={16} />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/departures/${d.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50">
                                                            <Edit size={16} />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(d.id, d.company_name)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground italic">
                                            Belum ada data keberangkatan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {departures?.links?.length > 3 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                        {departures.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className={`px-3 py-1.5 text-xs rounded-md border ${
                                    link.active
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                                        : 'bg-background text-muted-foreground hover:bg-muted disabled:opacity-40'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
