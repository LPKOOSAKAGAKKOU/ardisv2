import AppLayout from '@/layouts/app-layout'
import { Head, Link, useForm, router } from '@inertiajs/react'
import { ArrowLeft, Save, Building2, Calendar, Search, ChevronsUpDown, Check, UserCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

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

    const { data, setData, processing, errors } = useForm({
        departure_id: initialDepartureId,
        user_ids: returnRecord?.user_id ? [returnRecord.user_id] : ([] as number[]),
        return_date: returnRecord?.return_date || new Date().toISOString().split('T')[0],
        reason: returnRecord?.reason || 'finished',
        notes: returnRecord?.notes || '',
    })

    const [currentDeparture, setCurrentDeparture] = useState<DepartureOption | null>(null)
    const [openCombobox, setOpenCombobox] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Detail spesifik per-siswa jika ada beberapa siswa pulang bersamaan
    const [studentDetailsMap, setStudentDetailsMap] = useState<Record<number, { reason: string; notes: string }>>({})

    useEffect(() => {
        const found = departures.find((d) => d.id === Number(data.departure_id))
        setCurrentDeparture(found || null)
    }, [data.departure_id, departures])

    useEffect(() => {
        if (isEdit && returnRecord?.user_id) {
            setStudentDetailsMap({
                [returnRecord.user_id]: {
                    reason: returnRecord.reason || 'finished',
                    notes: returnRecord.notes || '',
                },
            })
        }
    }, [isEdit, returnRecord])

    const filteredDepartures = departures.filter((d) => {
        const q = searchQuery.toLowerCase().trim()
        if (!q) return true
        const label = `${d.company_name} ${d.organization || ''} ${d.departure_date || ''}`.toLowerCase()
        return label.includes(q)
    })

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

    const updateStudentDetail = (userId: number, field: 'reason' | 'notes', value: string) => {
        setStudentDetailsMap((prev) => ({
            ...prev,
            [userId]: {
                reason: prev[userId]?.reason || data.reason,
                notes: prev[userId]?.notes ?? '',
                [field]: value,
            },
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const student_details = data.user_ids.map((id) => ({
            user_id: id,
            reason: studentDetailsMap[id]?.reason || data.reason,
            notes: studentDetailsMap[id]?.notes !== undefined ? studentDetailsMap[id].notes : data.notes,
        }))

        const payload = {
            ...data,
            student_details,
        }

        if (isEdit) {
            router.put(`/admin/returns/${returnRecord.id}`, payload)
        } else {
            router.post('/admin/returns', payload)
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
                    {/* CARD 1: PILIH KEBERANGKATAN & SISWA */}
                    <div className="rounded-2xl border border-sidebar-border bg-white p-6 shadow-sm dark:bg-zinc-950 space-y-4">
                        <div className="flex items-center gap-2 border-b border-sidebar-border pb-3">
                            <Building2 className="text-emerald-600" size={18} />
                            <h2 className="font-bold text-foreground">1. Pilih Data Keberangkatan</h2>
                        </div>

                        <div>
                            <Label htmlFor="departure_combobox" className="mb-1.5 block">Keberangkatan / Perusahaan</Label>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="departure_combobox"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        disabled={isEdit}
                                        className="w-full justify-between h-auto min-h-[46px] py-2.5 px-3.5 text-left font-normal border-input bg-background hover:bg-neutral-50 dark:hover:bg-zinc-900 shadow-sm"
                                    >
                                        {currentDeparture ? (
                                            <div className="flex flex-col truncate pr-2">
                                                <span className="font-bold text-foreground font-japanese truncate text-sm">
                                                    {currentDeparture.company_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {currentDeparture.organization ? `(${currentDeparture.organization})` : '(Tanpa Organisasi)'} — Tgl Berangkat: {currentDeparture.departure_date || '-'} ({currentDeparture.people_count} orang)
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-- Pilih Keberangkatan --</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 shadow-xl border-sidebar-border" align="start">
                                    <div className="relative mb-2">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari perusahaan atau organisasi..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-8 h-9 text-xs"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                                        {filteredDepartures.length > 0 ? (
                                            filteredDepartures.map((d) => {
                                                const isSelected = Number(data.departure_id) === d.id
                                                return (
                                                    <div
                                                        key={d.id}
                                                        onClick={() => {
                                                            setData('departure_id', d.id)
                                                            setData('user_ids', [])
                                                            setStudentDetailsMap({})
                                                            setOpenCombobox(false)
                                                            setSearchQuery('')
                                                        }}
                                                        className={cn(
                                                            "flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-xs transition-colors hover:bg-neutral-100 dark:hover:bg-zinc-800/80",
                                                            isSelected && "bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300"
                                                        )}
                                                    >
                                                        <div className="flex flex-col truncate pr-2">
                                                            <span className="font-bold font-japanese text-sm text-foreground truncate">{d.company_name}</span>
                                                            <span className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                                {d.organization || 'Tanpa Org'} — Tgl Berangkat: {d.departure_date || '-'} ({d.people_count} orang)
                                                            </span>
                                                        </div>
                                                        {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <p className="p-4 text-xs italic text-center text-muted-foreground">
                                                Keberangkatan tidak ditemukan.
                                            </p>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
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
                                    <div className="grid gap-3 sm:grid-cols-1">
                                        {currentDeparture.students.map((student) => {
                                            const isChecked = data.user_ids.includes(student.id)
                                            const alreadyReturned = student.is_returned && (!isEdit || student.id !== returnRecord?.user_id)

                                            return (
                                                <div
                                                    key={student.id}
                                                    className={`p-3.5 rounded-xl border transition-all ${
                                                        alreadyReturned
                                                            ? 'opacity-60 bg-neutral-100 border-neutral-200 cursor-not-allowed dark:bg-zinc-800'
                                                            : isChecked
                                                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                                                            : 'border-sidebar-border bg-white dark:bg-zinc-950'
                                                    }`}
                                                >
                                                    <label className="flex items-center gap-3 cursor-pointer">
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

                                                    {/* SPESIFIK DETAIL SISWA JIKA TERCENTANG */}
                                                    {isChecked && !alreadyReturned && (
                                                        <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 grid gap-3 sm:grid-cols-2 text-xs">
                                                            <div>
                                                                <Label className="text-[11px] text-muted-foreground block mb-1">
                                                                    Status Selesai ({student.name})
                                                                </Label>
                                                                <select
                                                                    value={studentDetailsMap[student.id]?.reason || data.reason}
                                                                    onChange={(e) => updateStudentDetail(student.id, 'reason', e.target.value)}
                                                                    className="w-full rounded-md border border-input bg-background p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                                                                >
                                                                    <option value="finished">Selesai Kontrak</option>
                                                                    <option value="working_indonesia">Bekerja di Indonesia</option>
                                                                    <option value="wirausaha">Wirausaha</option>
                                                                    <option value="education">Lanjut Pendidikan</option>
                                                                    <option value="ssw">SSW (Tokutei Ginou)</option>
                                                                    <option value="early_return">Pulang Awal / Resign</option>
                                                                    <option value="other">Lainnya</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <Label className="text-[11px] text-muted-foreground block mb-1">
                                                                    Keterangan / Perusahaan Baru ({student.name})
                                                                </Label>
                                                                <Input
                                                                    placeholder="Contoh: PT MAJU JAYA / PT HINODE / Toko Kelontong"
                                                                    value={studentDetailsMap[student.id]?.notes ?? ''}
                                                                    onChange={(e) => updateStudentDetail(student.id, 'notes', e.target.value)}
                                                                    className="h-8 text-xs"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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

                    {/* CARD 2: TANGGAL KEPULANGAN */}
                    <div className="rounded-2xl border border-sidebar-border bg-white p-6 shadow-sm dark:bg-zinc-950 space-y-4">
                        <div className="flex items-center gap-2 border-b border-sidebar-border pb-3">
                            <Calendar className="text-emerald-600" size={18} />
                            <h2 className="font-bold text-foreground">2. Tanggal Kepulangan</h2>
                        </div>

                        <div>
                            <Label htmlFor="return_date">Tanggal Kepulangan (Tiba di Indonesia)</Label>
                            <Input
                                id="return_date"
                                type="date"
                                value={data.return_date}
                                onChange={(e) => setData('return_date', e.target.value)}
                                className="mt-1.5 max-w-md"
                            />
                            {errors.return_date && <p className="text-xs text-red-500 mt-1">{errors.return_date}</p>}
                        </div>

                        {/* Tampilkan opsi umum hanya jika tidak ada akun siswa spesifik pada batch ini */}
                        {(!currentDeparture || currentDeparture.students.length === 0) && (
                            <div className="space-y-4 pt-2 border-t border-sidebar-border">
                                <div>
                                    <Label htmlFor="reason">Status / Alasan Kepulangan</Label>
                                    <select
                                        id="reason"
                                        value={data.reason}
                                        onChange={(e) => setData('reason', e.target.value)}
                                        className="mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="finished">Selesai Kontrak</option>
                                        <option value="working_indonesia">Bekerja di Indonesia</option>
                                        <option value="wirausaha">Wirausaha</option>
                                        <option value="education">Lanjut Pendidikan</option>
                                        <option value="ssw">SSW (Tokutei Ginou)</option>
                                        <option value="early_return">Pulang Awal / Resign / Medis</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                    {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Catatan umum kepulangan..."
                                        className="mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                    />
                                    {errors.notes && <p className="text-xs text-red-500 mt-1">{errors.notes}</p>}
                                </div>
                            </div>
                        )}
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
