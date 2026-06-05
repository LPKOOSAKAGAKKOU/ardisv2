import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import {
    MessageSquare,
    AlarmClock,
    Plane,
    GraduationCap,
    Receipt,
    ChevronLeft,
    ChevronRight,
    Users,
    CalendarDays,
} from 'lucide-react'

export interface CalendarEvent {
    date: string // YYYY-MM-DD
    type: 'interview' | 'interview_deadline' | 'departure' | 'training_end' | 'billing'
    title: string
    subtitle?: string | null
    detail?: string | null
    people?: number | null
    amount?: number | null
    students?: string[]
    url?: string
}

type EventType = CalendarEvent['type']

const TYPE_ORDER: EventType[] = ['interview_deadline', 'interview', 'departure', 'training_end', 'billing']

const TYPES: Record<
    EventType,
    { label: string; icon: typeof MessageSquare; dot: string; chip: string; bar: string }
> = {
    interview: {
        label: 'Wawancara',
        icon: MessageSquare,
        dot: 'bg-purple-500',
        bar: 'border-l-purple-500',
        chip: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    },
    interview_deadline: {
        label: 'Deadline Daftar',
        icon: AlarmClock,
        dot: 'bg-amber-500',
        bar: 'border-l-amber-500',
        chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    },
    departure: {
        label: 'Keberangkatan',
        icon: Plane,
        dot: 'bg-sky-500',
        bar: 'border-l-sky-500',
        chip: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    },
    training_end: {
        label: 'Selesai Training',
        icon: GraduationCap,
        dot: 'bg-emerald-500',
        bar: 'border-l-emerald-500',
        chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    billing: {
        label: 'Penagihan',
        icon: Receipt,
        dot: 'bg-rose-500',
        bar: 'border-l-rose-500',
        chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    },
}

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const pad = (n: number) => String(n).padStart(2, '0')
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const yen = (n: number) => '¥' + (n ?? 0).toLocaleString('ja-JP')
const prettyDate = (key: string) => {
    const [y, m, d] = key.split('-').map(Number)
    return `${d} ${MONTHS[m - 1]} ${y}`
}

export default function DashboardCalendar({ events }: { events: CalendarEvent[] }) {
    const today = new Date()
    const todayKey = keyOf(today)

    const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
    const [selected, setSelected] = useState<string>(todayKey)
    const [active, setActive] = useState<Set<EventType>>(new Set(TYPE_ORDER))

    // Kelompokkan event per tanggal (hanya tipe yang aktif).
    const byDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>()
        for (const ev of events) {
            if (!active.has(ev.type)) continue
            const arr = map.get(ev.date) ?? []
            arr.push(ev)
            map.set(ev.date, arr)
        }
        // Urutkan tiap hari berdasarkan prioritas tipe.
        for (const arr of map.values()) {
            arr.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
        }
        return map
    }, [events, active])

    // 42 sel (6 minggu) mulai dari awal pekan bulan ini.
    const cells = useMemo(() => {
        const first = new Date(view.year, view.month, 1)
        const startWeekday = first.getDay()
        return Array.from({ length: 42 }, (_, i) => new Date(view.year, view.month, 1 - startWeekday + i))
    }, [view])

    const monthEventCount = useMemo(() => {
        let n = 0
        for (const [k, arr] of byDate) {
            const [y, m] = k.split('-').map(Number)
            if (y === view.year && m === view.month + 1) n += arr.length
        }
        return n
    }, [byDate, view])

    const selectedEvents = byDate.get(selected) ?? []

    const goMonth = (delta: number) => {
        const d = new Date(view.year, view.month + delta, 1)
        setView({ year: d.getFullYear(), month: d.getMonth() })
    }
    const goToday = () => {
        setView({ year: today.getFullYear(), month: today.getMonth() })
        setSelected(todayKey)
    }
    const toggleType = (t: EventType) => {
        setActive((prev) => {
            const next = new Set(prev)
            if (next.has(t)) next.delete(t)
            else next.add(t)
            return next
        })
    }

    return (
        <div className="rounded-2xl border border-sidebar-border bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-sidebar-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-lg shadow-indigo-500/20">
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold leading-tight">
                            {MONTHS[view.month]} {view.year}
                        </h3>
                        <p className="text-xs text-muted-foreground">{monthEventCount} agenda bulan ini</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => goMonth(-1)} className="rounded-md border border-input p-2 hover:bg-muted" aria-label="Bulan sebelumnya">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={goToday} className="rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-muted">
                        Hari ini
                    </button>
                    <button onClick={() => goMonth(1)} className="rounded-md border border-input p-2 hover:bg-muted" aria-label="Bulan berikutnya">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Legend / filter */}
            <div className="flex flex-wrap gap-2 border-b border-sidebar-border px-4 py-3">
                {TYPE_ORDER.map((t) => {
                    const cfg = TYPES[t]
                    const on = active.has(t)
                    return (
                        <button
                            key={t}
                            onClick={() => toggleType(t)}
                            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                on
                                    ? 'border-transparent ' + cfg.chip
                                    : 'border-dashed border-input text-muted-foreground opacity-60 hover:opacity-100'
                            }`}
                        >
                            <span className={`h-2 w-2 rounded-full ${on ? cfg.dot : 'bg-muted-foreground/40'}`} />
                            {cfg.label}
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
                {/* Grid kalender */}
                <div className="p-3 lg:border-r border-sidebar-border">
                    <div className="grid grid-cols-7 gap-1">
                        {WEEKDAYS.map((w, i) => (
                            <div
                                key={w}
                                className={`pb-1 text-center text-[10px] font-bold uppercase tracking-wider ${
                                    i === 0 ? 'text-rose-500' : 'text-muted-foreground'
                                }`}
                            >
                                {w}
                            </div>
                        ))}
                        {cells.map((d) => {
                            const k = keyOf(d)
                            const inMonth = d.getMonth() === view.month
                            const isToday = k === todayKey
                            const isSelected = k === selected
                            const dayEvents = byDate.get(k) ?? []
                            const shown = dayEvents.slice(0, 3)
                            const extra = dayEvents.length - shown.length

                            return (
                                <button
                                    key={k}
                                    onClick={() => setSelected(k)}
                                    className={`flex min-h-[68px] flex-col gap-1 rounded-lg border p-1 text-left transition-colors ${
                                        isSelected
                                            ? 'border-indigo-500 ring-1 ring-indigo-500'
                                            : 'border-transparent hover:border-sidebar-border'
                                    } ${inMonth ? '' : 'opacity-40'}`}
                                >
                                    <span
                                        className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                                            isToday ? 'bg-indigo-600 text-white' : d.getDay() === 0 ? 'text-rose-500' : ''
                                        }`}
                                    >
                                        {d.getDate()}
                                    </span>
                                    <div className="flex flex-col gap-0.5">
                                        {shown.map((ev, i) => {
                                            const cfg = TYPES[ev.type]
                                            const Icon = cfg.icon
                                            return (
                                                <span
                                                    key={i}
                                                    title={`${cfg.label}: ${ev.title}`}
                                                    className={`flex items-center gap-1 truncate rounded border-l-2 px-1 py-0.5 text-[9px] font-medium leading-tight ${cfg.bar} ${cfg.chip}`}
                                                >
                                                    <Icon size={9} className="shrink-0" />
                                                    <span className="truncate">{ev.title}</span>
                                                </span>
                                            )
                                        })}
                                        {extra > 0 && (
                                            <span className="px-1 text-[9px] font-semibold text-muted-foreground">
                                                +{extra} lainnya
                                            </span>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Panel detail hari terpilih */}
                <div className="flex max-h-[480px] flex-col">
                    <div className="border-b border-sidebar-border px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agenda</p>
                        <p className="text-sm font-semibold">{prettyDate(selected)}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {selectedEvents.length === 0 ? (
                            <p className="px-2 py-8 text-center text-sm italic text-muted-foreground">
                                Tidak ada agenda pada tanggal ini.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {selectedEvents.map((ev, i) => {
                                    const cfg = TYPES[ev.type]
                                    const Icon = cfg.icon
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => ev.url && router.visit(ev.url)}
                                            className={`flex cursor-pointer gap-3 rounded-lg border border-sidebar-border border-l-4 p-3 transition-colors hover:bg-muted/50 ${cfg.bar}`}
                                        >
                                            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${cfg.chip}`}>
                                                <Icon size={15} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.chip}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {typeof ev.amount === 'number' && (
                                                        <span className="shrink-0 text-sm font-bold tabular-nums">{yen(ev.amount)}</span>
                                                    )}
                                                </div>
                                                <p className="mt-1 truncate font-semibold font-japanese">{ev.title}</p>
                                                {ev.subtitle && (
                                                    <p className="truncate text-xs text-muted-foreground">{ev.subtitle}</p>
                                                )}
                                                {ev.detail && (
                                                    <p className="mt-0.5 text-xs text-foreground/80 font-japanese">{ev.detail}</p>
                                                )}
                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                    {typeof ev.people === 'number' && (
                                                        <span className="flex items-center gap-1">
                                                            <Users size={11} /> {ev.people} orang
                                                        </span>
                                                    )}
                                                    {ev.students && ev.students.length > 0 && (
                                                        <span className="truncate text-sky-600 dark:text-sky-400">
                                                            {ev.students.join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
