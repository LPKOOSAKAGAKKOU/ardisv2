import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { router } from '@inertiajs/react'
import { 
    format, 
    addDays, 
    subDays, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval 
} from 'date-fns' 
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
    Loader2,
    ChevronLeft,
    ChevronRight,
    CalendarDays
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
    date?: string 
}

interface Props {
    classroom: {
        id: number
        students: Student[]
    }
}

export default function AttendanceSection({ classroom }: Props) {
    // --- STATE UTAMA ---
    const [viewMode, setViewMode] = useState<'day' | 'month'>('day')
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    
    const dateString = format(currentDate, 'yyyy-MM-dd')
    const monthString = format(currentDate, 'yyyy-MM')

    const [isLoadingData, setIsLoadingData] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]) // Data dari DB
    
    // State Mode Edit Global (Untuk memaksa semua jadi form edit)
    const [isEditing, setIsEditing] = useState(false) 

    // State Form Manual (Menampung inputan user)
    const [manualData, setManualData] = useState<Record<number, { status: string, note: string }>>({})

    // --- NAVIGASI ---
    const handlePrev = () => {
        if (viewMode === 'day') setCurrentDate(d => subDays(d, 1))
        else setCurrentDate(d => subMonths(d, 1))
    }

    const handleNext = () => {
        if (viewMode === 'day') setCurrentDate(d => addDays(d, 1))
        else setCurrentDate(d => addMonths(d, 1))
    }

    // --- LOGIC SYNC DATA DB KE FORM ---
    // Ini penting agar inputan form memiliki nilai awal yang benar
    const syncFormWithData = (dbRecords: AttendanceRecord[]) => {
        const mapped: any = {}
        
        classroom.students.forEach(student => {
            // Cek apakah siswa ini punya record di DB?
            const record = dbRecords.find(r => r.student_profile_id === student.id)
            
            if (record) {
                // Jika ada, pakai data dari DB
                mapped[student.id] = { 
                    status: record.status, 
                    note: record.note || '' 
                }
            } else {
                // Jika belum absen, defaultnya 'hadir' (atau bisa 'alpha' jika mau strict)
                // Kita set default agar radio button terpilih otomatis
                mapped[student.id] = { status: 'hadir', note: '' }
            }
        })
        setManualData(mapped)
    }

    // --- FETCH DATA ---
    useEffect(() => {
        let isMounted = true
        
        const fetchAttendance = async () => {
            setIsLoadingData(true)
            // Reset Edit Mode saat ganti tanggal
            setIsEditing(false) 
            
            try {
                const params: any = { mode: viewMode }
                if (viewMode === 'day') params.date = dateString
                else params.month = monthString

                const response = await axios.get(route('sensei.classrooms.attendance.data', classroom.id), { params })

                if (isMounted) {
                    const records = response.data || []
                    setAttendanceData(records)
                    
                    // Khusus mode harian, sinkronkan data ke form manual
                    if (viewMode === 'day') {
                        syncFormWithData(records)
                    }
                }
            } catch (error) {
                console.error("Error loading attendance:", error)
            } finally {
                if (isMounted) setIsLoadingData(false)
            }
        }

        fetchAttendance()
        return () => { isMounted = false }
    }, [currentDate, viewMode, classroom.id])

    // --- HANDLER MANUAL INPUT ---
    const handleManualChange = (studentId: number, field: 'status' | 'note', value: string) => {
        setManualData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }))
    }

    // --- SUBMIT MANUAL ---
    const submitManual = (e: React.FormEvent) => {
        e.preventDefault()
        
        const attendancesArray = Object.keys(manualData).map(studentId => ({
            student_id: parseInt(studentId),
            status: manualData[parseInt(studentId)].status,
            note: manualData[parseInt(studentId)].note
        }))

        router.post(route('sensei.classrooms.attendance.store', classroom.id), {
            date: dateString,
            attendances: attendancesArray
        }, {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                // Update tampilan lokal agar jadi Badge (Laporan)
                const newData = attendancesArray.map(a => ({
                    student_profile_id: a.student_id,
                    status: a.status,
                    note: a.note,
                    date: dateString
                }))
                setAttendanceData(newData as AttendanceRecord[])
                setIsEditing(false) 
            }
        })
    }

    // --- QR LOGIC ---
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
                date: dateString,
                qr_code: code,
                status: 'hadir'
            })
            setScanResult({ type: 'success', message: `✅ ${response.data.message}` })
            
            // Update Realtime UI
            if (response.data.student) {
                const student = classroom.students.find(s => s.full_name === response.data.student.name);
                if (student) {
                    // Update Form State
                    handleManualChange(student.id, 'status', 'hadir');
                    // Update Display State (agar badge langsung muncul/berubah)
                    setAttendanceData(prev => {
                        const exists = prev.find(r => r.student_profile_id === student.id);
                        if (exists) {
                            return prev.map(r => r.student_profile_id === student.id ? { ...r, status: 'hadir' } : r);
                        } else {
                            return [...prev, { student_profile_id: student.id, status: 'hadir', note: 'Via QR Scan', date: dateString }];
                        }
                    });
                }
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

    // --- BADGE HELPERS ---
    const getStatusBadge = (status: string) => {
        const styles: any = {
            hadir: 'bg-green-100 text-green-700 hover:bg-green-200 border-none',
            sakit: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none',
            izin: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-none',
            alpha: 'bg-red-100 text-red-700 hover:bg-red-200 border-none',
            terlambat: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-none'
        }
        return <Badge className={`${styles[status] || 'bg-gray-100'} shadow-none cursor-default`}>{status.toUpperCase()}</Badge>
    }

    const getMiniBadge = (status: string) => {
        const colors: any = {
            hadir: 'bg-green-500', sakit: 'bg-yellow-500', izin: 'bg-blue-500',
            alpha: 'bg-red-500', terlambat: 'bg-orange-500'
        }
        const labels: any = { hadir: 'H', sakit: 'S', izin: 'I', alpha: 'A', terlambat: 'T' }
        return (
            <div className={`mx-auto flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${colors[status] || 'bg-gray-400'}`}>
                {labels[status]}
            </div>
        )
    }

    // --- RENDER ---
    return (
        <div className="space-y-6">
            
            {/* HEADER & NAVIGASI */}
            <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800 self-start sm:self-center">
                    <Button 
                        variant={viewMode === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('day')}
                        className={viewMode === 'day' ? 'bg-white text-black shadow-sm dark:bg-zinc-950 dark:text-white' : 'text-muted-foreground'}
                    >
                        Harian
                    </Button>
                    <Button 
                        variant={viewMode === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('month')}
                        className={viewMode === 'month' ? 'bg-white text-black shadow-sm dark:bg-zinc-950 dark:text-white' : 'text-muted-foreground'}
                    >
                        Bulanan
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-4 w-full sm:w-auto sm:justify-center rounded-lg border px-3 py-2 sm:border-none sm:p-0">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev} disabled={isLoadingData}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    
                    <div className="flex flex-col items-center min-w-[160px]">
                        <div className="flex items-center gap-2">
                            {viewMode === 'day' ? <CalendarIcon className="size-4 text-muted-foreground" /> : <CalendarDays className="size-4 text-muted-foreground" />}
                            <span className="text-sm font-bold">
                                {viewMode === 'day' 
                                    ? format(currentDate, 'd MMMM yyyy', { locale: idLocale })
                                    : format(currentDate, 'MMMM yyyy', { locale: idLocale })
                                }
                            </span>
                        </div>
                        {viewMode === 'day' && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {format(currentDate, 'EEEE', { locale: idLocale })}
                            </span>
                        )}
                    </div>

                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext} disabled={isLoadingData}>
                        <ChevronRight className="size-4" />
                    </Button>
                </div>

                <div className="hidden sm:block text-right min-w-[120px]">
                    {isLoadingData ? (
                        <span className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                            <Loader2 className="size-3 animate-spin" /> Memuat...
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            {viewMode === 'day' ? `${attendanceData.length} / ${classroom.students.length} Hadir` : 'Rekap Bulanan'}
                        </span>
                    )}
                </div>
            </div>

            {/* KONTEN UTAMA */}
            {isLoadingData ? (
                <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border bg-white text-muted-foreground dark:bg-zinc-950">
                    <Loader2 className="size-8 animate-spin mb-2" />
                    <p className="text-sm">Sedang mengambil data absensi...</p>
                </div>
            ) : viewMode === 'month' ? (
                
                // === VIEW BULANAN ===
                <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-950 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 border-b dark:bg-zinc-900">
                                    <th className="p-3 text-left font-bold min-w-[150px] sticky left-0 bg-neutral-50 z-10 border-r dark:bg-zinc-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Siswa</th>
                                    {eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).map(day => (
                                        <th key={day.toString()} className="p-2 text-center min-w-[35px] border-r last:border-0 font-normal text-muted-foreground">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[9px] uppercase">{format(day, 'EEEEE', { locale: idLocale })}</span>
                                                <span className={`font-bold ${['Saturday', 'Sunday'].includes(format(day, 'EEEE')) ? 'text-red-500' : ''}`}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="p-2 text-center font-bold border-l bg-neutral-50 sticky right-0 dark:bg-zinc-900">Total H</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {classroom.students.map((student) => {
                                    const records = attendanceData.filter(r => r.student_profile_id === student.id);
                                    const totalHadir = records.filter(r => r.status === 'hadir').length;
                                    return (
                                        <tr key={student.id} className="hover:bg-neutral-50/50">
                                            <td className="p-3 text-left font-medium sticky left-0 bg-white z-10 border-r border-neutral-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:bg-zinc-950 dark:border-zinc-800">
                                                <div className="truncate w-[140px]">{student.full_name}</div>
                                            </td>
                                            {eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).map(day => {
                                                const dStr = format(day, 'yyyy-MM-dd');
                                                const record = records.find(r => r.date === dStr);
                                                return (
                                                    <td key={day.toString()} className="p-1 text-center border-r last:border-0 dark:border-zinc-800">
                                                        {record ? getMiniBadge(record.status) : <span className="text-zinc-200 text-[9px]">•</span>}
                                                    </td>
                                                )
                                            })}
                                            <td className="p-2 text-center font-bold border-l bg-neutral-50 sticky right-0 dark:bg-zinc-900">{totalHadir}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            ) : (
                
                // === VIEW HARIAN (TABS) ===
                <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="manual" className="gap-2">
                            <ListChecks size={16}/> Laporan & Input
                        </TabsTrigger>
                        <TabsTrigger value="qr" className="gap-2">
                            <QrCode size={16}/> Scan QR Code
                        </TabsTrigger>
                    </TabsList>

                    {/* CONTENT MANUAL (HYBRID VIEW) */}
                    <TabsContent value="manual" className="mt-4">
                        <form onSubmit={submitManual}>
                            <div className="rounded-xl border bg-white shadow-sm overflow-hidden dark:bg-zinc-950">
                                <div className="flex items-center justify-between border-b px-4 py-3 bg-neutral-50 dark:bg-zinc-900">
                                    <div className="grid grid-cols-12 w-full gap-4 text-xs font-bold uppercase text-muted-foreground">
                                        <div className="col-span-12 md:col-span-3 flex items-center">Nama Siswa</div>
                                        <div className="col-span-12 md:col-span-6 text-center hidden md:block">Status Kehadiran</div>
                                        <div className="col-span-12 md:col-span-3 text-right flex items-center justify-end">
                                            {/* Tombol Edit Global: Mengubah semua baris jadi mode edit */}
                                            {!isEditing && attendanceData.length > 0 && (
                                                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} type="button">
                                                    <Edit className="mr-2 size-3" /> Edit Semua Data
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y">
                                    {classroom.students.map((student) => {
                                        // Cek apakah siswa ini SUDAH punya record di DB?
                                        const record = attendanceData.find(r => r.student_profile_id === student.id)
                                        
                                        // Logic Tampilan:
                                        // Tampilkan Form (Radio) JIKA:
                                        // 1. Sedang Mode Edit Global (isEditing = true)
                                        // 2. ATAU Siswa ini belum punya record (Belum Absen)
                                        const showForm = isEditing || !record;

                                        return (
                                            <div key={student.id} className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-neutral-50/50">
                                                {/* Kolom Nama */}
                                                <div className="col-span-12 md:col-span-3 mb-2 md:mb-0">
                                                    <p className="font-semibold text-sm">{student.full_name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{student.nik}</p>
                                                </div>

                                                {/* Kolom Status (Hybrid: Badge / Radio) */}
                                                <div className="col-span-12 md:col-span-6 flex justify-center items-center min-h-[40px]">
                                                    {showForm ? (
                                                        <RadioGroup 
                                                            value={manualData[student.id]?.status || 'hadir'} 
                                                            onValueChange={(val) => handleManualChange(student.id, 'status', val)}
                                                            className="flex flex-wrap items-center gap-2 sm:gap-4"
                                                        >
                                                            <AttendanceRadio idPrefix={student.id} value="hadir" label="H" color="bg-green-100 text-green-700 border-green-200" />
                                                            <AttendanceRadio idPrefix={student.id} value="sakit" label="S" color="bg-yellow-100 text-yellow-700 border-yellow-200" />
                                                            <AttendanceRadio idPrefix={student.id} value="izin" label="I" color="bg-blue-100 text-blue-700 border-blue-200" />
                                                            <AttendanceRadio idPrefix={student.id} value="alpha" label="A" color="bg-red-100 text-red-700 border-red-200" />
                                                            <AttendanceRadio idPrefix={student.id} value="terlambat" label="T" color="bg-orange-100 text-orange-700 border-orange-200" />
                                                        </RadioGroup>
                                                    ) : (
                                                        // Jika sudah ada record & bukan mode edit -> Tampilkan Badge
                                                        getStatusBadge(record!.status)
                                                    )}
                                                </div>

                                                {/* Kolom Catatan */}
                                                <div className="col-span-12 md:col-span-3 mt-2 md:mt-0 text-right">
                                                    {showForm ? (
                                                        <Input 
                                                            placeholder="Ket." 
                                                            value={manualData[student.id]?.note || ''}
                                                            onChange={(e) => handleManualChange(student.id, 'note', e.target.value)}
                                                            className="h-8 text-xs"
                                                        />
                                                    ) : (
                                                        record?.note && <span className="text-xs text-muted-foreground italic">"{record.note}"</span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* FOOTER ACTION BUTTONS */}
                            <div className="mt-4 flex justify-between sticky bottom-4 z-10">
                                {isEditing && (
                                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                                        Batal Edit
                                    </Button>
                                )}
                                
                                {/* Tombol Simpan Muncul Jika: Sedang Edit ATAU Ada siswa yang belum absen */}
                                {(isEditing || attendanceData.length < classroom.students.length) && (
                                    <div className="ml-auto">
                                        <Button type="submit" size="lg" className="shadow-xl bg-neutral-900 text-white dark:bg-white dark:text-black" disabled={processing}>
                                            <Save className="mr-2 size-4" /> 
                                            {processing ? 'Menyimpan...' : `Simpan Data (${isEditing ? 'Semua' : 'Baru'})`}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </TabsContent>

                    {/* CONTENT QR SCANNER */}
                    <TabsContent value="qr" className="mt-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Scanner */}
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

                            {/* Result */}
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
            )}
        </div>
    )
}

function AttendanceRadio({ idPrefix, value, label, color }: { idPrefix: number, value: string, label: string, color: string }) {
    const uniqueId = `r-${idPrefix}-${value}`
    return (
        <div>
            <RadioGroupItem value={value} id={uniqueId} className="peer sr-only" />
            <Label
                htmlFor={uniqueId}
                className={`flex size-8 cursor-pointer items-center justify-center rounded-md border text-xs font-bold uppercase transition-all hover:opacity-80 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-2 ${color} peer-data-[state=checked]:brightness-90 peer-data-[state=checked]:ring-black dark:peer-data-[state=checked]:ring-white`}
            >
                {label}
            </Label>
        </div>
    )
}