import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useForm } from '@inertiajs/react'
import { AlertCircle } from 'lucide-react'
import React, { useEffect } from 'react'
import { route } from 'ziggy-js'

interface ClassroomFormProps {
    open: boolean
    setOpen: (open: boolean) => void
}

export default function ClassroomForm({ open, setOpen }: ClassroomFormProps) {
    // Tambahkan 'errors' dari useForm untuk menangkap error global
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        level: '',
    })

    useEffect(() => {
        if (!open) {
            reset()
            clearErrors()
        }
    }, [open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('sensei.classrooms.store'), {
            onSuccess: () => {
                setOpen(false)
                reset()
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Buat Kelas Baru</DialogTitle>
                        <DialogDescription>
                            Membuka kelas baru untuk memulai pembelajaran.
                        </DialogDescription>
                    </DialogHeader>

                    {/* 1. TAMPILKAN GENERAL ERROR (SOLUSI SILENT ERROR) */}
                    {/* Ubah errors.error menjadi (errors as any).error */}
                    {(errors as any).error && (
                        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                            <span className="font-bold">Error:</span> {(errors as any).error}
                        </div>
                    )}

                    {/* Warning Box */}
                    <div className="my-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                        <AlertCircle className="mt-0.5 size-5 shrink-0" />
                        <div className="text-sm">
                            <span className="font-semibold">Perhatian:</span> Jika Anda memiliki kelas yang sedang 
                            <span className="font-bold"> Aktif</span>, kelas tersebut akan otomatis 
                            dinonaktifkan (Finished) saat Anda membuat kelas baru ini.
                        </div>
                    </div>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Kelas / Angkatan</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Angkatan 24 - N4"
                                autoFocus
                            />
                            {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="level">Level Pembelajaran</Label>
                            <Select value={data.level} onValueChange={(val) => setData('level', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ATARASHII">ATARASHII</SelectItem>
                                    <SelectItem value="N5">N5</SelectItem>
                                    <SelectItem value="N4">N4</SelectItem>
                                    <SelectItem value="Pra-Pemberangakatan">Pra-Pemberangkatan</SelectItem>
                                    <SelectItem value="Pra-Pemberangkatan Kaigo">Pra-Pemberangkatan Kaigo</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.level && <p className="text-[10px] text-red-500">{errors.level}</p>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black">
                            {processing ? 'Memproses...' : 'Buat Kelas'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}