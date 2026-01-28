<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentProfile;
use App\Models\InterviewDetail; // Tambahkan ini
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\{Auth, File};
use Illuminate\Support\Carbon;

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
        $profile = StudentProfile::with(['user', 'educations', 'experiences', 'families'])
            ->where('user_id', $targetId)
            ->firstOrFail();

        // 4. Ambil data interview kelulusan
        $passedInterview = InterviewDetail::where('user_id', $targetId)
            ->where('result', 'passed')
            ->with(['interview.company', 'interview.acceptingOrganization'])
            ->latest()
            ->first();

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

        // --- 6. DATA IDENTITAS UMUM ---
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
            'email'          => $profile->user->email ?? '-', // Gunakan email user terkait
            'no_paspor'      => $profile->passport_number ?? '-',
            'tinggi_badan'   => $profile->height . ' cm',
            'berat_badan'    => $profile->weight . ' kg',
            'hobi'           => $profile->hobby ?? '-',
            'kekuatan'       => $profile->strength ?? '-',
            'today'          => now()->format('d/m/Y'),
            
            // DATA INTERVIEW (Khusus Magang istilahnya Implementing Org)
            'perusahaan_nama'      => $passedInterview?->interview->company->name ?? '-',
            'perusahaan_nama_jp'   => $passedInterview?->interview->company->name_in_japanese ?? '-',
            'perusahaan_alamat_jp' => $passedInterview?->interview->company->address_in_japanese ?? '-',
            'perusahaan_industri'  => $passedInterview?->interview->company->industry ?? '-',
            'org_penerima_nama'    => $passedInterview?->interview->acceptingOrganization->name ?? '-',
            'org_penerima_nama_jp' => $passedInterview?->interview->acceptingOrganization->name_in_japanese ?? '-',
            'tgl_wawancara'        => $passedInterview?->interview->interview_date ? Carbon::parse($passedInterview->interview->interview_date)->format('d/m/Y') : '-',
            'estimasi_terbang'     => $passedInterview?->interview->date_fly_to_japan ? Carbon::parse($passedInterview->interview->date_fly_to_japan)->format('d/m/Y') : '-',
        ]);

        // --- 7. TABEL OTOMATIS (Pendidikan) ---
        if ($profile->educations->count() > 0) {
            $template->cloneRow('school', $profile->educations->count());
            foreach ($profile->educations as $index => $edu) {
                $i = $index + 1;
                $template->setValue("edu_in#$i", Carbon::parse($edu->entry_date)->format('m/Y'));
                $grad = $edu->graduation_date ? Carbon::parse($edu->graduation_date)->format('m/Y') : 'PRESENT';
                $template->setValue("edu_out#$i", $grad);
                $template->setValue("school#$i", $edu->school_name);
                $template->setValue("major#$i", $edu->major ?? '-');
            }
        }

        // --- 8. TABEL OTOMATIS (Pekerjaan) ---
        if ($profile->experiences->count() > 0) {
            $template->cloneRow('company', $profile->experiences->count());
            foreach ($profile->experiences as $index => $exp) {
                $i = $index + 1;
                $template->setValue("work_in#$i", Carbon::parse($exp->start_date)->format('m/Y'));
                $expEnd = $exp->end_date ? Carbon::parse($exp->end_date)->format('m/Y') : 'PRESENT';
                $template->setValue("work_out#$i", $expEnd);
                $template->setValue("company#$i", $exp->company_name);
                $template->setValue("job#$i", $exp->job_type);
            }
        }

        // --- 9. TABEL OTOMATIS (Keluarga) ---
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

        // 10. Final Output
        $cleanName = preg_replace('/[^A-Za-z0-9\-]/', '_', $profile->full_name);
        $outputName = strtoupper($type) . "_" . $cleanName . ".docx";
        
        return response()->streamDownload(function () use ($template) {
            $template->saveAs('php://output');
        }, $outputName);
    }
}