<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Controllers\CvGenerator;
use App\Http\Controllers\AdminController\StudentController;
use App\Http\Controllers\AdminController\StudentDocumentController;
use App\Http\Controllers\AdminController\InterviewController;
use App\Http\Controllers\AdminController\AcceptingOrganizationController;
use App\Http\Controllers\AdminController\CompanyController;
use App\Http\Controllers\AdminController\TeacherController;
use App\Http\Controllers\AdminController\AdminClassroomController;
use App\Http\Controllers\AdminController\RecruitmentsController;
use App\Http\Controllers\AdminController\AdminDashboardController;
use App\Http\Controllers\AdminController\DepartureController;
use App\Http\Controllers\AdminController\InvoiceController;
use App\Http\Controllers\SenseiController\SenseiDashboardController;
use App\Http\Controllers\SenseiController\ClassroomController;
use App\Http\Controllers\SenseiController\SenseiStudentController;
use App\Http\Controllers\SenseiController\SenseiInterviewController;
use App\Http\Controllers\StudentController\DashboardController;
use App\Http\Controllers\StudentController\ProfileController;
use App\Http\Controllers\StudentController\StudentInterviewController;
use App\Http\Controllers\GinouJisshuuDocumentController;
use App\Http\Controllers\TokuteiGinouDocumentController;
use App\Http\Controllers\AdminController\WhatsAppChatController;
use App\Http\Controllers\AdminController\PaymentController;
use App\Http\Controllers\AulaaWebhookController;


Route::post('/whatsapp/webhook', [WhatsAppChatController::class, 'handleWebhook'])->name('whatsapp.webhook');
Route::post('/payment/webhook', [AulaaWebhookController::class, 'handleWebhook'])->name('payment.webhook');

Route::get('/', function () {
    $user = Auth::user();

    if (! $user) {
        return redirect()->route('login');
    }

    // Gunakan pengecekan yang lebih aman
    $role = $user->role ?? 'login'; 

    return match ($role) {
        'admin'   => redirect()->route('admin.dashboard'),
        'sensei'  => redirect()->route('sensei.dashboard'),
        'student' => redirect()->route('student.dashboard'),
        default   => redirect()->route('login'),
    };
})->name('home');

Route::middleware(['auth'])->group(function () {
    // Route Global tanpa prefix 'admin' atau 'student'
    Route::get('generate-cv/{userId}/{interviewId?}', [CvGenerator::class, 'generate'])->name('cv.generate');
    

    // Route untuk Magang
    Route::get('/ginou/{type}/{userId?}', [GinouJisshuuDocumentController::class, 'generate'])
        ->name('student.documents.ginou.generate');

    // Route untuk Tokutei Ginou
    Route::get('/tokutei/{type}/{userId?}', [TokuteiGinouDocumentController::class, 'generate'])
        ->name('student.documents.tokutei.generate');
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::middleware([
    'auth',
    'verified',
    RoleMiddleware::class . ':admin',
])
->prefix('admin')
->name('admin.')
->group(function () {

    // Dashboard
    Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    // --- MANAJEMEN WHATSAPP CHAT (ADMIN DASHBOARD) ---
    Route::prefix('whatsapp')->name('whatsapp.')->group(function () {
        // API untuk Widget React (Sidebar & Chat Box)
        Route::get('/chats', [WhatsAppChatController::class, 'getChatList'])->name('list');
        Route::get('/chats/{chatId}/messages', [WhatsAppChatController::class, 'getMessages'])->name('messages');
        
        // Endpoint Kirim Pesan (Outbound)
        Route::post('/send', [WhatsAppChatController::class, 'sendMessage'])->name('send');
    });

    // --- MANAJEMEN DOKUMEN SISWA ---
    Route::post('upload-request', [StudentDocumentController::class, 'requestUpload'])->name('documents.request');
    
    Route::prefix('students')->group(function () {
        Route::post('{id}/documents-store', [StudentDocumentController::class, 'storeDocument'])->name('documents.store');
        Route::post('{id}/preview-file', [StudentDocumentController::class, 'previewDocument'])->name('documents.preview');
        // TAMBAHKAN INI:
        Route::delete('{id}/documents-delete', [StudentDocumentController::class, 'deleteDocument'])->name('documents.delete');
    });

    // --- MANAJEMEN SISWA (Cukup satu baris ini) ---
    Route::resource('students', StudentController::class);

    // --- MANAJEMEN WAWANCARA (INTERVIEW) ---
    // Pastikan Route Resource diletakkan di bawah rute custom jika ada tumpang tindih URL
    Route::resource('interviews', InterviewController::class);

    // route crud sensei
    Route::resource('teachers', TeacherController::class);
    
    // Rute Custom Wawancara
    Route::post('/interviews/{id}/apply', [InterviewController::class, 'apply'])->name('interviews.apply');
    Route::patch('/interview-details/{id}', [InterviewController::class, 'updateResult'])->name('interviews.updateResult');
    Route::post('/interviews/{id}/upload-kyuujinhyou', [InterviewController::class, 'uploadKyuujinhyou'])->name('interviews.upload-kyuujinhyou');
    Route::post('/interviews/{id}/preview-kyuujinhyou', [InterviewController::class, 'previewKyuujinhyou'])
        ->name('interviews.preview-kyuujinhyou');
    Route::patch('/interviews/{id}/update-schedule-params', [InterviewController::class, 'updateScheduleParams'])
        ->name('admin.interviews.update-schedule-params');

    // Route khusus download report massal Ginou Jisshuu
    Route::get('/interviews/{id}/report/{type}', [GinouJisshuuDocumentController::class, 'generateInterviewReport'])
        ->name('interviews.report.generate');
    Route::post('/interviews/{id}/store-report', [InterviewController::class, 'storeReport'])->name('interviews.store-report');
    Route::post('/interviews/{id}/preview-report', [InterviewController::class, 'previewReport'])
        ->name('interviews.preview-report');
    Route::delete('interviews/{id}/delete-report', [InterviewController::class, 'deleteReport'])
        ->name('interviews.delete-report');
    
    Route::post('/interviews/{id}/assign', [InterviewController::class, 'assignStudent']);
    Route::delete('/interview-details/{id}', [InterviewController::class, 'removeStudent']);
    Route::patch('/interviews/{id}/batch-reorder', [InterviewController::class, 'batchReorder'])->name('interviews.batchReorder');

    // --- MANAJEMEN ORGANISASI ---
    Route::resource('organizations', AcceptingOrganizationController::class);
    // --- MANAJEMEN PERUSAHAAN ---
    Route::resource('companies', CompanyController::class);

    // --- MANAJEMEN KEBERANGKATAN ---
    Route::post('/departures/{id}/billings', [DepartureController::class, 'saveBillings'])->name('departures.billings.save');
    Route::resource('departures', DepartureController::class);

    // --- MANAJEMEN PENAGIHAN (INVOICE) ---
    Route::get('/invoices/{id}/print', [InvoiceController::class, 'print'])->name('invoices.print');
    Route::patch('/invoices/{id}/mark-paid', [InvoiceController::class, 'markPaid'])->name('invoices.mark-paid');
    Route::patch('/invoices/{id}/mark-unpaid', [InvoiceController::class, 'markUnpaid'])->name('invoices.mark-unpaid');
    Route::resource('invoices', InvoiceController::class)->except(['edit', 'update']);

    // --- MANAJEMEN PEMBAYARAN ONLINE (AULAA.CO) ---
    Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
    Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');
    Route::post('/payments/manual', [PaymentController::class, 'markAsPaid'])->name('payments.manual');
    Route::post('/payments/{id}/check', [PaymentController::class, 'checkStatus'])->name('payments.check');
    Route::post('/payments/{id}/cancel', [PaymentController::class, 'cancel'])->name('payments.cancel');

    // Resource Classrooms
    Route::resource('classrooms', AdminClassroomController::class);

    // 2. RUTE KHUSUS untuk Manajemen Siswa di dalam Kelas
    Route::post('classrooms/{classroom}/students', [AdminClassroomController::class, 'addStudent'])->name('classrooms.add-student');
    Route::patch('classrooms/{classroom}/students/{student}', [AdminClassroomController::class, 'removeStudent'])->name('classrooms.remove-student');

    // 3. RUTE KHUSUS untuk Data Nilai (GradesSection)
    Route::get('classrooms/{classroom}/grades-data', [AdminClassroomController::class, 'getGradesData'])->name('classrooms.grades-data');
    
    // 4. RUTE KHUSUS untuk Data Absensi (AttendanceSection)
    Route::get('classrooms/{classroom}/attendance-data', [AdminClassroomController::class, 'getAttendanceData'])->name('classrooms.attendance-data');

    Route::resource('recruitments', RecruitmentsController::class);
});

/*
|--------------------------------------------------------------------------
| Sensei Routes
|--------------------------------------------------------------------------
*/
Route::middleware([
        'auth',
        'verified',
        RoleMiddleware::class . ':sensei',
    ])
    ->prefix('sensei')
    ->name('sensei.')
    ->group(function () {

        // --- DASHBOARD ---
        Route::get('dashboard', [SenseiDashboardController::class, 'index'])->name('dashboard');

            // --- MANAJEMEN WHATSAPP CHAT (ADMIN DASHBOARD) ---
        Route::prefix('whatsapp')->name('whatsapp.')->group(function () {
            // API untuk Widget React (Sidebar & Chat Box)
            Route::get('/chats', [WhatsAppChatController::class, 'getChatList'])->name('list');
            Route::get('/chats/{chatId}/messages', [WhatsAppChatController::class, 'getMessages'])->name('messages');
            
            // Endpoint Kirim Pesan (Outbound)
            Route::post('/send', [WhatsAppChatController::class, 'sendMessage'])->name('send');
        });

        // --- MANAJEMEN DOKUMEN SISWA ---
        Route::post('upload-request', [StudentDocumentController::class, 'requestUpload'])->name('documents.request');
        
        Route::prefix('students')->group(function () {
            Route::post('{id}/documents-store', [StudentDocumentController::class, 'storeDocument'])->name('documents.store');
            Route::post('{id}/preview-file', [StudentDocumentController::class, 'previewDocument'])->name('documents.preview');
        });

        // --- MANAJEMEN SISWA (Cukup satu baris ini) ---
        Route::resource('students', SenseiStudentController::class);

        // --- MANAJEMEN KELAS (CORE SENSEI) ---
        
        // 1. CRUD Kelas (Create, Index, Show, etc)
        // Ini menghandle function store() untuk membuat kelas baru
        Route::resource('classrooms', ClassroomController::class);

        // 2. Manage Siswa di dalam Kelas
        Route::post('/classrooms/{id}/add-student', [ClassroomController::class, 'addStudent'])
            ->name('classrooms.add-student');

        Route::post('/classrooms/{id}/students/{studentId}/remove', [ClassroomController::class, 'removeStudent'])
            ->name('classrooms.remove-student');

        // 3. Absensi (Attendance)
        // Manual / Batch Input
        Route::post('/classrooms/{id}/attendance', [ClassroomController::class, 'storeAttendance'])
            ->name('classrooms.attendance.store');
        
        // QR Code Scan (Single Input)
        Route::post('/classrooms/{id}/attendance/qr', [ClassroomController::class, 'storeAttendanceQR'])
            ->name('classrooms.attendance.qr');

        // 4. Penilaian (Grades)
        // Input Nilai
        Route::post('/classrooms/{id}/grades', [ClassroomController::class, 'storeGrade'])
            ->name('classrooms.grades.store');
        
        // Hapus Nilai
        Route::delete('/classrooms/{id}/grades/{gradeId}', [ClassroomController::class, 'destroyGrade'])
            ->name('classrooms.grades.destroy');

        Route::get('/classrooms/{id}/attendance/data', [ClassroomController::class, 'getAttendanceData'])
            ->name('classrooms.attendance.data');

        // Grades
        Route::get('/classrooms/{id}/grades/data', [ClassroomController::class, 'getGradesData'])->name('classrooms.grades.data');
        Route::post('/classrooms/{id}/grades/batch', [ClassroomController::class, 'storeBatchGrades'])->name('classrooms.grades.batch'); // NEW
        Route::put('/classrooms/{id}/grades/{gradeId}', [ClassroomController::class, 'updateGrade'])->name('classrooms.grades.update'); // NEW

        // --- MANAJEMEN WAWANCARA (SENSEI) ---
        // PENTING: Harus dibungkus Route::controller agar 'index', 'show', dll terbaca
        Route::controller(App\Http\Controllers\SenseiController\SenseiInterviewController::class)->group(function () {
            
            // List & Detail
            Route::get('/interviews', 'index')->name('interviews.index');
            Route::get('/interviews/{id}', 'show')->name('interviews.show');
            
            // Assign & Remove Siswa
            Route::post('/interviews/{id}/assign', 'assignStudent')->name('interviews.assign');
            Route::delete('/interviews/details/{detailId}', 'removeStudent')->name('interviews.remove-student');
            
            // Reorder (Urutan Wawancara)
            Route::patch('/interviews/{id}/batch-reorder', 'batchReorder')->name('interviews.batch-reorder');
            
            // Preview Kyuujinhyou
            Route::post('/interviews/{id}/preview-kyuujinhyou', 'previewKyuujinhyou')->name('interviews.preview-kyuujinhyou');
            
        });

});

/*
|--------------------------------------------------------------------------
| Student Routes
|--------------------------------------------------------------------------
*/
Route::middleware([
        'auth',
        'verified',
        RoleMiddleware::class . ':student',
    ])
    ->prefix('student')
    ->name('student.') // Prefix nama rute: student.
    ->group(function () {

        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('interviews', [StudentInterviewController::class, 'index'])->name('interviews.index');
        // Rute Baru
        Route::post('interviews/{id}/apply', [StudentInterviewController::class, 'apply'])->name('interviews.apply');
        Route::get('interviews/{id}/preview', [StudentInterviewController::class, 'previewKyuujinhyou'])->name('interviews.preview-kyuujinhyou');
        Route::get('interviews/{id}/participants', [StudentInterviewController::class, 'participants'])->name('interviews.participants');
        Route::post('interviews/{id}/cancel', [StudentInterviewController::class, 'cancel'])->name('interviews.cancel');

        // Rute Biodata
        Route::get('profile', [ProfileController::class, 'showForm'])->name('profile.edit');
        Route::post('profile', [ProfileController::class, 'storeOrUpdate'])->name('profile.save');

        // --- MANAJEMEN DOKUMEN SISWA (Disesuaikan dengan pemanggilan di React) ---
        
        // Ganti name agar sinkron dengan route('student.profile.upload-request')
        Route::post('upload-request', [StudentDocumentController::class, 'requestUpload'])
            ->name('profile.upload-request'); 
        
        Route::prefix('profile-documents')->group(function () {
            // Ganti name agar sinkron dengan route('student.profile.documents-store')
            Route::post('{id}/store', [StudentDocumentController::class, 'storeDocument'])
                ->name('profile.documents-store');

            // Ganti name agar sinkron dengan route('student.profile.preview-file')
            Route::post('{id}/preview', [StudentDocumentController::class, 'previewDocument'])
                ->name('profile.preview-file');
            // TAMBAHKAN RUTE INI:
            Route::delete('{id}/delete', [StudentDocumentController::class, 'deleteDocument'])
                ->name('profile.documents-delete');
        });
    });
require __DIR__.'/settings.php';
