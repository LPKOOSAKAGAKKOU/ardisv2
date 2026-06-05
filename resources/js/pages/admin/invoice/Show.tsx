import AppLayout from '@/layouts/app-layout'
import { Head, router } from '@inertiajs/react'
import { Receipt, ArrowLeft, CheckCircle2, RotateCcw, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Item {
    id: number
    kind: 'management' | 'travel' | 'pre_education'
    company_name: string
    description: string | null
    students: string[]
    people: number
    months: number
    unit_price: number
    amount: number
}
interface Props {
    invoice: {
        id: number
        invoice_number: string
        issue_date: string | null
        period_from: string | null
        period_to: string | null
        total_amount: number
        status: 'draft' | 'issued' | 'paid'
        paid_at: string | null
        notes: string | null
        organization: any
        items: Item[]
    }
}

// Data penerbit (LPK) & rekening — sesuai format seikyuusho PDF.
const ISSUER = {
    heading: '日本語教育センター及び送り出し機関',
    name: 'PT OOSAKA GAKKOU INDONESIA',
    postal: '〒64173',
    address: ['Jl. Raya Wates Kediri RT 008 RW 00', 'Desa Ngletih Kec. Kandat Kab. Kediri, Jawa Timur'],
}
const BANK = [
    { label: 'NAME', sub: '（英語会社名）', value: ['PT OOSAKA GAKKOU INDONESIA'] },
    { label: 'ADDRESS', sub: '（所在地）', value: ['Jl. Raya Wates Kediri RT 008 RW 00', 'Desa Ngletih Kec. Kandat Kab. Kediri, Jawa Timur 64173'] },
    { label: 'Company Office Number', sub: '（電話番号）', value: ['+62-857-4594-5292'] },
    { label: 'ACCOUNT NO.', sub: '（口座番号）', value: ['710636903'] },
    { label: "BENEFICIARY'S BANK", sub: '（送金先銀行名）', value: ['BANK NEGARA INDONESIA'] },
    { label: 'Swift BIC Code', sub: '', value: ['BNINIDJAXXX'] },
    { label: 'Account Opening Bank Address', sub: '（銀行所在地）', value: ['Jl. Brawijaya No.17, Pakelan, Kec. Kota, Kota Kediri, Jawa Timur 64129'] },
]

const yen = (n: number) => (n ?? 0).toLocaleString('ja-JP') + '円'
const fmtJpDate = (d: string | null) => {
    if (!d) return '-'
    const dt = new Date(d)
    return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`
}
const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'

const statusMap: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-zinc-100 text-zinc-600' },
    issued: { label: 'Belum Lunas', cls: 'bg-amber-100 text-amber-700' },
    paid: { label: 'Lunas', cls: 'bg-emerald-100 text-emerald-700' },
}

// 品名 utama per baris (nama perusahaan + label jenis tagihan).
const itemTitle = (it: Item) => {
    if (it.kind === 'travel') return `${it.company_name} 渡航費`
    if (it.kind === 'pre_education') return `${it.company_name} 事前教育費`
    return `${it.company_name} ${it.people}人`
}

export default function InvoiceShow({ invoice }: Props) {
    const breadcrumbs = [
        { title: 'Data Penagihan', href: '/admin/invoices' },
        { title: invoice.invoice_number, href: '#' },
    ]
    const org = invoice.organization || {}

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="max-w-3xl mx-auto p-4 lg:p-8 flex flex-col gap-6">
                {/* Toolbar (tidak ikut tercetak) */}
                <div className="flex items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tabular-nums">{invoice.invoice_number}</h1>
                            <Badge variant="secondary" className={statusMap[invoice.status]?.cls}>
                                {statusMap[invoice.status]?.label}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => router.get('/admin/invoices')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                        </Button>
                        <Button variant="outline" onClick={() => window.open(`/admin/invoices/${invoice.id}/print`, '_blank')}>
                            <FileDown className="mr-2 h-4 w-4" /> Export PDF
                        </Button>
                        {invoice.status !== 'paid' ? (
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => confirm('Tandai invoice ini LUNAS?') && router.patch(`/admin/invoices/${invoice.id}/mark-paid`)}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Tandai Lunas
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => router.patch(`/admin/invoices/${invoice.id}/mark-unpaid`)}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" /> Batalkan Lunas
                            </Button>
                        )}
                    </div>
                </div>

                {/* Lembar seikyuusho (請求書) */}
                <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 p-8 shadow-sm font-japanese text-zinc-900 dark:text-zinc-100">
                    {/* Baris atas: nomor (kiri) & tanggal (kanan) */}
                    <div className="flex justify-between items-start text-sm">
                        <p>請求番号：<span className="tabular-nums font-semibold">{invoice.invoice_number}</span></p>
                        <p>請求日：{fmtJpDate(invoice.issue_date)}</p>
                    </div>

                    {/* Judul */}
                    <h2 className="text-center text-2xl font-bold tracking-[0.3em] my-4">請求書</h2>

                    {/* Penerima (kiri) & penerbit (kanan) */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                            <p className="text-lg font-bold border-b border-zinc-400 inline-block pb-0.5">
                                {org.name_in_japanese || org.name} 御中
                            </p>
                            <p className="text-sm mt-2">下記のとおりご請求申し上げます。</p>
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold">{ISSUER.heading}</p>
                            <p className="font-bold">{ISSUER.name}</p>
                            <p className="mt-2">{ISSUER.postal}</p>
                            {ISSUER.address.map((line, i) => (
                                <p key={i} className="text-xs text-muted-foreground">{line}</p>
                            ))}
                        </div>
                    </div>

                    {/* Tabel rincian */}
                    <table className="w-full text-sm border border-zinc-300 dark:border-zinc-700">
                        <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs">
                            <tr className="[&>th]:border [&>th]:border-zinc-300 dark:[&>th]:border-zinc-700 [&>th]:py-2 [&>th]:px-2">
                                <th className="w-10 text-center">番号</th>
                                <th className="text-left">品名</th>
                                <th className="w-20 text-center">数量</th>
                                <th className="w-24 text-right">単価</th>
                                <th className="w-28 text-right">金額</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((it, idx) => (
                                <tr key={it.id} className="[&>td]:border [&>td]:border-zinc-300 dark:[&>td]:border-zinc-700 [&>td]:py-2 [&>td]:px-2 align-top">
                                    <td className="text-center tabular-nums">{idx + 1}</td>
                                    <td>
                                        <p className="font-semibold">{itemTitle(it)}</p>
                                        {it.kind === 'management' && it.description && (
                                            <p className="text-[11px] text-muted-foreground">{it.description}</p>
                                        )}
                                        {it.students.length > 0 && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                対象者: {it.students.join('、')}
                                            </p>
                                        )}
                                    </td>
                                    <td className="text-center tabular-nums">{it.people}名</td>
                                    <td className="text-right tabular-nums">{yen(it.unit_price)}</td>
                                    <td className="text-right font-semibold tabular-nums">{yen(it.amount)}</td>
                                </tr>
                            ))}
                            <tr className="[&>td]:border [&>td]:border-zinc-300 dark:[&>td]:border-zinc-700 [&>td]:py-3 [&>td]:px-2 font-bold">
                                <td colSpan={4} className="text-center">合計</td>
                                <td className="text-right tabular-nums">{yen(invoice.total_amount)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Informasi pembayaran (振込先) */}
                    <p className="mt-8 mb-2 font-bold">振込先：</p>
                    <table className="w-full text-xs border border-zinc-300 dark:border-zinc-700">
                        <tbody>
                            {BANK.map((row) => (
                                <tr key={row.label} className="[&>td]:border [&>td]:border-zinc-300 dark:[&>td]:border-zinc-700 [&>td]:py-2 [&>td]:px-3 align-top">
                                    <td className="w-1/3 font-semibold">
                                        {row.label}
                                        {row.sub && <span className="block text-muted-foreground font-normal">{row.sub}</span>}
                                    </td>
                                    <td>
                                        {row.value.map((v, i) => (
                                            <span key={i} className="block">{v}</span>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {invoice.status === 'paid' && (
                        <p className="mt-4 text-sm text-emerald-600 font-semibold print:hidden">✓ Lunas pada {fmtDate(invoice.paid_at)}</p>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
