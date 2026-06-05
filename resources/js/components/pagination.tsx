import { Link } from '@inertiajs/react'

interface PaginatorLink {
    url: string | null
    label: string
    active: boolean
}

interface Props {
    links?: PaginatorLink[]
    from?: number | null
    to?: number | null
    total?: number | null
    /** Kata benda untuk teks ringkasan, mis. "siswa", "wawancara". */
    label?: string
}

/**
 * Kontrol pagination standar untuk paginator Laravel (Inertia).
 * Lewatkan langsung properti paginator: links / from / to / total.
 * Ringkasan jumlah data selalu tampil; tombol navigasi hanya muncul
 * jika ada lebih dari satu halaman.
 */
export default function Pagination({ links, from, to, total, label = 'data' }: Props) {
    // Tidak ada data sama sekali → sembunyikan.
    if (!total || total <= 0) return null

    const hasMultiplePages = !!links && links.length > 3

    return (
        <div className="flex flex-col items-center justify-between gap-4 px-2 md:flex-row">
            <p className="text-sm text-muted-foreground">
                Menampilkan {from ?? 0}&ndash;{to ?? 0} dari {total ?? 0} {label}
            </p>
            {hasMultiplePages && (
                <div className="flex flex-wrap gap-1">
                    {links!.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || '#'}
                            preserveScroll
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`rounded-md border px-3 py-1 text-xs ${
                                link.active
                                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400'
                            } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
