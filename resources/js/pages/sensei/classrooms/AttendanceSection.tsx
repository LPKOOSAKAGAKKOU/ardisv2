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
    StopCircle
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { route } from 'ziggy-js'
import axios from 'axios'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface Student {
    id: number
    nik: string
    full_name: string
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
    
    // State Loading
    const [processing, setProcessing] = useState(false)

    // --- LOGIC MANUAL ATTENDANCE ---
    const [manualData, setManualData] = useState<Record<number, { status: string, note: string }>>(() => {
        const initial: any = {}
        classroom.students.forEach(s => {
            initial[s.id] = { status: 'hadir', note: '' }
        })
        return initial
    })

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
                // alert("Absensi berhasil disimpan!") 
            }
        })
    }

    // --- LOGIC QR CAMERA SCANNER ---
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const [scanResult, setScanResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [qrInput, setQrInput] = useState('') // Tetap simpan ini untuk fallback manual input
    const [isScanningApi, setIsScanningApi] = useState(false) // Loading state saat kirim ke API
    
    // Ref untuk mencegah double scan (Cooldown system)
    const lastScannedRef = useRef<string | null>(null)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    // Effect untuk Handle Kamera
    useEffect(() => {
        if (isCameraOpen) {
            // Hapus instance lama jika ada (cleanup)
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error)
            }

            // Inisialisasi Scanner Baru
            const scanner = new Html5QrcodeScanner(
                "reader", 
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true
                },
                /* verbose= */ false
            )
            
            scannerRef.current = scanner

            scanner.render(
                (decodedText) => {
                    // Success Callback
                    handleCameraScan(decodedText)
                }, 
                (errorMessage) => {
                    // Error/Waiting Callback (Biasanya diabaikan agar console tidak penuh)
                }
            )
        } else {
            // Jika kamera ditutup, bersihkan scanner
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error)
                scannerRef.current = null
            }
        }

        // Cleanup saat unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error)
            }
        }
    }, [isCameraOpen])

    // Fungsi Utama Proses Scan (Dipakai Kamera & Input Manual)
    const processScan = async (code: string) => {
        if (isScanningApi) return // Cegah spam request

        setIsScanningApi(true)
        setScanResult(null) // Reset pesan

        try {
            const response = await axios.post(route('sensei.classrooms.attendance.qr', classroom.id), {
                date: date,
                qr_code: code,
                status: 'hadir'
            })

            setScanResult({
                type: 'success',
                message: `✅ ${response.data.message}`
            })
            
            // Audio Feedback (Opsional)
            // const audio = new Audio('/sounds/success.mp3'); audio.play();

        } catch (error: any) {
            setScanResult({
                type: 'error',
                message: `❌ ${error.response?.data?.message || 'QR Code tidak valid/Siswa tidak ditemukan.'}`
            })
            // const audio = new Audio('/sounds/error.mp3'); audio.play();
        } finally {
            setIsScanningApi(false)
            setQrInput('') // Clear input manual jika pakai itu
            
            // Fokus balik ke input manual jika kamera mati, biar flow enak
            if (!isCameraOpen) {
                document.getElementById('qr-input-field')?.focus()
            }
        }
    }

    // Wrapper Khusus Kamera dengan Cooldown
    const handleCameraScan = (decodedText: string) => {
        // Jika kode sama dengan yang barusan discan dalam 3 detik terakhir, abaikan
        if (lastScannedRef.current === decodedText) return

        // Set cooldown
        lastScannedRef.current = decodedText
        setTimeout(() => { lastScannedRef.current = null }, 3000) // Reset cooldown setelah 3 detik

        // Proses
        processScan(decodedText)
    }

    // Wrapper Khusus Input Manual (Enter)
    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!qrInput) return
        processScan(qrInput)
    }

    return (
        <div className="space-y-6">
            {/* DATE PICKER */}
            <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950">
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
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{format(new Date(date), 'EEEE, d MMMM yyyy', { locale: idLocale })}</p>
                    <p className="text-xs text-muted-foreground">Pastikan tanggal sudah benar.</p>
                </div>
            </div>

            {/* TABS */}
            <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="manual" className="gap-2"><ListChecks size={16}/> Input Manual</TabsTrigger>
                    <TabsTrigger value="qr" className="gap-2"><QrCode size={16}/> Scan QR Code</TabsTrigger>
                </TabsList>

                {/* --- TAB MANUAL --- */}
                <TabsContent value="manual" className="mt-4">
                    <form onSubmit={submitManual}>
                        <div className="rounded-xl border bg-white shadow-sm overflow-hidden dark:bg-zinc-950">
                            <div className="grid grid-cols-12 gap-4 border-b bg-neutral-50 px-4 py-3 text-xs font-bold uppercase text-muted-foreground dark:bg-zinc-900">
                                <div className="col-span-4 md:col-span-3">Nama Siswa</div>
                                <div className="col-span-8 md:col-span-6 text-center">Status Kehadiran</div>
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
                                                value={manualData[student.id]?.status} 
                                                onValueChange={(val) => handleManualChange(student.id, 'status', val)}
                                                className="flex flex-wrap items-center gap-2 sm:gap-4"
                                            >
                                                <AttendanceRadio value="hadir" label="Hadir" color="bg-green-100 text-green-700 border-green-200" />
                                                <AttendanceRadio value="sakit" label="Sakit" color="bg-yellow-100 text-yellow-700 border-yellow-200" />
                                                <AttendanceRadio value="izin" label="Izin" color="bg-blue-100 text-blue-700 border-blue-200" />
                                                <AttendanceRadio value="alpha" label="Alpha" color="bg-red-100 text-red-700 border-red-200" />
                                                <AttendanceRadio value="terlambat" label="Telat" color="bg-orange-100 text-orange-700 border-orange-200" />
                                            </RadioGroup>
                                        </div>

                                        {/* Input Catatan */}
                                        <div className="col-span-12 md:col-span-3 mt-2 md:mt-0">
                                            <Input 
                                                placeholder="Ket. (Opsional)" 
                                                value={manualData[student.id]?.note}
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

                        <div className="mt-4 flex justify-end sticky bottom-4 z-10">
                            <Button type="submit" size="lg" className="shadow-xl bg-neutral-900 text-white dark:bg-white dark:text-black" disabled={processing}>
                                <Save className="mr-2 size-4" /> 
                                {processing ? 'Menyimpan...' : `Simpan Absensi (${classroom.students.length} Siswa)`}
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                {/* --- TAB QR SCANNER (CAMERA ENABLED) --- */}
                <TabsContent value="qr" className="mt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Scanner Area */}
                        <Card className="overflow-hidden border-2 border-dashed shadow-sm">
                            <CardContent className="flex flex-col items-center justify-center p-6 text-center min-h-[400px]">
                                
                                {/* A. Camera View Container */}
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

                                {/* B. Camera Controls */}
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

                                    {/* C. Fallback Input Manual (Hidden jika kamera nyala biar bersih) */}
                                    {!isCameraOpen && (
                                        <div className="relative mt-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-white px-2 text-muted-foreground dark:bg-zinc-950">Atau pakai scanner USB</span>
                                            </div>
                                        </div>
                                    )}

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
                                        
                                        {scanResult.type === 'success' && (
                                            <p className="mt-4 text-xs text-muted-foreground bg-white/50 px-3 py-1 rounded-full border">
                                                Siap scan siswa berikutnya...
                                            </p>
                                        )}
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

function AttendanceRadio({ value, label, color }: { value: string, label: string, color: string }) {
    return (
        <div>
            <RadioGroupItem value={value} id={`r-${value}`} className="peer sr-only" />
            <Label
                htmlFor={`r-${value}`}
                className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-1.5 text-xs font-bold uppercase transition-all hover:opacity-80 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-2 ${color} peer-data-[state=checked]:brightness-90 peer-data-[state=checked]:ring-black dark:peer-data-[state=checked]:ring-white`}
            >
                {label}
            </Label>
        </div>
    )
}