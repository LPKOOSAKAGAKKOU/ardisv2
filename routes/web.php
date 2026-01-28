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
use App\Http\Controllers\StudentController\DashboardController;
use App\Http\Controllers\StudentController\ProfileController;
use App\Http\Controllers\StudentController\StudentInterviewController;
use App\Http\Controllers\GinouJisshuuDocumentController;
use App\Http\Controllers\TokuteiGinouDocumentController;



Route::get('/', function () {
    if (! Auth::check()) {
        return redirect()->route('login');
    }

    return match (Auth::user()->role) {
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
    Route::get('dashboard', fn () => Inertia::render('admin/dashboard'))->name('dashboard');

    // --- MANAJEMEN DOKUMEN SISWA ---
    Route::post('upload-request', [StudentDocumentController::class, 'requestUpload'])->name('documents.request');
    
    Route::prefix('students')->group(function () {
        Route::post('{id}/documents-store', [StudentDocumentController::class, 'storeDocument'])->name('documents.store');
        Route::post('{id}/preview-file', [StudentDocumentController::class, 'previewDocument'])->name('documents.preview');
    });

    // --- MANAJEMEN SISWA (Cukup satu baris ini) ---
    Route::resource('students', StudentController::class);

    // --- MANAJEMEN WAWANCARA (INTERVIEW) ---
    // Pastikan Route Resource diletakkan di bawah rute custom jika ada tumpang tindih URL
    Route::resource('interviews', InterviewController::class);
    
    // Rute Custom Wawancara
    Route::post('/interviews/{id}/apply', [InterviewController::class, 'apply'])->name('interviews.apply');
    Route::patch('/interview-details/{id}', [InterviewController::class, 'updateResult'])->name('interviews.updateResult');
    Route::post('/interviews/{id}/upload-kyuujinhyou', [InterviewController::class, 'uploadKyuujinhyou'])->name('interviews.upload-kyuujinhyou');
    Route::post('/interviews/{id}/preview-kyuujinhyou', [InterviewController::class, 'previewKyuujinhyou'])
        ->name('interviews.preview-kyuujinhyou');
    
    Route::post('/interviews/{id}/assign', [InterviewController::class, 'assignStudent']);
    Route::delete('/interview-details/{id}', [InterviewController::class, 'removeStudent']);
    Route::patch('/interviews/{id}/batch-reorder', [InterviewController::class, 'batchReorder'])->name('interviews.batchReorder');

    // --- MANAJEMEN ORGANISASI ---
    Route::resource('organizations', AcceptingOrganizationController::class);
    // --- MANAJEMEN PERUSAHAAN ---
    Route::resource('companies', CompanyController::class);

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

        Route::get('dashboard', fn () =>
            Inertia::render('sensei/dashboard')
        )->name('dashboard');

        // Sensei juga bisa akses StudentController yang sama
        Route::resource('students', StudentController::class);

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
        });
    });
require __DIR__.'/settings.php';
