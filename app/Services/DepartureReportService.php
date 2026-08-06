<?php

namespace App\Services;

use App\Models\Departure;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

/**
 * Membuat "Laporan Keberangkatan Peserta Magang Luar Negeri" bulanan
 * dengan mengisi sheet BNBA (By Name By Address) pada template Kemnaker.
 *
 * Aturan pengisian mengikuti sheet "Format Pengisian" pada template:
 * satu peserta satu baris, huruf kapital, tanggal DD/MM/YYYY.
 */
class DepartureReportService
{
    /** Nama sheet BNBA di dalam template (sheet ke-2). */
    public const SHEET_NAME = 'BNBA MAGANG LN';

    /** Baris pertama data peserta (baris 1 = judul kolom, baris 2 = nomor kolom). */
    private const FIRST_DATA_ROW = 3;

    private const LAST_COLUMN = 'AA';

    /** Urutan jenjang pendidikan untuk menentukan pendidikan terakhir. */
    private const EDUCATION_RANK = [
        'SD'               => 1,
        'SMP'              => 2,
        'SMA/SMK'          => 3,
        'Perguruan Tinggi' => 4,
    ];

    private const MONTHS_ID = [
        1 => 'JANUARI', 2 => 'FEBRUARI', 3 => 'MARET', 4 => 'APRIL',
        5 => 'MEI', 6 => 'JUNI', 7 => 'JULI', 8 => 'AGUSTUS',
        9 => 'SEPTEMBER', 10 => 'OKTOBER', 11 => 'NOVEMBER', 12 => 'DESEMBER',
    ];

    /**
     * Keberangkatan (selain yang dibatalkan) pada satu bulan, siap dipakai
     * baik untuk laporan maupun rekap.
     *
     * @return Collection<int, Departure>
     */
    public function departuresOfMonth(Carbon $month): Collection
    {
        return Departure::query()
            ->where('status', '!=', 'cancelled')
            ->whereYear('departure_date', $month->year)
            ->whereMonth('departure_date', $month->month)
            ->with([
                'company',
                'acceptingOrganization:id,name',
                'interview.details.user.student_profile.educations',
            ])
            ->orderBy('departure_date')
            ->orderBy('id')
            ->get();
    }

    /**
     * Susun baris laporan: satu baris per peserta. Keberangkatan yang belum
     * ditautkan ke wawancara tetap dimunculkan sebanyak jumlah orangnya dengan
     * kolom identitas kosong, agar total headcount laporan tetap benar.
     *
     * @return array<int, array<string, mixed>>
     */
    public function rows(Carbon $month): array
    {
        $rows = [];

        foreach ($this->departuresOfMonth($month) as $departure) {
            $students = $departure->interview?->details
                ->where('result', 'passed')
                ->map(fn ($detail) => $detail->user)
                ->filter()
                ->values() ?? collect();

            if ($students->isEmpty()) {
                foreach (range(1, max(1, $departure->people_count)) as $ignored) {
                    $rows[] = $this->row($departure, null);
                }

                continue;
            }

            foreach ($students as $student) {
                $rows[] = $this->row($departure, $student);
            }
        }

        return $rows;
    }

    /**
     * Render template menjadi spreadsheet berisi data bulan terkait.
     */
    public function build(Carbon $month): Spreadsheet
    {
        $templatePath = storage_path('app/templates/laporan_keberangkatan_template.xlsx');

        abort_unless(file_exists($templatePath), 404, 'Template laporan keberangkatan tidak ditemukan.');

        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getSheetByName(self::SHEET_NAME);

        abort_unless($sheet !== null, 500, 'Sheet "' . self::SHEET_NAME . '" tidak ada pada template.');

        $this->dropBrokenDefinedNames($spreadsheet);

        $spreadsheet->setActiveSheetIndex($spreadsheet->getIndex($sheet));

        $rows = $this->rows($month);
        $first = self::FIRST_DATA_ROW;

        // Sisakan satu baris contoh sebagai donor gaya, sisanya dibuang.
        $lastRow = max($first, $sheet->getHighestRow());
        if ($lastRow > $first) {
            $sheet->removeRow($first + 1, $lastRow - $first);
        }

        $styleRange = 'A' . $first . ':' . self::LAST_COLUMN . $first;

        if (count($rows) > 1) {
            $sheet->insertNewRowBefore($first + 1, count($rows) - 1);
            $sheet->duplicateStyle(
                $sheet->getStyle($styleRange),
                'A' . ($first + 1) . ':' . self::LAST_COLUMN . ($first + count($rows) - 1)
            );
        }

        if ($rows === []) {
            // Tidak ada keberangkatan: kosongkan baris contoh, pertahankan format.
            foreach ($this->columns() as $column) {
                $sheet->setCellValue($column . $first, null);
            }

            return $spreadsheet;
        }

        foreach ($rows as $index => $row) {
            $rowNumber = $first + $index;

            $sheet->setCellValue('A' . $rowNumber, $index + 1);

            foreach ($row as $column => $value) {
                // NIK & no. HP harus tetap teks agar angka nol di depan tidak hilang.
                if (in_array($column, ['B', 'F'], true)) {
                    $sheet->setCellValueExplicit($column . $rowNumber, (string) $value, DataType::TYPE_STRING);

                    continue;
                }

                $sheet->setCellValue($column . $rowNumber, $value === '' ? null : $value);
            }
        }

        return $spreadsheet;
    }

    /**
     * Template memuat defined name warisan yang menunjuk workbook lain
     * (mis. Jenis_Kelamin = '[1]DROPDOWN'!$A$1:$A$2). PhpSpreadsheet tidak
     * ikut menulis bagian externalLinks, sehingga indeks "[1]" jadi menggantung
     * dan Excel menolak file dengan pesan "We found a problem with some content".
     * Nama-nama tersebut tidak dipakai rumus mana pun, jadi aman dibuang.
     */
    private function dropBrokenDefinedNames(Spreadsheet $spreadsheet): void
    {
        foreach ($spreadsheet->getDefinedNames() as $definedName) {
            if (preg_match('/\[\d+\]|#REF!/', $definedName->getValue()) !== 1) {
                continue;
            }

            $spreadsheet->removeDefinedName($definedName->getName(), $definedName->getScope());
        }
    }

    public function filename(Carbon $month): string
    {
        return 'Laporan Keberangkatan Peserta Magang Luar Negeri - '
            . self::MONTHS_ID[$month->month] . ' ' . $month->year . '.xlsx';
    }

    public function monthLabel(Carbon $month): string
    {
        return ucfirst(strtolower(self::MONTHS_ID[$month->month])) . ' ' . $month->year;
    }

    /**
     * Satu baris peserta. Kolom yang datanya belum tersedia di sistem
     * (mis. kabupaten/kota asal) sengaja dikosongkan, bukan ditebak.
     *
     * @return array<string, mixed>
     */
    private function row(Departure $departure, ?User $student): array
    {
        $profile = $student?->student_profile;
        $company = $departure->company;
        $date = $departure->departure_date;
        $durationMonths = BillingService::PROGRAM_MONTHS;

        $job = $this->jobType($company?->industry);

        return [
            'B'  => $profile?->nik ?? '',
            'C'  => $this->upper($profile?->full_name ?? $student?->name),
            'D'  => $this->gender($profile),
            'E'  => $this->lastEducation($profile),
            'F'  => $profile?->phone_student ?? '',
            'G'  => $student?->email ?? '',
            'H'  => $profile?->address_ktp ?? '',
            'I'  => $this->upper($profile?->pob),
            'J'  => $profile?->dob?->format('d/m/Y') ?? '',
            'K'  => $this->prefecture($company?->prefecture),
            'L'  => config('lpk.destination_country'),
            'M'  => $departure->isTokuteiGinou() ? 'TOKUTEI GINOU' : 'JISSHUUSEI',
            'N'  => $job['name'],
            'O'  => $durationMonths,
            'P'  => $date?->format('d/m/Y') ?? '',
            'Q'  => $date?->copy()->addMonthsNoOverflow($durationMonths)->format('d/m/Y') ?? '',
            'R'  => config('lpk.provider_type'),
            'S'  => $this->upper(config('lpk.name')),
            'T'  => $this->upper($profile?->pob_province),
            'U'  => '', // Kabupaten/Kota asal peserta belum tersimpan terpisah.
            'V'  => $date ? self::MONTHS_ID[$date->month] : '',
            'W'  => $job['group'],
            'X'  => $job['name'],
            // Nama & alamat perusahaan versi latin; `company_name` (snapshot) hanya
            // dipakai untuk data lama tanpa record perusahaan dan bisa berupa kanji.
            'Y'  => $this->upper($company?->name ?: $departure->company_name),
            'Z'  => $this->upper($company?->address),
            'AA' => '', // Hanya diisi untuk peserta yang sudah selesai magang.
        ];
    }

    /**
     * Jenis pekerjaan versi Indonesia. `companies.industry` tersimpan sebagai
     * kanji (nilai dropdown form perusahaan), sedangkan laporan wajib
     * berbahasa Indonesia. Istilah di luar peta ditulis apa adanya.
     *
     * @return array{name: string, group: string}
     */
    private function jobType(?string $industry): array
    {
        $industry = trim((string) $industry);

        if ($industry === '') {
            return ['name' => '', 'group' => ''];
        }

        $mapped = config('laporan_keberangkatan.job_types')[$industry] ?? null;

        return [
            'name'  => $this->upper($mapped['name'] ?? $industry),
            'group' => $this->upper($mapped['group'] ?? ''),
        ];
    }

    /**
     * Prefektur tujuan dalam huruf latin (tersimpan sebagai kanji, mis. 大阪府).
     */
    private function prefecture(?string $prefecture): string
    {
        $prefecture = trim((string) $prefecture);

        return $this->upper(config('laporan_keberangkatan.prefectures')[$prefecture] ?? $prefecture);
    }

    private function gender(?StudentProfile $profile): string
    {
        return match (strtolower((string) $profile?->gender)) {
            'laki-laki' => 'LAKI-LAKI',
            'perempuan' => 'PEREMPUAN',
            default     => '',
        };
    }

    private function lastEducation(?StudentProfile $profile): string
    {
        $level = $profile?->educations
            ->sortByDesc(fn ($education) => self::EDUCATION_RANK[$education->level] ?? 0)
            ->first()?->level;

        return $this->upper($level);
    }

    private function upper(?string $value): string
    {
        return mb_strtoupper(trim((string) $value));
    }

    /**
     * @return array<int, string>
     */
    private function columns(): array
    {
        return array_merge(
            range('A', 'Z'),
            ['AA'],
        );
    }
}
