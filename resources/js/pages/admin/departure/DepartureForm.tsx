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
}
interface Props {
    departure?: any
    organizations: Org[]
    companies: Company[]
    interviews: InterviewOption[]
}

const NONE = 'none'

export default function DepartureForm({ departure, organizations, companies, interviews }: Props) {
    const isEdit = !!departure

    const { data, setData, post, patch, processing, errors } = useForm({
        accepting_organization_id: departure?.accepting_organization_id?.toString() || '',
        company_id: departure?.company_id?.toString() || '',
        interview_id: departure?.interview_id?.toString() || '',
        company_name: departure?.company_name || '',
        departure_date: departure?.departure_date?.slice(0, 10) || '',
        travel_cost: departure?.travel_cost?.toString() || '0',
        pre_education_fee: departure?.pre_education_fee?.toString() || '',
        management_fee: departure?.management_fee?.toString() || '',
        notes: departure?.notes || '',
        status: departure?.status || 'managing',
    })

    const selectedOrg = organizations.find((o) => o.id.toString() === data.accepting_organization_id)
    const selectedInterview = interviews.find((iv) => iv.id.toString() === data.interview_id)
    const peopleCount = selectedInterview ? selectedInterview.people : departure?.people_count ?? 1

    const breadcrumbs = [
        { title: 'Data Keberangkatan', href: '/admin/departures' },
        { title: isEdit ? 'Edit' : 'Tambah', href: '#' },
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        isEdit ? patch(`/admin/departures/${departure.id}`) : post('/admin/departures')
    }

    const onPickCompany = (id: string) => {
        setData('company_id', id)
        const c = companies.find((x) => x.id.toString() === id)
        if (c) setData('company_name', c.name_in_japanese || c.name)
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Organisasi Penerima</Label>
                            <Select value={data.accepting_organization_id} onValueChange={(v) => setData('accepting_organization_id', v)}>
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
                            <Select value={data.company_id} onValueChange={onPickCompany}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Pilih perusahaan" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[320px]">
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()} className="font-japanese">
                                            {c.name_in_japanese || c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                value={data.company_name}
                                onChange={(e) => setData('company_name', e.target.value)}
                                placeholder="atau ketik nama perusahaan manual"
                                className="h-10 font-japanese"
                            />
                            {errors.company_name && <p className="text-xs text-red-500">{errors.company_name}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Wawancara Terkait (sumber daftar siswa)</Label>
                            <Select
                                value={data.interview_id || NONE}
                                onValueChange={(v) => setData('interview_id', v === NONE ? '' : v)}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Pilih wawancara (opsional)" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[320px]">
                                    <SelectItem value={NONE}>— Tidak ditautkan —</SelectItem>
                                    {interviews.map((iv) => (
                                        <SelectItem key={iv.id} value={iv.id.toString()} className="font-japanese">
                                            {iv.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                                Siswa peserta wawancara yang lulus akan otomatis terhubung ke keberangkatan ini.
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
