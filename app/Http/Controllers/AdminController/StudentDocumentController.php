<?php

namespace App\Http\Controllers\AdminController; // Sesuaikan dengan folder di gambar

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Services\YunervaService;
use Illuminate\Http\Request;

class StudentDocumentController extends Controller
{
    protected $yunerva;

    public function __construct(YunervaService $yunerva)
    {
        $this->yunerva = $yunerva;
    }

    // Step 1: Proxy ke Yunerva untuk dapat Upload URL
    public function requestUpload(Request $request)
    {
        $response = $this->yunerva->requestUpload(
            $request->filename,
            $request->extension,
            $request->mime_type,
            $request->size
        );

        return response()->json($response);
    }

    public function storeDocument(Request $request, $id)
    {
        $student = StudentProfile::findOrFail($id);
        $fieldName = $request->field_name;

        // 1. Cek apakah ada file lama di kolom tersebut
        $oldUuid = $student->$fieldName;

        // 2. Finalize file baru ke Yunerva
        $response = $this->yunerva->finalizeUpload(
            $request->upload_ticket,
            $student->yunerva_file_password
        );

        if (isset($response['status']) && $response['status'] === 'success') {
            // 3. Jika Finalize sukses DAN ada file lama, hapus file lama dari Yunerva
            if ($oldUuid) {
                $this->yunerva->deleteFile($oldUuid);
            }

            // 4. Update Database dengan UUID baru
            $student->update([
                $fieldName => $response['data']['uuid']
            ]);

            return response()->json([
                'status' => 'success',
                'uuid' => $response['data']['uuid']
            ]);
        }

        return response()->json(['message' => 'Gagal verifikasi berkas'], 400);
    }

    // Preview: Ambil View URL (berlaku 15 detik)
    public function previewDocument(Request $request, $id)
    {
        $student = StudentProfile::findOrFail($id);
        
        $response = $this->yunerva->generateViewLink(
            $request->uuid,
            $student->yunerva_file_password
        );

        return response()->json($response);
    }
}