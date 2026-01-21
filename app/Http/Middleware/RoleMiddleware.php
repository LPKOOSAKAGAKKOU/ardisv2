<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        // 1. Jika belum login, biarkan sistem auth bawaan yang menangani (redirect ke login)
        if (! $user) {
            return redirect()->route('login');
        }

        // 2. Jika role user tidak ada di dalam daftar role yang diizinkan untuk route ini
        if (! in_array($user->role, $roles)) {
            
            // Redirect cerdas berdasarkan role user itu sendiri
            return match ($user->role) {
                'admin'   => redirect()->route('admin.dashboard')->with('error', 'Anda tidak memiliki akses ke halaman tersebut.'),
                'sensei'  => redirect()->route('sensei.dashboard')->with('error', 'Anda tidak memiliki akses ke halaman tersebut.'),
                'student' => redirect()->route('student.dashboard')->with('error', 'Anda tidak memiliki akses ke halaman tersebut.'),
                default   => redirect('/')->with('error', 'Akses ditolak.'),
            };
        }

        return $next($request);
    }
}