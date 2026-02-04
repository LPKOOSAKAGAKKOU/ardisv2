import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { router } from '@inertiajs/react'
import { format } from 'date-fns' 
import { id as idLocale } from 'date-fns/locale'
import { 
    CalendarIcon, 
    CheckCircle2, 
    Camera,
    ListChecks, 
    QrCode, 
    Save, 
    ScanLine, 
    XCircle,
    StopCircle,
    Edit,
    Loader2
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { route } from 'ziggy-js'
import axios from 'axios'
import { Html5Qrcode } from 'html5-qrcode' 

interface Student {
    id: number
    nik: string
    full_name: string
}

interface AttendanceRecord {
    student_profile_id: number
    status: string
    note: string | null
}

interface Props {
    classroom: {
        id: number
        students: Student[]
    }
}

export default function AttendanceSection({ classroom }: Props) {
    // State Tanggal
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
    
    // State Data & UI
    const [processing, setProcessing] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [existingData, setExistingData] = useState<AttendanceRecord[] | null>(null)
    const [isEditing, setIsEditing] = useState(false) // Mode Edit vs Mode Laporan

    // --- INITIALIZE MANUAL DATA ---
    const [manualData, setManualData] = useState<Record<number, { status: string, note: string }>>({})

    // Helper untuk reset form ke default (Hadir semua)
    const resetToDefault = () => {
        const initial: any = {}
        classroom.students.forEach(s => {
            initial[s.id] = { status: 'hadir', note: '' }
        })
        setManualData(initial)
    }

    // Helper untuk mengisi form dari data database (Mode Edit)
    const populateFormFromExisting = (data: AttendanceRecord[]) => {
        const mapped: any = {}
        // Isi default dulu (jaga-jaga ada siswa baru masuk yg belum ada recordnya)
        classroom.students.forEach(s => {
            mapped[s.id] = { status: 'hadir', note: '' }
        })
        // Timpa dengan data database
        data.forEach(record => {
            mapped[record.student_profile_id] = { 
                status: record.status, 
                note: record.note || '' 
            }
        })
        setManualData(mapped)
    }

    // --- EFFECT: FETCH DATA SAAT TANGGAL BERUBAH ---
    useEffect(() => {
        let isMounted = true
        
        const checkAttendance = async () => {
            setIsLoadingData(true)
            try {
                // Request ke backend untuk cek absen tanggal ini
                // Pastikan Anda membuat Route::get ini di backend yang return JSON array absensi
                const response = await axios.get(route('sensei.classrooms.attendance.show', { 
                    classroom: classroom.id, 
                    date: date 
                }))

                if (isMounted) {
                    if (response.data && response.data.length > 0) {
                        // DATA ADA: Masuk Mode Laporan
                        setExistingData(response.data)
                        setIsEditing(false) 
                    } else {
                        // DATA KOSONG: Masuk Mode Input Baru
                        setExistingData(null)
                        setIsEditing(true)
                        resetToDefault()
                    }
                }
            } catch (error) {
                console.error("Gagal mengambil data absensi", error)
                if (isMounted) {
                    setExistingData(null)
                    setIsEditing(true)
                    resetToDefault()
                }
            } finally {
                if (isMounted) setIsLoadingData(false)
            }
        }

        checkAttendance()

        return () => { isMounted = false }
    }, [date, classroom.id])


    // --- HANDLER MANUAL INPUT ---
    const handleManualChange = (studentId: number, field: 'status' | 'note', value: string) => {
        setManualData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }))
    }

    const submitManual = (e: React.FormEvent) => {
        e.preventDefault()
        
        const attendancesArray = Object.keys(manualData).map(studentId => ({
            student_id: parseInt(studentId),
            status: manualData[parseInt(studentId)].status,
            note: manualData[parseInt(studentId)].note
        }))

        router.post(route('sensei.classrooms.attendance.store', classroom.id), {
            date: date,
            attendances: attendancesArray
        }, {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                // Setelah sukses simpan, refresh data (trigger useEffect)
                // Dengan cara memvalidasi ulang atau set manual state
                // Inertia akan reload page, tapi state local component mungkin perlu sync
                // Kita paksa reload data via axios lagi atau update existingData manual
                setExistingData(attendancesArray.map(a => ({
                    student_profile_id: a.student_id,
                    status: a.status,
                    note: a.note
                })))
                setIsEditing(false) // Kembali ke mode laporan
            }
        })
    }

    // --- LOGIC QR CAMERA (SAMA SEPERTI SEBELUMNYA) ---
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const [scanResult, setScanResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [qrInput, setQrInput] = useState('') 
    const [isScanningApi, setIsScanningApi] = useState(false)
    
    const lastScannedRef = useRef<string | null>(null)
    const scannerRef = useRef<Html5Qrcode | null>(null)

    useEffect(() => {
        let scanner: Html5Qrcode | null = null;
        const startCamera = async () => {
            if (isCameraOpen) {
                try {
                    scanner = new Html5Qrcode("reader");
                    scannerRef.current = scanner;
                    await scanner.start(
                        { facingMode: "environment" }, 
                        { fps: 10, qrbox: { width: 250, height: 250 } }, 
                        (decodedText) => handleCameraScan(decodedText),
                        () => {}
                    );
                } catch (err) {
                    setIsCameraOpen(false);
                    alert("Gagal membuka kamera.");
                }
            }
        };
        const stopCamera = async () => {
            if (scannerRef.current) {
                await scannerRef.current.stop().catch(() => {});
                scannerRef.current.clear();
                scannerRef.current = null;
            }
        };
        if (isCameraOpen) startCamera();
        else stopCamera();

        return () => { scannerRef.current?.stop().catch(() => {}); };
    }, [isCameraOpen]);

    const processScan = async (code: string) => {
        if (isScanningApi) return 
        setIsScanningApi(true)
        setScanResult(null) 
        try {
            const response = await axios.post(route('sensei.classrooms.attendance.qr', classroom.id), {
                date: date,
                qr_code: code,
                status: 'hadir'
            })
            setScanResult({ type: 'success', message: `✅ ${response.data.message}` })
            
            // Update existing data di UI agar realtime report berubah
            if (existingData) {
                // Logic update local state existingData (optional for extreme realtime feeling)
            }
        } catch (error: any) {
            setScanResult({ type: 'error', message: `❌ ${error.response?.data?.message || 'Invalid QR.'}` })
        } finally {
            setIsScanningApi(false)
            setQrInput('') 
            if (!isCameraOpen) document.getElementById('qr-input-field')?.focus()
        }
    }

    const handleCameraScan = (decodedText: string) => {
        if (lastScannedRef.current === decodedText) return
        lastScannedRef.current = decodedText
        setTimeout(() => { lastScannedRef.current = null }, 3000) 
        processScan(decodedText)
    }

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!qrInput) return
        processScan(qrInput)
    }

    // --- RENDER HELPERS ---
    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'hadir': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Hadir</Badge>
            case 'sakit': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none">Sakit</Badge>
            case 'izin': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Izin</Badge>
            case 'alpha': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Alpha</Badge>
            case 'terlambat': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">Telat</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* DATE PICKER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950 gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        <CalendarIcon size={20} />
                    </div>
                    <div>
                        <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground uppercase">Tanggal Absensi</Label>
                        <Input 
                            type="date" 
                            id="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)}
                            className="h-8 border-none p-0 text-lg font-bold shadow-none focus-visible:ring-0"
                        />
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium">{format(new Date(date), 'EEEE, d MMMM yyyy', { locale: idLocale })}</p>
                    {isLoadingData ? (
                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                            <Loader2 className="size-3 animate-spin" /> Memuat data...
                        </div>
                    ) : existingData ? (
                        <div className="flex items-center justify-end gap-2">
                            <span className="flex size-2 rounded-full bg-green-500"></span>
                            <p className="text-xs text-muted-foreground">Data Tersedia</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-end gap-2">
                            <span className="flex size-2 rounded-full bg-zinc-300"></span>
                            <p className="text-xs text-muted-foreground">Belum ada input</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="manual" className="gap-2"><ListChecks size={16}/> {existingData && !isEditing ? 'Laporan' : 'Input Manual'}</TabsTrigger>
                    <TabsTrigger value="qr" className="gap-2"><QrCode size={16}/> Scan QR Code</TabsTrigger>
                </TabsList>

                {/* --- TAB MANUAL / LAPORAN --- */}
                <TabsContent value="manual" className="mt-4">
                    
                    {/* CASE 1: LOADING */}
                    {isLoadingData && (
                        <div className="flex h-40 items-center justify-center rounded-xl border bg-white text-muted-foreground">
                            <Loader2 className="size-6 animate-spin mr-2" /> Mengambil data absensi...
                        </div>
                    )}

                    {/* CASE 2: LAPORAN (VIEW MODE) */}
                    {!isLoadingData && existingData && !isEditing && (
                        <div className="rounded-xl border bg-white shadow-sm overflow-hidden dark:bg-zinc-950">
                            <div className="flex items-center justify-between border-b px-4 py-3 bg-neutral-50 dark:bg-zinc-900">
                                <h3 className="text-sm font-bold uppercase text-muted-foreground">Laporan Harian</h3>
                                <Button size="sm" variant="outline" onClick={() => {
                                    populateFormFromExisting(existingData)
                                    setIsEditing(true)
                                }}>
                                    <Edit className="mr-2 size-3" /> Edit Absensi
                                </Button>
                            </div>
                            <div className="divide-y">
                                {classroom.students.map((student) => {
                                    // Cari data absen siswa ini
                                    const record = existingData.find(r => r.student_profile_id === student.id)
                                    return (
                                        <div key={student.id} className="flex items-center justify-between px-4 py-4 hover:bg-neutral-50/50">
                                            <div>
                                                <p className="font-semibold text-sm">{student.full_name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{student.nik}</p>
                                            </div>
                                            <div className="text-right">
                                                {record ? getStatusBadge(record.status) : <Badge variant="outline">Belum Absen</Badge>}
                                                {record?.note && <p className="text-[10px] text-muted-foreground mt-1">"{record.note}"</p>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* CASE 3: INPUT FORM (EDIT MODE / NEW) */}
                    {!isLoadingData && (!existingData || isEditing) && (
                        <form onSubmit={submitManual}>
                            <div className="rounded-xl border bg-white shadow-sm overflow-hidden dark:bg-zinc-950">
                                <div className="grid grid-cols-12 gap-4 border-b bg-neutral-50 px-4 py-3 text-xs font-bold uppercase text-muted-foreground dark:bg-zinc-900">
                                    <div className="col-span-4 md:col-span-3">Nama Siswa</div>
                                    <div className="col-span-8 md:col-span-6 text-center">Status</div>
                                    <div className="col-span-12 md:col-span-3 hidden md:block">Catatan</div>
                                </div>

                                <div className="divide-y">
                                    {classroom.students.length > 0 ? classroom.students.map((student) => (
                                        <div key={student.id} className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-neutral-50/50">
                                            {/* Nama */}
                                            <div className="col-span-12 md:col-span-3 mb-2 md:mb-0">
                                                <p className="font-semibold text-sm">{student.full_name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{student.nik}</p>
                                            </div>

                                            {/* Radio Group */}
                                            <div className="col-span-12 md:col-span-6 flex justify-center">
                                                <RadioGroup 
                                                    value={manualData[student.id]?.status || 'hadir'} 
                                                    onValueChange={(val) => handleManualChange(student.id, 'status', val)}
                                                    className="flex flex-wrap items-center gap-2 sm:gap-4"
                                                >
                                                    <AttendanceRadio idPrefix={student.id} value="hadir" label="Hadir" color="bg-green-100 text-green-700 border-green-200" />
                                                    <AttendanceRadio idPrefix={student.id} value="sakit" label="Sakit" color="bg-yellow-100 text-yellow-700 border-yellow-200" />
                                                    <AttendanceRadio idPrefix={student.id} value="izin" label="Izin" color="bg-blue-100 text-blue-700 border-blue-200" />
                                                    <AttendanceRadio idPrefix={student.id} value="alpha" label="Alpha" color="bg-red-100 text-red-700 border-red-200" />
                                                    <AttendanceRadio idPrefix={student.id} value="terlambat" label="Telat" color="bg-orange-100 text-orange-700 border-orange-200" />
                                                </RadioGroup>
                                            </div>

                                            {/* Input Catatan */}
                                            <div className="col-span-12 md:col-span-3 mt-2 md:mt-0">
                                                <Input 
                                                    placeholder="Ket. (Opsional)" 
                                                    value={manualData[student.id]?.note || ''}
                                                    onChange={(e) => handleManualChange(student.id, 'note', e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-muted-foreground">Tidak ada siswa di kelas ini.</div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between sticky bottom-4 z-10">
                                {isEditing && existingData && (
                                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                                        Batal Edit
                                    </Button>
                                )}
                                <div className="ml-auto">
                                    <Button type="submit" size="lg" className="shadow-xl bg-neutral-900 text-white dark:bg-white dark:text-black" disabled={processing}>
                                        <Save className="mr-2 size-4" /> 
                                        {processing ? 'Menyimpan...' : `Simpan Perubahan`}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </TabsContent>

                {/* --- TAB QR SCANNER --- */}
                <TabsContent value="qr" className="mt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Scanner Area */}
                        <Card className="overflow-hidden border-2 border-dashed shadow-sm">
                            <CardContent className="flex flex-col items-center justify-center p-6 text-center min-h-[400px]">
                                {isCameraOpen ? (
                                    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-black shadow-inner">
                                        <div id="reader" className="w-full h-full min-h-[300px]" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                        <div className="mb-4 rounded-full bg-blue-50 p-6 dark:bg-blue-900/20">
                                            <ScanLine className="size-12 text-blue-500" />
                                        </div>
                                        <p className="text-sm font-medium">Kamera tidak aktif</p>
                                    </div>
                                )}

                                <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
                                    <Button 
                                        variant={isCameraOpen ? "destructive" : "default"}
                                        onClick={() => setIsCameraOpen(!isCameraOpen)}
                                        className="w-full"
                                    >
                                        {isCameraOpen ? (
                                            <><StopCircle className="mr-2 size-4" /> Matikan Kamera</>
                                        ) : (
                                            <><Camera className="mr-2 size-4" /> Buka Kamera HP</>
                                        )}
                                    </Button>

                                    {!isCameraOpen && (
                                        <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
                                            <Input
                                                id="qr-input-field"
                                                value={qrInput}
                                                onChange={(e) => setQrInput(e.target.value)}
                                                placeholder="Klik di sini & Scan..."
                                                className="text-center font-mono"
                                                autoComplete="off"
                                            />
                                        </form>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Result Area */}
                        <Card className={`flex flex-col justify-center border-l-4 transition-colors ${
                            scanResult?.type === 'success' 
                                ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10' 
                                : scanResult?.type === 'error' 
                                    ? 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10' 
                                    : 'border-l-zinc-300'
                        }`}>
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                                {isScanningApi ? (
                                    <div className="flex flex-col items-center animate-pulse">
                                        <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-muted-foreground font-medium">Memproses data...</p>
                                    </div>
                                ) : scanResult ? (
                                    <>
                                        {scanResult.type === 'success' ? (
                                            <CheckCircle2 className="size-20 text-green-600 mb-6 drop-shadow-sm" />
                                        ) : (
                                            <XCircle className="size-20 text-red-600 mb-6 drop-shadow-sm" />
                                        )}
                                        <h3 className="text-2xl font-bold tracking-tight">
                                            {scanResult.type === 'success' ? 'Scan Berhasil!' : 'Gagal'}
                                        </h3>
                                        <p className="mt-2 text-lg font-medium text-foreground/80">{scanResult.message}</p>
                                    </>
                                ) : (
                                    <div className="opacity-40 flex flex-col items-center">
                                        <QrCode className="size-24 mb-4" />
                                        <h4 className="text-lg font-semibold">Menunggu Scan...</h4>
                                        <p className="text-sm">Arahkan kamera ke kartu QR siswa</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// FIXED: Tambah prop idPrefix agar ID unik per siswa
function AttendanceRadio({ idPrefix, value, label, color }: { idPrefix: number, value: string, label: string, color: string }) {
    // Generate unique ID: r-{studentId}-{value} (contoh: r-101-hadir)
    const uniqueId = `r-${idPrefix}-${value}`
    
    return (
        <div>
            <RadioGroupItem value={value} id={uniqueId} className="peer sr-only" />
            <Label
                htmlFor={uniqueId}
                className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-1.5 text-xs font-bold uppercase transition-all hover:opacity-80 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-2 ${color} peer-data-[state=checked]:brightness-90 peer-data-[state=checked]:ring-black dark:peer-data-[state=checked]:ring-white`}
            >
                {label}
            </Label>
        </div>
    )
}