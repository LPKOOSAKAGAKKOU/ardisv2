import AppLayout from '@/layouts/app-layout'
import { Head, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plane } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface Org {
    id: number
    name: string
    pre_education_fee: number
    management_fee: number
}
interface Company {
    id: number
    name: string
    name_in_japanese: string | null
}
interface InterviewOption {
    id: number
    label: string
    people: number
    company_id: number | null
    company_name: string | null
    accepting_organization_id: number | null
    program_type: 'ginou_jisshuu' | 'tokutei_ginou'
}
interface Props {
    departure?: any
    organizations: Org[]
    companies: Company[]
    interviews: InterviewOption[]
}

const NONE = 'none'

export default function DepartureForm({ departure, organizations, interviews }: Props) {
    const isEdit = !!departure

    const { data, setData, post, patch, processing, errors } = useForm({
        accepting_organization_id: departure?.accepting_organization_id?.toString() || '',
        company_id: departure?.company_id?.toString() || '',
        interview_id: departure?.interview_id?.toString() || '',
        program_type: departure?.program_type || 'ginou_jisshuu',
        company_name: departure?.company_name || '',
        departure_date: departure?.departure_date?.slice(0, 10) || '',
        travel_cost: departure?.travel_cost?.toString() || '0',
        pre_education_fee: departure?.pre_education_fee?.toString() || '',
        shoukairyou_fee: departure?.shoukairyou_fee?.toString() || '',
        management_fee: departure?.management_fee?.toString() || '',
        notes: departure?.notes || '',
        status: departure?.status || 'managing',
    })

    const selectedOrg = organizations.find((o) => o.id.toString() === data.accepting_organization_id)
    const selectedInterview = interviews.find((iv) => iv.id.toString() === data.interview_id)
    const peopleCount = selectedInterview ? selectedInterview.people : departure?.people_count ?? 1

    // Tipe program ikut wawancara yang ditautkan (sumber kebenaran). Tanpa
    // wawancara, admin memilih manual sebagai fallback.
    const programType = selectedInterview ? selectedInterview.program_type : data.program_type
    const programLocked = !!selectedInterview
    const isTG = programType === 'tokutei_ginou'

    // Hanya wawancara milik kumiai (organisasi) yang dipilih.
    const orgInterviews = interviews.filter(
        (iv) => iv.accepting_organization_id?.toString() === data.accepting_organization_id,
    )

    // Perusahaan yang punya koneksi dengan kumiai tsb (muncul di daftar wawancara), unik.
    const availableCompanies = Array.from(
        new Map(
            orgInterviews
                .filter((iv) => iv.company_id != null)
                .map((iv) => [iv.company_id, { id: iv.company_id as number, name: iv.company_name || '-' }]),
        ).values(),
    )

    // Wawancara yang ditampilkan: difilter lagi ke perusahaan terpilih (jika ada).
    const availableInterviews = orgInterviews.filter(
        (iv) => !data.company_id || iv.company_id?.toString() === data.company_id,
    )

    const breadcrumbs = [
        { title: 'Data Keberangkatan', href: '/admin/departures' },
        { title: isEdit ? 'Edit' : 'Tambah', href: '#' },
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        isEdit ? patch(`/admin/departures/${departure.id}`) : post('/admin/departures')
    }

    // Ganti kumiai → reset perusahaan & wawancara agar tidak campur.
    const onPickOrg = (v: string) => {
        setData({ ...data, accepting_organization_id: v, company_id: '', company_name: '', interview_id: '' })
    }

    const onPickCompany = (id: string) => {
        const c = availableCompanies.find((x) => x.id.toString() === id)
        setData({ ...data, company_id: id, company_name: c?.name || data.company_name, interview_id: '' })
    }

    const Label = ({ children }: { children: React.ReactNode }) => (
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{children}</label>
    )

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Keberangkatan' : 'Tambah Keberangkatan'} />

            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <div className="mb-6 flex items-center gap-4">
                    <div className="p-3 bg-sky-600 rounded-xl text-white shadow-lg shadow-sky-500/20">
                        <Plane size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{isEdit ? 'Edit Keberangkatan' : 'Tambah Keberangkatan'}</h1>
                        <p className="text-sm text-muted-foreground">Data dasar untuk perhitungan penagihan management fee.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-sidebar-border shadow-sm">
                    {/* Tipe program: ikut wawancara bila ditautkan, manual bila tidak. */}
                    <div className="space-y-2">
                        <Label>Tipe Program</Label>
                        {programLocked ? (
                            <div className={`flex items-center gap-3 rounded-xl border p-4 ${isTG ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'}`}>
                                <div>
                                    <p className="font-semibold text-sm">
                                        {isTG ? '特定技能 / Tokutei Ginou (TG)' : '技能実習 / Ginou Jisshuu'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Mengikuti tipe wawancara yang ditautkan.
                                        {isTG ? ' Cicilan 渡航費 + 紹介料 diatur di halaman detail.' : ' Penagihan management fee otomatis (siklus 3 bulan).'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setData('program_type', 'ginou_jisshuu')}
                                        className={`rounded-xl border p-4 text-left transition-colors ${!isTG ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30' : 'border-sidebar-border hover:bg-muted/40'}`}
                                    >
                                        <p className="font-semibold text-sm">技能実習 / Ginou Jisshuu</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Magang. Penagihan management fee otomatis (siklus 3 bulan).</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('program_type', 'tokutei_ginou')}
                                        className={`rounded-xl border p-4 text-left transition-colors ${isTG ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-sidebar-border hover:bg-muted/40'}`}
                                    >
                                        <p className="font-semibold text-sm">特定技能 / Tokutei Ginou (TG)</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Hanya 渡航費 + 紹介料. Cicilan diatur manual di halaman detail.</p>
                                    </button>
                                </div>
                                <p className="text-[11px] text-muted-foreground">Tautkan wawancara di bawah agar tipe ini terisi otomatis.</p>
                            </>
                        )}
                        {errors.program_type && <p className="text-xs text-red-500">{errors.program_type}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Organisasi Penerima (Kumiai)</Label>
                            <Select value={data.accepting_organization_id} onValueChange={onPickOrg}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Pilih organisasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map((o) => (
                                        <SelectItem key={o.id} value={o.id.toString()}>
                                            {o.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.accepting_organization_id && <p className="text-xs text-red-500">{errors.accepting_organization_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Perusahaan Penerima (実習実施者)</Label>
                            <Select value={data.company_id} onValueChange={onPickCompany} disabled={!data.accepting_organization_id}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder={data.accepting_organization_id ? 'Pilih perusahaan' : 'Pilih kumiai dulu'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[320px]">
                                    {availableCompanies.length > 0 ? (
                                        availableCompanies.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()} className="font-japanese">
                                                {c.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-2 py-2 text-xs text-muted-foreground">
                                            Belum ada perusahaan dengan wawancara di kumiai ini.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            {errors.company_id && <p className="text-xs text-red-500">{errors.company_id}</p>}
                            {errors.company_name && <p className="text-xs text-red-500">{errors.company_name}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Wawancara Terkait (sumber daftar siswa)</Label>
                            <Select
                                value={data.interview_id || NONE}
                                onValueChange={(v) => {
                                    if (v === NONE) {
                                        setData('interview_id', '')
                                        return
                                    }
                                    const iv = interviews.find((x) => x.id.toString() === v)
                                    setData((prev) => ({
                                        ...prev,
                                        interview_id: v,
                                        program_type: iv?.program_type || prev.program_type,
                                    }))
                                }}
                                disabled={!data.accepting_organization_id}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder={data.accepting_organization_id ? 'Pilih wawancara (opsional)' : 'Pilih kumiai dulu'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[320px]">
                                    <SelectItem value={NONE}>— Tidak ditautkan —</SelectItem>
                                    {availableInterviews.map((iv) => (
                                        <SelectItem key={iv.id} value={iv.id.toString()} className="font-japanese">
                                            {iv.label} ({iv.people} siswa)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                                Hanya wawancara milik kumiai
                                {data.company_id ? ' & perusahaan' : ''} terpilih yang muncul. Siswa peserta wawancara yang lulus otomatis terhubung ke keberangkatan ini.
                            </p>
                            {errors.interview_id && <p className="text-xs text-red-500">{errors.interview_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Tanggal Keberangkatan</Label>
                            <Input type="date" value={data.departure_date} onChange={(e) => setData('departure_date', e.target.value)} className="h-11" />
                            {errors.departure_date && <p className="text-xs text-red-500">{errors.departure_date}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Jumlah Orang (otomatis)</Label>
                            <div className="flex h-11 items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                                <span className="font-semibold">{peopleCount}</span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {selectedInterview ? 'dari siswa wawancara' : 'tautkan wawancara untuk menghitung otomatis'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Biaya Tiket / 渡航費 (¥)</Label>
                            <Input type="number" min={0} value={data.travel_cost} onChange={(e) => setData('travel_cost', e.target.value)} className="h-11" />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="managing">Dikelola</SelectItem>
                                    <SelectItem value="completed">Selesai</SelectItem>
                                    <SelectItem value="cancelled">Batal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <hr className="border-sidebar-border" />

                    {isTG ? (
                        <div>
                            <p className="text-sm font-semibold mb-1">Biaya TG</p>
                            <p className="text-xs text-muted-foreground mb-4">
                                紹介料 (biaya pengenalan tenaga kerja) per orang dipakai sebagai dasar preset cicilan di halaman detail keberangkatan. Biaya tiket diisi di atas (渡航費).
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>紹介料 / Shoukairyou (¥ / orang)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.shoukairyou_fee}
                                        onChange={(e) => setData('shoukairyou_fee', e.target.value)}
                                        placeholder="contoh: 200000"
                                        className="h-11"
                                    />
                                    {errors.shoukairyou_fee && <p className="text-xs text-red-500">{errors.shoukairyou_fee}</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm font-semibold mb-1">Override Tarif (opsional)</p>
                            <p className="text-xs text-muted-foreground mb-4">
                                Kosongkan untuk memakai tarif default organisasi
                                {selectedOrg ? ` (pra-edukasi ¥${selectedOrg.pre_education_fee.toLocaleString('ja-JP')} / kelola ¥${selectedOrg.management_fee.toLocaleString('ja-JP')}/bln)` : ''}.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Biaya Pra-Edukasi (¥ / orang)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.pre_education_fee}
                                        onChange={(e) => setData('pre_education_fee', e.target.value)}
                                        placeholder={selectedOrg ? selectedOrg.pre_education_fee.toString() : '15000'}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Management Fee (¥ / orang / bln)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.management_fee}
                                        onChange={(e) => setData('management_fee', e.target.value)}
                                        placeholder={selectedOrg ? selectedOrg.management_fee.toString() : '5000'}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Catatan / Nama Intern (備考)</Label>
                        <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="resize-none" placeholder="BIMO, NURUL, ..." />
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-sidebar-border">
                        <Button variant="ghost" type="button" onClick={() => window.history.back()}>
                            Batal
                        </Button>
                        <Button disabled={processing} className="bg-sky-600 hover:bg-sky-700 text-white min-w-[150px] h-11">
                            {processing ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    )
}
