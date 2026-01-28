<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentProfile;
use App\Models\InterviewDetail; // Tambahkan ini
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class TokuteiGinouDocumentController extends Controller
{
    public function generate($type, $userId = null) 
    {
        // 1. Tentukan target ID dulu (pindahkan ke paling atas)
        $targetId = $userId ?: Auth::id();

        // 2. Sekarang baru cek keamanan menggunakan variabel $targetId yang sudah ada
        if (Auth::user()->role !== 'admin' && Auth::id() != $targetId) {
            abort(403, 'Anda tidak memiliki akses ke dokumen ini.');
        }

        // 3. Ambil data dengan Eager Loading
        $profile = StudentProfile::with(['user', 'educations', 'experiences', 'families'])
            ->where('user_id', $targetId)
            ->firstOrFail();

        // 4. Ambil data interview kelulusan
        $passedInterview = InterviewDetail::where('user_id', $targetId)
            ->where('result', 'passed')
            ->with(['interview.company', 'interview.accepting_organization'])
            ->latest()
            ->first();

        $fileMap = [
            'tg_1-1'         => 'tg_form_1_1_application.docx',
            'tg_1-5'         => 'tg_form_1_5_salary.docx',
            'tg_1-6'         => 'tg_form_1_6_pension.docx',
            'tg_1-16'        => 'tg_form_1_16_health.docx',
            'tg_1-17'        => 'tg_form_1_17_residence.docx',
            'power_attorney' => 'poa_letter.docx',
            'ssw_result'     => 'ssw_test_template.docx',
        ];

        $fileName = $fileMap[$type] ?? abort(404, 'Template tidak ditemukan');
        $templatePath = storage_path("app/templates/tokutei/" . $fileName);
        
        if (!file_exists($templatePath)) {
            abort(404, "File template $fileName tidak ada di storage.");
        }

        $template = new TemplateProcessor($templatePath);

        // --- 1. DATA IDENTITAS DASAR ---
        $template->setValues([
            'nama_lengkap'   => strtoupper($profile->full_name),
            'nama_katakana'  => $profile->full_name_katakana,
            'no_paspor'      => $profile->passport_number ?? 'IN PROCESS',
            'tgl_lahir'      => $profile->dob ? $profile->dob->format('Y/m/d') : '-',
            'umur'           => $profile->dob ? $profile->dob->age : '0',
            'jenis_kelamin'  => $profile->gender === 'Laki-laki' ? 'MALE' : 'FEMALE',
            'tempat_lahir'   => strtoupper($profile->pob),
            'status_nikah'   => strtoupper($profile->marital_status),
            'alamat_ktp'     => $profile->address_ktp,
            'telepon'        => $profile->phone_number ?? '-',
            'email'          => $profile->user->email,
            'today'          => now()->format('Y/m/d'),
            // DATA INTERVIEW / PERUSAHAAN (Jika Lulus)
            'perusahaan_nama'      => $passedInterview?->interview->company->name ?? '-',
            'perusahaan_nama_jp'   => $passedInterview?->interview->company->name_in_japanese ?? '-',
            'perusahaan_alamat_jp' => $passedInterview?->interview->company->address_in_japanese ?? '-',
            'perusahaan_industri'  => $passedInterview?->interview->company->industry ?? '-',
            
            // DATA ORGANISASI PENERIMA (TSK / KUMIAI)
            'org_penerima_nama'    => $passedInterview?->interview->accepting_organization->name ?? '-',
            'org_penerima_nama_jp' => $passedInterview?->interview->accepting_organization->name_in_japanese ?? '-',
            'org_penerima_alamat'  => $passedInterview?->interview->accepting_organization->address_in_japanese ?? '-',
            
            // TANGGAL-TANGGAL PENTING
            'tgl_wawancara'        => $passedInterview?->interview->interview_date ? Carbon::parse($passedInterview->interview->interview_date)->format('Y/m/d') : '-',
            'estimasi_terbang'     => $passedInterview?->interview->date_fly_to_japan ? Carbon::parse($passedInterview->interview->date_fly_to_japan)->format('Y/m/d') : '-',
        ]);

        // --- 2. DATA RIWAYAT PENDIDIKAN (OTOMATIS CLONE BARIS TABEL) ---
        // Variabel di Word: ${edu_start}, ${edu_end}, ${school_name}
        if ($profile->educations->count() > 0) {
            $template->cloneRow('edu_start', $profile->educations->count());
            foreach ($profile->educations as $index => $edu) {
                $i = $index + 1;
                $template->setValue("edu_start#$i", Carbon::parse($edu->entry_date)->format('Y/m'));
                $template->setValue("edu_end#$i", Carbon::parse($edu->graduation_date)->format('Y/m'));
                $template->setValue("school_name#$i", $edu->school_name);
                $template->setValue("major#$i", $edu->major);
            }
        }

        // --- 3. DATA RIWAYAT PEKERJAAN (OTOMATIS CLONE BARIS TABEL) ---
        // Variabel di Word: ${work_start}, ${work_end}, ${company}
        if ($profile->experiences->count() > 0) {
            $template->cloneRow('work_start', $profile->experiences->count());
            foreach ($profile->experiences as $index => $exp) {
                $i = $index + 1;
                $template->setValue("work_start#$i", Carbon::parse($exp->start_date)->format('Y/m'));
                $template->setValue("work_end#$i", $exp->end_date ? Carbon::parse($exp->end_date)->format('Y/m') : 'PRESENT');
                $template->setValue("company#$i", $exp->company_name);
                $template->setValue("job_desc#$i", $exp->job_type);
            }
        }

        // --- 4. DATA KELUARGA ---
        if ($profile->families->count() > 0) {
            $template->cloneRow('fam_name', $profile->families->count());
            foreach ($profile->families as $index => $fam) {
                $i = $index + 1;
                $template->setValue("fam_name#$i", $fam->name);
                $template->setValue("fam_rel#$i", $fam->relationship);
                $template->setValue("fam_age#$i", $fam->age);
            }
        }

        // Nama file saat didownload
        $downloadName = "TG_" . strtoupper($type) . "_" . str_replace(' ', '_', $profile->full_name) . ".docx";

        return response()->streamDownload(function () use ($template) {
            $template->saveAs('php://output');
        }, $downloadName);
    }
}