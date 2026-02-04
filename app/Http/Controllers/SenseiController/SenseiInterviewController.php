<?php

namespace App\Http\Controllers\SenseiController;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Models\InterviewDetail;
use App\Models\Company;
use App\Models\AcceptingOrganization;
use App\Services\YunervaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Carbon;

class SenseiInterviewController extends Controller
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

        return Inertia::render('sensei/interview/Index', [
            'interviews' => $interviews,
            'filters' => $request->only(['search'])
        ]);
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

        return Inertia::render('sensei/interview/Show', [
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
}