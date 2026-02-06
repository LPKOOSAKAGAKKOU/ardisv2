<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\InterviewDetail;
use App\Services\YunervaService;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request; // <-- WAJIB ADA
use Illuminate\Support\Facades\{File, Log, DB};

class CvGenerator extends Controller
{

    public function generate(Request $request, $userId, $interviewId = null)
    {
        // PROTEKSI: Cek apakah user yang login adalah siswa
        $userLogon = auth()->user();
        
        // Jika role siswa, pastikan userId yang diminta adalah id miliknya sendiri
        if ($userLogon->role === 'student' && $userLogon->id != $userId) {
            abort(403, 'Anda tidak memiliki akses untuk melihat CV ini.');
        }
        
        try {
            // 1. Ambil data
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
            if (!file_exists($templatePath)) {
                return response()->json(['status' => 'error', 'message' => 'Template tidak ditemukan'], 404);
            }

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
            if ($profile->japanese_language_certificate_yunerva_uuid) {
                $sheet->setCellValue('AA11', 'JFT-Basic（A2）または N4 の資格を取得済み');
            } else {
                $sheet->setCellValue('AA11', '日本語能力試験の資格は取得していません');
            }

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

            // Definisikan urutan berdasarkan value enum
            $educationOrder = [
                '小学校' => 1, // SD
                '中学校' => 2, // SMP
                '高校'   => 3, // SMA
                '大学'   => 4, // Universitas
            ];

            // Urutkan koleksi berdasarkan map di atas, lalu ambil 4 data teratas
            $sortedEducations = $profile->educations->sortBy(function ($edu) use ($educationOrder) {
                return $educationOrder[$edu->level] ?? 99; // 99 untuk jaga-jaga jika ada level lain
            })->take(4);

            foreach ($sortedEducations as $edu) {
                $sheet->setCellValue('E'.$row, Carbon::parse($edu->entry_date)->format('Y年 m月'));
                $sheet->setCellValue('I'.$row, Carbon::parse($edu->graduation_date)->format('Y年 m月'));
                $sheet->setCellValue('M'.$row, $edu->school_type . $edu->level . ' ' . $edu->school_name);
                $sheet->setCellValue('AI'.$row, $masterMajors[strtolower(trim($edu->major))] ?? $edu->major);
                $sheet->getStyle("E$row:AI$row")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                $row++;
            }

            // --- 4. PEKERJAAN (37-39) ---
            $row = 37;

            // Gunakan sortBy (bukan sortByDesc) untuk urutan kronologis (tua ke baru)
            // Sertakan start_date sebagai primary sort dan end_date sebagai secondary sort untuk menangani double job
            $sortedExperiences = $profile->experiences
                ->sort(function ($a, $b) {
                    // Bandingkan start_date
                    $startCompare = Carbon::parse($a->start_date)->timestamp <=> Carbon::parse($b->start_date)->timestamp;
                    
                    if ($startCompare !== 0) {
                        return $startCompare;
                    }

                    // Jika start_date sama (misal kerja double di hari yang sama), bandingkan end_date
                    // Pekerjaan yang masih berlangsung (null) ditaruh di paling bawah
                    $endA = $a->end_date ? Carbon::parse($a->end_date)->timestamp : PHP_INT_MAX;
                    $endB = $b->end_date ? Carbon::parse($b->end_date)->timestamp : PHP_INT_MAX;

                    return $endA <=> $endB;
                })
                ->take(3);

            foreach ($sortedExperiences as $exp) {
                // Pastikan start_date valid untuk dicarbonize
                $startDate = $exp->start_date ? Carbon::parse($exp->start_date)->format('Y年 m月') : '';
                
                // Logika Akhir Kerja: Jika null berarti masih bekerja (現在に至る)
                $endDate = $exp->end_date ? Carbon::parse($exp->end_date)->format('Y年 m月') : '現在に至る';

                $sheet->setCellValue('E'.$row, $startDate);
                $sheet->setCellValue('I'.$row, $endDate);
                $sheet->setCellValue('M'.$row, $exp->company_name);
                $sheet->setCellValue('AD'.$row, $masterSectors[strtolower(trim($exp->job_type))] ?? $exp->job_type);
                
                $sheet->getStyle("E$row:AD$row")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                $row++;
            }

            // --- 5. KELUARGA (43-51) ---
            $row = 43;

            // Map prioritas untuk memastikan Ayah & Ibu selalu paling atas
            $priorityMap = [
                '父' => 1, // Ayah
                '母' => 2, // Ibu
            ];

            // Urutkan: Prioritas dulu, baru usia tertua
            $sortedFamilies = $profile->families->sort(function ($a, $b) use ($priorityMap) {
                $prioA = $priorityMap[$a->relationship] ?? 3;
                $prioB = $priorityMap[$b->relationship] ?? 3;

                if ($prioA !== $prioB) {
                    return $prioA <=> $prioB;
                }

                // Jika sama-sama anggota keluarga lain, urutkan usia tertua ke termuda
                return (int)$b->age <=> (int)$a->age;
            })->take(9);

            foreach ($sortedFamilies as $fam) {
                $sheet->setCellValue('F'.$row, $fam->relationship);
                $sheet->setCellValue('M'.$row, $fam->name);
                $sheet->setCellValue('AD'.$row, $fam->age . ' 歳');
                $sheet->setCellValue('AI'.$row, $masterSectors[strtolower(trim($fam->occupation))] ?? $fam->occupation);
                $sheet->getStyle("F$row:AI$row")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
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

            // --- BAGIAN PREVIEW (DARI AWAL) ---
            if ($request->query('preview') === 'true') {
                // Set Print Area agar hanya render A1:AP58
                $sheet->getPageSetup()->setPrintArea('B2:AP58');
                
                // Opsional: Remove kolom & baris di luar range
                $highestColumn = $sheet->getHighestColumn();
                $highestRow = $sheet->getHighestRow();
                
                // Hapus kolom setelah AP
                if ($highestColumn > 'AP') {
                    $sheet->removeColumnByIndex(
                        \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString('AQ'),
                        \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn) - 42
                    );
                }
                
                // Hapus baris setelah 58
                if ($highestRow > 58) {
                    $sheet->removeRow(59, $highestRow - 58);
                }
                
                $writer = IOFactory::createWriter($spreadsheet, 'Html');
                
                ob_start();
                $writer->save('php://output');
                $htmlContent = ob_get_clean();

                return response()->json([
                    'status' => 'success',
                    'html' => $htmlContent
                ]);
            }

            // --- BAGIAN DOWNLOAD (XLSX) ---
            $filename = "CV_" . str_replace(' ', '_', $profile->full_name) . ".xlsx";
            
            // Bersihkan buffer agar tidak korup
            if (ob_get_length()) ob_end_clean();

            return response()->streamDownload(function() use ($spreadsheet) {
                $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);

        } catch (\Exception $e) {
            Log::error("Gagal Generate CV: " . $e->getMessage());
            return response()->json([
                'status' => 'error', 
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }
}