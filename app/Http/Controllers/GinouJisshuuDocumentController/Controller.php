<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentProfile;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\Auth;

class GinouJisshuuDocumentController extends Controller
{
    public function generate($type) {
        $profile = StudentProfile::with(['user', 'educations', 'families'])
            ->where('user_id', Auth::id())->firstOrFail();

        // MAPPING: typeKey dari React => Nama File Asli di Storage
        $fileMap = [
            'ginou_1-3'    => 'form_1_3_resume.docx',
            'ginou_1-19'   => 'form_1_19_agreement.docx',
            'ginou_1-20'   => 'form_1_20_data.docx',
            'ginou_2-21'   => 'form_2_21_report.docx',
            'ginou_1-39'   => 'form_1_39_final.docx',
            'ginou_agreement' => 'agreement_letter_indo.docx',
        ];

        $fileName = $fileMap[$type] ?? abort(404, 'Template tidak ditemukan');
        $templatePath = storage_path("app/templates/ginou/" . $fileName);

        $template = new TemplateProcessor($templatePath);

        // DATA STANDAR (Bisa dipakai di semua dokumen)
        $template->setValues([
            'nama_lengkap'  => strtoupper($profile->full_name),
            'nama_katakana' => $profile->full_name_katakana,
            'tgl_lahir'     => $profile->dob ? $profile->dob->format('d-m-Y') : '-',
            'alamat'        => $profile->address_ktp,
            'telp'          => $profile->phone_number ?? '-',
        ]);

        $outputName = strtoupper($type) . "_" . str_replace(' ', '_', $profile->full_name) . ".docx";
        return response()->streamDownload(fn() => $template->saveAs('php://output'), $outputName);
    }
}