import AppLayout from '@/layouts/app-layout'
import { Head, Link, useForm } from '@inertiajs/react'
import { PlaneLanding, ArrowLeft, Save, CheckCircle2, AlertCircle, Building2, Calendar, UserCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StudentItem {
    id: number
    name: string
    nik: string
    is_returned: boolean
}

interface DepartureOption {
    id: number
    company_name: string
    organization: string
    departure_date: string | null
    people_count: number
    status: string
    students: StudentItem[]
}

interface ReturnRecord {
    id: number
    departure_id: number
    user_id: number | null
    return_date: string | null
    reason: string
    notes: string | null
}

interface Props {
    departures: DepartureOption[]
    selected_departure_id?: number | null
    returnRecord?: ReturnRecord
}

export default function ReturnForm({ departures, selected_departure_id, returnRecord }: Props) {
    const isEdit = !!returnRecord

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Data Kepulangan', href: '/admin/returns' },
        { title: isEdit ? 'Edit Kepulangan' : 'Catat Kepulangan', href: '#' },
    ]

    const initialDepartureId = returnRecord?.departure_id || selected_departure_id || (departures[0]?.id ?? '')

    const { data, setData, post, put, processing, errors } = useForm({
        departure_id: initialDepartureId,
        user_ids: returnRecord?.user_id ? [returnRecord.user_id] : ([] as number[]),
        return_date: returnRecord?.return_date || new Date().toISOString().split('T')[0],
        reason: returnRecord?.reason || 'finished',
        notes: returnRecord?.notes || '',
    })

    const [currentDeparture, setCurrentDeparture] = useState<DepartureOption | null>(null)

    useEffect(() => {
        const found = departures.find((d) => d.id === Number(data.departure_id))
        setCurrentDeparture(found || null)
    }, [data.departure_id, departures])

    const handleStudentToggle = (userId: number) => {
        if (data.user_ids.includes(userId)) {
            setData('user_ids', data.user_ids.filter((id) => id !== userId))
        } else {
            setData('user_ids', [...data.user_ids, userId])
        }
    }

    const handleSelectAllStudents = () => {
        if (!currentDeparture) return
        const activeStudentIds = currentDeparture.students
            .filter((s) => !s.is_returned || (isEdit && s.id === returnRecord?.user_id))
            .map((s) => s.id)
        setData('user_ids', activeStudentIds)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEdit) {
            put(`/admin/returns/${returnRecord.id}`)
        } else {
            post('/admin/returns')
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Data Kepulangan' : 'Catat Kepulangan Siswa'} />

            <div className="mx-auto max-w-4xl p-4 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/returns">
                            <Button variant="outline" size="icon" className="h-10 w-10">
                                <ArrowLeft size={18} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                {isEdit ? 'Edit Data Kepulangan' : 'Catat Kepulangan Siswa'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {isEdit
                                    ? 'Perbarui informasi tanggal atau alasan kepulangan'
                                    : 'Pilih batch keberangkatan dan siswa yang pulang ke Indonesia'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* CARD 1: PILIH KEBERANGKATAN */}
                    <div className="rounded-2xl border border-sidebar-border bg-white p-6 shadow-sm dark:bg-zinc-950 space-y-4">
                        <div className="flex items-center gap-2 border-b border-sidebar-border pb-3">
                            <Building2 className="text-emerald-600" size={18} />
                            <h2 className="font-bold text-foreground">1. Pilih Data Keberangkatan</h2>
                        </div>

                        <div>
                            <Label htmlFor="departure_id">Keberangkatan / Perusahaan</Label>
                            <select
                                id="departure_id"
                                value={data.departure_id}
                                disabled={isEdit}
                                onChange={(e) => {
                                    setData('departure_id', Number(e.target.value))
                                    setData('user_ids', [])
                                }}
                                className="mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">-- Pilih Keberangkatan --</option>
                                {departures.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.company_name} ({d.organization || 'Tanpa Org'}) — Tgl Berangkat:{' '}
                                        {d.departure_date || '-'} ({d.people_count} orang)
                                    </option>
                                ))}
                            </select>
                            {errors.departure_id && <p className="text-xs text-red-500 mt-1">{errors.departure_id}</p>}
                        </div>

                        {/* LIST SISWA DALAM KEBERANGKATAN INI */}
                        {currentDeparture && (
                            <div className="mt-4 rounded-xl border border-sidebar-border bg-neutral-50/50 p-4 dark:bg-neutral-900/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Pilih Siswa yang Pulang ({currentDeparture.students.length} Orang Terdaftar)
                                    </span>
                                    {!isEdit && currentDeparture.students.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                                            onClick={handleSelectAllStudents}
                                        >
                                            Pilih Semua Siswa
                                        </Button>
                                    )}
                                </div>

                                {currentDeparture.students.length > 0 ? (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {currentDeparture.students.map((student) => {
                                            const isChecked = data.user_ids.includes(student.id)
                                            const alreadyReturned = student.is_returned && (!isEdit || student.id !== returnRecord?.user_id)

                                            return (
                                                <label
                                                    key={student.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                        alreadyReturned
                                                            ? 'opacity-60 bg-neutral-100 border-neutral-200 cursor-not-allowed dark:bg-zinc-800'
                                                            : isChecked
                                                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                                                            : 'border-sidebar-border bg-white dark:bg-zinc-950'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        disabled={alreadyReturned}
                                                        checked={isChecked}
                                                        onChange={() => handleStudentToggle(student.id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold">{student.name}</span>
                                                        {student.nik && (
                                                            <span className="text-[11px] text-muted-foreground">NIK: {student.nik}</span>
                                                        )}
                                                        {alreadyReturned && (
                                                            <span className="text-[10px] font-bold text-amber-600">Sudah Dicatat Pulang</span>
                                                        )}
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs italic text-muted-foreground py-2">
                                        Tidak ada akun siswa terhubung dalam batch ini. Catatan kepulangan akan dibuat secara umum untuk batch.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* CARD 2: DETAIL KEPULANGAN */}
                    <div className="rounded-2xl border border-sidebar-border bg-white p-6 shadow-sm dark:bg-zinc-950 space-y-4">
                        <div className="flex items-center gap-2 border-b border-sidebar-border pb-3">
                            <Calendar className="text-emerald-600" size={18} />
                            <h2 className="font-bold text-foreground">2. Tanggal & Alasan Kepulangan</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="return_date">Tanggal Kepulangan (Tiba di Indonesia)</Label>
                                <Input
                                    id="return_date"
                                    type="date"
                                    value={data.return_date}
                                    onChange={(e) => setData('return_date', e.target.value)}
                                    className="mt-1.5"
                                />
                                {errors.return_date && <p className="text-xs text-red-500 mt-1">{errors.return_date}</p>}
                            </div>

                            <div>
                                <Label htmlFor="reason">Status / Alasan Kepulangan</Label>
                                <select
                                    id="reason"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    className="mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="finished">Selesai Kontrak (3 Tahun / 5 Tahun)</option>
                                    <option value="early_return">Pulang Awal / Resign / Medis</option>
                                    <option value="other">Lainnya</option>
                                </select>
                                {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                            <textarea
                                id="notes"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Contoh: Pulang awal karena alasan keluarga, atau selesai kontrak magang..."
                                className="mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                            {errors.notes && <p className="text-xs text-red-500 mt-1">{errors.notes}</p>}
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/admin/returns">
                            <Button variant="outline" type="button">
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-[140px]">
                            <Save className="mr-2 h-4 w-4" /> {isEdit ? 'Perbarui' : 'Simpan Kepulangan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    )
}
