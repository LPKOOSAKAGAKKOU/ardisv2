<?php

namespace App\Services;

use App\Models\StudentReturn;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Membuat "Laporan Kepulangan Peserta Pemagangan Luar Negeri" (Data Alumni) bulanan
 * dengan mengisi sheet "Contoh" pada template Kemnaker.
 */
class ReturnReportService
{
    /** Index sheet data peserta alumni pada template (sheet ke-2, index 1). */
    public const SHEET_INDEX = 1;

    /** Baris pertama data alumni (baris 1 = judul kolom, baris 2 = nomor kolom). */
    private const FIRST_DATA_ROW = 3;

    private const LAST_COLUMN = 'Z';

    private const MONTHS_ID = [
        1 => 'JANUARI', 2 => 'FEBRUARI', 3 => 'MARET', 4 => 'APRIL',
        5 => 'MEI', 6 => 'JUNI', 7 => 'JULI', 8 => 'AGUSTUS',
        9 => 'SEPTEMBER', 10 => 'OKTOBER', 11 => 'NOVEMBER', 12 => 'DESEMBER',
    ];

    /**
     * Kepulangan siswa pada bulan terkait.
     *
     * @return Collection<int, StudentReturn>
     */
    public function returnsOfMonth(Carbon $month): Collection
    {
        return StudentReturn::query()
            ->whereYear('return_date', $month->year)
            ->whereMonth('return_date', $month->month)
            ->with([
                'departure.company',
                'departure.acceptingOrganization:id,name',
                'user.student_profile.educations',
            ])
            ->orderBy('return_date')
            ->orderBy('id')
            ->get();
    }

    /**
     * Susun baris laporan: satu baris per alumni yang pulang.
     *
     * @return array<int, array<string, mixed>>
     */
    public function rows(Carbon $month): array
    {
        $rows = [];

        foreach ($this->returnsOfMonth($month) as $returnRecord) {
            $rows[] = $this->row($returnRecord);
        }

        return $rows;
    }

    /**
     * Render template menjadi spreadsheet berisi data kepulangan bulan terkait.
     */
    public function build(Carbon $month): Spreadsheet
    {
        $templatePath = storage_path('app/templates/laporan_kepulangan_template.xlsx');

        abort_unless(file_exists($templatePath), 404, 'Template laporan kepulangan tidak ditemukan.');

        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getSheet(self::SHEET_INDEX);

        abort_unless($sheet !== null, 500, 'Sheet template kepulangan tidak ditemukan.');

        $this->dropBrokenDefinedNames($spreadsheet);

        $spreadsheet->setActiveSheetIndex($spreadsheet->getIndex($sheet));

        $rows = $this->rows($month);
        $first = self::FIRST_DATA_ROW;

        // Sisakan satu baris contoh sebagai donor gaya, sisanya dibuang.
        $lastRow = max($first, $sheet->getHighestRow());
        if ($lastRow > $first) {
            $sheet->removeRow($first + 1, $lastRow - $first);
        }

        if (count($rows) > 1) {
            $sheet->insertNewRowBefore($first + 1, count($rows) - 1);
            $this->copyRowStyleDown($sheet, $first, $first + count($rows) - 1);
        }

        $this->normalizeFontSize($sheet, $first, $first + max(count($rows), 1) - 1);

        if ($rows === []) {
            // Kosongkan baris pertama contoh jika tidak ada data kepulangan bulan ini
            foreach ($this->columns() as $column) {
                $sheet->setCellValue($column . $first, null);
            }

            return $spreadsheet;
        }

        foreach ($rows as $index => $row) {
            $rowNumber = $first + $index;

            $sheet->setCellValue('A' . $rowNumber, $index + 1);

            foreach ($row as $column => $value) {
                // NIK & no HP wajib string agar angka 0 di depan tidak terpotong
                if (in_array($column, ['D', 'E'], true)) {
                    $sheet->setCellValueExplicit($column . $rowNumber, (string) $value, DataType::TYPE_STRING);

                    continue;
                }

                $sheet->setCellValue($column . $rowNumber, $value === '' ? null : $value);
            }
        }

        return $spreadsheet;
    }

    private function copyRowStyleDown(Worksheet $sheet, int $sourceRow, int $lastRow): void
    {
        foreach ($this->columns() as $column) {
            $sheet->duplicateStyle(
                $sheet->getStyle($column . $sourceRow),
                $column . ($sourceRow + 1) . ':' . $column . $lastRow
            );
        }
    }

    private function normalizeFontSize(Worksheet $sheet, int $firstRow, int $lastRow): void
    {
        $sizes = [];
        foreach ($this->columns() as $column) {
            $size = $sheet->getStyle($column . $firstRow)->getFont()->getSize();
            if ($size !== null) {
                $sizes[(string) $size] = ($sizes[(string) $size] ?? 0) + 1;
            }
        }

        if ($sizes === []) {
            return;
        }

        arsort($sizes);

        $sheet->getStyle('A' . $firstRow . ':' . self::LAST_COLUMN . $lastRow)
            ->getFont()
            ->setSize((float) array_key_first($sizes));
    }

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
        return 'Laporan Kepulangan Peserta Pemagangan Luar Negeri - '
            . self::MONTHS_ID[$month->month] . ' ' . $month->year . '.xlsx';
    }

    public function monthLabel(Carbon $month): string
    {
        return ucfirst(strtolower(self::MONTHS_ID[$month->month])) . ' ' . $month->year;
    }

    /**
     * Satu baris alumni kepulangan.
     *
     * @return array<string, mixed>
     */
    private function row(StudentReturn $returnRecord): array
    {
        $student = $returnRecord->user;
        $profile = $student?->student_profile;
        $departure = $returnRecord->departure;
        $company = $departure?->company;

        $depDate = $departure?->departure_date;
        $retDate = $returnRecord->return_date;
        $durationMonths = BillingService::PROGRAM_MONTHS;

        $job = $this->jobType($company?->industry);

        return [
            'B'  => $this->upper(config('lpk.name')),
            'C'  => $this->upper($profile?->full_name ?? $student?->name),
            'D'  => $profile?->nik ?? '',
            'E'  => $profile?->phone_student ?? '',
            'F'  => $student?->email ?? '',
            'G'  => $this->gender($profile),
            'H'  => $profile?->address_ktp ?? '',
            'I'  => $this->upper(config('lpk.city')),
            'J'  => $this->upper($profile?->pob_province),
            'K'  => $this->upper($profile?->pob),
            'L'  => $profile?->dob?->format('d/m/Y') ?? '',
            'M'  => $durationMonths,
            'N'  => $departure?->isTokuteiGinou() ? 'TOKUTEI GINOU' : 'JISSHUUSEI',
            'O'  => $job['name'],
            'P'  => $job['group'],
            'Q'  => $job['name'],
            'R'  => $this->upper($company?->name ?: $departure?->company_name),
            'S'  => $this->upper($company?->address),
            'T'  => $this->prefecture($company?->prefecture),
            'U'  => config('lpk.destination_country'),
            'V'  => config('lpk.provider_type'),
            'W'  => $depDate?->format('d/m/Y') ?? '',
            'X'  => $retDate?->format('d/m/Y') ?? '',
            'Y'  => $returnRecord->reasonLabel(),
            'Z'  => $this->upper($returnRecord->notes),
        ];
    }

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

    private function prefecture(?string $prefecture): string
    {
        $prefecture = trim((string) $prefecture);

        return $this->upper(config('laporan_keberangkatan.prefectures')[$prefecture] ?? $prefecture);
    }

    private function gender(?\App\Models\StudentProfile $profile): string
    {
        return match (strtolower((string) $profile?->gender)) {
            'laki-laki' => 'LAKI-LAKI',
            'perempuan' => 'PEREMPUAN',
            default     => '',
        };
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
        );
    }
}
