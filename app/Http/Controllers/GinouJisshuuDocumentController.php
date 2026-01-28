<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentProfile;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\{Auth, File};
use Illuminate\Support\Carbon;

class GinouJisshuuDocumentController extends Controller
{
    public function generate($type) 
    {
        // 1. Ambil data dengan Eager Loading agar efisien
        $profile = StudentProfile::with(['user', 'educations', 'experiences', 'families'])
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // 2. Mapping File Template
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

        // --- 3. DATA IDENTITAS UMUM ---
        $template->setValues([
            'nama_lengkap'   => strtoupper($profile->full_name),
            'nama_katakana'  => $profile->full_name_katakana,
            'jenis_kelamin'  => $profile->gender === 'Laki-laki' ? '男 (L)' : '女 (P)',
            'tempat_lahir'   => strtoupper($profile->pob),
            'tgl_lahir'      => $profile->dob ? $profile->dob->format('d-m-Y') : '-',
            'umur'           => $profile->dob ? $profile->dob->age : '0',
            'gol_darah'      => $profile->blood_type ?? '-',
            'status_nikah'   => strtoupper($profile->marital_status),
            'agama'          => strtoupper($profile->religion),
            'alamat'         => $profile->address_ktp,
            'telp'           => $profile->phone_number ?? '-',
            'email'          => Auth::user()->email,
            'no_paspor'      => $profile->passport_number ?? '-',
            'tinggi_badan'   => $profile->height . ' cm',
            'berat_badan'    => $profile->weight . ' kg',
            'hobi'           => $profile->hobby ?? '-',
            'kekuatan'       => $profile->strength ?? '-',
            'today'          => now()->format('d/m/Y'),
        ]);

        // --- 4. DATA RIWAYAT PENDIDIKAN (Tabel Otomatis) ---
        // Variabel di Word: ${edu_in}, ${edu_out}, ${school}
        if ($profile->educations->count() > 0) {
            $template->cloneRow('school', $profile->educations->count());
            foreach ($profile->educations as $index => $edu) {
                $i = $index + 1;
                $template->setValue("edu_in#$i", Carbon::parse($edu->entry_date)->format('m/Y'));
                $template->setValue("edu_out#$i", Carbon::parse($edu->graduation_date)->format('m/Y'));
                $template->setValue("school#$i", $edu->school_name);
                $template->setValue("major#$i", $edu->major ?? '-');
            }
        }

        // --- 5. DATA RIWAYAT PEKERJAAN (Tabel Otomatis) ---
        // Variabel di Word: ${work_in}, ${work_out}, ${company}
        if ($profile->experiences->count() > 0) {
            $template->cloneRow('company', $profile->experiences->count());
            foreach ($profile->experiences as $index => $exp) {
                $i = $index + 1;
                $template->setValue("work_in#$i", Carbon::parse($exp->start_date)->format('m/Y'));
                $template->setValue("work_out#$i", $exp->end_date ? Carbon::parse($exp->end_date)->format('m/Y') : 'PRESENT');
                $template->setValue("company#$i", $exp->company_name);
                $template->setValue("job#$i", $exp->job_type);
            }
        }

        // --- 6. DATA KELUARGA (Tabel Otomatis) ---
        // Variabel di Word: ${fam_name}, ${fam_rel}, ${fam_age}
        if ($profile->families->count() > 0) {
            $template->cloneRow('fam_name', $profile->families->count());
            foreach ($profile->families as $index => $fam) {
                $i = $index + 1;
                $template->setValue("fam_name#$i", $fam->name);
                $template->setValue("fam_rel#$i", $fam->relationship);
                $template->setValue("fam_age#$i", $fam->age . ' 歳');
                $template->setValue("fam_job#$i", $fam->occupation ?? '-');
            }
        }

        // 7. Proses Download
        $outputName = strtoupper($type) . "_" . str_replace(' ', '_', $profile->full_name) . ".docx";
        
        return response()->streamDownload(function () use ($template) {
            $template->saveAs('php://output');
        }, $outputName);
    }
}