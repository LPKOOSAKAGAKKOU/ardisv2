<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\InterviewDetail;
use App\Services\YunervaService;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\{File, Log, DB};

class CvGenerator extends Controller
{
    public static function generate($userId, $interviewId = null)
    {
        // 1. Ambil data dengan Eager Loading untuk performa
        $student = User::with([
            'student_profile.educations', 
            'student_profile.experiences',
            'student_profile.families'
        ])->findOrFail($userId);

        $profile = $student->student_profile;

        // 2. Lookup Data Wawancara
        $interviewInfo = $interviewId ? InterviewDetail::where('user_id', $userId)
            ->where('interview_id', $interviewId)
            ->with('interview.company')
            ->first() : null;

        // 3. Load Template
        $templatePath = storage_path('app/templates/cv_template.xlsx');
        if (!file_exists($templatePath)) abort(404, 'Template CV tidak ditemukan.');

        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getActiveSheet();

        // --- HELPER ARRAYS ---
        $masterMajors = DB::table('majors')->pluck('name_jp', 'name_id')
            ->mapWithKeys(fn($item, $key) => [strtolower(trim($key)) => $item]);
        
        $masterSectors = DB::table('job_sectors')->pluck('name_jp', 'name_id')
            ->mapWithKeys(fn($item, $key) => [strtolower(trim($key)) => $item]);
        
        // Tambahkan lookup untuk Provinsi
        $masterProvinces = DB::table('provinces')->pluck('name_jp', 'name_id')
            ->mapWithKeys(fn($item, $key) => [strtolower(trim($key)) => $item]);

        $maps = [
            'color_blind' => ['normal' => '正常', 'parsial' => '色覚異常', 'biru-kuning' => '色覚異常', 'merah-hijau' => '色覚異常', 'total' => '全色盲'],
            'marital'     => ['Belum Menikah' => '未婚', 'Menikah' => '既婚', 'Cerai' => '離婚', 'Cerai Mati' => '死別'],
            'smoking'     => ['merokok' => '吸う', 'tidak merokok' => '吸わない'],
            'alcohol'     => ['minum' => '飲む', 'tidak minum' => '飲まない'],
            'yes_no'      => ['ada' => '有', 'tidak' => '無'],
            'religion'    => ['Islam' => 'イスラム教', 'Kristen' => 'キリスト教', 'Katholik' => 'カトリック', 'Hindu' => 'ヒンドゥー教', 'Budha' => '仏教', 'Kong Hu Chu' => '儒教']
        ];

        // --- DATA WAWANCARA ---
        if ($interviewInfo) {
            $sheet->setCellValue('AI4', $interviewInfo->order_number);
            $sheet->getStyle('AI4')->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'font' => ['size' => 18, 'bold' => true]
            ]);
        }

        // --- 1. IDENTITAS (Baris 12 - 26) ---
        $sheet->setCellValue('M12', $profile->full_name_katakana);
        $sheet->setCellValue('M14', $profile->full_name);
        $sheet->setCellValue('C18', ($profile->gender === 'Laki-laki' ? '男' : '女'));
        $sheet->setCellValue('H18', Carbon::parse($profile->dob)->age . ' 歳');
        // Logika POB: Nama Kota (tetap) + Provinsi (Jepang)
        $provinceJp = $masterProvinces[strtolower(trim($profile->pob_province))] ?? $profile->pob_province;
        $sheet->setCellValue('M18', $profile->pob . ' ' . $provinceJp);
        $sheet->setCellValue('X18', Carbon::parse($profile->dob)->format('Y年 m月 d日'));

        $sheet->setCellValue('B22', $profile->height);
        $sheet->setCellValue('H22', $profile->weight);
        $sheet->setCellValue('M22', $profile->blood_type);
        $sheet->setCellValue('S22', $profile->address_ktp);
        $sheet->setCellValue('AI22', $maps['yes_no'][$profile->tattoo] ?? '無');
        $sheet->setCellValue('AM22', $maps['color_blind'][$profile->color_blind] ?? '正常');

        $sheet->setCellValue('B26', $maps['marital'][$profile->marital_status] ?? '未婚');
        $sheet->setCellValue('H26', $maps['smoking'][$profile->smoking] ?? '吸わない');
        $sheet->setCellValue('M26', $maps['alcohol'][$profile->alcohol] ?? '飲まない');
        $sheet->setCellValue('S26', $maps['yes_no'][$profile->has_passport] ?? '無');
        $sheet->setCellValue('S27', $profile->passport_number);
        $sheet->setCellValue('W26', $maps['yes_no'][$profile->family_in_japan] ?? '無');
        $sheet->setCellValue('AA26', (int)Carbon::parse($profile->entry_date_lpk)->diffInMonths(now()) . 'ヶ月');
        $sheet->setCellValue('AI26', $maps['religion'][$profile->religion] ?? '-');

        // --- 2. FOTO (YUNERVA) ---
        if ($profile->photo_yunerva_uuid) {
            try {
                $yunerva = app(YunervaService::class);
                $res = $yunerva->generateViewLink($profile->photo_yunerva_uuid, $profile->yunerva_file_password);
                if (($res['status'] ?? '') === 'success') {
                    $tempPath = storage_path('app/temp_photo_' . $profile->photo_yunerva_uuid . '.jpg');
                    File::put($tempPath, file_get_contents($res['data']['view_url']));

                    $drawing = new Drawing();
                    $drawing->setPath($tempPath);
                    $drawing->setCoordinates('AI12');
                    
                    list($width, $height) = getimagesize($tempPath);
                    if ($width / 136 > $height / 158) $drawing->setWidth(136); else $drawing->setHeight(158);

                    $drawing->setResizeProportional(true);
                    $drawing->setOffsetX(2);
                    $drawing->setOffsetY(2);
                    $drawing->setWorksheet($sheet);

                    register_shutdown_function(fn() => File::exists($tempPath) && File::delete($tempPath));
                }
            } catch (\Exception $e) { Log::error("Foto Error: " . $e->getMessage()); }
        }

        // --- 3. PENDIDIKAN (31-34) ---
        $row = 31;
        foreach ($profile->educations->take(4) as $edu) {
            $sheet->setCellValue('E'.$row, Carbon::parse($edu->entry_date)->format('Y年 m月'));
            $sheet->setCellValue('I'.$row, Carbon::parse($edu->graduation_date)->format('Y年 m月'));
            $sheet->setCellValue('M'.$row, $edu->school_type . $edu->level . ' ' . $edu->school_name);
            $sheet->setCellValue('AI'.$row, $masterMajors[strtolower(trim($edu->major))] ?? $edu->major);
            $sheet->getStyle("E$row:AI$row")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $row++;
        }

        // --- 4. PEKERJAAN (37-39) ---
        $row = 37;
        foreach ($profile->experiences->sortByDesc('start_date')->take(3) as $exp) {
            $sheet->setCellValue('E'.$row, Carbon::parse($exp->start_date)->format('Y年 m月'));
            $sheet->setCellValue('I'.$row, $exp->end_date ? Carbon::parse($exp->end_date)->format('Y年 m月') : '現在に至る');
            $sheet->setCellValue('M'.$row, $exp->company_name);
            $sheet->setCellValue('AD'.$row, $masterSectors[strtolower(trim($exp->job_type))] ?? $exp->job_type);
            $sheet->getStyle("E$row:AD$row")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $row++;
        }

        // --- 5. KELUARGA (43-51) ---
        $row = 43;
        foreach ($profile->families->take(9) as $fam) {
            $sheet->setCellValue('G'.$row, $fam->relationship);
            $sheet->setCellValue('M'.$row, $fam->name);
            $sheet->setCellValue('AD'.$row, $fam->age . ' 歳');
            $sheet->setCellValue('AI'.$row, $masterSectors[strtolower(trim($fam->occupation))] ?? $fam->occupation);
            $sheet->getStyle("G$row:AI$row")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle('AD'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $row++;
        }

        // --- 6. INFO TAMBAHAN ---
        $sheet->setCellValue('AI53', $profile->hobby ?? '-');
        $sheet->setCellValue('AI54', $profile->skill_technical ?? '-');
        $sheet->setCellValue('AI55', $profile->strength ?? '-');
        $sheet->setCellValue('AI56', $profile->weakness ?? '-');
        $sheet->setCellValue('AI57', $profile->savings_target ?? '-');
        $sheet->setCellValue('AI58', $profile->savings_reason ?? '-');

        // --- DOWNLOAD ---
        $filename = "CV_" . str_replace(' ', '_', $profile->full_name) . ".xlsx";
        if (ob_get_contents()) ob_end_clean();

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="'. $filename .'"');
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}