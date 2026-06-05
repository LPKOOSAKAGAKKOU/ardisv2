import AppLayout from '@/layouts/app-layout'
import { Head, Link } from '@inertiajs/react'
import { Plane, ArrowLeft, Edit, Users, CalendarClock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Block {
    index: number
    months: number
    people: number
    unit_price: number
    amount: number
    period_from: string
    period_to: string
    bill_date: string
}
interface Props {
    departure: {
        id: number
        company_name: string
        organization: string | null
        departure_date: string | null
        people_count: number
        travel_cost: number
        status: string
        notes: string | null
    }
    schedule: Block[]
    summary: {
        pre_education_total: number
        management_unit_price: number
        first_billing_date: string | null
        end_date: string | null
        total_management_fee: number
        total_billings: number
    }
}

const yen = (n: number) => '¥' + (n ?? 0).toLocaleString('ja-JP')
const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const fmtMonth = (d: string) => new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

export default function DepartureShow({ departure, schedule, summary }: Props) {
    const breadcrumbs = [
        { title: 'Data Keberangkatan', href: '/admin/departures' },
        { title: departure.company_name, href: '#' },
    ]
    const today = new Date()

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Keberangkatan ${departure.company_name}`} />

            <div className="max-w-5xl mx-auto p-4 lg:p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-600 rounded-xl text-white shadow-lg shadow-sky-500/20">
                            <Plane size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-japanese">{departure.company_name}</h1>
                            <p className="text-sm text-muted-foreground">
                                {departure.organization || '-'} • Berangkat {fmtDate(departure.departure_date)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/departures">
                            <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Button>
                        </Link>
                        <Link href={`/admin/departures/${departure.id}/edit`}>
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatBox icon={<Users size={16} />} label="Jumlah Orang" value={departure.people_count.toString()} />
                    <StatBox icon={<CalendarClock size={16} />} label="Tagihan Pertama" value={fmtDate(summary.first_billing_date)} />
                    <StatBox icon={<CalendarClock size={16} />} label="Tagihan Berakhir" value={fmtDate(summary.end_date)} />
                    <StatBox icon={<CheckCircle2 size={16} />} label="Total Management Fee" value={yen(summary.total_management_fee)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <InfoRow label="Biaya Pra-Edukasi (total)" value={yen(summary.pre_education_total)} />
                    <InfoRow label="Management Fee / orang / bln" value={yen(summary.management_unit_price)} />
                    <InfoRow label="Biaya Tiket / 渡航費" value={yen(departure.travel_cost)} />
                </div>

                {departure.notes && (
                    <div className="rounded-xl border border-sidebar-border bg-white dark:bg-zinc-950 p-4 text-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Catatan</p>
                        {departure.notes}
                    </div>
                )}

                <div>
                    <h2 className="text-sm font-bold mb-3">Jadwal Penagihan ({summary.total_billings}x)</h2>
                    <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                                <tr>
                                    <th className="px-5 py-3">#</th>
                                    <th className="px-5 py-3">Periode</th>
                                    <th className="px-5 py-3 text-center">Bulan</th>
                                    <th className="px-5 py-3 text-center">Tgl Tagih</th>
                                    <th className="px-5 py-3 text-right">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {schedule.map((b) => {
                                    const past = new Date(b.bill_date) <= today
                                    return (
                                        <tr key={b.index} className={past ? 'bg-emerald-50/40 dark:bg-emerald-900/10' : ''}>
                                            <td className="px-5 py-3 text-muted-foreground">{b.index}</td>
                                            <td className="px-5 py-3">{fmtMonth(b.period_from)}</td>
                                            <td className="px-5 py-3 text-center">{b.months}</td>
                                            <td className="px-5 py-3 text-center text-xs">{fmtDate(b.bill_date)}</td>
                                            <td className="px-5 py-3 text-right font-semibold tabular-nums">{yen(b.amount)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-sidebar-border font-bold">
                                    <td className="px-5 py-3" colSpan={4}>Total</td>
                                    <td className="px-5 py-3 text-right tabular-nums">{yen(summary.total_management_fee)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-xl border border-sidebar-border bg-white dark:bg-zinc-950 p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{label}</span>
            </div>
            <p className="text-lg font-bold">{value}</p>
        </div>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-sidebar-border bg-white dark:bg-zinc-950 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="font-semibold tabular-nums">{value}</p>
        </div>
    )
}
