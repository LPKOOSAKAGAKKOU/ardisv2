<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompanyController extends Controller
{
    /**
     * Menampilkan daftar perusahaan dengan fitur pencarian.
     */
    public function index(Request $request)
    {
        $query = Company::query();

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('name_in_japanese', 'like', "%{$request->search}%")
                  ->orWhere('industry', 'like', "%{$request->search}%")
                  ->orWhere('prefecture', 'like', "%{$request->search}%");
        }

        return Inertia::render('admin/company/Index', [
            'companies' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Menampilkan form untuk menambah perusahaan baru.
     */
    public function create()
    {
        return Inertia::render('admin/company/CompanyForm');
    }

    /**
     * Menyimpan data perusahaan baru ke database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_in_japanese' => 'nullable|string|max:255',
            'industry' => 'required|string|max:255',
            'address' => 'nullable|string',
            'address_in_japanese' => 'nullable|string',
            'prefecture' => 'nullable|string|max:100',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
        ]);

        Company::create($validated);

        return redirect()->route('admin.companies.index')
            ->with('success', 'Perusahaan ' . $request->name . ' berhasil ditambahkan.');
    }

    /**
     * Menampilkan form edit perusahaan.
     */
    public function edit($id)
    {
        $company = Company::findOrFail($id);

        return Inertia::render('admin/company/CompanyForm', [
            'company' => $company
        ]);
    }

    /**
     * Memperbarui data perusahaan di database.
     */
    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        // Ambil semua rule dari store supaya sinkron
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_in_japanese' => 'nullable|string|max:255',
            'industry' => 'required|string|max:255',
            'address' => 'nullable|string',
            'address_in_japanese' => 'nullable|string',
            'prefecture' => 'nullable|string|max:100',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
        ]);

        // Pakai data yang sudah di-VALIDASI, jangan $request->all()
        $company->update($validated);

        return redirect()->route('admin.companies.index')
            ->with('success', 'Data perusahaan berhasil diperbarui.');
    }

    /**
     * Menghapus data perusahaan.
     */
    public function destroy($id)
    {
        $company = Company::findOrFail($id);
        
        // Cek apakah perusahaan memiliki jadwal wawancara aktif (optional)
        if ($company->interviews()->count() > 0) {
            return redirect()->back()->with('error', 'Tidak bisa menghapus perusahaan yang memiliki jadwal wawancara.');
        }

        $company->delete();

        return redirect()->route('admin.companies.index')
            ->with('success', 'Perusahaan berhasil dihapus.');
    }
}