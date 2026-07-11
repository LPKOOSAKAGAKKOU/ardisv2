<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // 1. Tambahkan pengecualian CSRF di sini
        $middleware->validateCsrfTokens(except: [
            'whatsapp/webhook', // Sesuaikan dengan path rute Anda
            'payment/webhook',
        ]);

        // TAMBAHKAN BARIS INI
        $middleware->redirectTo(
            guests: '/login',
            users: '/', // Paksa redirect ke rute '/' setelah login berhasil
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();