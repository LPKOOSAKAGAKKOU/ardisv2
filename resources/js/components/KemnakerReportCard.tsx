import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { 
    FileSpreadsheet, 
    ExternalLink, 
    CheckCircle2, 
    Clock, 
    Building2, 
    Users, 
    UserCheck, 
    Phone, 
    History,
    Loader2
} from 'lucide-react';
import axios from 'axios';

interface KemnakerReportLog {
    id: number;
    year: number;
    month: number;
    departure_count: number;
    return_count: number;
    responsible_wa: string;
    status: 'success' | 'failed';
    response_message?: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
    };
}

interface SummaryData {
    year: number;
    month: number;
    month_name: string;
    departure_count: number;
    return_count: number;
    responsible_wa: string;
    prefilled_url: string;
    last_log: KemnakerReportLog | null;
    recent_logs: KemnakerReportLog[];
}

export default function KemnakerReportCard() {
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
    const [loading, setLoading] = useState<boolean>(true);
    const [logging, setLogging] = useState<boolean>(false);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [showLogsModal, setShowLogsModal] = useState<boolean>(false);

    const months = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' },
    ];

    const years = [2023, 2024, 2025, 2026, 2027];

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/kemnaker-reports/summary', {
                params: { year: selectedYear, month: selectedMonth }
            });
            setSummary(res.data);
        } catch (error) {
            console.error("Gagal memuat ringkasan laporan Kemnaker:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [selectedYear, selectedMonth]);

    const handleOpenGoogleForm = () => {
        if (!summary?.prefilled_url) return;
        window.open(summary.prefilled_url, '_blank');
    };

    const handleLogSubmission = async () => {
        if (!summary) return;
        setLogging(true);
        try {
            await axios.post('/admin/kemnaker-reports/log', {
                year: selectedYear,
                month: selectedMonth,
                departure_count: summary.departure_count,
                return_count: summary.return_count,
                responsible_wa: summary.responsible_wa
            });
            await fetchSummary();
        } catch (error) {
            console.error("Gagal mencatat log pelaporan Kemnaker:", error);
        } finally {
            setLogging(false);
        }
    };

    return (
        <Card className="border shadow-sm bg-card text-card-foreground">
            <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                            <CardTitle className="text-base sm:text-lg font-bold">
                                Pelaporan Bulanan Kemnaker (Google Form)
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            Format otomatis sesuai formulir resmi Rekapitulasi Data Peserta Magang Luar Negeri Kemnaker RI.
                        </CardDescription>
                    </div>

                    {/* Selector Bulan & Tahun */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                            <SelectTrigger className="w-[120px] h-9 text-xs">
                                <SelectValue placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m.value} value={m.value.toString()} className="text-xs">
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                            <SelectTrigger className="w-[90px] h-9 text-xs">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y.toString()} className="text-xs">
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Memuat data pelaporan...</span>
                    </div>
                ) : (
                    <>
                        {/* Status Pelaporan Bulan Terpilih */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-background">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground">Status Pelaporan ({summary?.month_name} {selectedYear}):</span>
                                {summary?.last_log ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-xs font-medium gap-1 py-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Sudah Dilaporkan ({new Date(summary.last_log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 text-xs font-medium gap-1 py-1">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        Belum Dilaporkan
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WA PJ: <strong>{summary?.responsible_wa || '+62 857 4594 5292'}</strong></span>
                            </div>
                        </div>

                        {/* Summary Numbers Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Realisasi Keberangkatan</p>
                                    <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{summary?.departure_count || 0} <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">Peserta</span></p>
                                </div>
                                <a 
                                    href={`/admin/kemnaker-reports/download-departure?year=${selectedYear}&month=${selectedMonth}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 dark:text-emerald-200 bg-white dark:bg-emerald-900 px-3 py-2 rounded-md border border-emerald-300 dark:border-emerald-700 shadow-sm transition-colors"
                                    title="Download File Excel Keberangkatan"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    <span>Langkah 1: Download Excel</span>
                                </a>
                            </div>

                            <div className="p-3.5 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Realisasi Kepulangan</p>
                                    <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{summary?.return_count || 0} <span className="text-xs font-normal text-blue-700 dark:text-blue-400">Peserta</span></p>
                                </div>
                                <a 
                                    href={`/admin/kemnaker-reports/download-return?year=${selectedYear}&month=${selectedMonth}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950 dark:text-blue-200 bg-white dark:bg-blue-900 px-3 py-2 rounded-md border border-blue-300 dark:border-blue-700 shadow-sm transition-colors"
                                    title="Download File Excel Kepulangan"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                                    <span>Download Excel Kepulangan</span>
                                </a>
                            </div>
                        </div>

                        {/* Petunjuk Ringkas 3 Langkah Pelaporan */}
                        <div className="p-3 rounded-lg border bg-muted/40 text-xs space-y-1.5">
                            <p className="font-bold text-foreground flex items-center gap-1.5">
                                💡 Alur Cepat Pelaporan Bulanan Kemnaker (3 Langkah):
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                                <li>Klik <strong>Langkah 1: Download Excel</strong> ➔ Buka file untuk review data peserta.</li>
                                <li>Klik <strong>Langkah 2: Buka Google Form</strong> ➔ Seluruh teks & angka sudah terisi otomatis (0-ketik).</li>
                                <li>Di Google Form bagian <strong>File Rekapitulasi</strong>, klik <strong>"Tambahkan file"</strong> ➔ pilih file Excel ➔ klik <strong>Kirim</strong>.</li>
                            </ol>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                            <Button 
                                type="button" 
                                onClick={handleOpenGoogleForm}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 shadow-sm"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Langkah 2: Buka Google Form (Auto-Fill {summary?.month_name} {selectedYear})</span>
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleLogSubmission}
                                    disabled={logging}
                                    className="gap-1.5 text-xs h-9 border-slate-300 dark:border-slate-700"
                                >
                                    {logging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                                    <span>{summary?.last_log ? 'Perbarui Log Kirim' : 'Tandai Sudah Terkirim'}</span>
                                </Button>

                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setShowLogsModal(!showLogsModal)}
                                    className="gap-1 text-xs h-9 text-muted-foreground hover:text-foreground"
                                >
                                    <History className="w-3.5 h-3.5" />
                                    <span>Riwayat ({summary?.recent_logs?.length || 0})</span>
                                </Button>
                            </div>
                        </div>

                        {/* Table Riwayat Log Terakhir */}
                        {showLogsModal && (
                            <div className="pt-3 border-t space-y-2">
                                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5" />
                                    <span>5 Catatan Log Pelaporan Terakhir</span>
                                </p>
                                <div className="border rounded-md overflow-hidden text-xs">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                                            <tr>
                                                <th className="p-2">Waktu Kirim</th>
                                                <th className="p-2">Periode</th>
                                                <th className="p-2">Berangkat / Pulang</th>
                                                <th className="p-2">Admin Eksekutor</th>
                                                <th className="p-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {summary?.recent_logs && summary.recent_logs.length > 0 ? (
                                                summary.recent_logs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-muted/30">
                                                        <td className="p-2 text-muted-foreground">
                                                            {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="p-2 font-medium">{months.find(m => m.value === log.month)?.label} {log.year}</td>
                                                        <td className="p-2">{log.departure_count} Berangkat / {log.return_count} Pulang</td>
                                                        <td className="p-2 text-muted-foreground">{log.user?.name || 'Admin'}</td>
                                                        <td className="p-2">
                                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0">
                                                                Terkirim (200 OK)
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="p-3 text-center text-muted-foreground text-xs">
                                                        Belum ada catatan riwayat pelaporan.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
