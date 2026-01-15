<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Controllers\AdminController\StudentController;


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

        Route::get('dashboard', fn () =>
            Inertia::render('admin/dashboard')
        )->name('dashboard');

        // Route Resource untuk Manajemen Siswa
        // Menggunakan resource agar otomatis punya index, create, store, edit, update, destroy
        Route::resource('students', StudentController::class);

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
    ->name('student.')
    ->group(function () {

        Route::get('dashboard', fn () =>
            Inertia::render('student/dashboard')
        )->name('dashboard');

    });

require __DIR__.'/settings.php';
