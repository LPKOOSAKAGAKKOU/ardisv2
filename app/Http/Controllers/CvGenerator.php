<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\InterviewDetail; // Pastikan import model ini
use App\Services\YunervaService;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class CvGenerator extends Controller
{
    /**
     * @param int $userId
     * @param int|null $interviewId // Tambahkan parameter ini
     */
    public static function generate($userId, $interviewId = null)
    {
        // 1. Ambil data siswa
        $student = User::with([
            'student_profile.educations', 
            'student_profile.experiences',
            'student_profile.families'
        ])->findOrFail($userId);

        $profile = $student->student_profile;

        // 2. Ambil data spesifik Wawancara (Nomor Urut & Nama Perusahaan)
        $interviewInfo = null;
        if ($interviewId) {
            $interviewInfo = InterviewDetail::where('user_id', $userId)
                ->where('interview_id', $interviewId)
                ->with('interview.company')
                ->first();
        }

        // Load Template
        $templatePath = storage_path('app/templates/cv_template.xlsx');
        if (!file_exists($templatePath)) {
            abort(404, 'Template CV tidak ditemukan.');
        }

        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getActiveSheet();

        // --- DATA WAWANCARA SPESIFIK ---
        if ($interviewInfo) {
            // Contoh: Taruh Nomor Urut di pojok kanan atas (Misal cell L1)
            $sheet->setCellValue('L1', 'No. Urut: ' . $interviewInfo->order_number);
            
            // Contoh: Taruh Nama Perusahaan di area judul (Misal cell C2)
            $sheet->setCellValue('C2', 'Wawancara: ' . $interviewInfo->interview->company->name);
        }

        // --- 1. DATA IDENTITAS ---
        $sheet->setCellValue('C4', $profile->full_name);
        $sheet->setCellValue('C10', $profile->address_current);
        $sheet->getStyle('C10')->getAlignment()->setWrapText(true);

        // --- 2. HANDLING FOTO (YUNERVA) ---
        $yunerva = app(YunervaService::class);
        if ($profile->photo_yunerva_uuid) {
            try {
                $res = $yunerva->generateViewLink($profile->photo_yunerva_uuid, $profile->yunerva_file_password);
                if (isset($res['status']) && $res['status'] === 'success') {
                    $imageUrl = $res['data']['view_url'];
                    $imageContent = file_get_contents($imageUrl);
                    $tempPath = storage_path('app/temp_photo_' . $profile->photo_yunerva_uuid . '.jpg');
                    File::put($tempPath, $imageContent);

                    $drawing = new Drawing();
                    $drawing->setName('Student_Photo');
                    $drawing->setPath($tempPath);
                    $drawing->setCoordinates('L4'); 
                    $drawing->setHeight(140); 
                    $drawing->setWorksheet($sheet);

                    register_shutdown_function(fn() => File::exists($tempPath) && File::delete($tempPath));
                }
            } catch (\Exception $e) {
                Log::error("Gagal memuat foto Yunerva: " . $e->getMessage());
            }
        }

        // --- 3. RIWAYAT PENDIDIKAN (Tetap) ---
        $eduRow = 15;
        foreach ($profile->educations->take(5) as $edu) {
            $sheet->setCellValue('B' . $eduRow, Carbon::parse($edu->entry_date)->format('Y'));
            $sheet->setCellValue('C' . $eduRow, Carbon::parse($edu->entry_date)->format('m'));
            $sheet->setCellValue('D' . $eduRow, $edu->school_name . ' 入学');
            $eduRow++;
            $sheet->setCellValue('B' . $eduRow, Carbon::parse($edu->graduation_date)->format('Y'));
            $sheet->setCellValue('C' . $eduRow, Carbon::parse($edu->graduation_date)->format('m'));
            $sheet->setCellValue('D' . $eduRow, $edu->school_name . ' 卒業');
            $eduRow++;
        }

        // --- 4. RIWAYAT PEKERJAAN (Tetap) ---
        $expRow = 25; 
        foreach ($profile->experiences->take(5) as $exp) {
            $sheet->setCellValue('B' . $expRow, Carbon::parse($exp->start_date)->format('Y'));
            $sheet->setCellValue('C' . $expRow, Carbon::parse($exp->start_date)->format('m'));
            $sheet->setCellValue('D' . $expRow, $exp->company_name . ' (' . $exp->job_type . ') 入社');
            $expRow++;
            if ($exp->end_date) {
                $sheet->setCellValue('B' . $expRow, Carbon::parse($exp->end_date)->format('Y'));
                $sheet->setCellValue('C' . $expRow, Carbon::parse($exp->end_date)->format('m'));
                $sheet->setCellValue('D' . $expRow, $exp->company_name . ' 退社');
                $expRow++;
            }
        }

        // --- 5. DAFTAR KELUARGA (Tetap) ---
        $familyRow = 15;
        foreach ($profile->families->take(6) as $family) {
            $sheet->setCellValue('H' . $familyRow, $family->relationship);
            $sheet->setCellValue('I' . $familyRow, $family->name);
            $sheet->setCellValue('J' . $familyRow, $family->age . ' 歳');
            $sheet->setCellValue('K' . $familyRow, $family->occupation);
            $familyRow++;
        }

        // --- 6. PROSES DOWNLOAD ---
        $filename = "CV_" . str_replace(' ', '_', $profile->full_name) . ".xlsx";
        if (ob_get_contents()) ob_end_clean();

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="'. $filename .'"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}