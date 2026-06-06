import AppLayout from '@/layouts/app-layout'
import { Head, router } from '@inertiajs/react'
import { Receipt, ArrowLeft, FileText } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PreviewItem {
    departure_id: number
    kind: 'management' | 'travel' | 'pre_education' | 'shoukairyou' | 'other'
    company_name: string
    description: string
    students: string[]
    people: number
    months: number
    unit_price: number
    amount: number
}
type RecipientType = 'organization' | 'company'
interface Props {
    organizations: { id: number; name: string }[]
    companies: { id: number; name: string; name_in_japanese: string | null }[]
    preview: {
        recipient_type: RecipientType
        recipient_id: number
        recipient_name: string
        month: string
        items: PreviewItem[]
        total: number
    } | null
    filters: { recipient_type?: string; recipient_id?: string; month?: string }
}

const yen = (n: number) => '¥' + (n ?? 0).toLocaleString('ja-JP')
const monthLabel = (m: string) => {
    const [y, mo] = m.split('-')
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export default function InvoiceGenerate({ organizations, companies, preview, filters }: Props) {
    const [recipientType, setRecipientType] = useState<RecipientType>((filters?.recipient_type as RecipientType) || 'organization')
    const [recipientId, setRecipientId] = useState(filters?.recipient_id || '')
    const [month, setMonth] = useState(filters?.month || new Date().toISOString().slice(0, 7))
    const [processing, setProcessing] = useState(false)

    const breadcrumbs = [
        { title: 'Data Penagihan', href: '/admin/invoices' },
        { title: 'Buat Invoice', href: '#' },
    ]

    const loadPreview = () => {
        if (!recipientId || !month) return
        router.get('/admin/invoices/create', { recipient_type: recipientType, recipient_id: recipientId, month }, { preserveState: true, replace: true })
    }

    const generate = () => {
        router.post(
            '/admin/invoices',
            { recipient_type: recipientType, recipient_id: recipientId, month },
            { onStart: () => setProcessing(true), onFinish: () => setProcessing(false) },
        )
    }

    const switchType = (t: RecipientType) => {
        setRecipientType(t)
        setRecipientId('')
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Invoice" />

            <div className="max-w-4xl mx-auto p-4 lg:p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Buat Invoice Bulanan</h1>
                            <p className="text-sm text-muted-foreground">Tagih ke organisasi (kumiai) atau langsung ke perusahaan (TG), lalu cek tagihan yang jatuh tempo.</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => router.get('/admin/invoices')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                    </Button>
                </div>

                <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-4">
                    {/* Pilih jenis penerima tagihan */}
                    <div className="inline-flex rounded-lg border border-sidebar-border p-1">
                        <button
                            type="button"
                            onClick={() => switchType('organization')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${recipientType === 'organization' ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Ke Organisasi (Kumiai)
                        </button>
                        <button
                            type="button"
                            onClick={() => switchType('company')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${recipientType === 'company' ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Ke Perusahaan (TG)
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                {recipientType === 'company' ? 'Perusahaan Penerima' : 'Organisasi Penerima'}
                            </label>
                            <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                                <option value="">{recipientType === 'company' ? 'Pilih perusahaan' : 'Pilih organisasi'}</option>
                                {recipientType === 'company'
                                    ? companies.map((c) => (
                                          <option key={c.id} value={c.id}>{c.name_in_japanese || c.name}</option>
                                      ))
                                    : organizations.map((o) => (
                                          <option key={o.id} value={o.id}>{o.name}</option>
                                      ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Bulan Tagih</label>
                            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
                        </div>
                        <Button onClick={loadPreview} disabled={!recipientId || !month} className="h-11 bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90">
                            <FileText className="mr-2 h-4 w-4" /> Cek Tagihan
                        </Button>
                    </div>
                </div>

                {preview && (
                    <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-sidebar-border flex items-center justify-between">
                            <div>
                                <p className="font-bold font-japanese">{preview.recipient_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {preview.recipient_type === 'company' ? 'Tagih langsung ke perusahaan' : 'Tagih ke organisasi'} · bulan {monthLabel(preview.month)}
                                </p>
                            </div>
                            <span className="text-sm font-bold tabular-nums">{yen(preview.total)}</span>
                        </div>

                        {preview.items.length > 0 ? (
                            <>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                                        <tr>
                                            <th className="px-6 py-3">Perusahaan</th>
                                            <th className="px-6 py-3 text-center">Orang</th>
                                            <th className="px-6 py-3 text-center">Bulan</th>
                                            <th className="px-6 py-3 text-right">Tarif</th>
                                            <th className="px-6 py-3 text-right">Jumlah</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border">
                                        {preview.items.map((it, idx) => (
                                            <tr key={`${it.departure_id}-${it.kind}-${idx}`}>
                                                <td className="px-6 py-3">
                                                    <p className="font-semibold font-japanese">{it.company_name}</p>
                                                    <p className="text-[11px] text-muted-foreground font-japanese">{it.description}</p>
                                                    {it.students?.length > 0 && (
                                                        <p className="text-[11px] text-sky-600 font-japanese">対象者: {it.students.join('、')}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-center">{it.people}</td>
                                                <td className="px-6 py-3 text-center">{it.kind === 'management' ? `${it.months}ヶ月` : '—'}</td>
                                                <td className="px-6 py-3 text-right tabular-nums">{yen(it.people > 0 ? Math.round(it.amount / it.people) : it.amount)}</td>
                                                <td className="px-6 py-3 text-right font-semibold tabular-nums">{yen(it.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="px-6 py-4 border-t border-sidebar-border flex justify-end">
                                    <Button onClick={generate} disabled={processing} className="bg-violet-600 hover:bg-violet-700 text-white min-w-[180px] h-11">
                                        {processing ? 'Memproses...' : 'Generate Invoice'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="px-6 py-12 text-center text-muted-foreground italic">
                                Tidak ada tagihan yang jatuh tempo pada bulan ini.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
