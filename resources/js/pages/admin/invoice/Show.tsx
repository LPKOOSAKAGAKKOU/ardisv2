import AppLayout from '@/layouts/app-layout'
import { Head, router } from '@inertiajs/react'
import { Receipt, ArrowLeft, CheckCircle2, RotateCcw, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Item {
    id: number
    company_name: string
    description: string | null
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

const yen = (n: number) => '¥' + (n ?? 0).toLocaleString('ja-JP')
const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'

const statusMap: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-zinc-100 text-zinc-600' },
    issued: { label: 'Belum Lunas', cls: 'bg-amber-100 text-amber-700' },
    paid: { label: 'Lunas', cls: 'bg-emerald-100 text-emerald-700' },
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
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> Cetak
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

                <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-bold tracking-wide">請 求 書</h2>
                            <p className="text-sm text-muted-foreground mt-1">INVOICE</p>
                        </div>
                        <div className="text-right text-sm">
                            <p><span className="text-muted-foreground">請求番号：</span><span className="tabular-nums font-semibold">{invoice.invoice_number}</span></p>
                            <p><span className="text-muted-foreground">請求日：</span>{fmtDate(invoice.issue_date)}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-lg font-bold font-japanese">{org.name_in_japanese || org.name} 御中</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            請求期間: {fmtDate(invoice.period_from)} 〜 {fmtDate(invoice.period_to)}
                        </p>
                    </div>

                    <table className="w-full text-left text-sm border-t border-sidebar-border">
                        <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                            <tr>
                                <th className="py-3">品名</th>
                                <th className="py-3 text-center">数量</th>
                                <th className="py-3 text-center">期間</th>
                                <th className="py-3 text-right">単価</th>
                                <th className="py-3 text-right">金額</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border">
                            {invoice.items.map((it) => (
                                <tr key={it.id}>
                                    <td className="py-3">
                                        <p className="font-semibold font-japanese">{it.company_name} {it.people}人</p>
                                        <p className="text-[11px] text-muted-foreground font-japanese">{it.description}</p>
                                    </td>
                                    <td className="py-3 text-center">{it.people}</td>
                                    <td className="py-3 text-center">{it.months}ヶ月</td>
                                    <td className="py-3 text-right tabular-nums">{yen(it.unit_price)}</td>
                                    <td className="py-3 text-right font-semibold tabular-nums">{yen(it.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-foreground/20 font-bold text-base">
                                <td className="py-4" colSpan={4}>合計</td>
                                <td className="py-4 text-right tabular-nums">{yen(invoice.total_amount)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    {invoice.status === 'paid' && (
                        <p className="mt-4 text-sm text-emerald-600 font-semibold">✓ Lunas pada {fmtDate(invoice.paid_at)}</p>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
