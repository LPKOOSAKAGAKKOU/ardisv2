<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentProfile;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class TokuteiGinouDocumentController extends Controller
{
    public function generate($type) {
        $profile = StudentProfile::where('user_id', Auth::id())->firstOrFail();

        $fileMap = [
            'tg_1-1'  => 'tg_form_1_1_application.docx',
            'tg_1-5'  => 'tg_form_1_5_salary.docx',
            'tg_1-6'  => 'tg_form_1_6_pension.docx',
            'tg_1-16' => 'tg_form_1_16_health.docx',
            'tg_1-17' => 'tg_form_1_17_residence.docx',
            'power_attorney' => 'poa_letter.docx',
            'ssw_result'     => 'ssw_test_template.docx',
        ];

        $fileName = $fileMap[$type] ?? abort(404);
        $template = new TemplateProcessor(storage_path("app/templates/tokutei/" . $fileName));

        $template->setValues([
            'nama_lengkap' => strtoupper($profile->full_name),
            'no_paspor'    => $profile->passport_number ?? 'IN PROCESS',
            'umur'         => $profile->dob ? $profile->dob->age : '0',
            'jenis_kelamin' => $profile->gender === 'Laki-laki' ? 'MALE' : 'FEMALE',
        ]);

        return response()->streamDownload(fn() => $template->saveAs('php://output'), "TG_{$type}.docx");
    }
}