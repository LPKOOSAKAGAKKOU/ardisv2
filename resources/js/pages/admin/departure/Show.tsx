import AppLayout from '@/layouts/app-layout'
import { Head, Link, useForm } from '@inertiajs/react'
import { Plane, ArrowLeft, Edit, Users, CalendarClock, CheckCircle2, Trash2, Plus, Save, Wallet } from 'lucide-react'
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
interface Billing {
    id?: number
    kind: 'travel' | 'shoukairyou' | 'other'
    description: string | null
    due_date: string | null
    people: number
    unit_price: number
    amount: number
    bill_to: 'organization' | 'company'
}
interface Props {
    departure: {
        id: number
        company_name: string
        company_id: number | null
        organization: string | null
        program_type: 'ginou_jisshuu' | 'tokutei_ginou'
        departure_date: string | null
        people_count: number
        travel_cost: number
        shoukairyou_fee: number | null
        status: string
        notes: string | null
        interview_id: number | null
        students: string[]
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
    billings: Billing[]
    recipients: { organization: string | null; company: string | null }
}

const yen = (n: number) => '¥' + (n ?? 0).toLocaleString('ja-JP')
const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const fmtMonth = (d: string) => new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

// Tambah n bulan ke tanggal YYYY-MM-DD (client-side), kembalikan YYYY-MM-DD.
const addMonths = (iso: string, n: number) => {
    const d = new Date(iso)
    d.setMonth(d.getMonth() + n)
    return d.toISOString().slice(0, 10)
}

export default function DepartureShow({ departure, schedule, summary, billings, recipients }: Props) {
    const breadcrumbs = [
        { title: 'Data Keberangkatan', href: '/admin/departures' },
        { title: departure.company_name, href: '#' },
    ]
    const today = new Date()
    const isTG = departure.program_type === 'tokutei_ginou'

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

                {isTG ? (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatBox icon={<Wallet size={16} />} label="Tipe Program" value="特定技能 (TG)" />
                            <StatBox icon={<Users size={16} />} label="Jumlah Orang" value={departure.people_count.toString()} />
                            <StatBox icon={<CheckCircle2 size={16} />} label="紹介料 / orang" value={yen(departure.shoukairyou_fee ?? 0)} />
                            <StatBox icon={<Plane size={16} />} label="渡航費" value={yen(departure.travel_cost)} />
                        </div>
                    </>
                ) : (
                    <>
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
                    </>
                )}

                <div className="rounded-xl border border-sidebar-border bg-white dark:bg-zinc-950 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                        Siswa ({departure.students.length})
                    </p>
                    {departure.students.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {departure.students.map((name, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-900/20 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-300"
                                >
                                    <Users size={12} /> {name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            Belum ada siswa tertaut. Tautkan wawancara lewat tombol Edit untuk menampilkan daftar siswa.
                        </p>
                    )}
                </div>

                {departure.notes && (
                    <div className="rounded-xl border border-sidebar-border bg-white dark:bg-zinc-950 p-4 text-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Catatan</p>
                        {departure.notes}
                    </div>
                )}

                {isTG ? (
                    <TgBillingEditor departure={departure} billings={billings} recipients={recipients} />
                ) : (
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
                )}
            </div>
        </AppLayout>
    )
}

const KIND_LABEL: Record<string, string> = {
    travel: '渡航費 (Tiket)',
    shoukairyou: '紹介料 (Pengenalan)',
    other: 'Lainnya',
}

function TgBillingEditor({
    departure,
    billings,
    recipients,
}: {
    departure: Props['departure']
    billings: Billing[]
    recipients: Props['recipients']
}) {
    const dep = departure.departure_date?.slice(0, 10) || new Date().toISOString().slice(0, 10)
    const fee = departure.shoukairyou_fee ?? 0
    const people = departure.people_count || 1
    const travel = departure.travel_cost || 0

    const { data, setData, post, processing } = useForm<{ billings: Billing[] }>({
        billings: billings.length ? billings.map((b) => ({ ...b })) : [],
    })

    const rows = data.billings
    const setRows = (next: Billing[]) => setData('billings', next)

    const newRow = (over: Partial<Billing> = {}): Billing => ({
        kind: 'shoukairyou',
        description: '',
        due_date: dep,
        people,
        unit_price: fee,
        amount: fee * people,
        bill_to: 'company',
        ...over,
    })

    const updateRow = (i: number, patch: Partial<Billing>) => {
        const next = rows.map((r, idx) => {
            if (idx !== i) return r
            const merged = { ...r, ...patch }
            merged.amount = (Number(merged.people) || 0) * (Number(merged.unit_price) || 0)
            return merged
        })
        setRows(next)
    }

    const addRow = () => setRows([...rows, newRow()])
    const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i))

    // Preset: bayar kontan saat berangkat (渡航費 jika ada + 紹介料 penuh).
    const presetKontan = () => {
        const next: Billing[] = []
        if (travel > 0) next.push(newRow({ kind: 'travel', unit_price: travel, amount: travel * people }))
        next.push(newRow({ kind: 'shoukairyou', unit_price: fee, amount: fee * people }))
        setRows(next)
    }

    // Preset: 紹介料 dibayar 50% saat berangkat + 50% enam bulan kemudian.
    const presetHalf = () => {
        const half1 = Math.round(fee / 2)
        const half2 = fee - half1
        const next: Billing[] = []
        if (travel > 0) next.push(newRow({ kind: 'travel', unit_price: travel, amount: travel * people }))
        next.push(newRow({ kind: 'shoukairyou', description: '紹介料 (50%)', due_date: dep, unit_price: half1, amount: half1 * people }))
        next.push(newRow({ kind: 'shoukairyou', description: '紹介料 (50%)', due_date: addMonths(dep, 6), unit_price: half2, amount: half2 * people }))
        setRows(next)
    }

    const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)

    const save = () => post(`/admin/departures/${departure.id}/billings`, { preserveScroll: true })

    const inputCls = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm'

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-bold">Cicilan Penagihan TG ({rows.length} item)</h2>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={presetKontan}>Preset: Kontan</Button>
                    <Button type="button" variant="outline" size="sm" onClick={presetHalf}>Preset: 50% + 50% (6 bln)</Button>
                    <Button type="button" variant="outline" size="sm" onClick={addRow}><Plus className="mr-1 h-4 w-4" /> Baris</Button>
                </div>
            </div>

            <p className="text-[11px] text-muted-foreground mb-3">
                Tarif <span className="font-semibold">per orang</span>; jumlah = tarif × orang. Tiap baris bisa ditujukan ke
                organisasi <span className="font-japanese">{recipients.organization || '-'}</span> atau langsung ke perusahaan
                <span className="font-japanese"> {recipients.company || '-'}</span>. Invoice dibuat per bulan jatuh tempo lewat menu Penagihan.
            </p>

            <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-sidebar-border">
                            <tr>
                                <th className="px-3 py-3 min-w-[130px]">Jenis</th>
                                <th className="px-3 py-3 min-w-[140px]">Keterangan</th>
                                <th className="px-3 py-3 min-w-[140px]">Jatuh Tempo</th>
                                <th className="px-3 py-3 text-center w-20">Orang</th>
                                <th className="px-3 py-3 text-right w-28">Tarif/orang</th>
                                <th className="px-3 py-3 min-w-[140px]">Ditagih ke</th>
                                <th className="px-3 py-3 text-right w-28">Jumlah</th>
                                <th className="px-3 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border">
                            {rows.length > 0 ? (
                                rows.map((r, i) => (
                                    <tr key={i} className="align-top">
                                        <td className="px-3 py-2">
                                            <select value={r.kind} onChange={(e) => updateRow(i, { kind: e.target.value as Billing['kind'] })} className={inputCls}>
                                                {Object.entries(KIND_LABEL).map(([k, label]) => (
                                                    <option key={k} value={k}>{label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="text" value={r.description ?? ''} onChange={(e) => updateRow(i, { description: e.target.value })} placeholder="opsional" className={inputCls} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="date" value={r.due_date ?? ''} onChange={(e) => updateRow(i, { due_date: e.target.value })} className={inputCls} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="number" min={1} value={r.people} onChange={(e) => updateRow(i, { people: Number(e.target.value) })} className={`${inputCls} text-center`} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="number" min={0} value={r.unit_price} onChange={(e) => updateRow(i, { unit_price: Number(e.target.value) })} className={`${inputCls} text-right`} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <select value={r.bill_to} onChange={(e) => updateRow(i, { bill_to: e.target.value as Billing['bill_to'] })} className={inputCls}>
                                                <option value="organization">Organisasi (Kumiai)</option>
                                                <option value="company">Perusahaan</option>
                                            </select>
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold tabular-nums">{yen((Number(r.people) || 0) * (Number(r.unit_price) || 0))}</td>
                                        <td className="px-3 py-2 text-center">
                                            <button type="button" onClick={() => removeRow(i)} className="text-red-500 hover:text-red-600">
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground italic">
                                        Belum ada cicilan. Pakai preset di atas atau tambah baris manual.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-sidebar-border font-bold">
                                <td className="px-3 py-3" colSpan={6}>Total</td>
                                <td className="px-3 py-3 text-right tabular-nums">{yen(total)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="flex justify-end mt-4">
                <Button onClick={save} disabled={processing} className="bg-sky-600 hover:bg-sky-700 text-white min-w-[160px] h-11">
                    <Save className="mr-2 h-4 w-4" /> {processing ? 'Menyimpan...' : 'Simpan Cicilan'}
                </Button>
            </div>
        </div>
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
