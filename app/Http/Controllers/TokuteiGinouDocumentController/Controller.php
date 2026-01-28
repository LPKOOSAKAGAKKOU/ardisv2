<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentProfile;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class TokuteiGinouDocumentController extends Controller
{
    public function generate($type) 
    {
        // Ambil data lengkap beserta relasi pendidikan, pengalaman, dan keluarga
        $profile = StudentProfile::with(['educations', 'experiences', 'families'])
            ->where('user_id', Auth::id())
            ->firstOrFail();

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
            'email'          => Auth::user()->email,
            'today'          => now()->format('Y/m/d'),
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