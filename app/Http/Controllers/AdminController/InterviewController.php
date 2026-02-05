<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Models\InterviewDetail;
use App\Models\Company;
use App\Models\AcceptingOrganization;
use App\Models\Province;   // <-- Pastikan Model di-import
use App\Models\JobSector;  // <-- Pastikan Model di-import
use App\Models\Major;      // <-- Pastikan Model di-import
use App\Services\YunervaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Carbon;

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
            'interview_date' => 'required|date',
            'description' => 'required|string',
        ]);

        $data = $request->all();

        if ($request->type === 'ginoujisshuu') {
            $baseDate = Carbon::parse($request->interview_date)->addMonth();

            // 1. Nomor Surat Otomatis
            $currentMonthCount = \App\Models\Interview::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count() + 1;
            $sequence = str_pad($currentMonthCount, 3, '0', STR_PAD_LEFT);
            $letterNumberWithSequence = $sequence . "/SPm/Ardisv2/OG/" . now()->format('m/Y');
            
            // 2. Detail pelatihan 1-34 (Tetap 2 bulan/8 minggu)
            $training1_34StartDate = ($baseDate->isWeekend()) ? $baseDate->next(Carbon::MONDAY) : $baseDate;
            $training1_34EndDate = $training1_34StartDate->copy()->addWeeks(8)->next(Carbon::FRIDAY);
            
            // Hitung jam 1-34 berdasarkan hari kerja murni (8 jam/hari)
            $training1_34Days = $training1_34StartDate->diffInDaysFiltered(function (Carbon $date) {
                return !$date->isWeekend();
            }, $training1_34EndDate->copy()->addDay());

            // --- FUNGSI HELPER YANG LEBIH AKURAT ---
            $addWorkDays = function($start, $targetDays) {
                $date = $start->copy();
                $actualCount = 1; // Hari pertama sudah dihitung sebagai 1 hari kerja
                
                while ($actualCount < $targetDays) {
                    $date->addDay();
                    if (!$date->isWeekend()) {
                        $actualCount++;
                    }
                }
                return $date;
            };

            // 1. TAHAP PERTAMA (PASTI 23 HARI KERJA)
            // Mulai Senin setelah 1-34 selesai
            $stage1Start = $training1_34EndDate->copy()->next(Carbon::MONDAY);
            $stage1End = $addWorkDays($stage1Start, 23); 

            // 2. TAHAP KEDUA (PASTI 5 HARI KERJA)
            // Mulai hari kerja berikutnya setelah Tahap 1 selesai
            $stage2Start = $stage1End->copy()->addDay();
            if ($stage2Start->isWeekend()) $stage2Start->next(Carbon::MONDAY);
            $stage2End = $addWorkDays($stage2Start, 5);

            // 3. TAHAP KETIGA (PASTI 7 HARI KERJA)
            // Mulai hari kerja berikutnya setelah Tahap 2 selesai
            $stage3Start = $stage2End->copy()->addDay();
            if ($stage3Start->isWeekend()) $stage3Start->next(Carbon::MONDAY);
            $stage3End = $addWorkDays($stage3Start, 7);

            // --- MERGE DATA ---
            $data = array_merge($data, [
                '1_34_training_start_date'           => $training1_34StartDate->format('Y-m-d'),
                '1_34_training_end_date'             => $training1_34EndDate->format('Y-m-d'),
                '1_34_training_duration_hours'       => (string)($training1_34Days * 8), 
                '1_34_training_item'                 => '本邦での職業に関する実技、知識、職業マナー、座学、専門用語等',

                '1_23_req_letter_number'             => $letterNumberWithSequence,

                '1_29_first_training_start_date'     => $stage1Start->format('Y-m-d'),
                '1_29_first_training_end_date'       => $stage1End->format('Y-m-d'),
                '1_29_first_training_duration_hours' => '184', // 23 hari * 8 jam
                '1_29_first_training_item'           => '日本語（読み書き、会話、文法、解釈、文字・語彙）',

                '1_29_second_training_start_date'    => $stage2Start->format('Y-m-d'),
                '1_29_second_training_end_date'      => $stage2End->format('Y-m-d'),
                '1_29_second_training_duration_hours'=> '40', // 5 hari * 8 jam
                '1_29_second_training_item'          => '日本での生活一般に関する知識（日本の歴史、文化、生活様式、職場ルール）',

                '1_29_third_training_start_date'     => $stage3Start->format('Y-m-d'),
                '1_29_third_training_end_date'       => $stage3End->format('Y-m-d'),
                '1_29_third_training_duration_hours' => '56', // 7 hari * 8 jam
                '1_29_third_training_item'           => '本邦での円滑な技能等の習得に資する知識（専門用語、使用する機械・器具等）',
            ]);
        }

        \App\Models\Interview::create($data);

        return redirect()->route('admin.interviews.index')
            ->with('success', 'Jadwal berhasil dibuat. Tanggal sudah dipastikan pas dengan jumlah jam kerja.');
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
            'description'       => 'required|string',
            'interview_date'    => 'required|date',
            'date_fly_to_japan' => 'nullable|date',
            'group_chat_link'   => 'nullable|url',
        ]);

        $data = $request->all();

        // Cek apakah Admin mengubah tanggal interview
        $isDateChanged = $request->interview_date !== $interview->interview_date;

        if ($isDateChanged && $request->type === 'ginoujisshuu') {
            $baseDate = \Carbon\Carbon::parse($request->interview_date)->addMonth();

            // --- FUNGSI HELPER UNTUK MENAMBAH HARI KERJA (SKIP WEEKEND) ---
            $addWorkDays = function($start, $days) {
                $date = $start->copy();
                $count = 1;
                while ($count < $days) {
                    $date->addDay();
                    if (!$date->isWeekend()) {
                        $count++;
                    }
                }
                return $date;
            };

            // 1. Hitung Ulang detail pelatihan 1-34
            $training1_34StartDate = ($baseDate->isWeekend()) ? $baseDate->next(\Carbon\Carbon::MONDAY) : $baseDate;
            $training1_34EndDate = $training1_34StartDate->copy()->addWeeks(8)->next(\Carbon\Carbon::FRIDAY);
            
            $training1_43TotalDays = $training1_34StartDate->diffInDaysFiltered(function (\Carbon\Carbon $date) {
                return !$date->isWeekend();
            }, $training1_34EndDate->copy()->addDay());

            // 2. Hitung Ulang detail pelatihan 1-29 (PASTI 23, 5, 7 HARI KERJA)
            
            // Tahap 1 (23 Hari)
            $stage1Start = $training1_34EndDate->copy()->next(\Carbon\Carbon::MONDAY);
            $stage1End   = $addWorkDays($stage1Start, 23);
            
            // Tahap 2 (5 Hari)
            $stage2Start = $stage1End->copy()->addDay();
            if ($stage2Start->isWeekend()) $stage2Start->next(\Carbon\Carbon::MONDAY);
            $stage2End   = $addWorkDays($stage2Start, 5);

            // Tahap 3 (7 Hari)
            $stage3Start = $stage2End->copy()->addDay();
            if ($stage3Start->isWeekend()) $stage3Start->next(\Carbon\Carbon::MONDAY);
            
            // DISINI FIX-NYA: PAKAI HELPER BIAR GAK CUMA 2 HARI KERJA
            $stage3End = $addWorkDays($stage3Start, 7); 

            $data = array_merge($data, [
                '1_34_training_start_date'           => $training1_34StartDate->format('Y-m-d'),
                '1_34_training_end_date'             => $training1_34EndDate->format('Y-m-d'),
                '1_34_training_duration_hours'       => (string)($training1_43TotalDays * 8),
                
                '1_29_first_training_start_date'     => $stage1Start->format('Y-m-d'),
                '1_29_first_training_end_date'       => $stage1End->format('Y-m-d'),
                '1_29_first_training_duration_hours' => '184', 
                
                '1_29_second_training_start_date'    => $stage2Start->format('Y-m-d'),
                '1_29_second_training_end_date'      => $stage2End->format('Y-m-d'),
                '1_29_second_training_duration_hours'=> '40', 
                
                '1_29_third_training_start_date'     => $stage3Start->format('Y-m-d'),
                '1_29_third_training_end_date'       => $stage3End->format('Y-m-d'),
                '1_29_third_training_duration_hours' => '56', 
            ]);
        }

        $interview->update($data);

        return redirect()->route('admin.interviews.index')
            ->with('success', 'Jadwal wawancara dan sinkronisasi periode pelatihan berhasil diperbarui.');
    }

    /**
     * Update parameter jadwal pelatihan secara manual dari modal Show
     */
    public function updateScheduleParams(Request $request, $id)
    {
        $interview = Interview::findOrFail($id);

        $validated = $request->validate([
            '1_23_req_letter_number'            => 'nullable|string|max:255',
            '1_34_training_start_date'          => 'nullable|date',
            '1_34_training_end_date'            => 'nullable|date',
            '1_34_training_duration_hours'      => 'nullable|string|max:255',
            '1_34_training_item'                => 'nullable|string',
            '1_29_first_training_start_date'    => 'nullable|date',
            '1_29_first_training_end_date'      => 'nullable|date',
            '1_29_first_training_duration_hours'=> 'nullable|string|max:255',
            '1_29_first_training_item'          => 'nullable|string',
            '1_29_second_training_start_date'   => 'nullable|date',
            '1_29_second_training_end_date'     => 'nullable|date',
            '1_29_second_training_duration_hours'=> 'nullable|string|max:255',
            '1_29_second_training_item'          => 'nullable|string',
            '1_29_third_training_start_date'    => 'nullable|date',
            '1_29_third_training_end_date'      => 'nullable|date',
            '1_29_third_training_duration_hours' => 'nullable|string|max:255',
            '1_29_third_training_item'           => 'nullable|string',
        ]);

        // Eksekusi Update
        $interview->update($validated);

        return redirect()->back()->with('success', 'Seluruh parameter dokumen OTIT berhasil diperbarui.');
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
        // 1. Ambil Data Interview & Relasi
        $interview = Interview::with([
            'company',
            'acceptingOrganization',
            'details.user.student_profile.educations', 
            'details.user.student_profile.experiences',
            'details.user.student_profile.families'
        ])->findOrFail($id);

        // 2. Ambil Siswa yang Tersedia (untuk fitur assign)
        $alreadyAssignedIds = $interview->details->pluck('user_id');
        
        $availableStudents = User::role('student') // Asumsi pakai Spatie, atau where('role', 'student')
            ->with('student_profile')
            ->whereNotIn('id', $alreadyAssignedIds)
            ->get();

        // 3. AMBIL DATA MASTER UNTUK DROPDOWN FORM (INI YANG BARU)
        // Data ini diperlukan agar dropdown di StudentForm (Modal) berfungsi
        $provinces = Province::select('id', 'name')->get(); // Sesuaikan nama kolom tabel Anda
        $jobSectors = JobSector::select('id', 'name', 'code')->get();
        $majors = Major::select('id', 'name')->get();

        // 4. Return ke Inertia
        return Inertia::render('admin/interview/Show', [
            'interview' => $interview,
            'availableStudents' => $availableStudents,
            
            // Kirim data master ke props frontend
            'provinces' => $provinces,
            'jobSectors' => $jobSectors,
            'majors' => $majors,
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