<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\KemnakerReportLog;
use App\Services\DepartureReportService;
use App\Services\ReturnReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class KemnakerReportController extends Controller
{
    public const DEFAULT_WA = '+6285745945292';

    public function __construct(
        private DepartureReportService $departureReportService,
        private ReturnReportService $returnReportService
    ) {}

    public function getSummary(Request $request)
    {
        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);

        $carbonMonth = Carbon::createFromDate($year, $month, 1);

        // Hitung total peserta dari service
        $departures = $this->departureReportService->rows($carbonMonth);
        $returns = $this->returnReportService->rows($carbonMonth);

        $departureCount = count($departures);
        $returnCount = count($returns);

        $monthsId = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        $monthsEn = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        $monthName = $monthsId[$month] ?? 'Januari';
        $monthNameEn = $monthsEn[$month] ?? 'January';

        // Link Auto-Prefill Google Form Kemnaker
        $googleFormBaseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfTr13NEBcReV9eCsrNpwDmNQHhsMdgvK2expo8B4MZgEdy5g/viewform";
        $queryParams = http_build_query([
            'usp' => 'pp_url',
            'entry.2024986366' => 'PT OOSAKA GAKKOU',        // Nama LPK SO
            'entry.638972208'  => $monthNameEn,              // Bulan (English)
            'entry.262379175'  => (string) $year,            // Tahun
            'entry.1319946884' => (string) $departureCount,  // Realisasi Keberangkatan
            'entry.1714157754' => (string) $returnCount,     // Realisasi Kepulangan
            'entry.537604297'  => self::DEFAULT_WA,          // Nomor WhatsApp
        ]);
        $prefilledUrl = $googleFormBaseUrl . '?' . $queryParams;

        // Log pelaporan terakhir untuk bulan/tahun ini
        $lastLog = KemnakerReportLog::with('user:id,name')
            ->where('year', $year)
            ->where('month', $month)
            ->latest()
            ->first();

        // 5 Log pelaporan terbaru secara umum
        $recentLogs = KemnakerReportLog::with('user:id,name')
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'year' => $year,
            'month' => $month,
            'month_name' => $monthName,
            'departure_count' => $departureCount,
            'return_count' => $returnCount,
            'responsible_wa' => self::DEFAULT_WA,
            'prefilled_url' => $prefilledUrl,
            'last_log' => $lastLog,
            'recent_logs' => $recentLogs,
        ]);
    }

    public function downloadDeparture(Request $request)
    {
        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);
        $carbonMonth = Carbon::createFromDate($year, $month, 1);

        $spreadsheet = $this->departureReportService->build($carbonMonth);
        $filename = sprintf('Laporan_Keberangkatan_Kemnaker_%04d_%02d.xlsx', $year, $month);

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function downloadReturn(Request $request)
    {
        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);
        $carbonMonth = Carbon::createFromDate($year, $month, 1);

        $spreadsheet = $this->returnReportService->build($carbonMonth);
        $filename = sprintf('Laporan_Kepulangan_Kemnaker_%04d_%02d.xlsx', $year, $month);

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function logSubmission(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
            'departure_count' => 'required|integer|min:0',
            'return_count' => 'required|integer|min:0',
            'responsible_wa' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $log = KemnakerReportLog::create([
            'year' => $validated['year'],
            'month' => $validated['month'],
            'departure_count' => $validated['departure_count'],
            'return_count' => $validated['return_count'],
            'responsible_wa' => $validated['responsible_wa'] ?? self::DEFAULT_WA,
            'status' => 'success',
            'response_message' => 'Laporan telah dikirimkan ke Google Form Kemnaker (HTTP 200 OK)',
            'user_id' => $request->user()?->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Log pelaporan Kemnaker berhasil dicatat!',
            'log' => $log->load('user:id,name'),
        ]);
    }
}
