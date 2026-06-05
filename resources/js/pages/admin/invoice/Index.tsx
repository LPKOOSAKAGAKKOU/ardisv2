import AppLayout from '@/layouts/app-layout'
import { Head, Link, router } from '@inertiajs/react'
import { Receipt, Plus, Search, Eye, Trash2, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface InvoiceRow {
    id: number
    invoice_number: string
    organization: string | null
    issue_date: string | null
    period_from: string | null
    period_to: string | null
    total_amount: number
    status: 'draft' | 'issued' | 'paid'
    paid_at: string | null
    items_count: number
}
interface Props {
    invoices: { data: InvoiceRow[]; links: any[] }
    organizations: { id: number; name: string }[]
    filters: { search?: string; status?: string; organization_id?: string }
}

const yen = (n: number) => '¥' + (n ?? 0).toLocaleString('ja-JP')
const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const fmtMonth = (d: string | null) => (d ? new Date(d).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-')

const statusMap: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
    issued: { label: 'Belum Lunas', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    paid: { label: 'Lunas', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

export default function InvoiceIndex({ invoices, organizations, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '')

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Penagihan', href: '#' },
    ]

    const applyFilter = (extra: Record<string, string>) => {
        router.get('/admin/invoices', { search, ...filters, ...extra }, { preserveState: true, replace: true })
    }

    const markPaid = (id: number) => {
        if (confirm('Tandai invoice ini sebagai LUNAS?')) {
            router.patch(`/admin/invoices/${id}/mark-paid`)
        }
    }

    const handleDelete = (id: number, num: string) => {
        if (confirm(`Hapus invoice ${num}?`)) {
            router.delete(`/admin/invoices/${id}`)
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Penagihan" />

            <div className="flex flex-col gap-6 p-4 lg:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-600 rounded-xl shadow-lg shadow-violet-500/20 text-white">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Data Penagihan</h1>
                            <p className="text-sm text-muted-foreground">Invoice management fee bulanan ke organisasi penerima.</p>
                        </div>
                    </div>
                    <Link href="/admin/invoices/create">
                        <Button className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90">
                            <Plus className="mr-2 h-4 w-4" /> Buat Invoice
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <form onSubmit={(e) => { e.preventDefault(); applyFilter({}) }} className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Cari no. invoice..." className="pl-10 h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </form>
                    <select value={filters?.status || ''} onChange={(e) => applyFilter({ status: e.target.value })} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Semua Status</option>
                        <option value="issued">Belum Lunas</option>
                        <option value="paid">Lunas</option>
                        <option value="draft">Draft</option>
                    </select>
                    <select value={filters?.organization_id || ''} onChange={(e) => applyFilter({ organization_id: e.target.value })} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Semua Organisasi</option>
                        {organizations.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>

                <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-4">No. Invoice</th>
                                    <th className="px-6 py-4">Periode</th>
                                    <th className="px-6 py-4 text-center">Tgl Terbit</th>
                                    <th className="px-6 py-4 text-center">Item</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {invoices?.data?.length > 0 ? (
                                    invoices.data.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold tabular-nums">{inv.invoice_number}</span>
                                                    <span className="text-[11px] text-muted-foreground">{inv.organization || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">{fmtMonth(inv.period_from)}</td>
                                            <td className="px-6 py-4 text-center text-xs">{fmtDate(inv.issue_date)}</td>
                                            <td className="px-6 py-4 text-center">{inv.items_count}</td>
                                            <td className="px-6 py-4 text-right font-semibold tabular-nums">{yen(inv.total_amount)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="secondary" className={statusMap[inv.status]?.cls}>
                                                    {statusMap[inv.status]?.label || inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {inv.status !== 'paid' && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => markPaid(inv.id)} title="Tandai lunas">
                                                            <CheckCircle2 size={16} />
                                                        </Button>
                                                    )}
                                                    <Link href={`/admin/invoices/${inv.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-600 hover:bg-violet-50">
                                                            <Eye size={16} />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDelete(inv.id, inv.invoice_number)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground italic">
                                            Belum ada invoice. Buat invoice bulanan lewat tombol di atas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {invoices?.links?.length > 3 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                        {invoices.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className={`px-3 py-1.5 text-xs rounded-md border ${
                                    link.active ? 'bg-neutral-900 text-white dark:bg-white dark:text-black' : 'bg-background text-muted-foreground hover:bg-muted disabled:opacity-40'
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
