<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\Recruitment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecruitmentsController extends Controller
{
    /**
     * Tampilkan daftar rekrutmen (Read)
     */
    public function index(Request $request)
    {
        $query = Recruitment::query();

        // Fitur Pencarian
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Mengurutkan berdasarkan kolom 'date' secara descending (terbaru ke terlama)
        $recruitments = $query->orderBy('date', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/recruitments/Index', [
            'recruitments' => $recruitments,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Simpan data rekrutmen baru (Create)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'type' => 'required|in:regular,job_matching',
            'is_active' => 'required|boolean',
        ]);

        Recruitment::create($validated);

        return back()->with('success', 'Data rekrutmen berhasil ditambahkan.');
    }

    /**
     * Update data rekrutmen (Update)
     */
    public function update(Request $request, $id)
    {
        $recruitment = Recruitment::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'type' => 'required|in:regular,job_matching',
            'is_active' => 'required|boolean',
        ]);

        $recruitment->update($validated);

        return back()->with('success', 'Data rekrutmen berhasil diperbarui.');
    }

    /**
     * Hapus data rekrutmen (Delete)
     */
    public function destroy($id)
    {
        $recruitment = Recruitment::findOrFail($id);

        $recruitment->delete();

        return back()->with('success', 'Data rekrutmen berhasil dihapus.');
    }
}