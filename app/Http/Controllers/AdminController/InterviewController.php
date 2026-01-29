<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Models\InterviewDetail;
use App\Models\Company;
use App\Models\AcceptingOrganization;
use App\Services\YunervaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InterviewController extends Controller
{
    protected $yunerva;

    public function __construct(YunervaService $yunerva)
    {
        $this->yunerva = $yunerva;
    }
    /**
     * Menampilkan daftar wawancara untuk Admin/Sensei
     */
    public function index(Request $request)
    {
        $query = Interview::with(['company', 'acceptingOrganization']);

        if ($request->search) {
            $query->where('interviewer_title', 'like', "%{$request->search}%");
        }

        $interviews = $query->withCount('details')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/interview/Index', [
            'interviews' => $interviews,
            'filters' => $request->only(['search'])
        ]);
    }


    /**
     * Tampilkan Form Tambah Wawancara
     */
    public function create()
    {
        return Inertia::render('admin/interview/InterviewForm', [
            'companies' => Company::select('id', 'name')->orderBy('name')->get(),
            'organizations' => AcceptingOrganization::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Simpan Wawancara Baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'interviewer_title' => 'required|string|max:255',
            'company_id' => 'required|exists:companies,id',
            'accepting_organization_id' => 'required|exists:accepting_organizations,id',
            'type' => 'required|string',
            'group_chat_link' => 'nullable|string',
            'interview_announcement_date' => 'nullable|date',
            'description' => 'required|string',
            'interview_date' => 'required|date',
            'interview_registration_deadline' => 'nullable|date',
        ]);

        // Simpan tanpa file kyuujinhyou terlebih dahulu
        Interview::create($request->all());

        return redirect()->route('admin.interviews.index')
            ->with('success', 'Jadwal wawancara berhasil dibuat.');
    }
    /**
     * Tampilkan Form Edit
     */
    public function edit($id)
    {
        $interview = Interview::findOrFail($id);

        return Inertia::render('admin/interview/InterviewForm', [
            'interview' => $interview, // Props ini yang membedakan Edit atau Create
            'companies' => Company::select('id', 'name')->orderBy('name')->get(),
            'organizations' => AcceptingOrganization::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Update Data Wawancara
     */
    public function update(Request $request, $id)
    {
        $interview = Interview::findOrFail($id);

        $request->validate([
            'interviewer_title' => 'required|string|max:255',
            'company_id'        => 'required|exists:companies,id',
            'accepting_organization_id' => 'required|exists:accepting_organizations,id',
            'type'              => 'required|string',
            'group_chat_link'   => 'nullable|string',
            'interview_announcement_date' => 'nullable|date',
            'description'       => 'required|string',
            'interview_date'    => 'required|date',
            'interview_registration_deadline' => 'nullable|date',
            'date_fly_to_japan' => 'nullable|date',
            'group_chat_link'   => 'nullable|url',
        ]);

        // Update data teks saja
        $interview->update($request->all());

        return redirect()->route('admin.interviews.index')
            ->with('success', 'Jadwal wawancara ' . $interview->interviewer_title . ' berhasil diperbarui.');
    }

    /**
     * Hapus Wawancara & File Terkait
     */
    public function destroy($id)
    {
        $interview = Interview::findOrFail($id);

        // 1. Hapus berkas fisik di Yunerva jika ada
        if ($interview->kyuujinhyou_yunerva_uuid) {
            $this->yunerva->deleteFile($interview->kyuujinhyou_yunerva_uuid);
        }

        // 2. Hapus dari database (InterviewDetail akan terhapus otomatis jika menggunakan cascade)
        $interview->delete();

        return redirect()->route('admin.interviews.index')->with('success', 'Jadwal wawancara dihapus.');
    }

    /**
     * Menampilkan detail wawancara dan profil lengkap siswa yang terlibat
     * Digunakan oleh Admin/Sensei untuk menarik biodata
     */
    public function show($id)
    {
        $interview = Interview::with([
            'company',
            'acceptingOrganization',
            'details.user.student_profile.educations',
            'details.user.student_profile.experiences',
            'details.user.student_profile.families'
        ])->findOrFail($id);

        // TAMBAHKAN INI: Ambil daftar user dengan role student untuk fitur Assign
        // Anda bisa memfilter agar siswa yang sudah terdaftar tidak muncul lagi
        $alreadyAssignedIds = $interview->details->pluck('user_id');
        // Ganti baris 151
        $availableStudents = \App\Models\User::where('role', 'student') // Sesuaikan nama kolomnya, misal 'role' atau 'type'
            ->with('student_profile')
            ->whereNotIn('id', $alreadyAssignedIds)
            ->get();

        return Inertia::render('admin/interview/Show', [
            'interview' => $interview,
            'availableStudents' => $availableStudents // Kirim ke Frontend
        ]);
    }

    // Menambah siswa ke daftar wawancara (Assign)
    public function assignStudent(Request $request, $interviewId) {
        $request->validate(['user_id' => 'required|exists:users,id']);
        
        // Cek duplikasi agar tidak double assign
        $exists = InterviewDetail::where('interview_id', $interviewId)
            ->where('user_id', $request->user_id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['error' => 'Siswa sudah terdaftar.']);
        }

        // Hitung nomor urut terakhir
        $lastOrder = InterviewDetail::where('interview_id', $interviewId)->max('order_number') ?? 0;

        InterviewDetail::create([
            'interview_id' => $interviewId,
            'user_id' => $request->user_id,
            'order_number' => $lastOrder + 1, // Otomatis nomor selanjutnya
            'result' => 'waiting'
        ]);

        return back()->with('success', 'Siswa berhasil ditambahkan ke daftar.');
    }

    // Menghapus siswa dari daftar (Remove)
    public function removeStudent($detailId) {
        $detail = InterviewDetail::findOrFail($detailId);
        $detail->delete();
        
        return back()->with('success', 'Siswa dihapus dari daftar.');
    }

    public function batchReorder(Request $request, $id)
    {
        $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|exists:interview_details,id',
            'orders.*.order_number' => 'required|integer',
        ]);

        foreach ($request->orders as $order) {
            \App\Models\InterviewDetail::where('id', $order['id'])->update([
                'order_number' => $order['order_number']
            ]);
        }

        return back()->with('success', 'Urutan wawancara berhasil diperbarui.');
    }

    /**
     * Method khusus untuk upload/update Kyuujinhyou dari halaman Show
     */
    public function uploadKyuujinhyou(Request $request, $id)
    {
        $request->validate([
            'upload_ticket' => 'required|string',
        ]);

        $interview = Interview::findOrFail($id);
        
        // Kirim null sebagai parameter kedua agar access_type jadi 'public'
        $response = $this->yunerva->finalizeUpload($request->upload_ticket, null);

        if (isset($response['status']) && $response['status'] === 'success') {
            // Hapus file lama di cloud jika ada (Cleanup)
            if ($interview->kyuujinhyou_yunerva_uuid) {
                $this->yunerva->deleteFile($interview->kyuujinhyou_yunerva_uuid);
            }

            // Update database dengan UUID baru dari Yunerva
            $interview->update([
                'kyuujinhyou_yunerva_uuid' => $response['data']['uuid']
            ]);

            return redirect()->back()->with('success', 'Dokumen Kyuujinhyou berhasil diunggah secara publik.');
        }

        return back()->withErrors(['error' => 'Gagal memproses dokumen di storage cloud.']);
    }

    /**
     * Preview Kyuujinhyou: Ambil View URL (berlaku 15 detik)
     */
    public function previewKyuujinhyou(Request $request, $id)
    {
        $interview = Interview::findOrFail($id);

        if (!$interview->kyuujinhyou_yunerva_uuid) {
            return response()->json(['status' => 'error', 'message' => 'File tidak ditemukan'], 404);
        }

        // Panggil generate link dengan password null
        $response = $this->yunerva->generateViewLink(
            $interview->kyuujinhyou_yunerva_uuid,
            null
        );

        return response()->json($response);
    }

    public function storeReport(Request $request, $id)
    {
        $interview = Interview::findOrFail($id);
        $fieldName = $request->field_name;

        $response = $this->yunerva->finalizeUpload($request->upload_ticket);

        if ($response['status'] === 'success') {
            // Hapus file lama jika ada
            if ($interview->$fieldName) {
                $this->yunerva->deleteFile($interview->$fieldName);
            }

            $interview->update([$fieldName => $response['data']['uuid']]);
            return response()->json(['status' => 'success']);
        }
        return response()->json(['message' => 'Error'], 400);
    }

    public function previewReport(Request $request, $id)
    {
        // Cari data interview-nya
        $interview = \App\Models\Interview::findOrFail($id);
        
        // Gunakan service Yunerva untuk generate link (berlaku 15 detik)
        // Pastikan Anda sudah mengimport YunervaService di constructor
        $response = $this->yunerva->generateViewLink(
            $request->uuid,
            null // Biasanya file interview tidak pakai password per-siswa
        );

        return response()->json($response);
    }

    /**
     * Fitur Siswa: Mendaftarkan diri ke wawancara
     */
    public function apply(Request $request, $interviewId)
    {
        $user = Auth::user();
        
        // Cek apakah sudah mendaftar
        $exists = InterviewDetail::where('interview_id', $interviewId)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['error' => 'Anda sudah terdaftar di wawancara ini.']);
        }

        // Cek batas waktu pendaftaran
        $interview = Interview::findOrFail($interviewId);
        if ($interview->interview_registration_deadline < now()->toDateString()) {
            return back()->withErrors(['error' => 'Batas waktu pendaftaran sudah lewat.']);
        }

        InterviewDetail::create([
            'interview_id' => $interviewId,
            'user_id' => $user->id,
            'result' => 'waiting',
        ]);

        return redirect()->back()->with('success', 'Berhasil mendaftar wawancara.');
    }

    /**
     * Update hasil wawancara (Admin Only)
     */
    public function updateResult(Request $request, $detailId)
    {
        $request->validate([
            'result' => 'required|in:waiting,passed,failed,reserved',
            'remarks' => 'nullable|string'
        ]);

        $detail = InterviewDetail::findOrFail($detailId);
        $detail->update($request->only(['result', 'remarks']));

        return redirect()->back()->with('success', 'Hasil wawancara berhasil diperbarui.');
    }
}