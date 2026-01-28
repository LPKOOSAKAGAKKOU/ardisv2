<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentProfile;
use App\Models\InterviewDetail; // Tambahkan ini
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
            'ginou_2-21'      => 'form_2_21_report.docx',
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
}