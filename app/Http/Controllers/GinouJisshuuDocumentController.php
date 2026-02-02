<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentProfile;
use App\Models\Interview;
use App\Models\InterviewDetail;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\{Auth, File, DB};
use Illuminate\Support\Carbon;
use Stichoza\GoogleTranslate\GoogleTranslate;

class GinouJisshuuDocumentController extends Controller
{
    public function generate($type, $userId = null) 
    {
        // 1. Tentukan target ID
        $targetId = $userId ?: Auth::id();

        // 2. Cek keamanan
        if (Auth::user()->role !== 'admin' && Auth::id() != $targetId) {
            abort(403, 'Anda tidak memiliki akses ke dokumen ini.');
        }

        // 3. Ambil data profil (Eager Loading)
        $profile = StudentProfile::with(['user', 'educations', 'experiences.jobSector', 'families'])
            ->where('user_id', $targetId)
            ->firstOrFail();

        // 4. Ambil data interview kelulusan
        $passedInterview = InterviewDetail::where('user_id', $targetId)
            ->where('result', 'passed')
            ->with(['interview.company', 'interview.acceptingOrganization'])
            ->latest()
            ->first();

        // --- Tambahkan ini di awal fungsi generate ---
        $masterSectors = DB::table('job_sectors')->pluck('name_jp', 'name_id')
            ->mapWithKeys(fn($item, $key) => [strtolower(trim($key)) => $item]);

        // 5. Mapping File Template
        $fileMap = [
            'ginou_1-3'       => 'form_1_3_resume.docx',
            'ginou_1-19'      => 'form_1_19_agreement.docx',
            'ginou_1-20'      => 'form_1_20_data.docx',
            'ginou_1-21'      => 'form_1_21_report.docx',
            'ginou_1-39'      => 'form_1_39_final.docx',
            'ginou_agreement' => 'agreement_letter_indo.docx',
        ];

        $fileName = $fileMap[$type] ?? abort(404, 'Jenis dokumen tidak valid.');
        $templatePath = storage_path("app/templates/ginou/" . $fileName);

        if (!File::exists($templatePath)) {
            abort(404, "File template $fileName tidak ditemukan di storage.");
        }

        $template = new TemplateProcessor($templatePath);
        $dt = $passedInterview?->interview->interview_date 
                ? Carbon::parse($passedInterview->interview->interview_date)->addDay() 
                : now();
        $dob = $profile->dob; // Objek Carbon dari database

        // Ambil semua data pendidikan siswa
        $educations = $profile->educations;

        // Filter masing-masing jenjang
        $sd   = $educations->where('level', '小学校')->first();
        $smp  = $educations->where('level', '中学校')->first();
        $sma  = $educations->where('level', '高校')->first();
        $univ = $educations->where('level', '大学')->first();
        // --- 8. TABEL OTOMATIS (Pekerjaan dengan CloneRow) ---
        // Ambil maksimal 5 data terbaru agar tidak merusak halaman berikutnya
        $workExp = $profile->experiences->sortByDesc('start_date')->take(5)->values();
        // Di dalam fungsi generate
        $tr = new GoogleTranslate('id'); // Target bahasa Indonesia

        // Ambil teks aslinya
        $rawIndustry = $passedInterview?->interview->company->industry ?? '-';

        // Terjemahkan lalu PAKSA JADI KAPITAL
        $industriIndo = strtoupper($tr->translate($rawIndustry));

        // --- 6. DATA IDENTITAS UMUM ---
        $template->setValues([
            'nama_lengkap'   => strtoupper($profile->full_name),
            'nama_katakana'  => $profile->full_name_katakana,
            'jenis_kelamin'  => $profile->gender === 'Laki-laki' ? '男 (L)' : '女 (P)',
            'm_box'          => $profile->gender === 'Laki-laki' ? '☑' : '☐', // Kotak untuk Laki-laki
            'f_box' => $profile->gender === 'Perempuan' ? '☑' : '☐', // Kotak untuk Perempuan
            'tempat_lahir'   => strtoupper($profile->pob),
            'tgl_lahir'      => $profile->dob ? $profile->dob->format('d-m-Y') : '-',
            'b_y'            => $dob ? $dob->format('Y') : '    ', // Tahun lahir
            'b_m'            => $dob ? $dob->format('n') : '  ',  // Bulan lahir (n = tanpa nol di depan)
            'b_d'            => $dob ? $dob->format('j') : '  ',  // Tanggal lahir (j = tanpa nol di depan)
            'usia'           => $dob ? $dob->age : '  ',          // Umur otomatis terhitung hari ini
            'umur'           => $profile->dob ? $profile->dob->age : '0',
            'gol_darah'      => $profile->blood_type ?? '-',
            'status_nikah'   => strtoupper($profile->marital_status),
            'agama'          => strtoupper($profile->religion),
            'alamat'         => $profile->address_ktp,
            'telp'           => $profile->phone_number ?? '-',
            'email'          => $profile->user->email ?? '-', // Gunakan email user terkait
            'no_paspor'      => $profile->passport_number ?? '-',
            'tinggi_badan'   => $profile->height . ' cm',
            'berat_badan'    => $profile->weight . ' kg',
            'hobi'           => $profile->hobby ?? '-',
            'kekuatan'       => $profile->strength ?? '-',

            // SD
            'sd_in'          => $sd ? Carbon::parse($sd->entry_date)->format('Y年m月') : '',
            'sd_out'         => $sd ? Carbon::parse($sd->graduation_date)->format('Y年m月') : '',
            'sd_name'        => $sd ? "{$sd->school_type} {$sd->level} {$sd->school_name}" : '',

            // SMP
            'smp_in'         => $smp ? Carbon::parse($smp->entry_date)->format('Y年m月') : '',
            'smp_out'        => $smp ? Carbon::parse($smp->graduation_date)->format('Y年m月') : '',
            'smp_name'       => $smp ? "{$smp->school_type} {$smp->level} {$smp->school_name}" : '',

            // SMA/SMK
            'sma_in'         => $sma ? Carbon::parse($sma->entry_date)->format('Y年m月') : '',
            'sma_out'        => $sma ? Carbon::parse($sma->graduation_date)->format('Y年m月') : '',
            'sma_name'       => $sma ? "{$sma->school_type} {$sma->level} {$sma->school_name}" : '',
            'sma_major'      => $sma ? $sma->major : '',

            // Universitas
            'univ_in'        => $univ ? Carbon::parse($univ->entry_date)->format('Y年m月') : '',
            'univ_out'       => $univ ? Carbon::parse($univ->graduation_date)->format('Y年m月') : '',
            'univ_name'      => $univ ? "{$univ->school_type} {$univ->level} {$univ->school_name}" : '',
            'univ_major'     => $univ ? $univ->major : '',

            // Pekerjaan 1
            'w1_in'   => isset($workExp[0]) ? Carbon::parse($workExp[0]->start_date)->format('Y年m月') : '',
            'w1_out'  => isset($workExp[0]) ? ($workExp[0]->end_date ? Carbon::parse($workExp[0]->end_date)->format('Y年m月') : '現在に至る') : '',
            'w1_name' => isset($workExp[0]) ? strtoupper($workExp[0]->company_name) . " (" . ($masterSectors[strtolower(trim($workExp[0]->job_type))] ?? $workExp[0]->job_type) . ")" : '',

            // Pekerjaan 2
            'w2_in'   => isset($workExp[1]) ? Carbon::parse($workExp[1]->start_date)->format('Y年m月') : '',
            'w2_out'  => isset($workExp[1]) ? ($workExp[1]->end_date ? Carbon::parse($workExp[1]->end_date)->format('Y年m月') : '現在に至る') : '',
            'w2_name' => isset($workExp[1]) ? strtoupper($workExp[1]->company_name) . " (" . ($masterSectors[strtolower(trim($workExp[1]->job_type))] ?? $workExp[1]->job_type) . ")" : '',

            // Pekerjaan 3
            'w3_in'   => isset($workExp[2]) ? Carbon::parse($workExp[2]->start_date)->format('Y年m月') : '',
            'w3_out'  => isset($workExp[2]) ? ($workExp[2]->end_date ? Carbon::parse($workExp[2]->end_date)->format('Y年m月') : '現在に至る') : '',
            'w3_name' => isset($workExp[2]) ? strtoupper($workExp[2]->company_name) . " (" . ($masterSectors[strtolower(trim($workExp[2]->job_type))] ?? $workExp[2]->job_type) . ")" : '',

            // Pekerjaan 4
            'w4_in'   => isset($workExp[3]) ? Carbon::parse($workExp[3]->start_date)->format('Y年m月') : '',
            'w4_out'  => isset($workExp[3]) ? ($workExp[3]->end_date ? Carbon::parse($workExp[3]->end_date)->format('Y年m月') : '現在に至る') : '',
            'w4_name' => isset($workExp[3]) ? strtoupper($workExp[3]->company_name) . " (" . ($masterSectors[strtolower(trim($workExp[3]->job_type))] ?? $workExp[3]->job_type) . ")" : '',

            // Pekerjaan 5
            'w5_in'   => isset($workExp[4]) ? Carbon::parse($workExp[4]->start_date)->format('Y年m月') : '',
            'w5_out'  => isset($workExp[4]) ? ($workExp[4]->end_date ? Carbon::parse($workExp[4]->end_date)->format('Y年m月') : '現在に至る') : '',
            'w5_name' => isset($workExp[4]) ? strtoupper($workExp[4]->company_name) . " (" . ($masterSectors[strtolower(trim($workExp[4]->job_type))] ?? $workExp[4]->job_type) . ")" : '',

            // Ambil tanggal interview, tambahkan 1 hari, lalu format
            'doc_y'         => $dt->format('Y'), // Tahun
            'doc_m'         => $dt->format('m'), // Bulan
            'doc_d'         => $dt->format('d'), // Hari
    
            // DATA INTERVIEW (Khusus Magang istilahnya Implementing Org)
            'perusahaan_nama'      => $passedInterview?->interview->company->name ?? '-',
            'perusahaan_nama_jp'   => $passedInterview?->interview->company->name_in_japanese ?? '-',
            'perusahaan_alamat_jp' => $passedInterview?->interview->company->address_in_japanese ?? '-',
            'perusahaan_industri'  => $passedInterview?->interview->company->industry ?? '-',
            'perusahaan_industri_id' => $industriIndo,
            'org_penerima_nama'    => $passedInterview?->interview->acceptingOrganization->name ?? '-',
            'org_penerima_nama_jp' => $passedInterview?->interview->acceptingOrganization->name_in_japanese ?? '-',
            
            'training_center'      => $passedInterview?->interview->acceptingOrganization->training_center_name ?? '-',
            'training_center_address' => $passedInterview?->interview->acceptingOrganization->training_center_address ?? '-',
            'training_center_phone'   => $passedInterview?->interview->acceptingOrganization->training_center_phone ?? '-',
            'luas_training_center'    => $passedInterview?->interview->acceptingOrganization->training_center_area ?? '-',
            'kapasitas_training_center' => $passedInterview?->interview->acceptingOrganization->training_center_capacity ?? '-',
            'luas_per_orang'        => ($passedInterview && $passedInterview->interview->acceptingOrganization->training_center_area && $passedInterview->interview->acceptingOrganization->training_center_capacity) 
                                        ? round(intval($passedInterview->interview->acceptingOrganization->training_center_area) / intval($passedInterview->interview->acceptingOrganization->training_center_capacity), 2) . ' m²' 
                                        : '-',
            'asrama_box'            => ($passedInterview?->interview->acceptingOrganization->training_center_type === 'asrama') ? '☑' : '☐',
            'kos_box'               => ($passedInterview?->interview->acceptingOrganization->training_center_type === 'kos') ? '☑' : '☐',
            'lainnya_box'            => ($passedInterview?->interview->acceptingOrganization->training_center_type === 'lainnya') ? '☑' : '☐',

            'menerima_tunjangan_box' => ($passedInterview?->interview->acceptingOrganization->allowance_in_first_month) ? '☑' : '☐',
            'tidak_menerima_tunjangan_box' => ($passedInterview?->interview->acceptingOrganization->allowance_in_first_month) ? '☐' : '☑',
            'besaran_tunjangan'       => $passedInterview?->interview->acceptingOrganization->allowance_amount ?? '-',

            'menerima_tunjangan_makan_box' => ($passedInterview?->interview->acceptingOrganization->meal_allowance) ? '☑' : '☐',
            'tidak_menerima_tunjangan_makan_box' => ($passedInterview?->interview->acceptingOrganization->meal_allowance) ? '☐' : '☑',
            'besaran_tunjangan_makan'       => $passedInterview?->interview->acceptingOrganization->meal_allowance_amount ?? '-',
            'siswa_bayar_makan_box'         => ($passedInterview?->interview->acceptingOrganization->student_pays_meal) ? '☑' : '☐',
            'siswa_tidak_bayar_makan_box'   => ($passedInterview?->interview->acceptingOrganization->student_pays_meal) ? '☐' : '☑',
            'besaran_siswa_bayar_makan'     => $passedInterview?->interview->acceptingOrganization->student_pays_meal_amount ?? '-',

            'menerima_tunjangan_akomodasi_box' => ($passedInterview?->interview->acceptingOrganization->accommodation_allowance) ? '☑' : '☐',
            'tidak_menerima_tunjangan_akomodasi_box' => ($passedInterview?->interview->acceptingOrganization->accommodation_allowance) ? '☐' : '☑',
            'besaran_tunjangan_akomodasi'       => $passedInterview?->interview->acceptingOrganization->accommodation_allowance_amount ?? '-',
            'siswa_bayar_akomodasi_box'         => ($passedInterview?->interview->acceptingOrganization->student_pays_accommodation) ? '☑' : '☐',
            'siswa_tidak_bayar_akomodasi_box'   => ($passedInterview?->interview->acceptingOrganization->student_pays_accommodation) ? '☐' : '☑',
            'besaran_siswa_bayar_akomodasi'     => $passedInterview?->interview->acceptingOrganization->student_pays_accommodation_amount ?? '-',

            'tgl_wawancara'        => $passedInterview?->interview->interview_date ? Carbon::parse($passedInterview->interview->interview_date)->format('d/m/Y') : '-',
            'estimasi_terbang'     => $passedInterview?->interview->date_fly_to_japan ? Carbon::parse($passedInterview->interview->date_fly_to_japan)->format('d/m/Y') : '-',
        ]);

        // 10. Final Output
        $cleanName = preg_replace('/[^A-Za-z0-9\-]/', '_', $profile->full_name);
        $outputName = strtoupper($type) . "_" . $cleanName . ".docx";
        
        return response()->streamDownload(function () use ($template) {
            $template->saveAs('php://output');
        }, $outputName);
    }

    public function generateInterviewReport($interviewId, $type)
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Akses ditolak.');
        }

        $interview = Interview::with([
            'company', 
            'acceptingOrganization', 
            'details' => function($q) {
                $q->where('result', 'passed')->with('user.student_profile');
            }
        ])->findOrFail($interviewId);

        $subFolder = 'ginou'; 

        $reportMap = [
            'ginou_1-34'      => 'form_1_34_bukti_pelatihan_teknis.docx',
            'ginou_1-10'      => 'form_1_10_perjanjian_sertifikasi.docx',
            'ginou_1-23'      => 'form_1_23_rekom_pemberangkatan.docx',
            'ginou_1-23_req'  => 'form_1_23_pengajuan_rekom.docx',
            'ginou_1-13'      => 'form_1_13_profile_lpk.docx',
            'ginou_4-8'       => 'form_4_8_jadwal_pra_pemberangkatan.docx',
            'ginou_1-29'      => 'form_1_29_pernyataan_pelatihan.docx',
            'stmt_jp_teacher' => 'pernyataan_pengajar_b_jepang.docx',
            'stmt_kg_teacher' => 'pernyataan_pengajar_kaigo.docx',
            'cv_jp_teacher'   => 'cv_pengajar_b_jepang.docx',
            'cv_kg_teacher'   => 'cv_pengajar_kaigo.docx',
            'schedule_detail' => 'jadwal_perincian_pelatihan.docx',
        ];

        $fileName = $reportMap[$type] ?? abort(404, 'Jenis report tidak ditemukan.');
        $templatePath = storage_path("app/templates/{$subFolder}/reports/" . $fileName);

        if (!File::exists($templatePath)) {
            abort(404, "File template tidak ditemukan.");
        }

        $dt = $interview->interview_date ? Carbon::parse($interview->interview_date)->addDay() : now();
        $template = new TemplateProcessor($templatePath);

        // --- DATA HEADER ---
        $template->setValues([
            'interview_title' => strtoupper($interview->interviewer_title),
            'perusahaan_nama'      => $interview->company->name ?? '-',
            'perusahaan_nama_jp'   => $interview->company->name_in_japanese ?? '-',
            'perusahaan_alamat_jp' => $interview->company->address_in_japanese ?? '-',
            'perusahaan_industri'  => $interview->company->industry ?? '-',
            'org_penerima_nama'    => $interview->acceptingOrganization->name ?? '-',
            'org_penerima_nama_jp' => $interview->acceptingOrganization->name_in_japanese ?? '-',
            'org_penerima_alamat_jp' => $interview->acceptingOrganization->address ?? '-',
            'pic_name'              => $interview->acceptingOrganization->pic_name ?? '-',
            'tgl_interview'   => Carbon::parse($interview->interview_date)->format('d-m-Y'),
            'tgl_keberangkatan' => $interview->date_fly_to_japan ? Carbon::parse($interview->date_fly_to_japan)->format('d-m-Y') : '-',
            'tgl_keberangkatan_jp' => $interview->date_fly_to_japan ? Carbon::parse($interview->date_fly_to_japan)->format('Y年m月') : '-',
            'total_lulus'     => $interview->details->count(),
            'doc_y'           => $dt->format('Y'),
            'doc_m'           => $dt->format('m'),
            'doc_d'           => $dt->format('d'),

            '1_34_training_item'           => $interview->{"1_34_training_item"} ?? '-',
            '1_34_training_start_date'     => $interview->{"1_34_training_start_date"} ? Carbon::parse($interview->{"1_34_training_start_date"})->format('Y年m月d日') : '-',
            '1_34_training_end_date'       => $interview->{"1_34_training_end_date"} ? Carbon::parse($interview->{"1_34_training_end_date"})->format('Y年m月d日') : '-',
            '1_34_training_duration_hours' => $interview->{"1_34_training_duration_hours"} ?? '-',

            '1_29_first_training_start_date' => $interview->{"1_29_first_training_start_date"} ? Carbon::parse($interview->{"1_29_first_training_start_date"})->format('Y年m月d日') : '-',
            '1_29_first_training_end_date' => $interview->{"1_29_first_training_end_date"} ? Carbon::parse($interview->{"1_29_first_training_end_date"})->format('Y年m月d日') : '-',
            '1_29_first_training_duration_hours' => $interview->{"1_29_first_training_duration_hours"} ?? '-',
            '1_29_first_training_item' => $interview->{"1_29_first_training_item"} ?? '-',

            '1_29_second_training_start_date' => $interview->{"1_29_second_training_start_date"} ? Carbon::parse($interview->{"1_29_second_training_start_date"})->format('Y年m月d日') : '-',
            '1_29_second_training_end_date' => $interview->{"1_29_second_training_end_date"} ? Carbon::parse($interview->{"1_29_second_training_end_date"})->format('Y年m月d日') : '-',
            '1_29_second_training_duration_hours' => $interview->{"1_29_second_training_duration_hours"} ?? '-',
            '1_29_second_training_item' => $interview->{"1_29_second_training_item"} ?? '-',
            
            '1_29_third_training_start_date' => $interview->{"1_29_third_training_start_date"} ? Carbon::parse($interview->{"1_29_third_training_start_date"})->format('Y年m月d日') : '-',
            '1_29_third_training_end_date' => $interview->{"1_29_third_training_end_date"} ? Carbon::parse($interview->{"1_29_third_training_end_date"})->format('Y年m月d日') : '-',
            '1_29_third_training_duration_hours' => $interview->{"1_29_third_training_duration_hours"} ?? '-',
            '1_29_third_training_item' => $interview->{"1_29_third_training_item"} ?? '-',
            
            '1_29_total_duration_hours' => (
                (float)($interview->{"1_29_first_training_duration_hours"} ?? 0) + 
                (float)($interview->{"1_29_second_training_duration_hours"} ?? 0) + 
                (float)($interview->{"1_29_third_training_duration_hours"} ?? 0)
            ),
            'start_global' => Carbon::parse($interview->{"1_29_first_training_start_date"})->format('Y年m月d日'),
            'end_global'   => Carbon::parse($interview->{"1_29_third_training_end_date"})->format('Y年m月d日'),
        ]);

        // --- 1. LOGIC KHUSUS JADWAL HARIAN (4-8) ---
        if ($type === 'ginou_4-8') {
            $this->generateDailySchedule48($template, $interview);
        }

        // --- 2. DATA TABEL PESERTA LULUS (LOGIC ASLI ANDA) ---
        if ($interview->details->count() > 0) {
            $nonTableReports = ['ginou_1-10', 'ginou_1-23', 'ginou_1-23_req', 'ginou_1-13'];
            
            if (in_array($type, $nonTableReports)) {
                $studentsArray = [];
                foreach ($interview->details as $index => $detail) {
                    $num = $index + 1;
                    $name = strtoupper($detail->user->student_profile->full_name);
                    $studentsArray[] = "{$num}. {$name}";
                }
                $template->setValue('nama_siswa', implode("\n", $studentsArray));
            } else {
                $template->cloneRow('no', $interview->details->count());

                foreach ($interview->details as $index => $detail) {
                    $i = $index + 1;
                    $p = $detail->user->student_profile; 
                    
                    $template->setValue("no#$i", $i);
                    $template->setValue("nama_siswa#$i", strtoupper($p->full_name));
                    $template->setValue("nama_jp#$i", $p->full_name_katakana);
                    $template->setValue("pob#$i", strtoupper($p->pob));
                    $template->setValue("dob#$i", Carbon::parse($p->dob)->format('d-m-Y'));
                    $template->setValue("gender#$i", $p->gender === 'Laki-laki' ? '男' : '女');
                    
                    // Tambahan tgl_masuk khusus jika variabelnya ada di template 4-8
                    // Kalau di dokumen lain gak ada variabel ini, PHPWord bakal abaikan, jadi AMAN.
                    $template->setValue("tgl_masuk#$i", $interview->date_fly_to_japan ? Carbon::parse($interview->date_fly_to_japan)->format('Y/m/d') : '/  /  ');
                }
            }
        }

        $outputName = strtoupper($type) . "_" . str_replace(' ', '_', $interview->interviewer_title) . ".docx";
        return response()->streamDownload(function () use ($template) {
            $template->saveAs('php://output');
        }, $outputName);
    }

    /**
     * Fungsi memecah rentang tanggal 1-29 menjadi baris harian presisi di 4-8
     * Terintegrasi dengan Gemini AI untuk pembuatan silabus harian
     */
    private function generateDailySchedule48(&$template, $interview)
    {
        dd($this->askGeminiToSplitCurriculum("Tes Materi", 3, 5));
        $stages = [
            ['key' => 'first', 'label' => $interview->{"1_29_first_training_item"}],
            ['key' => 'second', 'label' => $interview->{"1_29_second_training_item"}],
            ['key' => 'third', 'label' => $interview->{"1_29_third_training_item"}],
        ];

        $dailyRows = [];

        foreach ($stages as $stage) {
            $start = $interview->{"1_29_{$stage['key']}_training_start_date"};
            $end = $interview->{"1_29_{$stage['key']}_training_end_date"};
            $totalHours = (float)($interview->{"1_29_{$stage['key']}_training_duration_hours"} ?? 0);

            if ($start && $end && $totalHours > 0) {
                $period = \Carbon\CarbonPeriod::create($start, $end);
                
                // 1. Filter Hari Kerja (Senin - Jumat)
                $workDates = [];
                foreach ($period as $date) {
                    if ($date->isWeekday()) { 
                        $workDates[] = $date;
                    }
                }

                $dayCount = count($workDates);
                if ($dayCount > 0) {
                    // 2. Hitung Jam Belajar Murni per Hari
                    $hoursPerDay = $totalHours / $dayCount;
                    
                    // 3. Tentukan Rentang Waktu (08:30 + Jam Belajar + 1 Jam Istirahat)
                    $startTime = \Carbon\Carbon::createFromTime(8, 30);
                    // Jam selesai = Jam mulai + (Jam belajar + 1 jam istirahat)
                    $totalDurationInMinutes = ($hoursPerDay + 1) * 60;
                    $endTime = (clone $startTime)->addMinutes($totalDurationInMinutes);
                    
                    $timeString = $startTime->format('H:i') . " ～ " . $endTime->format('H:i');

                    // 4. Panggil Gemini AI untuk memecah silabus sesuai jumlah hari dan jam
                    $curriculum = $this->askGeminiToSplitCurriculum($stage['label'], $dayCount, $hoursPerDay);

                    foreach ($workDates as $idx => $date) {
                        $dailyRows[] = [
                            'tgl' => $date->format('Y/m/d'),
                            'jam' => $timeString,
                            'item' => $curriculum[$idx] ?? $stage['label'],
                        ];
                    }
                }
            }
        }

        // 5. Clone Baris ke Template Word
        if (count($dailyRows) > 0) {
            $template->cloneRow('tgl', count($dailyRows));
            foreach ($dailyRows as $idx => $row) {
                $i = $idx + 1;
                $template->setValue("tgl#$i", $row['tgl']);
                $template->setValue("jam#$i", $row['jam']);
                $template->setValue("item#$i", $row['item']);
                $template->setValue("guru#$i", "Indra-sensei");
                $template->setValue("lokasi#$i", "LPK OOSAKA GAKKOU");
            }
        }
    }

    /**
     * Meminta Gemini AI memecah silabus umum menjadi detail harian
     */
    private function askGeminiToSplitCurriculum($generalTopic, $days, $hoursPerDay)
    {
        $apiKey = config('services.gemini.key');
        
        // Prompt tetap sesuai aslinya
        $prompt = "Sebagai instruktur Ginou Jisshuu, pecahlah silabus umum: '{$generalTopic}' menjadi materi spesifik selama {$days} hari kerja. 
                    Setiap harinya berdurasi " . round($hoursPerDay, 1) . " jam pelajaran.
                    Tolong berikan materi yang logis, progresif (mudah ke sulit), dan berbeda setiap harinya.
                    Gunakan Bahasa Jepang.
                    HANYA kembalikan hasilnya dalam format JSON array string tanpa markdown atau penjelasan lain.
                    Contoh: [\"Materi 1\", \"Materi 2\"]";

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Content-Type' => 'application/json',
            ])
            // Jika lo di local/XAMPP dan kena SSL error, tambahkan ->verify(false) sebelum ->post
            ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ]
            ]);

            if ($response->successful()) {
                $jsonResponse = $response->json();
                $textResult = $jsonResponse['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
                
                // LOG: Catat hasil sukses dari AI
                \Illuminate\Support\Facades\Log::info("Gemini Success! Raw Result: " . $textResult);

                $cleanJson = trim(str_replace(['```json', '```'], '', $textResult));
                $data = json_decode($cleanJson, true);

                if (is_array($data)) {
                    return $data;
                } else {
                    \Illuminate\Support\Facades\Log::warning("Gemini returned non-JSON text: " . $textResult);
                }
            } else {
                // LOG: Catat kegagalan respon (Status 401, 400, dll)
                \Illuminate\Support\Facades\Log::error("Gemini API Error Status: " . $response->status());
                \Illuminate\Support\Facades\Log::error("Gemini API Full Error: " . json_encode($response->json()));
            }
            
            return array_fill(0, $days, $generalTopic);

        } catch (\Exception $e) {
            // LOG: Catat error sistem (SSL, koneksi terputus, dsb)
            \Illuminate\Support\Facades\Log::error("Gemini System Exception: " . $e->getMessage());
            return array_fill(0, $days, $generalTopic);
        }
    }
}